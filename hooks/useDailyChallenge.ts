import { useState, useCallback, useEffect } from 'react';
import { generateDailyChallenge } from '../engine/dailyChallengeGenerator';
import { canGroupEscape } from '../engine/canEscape';
import { escapeGroup, checkWin } from '../engine/escapeArrow';
import type { GridState, Cell, Group } from '../engine/types';
import { useSound } from './useSound';
import { useHaptics } from './useHaptics';
import { useDailyChallengeStore } from '../store/useDailyChallengeStore';

// Helper to deep clone GridState
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

export function useDailyChallenge(dateStr: string) {
  const { playTap, playWin } = useSound();
  const haptics = useHaptics();
  const { completeChallenge } = useDailyChallengeStore();

  const [grid, setGrid] = useState<GridState | null>(null);
  const [initialGrid, setInitialGrid] = useState<GridState | null>(null);

  // Game attempt-level states
  const [moves, setMoves] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [shakingGroupId, setShakingGroupId] = useState<string | null>(null);
  const [isWon, setIsWon] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  // Timer state
  const [timeElapsed, setTimeElapsed] = useState<number>(0);

  // Initialize and load daily challenge layout
  const loadChallenge = useCallback(() => {
    if (!dateStr) return;

    const challenge = generateDailyChallenge(dateStr);
    const gridState = challenge.grid;

    setGrid(cloneGrid(gridState));
    setInitialGrid(cloneGrid(gridState));
    setMoves(0);
    setLives(3);
    setSelectedGroupId(null);
    setShakingGroupId(null);
    setIsWon(false);
    setIsGameOver(false);
    setTimeElapsed(0);
  }, [dateStr]);

  useEffect(() => {
    loadChallenge();
  }, [loadChallenge]);

  // Timer loop
  useEffect(() => {
    let timer: any = null;
    if (grid && !isWon && !isGameOver) {
      timer = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [grid, isWon, isGameOver]);

  const resetChallenge = useCallback(() => {
    if (!initialGrid) return;
    setGrid(cloneGrid(initialGrid));
    setMoves(0);
    setLives(3);
    setSelectedGroupId(null);
    setShakingGroupId(null);
    setIsWon(false);
    setIsGameOver(false);
    setTimeElapsed(0);
  }, [initialGrid]);

  // Tap group to trigger escape sequence
  const tapGroup = useCallback((groupId: string): boolean => {
    if (!grid || isWon || isGameOver) return false;

    const group = grid.groups[groupId];
    if (!group || group.isRemoved) return false;

    if (!canGroupEscape(grid, groupId)) {
      haptics.warning();
      setShakingGroupId(groupId);

      const nextLives = Math.max(0, lives - 1);
      setLives(nextLives);

      if (nextLives === 0) {
        setIsGameOver(true);
      }
      return false;
    }

    // Unblocked: escape group
    playTap();

    const nextGrid = escapeGroup(grid, groupId);
    const won = checkWin(nextGrid);

    setGrid(nextGrid);
    setMoves((prev) => prev + 1);
    setSelectedGroupId(groupId);

    if (won) {
      setIsWon(true);
      
      // Complete in store and claim reward coins
      const challenge = generateDailyChallenge(dateStr);
      completeChallenge(dateStr, challenge.difficulty);

      playWin();
      haptics.success();
    }

    return true;
  }, [grid, isWon, isGameOver, lives, dateStr, playTap, playWin, haptics, completeChallenge]);

  const removeGroupState = useCallback((groupId: string) => {
    setSelectedGroupId((prevSelected) => prevSelected === groupId ? null : prevSelected);
  }, []);

  const handleShakeDone = useCallback((groupId: string) => {
    setShakingGroupId((prev) => prev === groupId ? null : prev);
  }, []);

  return {
    grid,
    moves,
    lives,
    isWon,
    isGameOver,
    selectedGroupId,
    shakingGroupId,
    timeElapsed,
    tapGroup,
    removeGroupState,
    handleShakeDone,
    resetChallenge,
  };
}
