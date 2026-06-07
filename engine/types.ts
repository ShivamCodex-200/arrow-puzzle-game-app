export type Direction = "up" | "down" | "left" | "right";

export type ShapeType =
  | "rectangle"
  | "circle"
  | "diamond"
  | "cross"
  | "spiral"
  | "donut"
  | "hex";

export interface Point {
  x: number; // column index (0 to cols-1)
  y: number; // row index (0 to rows-1)
}

export interface Arrow {
  id: string;
  direction: Direction;
  cells: Point[]; // ordered list of connected cells occupied by this arrow (tail to head)
  isRemoved: boolean;
}

export interface LevelMetrics {
  arrowCount: number;
  averageArrowLength: number;
  intersections: number;
  deadEnds: number;
  removableArrowsAtStart: number;
  branchingFactor: number;
}

export interface GridState {
  rows: number;
  cols: number;
  shape: ShapeType;
  shapeMask: boolean[][]; // rows x cols boolean array where true means cell is active
  arrows: Arrow[];
  levelNumber: number;
  totalArrows: number;
  removedCount: number;
  seed: number;
  difficulty: "Easy" | "Normal" | "Hard" | "Expert" | "Master";
  metrics: LevelMetrics;
}
