import type { GridState } from './types';
import { canEscape } from './canEscape';

/**
 * Returns a new GridState with the arrow marked as isRemoved: true.
 * Does not mutate the original.
 */
export function escapeArrow(grid: GridState, arrowId: string): GridState {
  const newArrows = grid.arrows.map(a =>
    a.id === arrowId ? { ...a, isRemoved: true } : a
  );

  return {
    ...grid,
    arrows: newArrows,
    removedCount: grid.removedCount + 1,
  };
}

/**
 * Returns true if all arrows on the board have escaped.
 */
export function checkWin(grid: GridState): boolean {
  return grid.removedCount === grid.totalArrows;
}

/**
 * Returns true if there are remaining arrows but none of them can escape.
 */
export function isDeadlock(grid: GridState): boolean {
  if (grid.removedCount === grid.totalArrows) return false;

  for (const a of grid.arrows) {
    if (!a.isRemoved && canEscape(grid, a.id)) {
      return false; // at least one can escape
    }
  }

  return true; // deadlock
}
