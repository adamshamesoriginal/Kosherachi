# KosherGo 🍽️

**"כל מה שאתה רואה — כשר ומאומת." / "Everything you see — kosher and verified."**

A mobile-first food delivery app MVP for the Israeli market. Users pick their
kashrut level and area up front and only ever see restaurants that match —
each with its kashrut certificate (certifying body, certificate number,
expiry date, and a photo of the teudat kashrut) displayed on the spot.

An onboarding flow, a filtered restaurant list, a restaurant/menu page,
cart, checkout, and order tracking, plus a restaurant-owner dashboard for
managing orders and menus — all backed by a real database via API routes.
No payments or live courier integrations yet.

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS on the frontend. The
backend is a set of Next.js API routes (`src/app/api/*`) backed by
**Prisma + SQLite** (`prisma/schema.prisma`, `prisma/dev.db`). Kashrut
preferences and the shopping cart are UI-only state, kept in React context
and `localStorage`; restaurants, menus, reviews, users, and orders live in
the database.

Registration is phone-number + OTP, no password: `/auth` collects a phone
number, texts (in principle — see below) a 6-digit code, and on success
issues an httpOnly session cookie (`src/lib/auth.ts`). Every API route that
touches personal data (`/api/orders*`) reads the logged-in user from that
cookie server-side — the client never gets to claim an identity by passing
an id in the request.

**SMS is sent via Twilio** (`src/lib/sms.ts`, plain REST call — no SDK
dependency) when credentials are configured. Set these env vars to turn it
on:

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+15551234567        # a number you bought in the Twilio console
# — or, if you're using a Messaging Service instead of a single number —
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**No Twilio account is connected in this environment** — I don't have (and
can't create) one on your behalf, so this hasn't been tested against a real
send. Without those env vars set, `SMS_DEV_MODE` stays on: `/api/auth/request-otp`
logs the code server-side and echoes it back to the login screen instead,
clearly labeled as demo mode — this is what lets the whole flow work today
without an account. Once you add real credentials (as local env vars, or as
secrets in whatever platform you deploy to — never committed to git),
`SMS_DEV_MODE` turns off automatically and codes go out as real texts. A
couple of things to know before flipping it on for real users:

- Twilio trial accounts can only text phone numbers you've manually
  verified in the console — good enough to test with your own phone, not
  for real signups until you upgrade to a paid account.
- If `sendOtpSms` throws (bad credentials, no balance, unverified number in
  trial mode, etc.), `/api/auth/request-otp` returns a 502 and does **not**
  create an OTP record — so a failed send doesn't burn the user's resend
  cooldown on a code they never got.

**Google and Apple sign-in** are also wired up (`src/lib/google-oauth.ts`,
`src/lib/apple-oauth.ts`), as alternatives to phone+OTP, not replacements —
all three log into the same `User`/`Session` system, so `phone` is now
optional and `email`/`googleId`/`appleId` exist alongside it. Hand-rolled
OAuth 2.0 / OpenID Connect (no NextAuth/Auth.js), using
[`jose`](https://github.com/panva/jose) for real JWKS-based `id_token`
signature verification rather than just decoding the payload. Turn Google on
with:

```
GOOGLE_CLIENT_ID=xxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
```

(from a Google Cloud Console OAuth 2.0 Client ID — Web application type —
with `{your origin}/api/auth/google/callback` added as an authorized
redirect URI, e.g. `https://koshergo.example.com/api/auth/google/callback`).

Apple is the same idea but with meaningfully more setup — it needs a paid
Apple Developer Program membership ($99/yr), a registered Services ID (used
as the client ID), a Sign in with Apple key (private key + Key ID) from
that account's Keys section, your Team ID, and the redirect domain verified
with Apple:

```
APPLE_CLIENT_ID=com.yourcompany.koshergo.web   # the Services ID
APPLE_TEAM_ID=XXXXXXXXXX
APPLE_KEY_ID=XXXXXXXXXX
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIGTAgEAMBMGByq...\n-----END PRIVATE KEY-----"
```

(`APPLE_PRIVATE_KEY` is the `.p8` file's contents with real newlines
replaced by literal `\n`, since most env var systems don't accept multi-line
values — the code un-escapes them before use.) Unlike Twilio's static API
key, Apple's `client_secret` is a JWT the server signs itself per request
using that private key (ES256) — implemented and unit-tested against a
throwaway key pair, since there's no Apple account in this environment to
test against the real endpoint.

Each provider only appears as a button on `/auth` when
`GET /api/auth/providers` reports it configured — no dead buttons pointing
at a provider that isn't set up. Same transparency principle as SMS: **no
Google or Apple app is registered in this environment**, so neither has
been exercised end to end against the real provider (Google's real
`accounts.google.com` consent screen or Apple's real sign-in). What's been
verified instead: the authorize-URL construction and CSRF state cookie
(inspected directly), the not-configured redirect, a live call to Google's
real token endpoint that correctly gets rejected for a fake `client_id`
(exercises the whole request → parse-failure → clean-redirect path), and
the Apple JWT signing round-tripping through `jose`'s own verifier with a
generated test key.

## Getting started

```bash
npm install          # also runs `prisma generate` via postinstall
npm run db:push       # create/sync the SQLite schema
npm run db:seed       # populate demo restaurants, menus, and reviews
npm run dev
```

Open http://localhost:3000.

The SQLite file lives at `prisma/dev.db` and is gitignored — every clone
needs `db:push` + `db:seed` once before the app has data. Seeding also
prints a demo restaurant-owner login (`0501112222`, owns all 6 seeded
restaurants) — log in with it at `/auth` and visit `/dashboard` to manage
menus and orders.

## App flow

`/` (splash) → `/auth` (phone number → OTP, only if not already logged in)
→ `/onboarding` (area, kashrut level, meat/dairy/parve) → `/home` (filtered
restaurant list + search) → `/restaurant/[id]` (menu, kashrut certificate
tab, reviews) → `/cart` → `/checkout` (requires login; redirects to
`/auth?next=/checkout` otherwise) → `/order/[id]` (live status tracker,
polling the API). `/more` shows the logged-in phone number + logout, and
links to the legal pages below plus, depending on the account, `/dashboard`
and/or `/admin`. Browsing restaurants doesn't require login — only placing
an order, viewing order history, or applying as a partner do.

**Becoming a restaurant owner** is a full loop now, not just a seed-script
assignment:

1. A logged-in user applies at `/partner` (business name, business number,
   area — their already-verified phone is reused as the contact). `/partner`
   also lists that user's own past applications with their status.
2. An admin (see below) reviews it at `/admin` and approves or rejects.
   Approving creates a real `Restaurant` owned by the applicant —
   **unpublished**, with placeholder images/defaults, since none of the real
   details (address, menu, kashrut certificate) exist yet.
3. The new owner opens `/dashboard/[id]` → **פרטי העסק** to fill in name,
   address, cuisine, food types (meat/dairy/parve), delivery settings, and
   kashrut certificate info, and → **תפריט** to add at least one menu item.
4. Once name, address, at least one food type, and at least one menu item
   are set, the owner can flip **פרסום** (publish) in settings — the
   restaurant then appears in customer search. The kashrut certificate's
   "verified" checkmark stays off until an admin manually confirms it at
   `/admin` (owners can't self-verify their own certificate — that would
   defeat the point).

**Admin access** is gated by phone number, not a separate role system:
`ADMIN_PHONES` (comma-separated) in env vars, or the demo default
`0501110000` (printed by the seed script) if unset. `/admin` has two tabs:
approve/reject partner applications, and toggle each restaurant's kashrut
`certificateVerified` flag after reviewing it.

Restaurant owners get `/dashboard` (redirects straight into the one owned
restaurant, or lists them if there's more than one) → `/dashboard/[id]`
with three tabs: **הזמנות** (incoming orders, each with a button to advance
it to the next status — placed → confirmed → preparing → out for delivery
→ delivered; this is what actually drives the customer's tracking page,
there's no more time-based auto-simulation), **תפריט** (add menu items,
edit existing ones, toggle an item unavailable so customers stop seeing it
without deleting its order history), and **פרטי העסק** (name, address,
cuisine, food types, delivery fee/minimum/time window, self-delivery
toggle, kashrut certificate fields, and the publish toggle described
above).

## API routes

| Route | Purpose |
|---|---|
| `POST /api/auth/request-otp` | Send (log, in dev mode) a 6-digit code to a phone number; rate-limited to one per 30s per number |
| `POST /api/auth/verify-otp` | Check the code (max 5 attempts, 5 min expiry); creates the user on first login and sets the session cookie |
| `GET /api/auth/me` | Current logged-in user from the session cookie, or `null` |
| `POST /api/auth/logout` | Deletes the session and clears the cookie |
| `GET /api/auth/providers` | `{ google, apple }` — which OAuth buttons `/auth` should render |
| `GET /api/auth/google/start`, `GET /api/auth/google/callback` | Redirects to Google's consent screen; handles the return, verifies the `id_token`, signs in |
| `GET /api/auth/apple/start`, `POST /api/auth/apple/callback` | Same for Apple — callback is POST because Apple's `form_post` response mode is required when requesting name/email |
| `GET /api/restaurants` | List **published** restaurants; filters via `area`, `kashrut` (csv), `foodType` (csv), `q` |
| `GET /api/restaurants/[id]` | Single restaurant with menu + reviews; 404 if unpublished |
| `POST /api/orders` | Create an order for the logged-in user (401 otherwise); server re-prices items from the DB (never trusts client prices) and enforces the restaurant's minimum order |
| `GET /api/orders` | The logged-in user's order history |
| `GET /api/orders/[id]` | Single order, restricted to its owner (403 for anyone else); status is the real, restaurant-set value — the client polls to reflect updates the restaurant makes |
| `GET/POST /api/partner-applications` | The logged-in user's own applications / submit a new one |
| `GET /api/dashboard/restaurants` | Restaurants owned by the logged-in user (published or not) |
| `GET/PATCH /api/dashboard/restaurants/[id]` | Full restaurant detail (incl. unavailable menu items) / update profile, delivery, kashrut, and `published` — 403 if you're not the owner. Publishing is rejected server-side unless name, address, ≥1 food type, and ≥1 menu item are set |
| `POST /api/dashboard/restaurants/[id]/menu-items` | Add a menu item |
| `PATCH /api/dashboard/menu-items/[id]` | Edit a menu item, incl. toggling `available` (items are never hard-deleted, since past orders reference them) |
| `GET /api/dashboard/orders?restaurantId=` | Orders for one owned restaurant |
| `PATCH /api/dashboard/orders/[id]` | Advance an order's status one step forward (rejects skipping steps or going backward) |
| `GET /api/admin/partner-applications` | All applications, any status — admin only |
| `POST /api/admin/partner-applications/[id]/approve` | Creates the unpublished `Restaurant` owned by the applicant, marks the application approved |
| `POST /api/admin/partner-applications/[id]/reject` | Marks the application rejected, optional `reviewNote` |
| `GET /api/admin/restaurants` | All restaurants with owner phone + kashrut cert summary — admin only |
| `POST /api/admin/restaurants/[id]/verify-kashrut` | Sets `certificateVerified`; the only way it can become `true` — owners can't self-verify |

## Israeli legal/compliance groundwork

Because this product's core promise is kashrut trust, the legal pages under
`/legal` are written to reflect the relevant Israeli law rather than generic
boilerplate:

- **`/legal/kashrut`** — Kashrut Fraud Prevention Law (חוק איסור הונאה
  בכשרות, התשמ״ג-1983) and the 2023 kashrut reform allowing licensed private
  kashrut bodies. States clearly that KosherGo is not a supervising body —
  certificate info is displayed as supplied by each business.
- **`/legal/privacy`** — Privacy Protection Law (חוק הגנת הפרטיות,
  התשמ״א-1981), Amendment 13, and the 2017 Data Security Regulations.
- **`/legal/terms`** — general terms, food-safety/allergen responsibility
  resting with the business, governing law.
- **`/legal/consumer`** — Consumer Protection Law (חוק הגנת הצרכן) and the
  Distance Transaction Cancellation Regulations, including the perishable-food
  exemption from the standard 14-day cancellation right.
- **`/legal/accessibility`** — accessibility statement under the Equal
  Rights for Persons with Disabilities Law, honestly scoped to "this is an
  MVP, a full audit is still required before public launch."

**None of this is a substitute for review by an Israeli lawyer** before
real users, real restaurants, or real payments are involved — treat it as a
structured starting point that names the right statutes, not a compliance
sign-off.

## What's mocked / what's next for a real MVP

- **Database**: SQLite is great for local dev and this demo, but its
  single-file model doesn't survive serverless/multi-instance deployment
  (e.g. Vercel). For production, point `datasource db` in
  `prisma/schema.prisma` at a hosted Postgres instance (Vercel Postgres,
  Neon, Supabase) — the rest of the app (routes, serializers) doesn't change.
- **SMS delivery**: Twilio integration is implemented (see the Stack section
  above) but untested against a real account — there isn't one connected in
  this environment. Add credentials and send yourself a code before trusting
  it with real users.
- **Google/Apple sign-in**: implemented (see the Stack section above) but
  untested against real provider infrastructure — there's no Google Cloud
  or Apple Developer app registered in this environment. Register both,
  add credentials, and sign in yourself before trusting it with real users.
- **Auth hardening**: OTPs are stored in plain text in `OtpCode` (fine for a
  short-lived 6-digit code, but hash them for defense in depth).
- **Admin gating**: `/admin` is phone-allowlist gated (`ADMIN_PHONES`), not
  a real role/permission system — fine for one or two trusted people
  reviewing applications by hand, not for a larger internal team.
- **Payments**: the checkout form is a visual mock — no card data is
  transmitted or stored. A production build needs a licensed Israeli
  payment processor (PCI DSS compliant).
- **Delivery**: order status is set manually by the restaurant via the
  dashboard, not fed by real courier GPS/tracking data. A live courier
  integration would update status automatically instead of by button click.
- **Kashrut verification**: the admin's "verified" toggle at `/admin` is a
  self-attested checkbox, not backed by an actual rabbinate-record lookup or
  document review workflow — that integration doesn't exist yet, plus
  there's no expiry-date reminder system. Certificate photo upload also
  isn't wired into the dashboard yet (text fields only; new restaurants get
  a placeholder certificate image at approval time).
- **Images**: menu/restaurant photos are generated locally as inline SVG
  placeholders (`src/lib/placeholder.ts`) so the app has zero external
  image dependencies — swap in real photos per business at onboarding.
