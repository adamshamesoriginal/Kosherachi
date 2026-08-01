import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fetchTransactionStatus, parseWebhookPayload } from "@/lib/meshulam";

/**
 * Meshulam's asynchronous payment confirmation. Deliberately does NOT trust
 * the request body's claimed status (its exact shape and signature scheme
 * aren't confirmed — see src/lib/meshulam.ts). The body is only used to
 * find which order this is about; the actual paid/unpaid determination
 * comes from re-querying Meshulam directly with our own credentials.
 *
 * Always returns 200 once the order is resolved to a final state (even if
 * unpaid) so the provider doesn't endlessly retry a webhook that isn't
 * going to change; a real lookup failure (network/API error) returns 500 so
 * a retry is worth it; an order that can't be found at all returns 404,
 * since retrying won't fix that.
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      body = await request.json();
    } else {
      const form = await request.formData();
      body = Object.fromEntries(form.entries());
    }
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const parsed = parseWebhookPayload(body);
  if (!parsed) {
    return NextResponse.json({ error: "Missing transaction id" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { paymentTransactionId: parsed.transactionId },
  });
  if (!order) {
    return NextResponse.json({ error: "Unknown transaction" }, { status: 404 });
  }

  // Idempotent: webhooks can and do arrive more than once.
  if (order.paymentStatus === "paid") {
    return NextResponse.json({ ok: true, alreadyProcessed: true });
  }

  try {
    const status = await fetchTransactionStatus(parsed.transactionId);
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: status.paid ? "paid" : "failed" },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[payments:meshulam] webhook status re-check failed", err);
    return NextResponse.json({ error: "Status check failed" }, { status: 500 });
  }
}
