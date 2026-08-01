# KosherGo 🍽️

**"כל מה שאתה רואה — כשר ומאומת." / "Everything you see — kosher and verified."**

A mobile-first food delivery app MVP for the Israeli market. Users pick their
kashrut level and area up front and only ever see restaurants that match —
each with its kashrut certificate (certifying body, certificate number,
expiry date, and a photo of the teudat kashrut) displayed on the spot.

An onboarding flow, a filtered restaurant list, a restaurant/menu page,
cart, checkout, and order tracking, all backed by a real database via API
routes — no payments or live restaurant integrations yet.

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

**No real SMS provider is wired up** (no Twilio account/keys in this
environment). `src/lib/sms.ts` logs the OTP server-side and, only while
`SMS_DEV_MODE` is on (i.e. no `SMS_PROVIDER_API_KEY` env var is set), the
`/api/auth/request-otp` response includes the code so the login screen can
show it — clearly labeled as demo mode, not hidden. To go live, implement
`sendOtpSms` to call a real provider and set `SMS_PROVIDER_API_KEY`, which
turns dev mode off automatically.

## Getting started

```bash
npm install          # also runs `prisma generate` via postinstall
npm run db:push       # create/sync the SQLite schema
npm run db:seed       # populate demo restaurants, menus, and reviews
npm run dev
```

Open http://localhost:3000.

The SQLite file lives at `prisma/dev.db` and is gitignored — every clone
needs `db:push` + `db:seed` once before the app has data.

## App flow

`/` (splash) → `/auth` (phone number → OTP, only if not already logged in)
→ `/onboarding` (area, kashrut level, meat/dairy/parve) → `/home` (filtered
restaurant list + search) → `/restaurant/[id]` (menu, kashrut certificate
tab, reviews) → `/cart` → `/checkout` (requires login; redirects to
`/auth?next=/checkout` otherwise) → `/order/[id]` (live status tracker,
polling the API). `/partner` is the restaurant-owner signup form. `/more`
shows the logged-in phone number + logout, and links to the legal pages
below. Browsing restaurants doesn't require login — only placing an order
and viewing order history do.

## API routes

| Route | Purpose |
|---|---|
| `POST /api/auth/request-otp` | Send (log, in dev mode) a 6-digit code to a phone number; rate-limited to one per 30s per number |
| `POST /api/auth/verify-otp` | Check the code (max 5 attempts, 5 min expiry); creates the user on first login and sets the session cookie |
| `GET /api/auth/me` | Current logged-in user from the session cookie, or `null` |
| `POST /api/auth/logout` | Deletes the session and clears the cookie |
| `GET /api/restaurants` | List restaurants; filters via `area`, `kashrut` (csv), `foodType` (csv), `q` |
| `GET /api/restaurants/[id]` | Single restaurant with menu + reviews |
| `POST /api/orders` | Create an order for the logged-in user (401 otherwise); server re-prices items from the DB (never trusts client prices) and enforces the restaurant's minimum order |
| `GET /api/orders` | The logged-in user's order history |
| `GET /api/orders/[id]` | Single order, restricted to its owner (403 for anyone else); status is computed server-side from elapsed time since `createdAt`, not stored, so the client just polls |
| `POST /api/partner-applications` | Restaurant-owner signup submissions |

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
- **SMS delivery**: OTPs are logged server-side and echoed back to the login
  screen in dev mode instead of actually being texted (see the Stack section
  above) — swap in a real provider (Twilio etc.) before real users rely on it.
- **Auth hardening**: OTPs are stored in plain text in `OtpCode` (fine for a
  short-lived 6-digit code, but hash them for defense in depth), and there's
  no Apple/Google sign-in yet, per the original product plan.
- **Restaurant management**: menus/hours/kashrut certificates are edited via
  the seed script only. A real version needs a restaurant-facing dashboard.
- **Payments**: the checkout form is a visual mock — no card data is
  transmitted or stored. A production build needs a licensed Israeli
  payment processor (PCI DSS compliant).
- **Delivery**: order status is a deterministic function of elapsed time for
  demo purposes, not real courier data. Real tracking needs either
  restaurant self-delivery reporting or a courier/delivery API integration.
- **Kashrut verification**: certificates are stored as data with no review
  workflow; a real launch needs a human (or rabbinate-record integration)
  approval step before a business goes live, plus expiry-date reminders.
- **Images**: menu/restaurant photos are generated locally as inline SVG
  placeholders (`src/lib/placeholder.ts`) so the app has zero external
  image dependencies — swap in real photos per business at onboarding.
