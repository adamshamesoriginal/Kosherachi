export type KashrutLevel = "regular" | "mehadrin" | "badatz" | "local_rabbanut";

export const KASHRUT_LEVELS: { id: KashrutLevel; label: string; emoji: string; color: string }[] = [
  { id: "regular", label: "כשר", emoji: "🟢", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  { id: "mehadrin", label: "כשר למהדרין", emoji: "🔵", color: "bg-sky-100 text-sky-800 border-sky-300" },
  { id: "badatz", label: 'בד"ץ', emoji: "🟣", color: "bg-violet-100 text-violet-800 border-violet-300" },
  { id: "local_rabbanut", label: "רבנות מקומית", emoji: "🟠", color: "bg-amber-100 text-amber-800 border-amber-300" },
];

export type FoodType = "meat" | "dairy" | "parve";

export const FOOD_TYPES: { id: FoodType; label: string; emoji: string }[] = [
  { id: "meat", label: "בשרי", emoji: "🥩" },
  { id: "dairy", label: "חלבי", emoji: "🧀" },
  { id: "parve", label: "פרווה", emoji: "🌱" },
];

export interface KashrutCertificate {
  level: KashrutLevel;
  certifyingBody: string; // e.g. "הרבנות הראשית לישראל - ירושלים"
  certificateNumber: string;
  issuedDate: string; // ISO date
  expiryDate: string; // ISO date
  certificateImageUrl: string; // photo of the teudat kashrut
  verified: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number; // ILS
  imageUrl: string;
  foodType: FoodType;
  category: string;
  popular?: boolean;
  available?: boolean;
}

export interface Review {
  id: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  date: string;
}

export interface Restaurant {
  id: string;
  name: string;
  imageUrl: string;
  logoUrl: string;
  cuisine: string[];
  area: string; // delivery area / city
  address: string;
  foodTypes: FoodType[];
  kashrut: KashrutCertificate;
  rating: number;
  reviewCount: number;
  deliveryTimeMinutes: [number, number];
  deliveryFee: number; // ILS, 0 = free
  minOrder: number;
  selfDelivery: boolean; // restaurant delivers itself vs external courier
  published?: boolean; // visible to customers; false while the owner is still setting up
  menu: MenuItem[];
  reviews: Review[];
}

export interface CartItem {
  restaurantId: string;
  item: MenuItem;
  quantity: number;
}

export type OrderStatus =
  | "placed"
  | "confirmed"
  | "preparing"
  | "out_for_delivery"
  | "delivered";

export interface Order {
  id: string;
  restaurantId: string;
  restaurantName: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  vat: number;
  total: number;
  address: string;
  status: OrderStatus;
  createdAt: string;
  pickupOrDelivery: "delivery" | "pickup";
}

export type PartnerApplicationStatus = "pending" | "approved" | "rejected";

export interface PartnerApplication {
  id: string;
  applicantPhone: string | null;
  applicantEmail: string | null;
  businessName: string;
  businessId: string;
  area: string;
  status: PartnerApplicationStatus;
  reviewNote: string | null;
  restaurantId: string | null;
  createdAt: string;
  reviewedAt: string | null;
}
