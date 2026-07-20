import { FLOOR_LAYOUTS } from "@/lib/venue-map";

export type FloorTable = {
  key: string;
  tableId: string;
  zoneId: string;
  label: string;
  capacity: number;
  priceSatang: number;
  isBooked: boolean;
  floor: 1 | 2;
  positionXPct: number;
  positionYPct: number;
  isPremium: boolean;
};

// Radius (in floor-plan pixels) calibrated to the actual Figma table sizes:
// plain tables (cap 4) ≈ r36.5, the booth (cap 6) ≈ r63, the lounges (cap 8)
// average ≈ r88 between Floor 1's r91.5 and Floor 2's r67. Floor 2's plain
// VIP 1-5 tables are sized up further per request.
function tableRadius(capacity: number, floor: 1 | 2) {
  if (capacity <= 4) return floor === 2 ? 55 : 36.5;
  if (capacity <= 6) return 63;
  return 88;
}

export function FloorPlanMap({
  floor,
  tables,
  selectedKeys,
  onSelect,
  onSwitchFloor,
}: {
  floor: 1 | 2;
  tables: FloorTable[];
  selectedKeys: Set<string>;
  onSelect: (table: FloorTable) => void;
  onSwitchFloor: (floor: 1 | 2) => void;
}) {
  const layout = FLOOR_LAYOUTS[floor];
  const otherFloor = floor === 1 ? 2 : 1;

  return (
    <svg
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      className="h-auto w-full select-none rounded-lg border border-white/10 bg-neutral-950"
      style={{ aspectRatio: layout.width / layout.height }}
    >
      <rect x={0} y={0} width={layout.width} height={layout.height} fill="oklch(0.09 0 0)" />

      {layout.walls.map((w, i) => (
        <line
          key={i}
          x1={w.x1}
          y1={w.y1}
          x2={w.x2}
          y2={w.y2}
          stroke="oklch(1 0 0 / 25%)"
          strokeWidth={1.5}
        />
      ))}

      {layout.shapes.map((s, i) => (
        <path
          key={i}
          d={s.path}
          fill="oklch(1 0 0 / 4%)"
          stroke="oklch(1 0 0 / 15%)"
          strokeWidth={1.5}
        />
      ))}

      {layout.rects.map((r, i) => (
        <g key={i}>
          <rect
            x={r.x}
            y={r.y}
            width={r.width}
            height={r.height}
            transform={r.transform}
            fill={r.void ? "oklch(0.09 0 0)" : r.label ? "oklch(1 0 0 / 10%)" : "oklch(1 0 0 / 4%)"}
            stroke={r.void ? "none" : "oklch(1 0 0 / 15%)"}
            strokeWidth={1.5}
          />
          {r.label && (
            <text
              x={r.x + r.width / 2}
              y={r.y + r.height / 2}
              fill="oklch(0.75 0 0)"
              fontSize={Math.min(r.width, r.height) * 0.22}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="var(--font-jetbrains-mono)"
              letterSpacing={2}
              style={{ pointerEvents: "none" }}
            >
              {r.label}
            </text>
          )}
        </g>
      ))}

      {layout.labels.map((l, i) => (
        <text
          key={i}
          x={l.x}
          y={l.y}
          fill="oklch(0.6 0 0)"
          fontSize={18}
          textAnchor={l.align ?? "start"}
          fontFamily="var(--font-jetbrains-mono)"
          style={{ pointerEvents: "none" }}
        >
          {l.text}
        </text>
      ))}

      <g
        role="button"
        aria-label={`Switch to floor ${otherFloor}`}
        onClick={() => onSwitchFloor(otherFloor)}
        style={{ cursor: "pointer" }}
      >
        <text
          x={layout.stairs.x}
          y={layout.stairs.y}
          fill="oklch(0.72 0.19 55)"
          fontSize={30}
          textAnchor={layout.stairs.align ?? "middle"}
          dominantBaseline="middle"
          fontFamily="var(--font-jetbrains-mono)"
          fontWeight={700}
        >
          {layout.stairs.text}
        </text>
      </g>

      {tables.map((t) => {
        const radius = tableRadius(t.capacity, floor);
        const cx = (t.positionXPct / 100) * layout.width;
        const cy = (t.positionYPct / 100) * layout.height;
        const isSelected = selectedKeys.has(t.key);
        const fill = t.isBooked
          ? "oklch(0.3 0 0)"
          : isSelected
            ? "oklch(0.72 0.19 55)"
            : t.isPremium
              ? "oklch(0.72 0.19 55 / 25%)"
              : "oklch(1 0 0 / 8%)";
        const stroke = t.isBooked
          ? "oklch(0.4 0 0)"
          : isSelected
            ? "oklch(0.72 0.19 55)"
            : t.isPremium
              ? "oklch(0.72 0.19 55 / 70%)"
              : "oklch(1 0 0 / 30%)";

        return (
          <g
            key={t.key}
            role="button"
            aria-label={`${t.label}, seats ${t.capacity}${t.isBooked ? ", sold out" : ""}`}
            onClick={() => !t.isBooked && onSelect(t)}
            style={{ cursor: t.isBooked ? "not-allowed" : "pointer" }}
          >
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill={fill}
              stroke={stroke}
              strokeWidth={isSelected ? 4 : 2}
            />
            <text
              x={cx}
              y={cy}
              fill={t.isBooked ? "oklch(0.5 0 0)" : "oklch(0.97 0 0)"}
              fontSize={Math.min(radius * 0.42, 22)}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="var(--font-jetbrains-mono)"
              fontWeight={700}
              style={{ pointerEvents: "none" }}
            >
              {t.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
