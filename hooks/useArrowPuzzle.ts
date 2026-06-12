import { useState, useCallback, useEffect, useRef } from 'react';
import { generateEscapeLevel, tracePath, EscapeGrid, TraceResult } from '../engine/escapeModeEngine';
import { useSound } from './useSound';
import { useHaptics } from './useHaptics';

export function useArrowPuzzle(initialLevel: number = 1) {
  const { playTap, playWin } = useSound();
  const haptics = useHaptics();

  const [level, setLevel] = useState<number>(initialLevel);
  const [grid, setGrid] = useState<EscapeGrid | null>(null);
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [pathState, setPathState] = useState<'idle' | 'tracing' | 'escaped' | 'failed'>('idle');
  const [lives, setLives] = useState<number>(3);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isWon, setIsWon] = useState<boolean>(false);

  // Keep track of the tracing interval to clean it up and prevent memory leaks
  const traceIntervalRef = useRef<any>(null);

  const clearTraceInterval = useCallback(() => {
    if (traceIntervalRef.current) {
      clearInterval(traceIntervalRef.current);
      traceIntervalRef.current = null;
    }
  }, []);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      clearTraceInterval();
    };
  }, [clearTraceInterval]);

  // 1. Initialize level
  const loadLevel = useCallback((levelNum: number) => {
    clearTraceInterval();
    const nextGrid = generateEscapeLevel(levelNum);
    setGrid(nextGrid);
    setSelectedPath([]);
    setPathState('idle');
    setLives(3);
    setIsGameOver(false);
    setIsWon(false);
  }, [clearTraceInterval]);

  useEffect(() => {
    loadLevel(level);
  }, [level, loadLevel]);

  // 2. Select starting node and trace path
  const selectStartNode = useCallback((nodeId: string) => {
    if (!grid || isGameOver || isWon || pathState === 'tracing') return;

    // Clear any previous running trace interval safely
    clearTraceInterval();

    // Play tap sound
    playTap();
    haptics.light();

    // Start tracing state
    setPathState('tracing');
    setSelectedPath([nodeId]);

    // Trace path in engine (uses Set internally to detect loops and prevent infinite loops)
    const result: TraceResult = tracePath(nodeId, grid.nodes, grid.shapeMask);

    // Double safeguard: Track visited node IDs using a local Set during visual animation ticks
    const visitedSet = new Set<string>();
    visitedSet.add(nodeId);

    let currentIdx = 0;
    const pathNodes = result.path;

    traceIntervalRef.current = setInterval(() => {
      currentIdx++;
      if (currentIdx < pathNodes.length) {
        const nextNodeId = pathNodes[currentIdx];

        // Safeguard to prevent animating infinite loops if pathNodes has any cycles
        if (visitedSet.has(nextNodeId)) {
          // Loop detected during animation! Complete tracing as failed
          clearTraceInterval();
          setSelectedPath((prev) => [...prev, nextNodeId]);
          setPathState('failed');
          haptics.warning();
          const nextLives = lives - 1;
          setLives(nextLives);
          if (nextLives <= 0) {
            setIsGameOver(true);
          }
          return;
        }

        visitedSet.add(nextNodeId);
        // Add next node to selected path list for rendering
        setSelectedPath((prev) => [...prev, nextNodeId]);
        haptics.light();
      } else {
        // Tracing complete
        clearTraceInterval();
        if (result.escapes) {
          setPathState('escaped');
          setIsWon(true);
          playWin();
          haptics.success();
        } else {
          setPathState('failed');
          haptics.warning();
          const nextLives = lives - 1;
          setLives(nextLives);
          if (nextLives <= 0) {
            setIsGameOver(true);
          }
        }
      }
    }, 120); // 120ms delay per step makes a beautiful crawling line effect
  }, [grid, isGameOver, isWon, pathState, lives, playTap, playWin, haptics, clearTraceInterval]);

  const resetLevel = useCallback(() => {
    loadLevel(level);
  }, [level, loadLevel]);

  const nextLevel = useCallback(() => {
    const nextLvl = level + 1;
    setLevel(nextLvl);
  }, [level]);

  const clearPath = useCallback(() => {
    if (pathState === 'tracing') return;
    clearTraceInterval();
    setSelectedPath([]);
    setPathState('idle');
  }, [pathState, clearTraceInterval]);

  return {
    level,
    grid,
    selectedPath,
    pathState,
    lives,
    isGameOver,
    isWon,
    selectStartNode,
    resetLevel,
    nextLevel,
    clearPath,
  };
}
