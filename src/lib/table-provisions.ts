/**
 * What's included with each table, keyed off its label. Doesn't come from
 * the DB — capacity here is the human-facing range (DB stores a single int,
 * the upper bound, for seat-count / floor-plan sizing purposes).
 */
export type TableProvisions = {
  capacityRange: string;
  blackLabel: number;
  mixers: number;
};

const VIP_PLUS: TableProvisions = { capacityRange: "6–8", blackLabel: 1, mixers: 4 };
const VIP: TableProvisions = { capacityRange: "4–6", blackLabel: 1, mixers: 3 };
const REGULAR: TableProvisions = { capacityRange: "4–6", blackLabel: 1, mixers: 3 };
const VVIP1: TableProvisions = { capacityRange: "12–16", blackLabel: 2, mixers: 8 };
const VVIP2: TableProvisions = { capacityRange: "8–12", blackLabel: 2, mixers: 6 };
const VVIP3: TableProvisions = { capacityRange: "6–8", blackLabel: 1, mixers: 5 };

export function tableProvisions(label: string): TableProvisions {
  const norm = label.replace(/\s+/g, "").toUpperCase();
  if (norm === "VVIP1") return VVIP1;
  if (norm === "VVIP2") return VVIP2;
  if (norm === "VVIP3") return VVIP3;
  if (norm === "VIP1" || norm === "VIP5") return VIP_PLUS;
  if (/^VIP[2-4]$/.test(norm)) return VIP;
  return REGULAR;
}
