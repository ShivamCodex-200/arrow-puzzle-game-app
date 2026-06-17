/**
 * engine/dailyChallengeGenerator.ts
 *
 * Daily challenge generator: maps a calendar date to a solvable level configuration
 * using the unified per-cell group escape mechanics.
 */

import { generateLevel } from './generateLevel';
import type { GridState } from './types';

export interface DailyChallenge {
  id: string;
  date: string;
  difficulty: "easy" | "medium" | "hard" | "expert";
  boardWidth: number;
  boardHeight: number;
  rewardCoins: number;
  grid: GridState;
}

// Convert string date (YYYY-MM-DD) into a numerical seed
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export function generateDailyChallenge(dateStr: string): DailyChallenge {
  const seed = hashCode(dateStr);

  const diffs: ("easy" | "medium" | "hard" | "expert")[] = ["easy", "medium", "hard", "expert"];
  const difficulty = diffs[seed % diffs.length];

  // Map difficulty to reward coins and corresponding level number
  let level = 20;
  let rewardCoins = 30;

  if (difficulty === "medium") {
    level = 40;
    rewardCoins = 50;
  } else if (difficulty === "hard") {
    level = 60;
    rewardCoins = 75;
  } else if (difficulty === "expert") {
    level = 80;
    rewardCoins = 100;
  }

  const grid = generateLevel(level);

  return {
    id: `daily-${dateStr}`,
    date: dateStr,
    difficulty,
    boardWidth: grid.cols,
    boardHeight: grid.rows,
    rewardCoins,
    grid,
  };
}
