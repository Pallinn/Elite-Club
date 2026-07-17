// Decorative floor-plan geometry for the venue map (walls, furniture blocks).
// Purely visual — not stored in the database. Coordinates are percentages
// (0-100 on each axis) traced directly from the venue's Figma floor plan.

export type VenueLabel = {
  x: number;
  y: number;
  text: string;
};

export type VenueRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
};

export type VenueLine = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type FloorLayout = {
  aspect: number; // width / height of the source floor plan, for CSS aspect-ratio
  walls: VenueLine[];
  rects: VenueRect[];
  labels: VenueLabel[];
};

export const FLOOR_LAYOUTS: Record<1 | 2, FloorLayout> = {
  1: {
    aspect: 1140 / 830,
    walls: [
      { x1: 42.72, y1: 56.02, x2: 23.25, y2: 43.61 },
      { x1: 49.47, y1: 36.38, x2: 29.91, y2: 23.86 },
      { x1: 78.16, y1: 99.76, x2: 70.82, y2: 92.49 },
      { x1: 70.83, y1: 92.53, x2: 70.83, y2: 68.55 },
      { x1: 48.68, y1: 46.39, x2: 52.81, y2: 33.73 },
      { x1: 23.25, y1: 43.61, x2: 29.91, y2: 23.86 },
      { x1: 70.79, y1: 68.49, x2: 77.97, y2: 51.93 },
      { x1: 11.49, y1: 10.48, x2: 61.23, y2: 10.36 },
      { x1: 6.84, y1: 50.96, x2: 7.02, y2: 18.07 },
      { x1: 7.02, y1: 18.07, x2: 11.49, y2: 10.36 },
      { x1: 68.6, y1: 12.41, x2: 88.95, y2: 12.29 },
      { x1: 88.95, y1: 12.29, x2: 88.95, y2: 0 },
      { x1: 4.74, y1: 99.28, x2: 4.74, y2: 61.93 },
      { x1: 4.74, y1: 76.75, x2: 17.02, y2: 81.69 },
      { x1: 17.02, y1: 81.69, x2: 21.14, y2: 67.47 },
      { x1: 4.74, y1: 61.93, x2: 47.63, y2: 76.75 },
      { x1: 47.63, y1: 76.75, x2: 70.79, y2: 76.75 },
      { x1: 42.9, y1: 56.51, x2: 49.47, y2: 36.39 },
      { x1: 78.6, y1: 52.17, x2: 52.81, y2: 33.74 },
      { x1: 48.77, y1: 45.9, x2: 73.6, y2: 61.93 },
      { x1: 27.63, y1: 49.28, x2: 23.25, y2: 65.18 },
    ],
    rects: [
      { x: 93.25, y: 53.37, width: 7.11, height: 14.1 },
      { x: 74.47, y: 88.31, width: 25.53, height: 6.63 },
      { x: 95.88, y: 71.93, width: 3.77, height: 18.19 },
    ],
    labels: [],
  },
  2: {
    aspect: 1161 / 828,
    walls: [
      { x1: 55.64, y1: 0, x2: 0, y2: 45.53 },
      { x1: 6.37, y1: 100, x2: 27.48, y2: 67.03 },
      { x1: 0, y1: 54.11, x2: 58.74, y2: 6.04 },
      { x1: 58.74, y1: 5.68, x2: 100, y2: 6.04 },
      { x1: 95, y1: 6.04, x2: 95, y2: 28.26 },
      { x1: 95, y1: 28.26, x2: 100, y2: 28.26 },
      { x1: 0, y1: 63.65, x2: 16.97, y2: 65.82 },
      { x1: 16.97, y1: 65.82, x2: 20.24, y2: 78.14 },
    ],
    rects: [
      { x: 98.71, y: 29.23, width: 1.29, height: 19.08 },
      { x: 27.48, y: 55.92, width: 72.53, height: 11.11 },
    ],
    labels: [],
  },
};
