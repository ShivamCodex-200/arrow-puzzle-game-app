import type { Arrow, Direction, GridState, Point } from './types';

// ─── Seeded pseudo-random (Mulberry32) ─────────────────────────────────────
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t = (t + Math.imul(t ^ (t >>> 7), t | 61)) >>> 0;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Grid sizes per level range ────────────────────────────────────────────
export function getGridSize(level: number): { rows: number; cols: number } {
  if (level <= 10)  return { rows: 4, cols: 4 };
  if (level <= 30)  return { rows: 5, cols: 5 };
  if (level <= 70)  return { rows: 6, cols: 6 };
  if (level <= 150) return { rows: 7, cols: 7 };
  return { rows: 8, cols: 8 };
}

/**
 * Grow a path from `start` cell, avoiding occupied and restricted cells.
 * Always returns a path of at least 2 cells.
 */
function growPathAvoiding(
  start: Point,
  occupied: Set<string>,
  restricted: Set<string>,
  rows: number,
  cols: number,
  rand: () => number
): Point[] | null {
  const path: Point[] = [start];
  const visited = new Set<string>([`${start.x},${start.y}`]);
  // Path length is randomly 2, 3, or 4 cells
  const maxLength = 2 + Math.floor(rand() * 3);
  let curr = start;

  for (let i = 1; i < maxLength; i++) {
    const neighbors: Point[] = [];
    const dirs = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
    ];
    for (const d of dirs) {
      const nx = curr.x + d.dx;
      const ny = curr.y + d.dy;
      if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
        const key = `${nx},${ny}`;
        if (!occupied.has(key) && !restricted.has(key) && !visited.has(key)) {
          neighbors.push({ x: nx, y: ny });
        }
      }
    }
    if (neighbors.length === 0) break;
    const next = neighbors[Math.floor(rand() * neighbors.length)];
    path.push(next);
    visited.add(`${next.x},${next.y}`);
    curr = next;
  }

  if (path.length < 2) return null;
  return path;
}

/**
 * Generates a guaranteed solvable level by reverse engineering.
 */
export function generateLevel(levelNumber: number): GridState {
  const rand = mulberry32(levelNumber * 2654435761 + 1013904223);
  const { rows, cols } = getGridSize(levelNumber);

  const arrows: Arrow[] = [];
  const occupied = new Set<string>();
  const exitPaths = new Set<string>();

  // Aim to occupy around 45% - 75% of the grid cells
  const targetSegments = Math.floor(rows * cols * (0.45 + rand() * 0.3));
  let placedSegments = 0;
  let failures = 0;
  let arrowIdCounter = 0;

  while (placedSegments < targetSegments && failures < 120) {
    const freeCells: Point[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const key = `${c},${r}`;
        if (!occupied.has(key) && !exitPaths.has(key)) {
          freeCells.push({ x: c, y: r });
        }
      }
    }

    if (freeCells.length === 0) break;

    const startCell = freeCells[Math.floor(rand() * freeCells.length)];
    const path = growPathAvoiding(startCell, occupied, exitPaths, rows, cols, rand);

    if (!path) {
      failures++;
      continue;
    }

    const endCell = path[path.length - 1];
    const prevCell = path[path.length - 2];
    const dx = endCell.x - prevCell.x;
    const dy = endCell.y - prevCell.y;

    let direction: Direction;
    if (dx === 1) direction = 'right';
    else if (dx === -1) direction = 'left';
    else if (dy === 1) direction = 'down';
    else direction = 'up';

    // Mark occupied
    for (const p of path) {
      occupied.add(`${p.x},${p.y}`);
    }

    // Mark exit paths as restricted for future placements
    let ex = endCell.x;
    let ey = endCell.y;
    while (true) {
      if (direction === 'right') ex++;
      else if (direction === 'left') ex--;
      else if (direction === 'down') ey++;
      else ey--;

      if (ex < 0 || ex >= cols || ey < 0 || ey >= rows) break;
      exitPaths.add(`${ex},${ey}`);
    }

    arrows.push({
      id: `A-${levelNumber}-${arrowIdCounter++}`,
      direction,
      cells: path, // full sequence of grid cells
      isRemoved: false,
    });

    placedSegments += path.length;
    failures = 0;
  }

  arrows.reverse();

  return {
    rows,
    cols,
    arrows,
    levelNumber,
    totalArrows: arrows.length,
    removedCount: 0,
  };
}
