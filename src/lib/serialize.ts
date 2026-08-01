import type {
  Restaurant as DbRestaurant,
  MenuItem as DbMenuItem,
  MenuItemOption as DbMenuItemOption,
  MenuItemOptionChoice as DbMenuItemOptionChoice,
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
  MenuItemOption,
  MenuItemOptionType,
  Order,
  OrderStatus,
  PartnerApplication,
  PartnerApplicationStatus,
  PaymentStatus,
  Restaurant,
  Review,
  SelectedOption,
} from "./types";

type MenuItemWithOptions = DbMenuItem & {
  options?: (DbMenuItemOption & { choices: DbMenuItemOptionChoice[] })[];
};

type RestaurantWithRelations = DbRestaurant & {
  menuItems: MenuItemWithOptions[];
  reviews: DbReview[];
};

function serializeMenuItemOption(
  o: DbMenuItemOption & { choices: DbMenuItemOptionChoice[] }
): MenuItemOption {
  return {
    id: o.id,
    name: o.name,
    type: o.type as MenuItemOptionType,
    required: o.required,
    choices: [...o.choices]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((c) => ({ id: c.id, label: c.label, priceDelta: c.priceDelta })),
  };
}

export function serializeMenuItem(m: MenuItemWithOptions): MenuItem {
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
    options: m.options
      ? [...m.options]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map(serializeMenuItemOption)
      : undefined,
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
    items: o.items.map((it) => {
      let selectedOptions: SelectedOption[] = [];
      if (it.selectedOptionsJson) {
        try {
          selectedOptions = JSON.parse(it.selectedOptionsJson);
        } catch {
          // corrupt/legacy row — treat as no selections rather than fail the whole order
        }
      }
      return {
        lineId: it.id,
        restaurantId: o.restaurantId,
        quantity: it.quantity,
        unitPrice: it.price,
        selectedOptions,
        note: it.note ?? "",
        item: {
          id: it.menuItemId,
          name: it.name,
          description: it.menuItem?.description ?? "",
          price: it.menuItem?.price ?? it.price,
          imageUrl: it.menuItem?.imageUrl ?? "",
          foodType: (it.menuItem?.foodType ?? "parve") as FoodType,
          category: it.menuItem?.category ?? "",
        },
      };
    }),
    subtotal: o.subtotal,
    deliveryFee: o.deliveryFee,
    serviceFee: o.serviceFee,
    vat: o.vat,
    total: o.total,
    address: o.address,
    note: o.note,
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
