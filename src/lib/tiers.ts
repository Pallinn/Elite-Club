/** Table tier, derived from a zone's name (e.g. "Floor 2 — VIP" → "VIP"). */
export type Tier = "VVIP" | "VIP" | "Normal";

/**
 * VVIP must be checked before VIP since "vvip" also contains the substring
 * "vip" — checking VIP first would misclassify every VVIP zone.
 */
export function tierOf(zoneName: string): Tier {
  if (/vvip/i.test(zoneName)) return "VVIP";
  if (/vip/i.test(zoneName)) return "VIP";
  return "Normal";
}

export const TIER_ORDER: Record<Tier, number> = { VVIP: 0, VIP: 1, Normal: 2 };

export const TIER_BADGE_CLASS: Record<Tier, string> = {
  VVIP: "border-orange-500/50 text-orange-500",
  VIP: "border-violet-400/50 text-violet-400",
  Normal: "border-amber-300/40 text-amber-300",
};

export const TIER_ACCENT_CLASS: Record<Tier, string> = {
  VVIP: "text-orange-500",
  VIP: "text-violet-400",
  Normal: "text-amber-300",
};

export const TIER_BAR_CLASS: Record<Tier, string> = {
  VVIP: "bg-orange-500",
  VIP: "bg-violet-400",
  Normal: "bg-amber-300",
};
