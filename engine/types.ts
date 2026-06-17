export type Direction = 'up' | 'down' | 'left' | 'right';

export interface PathPoint {
  col: number;
  row: number;
}

export interface Segment {
  id: string;
  direction: Direction;
  cells: PathPoint[];
  ghostCell: PathPoint;
  isRemoved: boolean;
  isRemoving: boolean;
}

export interface PuzzleState {
  levelNumber: number;
  rows: number;
  cols: number;
  segments: Segment[];
  cellToSegId: Record<string, string>;
  activeSegIds: Set<string>;
  seed: number;
  difficulty: string;
  totalSegments: number;
  shapeMask: boolean[][];
}

// Legacy types for compatibility
export interface Cell {
  id: string;
  col: number;
  row: number;
  direction: Direction;
  groupId: string;
  isRemoved: boolean;
}

export interface Group {
  id: string;
  direction: Direction;
  cellIds: string[];
  isRemoved: boolean;
  isRemoving: boolean;
}

export interface GridState {
  rows: number;
  cols: number;
  cells: Record<string, Cell>;
  groups: Record<string, Group>;
  shapeMask: boolean[][];
  levelNumber: number;
  totalGroups: number;
  removedGroups: number;
  seed: number;
  difficulty: string;
}
