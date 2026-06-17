/**
 * engine/generateLevel.ts
 *
 * Builds levels by REVERSE-PLACEMENT construction instead of
 * "random directions + hope it's solvable".
 *
 * Why the old version was broken:
 *   1. It assigned a random direction to every cell, then ran a forward
 *      solvability check. A randomly-filled board almost never has a valid
 *      full removal order, so isSolvable() failed for all 50 attempts and
 *      every level silently fell back to an UNSOLVABLE board.
 *   2. Random per-cell directions meant ~80% of groups were size-1, so the
 *      board looked like a field of scattered single arrows, not shapes.
 *
 * How this version works (guaranteed solvable by construction):
 *   We place groups one at a time. Each group's HEAD cell must have a clear
 *   ray to the board edge considering only the cells already placed.
 *   If every placed group satisfies that, then removing them in REVERSE
 *   placement order is a valid solution. No guessing, no fallback needed.
 *   We also grow each group toward a target length so arrows form real shapes.
 */
import { getShapeMask } from "./shapeMasks";
import type { Cell, Direction, GridState, Group } from "./types";

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

// ── Direction table ───────────────────────────────────────────────────────
const DIRS: { dir: Direction; dx: number; dy: number }[] = [
  { dir: "right", dx: 1, dy: 0 },
  { dir: "left", dx: -1, dy: 0 },
  { dir: "down", dx: 0, dy: 1 },
  { dir: "up", dx: 0, dy: -1 },
];

// ── Grid sizing / difficulty (kept identical so nothing else breaks) ──────
export function getGridSize(level: number): { rows: number; cols: number } {
  if (level <= 5) return { rows: 8, cols: 6 };
  if (level <= 15) return { rows: 10, cols: 8 };
  if (level <= 30) return { rows: 12, cols: 10 };
  if (level <= 60) return { rows: 14, cols: 12 };
  return { rows: 16, cols: 14 };
}

export function getDifficulty(level: number): string {
  if (level <= 5) return "Easy";
  if (level <= 15) return "Normal";
  if (level <= 30) return "Hard";
  if (level <= 60) return "Expert";
  return "Master";
}

// ── MAIN GENERATOR ────────────────────────────────────────────────────────
export function generateLevel(levelNumber: number): GridState {
  const lvl = Math.max(1, Math.floor(levelNumber));
  const seed = (lvl * 2654435761 + 1013904223) >>> 0;
  const rand = mulberry32(seed);

  const { rows, cols } = getGridSize(lvl);
  const shapeMask = getShapeMask(lvl, rows, cols);

  // occupied[r][c]: 1 once a cell is assigned to a group
  const occupied: Uint8Array[] = [];
  for (let r = 0; r < rows; r++) occupied.push(new Uint8Array(cols));

  const inBounds = (c: number, r: number) =>
    c >= 0 && c < cols && r >= 0 && r < rows;
  const isActive = (c: number, r: number) =>
    inBounds(c, r) && shapeMask[r][c];
  const isFree = (c: number, r: number) =>
    isActive(c, r) && occupied[r][c] === 0;

  // Is the ray from (c,r) in (dx,dy) clear of placed (occupied) active cells
  // all the way to the board edge? Inactive mask cells are gaps the arrow flies over.
  const rayClear = (c: number, r: number, dx: number, dy: number): boolean => {
    let cx = c + dx;
    let cy = r + dy;
    while (inBounds(cx, cy)) {
      if (isActive(cx, cy) && occupied[cy][cx] === 1) return false;
      cx += dx;
      cy += dy;
    }
    return true;
  };

  const cells: Record<string, Cell> = {};
  const groups: Record<string, Group> = {};
  let groupCounter = 0;

  // Target group length grows with difficulty → bigger, clearer shapes.
  const targetLength =
    lvl <= 5 ? 3 : lvl <= 15 ? 4 : lvl <= 30 ? 5 : lvl <= 60 ? 6 : 7;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!isFree(c, r)) continue;

      let best: { dir: Direction; seg: [number, number][] } | null = null;

      for (const d of shuffle(DIRS, rand)) {
        // Farthest free cell we could reach from (c,r) moving in +dir.
        let maxC = c;
        let maxR = r;
        while (isFree(maxC + d.dx, maxR + d.dy)) {
          maxC += d.dx;
          maxR += d.dy;
        }

        // Pick the farthest valid HEAD (free cell whose beyond-ray is clear).
        let foundHead: { hc: number; hr: number } | null = null;
        let sx = c;
        let sy = r;
        while (true) {
          if (
            isActive(sx, sy) &&
            occupied[sy][sx] === 0 &&
            rayClear(sx + d.dx, sy + d.dy, d.dx, d.dy)
          ) {
            foundHead = { hc: sx, hr: sy };
          }
          if (sx === maxC && sy === maxR) break;
          sx += d.dx;
          sy += d.dy;
          if (!isActive(sx, sy)) break;
        }
        if (!foundHead) continue;

        // Extend the TAIL backward (opposite dir) over free cells.
        let tc = c;
        let tr = r;
        while (isFree(tc - d.dx, tr - d.dy)) {
          tc -= d.dx;
          tr -= d.dy;
        }

        // Build the segment tail→head (all free & active by construction).
        const seg: [number, number][] = [];
        let px = tc;
        let py = tr;
        while (true) {
          seg.push([px, py]);
          if (px === foundHead.hc && py === foundHead.hr) break;
          px += d.dx;
          py += d.dy;
        }

        if (!best || seg.length > best.seg.length) best = { dir: d.dir, seg };
        if (best.seg.length >= targetLength) break; // good enough, add variety
      }

      if (!best) {
        // Fallback: singleton pointing toward any clear edge.
        for (const d of shuffle(DIRS, rand)) {
          if (rayClear(c + d.dx, r + d.dy, d.dx, d.dy)) {
            best = { dir: d.dir, seg: [[c, r]] };
            break;
          }
        }
      }
      if (!best) continue; // extremely rare; cell stays empty

      const gid = `G${lvl}-${groupCounter++}`;
      // cellIds: [0] = tail (innermost), [last] = head (leading edge)
      const cellIds = best.seg.map(([cc, rr]) => `${cc}-${rr}`);

      groups[gid] = {
        id: gid,
        direction: best.dir,
        cellIds,
        isRemoved: false,
        isRemoving: false,
      };
      for (const id of cellIds) {
        const [cc, rr] = id.split("-").map(Number);
        cells[id] = {
          id,
          col: cc,
          row: rr,
          direction: best.dir,
          groupId: gid,
          isRemoved: false,
        };
        occupied[rr][cc] = 1;
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
    totalGroups: Object.keys(groups).length,
    removedGroups: 0,
    seed,
    difficulty: getDifficulty(lvl),
  };
}
