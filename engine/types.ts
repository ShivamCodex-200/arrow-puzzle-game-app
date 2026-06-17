/**
 * engine/types.ts
 *
 * CORRECT Arrow Escape game model:
 * - Every active cell has exactly ONE arrow glyph
 * - Groups = maximal contiguous same-direction cells in a straight line
 * - HEAD = leading edge (first to exit the board)
 * - cellIds ordering: [0] = tail (innermost), [last] = head (leading edge)
 */

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Cell {
  id: string;        // "${col}-${row}"
  col: number;
  row: number;
  direction: Direction;
  groupId: string;
  isRemoved: boolean;
}

export interface Group {
  id: string;
  direction: Direction;
  cellIds: string[];  // [0]=tail (innermost), [last]=head (leading edge)
  isRemoved: boolean;
  isRemoving: boolean; // escape animation in progress
}

export interface GridState {
  rows: number;
  cols: number;
  cells: Record<string, Cell>;    // key = "${col}-${row}"
  groups: Record<string, Group>;  // key = groupId
  shapeMask: boolean[][];         // [row][col], true = active cell
  levelNumber: number;
  totalGroups: number;
  removedGroups: number;
  seed: number;
  difficulty: string;
}
