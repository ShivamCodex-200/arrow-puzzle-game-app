export type Direction = 'up' | 'down' | 'left' | 'right';

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

export interface GridState {
  rows: number;
  cols: number;
  arrows: Arrow[];
  levelNumber: number;
  totalArrows: number;
  removedCount: number;
}
