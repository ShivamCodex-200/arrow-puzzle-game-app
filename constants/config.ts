import { getGridSize } from "../engine/generateLevel";

export const GRID_PADDING = 0; // Grid content padding is 0 as padding is handled by the board container
export const CELL_GAP = 2; // gap between cells (density)

export function getCellSize(screenWidth: number, cols: number): number {
  // Target board container width = 80% screen width
  const boardWidth = Math.floor(screenWidth * 0.80);
  // Grid content width = boardWidth minus 16px padding on left & right (32px total)
  const contentWidth = boardWidth - 32;
  const totalGap = CELL_GAP * (cols - 1);
  return Math.floor((contentWidth - totalGap) / cols);
}

export function getDifficulty(level: number): "Easy" | "Normal" | "Hard" {
  if (level <= 10) return "Easy";
  if (level <= 50) return "Normal";
  return "Hard";
}

export { getGridSize };

