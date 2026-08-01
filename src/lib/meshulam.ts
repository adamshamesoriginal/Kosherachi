/**
 * Meshulam (rebranded "Grow Payments") hosted-payment-page integration.
 *
 * IMPORTANT — the request/response field names below are best-effort, not
 * verified against Meshulam's live API reference. Every attempt to fetch
 * their docs (grow-il.readme.io, doc.meshulam.co.il, and third-party
 * integration guides) was blocked by bot protection. What IS confirmed via
 * search:
 *   - Base URLs: https://sandbox.meshulam.co.il (test) and
 *     https://secure.meshulam.co.il (production), under /api/light/server/1.0/
 *   - Auth: userId + pageCode, issued per business during onboarding
 *   - createPaymentProcess is the endpoint that creates a hosted payment page
 *   - All calls must be server-to-server — their API blocks browser-origin calls
 *
 * Because the exact webhook payload shape and signature mechanism couldn't
 * be confirmed either, the webhook handler (src/app/api/payments/meshulam/
 * webhook/route.ts) does NOT trust the webhook body's claimed status. It
 * only uses the webhook as a trigger to re-check payment status via
 * fetchTransactionStatus() below — an authenticated server-to-server call
 * using our own credentials. That's the actual security boundary: even a
 * forged webhook POST can't mark an order paid, since the real state change
 * only happens after Meshulam itself confirms it back to us directly.
 *
 * Before going live: paste the createPaymentProcess and status/webhook
 * reference pages into the assistant to correct the field names in
 * `createPaymentPage`, `fetchTransactionStatus`, and `parseWebhookPayload`
 * below — everything else in the checkout/webhook flow is provider-agnostic
 * and won't need to change.
 */

const MESHULAM_USER_ID = process.env.MESHULAM_USER_ID;
const MESHULAM_PAGE_CODE = process.env.MESHULAM_PAGE_CODE;
const MESHULAM_API_KEY = process.env.MESHULAM_API_KEY; // some Grow endpoints require this alongside userId/pageCode

export const MESHULAM_CONFIGURED = !!(MESHULAM_USER_ID && MESHULAM_PAGE_CODE);

// Defaults to sandbox so a missing/mistaken env var can never accidentally
// take a real payment.
const MESHULAM_ENV = process.env.MESHULAM_ENV === "production" ? "production" : "sandbox";
const BASE_URL =
  MESHULAM_ENV === "production"
    ? "https://secure.meshulam.co.il/api/light/server/1.0"
    : "https://sandbox.meshulam.co.il/api/light/server/1.0";

export interface CreatePaymentPageParams {
  orderId: string;
  amountIls: number;
  description: string;
  customerName: string;
  customerPhone: string;
  successUrl: string;
  cancelUrl: string;
  webhookUrl: string;
}

export interface CreatePaymentPageResult {
  transactionId: string;
  paymentUrl: string;
}

export async function createPaymentPage(
  params: CreatePaymentPageParams
): Promise<CreatePaymentPageResult> {
  if (!MESHULAM_CONFIGURED) {
    throw new Error("Meshulam is not configured");
  }

  const res = await fetch(`${BASE_URL}/createPaymentProcess`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: MESHULAM_USER_ID,
      pageCode: MESHULAM_PAGE_CODE,
      apiKey: MESHULAM_API_KEY,
      sum: params.amountIls,
      description: params.description,
      fullName: params.customerName,
      phone: params.customerPhone,
      successUrl: params.successUrl,
      cancelUrl: params.cancelUrl,
      callbackUrl: params.webhookUrl,
      paymentsNum: 1,
      currency: "ILS",
      // Best-effort pass-through for our own order id — not load-bearing;
      // matching happens via the transactionId we store ourselves below.
      cField1: params.orderId,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Meshulam createPaymentProcess failed: ${res.status} ${body}`);
  }

  // TODO(verify): confirm the real response shape — this assumes something
  // like { status: 1, data: { processId, url } }.
  const data = await res.json();
  const status = data?.status;
  const processId = data?.data?.processId ?? data?.data?.authCode ?? data?.data?.processToken;
  const url = data?.data?.url ?? data?.data?.paymentUrl;

  if (status !== 1 || !processId || !url) {
    throw new Error(
      `Meshulam createPaymentProcess returned an unexpected shape: ${JSON.stringify(data)}`
    );
  }

  return { transactionId: String(processId), paymentUrl: String(url) };
}

export interface TransactionStatus {
  paid: boolean;
  amountIls?: number;
}

/**
 * Re-checks payment status directly against Meshulam using our own
 * authenticated credentials — this is the actual source of truth the
 * webhook handler applies, not the webhook payload itself.
 */
export async function fetchTransactionStatus(transactionId: string): Promise<TransactionStatus> {
  if (!MESHULAM_CONFIGURED) {
    throw new Error("Meshulam is not configured");
  }

  // TODO(verify): confirm the real status-check endpoint path and response
  // shape. "getProcessDetails" is a placeholder matching createPaymentProcess's
  // naming convention, not a confirmed endpoint name.
  const res = await fetch(`${BASE_URL}/getProcessDetails`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: MESHULAM_USER_ID,
      pageCode: MESHULAM_PAGE_CODE,
      apiKey: MESHULAM_API_KEY,
      processId: transactionId,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Meshulam status check failed: ${res.status} ${body}`);
  }

  const data = await res.json();
  const paid =
    data?.status === 1 &&
    (data?.data?.transactionStatus === "approved" || data?.data?.paid === true);
  return { paid, amountIls: data?.data?.sum };
}

export interface WebhookPayload {
  transactionId: string;
}

/** Extracts just enough to know which order to re-verify — never trusts a status claim in the body itself. */
export function parseWebhookPayload(body: Record<string, unknown>): WebhookPayload | null {
  // TODO(verify): confirm the real webhook field name for the transaction id.
  const transactionId = body.processId ?? body.transactionId ?? body.authCode ?? body.cField1;
  if (!transactionId) return null;
  return { transactionId: String(transactionId) };
}
