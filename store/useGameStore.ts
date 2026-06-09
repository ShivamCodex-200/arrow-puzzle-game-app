import { create } from "zustand";
import { canEscape } from "../engine/canEscape";
import { checkWin, escapeArrow, isDeadlock } from "../engine/escapeArrow";
import { generateLevel } from "../engine/generateLevel";
import type { GridState } from "../engine/types";

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
  hintCellIds: string[];
  selectedArrowId: string | null;

  loadLevel: (level: number) => void;
  tapArrow: (arrowId: string) => boolean;
  removeArrowState: (arrowId: string) => void;
  undoMove: () => void;
  useHint: () => void;
  clearHint: () => void;
  resetLevel: () => void;
  nextLevel: () => void;
}

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
  hintCellIds: [],
  selectedArrowId: null,

  // ── Load level ────────────────────────────────────────────────────────────
  loadLevel: (level: number) => {
    const lvl = Math.max(1, Math.floor(level));
    const grid = generateLevel(lvl);
    set({
      grid,
      initialGrid: grid,
      moves: 0,
      isWon: false,
      isDeadlocked: false,
      lives: 3,
      isGameOver: false,
      selectedArrowId: null,
      history: [],
      hintCellIds: [],
    });
  },

  // ── Tap arrow → returns true if escapes, false if blocked ─────────────────
  tapArrow: (arrowId: string) => {
    const state = get();
    if (!state.grid || state.isWon || state.isDeadlocked || state.isGameOver) return false;

    const arrow = state.grid.arrows.find((a) => a.id === arrowId);
    if (!arrow || arrow.isRemoved) return false;

    if (!canEscape(state.grid, arrowId)) {
      // Tap blocked arrow -> lose a life
      const newLives = Math.max(0, state.lives - 1);
      set({
        lives: newLives,
        isGameOver: newLives === 0,
        selectedArrowId: null,
      });
      return false;
    }

    // Save current state to history before escape mutation
    const currentGridCopy = JSON.parse(JSON.stringify(state.grid)) as GridState;

    const newGrid = escapeArrow(state.grid, arrowId);
    const won = checkWin(newGrid);
    const deadlocked = !won && isDeadlock(newGrid);

    set({
      grid: newGrid,
      moves: state.moves + 1,
      isWon: won,
      isDeadlocked: deadlocked,
      selectedArrowId: arrowId,
      history: [...state.history.slice(-9), currentGridCopy],
      hintCellIds: [],
    });

    if (won) {
      // Report to progress store lazily (avoids circular import)
      try {
        const { useProgressStore } = require("../store/useProgressStore");
        const total = newGrid.totalArrows;
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

  // ── Remove arrow from state completely ────────────────────────────────────
  // Called once the slide animation finishes so it is completely unmounted.
  removeArrowState: (arrowId: string) => {
    const { grid, selectedArrowId } = get();
    if (!grid) return;

    const newArrows = grid.arrows.filter((a) => a.id !== arrowId);
    set({
      grid: {
        ...grid,
        arrows: newArrows,
      },
      selectedArrowId: selectedArrowId === arrowId ? null : selectedArrowId,
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
      selectedArrowId: null,
      hintCellIds: [],
    });
  },

  // ── Hint ──────────────────────────────────────────────────────────────────
  useHint: () => {
    const { grid, hints } = get();
    if (!grid || hints <= 0) return;

    const escapable: string[] = [];
    for (const a of grid.arrows) {
      if (!a.isRemoved && canEscape(grid, a.id)) {
        escapable.push(a.id);
      }
    }
    if (escapable.length === 0) return;

    // Highlight one random escapable arrow
    const choice = escapable[Math.floor(Math.random() * escapable.length)];
    set({ hints: hints - 1, hintCellIds: [choice] });
    setTimeout(() => set({ hintCellIds: [] }), 2000);
  },

  clearHint: () => set({ hintCellIds: [] }),

  // ── Reset ─────────────────────────────────────────────────────────────────
  resetLevel: () => {
    const { initialGrid } = get();
    if (!initialGrid) return;
    set({
      grid: initialGrid,
      moves: 0,
      isWon: false,
      isDeadlocked: false,
      lives: 3,
      isGameOver: false,
      selectedArrowId: null,
      history: [],
      hintCellIds: [],
    });
  },

  // ── Next level ────────────────────────────────────────────────────────────
  nextLevel: () => {
    const { grid } = get();
    if (!grid) return;
    const nextLvl = grid.levelNumber + 1;
    const newGrid = generateLevel(nextLvl);
    set({
      grid: newGrid,
      initialGrid: newGrid,
      moves: 0,
      isWon: false,
      isDeadlocked: false,
      lives: 3,
      isGameOver: false,
      selectedArrowId: null,
      history: [],
      hintCellIds: [],
    });
  },
}));
