import { create } from "zustand";
import { canGroupEscape } from "../engine/canEscape";
import { checkWin, escapeGroup, isDeadlock } from "../engine/escapeArrow";
import { generateLevel } from "../engine/generateLevel";
import type { GridState, Cell, Group } from "../engine/types";

interface GameStore {
  grid: GridState | null;
  initialGrid: GridState | null;
  moves: number;
  isWon: boolean;
  isDeadlocked: boolean;
  lives: number;
  isGameOver: boolean;
  history: GridState[];
  hints: number;
  hintGroupIds: string[];
  selectedGroupId: string | null;

  loadLevel: (level: number) => void;
  tapGroup: (groupId: string) => boolean;
  removeGroupState: (groupId: string) => void;
  undoMove: () => void;
  useHint: () => void;
  clearHint: () => void;
  resetLevel: () => void;
  nextLevel: () => void;
}

// Deep clone GridState to ensure undo/history/reset works perfectly
const cloneGrid = (g: GridState): GridState => {
  const cells: Record<string, Cell> = {};
  for (const [k, v] of Object.entries(g.cells)) {
    cells[k] = { ...v };
  }
  const groups: Record<string, Group> = {};
  for (const [k, v] of Object.entries(g.groups)) {
    groups[k] = { ...v, cellIds: [...v.cellIds] };
  }
  return {
    ...g,
    cells,
    groups,
  };
};

export const useGameStore = create<GameStore>((set, get) => ({
  grid: null,
  initialGrid: null,
  moves: 0,
  isWon: false,
  isDeadlocked: false,
  lives: 3,
  isGameOver: false,
  history: [],
  hints: 3,
  hintGroupIds: [],
  selectedGroupId: null,

  // ── Load level ────────────────────────────────────────────────────────────
  loadLevel: (level: number) => {
    const lvl = Math.max(1, Math.floor(level));
    const grid = generateLevel(lvl);

    set({
      grid,
      initialGrid: cloneGrid(grid),
      moves: 0,
      isWon: false,
      isDeadlocked: false,
      lives: 3,
      isGameOver: false,
      selectedGroupId: null,
      history: [],
      hintGroupIds: [],
    });
  },

  // ── Tap group → returns true if escapes, false if blocked ─────────────────
  tapGroup: (groupId: string) => {
    const state = get();
    if (!state.grid || state.isWon || state.isDeadlocked || state.isGameOver) return false;

    const group = state.grid.groups[groupId];
    if (!group || group.isRemoved) return false;

    if (!canGroupEscape(state.grid, groupId)) {
      // Tap blocked group -> lose a life
      const newLives = Math.max(0, state.lives - 1);
      set({
        lives: newLives,
        isGameOver: newLives === 0,
        selectedGroupId: null,
      });
      return false;
    }

    const currentGridCopy = cloneGrid(state.grid);
    const newGrid = escapeGroup(state.grid, groupId);
    const won = checkWin(newGrid);
    const deadlocked = !won && isDeadlock(newGrid);

    set({
      grid: newGrid,
      moves: state.moves + 1,
      isWon: won,
      isDeadlocked: deadlocked,
      selectedGroupId: groupId,
      history: [...state.history.slice(-9), currentGridCopy],
      hintGroupIds: [],
    });

    if (won) {
      // Report to progress store lazily (avoids circular import)
      try {
        const { useProgressStore } = require("../store/useProgressStore");
        const total = newGrid.totalGroups;
        const movesUsed = state.moves + 1;
        const stars =
          movesUsed <= total ? 3 : movesUsed <= Math.floor(total * 1.5) ? 2 : 1;
        useProgressStore
          .getState()
          .completeLevel(state.grid.levelNumber, stars);
      } catch (_) {}
    }

    return true;
  },

  // ── Remove group from active state ────────────────────────────────────────
  removeGroupState: (groupId: string) => {
    const { selectedGroupId } = get();
    set({
      selectedGroupId: selectedGroupId === groupId ? null : selectedGroupId,
    });
  },

  // ── Undo ──────────────────────────────────────────────────────────────────
  undoMove: () => {
    const { history, moves } = get();
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    set({
      grid: prev,
      history: history.slice(0, -1),
      moves: Math.max(0, moves - 1),
      isWon: false,
      isDeadlocked: false,
      selectedGroupId: null,
      hintGroupIds: [],
    });
  },

  // ── Hint ──────────────────────────────────────────────────────────────────
  useHint: () => {
    const { grid, hints } = get();
    if (!grid || hints <= 0) return;

    const escapable: string[] = [];
    for (const g of Object.values(grid.groups)) {
      if (!g.isRemoved && canGroupEscape(grid, g.id)) {
        escapable.push(g.id);
      }
    }
    if (escapable.length === 0) return;

    // Highlight one random escapable group
    const choice = escapable[Math.floor(Math.random() * escapable.length)];
    set({ hints: hints - 1, hintGroupIds: [choice] });
    setTimeout(() => set({ hintGroupIds: [] }), 2000);
  },

  clearHint: () => set({ hintGroupIds: [] }),

  // ── Reset ─────────────────────────────────────────────────────────────────
  resetLevel: () => {
    const { initialGrid } = get();
    if (!initialGrid) return;
    set({
      grid: cloneGrid(initialGrid),
      moves: 0,
      isWon: false,
      isDeadlocked: false,
      lives: 3,
      isGameOver: false,
      selectedGroupId: null,
      history: [],
      hintGroupIds: [],
    });
  },

  // ── Next level ────────────────────────────────────────────────────────────
  nextLevel: () => {
    const { grid, loadLevel } = get();
    if (!grid) return;
    loadLevel(grid.levelNumber + 1);
  },
}));
