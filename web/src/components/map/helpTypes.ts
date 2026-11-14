// Help-place types from community_resources_nyc.geojson, with a simple letter icon each.
import { HELP_HEX } from "./colors";

export const HELP_TYPES: { type: string; label: string; letter: string }[] = [
  { type: "Cooling center", label: "Cooling centers", letter: "C" },
  { type: "Cool indoor public place", label: "Cool indoor places", letter: "I" },
  { type: "Library", label: "Libraries", letter: "L" },
  { type: "Senior center", label: "Senior centers", letter: "S" },
  { type: "Community center", label: "Community centers", letter: "CC" },
  { type: "Recreation center", label: "Recreation centers", letter: "R" },
  { type: "Food pantry / soup kitchen", label: "Food pantries / soup kitchens", letter: "F" },
  { type: "Community organization", label: "Community organizations", letter: "O" },
  { type: "Homeless services", label: "Homeless services", letter: "H" },
  { type: "Outdoor spray shower / pool", label: "Outdoor spray showers / pools", letter: "P" },
];

/** Default: everything except outdoor spray showers / pools (not for high-risk patients). */
export const DEFAULT_HELP_TYPES = HELP_TYPES.map((t) => t.type).filter((t) => t !== "Outdoor spray shower / pool");

const cache = new Map<string, string>();
export function helpIconUrl(type: string): string {
  const hit = cache.get(type);
  if (hit) return hit;
  const letter = HELP_TYPES.find((t) => t.type === type)?.letter ?? "•";
  const fs = letter.length > 1 ? 13 : 17;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="${HELP_HEX}" stroke="#ffffff" stroke-width="3"/><text x="16" y="21.5" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="${fs}" fill="#ffffff">${letter}</text></svg>`;
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  cache.set(type, url);
  return url;
}
