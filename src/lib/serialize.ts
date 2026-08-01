import type {
  Restaurant as DbRestaurant,
  MenuItem as DbMenuItem,
  Review as DbReview,
  Order as DbOrder,
  OrderItem as DbOrderItem,
  PartnerApplication as DbPartnerApplication,
  User as DbUser,
} from "@prisma/client";
import {
  FoodType,
  KashrutLevel,
  MenuItem,
  Order,
  OrderStatus,
  PartnerApplication,
  PartnerApplicationStatus,
  PaymentStatus,
  Restaurant,
  Review,
} from "./types";

type RestaurantWithRelations = DbRestaurant & {
  menuItems: DbMenuItem[];
  reviews: DbReview[];
};

export function serializeMenuItem(m: DbMenuItem): MenuItem {
  return {
    id: m.id,
    name: m.name,
    description: m.description,
    price: m.price,
    imageUrl: m.imageUrl,
    foodType: m.foodType as FoodType,
    category: m.category,
    popular: m.popular,
    available: m.available,
  };
}

export function serializeReview(r: DbReview): Review {
  return {
    id: r.id,
    userName: r.userName,
    rating: r.rating,
    comment: r.comment,
    date: r.date.toISOString(),
  };
}

export function serializeRestaurant(r: RestaurantWithRelations): Restaurant {
  return {
    id: r.id,
    name: r.name,
    imageUrl: r.imageUrl,
    logoUrl: r.logoUrl,
    cuisine: r.cuisine.split(",").filter(Boolean),
    area: r.area,
    address: r.address,
    foodTypes: r.foodTypes.split(",").filter(Boolean) as FoodType[],
    kashrut: {
      level: r.kashrutLevel as KashrutLevel,
      certifyingBody: r.certifyingBody,
      certificateNumber: r.certificateNumber,
      issuedDate: r.certificateIssuedDate.toISOString(),
      expiryDate: r.certificateExpiryDate.toISOString(),
      certificateImageUrl: r.certificateImageUrl,
      verified: r.certificateVerified,
    },
    rating: r.rating,
    reviewCount: r.reviewCount,
    deliveryTimeMinutes: [r.deliveryTimeMinLow, r.deliveryTimeMinHigh],
    deliveryFee: r.deliveryFee,
    minOrder: r.minOrder,
    selfDelivery: r.selfDelivery,
    published: r.published,
    menu: r.menuItems.map(serializeMenuItem),
    reviews: r.reviews.map(serializeReview),
  };
}

type OrderWithItems = DbOrder & {
  items: (DbOrderItem & { menuItem: DbMenuItem })[];
};

export function serializeOrder(o: OrderWithItems): Order {
  return {
    id: o.id,
    restaurantId: o.restaurantId,
    restaurantName: o.restaurantName,
    items: o.items.map((it) => ({
      restaurantId: o.restaurantId,
      quantity: it.quantity,
      item: {
        id: it.menuItemId,
        name: it.name,
        description: it.menuItem?.description ?? "",
        price: it.price,
        imageUrl: it.menuItem?.imageUrl ?? "",
        foodType: (it.menuItem?.foodType ?? "parve") as FoodType,
        category: it.menuItem?.category ?? "",
      },
    })),
    subtotal: o.subtotal,
    deliveryFee: o.deliveryFee,
    serviceFee: o.serviceFee,
    vat: o.vat,
    total: o.total,
    address: o.address,
    status: o.status as OrderStatus,
    paymentStatus: o.paymentStatus as PaymentStatus,
    createdAt: o.createdAt.toISOString(),
    pickupOrDelivery: o.pickupOrDelivery as "delivery" | "pickup",
  };
}

type PartnerApplicationWithApplicant = DbPartnerApplication & { applicant: DbUser };

export function serializePartnerApplication(
  a: PartnerApplicationWithApplicant
): PartnerApplication {
  return {
    id: a.id,
    applicantPhone: a.applicant.phone,
    applicantEmail: a.applicant.email,
    businessName: a.businessName,
    businessId: a.businessId,
    area: a.area,
    status: a.status as PartnerApplicationStatus,
    reviewNote: a.reviewNote,
    restaurantId: a.restaurantId,
    createdAt: a.createdAt.toISOString(),
    reviewedAt: a.reviewedAt ? a.reviewedAt.toISOString() : null,
  };
}
