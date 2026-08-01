import { PrismaClient } from "@prisma/client";
import { RESTAURANTS } from "../src/lib/data";

const prisma = new PrismaClient();

const DEMO_OWNER_PHONE = "0501112222";

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
        ownerId: demoOwner.id,
        menuItems: {
          create: r.menu.map((m) => ({
            id: `${r.id}__${m.id}`,
            name: m.name,
            description: m.description,
            price: m.price,
            imageUrl: m.imageUrl,
            foodType: m.foodType,
            category: m.category,
            popular: !!m.popular,
          })),
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
