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

function tableShortLabel(label: string) {
  const prefixMatch = label.match(/^V\d+/i);
  if (prefixMatch) return prefixMatch[0].toUpperCase();
  const trailingNumber = label.match(/(\d+)\s*$/);
  if (trailingNumber) return trailingNumber[1];
  if (/lounge/i.test(label)) return "L";
  return label.slice(0, 2).toUpperCase();
}

export function FloorPlanMap({
  floor,
  tables,
  selectedKey,
  onSelect,
}: {
  floor: 1 | 2;
  tables: FloorTable[];
  selectedKey: string | null;
  onSelect: (table: FloorTable) => void;
}) {
  const layout = FLOOR_LAYOUTS[floor];

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="h-auto w-full select-none rounded-lg border border-white/10 bg-neutral-950"
      style={{ aspectRatio: layout.aspect }}
    >
      <rect x={0} y={0} width={100} height={100} fill="oklch(0.09 0 0)" />

      {layout.walls.map((w, i) => (
        <line
          key={i}
          x1={w.x1}
          y1={w.y1}
          x2={w.x2}
          y2={w.y2}
          stroke="oklch(1 0 0 / 25%)"
          strokeWidth={0.4}
          vectorEffect="non-scaling-stroke"
        />
      ))}

      {layout.rects.map((r) => (
        <g key={r.label}>
          <rect
            x={r.x}
            y={r.y}
            width={r.width}
            height={r.height}
            fill="oklch(1 0 0 / 4%)"
            stroke="oklch(1 0 0 / 15%)"
            strokeWidth={0.4}
            vectorEffect="non-scaling-stroke"
          />
          {r.label && (
            <text
              x={r.x + r.width / 2}
              y={r.y + r.height / 2}
              fill="oklch(0.62 0 0)"
              fontSize={2.6}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="var(--font-jetbrains-mono)"
              letterSpacing={0.3}
            >
              {r.label}
            </text>
          )}
        </g>
      ))}

      {layout.labels.map((l) => (
        <text
          key={l.text}
          x={l.x}
          y={l.y}
          fill="oklch(0.5 0 0)"
          fontSize={2.4}
          textAnchor="middle"
          fontFamily="var(--font-jetbrains-mono)"
          letterSpacing={0.3}
        >
          {l.text}
        </text>
      ))}

      {tables.map((t) => {
        const radius = Math.min(6.5, 3 + t.capacity * 0.4);
        const isSelected = selectedKey === t.key;
        const fill = t.isBooked
          ? "oklch(0.3 0 0)"
          : isSelected
            ? "oklch(0.667 0.295 322.15)"
            : t.isPremium
              ? "oklch(0.667 0.295 322.15 / 25%)"
              : "oklch(1 0 0 / 8%)";
        const stroke = t.isBooked
          ? "oklch(0.4 0 0)"
          : isSelected
            ? "oklch(0.667 0.295 322.15)"
            : t.isPremium
              ? "oklch(0.667 0.295 322.15 / 70%)"
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
              cx={t.positionXPct}
              cy={t.positionYPct}
              r={radius}
              fill={fill}
              stroke={stroke}
              strokeWidth={isSelected ? 1 : 0.5}
              vectorEffect="non-scaling-stroke"
            />
            <text
              x={t.positionXPct}
              y={t.positionYPct}
              fill={t.isBooked ? "oklch(0.5 0 0)" : "oklch(0.97 0 0)"}
              fontSize={2.8}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="var(--font-jetbrains-mono)"
              fontWeight={700}
              style={{ pointerEvents: "none" }}
            >
              {tableShortLabel(t.label)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
