import { getGridSize } from '../engine/generateLevel';

export const GRID_PADDING = 24;      // horizontal padding on each side
export const CELL_GAP = 6;          // gap between cells
export const MAX_LEVELS_VISIBLE = 200;

export function getCellSize(screenWidth: number, cols: number): number {
  // Cell size = (available width - gaps between cells) / cols
  const available = screenWidth - GRID_PADDING * 2;
  const totalGap = CELL_GAP * (cols - 1);
  return Math.floor((available - totalGap) / cols);
}

export function getDifficulty(level: number): 'Easy' | 'Normal' | 'Hard' {
  if (level <= 10) return 'Easy';
  if (level <= 50) return 'Normal';
  return 'Hard';
}

export { getGridSize };
