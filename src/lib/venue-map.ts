// Decorative floor-plan geometry for the venue map (walls, furniture, labeled
// non-clickable blocks like BAR/STAGE/SOFA). Purely visual — not stored in the
// database. Coordinates are the exact pixel values traced from the venue's
// Figma floor plan SVGs ("Floor 1 (4).svg" / "Floor 2 (3).svg"), copied
// verbatim in each floor's own native viewBox space so rotated furniture
// (the diagonal sofa corners) renders identically to the Figma export.
//
// Floor 1's native SVG is 1140x830, Floor 2's is 1161x828. To make both
// floors render at the same physical size, FloorPlanMap wraps Floor 1's
// content in a single uniform `scale + translate` group that fits it into
// the shared CANVAS box below — a plain wrapper transform, not per-shape
// rescaling, so rotations/clipping stay mathematically correct.

/** The shared viewBox both floors render into, so Floor 1 and Floor 2 are
 * always the same physical size and can be composited together. */
export const CANVAS = { width: 1161, height: 828 };

export type VenueRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  transform?: string;
  label?: string;
  /** True for "nothing/outside the floor" blocks — blend into the background instead of showing as furniture. */
  void?: boolean;
};

export type VenueShape = {
  path: string;
};

export type VenueLine = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type VenueLabel = {
  x: number;
  y: number;
  text: string;
  align?: "start" | "middle" | "end";
};

export type VenueStairs = {
  x: number;
  y: number;
  text: string;
  align?: "start" | "middle" | "end";
};

/** Decorative, non-clickable furniture (sofas, stools) — description only. */
export type VenueFurniture = {
  x: number;
  y: number;
  width: number;
  height: number;
  transform?: string;
  rx?: number;
  label?: string;
};

export type VenueFurnitureCircle = {
  cx: number;
  cy: number;
  r: number;
};

export type FloorLayout = {
  /** Native SVG viewBox size this floor's coordinates were traced in. */
  width: number;
  height: number;
  walls: VenueLine[];
  rects: VenueRect[];
  shapes: VenueShape[];
  labels: VenueLabel[];
  stairs: VenueStairs;
  furniture: VenueFurniture[];
  furnitureCircles: VenueFurnitureCircle[];
};

export const FLOOR_LAYOUTS: Record<1 | 2, FloorLayout> = {
  1: {
    width: 1140,
    height: 830,
    walls: [
      { x1: 888.94, y1: 430.5, x2: 1140, y2: 430.5 },
      { x1: -17.3932, y1: 83.6911, x2: 48.6068, y2: -0.308915 },
      { x1: 78, y1: 423.5, x2: -27, y2: 423.5 },
      { x1: 697, y1: 86.0027, x2: 697, y2: -7.00269 },
      { x1: 807.5, y1: 768.023, x2: 807.5, y2: 569 },
      { x1: 806.57, y1: 568.24, x2: 888.393, y2: 430.744 },
      { x1: 130, y1: 86.2544, x2: 698, y2: 86.2544 },
      { x1: 78.5, y1: 423.004, x2: 78.5, y2: 149.996 },
      { x1: 78.7214, y1: 150.677, x2: 130.387, y2: 85.5115 },
      { x1: 53.5, y1: 824, x2: 53.5, y2: 514 },
      { x1: 53.9971, y1: 650, x2: 807.003, y2: 650 },
    ],
    rects: [
      { x: 757.5, y: 0.5, width: 301, height: 89, label: "STAGE" },
      { x: 235.5, y: 403.5, width: 270, height: 156 },
      { x: 222, y: 564, width: 585, height: 10 },
      { x: 511.5, y: 461.5, width: 291, height: 98, label: "BAR" },
      // The stairwell down to the ground floor — an opening, not furniture.
      { x: 54, y: 651, width: 753, height: 179, void: true },
    ],
    shapes: [],
    labels: [{ x: 1130, y: 139, text: "← Entrance", align: "end" }],
    stairs: { x: 485, y: 611, text: "To 2nd Floor →", align: "middle" },
    furniture: [
      // VVIP1 lounge sofas — one continuous vertical bar (the two rects
      // Figma split it into were flush, so merged into one) plus the
      // bottom horizontal bar, forming an L.
      { x: 1085, y: 455, width: 51, height: 293, label: "SOFA" },
      { x: 849, y: 682, width: 287, height: 66, label: "SOFA" },
      // VVIP2 booth sofas (left, right, bottom)
      { x: 242, y: 437, width: 51, height: 117, label: "SOFA" },
      { x: 447, y: 437, width: 51, height: 117, label: "SOFA" },
      { x: 302.192, y: 553.528, width: 39.0377, height: 135.944, transform: "rotate(-90 302.192 553.528)", label: "SOFA" },
      // Entrance sofas — top strip, chamfered corner piece, left strip,
      // one continuous ribbon around the entrance.
      { x: 112, y: -3, width: 585, height: 89, label: "SOFA" },
      { x: -12.3979, y: 77.9193, width: 349.166, height: 116.222, transform: "rotate(-51.84 -12.3979 77.9193)" },
      { x: -11, y: 423, width: 356, height: 89, transform: "rotate(-90 -11 423)", label: "SOFA" },
    ],
    furnitureCircles: [],
  },
  2: {
    width: 1161,
    height: 828,
    walls: [
      { x1: 522.742, y1: 828.572, x2: 1163.5, y2: 443.5 },
      { x1: 490.742, y1: 781.572, x2: 1184.74, y2: 362.572 },
      { x1: 1087.37, y1: 0.333955, x2: 842.372, y2: 273.334 },
      { x1: 496, y1: 778.875, x2: 46.9951, y2: 778.875 },
      { x1: 47.5, y1: 778, x2: 47.5, y2: 594 },
      { x1: 47.5, y1: 594.5, x2: 0, y2: 594.5 },
      { x1: 842, y1: 273.5, x2: 1161, y2: 273.5 },
    ],
    rects: [
      { x: 0, y: 428, width: 15, height: 158 },
      { x: 0, y: 273, width: 842, height: 92 },
      { x: 1161.74, y: 444.266, width: 330.428, height: 744.006, transform: "rotate(58.8976 1161.74 444.266)", void: true },
      { x: 946.377, y: -125.869, width: 187.913, height: 365.336, transform: "rotate(41.9129 946.377 -125.869)", void: true },
      // The double-height space above Floor 1's stage isn't a separate void
      // block anymore — FloorPlanMap always shows a tinted Floor 1 ghost
      // behind Floor 2, so this area just reads as open floor, same as the
      // rest of Floor 1's plan.
    ],
    shapes: [],
    labels: [],
    stairs: { x: 421, y: 319, text: "← To 1st Floor", align: "middle" },
    furniture: [
      { x: 0, y: 595, width: 47, height: 233, label: "SOFA" },
      { x: 47, y: 828, width: 49, height: 448, transform: "rotate(-90 47 828)", label: "SOFA" },
      { x: 1162.17, y: 377.415, width: 57.3853, height: 812.166, transform: "rotate(58.9 1162.17 377.415)", label: "SOFA" },
      // VVIP3 stools/side-table cluster
      { x: 1109, y: 92, width: 38, height: 117, rx: 10 },
      { x: 1058, y: 53, width: 41, height: 41, rx: 10 },
      { x: 1006, y: 105, width: 41, height: 41, rx: 10 },
      { x: 1006, y: 168, width: 41, height: 41, rx: 10 },
    ],
    furnitureCircles: [
      { cx: 1077, cy: 127.5, r: 19 },
      { cx: 1077, cy: 168.5, r: 19 },
      { cx: 1077, cy: 209.5, r: 19 },
    ],
  },
};
