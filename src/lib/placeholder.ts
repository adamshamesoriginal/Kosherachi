const PALETTE = [
  "#065f46",
  "#0f766e",
  "#b45309",
  "#9d174d",
  "#4c1d95",
  "#1d4ed8",
  "#7c2d12",
  "#166534",
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Deterministic inline SVG placeholder image — no network dependency. */
export function placeholderImage(seed: string, emoji = "🍽️", w = 800, h = 500): string {
  const color = PALETTE[hashString(seed) % PALETTE.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" fill="${color}"/>
    <text x="50%" y="50%" font-size="${Math.round(Math.min(w, h) * 0.32)}" text-anchor="middle" dominant-baseline="central">${emoji}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
