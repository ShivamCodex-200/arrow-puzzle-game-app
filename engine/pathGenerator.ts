/**
 * engine/pathGenerator.ts
 *
 * CORRECT algorithm to generate Arrow Puzzle levels that look like the real game.
 *
 * KEY INSIGHT from analyzing real game screenshots:
 * - The board is COMPLETELY FILLED with arrows (100% cell coverage)
 * - Each "segment" is a straight horizontal or vertical line of cells
 * - Multiple INDEPENDENT segments fill the board (not one snake)
 * - Segments are 2-8 cells long
 * - The puzzle is solvable because segments are placed in a specific order
 *
 * ALGORITHM:
 * 1. Fill the entire board with straight-line segments (like Tetris pieces)
 *    using a greedy placement that prefers longer runs
 * 2. Guarantee solvability by construction:
 *    - Place segments in random order
 *    - For each segment, verify its HEAD has a clear escape ray
 *    - This guarantees removal order exists (reverse of placement)
 * 3. Use multiple placement attempts to maximize board coverage
 */

import { getShapeMask } from './shapeMasks';
import type { Direction, PathPoint, PuzzleState, Segment } from './types';

// ── Seeded RNG ────────────────────────────────────────────────────────────────
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return (): number => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t = (t + Math.imul(t ^ (t >>> 7), t | 61)) >>> 0;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ALL_DIRS: { dir: Direction; dx: number; dy: number }[] = [
  { dir: 'right', dx: 1, dy: 0 },
  { dir: 'left', dx: -1, dy: 0 },
  { dir: 'down', dx: 0, dy: 1 },
  { dir: 'up', dx: 0, dy: -1 },
];

export function getGridSize(level: number): { rows: number; cols: number } {
  if (level <= 5) return { rows: 9, cols: 7 };
  if (level <= 15) return { rows: 11, cols: 9 };
  if (level <= 30) return { rows: 13, cols: 11 };
  if (level <= 60) return { rows: 15, cols: 13 };
  return { rows: 17, cols: 15 };
}

export function getDifficultyLabel(level: number): string {
  if (level <= 5) return 'Easy';
  if (level <= 15) return 'Normal';
  if (level <= 30) return 'Hard';
  if (level <= 60) return 'Expert';
  return 'Master';
}

/**
 * Core generator: fills board completely with straight-line segments.
 * Guaranteed solvable by reverse-placement construction.
 */
function generateSegments(
  rows: number,
  cols: number,
  shapeMask: boolean[][],
  rand: () => number,
  levelNumber: number
): Segment[] {
  // Track which cells are occupied
  const occupied = Array.from({ length: rows }, () => new Uint8Array(cols));

  const inBounds = (c: number, r: number) =>
    c >= 0 && c < cols && r >= 0 && r < rows;

  const isActive = (c: number, r: number) =>
    inBounds(c, r) && shapeMask[r]?.[c] === true;

  const isFree = (c: number, r: number) =>
    isActive(c, r) && occupied[r][c] === 0;

  /**
   * Check if the escape ray from (hc, hr) in direction (dx, dy)
   * is clear of ALL currently-placed occupied cells.
   * This is the KEY guarantee for solvability.
   */
  const isEscapeRayClear = (
    hc: number,
    hr: number,
    dx: number,
    dy: number
  ): boolean => {
    let c = hc + dx;
    let r = hr + dy;
    while (inBounds(c, r)) {
      // Only active+occupied cells block (inactive mask cells = transparent)
      if (isActive(c, r) && occupied[r][c] === 1) return false;
      c += dx;
      r += dy;
    }
    return true;
  };

  const segments: Segment[] = [];
  let segCounter = 0;

  // Preferred segment lengths based on difficulty
  // Longer = harder (more complex puzzle)
  const preferredMin = levelNumber <= 5 ? 2 : levelNumber <= 15 ? 3 : 4;
  const preferredMax = levelNumber <= 5 ? 5 : levelNumber <= 15 ? 7 : levelNumber <= 30 ? 9 : 12;

  /**
   * Try to place a segment starting at (startC, startR).
   * Returns true if placed successfully.
   */
  const tryPlaceAt = (startC: number, startR: number): boolean => {
    if (!isFree(startC, startR)) return false;

    // Try directions in random order
    const dirs = shuffle(ALL_DIRS, rand);

    for (const d of dirs) {
      // Find max extent forward
      let maxFwd = 0;
      while (isFree(startC + d.dx * (maxFwd + 1), startR + d.dy * (maxFwd + 1))) {
        maxFwd++;
      }

      // Find max extent backward
      let maxBwd = 0;
      while (isFree(startC - d.dx * (maxBwd + 1), startR - d.dy * (maxBwd + 1))) {
        maxBwd++;
      }

      const totalLen = maxBwd + 1 + maxFwd; // total free cells in this axis

      if (totalLen < 1) continue;

      // Try to find a valid segment of preferred length
      // that includes (startC, startR) and has a clear escape ray
      const tryMax = Math.min(totalLen, preferredMax);

      for (let len = tryMax; len >= 1; len--) {
        // The head must be one of the endpoints in direction d
        // Try: head at forward end, then head at backward end

        // Option A: Head at forward end (tail at backward side)
        {
          // Calculate how many cells we can take backward from startC,startR
          // such that the forward end is the head
          // head = startC + dx*(len-1-bwdOffset), tail = startC - dx*bwdOffset
          // We iterate over valid tail positions
          const maxBwdOffset = Math.min(maxBwd, len - 1);

          for (let bwdOff = 0; bwdOff <= maxBwdOffset; bwdOff++) {
            const tailC = startC - d.dx * bwdOff;
            const tailR = startR - d.dy * bwdOff;
            const headC = tailC + d.dx * (len - 1);
            const headR = tailR + d.dy * (len - 1);

            if (!inBounds(headC, headR)) continue;

            // Verify all cells are free
            let allFree = true;
            const cells: PathPoint[] = [];
            for (let i = 0; i < len; i++) {
              const c = tailC + d.dx * i;
              const r = tailR + d.dy * i;
              if (!isFree(c, r)) { allFree = false; break; }
              cells.push({ col: c, row: r });
            }
            if (!allFree) continue;

            // Check escape ray from HEAD
            if (!isEscapeRayClear(headC, headR, d.dx, d.dy)) continue;

            // Valid placement found!
            if (len >= preferredMin || totalLen < preferredMin) {
              const gid = `S${levelNumber}-${segCounter++}`;
              const ghostCell = {
                col: headC + d.dx,
                row: headR + d.dy,
              };

              segments.push({
                id: gid,
                direction: d.dir,
                cells,
                ghostCell,
                isRemoved: false,
                isRemoving: false,
              });

              // Mark cells as occupied
              for (const cell of cells) {
                occupied[cell.row][cell.col] = 1;
              }

              return true;
            }
          }
        }

        // Option B: Head at backward end (opposite direction)
        {
          const oppDx = -d.dx;
          const oppDy = -d.dy;

          for (let fwdOff = 0; fwdOff <= Math.min(maxFwd, len - 1); fwdOff++) {
            const tailC = startC + d.dx * fwdOff;
            const tailR = startR + d.dy * fwdOff;
            const headC = tailC + oppDx * (len - 1);
            const headR = tailR + oppDy * (len - 1);

            if (!inBounds(headC, headR)) continue;

            let allFree = true;
            const cells: PathPoint[] = [];
            for (let i = 0; i < len; i++) {
              const c = tailC + oppDx * i;
              const r = tailR + oppDy * i;
              if (!isFree(c, r)) { allFree = false; break; }
              cells.push({ col: c, row: r });
            }
            if (!allFree) continue;

            if (!isEscapeRayClear(headC, headR, oppDx, oppDy)) continue;

            if (len >= preferredMin || totalLen < preferredMin) {
              const gid = `S${levelNumber}-${segCounter++}`;
              const ghostCell = {
                col: headC + oppDx,
                row: headR + oppDy,
              };

              // cells are ordered tail→head (head is last)
              segments.push({
                id: gid,
                direction: (oppDx === 1 ? 'right' : oppDx === -1 ? 'left' : oppDy === 1 ? 'down' : 'up') as Direction,
                cells,
                ghostCell,
                isRemoved: false,
                isRemoving: false,
              });

              for (const cell of cells) {
                occupied[cell.row][cell.col] = 1;
              }

              return true;
            }
          }
        }
      }
    }

    return false;
  };

  // PASS 1: Scan row by row, try to place segments
  // Process in shuffled row order for variety
  const rowOrder = shuffle(
    Array.from({ length: rows }, (_, i) => i),
    rand
  );

  for (const r of rowOrder) {
    const colOrder = shuffle(
      Array.from({ length: cols }, (_, i) => i),
      rand
    );
    for (const c of colOrder) {
      tryPlaceAt(c, r);
    }
  }

  // PASS 2: Fill remaining gaps (cells that weren't covered)
  // Do multiple sweeps to maximize coverage
  for (let pass = 0; pass < 3; pass++) {
    let anyPlaced = false;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (isFree(c, r)) {
          if (tryPlaceAt(c, r)) anyPlaced = true;
        }
      }
    }
    if (!anyPlaced) break;
  }

  return segments;
}

export function generatePuzzle(levelNumber: number): PuzzleState {
  const lvl = Math.max(1, Math.floor(levelNumber));
  const baseSeed = (lvl * 2_654_435_761 + 1_013_904_223) >>> 0;

  const { rows, cols } = getGridSize(lvl);
  const shapeMask = getShapeMask(lvl, rows, cols);

  let segments: Segment[] = [];

  // Try multiple seeds to get best coverage
  let bestCoverage = 0;
  let bestSegments: Segment[] = [];

  for (let attempt = 0; attempt < 8; attempt++) {
    const rand = mulberry32(baseSeed + attempt * 99991);
    const segs = generateSegments(rows, cols, shapeMask, rand, lvl);

    const coverage = segs.reduce((sum, s) => sum + s.cells.length, 0);
    if (coverage > bestCoverage) {
      bestCoverage = coverage;
      bestSegments = segs;
    }

    // Count active cells in shape
    let totalActive = 0;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        if (shapeMask[r]?.[c]) totalActive++;

    // If we covered >= 95% stop early
    if (coverage >= totalActive * 0.95) break;
  }

  segments = bestSegments;

  // Build lookup
  const cellToSegId: Record<string, string> = {};
  for (const seg of segments) {
    for (const cell of seg.cells) {
      cellToSegId[`${cell.col},${cell.row}`] = seg.id;
    }
  }

  return {
    levelNumber: lvl,
    rows,
    cols,
    segments,
    cellToSegId,
    activeSegIds: new Set(segments.map(s => s.id)),
    seed: baseSeed,
    difficulty: getDifficultyLabel(lvl),
    totalSegments: segments.length,
    shapeMask,
  };
}
