import { useState, useCallback, useEffect } from 'react';
import { generateDailyChallenge } from '../engine/dailyChallengeGenerator';
import { canEscape } from '../engine/canEscape';
import { escapeArrow, checkWin } from '../engine/escapeArrow';
import type { GridState } from '../engine/types';
import { useSound } from './useSound';
import { useHaptics } from './useHaptics';
import { useDailyChallengeStore } from '../store/useDailyChallengeStore';

export function useDailyChallenge(dateStr: string) {
  const { playTap, playWin } = useSound();
  const haptics = useHaptics();
  const { completeChallenge, completedDates } = useDailyChallengeStore();

  const [grid, setGrid] = useState<GridState | null>(null);
  const [initialGrid, setInitialGrid] = useState<GridState | null>(null);
  
  // Game attempt-level states
  const [moves, setMoves] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [selectedArrowId, setSelectedArrowId] = useState<string | null>(null);
  const [shakingArrowId, setShakingArrowId] = useState<string | null>(null);
  const [isWon, setIsWon] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  // Timer state
  const [timeElapsed, setTimeElapsed] = useState<number>(0);

  // Initialize and load daily challenge layout
  const loadChallenge = useCallback(() => {
    if (!dateStr) return;

    const challenge = generateDailyChallenge(dateStr);
    
    // Construct GridState matching the core engine's layout
    const gridState: GridState = {
      rows: challenge.boardHeight,
      cols: challenge.boardWidth,
      shape: 'rectangle',
      shapeMask: Array.from({ length: challenge.boardHeight }, () => Array(challenge.boardWidth).fill(true)),
      arrows: challenge.arrows,
      levelNumber: 0,
      totalArrows: challenge.arrows.length,
      removedCount: 0,
      seed: 0,
      difficulty: challenge.difficulty === "easy" ? "Easy" : challenge.difficulty === "medium" ? "Normal" : challenge.difficulty === "hard" ? "Hard" : "Expert",
      metrics: {
        arrowCount: challenge.arrows.length,
        averageArrowLength: 3.5,
        intersections: 10,
        deadEnds: 0,
        removableArrowsAtStart: 3,
        branchingFactor: 1.5
      }
    };

    setGrid(JSON.parse(JSON.stringify(gridState)));
    setInitialGrid(gridState);
    setMoves(0);
    setLives(3);
    setSelectedArrowId(null);
    setShakingArrowId(null);
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
    setGrid(JSON.parse(JSON.stringify(initialGrid)));
    setMoves(0);
    setLives(3);
    setSelectedArrowId(null);
    setShakingArrowId(null);
    setIsWon(false);
    setIsGameOver(false);
    setTimeElapsed(0);
  }, [initialGrid]);

  // Tap arrow to trigger escape sequence
  const tapArrow = useCallback((arrowId: string): boolean => {
    if (!grid || isWon || isGameOver) return false;

    const arrow = grid.arrows.find((a) => a.id === arrowId);
    if (!arrow || arrow.isRemoved) return false;

    if (!canEscape(grid, arrowId)) {
      haptics.warning();
      setShakingArrowId(arrowId);

      const nextLives = Math.max(0, lives - 1);
      setLives(nextLives);

      if (nextLives === 0) {
        setIsGameOver(true);
      }
      return false;
    }

    // Unblocked: slide out
    playTap();

    const nextGrid = escapeArrow(grid, arrowId);
    const won = checkWin(nextGrid);

    setGrid(nextGrid);
    setMoves((prev) => prev + 1);
    setSelectedArrowId(arrowId);

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

  const removeArrowState = useCallback((arrowId: string) => {
    setGrid((prevGrid) => {
      if (!prevGrid) return null;
      const newArrows = prevGrid.arrows.filter((a) => a.id !== arrowId);
      return {
        ...prevGrid,
        arrows: newArrows,
      };
    });
    setSelectedArrowId((prevSelected) => prevSelected === arrowId ? null : prevSelected);
  }, []);

  const handleShakeDone = useCallback((arrowId: string) => {
    setShakingArrowId((prev) => prev === arrowId ? null : prev);
  }, []);

  return {
    grid,
    moves,
    lives,
    isWon,
    isGameOver,
    selectedArrowId,
    shakingArrowId,
    timeElapsed,
    tapArrow,
    removeArrowState,
    handleShakeDone,
    resetChallenge,
  };
}
