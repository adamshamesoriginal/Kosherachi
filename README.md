# KosherGo 🍽️

**"כל מה שאתה רואה — כשר ומאומת." / "Everything you see — kosher and verified."**

A mobile-first food delivery app MVP for the Israeli market. Users pick their
kashrut level and area up front and only ever see restaurants that match —
each with its kashrut certificate (certifying body, certificate number,
expiry date, and a photo of the teudat kashrut) displayed on the spot.

This is a clickable prototype: an onboarding flow, a filtered restaurant
list, a restaurant/menu page, cart, checkout, and simulated order tracking,
all wired together with mock data and local (in-browser) state — no real
backend, payments, or live restaurant integrations yet.

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS. State (kashrut
preferences, cart, orders) lives in React context and is persisted to
`localStorage` — there is no server-side database yet.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## App flow

`/` (splash) → `/onboarding` (area, kashrut level, meat/dairy/parve) →
`/home` (filtered restaurant list + search) → `/restaurant/[id]` (menu,
kashrut certificate tab, reviews) → `/cart` → `/checkout` → `/order/[id]`
(live status tracker). `/partner` is the restaurant-owner signup pitch.
`/more` links to the legal pages below.

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

- **Restaurants & menus**: static mock data in `src/lib/data.ts`. A real
  version needs a database and a restaurant-facing dashboard to manage menus,
  hours, and kashrut certificate uploads/renewals.
- **Payments**: the checkout form is a visual mock — no card data is
  transmitted or stored. A production build needs a licensed Israeli
  payment processor (PCI DSS compliant).
- **Delivery**: order tracking auto-advances on a timer for demo purposes.
  Real tracking needs either restaurant self-delivery reporting or an
  integration with a courier/delivery API.
- **Kashrut verification**: certificates are stored as data today; a real
  launch needs a review step (by a person or an integration with rabbinate
  records) before a business goes live, plus expiry-date reminders.
- **Images**: menu/restaurant photos are generated locally as inline SVG
  placeholders (`src/lib/placeholder.ts`) so the app has zero external
  image dependencies — swap in real photos per business at onboarding.
