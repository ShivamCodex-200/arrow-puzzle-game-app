/**
 * engine/canEscape.ts
 *
 * Check if a group of cells can escape.
 * A group can escape if its HEAD cell has a clear path to the edge
 * in its movement direction (no other active/unremoved cells in the way).
 * The group's own body cells do not block itself.
 */

import type { GridState } from "./types";

const DIR_DX = { up: 0, down: 0, left: -1, right: 1 };
const DIR_DY = { up: -1, down: 1, left: 0, right: 0 };

export function canGroupEscape(grid: GridState, groupId: string): boolean {
  const group = grid.groups[groupId];
  if (!group || group.isRemoved || group.isRemoving) return false;

  // The HEAD is the last element in group.cellIds
  const headId = group.cellIds[group.cellIds.length - 1];
  const head = grid.cells[headId];
  if (!head || head.isRemoved) return false;

  const dx = DIR_DX[group.direction];
  const dy = DIR_DY[group.direction];

  let cx = head.col + dx;
  let cy = head.row + dy;

  while (cx >= 0 && cx < grid.cols && cy >= 0 && cy < grid.rows) {
    const cid = `${cx}-${cy}`;
    const cell = grid.cells[cid];

    // If there is an active (unremoved) cell at this position
    // and it belongs to a different group, we are blocked.
    if (cell && !cell.isRemoved && cell.groupId !== groupId) {
      return false;
    }

    cx += dx;
    cy += dy;
  }

  return true;
}
