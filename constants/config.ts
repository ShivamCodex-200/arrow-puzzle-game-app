import { getGridSize } from "../engine/generateLevel";

export const GRID_PADDING = 24; // horizontal padding fallback
export const CELL_GAP = 2; // gap between cells (reduced for density)

export function getCellSize(screenWidth: number, cols: number): number {
  // Core board width is 70% of screenWidth (total width ~80% with padding)
  const targetBoardWidth = screenWidth * 0.7;
  const totalGap = CELL_GAP * (cols - 1);
  return Math.floor((targetBoardWidth - totalGap) / cols);
}

export function getDifficulty(level: number): "Easy" | "Normal" | "Hard" {
  if (level <= 10) return "Easy";
  if (level <= 50) return "Normal";
  return "Hard";
}

export { getGridSize };

