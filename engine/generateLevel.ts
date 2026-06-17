/**
 * engine/generateLevel.ts
 *
 * Generates Arrow Puzzle levels that look like the real game.
 * Key: groups must be LONG (3-12 cells) and fill the board densely.
 * The maze visual comes from long same-direction groups packed together.
 */

import { getShapeMask } from './shapeMasks';
import type { Cell, Direction, GridState, Group } from './types';

// ── Seeded RNG (Mulberry32) ──────────────────────────────────────────────
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return (): number => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t = (t + Math.imul(t ^ (t >>> 7), t | 61)) >>> 0;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
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

const DIRS: { dir: Direction; dx: number; dy: number }[] = [
  { dir: 'right', dx: 1,  dy: 0  },
  { dir: 'left',  dx: -1, dy: 0  },
  { dir: 'down',  dx: 0,  dy: 1  },
  { dir: 'up',    dx: 0,  dy: -1 },
];

export function getGridSize(level: number): { rows: number; cols: number } {
  if (level <= 5)  return { rows: 8,  cols: 6  };
  if (level <= 15) return { rows: 10, cols: 8  };
  if (level <= 30) return { rows: 12, cols: 10 };
  if (level <= 60) return { rows: 14, cols: 12 };
  return                  { rows: 16, cols: 14 };
}

export function getDifficulty(level: number): string {
  if (level <= 5)  return 'Easy';
  if (level <= 15) return 'Normal';
  if (level <= 30) return 'Hard';
  if (level <= 60) return 'Expert';
  return 'Master';
}

export function generateLevel(levelNumber: number): GridState {
  const lvl  = Math.max(1, Math.floor(levelNumber));
  const seed = (lvl * 2654435761 + 1013904223) >>> 0;
  const rand = mulberry32(seed);

  const { rows, cols } = getGridSize(lvl);
  const shapeMask      = getShapeMask(lvl, rows, cols);

  const occupied = Array.from({ length: rows }, () => new Uint8Array(cols));

  const inBounds = (c: number, r: number) => c >= 0 && c < cols && r >= 0 && r < rows;
  const isActive = (c: number, r: number) => inBounds(c, r) && shapeMask[r][c];
  const isFree   = (c: number, r: number) => isActive(c, r) && occupied[r][c] === 0;

  /**
   * After placing the head cell at (hc, hr) going direction (dx, dy),
   * verify no active occupied cell blocks the escape ray.
   */
  const headRayClear = (hc: number, hr: number, dx: number, dy: number): boolean => {
    let cx = hc + dx;
    let cy = hr + dy;
    while (inBounds(cx, cy)) {
      if (isActive(cx, cy) && occupied[cy][cx] === 1) return false;
      cx += dx;
      cy += dy;
    }
    return true;
  };

  /**
   * Try to place a group of length [minLen, maxLen] starting from (startC, startR)
   * in direction d. Returns the segment if successful, null otherwise.
   */
  const tryPlaceGroup = (
    startC: number,
    startR: number,
    d: typeof DIRS[0],
    minLen: number,
    maxLen: number
  ): [number, number][] | null => {
    // Max contiguous free cells forward in direction d
    let fwdC = startC, fwdR = startR;
    while (isFree(fwdC + d.dx, fwdR + d.dy)) { fwdC += d.dx; fwdR += d.dy; }

    // Max contiguous free cells backward (to allow tail to extend back)
    let bkC = startC, bkR = startR;
    while (isFree(bkC - d.dx, bkR - d.dy)) { bkC -= d.dx; bkR -= d.dy; }

    // Collect the full free segment
    const seg: [number, number][] = [];
    let px = bkC, py = bkR;
    while (true) {
      if (isFree(px, py)) seg.push([px, py]);
      if (px === fwdC && py === fwdR) break;
      px += d.dx; py += d.dy;
      if (!inBounds(px, py)) break;
    }

    if (seg.length === 0) return null;

    const tryMax = Math.min(seg.length, maxLen);
    const startIdx = seg.findIndex(([c, r]) => c === startC && r === startR);

    // Try from longest to minLen
    for (let len = tryMax; len >= minLen; len--) {
      const siMin = Math.max(0, startIdx - len + 1);
      const siMax = Math.min(seg.length - len, startIdx);

      for (let si = siMin; si <= siMax; si++) {
        const candidate = seg.slice(si, si + len);
        if (candidate.length !== len) continue;
        if (!candidate.every(([c, r]) => isFree(c, r))) continue;

        const [headC, headR] = candidate[candidate.length - 1];
        if (headRayClear(headC, headR, d.dx, d.dy)) {
          return candidate;
        }
      }
    }

    return null;
  };

  const cells:  Record<string, Cell>  = {};
  const groups: Record<string, Group> = {};
  let groupCounter = 0;

  // Longer groups = more like real game maze
  const minLen = lvl <= 5 ? 3 : lvl <= 15 ? 4 : 5;
  const maxLen = lvl <= 5 ? 6 : lvl <= 15 ? 8 : lvl <= 30 ? 10 : 12;

  // Process row-major with shuffled directions per cell
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!isFree(c, r)) continue;

      const dirOrder = shuffle(DIRS, rand);
      let placed = false;

      // Try to place a long group (>= minLen)
      for (const d of dirOrder) {
        const seg = tryPlaceGroup(c, r, d, minLen, maxLen);
        if (!seg || seg.length === 0) continue;

        const gid     = `G${lvl}-${groupCounter++}`;
        const cellIds = seg.map(([gc, gr]) => `${gc}-${gr}`);

        groups[gid] = { id: gid, direction: d.dir, cellIds, isRemoved: false, isRemoving: false };

        for (const [gc, gr] of seg) {
          const id = `${gc}-${gr}`;
          cells[id] = { id, col: gc, row: gr, direction: d.dir, groupId: gid, isRemoved: false };
          occupied[gr][gc] = 1;
        }

        placed = true;
        break;
      }

      // Fallback: place a single-cell group so board stays fully covered
      if (!placed) {
        const dirOrder2 = shuffle(DIRS, rand);
        for (const d of dirOrder2) {
          if (headRayClear(c, r, d.dx, d.dy)) {
            const gid = `G${lvl}-${groupCounter++}`;
            const id  = `${c}-${r}`;
            groups[gid] = { id: gid, direction: d.dir, cellIds: [id], isRemoved: false, isRemoving: false };
            cells[id]   = { id, col: c, row: r, direction: d.dir, groupId: gid, isRemoved: false };
            occupied[r][c] = 1;
            break;
          }
        }
      }
    }
  }

  return {
    rows,
    cols,
    cells,
    groups,
    shapeMask,
    levelNumber: lvl,
    totalGroups:   Object.keys(groups).length,
    removedGroups: 0,
    seed,
    difficulty:    getDifficulty(lvl),
  };
}
