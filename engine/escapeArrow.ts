/**
 * engine/escapeArrow.ts
 *
 * Handle group escaping, checking win conditions, and detecting deadlock conditions.
 */

import { canGroupEscape } from "./canEscape";
import type { GridState } from "./types";

/**
 * Returns a new GridState where the specified group is marked as isRemoving (sliding out).
 * This starts the animation.
 */
export function startRemovingGroup(grid: GridState, groupId: string): GridState {
  const group = grid.groups[groupId];
  if (!group || group.isRemoved || group.isRemoving) return grid;

  const newGroups = { ...grid.groups };
  newGroups[groupId] = {
    ...group,
    isRemoving: true,
  };

  return {
    ...grid,
    groups: newGroups,
  };
}

/**
 * Returns a new GridState with the group and all its cells marked as fully removed.
 * Called once the slide-out animation finishes.
 */
export function escapeGroup(grid: GridState, groupId: string): GridState {
  const group = grid.groups[groupId];
  if (!group) return grid;

  const newGroups = { ...grid.groups };
  newGroups[groupId] = {
    ...group,
    isRemoved: true,
    isRemoving: false,
  };

  const newCells = { ...grid.cells };
  for (const cid of group.cellIds) {
    if (newCells[cid]) {
      newCells[cid] = {
        ...newCells[cid],
        isRemoved: true,
      };
    }
  }

  return {
    ...grid,
    cells: newCells,
    groups: newGroups,
    removedGroups: grid.removedGroups + 1,
  };
}

/**
 * Returns true if all groups on the board have escaped.
 */
export function checkWin(grid: GridState): boolean {
  return grid.removedGroups === grid.totalGroups;
}

/**
 * Returns true if there are remaining groups but none of them can escape.
 */
export function isDeadlock(grid: GridState): boolean {
  if (grid.removedGroups === grid.totalGroups) return false;

  for (const group of Object.values(grid.groups)) {
    if (!group.isRemoved && !group.isRemoving && canGroupEscape(grid, group.id)) {
      return false; // at least one group can escape
    }
  }

  return true; // deadlock
}
