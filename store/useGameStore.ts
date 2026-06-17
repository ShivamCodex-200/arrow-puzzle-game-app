import { create } from "zustand";
import { generatePuzzle } from "../engine/pathGenerator";
import {
  canSegmentEscape,
  isDeadlocked,
  checkWin,
  escapeSegment,
  finalizeRemoval,
  getEscapableIds,
} from "../engine/segmentSolver";
import type { PuzzleState, Segment } from "../engine/types";

interface GameStore {
  puzzle: PuzzleState | null;
  initialPuzzle: PuzzleState | null;
  moves: number;
  isWon: boolean;
  isDeadlocked: boolean;
  lives: number;
  isGameOver: boolean;
  history: PuzzleState[];
  hints: number;
  hintSegIds: string[];
  selectedSegId: string | null;
  fullyRemovedSegIds: Set<string>;

  loadLevel: (level: number) => void;
  tapSegment: (segmentId: string) => boolean;
  removeSegmentState: (segmentId: string) => void;
  undoMove: () => void;
  useHint: () => void;
  clearHint: () => void;
  resetLevel: () => void;
  nextLevel: () => void;
}

const clonePuzzle = (p: PuzzleState): PuzzleState => {
  const segments: Segment[] = p.segments.map((s) => ({
    ...s,
    cells: s.cells.map((c) => ({ ...c })),
    ghostCell: { ...s.ghostCell },
  }));
  return {
    ...p,
    segments,
    cellToSegId: { ...p.cellToSegId },
    activeSegIds: new Set(p.activeSegIds),
  };
};

export const useGameStore = create<GameStore>((set, get) => ({
  puzzle: null,
  initialPuzzle: null,
  moves: 0,
  isWon: false,
  isDeadlocked: false,
  lives: 3,
  isGameOver: false,
  history: [],
  hints: 3,
  hintSegIds: [],
  selectedSegId: null,
  fullyRemovedSegIds: new Set<string>(),

  // ── Load level ──────────────────────────────────────────────────────────
  loadLevel: (level: number) => {
    const lvl = Math.max(1, Math.floor(level));
    const puzzle = generatePuzzle(lvl);
    set({
      puzzle,
      initialPuzzle: clonePuzzle(puzzle),
      moves: 0,
      isWon: false,
      isDeadlocked: false,
      lives: 3,
      isGameOver: false,
      selectedSegId: null,
      history: [],
      hintSegIds: [],
      fullyRemovedSegIds: new Set<string>(),
    });
  },

  // ── Tap segment ──────────────────────────────────────────────────────────
  tapSegment: (segmentId: string) => {
    const state = get();
    if (
      !state.puzzle ||
      state.isWon ||
      state.isDeadlocked ||
      state.isGameOver
    )
      return false;

    const segment = state.puzzle.segments.find((s) => s.id === segmentId);
    if (!segment || segment.isRemoved || segment.isRemoving) return false;

    // Check if segment can escape
    const canEscape = canSegmentEscape(
      segment,
      state.puzzle.activeSegIds,
      state.puzzle.cellToSegId,
      state.puzzle.rows,
      state.puzzle.cols
    );

    if (!canEscape) {
      const newLives = Math.max(0, state.lives - 1);
      set({
        lives: newLives,
        isGameOver: newLives === 0,
        selectedSegId: null,
      });
      return false;
    }

    const currentPuzzleCopy = clonePuzzle(state.puzzle);
    const newPuzzle = escapeSegment(state.puzzle, segmentId);
    const won = checkWin(newPuzzle);
    const deadlocked = !won && isDeadlocked(newPuzzle);

    set({
      puzzle: newPuzzle,
      moves: state.moves + 1,
      isWon: won,
      isDeadlocked: deadlocked,
      selectedSegId: segmentId,
      history: [...state.history.slice(-9), currentPuzzleCopy],
      hintSegIds: [],
    });

    if (won) {
      try {
        const { useProgressStore } = require("../store/useProgressStore");
        const total = newPuzzle.totalSegments;
        const movesUsed = state.moves + 1;
        const stars =
          movesUsed <= total
            ? 3
            : movesUsed <= Math.floor(total * 1.5)
            ? 2
            : 1;
        useProgressStore.getState().completeLevel(state.puzzle!.levelNumber, stars);
      } catch (_) {}
    }

    return true;
  },

  // ── Called when escape animation finishes ───────────────────────────────
  removeSegmentState: (segmentId: string) => {
    set((state) => {
      if (!state.puzzle) return {};
      const updatedPuzzle = finalizeRemoval(state.puzzle, segmentId);
      const next = new Set(state.fullyRemovedSegIds);
      next.add(segmentId);
      return {
        puzzle: updatedPuzzle,
        fullyRemovedSegIds: next,
        selectedSegId:
          state.selectedSegId === segmentId ? null : state.selectedSegId,
      };
    });
  },

  // ── Undo ────────────────────────────────────────────────────────────────
  undoMove: () => {
    const { history, moves } = get();
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    set({
      puzzle: prev,
      history: history.slice(0, -1),
      moves: Math.max(0, moves - 1),
      isWon: false,
      isDeadlocked: false,
      selectedSegId: null,
      hintSegIds: [],
      fullyRemovedSegIds: new Set<string>(),
    });
  },

  // ── Hint ────────────────────────────────────────────────────────────────
  useHint: () => {
    const { puzzle, hints } = get();
    if (!puzzle || hints <= 0) return;

    const escapable = getEscapableIds(puzzle);
    if (escapable.length === 0) return;

    const choice = escapable[Math.floor(Math.random() * escapable.length)];
    set({ hints: hints - 1, hintSegIds: [choice] });
    setTimeout(() => set({ hintSegIds: [] }), 2000);
  },

  clearHint: () => set({ hintSegIds: [] }),

  // ── Reset ───────────────────────────────────────────────────────────────
  resetLevel: () => {
    const { initialPuzzle } = get();
    if (!initialPuzzle) return;
    set({
      puzzle: clonePuzzle(initialPuzzle),
      moves: 0,
      isWon: false,
      isDeadlocked: false,
      lives: 3,
      isGameOver: false,
      selectedSegId: null,
      history: [],
      hintSegIds: [],
      fullyRemovedSegIds: new Set<string>(),
    });
  },

  // ── Next level ──────────────────────────────────────────────────────────
  nextLevel: () => {
    const { puzzle, loadLevel } = get();
    if (!puzzle) return;
    loadLevel(puzzle.levelNumber + 1);
  },
}));
