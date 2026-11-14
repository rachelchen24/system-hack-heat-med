// RGB copies of the risk-group tokens in web/src/styles/tokens.css (deck.gl needs arrays).
// Keep in sync with --risk-* there. HTML should use the CSS variables (see RISK_CSS).

export type RiskGroup = "High" | "Medium" | "Low";
export const RISK_GROUPS: RiskGroup[] = ["High", "Medium", "Low"];

type RGB = [number, number, number];

function hex(h: string): RGB {
  const n = parseInt(h.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export const RISK_HEX: Record<RiskGroup, { solid: string; tint: string; ink: string; on: string }> = {
  High: { solid: "#d55e00", tint: "#fbe3d6", ink: "#a0410a", on: "#141414" },
  Medium: { solid: "#f0c419", tint: "#fdf4d3", ink: "#7a5c00", on: "#141414" },
  Low: { solid: "#0e7c86", tint: "#d9f0f1", ink: "#0a5f66", on: "#ffffff" },
};

export const RISK_RGB: Record<RiskGroup, { solid: RGB; ink: RGB }> = {
  High: { solid: hex(RISK_HEX.High.solid), ink: hex(RISK_HEX.High.ink) },
  Medium: { solid: hex(RISK_HEX.Medium.solid), ink: hex(RISK_HEX.Medium.ink) },
  Low: { solid: hex(RISK_HEX.Low.solid), ink: hex(RISK_HEX.Low.ink) },
};

/** CSS values with hex fallbacks, for HTML legends, chips and cards. */
export const RISK_CSS: Record<RiskGroup, { solid: string; tint: string; ink: string; on: string }> = {
  High: { solid: "var(--risk-high, #d55e00)", tint: "var(--risk-high-tint, #fbe3d6)", ink: "var(--risk-high-ink, #a0410a)", on: "var(--risk-high-on, #141414)" },
  Medium: { solid: "var(--risk-medium, #f0c419)", tint: "var(--risk-medium-tint, #fdf4d3)", ink: "var(--risk-medium-ink, #7a5c00)", on: "var(--risk-medium-on, #141414)" },
  Low: { solid: "var(--risk-low, #0e7c86)", tint: "var(--risk-low-tint, #d9f0f1)", ink: "var(--risk-low-ink, #0a5f66)", on: "var(--risk-low-on, #ffffff)" },
};

/** Heat shading (neighborhood heat vulnerability 1 = cooler … 5 = hotter).
 *  Okabe–Ito reddish purple ramp, kept apart from the patient dot colors. */
export const HEAT_HEX = ["#f7eef4", "#efd6e4", "#e2b3cd", "#cf86ae", "#b05a8c"];
export const HEAT_RGB: RGB[] = HEAT_HEX.map(hex);

/** Help places: Okabe–Ito bluish green. */
export const HELP_HEX = "#009e73";
export const HELP_INK_HEX = "#00694c";
export const HELP_RGB = hex(HELP_HEX);
export const SUBWAY_HEX = "#141414";
export const ROUTE_HEX = "#141414";
