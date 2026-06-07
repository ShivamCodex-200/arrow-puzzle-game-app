import type { Arrow, GridState, Point } from './types';

/**
 * Returns all grid cells occupied by the given arrow.
 * Since the arrow cells are stored directly, this returns the cells array itself.
 */
export function getOccupiedCells(arrow: Arrow): Point[] {
  return arrow.cells;
}

/**
 * Returns true if the arrow can escape the board in its exit direction.
 * The arrow crawls forward along its own path. Its body stays inside its original
 * path envelope, and its head moves straight forward along the exit direction.
 * Therefore, we only need to check if the exit path from the head (final cell) to the board edge is clear.
 */
export function canEscape(grid: GridState, arrowId: string): boolean {
  const arrow = grid.arrows.find(a => a.id === arrowId);
  if (!arrow || arrow.isRemoved) return false;

  // 1. Gather all cells occupied by OTHER active arrows
  const otherOccupied = new Set<string>();
  for (const a of grid.arrows) {
    if (a.id !== arrowId && !a.isRemoved) {
      for (const cell of a.cells) {
        otherOccupied.add(`${cell.x},${cell.y}`);
      }
    }
  }

  // 2. Check path from the head of this arrow (the last cell in the cells list) to the grid edge
  const head = arrow.cells[arrow.cells.length - 1];
  const dir = arrow.direction;
  let cx = head.x;
  let cy = head.y;

  while (true) {
    if (dir === 'right') cx++;
    else if (dir === 'left') cx--;
    else if (dir === 'down') cy++;
    else cy--;

    // Reached the edge of the board
    if (cx < 0 || cx >= grid.cols || cy < 0 || cy >= grid.rows) {
      break;
    }

    // Blocked by another active arrow
    if (otherOccupied.has(`${cx},${cy}`)) {
      return false;
    }
  }

  return true;
}
