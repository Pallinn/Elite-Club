import { useLayoutEffect, useRef, useState } from "react";
import { CANVAS, FLOOR_LAYOUTS, type FloorLayout } from "@/lib/venue-map";

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

// Radius (in floor-plan pixels) calibrated to the actual Figma table sizes -
// purely visual, traced from the artwork. Deliberately keyed off the table's
// *drawn* size bucket rather than its bookable capacity (which can change
// independently, e.g. for pricing/provisions), so re-tiering capacity never
// moves or resizes a marker on the floor plan.
// Plain tables ≈ r36.5, the booth ≈ r63, the lounges average ≈ r88 between
// Floor 1's r91.5 and Floor 2's r67. Floor 2's plain VIP 1-5 tables are sized
// up further per request.
function tableRadius(label: string, floor: 1 | 2) {
  if (/^(VVIP1|VVIP3)$/.test(label)) return 88;
  if (label === "VVIP2") return 63;
  if (floor === 2) return 55; // VIP 1-5
  return 36.5; // Floor 1 numbered tables 1-16
}

// The map scales fluidly to fit any container width, so on a ~375px phone
// the small (cap-4) tables render at well under a 44px touch target. Rather
// than resize the visible circle (which would change desktop too), give
// every table an invisible hit-circle at least this SVG-unit radius - purely
// a larger click/tap area, no visual difference on any screen size.
const MIN_HIT_RADIUS = 66;

// VVIP tables sit in a booth/lounge on the floor plan, not just their own
// circle - the click target (and its decoration) should cover that whole
// room, not just the small marker. Traced from the same wall/furniture
// coordinates as FLOOR_LAYOUTS (see venue-map.ts), in each floor's own
// native coordinate space, since these rooms are cut by diagonal walls, not
// plain rectangles.
const VVIP_ZONE_POLYGONS: Record<string, { x: number; y: number }[]> = {
  // Floor 1, VVIP2 - the plain rectangular booth (matches the furniture rect
  // at x:235.5 y:403.5 w:270 h:156 in venue-map.ts exactly).
  "1:VVIP2": [
    { x: 235.5, y: 403.5 },
    { x: 505.5, y: 403.5 },
    { x: 505.5, y: 559.5 },
    { x: 235.5, y: 559.5 },
  ],
  // Floor 1, VVIP1 - the corner lounge, chamfered by the diagonal wall
  // running from (807.5,569) up to (888.4,430.7) then flat to the right
  // edge (1140,430.5), down to the floor's bottom-right corner.
  "1:VVIP1": [
    { x: 807.5, y: 830 },
    { x: 807.5, y: 569 },
    { x: 888.393, y: 430.744 },
    { x: 1140, y: 430.5 },
    { x: 1140, y: 830 },
  ],
  // Floor 2, VVIP3 - the top-right corner lounge, chamfered by the diagonal
  // wall running from (1087.37,0) down to (842.37,273.33).
  "2:VVIP3": [
    { x: 1087.4, y: 0 },
    { x: 842.4, y: 273.3 },
    { x: 1161, y: 273.5 },
    { x: 1161, y: 0 },
  ],
};

// Where the zone label reads for each VVIP room — the polygons above aren't
// centered on a nice point (diagonal chamfers skew the centroid), so these
// are hand-placed to sit clearly inside each room.
const VVIP_LABEL_POS: Record<string, { x: number; y: number }> = {
  "1:VVIP2": { x: 370.5, y: 481.5 },
  "1:VVIP1": { x: 990, y: 650 },
  "2:VVIP3": { x: 1070, y: 180 },
};

// The Floor 1 "ghost" behind Floor 2 only peeks through in the strip above
// the stairwell landing, to the left of VVIP3. A plain rectangle here would
// slice straight through Floor 1's STAGE box wherever it happens to cross
// x=843, leaving an ugly hard-edged gap between the cut-off STAGE and
// VVIP3's triangle. Following VVIP3's own diagonal wall instead means the
// clip edge lines up exactly with VVIP3's boundary - no gap, and STAGE only
// loses the small corner that would genuinely fall inside VVIP3's room.
const FLOOR1_GHOST_CLIP_POLYGON = [
  { x: 0, y: 0 },
  { x: 1087.37, y: 0 },
  { x: 842.372, y: 273.334 },
  { x: 0, y: 273.334 },
];

// Walls and STAGE/BAR-style rects only - the static shell of the floor,
// drawn first (underneath tables and furniture).
function FloorBase({ layout }: { layout: FloorLayout }) {
  return (
    <>
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

      {layout.rects
        .filter((r) => !r.void)
        .map((r, i) => (
          <g key={i}>
            <rect
              x={r.x}
              y={r.y}
              width={r.width}
              height={r.height}
              transform={r.transform}
              fill={r.label ? "oklch(1 0 0 / 10%)" : "oklch(1 0 0 / 4%)"}
              stroke="oklch(1 0 0 / 15%)"
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
    </>
  );
}

// Sofas and stools - drawn *after* the tables/VVIP zone polygons (see
// FloorPlanMap's render order) so the sofa sits on top of a VVIP zone's
// orange tint instead of being washed out underneath it.
function FloorFurniture({ layout }: { layout: FloorLayout }) {
  return (
    <>
      {layout.furniture.map((f, i) => (
        <g key={i} transform={f.transform} style={{ pointerEvents: "none" }}>
          <rect x={f.x} y={f.y} width={f.width} height={f.height} rx={f.rx} fill="oklch(0.5 0.19 25)" />
          {f.label && (
            <text
              x={f.x + f.width / 2}
              y={f.y + f.height / 2}
              fill="oklch(0.9 0.05 25)"
              fontSize={Math.min(f.width, f.height) * 0.35}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="var(--font-jetbrains-mono)"
              letterSpacing={1}
            >
              {f.label}
            </text>
          )}
        </g>
      ))}

      {layout.furnitureCircles.map((c, i) => (
        <circle
          key={i}
          cx={c.cx}
          cy={c.cy}
          r={c.r}
          fill="oklch(0.25 0 0)"
          stroke="oklch(1 0 0 / 20%)"
          strokeWidth={1.5}
          style={{ pointerEvents: "none" }}
        />
      ))}
    </>
  );
}

// Shared geometry for a table marker - used by both TableMarker (the shape)
// and TableLabel (the text), which are rendered in two separate passes (see
// FloorPlanMap) so the text always ends up on top of the furniture layer
// drawn in between, instead of getting covered by a sofa/stool.
function tableMarkerGeometry(table: FloorTable, floor: 1 | 2) {
  const layout = FLOOR_LAYOUTS[floor];
  const radius = tableRadius(table.label, floor);
  const cx = (table.positionXPct / 100) * layout.width;
  const cy = (table.positionYPct / 100) * layout.height;
  const polygon = table.isPremium ? VVIP_ZONE_POLYGONS[`${floor}:${table.label}`] : undefined;
  const labelPos = polygon
    ? (VVIP_LABEL_POS[`${floor}:${table.label}`] ?? { x: cx, y: cy })
    : { x: cx, y: cy };
  return { radius, cx, cy, polygon, labelPos };
}

// A single table's shape (circle or VVIP zone polygon) — shared by the live,
// clickable floor view and the non-interactive Floor 1 ghost behind Floor 2,
// so the ghost is guaranteed to look exactly like Floor 1 itself rather than
// a separately-maintained approximation.
function TableMarker({
  table,
  floor,
  isSelected,
  onSelect,
  selectableWhenBooked,
  interactive,
}: {
  table: FloorTable;
  floor: 1 | 2;
  isSelected: boolean;
  onSelect: (table: FloorTable) => void;
  selectableWhenBooked: boolean;
  interactive: boolean;
}) {
  const { radius, cx, cy, polygon } = tableMarkerGeometry(table, floor);
  const fill = table.isBooked
    ? "oklch(0.3 0 0)"
    : isSelected
      ? "oklch(0.72 0.19 55)"
      : table.isPremium
        ? "oklch(0.72 0.19 55 / 25%)"
        : "oklch(1 0 0 / 8%)";
  const stroke = table.isBooked
    ? "oklch(0.4 0 0)"
    : isSelected
      ? "oklch(0.72 0.19 55)"
      : table.isPremium
        ? "oklch(0.72 0.19 55 / 70%)"
        : "oklch(1 0 0 / 30%)";

  return (
    <g
      role={interactive ? "button" : undefined}
      aria-label={interactive ? `${table.label}, seats ${table.capacity}${table.isBooked ? ", sold out" : ""}` : undefined}
      onClick={interactive ? () => (selectableWhenBooked || !table.isBooked) && onSelect(table) : undefined}
      style={{ cursor: interactive ? (!selectableWhenBooked && table.isBooked ? "not-allowed" : "pointer") : undefined }}
    >
      {polygon ? (
        <polygon
          points={polygon.map((p) => `${p.x},${p.y}`).join(" ")}
          fill={fill}
          stroke={stroke}
          strokeWidth={isSelected ? 4 : 2}
          strokeLinejoin="round"
        />
      ) : (
        <>
          {interactive && radius < MIN_HIT_RADIUS && (
            <circle cx={cx} cy={cy} r={MIN_HIT_RADIUS} fill="transparent" style={{ pointerEvents: "all" }} />
          )}
          <circle cx={cx} cy={cy} r={radius} fill={fill} stroke={stroke} strokeWidth={isSelected ? 4 : 2} />
        </>
      )}
    </g>
  );
}

// A table's label text, rendered as its own pass on top of the furniture
// layer (see FloorPlanMap) so it never gets covered by a sofa/stool sitting
// inside the same VVIP zone.
function TableLabel({ table, floor }: { table: FloorTable; floor: 1 | 2 }) {
  const { radius, polygon, labelPos } = tableMarkerGeometry(table, floor);
  return (
    <text
      x={labelPos.x}
      y={labelPos.y}
      fill={table.isBooked ? "oklch(0.5 0 0)" : "oklch(0.97 0 0)"}
      fontSize={polygon ? 24 : Math.min(radius * 0.42, 22)}
      textAnchor="middle"
      dominantBaseline="middle"
      fontFamily="var(--font-jetbrains-mono)"
      fontWeight={700}
      style={{ pointerEvents: "none" }}
    >
      {table.label}
    </text>
  );
}

export function FloorPlanMap({
  floor,
  tables,
  allTables,
  selectedKeys,
  onSelect,
  onSwitchFloor,
  selectableWhenBooked = false,
}: {
  floor: 1 | 2;
  tables: FloorTable[];
  /** Full table list (all floors), used to render Floor 1's tables in the
   * Floor 2 ghost preview. Falls back to `tables` if omitted, so the ghost
   * just won't show tables when the active floor isn't 1. */
  allTables?: FloorTable[];
  selectedKeys: Set<string>;
  onSelect: (table: FloorTable) => void;
  onSwitchFloor: (floor: 1 | 2) => void;
  /** Admin table manager needs to click booked tables too (to view/edit their
   * roster) — the public booking map keeps booked tables unclickable so
   * guests can't select an unavailable table. */
  selectableWhenBooked?: boolean;
}) {
  const layout = FLOOR_LAYOUTS[floor];
  const otherFloor = floor === 1 ? 2 : 1;
  const floorPlateFill = "oklch(0.09 0 0)";

  // Both floors render into the same CANVAS box (see venue-map.ts) so they're
  // always the same physical size. A floor's own coordinates stay untouched
  // in its native viewBox space (so rotated furniture keeps its exact Figma
  // shape); a single uniform scale+translate wrapper fits that native space
  // into CANVAS without distorting anything.
  const scale = CANVAS.height / layout.height;
  const offsetX = (CANVAS.width - layout.width * scale) / 2;
  const wrapTransform = `translate(${offsetX} 0) scale(${scale})`;

  const floor1Scale = CANVAS.height / FLOOR_LAYOUTS[1].height;
  const floor1OffsetX = (CANVAS.width - FLOOR_LAYOUTS[1].width * floor1Scale) / 2;
  const floor1Tables = (allTables ?? tables).filter((t) => t.floor === 1);

  // Floor 2's own layout fades in a beat after the Floor 1 preview, rather
  // than popping in instantly. Driven by state + a CSS *transition* (not a
  // keyframe @animation) deliberately: this component re-renders on every
  // SWR poll (booking.tsx refetches availability every 5s) even when
  // `floor` hasn't changed, and re-applying an `animation` shorthand on an
  // unrelated re-render restarts it from scratch every time, so it never
  // finishes. A transition just re-targets the same value and is a no-op
  // when nothing changed, so it isn't affected by that polling.
  const [contentOpacity, setContentOpacity] = useState(1);
  const prevFloorRef = useRef(floor);
  useLayoutEffect(() => {
    if (prevFloorRef.current === floor) return;
    prevFloorRef.current = floor;
    setContentOpacity(0);
    const id = setTimeout(() => setContentOpacity(1), floor === 2 ? 150 : 0);
    return () => clearTimeout(id);
  }, [floor]);

  return (
    <svg
      viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
      className="h-auto w-full select-none rounded-lg border border-white/10 bg-neutral-950"
      style={{ aspectRatio: CANVAS.width / CANVAS.height }}
    >
      <rect x={0} y={0} width={CANVAS.width} height={CANVAS.height} fill={floorPlateFill} />

      {/* Clicking Floor 2 plays two beats: the Floor 1 preview (exactly what
          Floor 1 looks like, tinted light gray, peeking through only in the
          strip left of VVIP3) fades in first, then Floor 2's own layout
          fades in on top a moment later. Both directions crossfade smoothly
          instead of popping in/out. */}
      <defs>
        <clipPath id="floor1-ghost-clip">
          <polygon points={FLOOR1_GHOST_CLIP_POLYGON.map((p) => `${p.x},${p.y}`).join(" ")} />
        </clipPath>
      </defs>
      <g
        clipPath="url(#floor1-ghost-clip)"
        aria-hidden="true"
        style={{
          opacity: floor === 2 ? 1 : 0,
          transition: "opacity 400ms ease",
          pointerEvents: "none",
        }}
      >
        <g transform={`translate(${floor1OffsetX} 0) scale(${floor1Scale})`}>
          <FloorBase layout={FLOOR_LAYOUTS[1]} />
          {floor1Tables.map((t) => (
            <TableMarker
              key={t.key}
              table={t}
              floor={1}
              isSelected={selectedKeys.has(t.key)}
              onSelect={onSelect}
              selectableWhenBooked={selectableWhenBooked}
              interactive={false}
            />
          ))}
          <FloorFurniture layout={FLOOR_LAYOUTS[1]} />
          {floor1Tables.map((t) => (
            <TableLabel key={t.key} table={t} floor={1} />
          ))}
        </g>
        {/* The light-gray tint wash - a translucent overlay, not a color
            swap, so Floor 1's real colors (the sofa's maroon, etc.) still
            show through faintly underneath. */}
        <rect
          x={0}
          y={0}
          width={FLOOR_LAYOUTS[1].width}
          height={FLOOR_LAYOUTS[1].height}
          fill="oklch(0.85 0 0 / 45%)"
        />
      </g>

      <g
        transform={wrapTransform}
        style={{ opacity: contentOpacity, transition: "opacity 350ms ease" }}
      >
        <FloorBase layout={layout} />

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

        {tables.map((t) => (
          <TableMarker
            key={t.key}
            table={t}
            floor={floor}
            isSelected={selectedKeys.has(t.key)}
            onSelect={onSelect}
            selectableWhenBooked={selectableWhenBooked}
            interactive
          />
        ))}

        <FloorFurniture layout={layout} />

        {tables.map((t) => (
          <TableLabel key={t.key} table={t} floor={floor} />
        ))}
      </g>
    </svg>
  );
}
