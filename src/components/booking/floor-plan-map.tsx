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
// Floor 1's r91.5 and Floor 2's r67. Floor 2's plain VIP 1-5 tables were
// sized up further per request, but on the newer/smaller Floor 2 plan VIP3-5
// sit close enough to the diagonal sofa that r55 visibly overlapped it -
// r38 clears the sofa at every VIP position with a small margin.
function tableRadius(label: string, floor: 1 | 2) {
  if (/^(VVIP1|VVIP3)$/.test(label)) return 88;
  if (label === "VVIP2") return 63;
  if (floor === 2) return 38; // VIP 1-5
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
  // Floor 2, VVIP3 - the right-side lounge (moved down/right on the newer,
  // smaller Floor 2 plan), chamfered by the diagonal wall running from
  // (978,317.5) down to (843.4,493.3).
  "2:VVIP3": [
    { x: 978, y: 317.5 },
    { x: 843.396, y: 493.305 },
    { x: 1161, y: 492.5 },
    { x: 1161, y: 317.5 },
  ],
};

// Where the zone label reads for each VVIP room — the polygons above aren't
// centered on a nice point (diagonal chamfers skew the centroid), so these
// are hand-placed to sit clearly inside each room.
const VVIP_LABEL_POS: Record<string, { x: number; y: number }> = {
  "1:VVIP2": { x: 370.5, y: 481.5 },
  "1:VVIP1": { x: 990, y: 600 },
  "2:VVIP3": { x: 1030, y: 430 },
};

// The Floor 1 "ghost" behind Floor 2 peeks through wherever Floor 2's own
// (smaller) plan doesn't have a room - a broad band across the top of the
// canvas, carved out around VVIP3 following VVIP3's own diagonal wall so
// the clip edge lines up exactly with VVIP3's boundary (no gap between the
// ghost and VVIP3's zone).
const FLOOR1_GHOST_CLIP_POLYGON = [
  { x: 0, y: 0 },
  { x: 1161, y: 0 },
  { x: 1161, y: 317.5 },
  { x: 978, y: 317.5 },
  { x: 843.396, y: 493.305 },
  { x: 0, y: 493.305 },
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
                fontFamily="var(--font-google-sans)"
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
// tint instead of being washed out underneath it. Solid opaque white, no
// per-piece stroke - the entrance corner is built from three abutting
// rects (two straight + one rotated chamfer piece), and giving each one
// its own border drew visible seam lines where they meet/overlap. Sharing
// one flat fill with no outline makes them read as a single continuous
// sofa instead.
function FloorFurniture({ layout }: { layout: FloorLayout }) {
  return (
    <>
      {layout.furniture.map((f, i) => (
        <g key={i} transform={f.transform} style={{ pointerEvents: "none" }}>
          <rect x={f.x} y={f.y} width={f.width} height={f.height} rx={f.rx} fill="oklch(1 0 0)" />
          {f.label && (
            <text
              x={f.x + f.width / 2}
              y={f.y + f.height / 2}
              fill="oklch(0.2 0 0)"
              fontSize={Math.min(f.width, f.height) * 0.35}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="var(--font-google-sans)"
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
  dimmed = false,
}: {
  table: FloorTable;
  floor: 1 | 2;
  isSelected: boolean;
  onSelect: (table: FloorTable) => void;
  selectableWhenBooked: boolean;
  interactive: boolean;
  /** True for the non-interactive Floor 1 ghost shown behind Floor 2 - every
   * table reads as flat unavailable-gray there regardless of its real
   * booking/selection state, since it's just background context for "you're
   * on Floor 2 now", not a live picker. */
  dimmed?: boolean;
}) {
  const { radius, cx, cy, polygon, labelPos } = tableMarkerGeometry(table, floor);
  // Regular tables read as the same solid maroon/red circle. A VVIP/VVIP-
  // lounge zone instead draws two layers: the whole room outline tinted a
  // translucent white "zone" wash, plus a small solid badge - sized to just
  // fit its label - in the same red as the regular tables, so VVIP reads as
  // a named badge inside a highlighted room rather than one big red room.
  // Available = brand orange (--primary). Selected switches to green rather
  // than reusing that same orange, so a picked table still reads distinctly
  // from every other available one.
  const fill = dimmed
    ? "oklch(0.32 0 0)"
    : table.isBooked
      ? "oklch(0.3 0 0)"
      : isSelected
        ? "oklch(0.65 0.2 145)"
        : "oklch(0.72 0.19 55)";
  const stroke = dimmed
    ? "oklch(0.45 0 0)"
    : table.isBooked
      ? "oklch(0.4 0 0)"
      : isSelected
        ? "oklch(0.5 0.2 145)"
        : "oklch(0.55 0.19 55)";
  const zoneFill = dimmed
    ? "oklch(0.32 0 0 / 40%)"
    : table.isBooked
      ? "oklch(0.3 0 0 / 40%)"
      : isSelected
        ? "oklch(0.65 0.2 145 / 50%)"
        : "oklch(1 0 0 / 50%)";
  const zoneStroke = dimmed
    ? "oklch(0.45 0 0 / 60%)"
    : table.isBooked
      ? "oklch(0.4 0 0 / 60%)"
      : isSelected
        ? "oklch(0.5 0.2 145 / 80%)"
        : "oklch(1 0 0 / 70%)";

  // Badge box sized to fit the label text (monospace, so a per-character
  // width estimate is exact enough) plus a comfortable padding, rather than
  // a fixed size that would either clip a longer label or float loose
  // around a shorter one.
  const badgeFontSize = 24;
  const badgeCharWidth = badgeFontSize * 0.62;
  const badgePaddingX = 20;
  const badgePaddingY = 14;
  const badgeWidth = table.label.length * badgeCharWidth + badgePaddingX * 2;
  const badgeHeight = badgeFontSize + badgePaddingY * 2;

  return (
    <g
      role={interactive ? "button" : undefined}
      aria-label={interactive ? `${table.label}, seats ${table.capacity}${table.isBooked ? ", sold out" : ""}` : undefined}
      onClick={interactive ? () => (selectableWhenBooked || !table.isBooked) && onSelect(table) : undefined}
      style={{ cursor: interactive ? (!selectableWhenBooked && table.isBooked ? "not-allowed" : "pointer") : undefined }}
    >
      {polygon ? (
        <>
          <polygon
            points={polygon.map((p) => `${p.x},${p.y}`).join(" ")}
            fill={zoneFill}
            stroke={zoneStroke}
            strokeWidth={isSelected ? 4 : 2}
            strokeLinejoin="round"
          />
          <rect
            x={labelPos.x - badgeWidth / 2}
            y={labelPos.y - badgeHeight / 2}
            width={badgeWidth}
            height={badgeHeight}
            rx={6}
            fill={fill}
            stroke={stroke}
            strokeWidth={isSelected ? 3 : 1.5}
            style={{ pointerEvents: "none" }}
          />
        </>
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
function TableLabel({ table, floor, dimmed = false }: { table: FloorTable; floor: 1 | 2; dimmed?: boolean }) {
  const { radius, polygon, labelPos } = tableMarkerGeometry(table, floor);
  return (
    <text
      x={labelPos.x}
      y={labelPos.y}
      fill={dimmed ? "oklch(0.62 0 0)" : table.isBooked ? "oklch(0.5 0 0)" : "oklch(0.97 0 0)"}
      fontSize={polygon ? 24 : Math.min(radius * 0.42, 22)}
      textAnchor="middle"
      dominantBaseline="middle"
      fontFamily="var(--font-google-sans)"
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
          {floor1Tables.filter((t) => !t.isPremium).map((t) => (
            <TableMarker
              key={t.key}
              table={t}
              floor={1}
              isSelected={selectedKeys.has(t.key)}
              onSelect={onSelect}
              selectableWhenBooked={selectableWhenBooked}
              interactive={false}
              dimmed
            />
          ))}
          <FloorFurniture layout={FLOOR_LAYOUTS[1]} />
          {/* VVIP zones (wash + badge) paint after furniture so a room's own
              stools/sofa never sit on top of its zone tint or badge. */}
          {floor1Tables.filter((t) => t.isPremium).map((t) => (
            <TableMarker
              key={t.key}
              table={t}
              floor={1}
              isSelected={selectedKeys.has(t.key)}
              onSelect={onSelect}
              selectableWhenBooked={selectableWhenBooked}
              interactive={false}
              dimmed
            />
          ))}
          {floor1Tables.map((t) => (
            <TableLabel key={t.key} table={t} floor={1} dimmed />
          ))}
        </g>
        {/* The gray tint wash - a translucent overlay, not a color swap, so
            Floor 1's shapes stay visible underneath, just heavily muted -
            this is background context for "you're on Floor 2 now", not a
            live picker. */}
        <rect
          x={0}
          y={0}
          width={FLOOR_LAYOUTS[1].width}
          height={FLOOR_LAYOUTS[1].height}
          fill="oklch(0.55 0 0 / 65%)"
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
            fontFamily="var(--font-google-sans)"
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
            fontFamily="var(--font-google-sans)"
            style={{ pointerEvents: "none" }}
          >
            {l.text}
          </text>
        ))}

        {tables.filter((t) => !t.isPremium).map((t) => (
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

        {/* VVIP zones (wash + badge) paint after furniture so a room's own
            stools/sofa never sit on top of its zone tint or badge. */}
        {tables.filter((t) => t.isPremium).map((t) => (
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

        {tables.map((t) => (
          <TableLabel key={t.key} table={t} floor={floor} />
        ))}
      </g>
    </svg>
  );
}
