import { Restaurant } from "./types";
import { placeholderImage } from "./placeholder";

const EMOJI_BY_KEYWORD: [string, string][] = [
  ["falafel", "🧆"],
  ["hummus", "🫘"],
  ["sabich", "🍆"],
  ["soda", "🥤"],
  ["cert", "📜"],
  ["cafe", "☕"],
  ["croissant", "🥐"],
  ["shakshuka", "🍳"],
  ["latte", "☕"],
  ["cheesecake", "🍰"],
  ["steak", "🥩"],
  ["burger", "🍔"],
  ["entrecote", "🥩"],
  ["wings", "🍗"],
  ["vegan", "🥗"],
  ["bowl", "🥗"],
  ["salad", "🥗"],
  ["juice", "🧃"],
  ["pizza", "🍕"],
  ["garlicbread", "🥖"],
  ["shawarma", "🌯"],
];

function emojiFor(seed: string): string {
  const match = EMOJI_BY_KEYWORD.find(([kw]) => seed.includes(kw));
  return match ? match[1] : "🍽️";
}

const IMG = (seed: string, w = 800, h = 500) =>
  placeholderImage(seed, emojiFor(seed), w, h);

export const AREAS = [
  "תל אביב - לב העיר",
  "תל אביב - פלורנטין",
  "רמת גן",
  "גבעתיים",
  "ירושלים - רחביה",
  "בני ברק",
  "פתח תקווה",
] as const;

export const RESTAURANTS: Restaurant[] = [
  {
    id: "falafel-hazkenim",
    name: "פלאפל הזקנים",
    imageUrl: IMG("falafel1"),
    logoUrl: IMG("falafel1-logo", 200, 200),
    cuisine: ["פלאפל", "חומוס", "מזרחי"],
    area: "תל אביב - לב העיר",
    address: "רחוב הרצל 12, תל אביב",
    foodTypes: ["parve"],
    kashrut: {
      level: "mehadrin",
      certifyingBody: 'הרבנות הראשית תל אביב-יפו',
      certificateNumber: "TA-2026-00417",
      issuedDate: "2025-09-01",
      expiryDate: "2026-09-01",
      certificateImageUrl: IMG("cert1", 400, 550),
      verified: true,
    },
    rating: 4.7,
    reviewCount: 312,
    deliveryTimeMinutes: [20, 35],
    deliveryFee: 9.9,
    minOrder: 30,
    selfDelivery: true,
    menu: [
      { id: "m1", name: "מנת פלאפל בפיתה", description: "8 כדורי פלאפל טריים, סלטים, טחינה וחמוצים", price: 24, imageUrl: IMG("falafel-item1"), foodType: "parve", category: "מנות עיקריות", popular: true },
      { id: "m2", name: "מנת חומוס עם פטרוזיליה", description: "חומוס ביתי, שמן זית, פטרוזיליה, פיתה חמה", price: 28, imageUrl: IMG("hummus1"), foodType: "parve", category: "מנות עיקריות" },
      { id: "m3", name: "סביח", description: "חציל מטוגן, ביצה קשה, סלטים וטחינה בפיתה", price: 26, imageUrl: IMG("sabich1"), foodType: "parve", category: "מנות עיקריות" },
      { id: "m4", name: "שתיה קלה", description: "פחית 330 מ״ל", price: 9, imageUrl: IMG("soda1"), foodType: "parve", category: "שתייה" },
    ],
    reviews: [
      { id: "r1", userName: "מיכל", rating: 5, comment: "הפלאפל הכי טוב באזור, וגם עם תעודת כשרות ברורה", date: "2026-07-20" },
      { id: "r2", userName: "יוסי", rating: 4, comment: "משלוח מהיר, אוכל טעים", date: "2026-07-15" },
    ],
  },
  {
    id: "milk-and-honey-cafe",
    name: "קפה חלב ודבש",
    imageUrl: IMG("cafe1"),
    logoUrl: IMG("cafe1-logo", 200, 200),
    cuisine: ["קפה", "מאפים", "בוקר"],
    area: "רמת גן",
    address: "ביאליק 5, רמת גן",
    foodTypes: ["dairy"],
    kashrut: {
      level: "badatz",
      certifyingBody: 'בד"ץ העדה החרדית',
      certificateNumber: "EH-2026-11029",
      issuedDate: "2025-11-10",
      expiryDate: "2026-11-10",
      certificateImageUrl: IMG("cert2", 400, 550),
      verified: true,
    },
    rating: 4.9,
    reviewCount: 481,
    deliveryTimeMinutes: [15, 30],
    deliveryFee: 12,
    minOrder: 25,
    selfDelivery: false,
    menu: [
      { id: "m1", name: "קרואסון חמאה", description: "קרואסון צרפתי טרי מהתנור", price: 16, imageUrl: IMG("croissant1"), foodType: "dairy", category: "מאפים", popular: true },
      { id: "m2", name: "שקשוקה גבינות", description: "שקשוקה עם תערובת גבינות ולחם כפרי", price: 42, imageUrl: IMG("shakshuka1"), foodType: "dairy", category: "בוקר" },
      { id: "m3", name: "לאטה", description: "קפה הפוך עם חלב מוקצף", price: 14, imageUrl: IMG("latte1"), foodType: "dairy", category: "שתייה" },
      { id: "m4", name: "עוגת גבינה", description: "פרוסת עוגת גבינה אפויה", price: 22, imageUrl: IMG("cheesecake1"), foodType: "dairy", category: "קינוחים" },
    ],
    reviews: [
      { id: "r1", userName: "רונית", rating: 5, comment: "הקרואסונים מעולים והמקום אמין מבחינת כשרות", date: "2026-07-22" },
    ],
  },
  {
    id: "steak-house-dizengoff",
    name: "בשריית דיזנגוף",
    imageUrl: IMG("steak1"),
    logoUrl: IMG("steak1-logo", 200, 200),
    cuisine: ["בשרים", "בורגר", "גריל"],
    area: "תל אביב - לב העיר",
    address: "דיזנגוף 144, תל אביב",
    foodTypes: ["meat"],
    kashrut: {
      level: "local_rabbanut",
      certifyingBody: "הרבנות הראשית תל אביב-יפו",
      certificateNumber: "TA-2026-00892",
      issuedDate: "2025-06-01",
      expiryDate: "2026-06-01",
      certificateImageUrl: IMG("cert3", 400, 550),
      verified: true,
    },
    rating: 4.5,
    reviewCount: 203,
    deliveryTimeMinutes: [30, 45],
    deliveryFee: 15,
    minOrder: 60,
    selfDelivery: true,
    menu: [
      { id: "m1", name: "המבורגר בקר 200 גרם", description: "בקר טרי, חסה, עגבניה, בצל מקורמל, לחמניה", price: 58, imageUrl: IMG("burger1"), foodType: "meat", category: "מנות עיקריות", popular: true },
      { id: "m2", name: "אנטריקוט 300 גרם", description: "אנטריקוט על הגריל עם צ'יפס", price: 119, imageUrl: IMG("entrecote1"), foodType: "meat", category: "מנות עיקריות" },
      { id: "m3", name: "כנפיים חריפות", description: "12 כנפי עוף ברוטב חריף", price: 44, imageUrl: IMG("wings1"), foodType: "meat", category: "מנות ראשונות" },
    ],
    reviews: [
      { id: "r1", userName: "אבי", rating: 4, comment: "בשר איכותי, הזמנתי כמה פעמים", date: "2026-07-10" },
    ],
  },
  {
    id: "green-bowl-vegan",
    name: "גרין באול - פרווה בריא",
    imageUrl: IMG("vegan1"),
    logoUrl: IMG("vegan1-logo", 200, 200),
    cuisine: ["טבעוני", "בריאות", "סלטים"],
    area: "תל אביב - פלורנטין",
    address: "פלורנטין 22, תל אביב",
    foodTypes: ["parve"],
    kashrut: {
      level: "regular",
      certifyingBody: "הרבנות הראשית תל אביב-יפו",
      certificateNumber: "TA-2026-00551",
      issuedDate: "2025-12-01",
      expiryDate: "2026-12-01",
      certificateImageUrl: IMG("cert4", 400, 550),
      verified: true,
    },
    rating: 4.6,
    reviewCount: 154,
    deliveryTimeMinutes: [20, 40],
    deliveryFee: 0,
    minOrder: 35,
    selfDelivery: false,
    menu: [
      { id: "m1", name: "באול קינואה וירקות קלויים", description: "קינואה, בטטה, חומוס, טחינה, ירקות עונתיים", price: 46, imageUrl: IMG("bowl1"), foodType: "parve", category: "באולים", popular: true },
      { id: "m2", name: "סלט קייל ואבוקדו", description: "קייל, אבוקדו, גרעיני חמניה, רוטב לימון", price: 39, imageUrl: IMG("salad1"), foodType: "parve", category: "סלטים" },
      { id: "m3", name: "מיץ ירוק סחוט טרי", description: "תפוח, מלפפון, סלרי, ג'ינג'ר", price: 18, imageUrl: IMG("juice1"), foodType: "parve", category: "שתייה" },
    ],
    reviews: [
      { id: "r1", userName: "נועה", rating: 5, comment: "אוכל טעים ובריא, ממליצה בחום", date: "2026-07-25" },
    ],
  },
  {
    id: "pizza-mehadrin",
    name: "פיצה מהדרין",
    imageUrl: IMG("pizza1"),
    logoUrl: IMG("pizza1-logo", 200, 200),
    cuisine: ["פיצה", "איטלקי"],
    area: "בני ברק",
    address: "רבי עקיבא 30, בני ברק",
    foodTypes: ["dairy"],
    kashrut: {
      level: "badatz",
      certifyingBody: 'בד"ץ בני ברק - הרב לנדא',
      certificateNumber: "BB-2026-00234",
      issuedDate: "2025-10-01",
      expiryDate: "2026-04-01",
      certificateImageUrl: IMG("cert5", 400, 550),
      verified: true,
    },
    rating: 4.8,
    reviewCount: 620,
    deliveryTimeMinutes: [25, 40],
    deliveryFee: 8,
    minOrder: 40,
    selfDelivery: true,
    menu: [
      { id: "m1", name: "פיצה מרגריטה משפחתית", description: "רוטב עגבניות, מוצרלה, בזיליקום", price: 62, imageUrl: IMG("pizza-margherita"), foodType: "dairy", category: "פיצות", popular: true },
      { id: "m2", name: "פיצה ארבע גבינות", description: "מוצרלה, פרמזן, גבינה כחולה, עזים", price: 72, imageUrl: IMG("pizza-4cheese"), foodType: "dairy", category: "פיצות" },
      { id: "m3", name: "לחם שום", description: "לחמניית שום עם עשבי תיבול", price: 20, imageUrl: IMG("garlicbread1"), foodType: "dairy", category: "מנות ראשונות" },
    ],
    reviews: [
      { id: "r1", userName: "שרה", rating: 5, comment: 'הכשרות מהודרת ומאומתת, הפיצה מעולה', date: "2026-07-18" },
    ],
  },
  {
    id: "shawarma-hakerem",
    name: "שווארמה הכרם",
    imageUrl: IMG("shawarma1"),
    logoUrl: IMG("shawarma1-logo", 200, 200),
    cuisine: ["שווארמה", "מזרחי"],
    area: "גבעתיים",
    address: "כצנלסון 55, גבעתיים",
    foodTypes: ["meat"],
    kashrut: {
      level: "mehadrin",
      certifyingBody: "הרבנות הראשית גבעתיים",
      certificateNumber: "GV-2026-00119",
      issuedDate: "2025-08-15",
      expiryDate: "2026-08-15",
      certificateImageUrl: IMG("cert6", 400, 550),
      verified: true,
    },
    rating: 4.4,
    reviewCount: 268,
    deliveryTimeMinutes: [20, 35],
    deliveryFee: 10,
    minOrder: 30,
    selfDelivery: true,
    menu: [
      { id: "m1", name: "מנת שווארמה הודו בלאפה", description: "שווארמה הודו, סלטים, טחינה בלאפה חמה", price: 36, imageUrl: IMG("shawarma-item1"), foodType: "meat", category: "מנות עיקריות", popular: true },
      { id: "m2", name: "מגש שווארמה זוגי", description: "שווארמה, אורז, סלטים, חומוס לשניים", price: 89, imageUrl: IMG("shawarma-tray1"), foodType: "meat", category: "מגשים" },
    ],
    reviews: [
      { id: "r1", userName: "דני", rating: 4, comment: "טעים ומהיר, ממליץ", date: "2026-07-12" },
    ],
  },
];

export function isCertificateExpiringSoon(expiryDate: string, withinDays = 30): boolean {
  const diff = new Date(expiryDate).getTime() - Date.now();
  return diff > 0 && diff < withinDays * 24 * 60 * 60 * 1000;
}

export function isCertificateExpired(expiryDate: string): boolean {
  return new Date(expiryDate).getTime() < Date.now();
}
