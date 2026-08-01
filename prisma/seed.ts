import { PrismaClient } from "@prisma/client";
import { RESTAURANTS } from "../src/lib/data";

const prisma = new PrismaClient();

const DEMO_OWNER_PHONE = "0501112222";

interface SeedOptionChoice {
  label: string;
  priceDelta: number;
}
interface SeedOption {
  name: string;
  type: "single" | "multi";
  required: boolean;
  choices: SeedOptionChoice[];
}

// Keyed by the full menu item id (`${restaurantId}__${menuItem.id}`) — only
// a handful of items get sample customization options, to demonstrate the
// feature without hand-writing it for every seeded dish.
const SEED_OPTIONS: Record<string, SeedOption[]> = {
  "falafel-hazkenim__m1": [
    {
      name: "רמת חריפות",
      type: "single",
      required: true,
      choices: [
        { label: "רגיל", priceDelta: 0 },
        { label: "חריף", priceDelta: 0 },
        { label: "חריף מאוד", priceDelta: 0 },
      ],
    },
    {
      name: "תוספות",
      type: "multi",
      required: false,
      choices: [
        { label: "ביצה קשה", priceDelta: 5 },
        { label: "טחינה מרובה", priceDelta: 0 },
        { label: "חריף בצד", priceDelta: 0 },
      ],
    },
  ],
  "steak-house-dizengoff__m1": [
    {
      name: "מידת עשייה",
      type: "single",
      required: true,
      choices: [
        { label: "מדיום ראר", priceDelta: 0 },
        { label: "מדיום", priceDelta: 0 },
        { label: "וול דאן", priceDelta: 0 },
      ],
    },
    {
      name: "תוספות",
      type: "multi",
      required: false,
      choices: [
        { label: "ביצת עין", priceDelta: 6 },
        { label: "בייקון בקר", priceDelta: 8 },
        { label: "גבינה צהובה", priceDelta: 7 },
      ],
    },
  ],
  "pizza-mehadrin__m1": [
    {
      name: "גודל",
      type: "single",
      required: true,
      choices: [
        { label: "רגיל", priceDelta: 0 },
        { label: "משפחתית XL", priceDelta: 15 },
      ],
    },
    {
      name: "תוספות",
      type: "multi",
      required: false,
      choices: [
        { label: "זיתים", priceDelta: 6 },
        { label: "פטריות", priceDelta: 7 },
        { label: "בצל סגול", priceDelta: 4 },
      ],
    },
  ],
};

async function main() {
  const demoOwner = await prisma.user.upsert({
    where: { phone: DEMO_OWNER_PHONE },
    update: {},
    create: { phone: DEMO_OWNER_PHONE, name: "בעל מסעדה (הדגמה)" },
  });

  for (const r of RESTAURANTS) {
    await prisma.restaurant.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id,
        name: r.name,
        imageUrl: r.imageUrl,
        logoUrl: r.logoUrl,
        cuisine: r.cuisine.join(","),
        area: r.area,
        address: r.address,
        foodTypes: r.foodTypes.join(","),
        rating: r.rating,
        reviewCount: r.reviewCount,
        deliveryTimeMinLow: r.deliveryTimeMinutes[0],
        deliveryTimeMinHigh: r.deliveryTimeMinutes[1],
        deliveryFee: r.deliveryFee,
        minOrder: r.minOrder,
        selfDelivery: r.selfDelivery,
        kashrutLevel: r.kashrut.level,
        certifyingBody: r.kashrut.certifyingBody,
        certificateNumber: r.kashrut.certificateNumber,
        certificateIssuedDate: new Date(r.kashrut.issuedDate),
        certificateExpiryDate: new Date(r.kashrut.expiryDate),
        certificateImageUrl: r.kashrut.certificateImageUrl,
        certificateVerified: r.kashrut.verified,
        published: true,
        ownerId: demoOwner.id,
        menuItems: {
          create: r.menu.map((m) => {
            const fullId = `${r.id}__${m.id}`;
            const options = SEED_OPTIONS[fullId];
            return {
              id: fullId,
              name: m.name,
              description: m.description,
              price: m.price,
              imageUrl: m.imageUrl,
              foodType: m.foodType,
              category: m.category,
              popular: !!m.popular,
              options: options
                ? {
                    create: options.map((o, oi) => ({
                      name: o.name,
                      type: o.type,
                      required: o.required,
                      sortOrder: oi,
                      choices: {
                        create: o.choices.map((c, ci) => ({
                          label: c.label,
                          priceDelta: c.priceDelta,
                          sortOrder: ci,
                        })),
                      },
                    })),
                  }
                : undefined,
            };
          }),
        },
        reviews: {
          create: r.reviews.map((rev) => ({
            userName: rev.userName,
            rating: rev.rating,
            comment: rev.comment,
            date: new Date(rev.date),
          })),
        },
      },
    });
  }
  console.log(`Seeded ${RESTAURANTS.length} restaurants.`);
  console.log(
    `Demo restaurant-owner login: ${DEMO_OWNER_PHONE} (owns all seeded restaurants) — log in at /auth, then visit /dashboard.`
  );
  console.log(
    "Demo admin login: set via ADMIN_PHONES env var, or use the default 0501110000 (see src/lib/admin.ts) — log in at /auth, then visit /admin."
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
