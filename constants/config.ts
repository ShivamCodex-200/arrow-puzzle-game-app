import { getGridSize } from '../engine/pathGenerator';

export const GRID_PADDING = 4;
export const CELL_GAP = 0;      // ZERO gap — critical for maze look

export function getCellSize(screenWidth: number, cols: number): number {
  return Math.max(20, Math.floor((screenWidth - GRID_PADDING * 2) / cols));
}

export function getDifficulty(level: number): 'Easy' | 'Normal' | 'Hard' {
  if (level <= 10) return 'Easy';
  if (level <= 50) return 'Normal';
  return 'Hard';
}

export { getGridSize };
