// Decorative floor-plan geometry for the venue map (walls, furniture, labeled
// non-clickable blocks like BAR/STAGE). Purely visual — not stored in the
// database. Coordinates are the exact pixel values traced from the venue's
// Figma floor plan SVGs, used directly as the SVG viewBox so round tables
// stay perfectly round regardless of the floor's aspect ratio.

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

export type FloorLayout = {
  width: number;
  height: number;
  walls: VenueLine[];
  rects: VenueRect[];
  shapes: VenueShape[];
  labels: VenueLabel[];
  stairs: VenueStairs;
};

export const FLOOR_LAYOUTS: Record<1 | 2, FloorLayout> = {
  1: {
    width: 1140,
    height: 830,
    walls: [
      { x1: 888.94, y1: 430.504, x2: 1143.63, y2: 399.504 },
      { x1: -17.3932, y1: 83.6911, x2: 48.6068, y2: -0.308915 },
      { x1: 78, y1: 423.5, x2: -27, y2: 423.5 },
      { x1: 698.5, y1: 84.0054, x2: 697.5, y2: -8.99463 },
      { x1: 807.5, y1: 768.023, x2: 807.5, y2: 569 },
      { x1: 806.57, y1: 568.24, x2: 888.393, y2: 430.744 },
      { x1: 131, y1: 87, x2: 698, y2: 86.0173 },
      { x1: 77.5, y1: 422.996, x2: 79.5, y2: 149.996 },
      { x1: 79.609, y1: 149.688, x2: 130.609, y2: 85.6884 },
      { x1: 53.5, y1: 824, x2: 53.5, y2: 514 },
      { x1: 53.9971, y1: 650, x2: 807.003, y2: 650 },
    ],
    rects: [
      { x: 1063, y: 443, width: 81, height: 117 },
      { x: 757.5, y: 0.5, width: 301, height: 89, label: "STAGE" },
      { x: 235.5, y: 403.5, width: 270, height: 156 },
      { x: 222, y: 564, width: 585, height: 10 },
      { x: 511.5, y: 461.5, width: 291, height: 98, label: "BAR" },
    ],
    // The sofa by VVIP1 — one L-shaped (90°) piece, not two disconnected boxes.
    shapes: [
      { path: "M1093,597 L1136,597 L1136,693 L1140,693 L1140,748 L849,748 L849,693 L1093,693 Z" },
    ],
    labels: [{ x: 1130, y: 139, text: "← Entrance", align: "end" }],
    stairs: { x: 485, y: 611, text: "To 2nd Floor →", align: "middle" },
  },
  2: {
    width: 1161,
    height: 828,
    walls: [
      { x1: 522.742, y1: 828.572, x2: 1163.5, y2: 443.5 },
      { x1: 491.742, y1: 781.572, x2: 1185.74, y2: 362.572 },
      { x1: 1087.37, y1: 0.333955, x2: 842.372, y2: 273.334 },
      { x1: 491.997, y1: 781.5, x2: 47.9971, y2: 778.421 },
      { x1: 47.5, y1: 778, x2: 47.5, y2: 594 },
      { x1: 47.5, y1: 594.5, x2: 0, y2: 594.5 },
      { x1: 842, y1: 273.5, x2: 1161, y2: 273.5 },
    ],
    rects: [
      { x: 0, y: 428, width: 15, height: 158 },
      { x: 0, y: 273, width: 842, height: 92 },
      { x: 1161.74, y: 444.266, width: 330.428, height: 744.006, transform: "rotate(58.8976 1161.74 444.266)", void: true },
      { x: 946.377, y: -125.869, width: 187.913, height: 365.336, transform: "rotate(41.9129 946.377 -125.869)", void: true },
    ],
    shapes: [],
    labels: [],
    stairs: { x: 421, y: 319, text: "← To 1st Floor", align: "middle" },
  },
};
