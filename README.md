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
and `localStorage`; restaurants, menus, reviews, and orders live in the
database.

Anonymous customers are identified by a `customerId` generated client-side
on first load and stored in `localStorage` — there's no real auth yet (see
below).

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

`/` (splash) → `/onboarding` (area, kashrut level, meat/dairy/parve) →
`/home` (filtered restaurant list + search) → `/restaurant/[id]` (menu,
kashrut certificate tab, reviews) → `/cart` → `/checkout` → `/order/[id]`
(live status tracker, polling the API). `/partner` is the restaurant-owner
signup form. `/more` links to the legal pages below.

## API routes

| Route | Purpose |
|---|---|
| `GET /api/restaurants` | List restaurants; filters via `area`, `kashrut` (csv), `foodType` (csv), `q` |
| `GET /api/restaurants/[id]` | Single restaurant with menu + reviews |
| `POST /api/orders` | Create an order; server re-prices items from the DB (never trusts client prices) and enforces the restaurant's minimum order |
| `GET /api/orders?customerId=` | A customer's order history |
| `GET /api/orders/[id]` | Single order; status is computed server-side from elapsed time since `createdAt`, not stored, so the client just polls |
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
- **Auth**: customers are identified by a random `localStorage` id with no
  verification. A real launch needs actual auth (phone OTP, per the original
  product plan, or Apple/Google sign-in) so orders and history survive a
  cleared browser or a new device.
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
