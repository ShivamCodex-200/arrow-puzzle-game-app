import type { Arrow, Direction, GridState, Point, LevelMetrics, ShapeType } from "./types";

// Seeded pseudo-random Mulberry32 generator
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t = (t + Math.imul(t ^ (t >>> 7), t | 61)) >>> 0;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Deterministic Grid progression mapped by level number
export function getGridSize(level: number): { rows: number; cols: number } {
  if (level <= 20) return { rows: 10, cols: 10 };
  if (level <= 50) return { rows: 12, cols: 12 };
  if (level <= 100) return { rows: 14, cols: 14 };
  if (level <= 300) return { rows: 16, cols: 16 };
  return { rows: 18, cols: 18 };
}

// Multi-dimension and Shape progression
function getGridSizeAndShape(
  level: number,
  rand: () => number
): { rows: number; cols: number; shape: ShapeType } {
  const { rows, cols } = getGridSize(level);
  let shape: ShapeType = "rectangle";

  // Achievement shape milestones (5% of levels)
  if (level === 100) {
    shape = "diamond";
  } else if (level === 250) {
    shape = "circle";
  } else if (level === 500) {
    shape = "cross";
  } else if (level === 1000) {
    shape = "spiral";
  }

  return { rows, cols, shape };
}

// Generate Shape Mask
function getShapeMask(shape: ShapeType, rows: number, cols: number): boolean[][] {
  const mask = Array.from({ length: rows }, () => Array(cols).fill(false));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = cols > 1 ? (c - (cols - 1) / 2) / ((cols - 1) / 2) : 0;
      const y = rows > 1 ? (r - (rows - 1) / 2) / ((rows - 1) / 2) : 0;

      let active = false;
      const dist = x * x + y * y;

      switch (shape) {
        case "rectangle":
          active = true;
          break;

        case "circle":
          active = dist <= 1.05;
          break;

        case "diamond":
          active = Math.abs(x) + Math.abs(y) <= 1.05;
          break;

        case "cross":
          active = Math.abs(x) <= 0.45 || Math.abs(y) <= 0.45;
          break;

        case "donut":
          active = dist <= 1.05 && dist >= 0.16;
          break;

        case "spiral":
          const rPolar = Math.sqrt(dist);
          const theta = Math.atan2(y, x) + Math.PI;
          const spiralR = (theta / (2 * Math.PI)) * 0.75 + 0.25;
          active = Math.abs(rPolar - spiralR) <= 0.25 || rPolar <= 0.22;
          break;

        case "hex":
          active = Math.abs(y) <= 0.95 && Math.abs(x) + Math.abs(y) / 2 <= 0.95;
          break;

        default:
          active = true;
      }

      mask[r][c] = active;
    }
  }

  // Self-heal the mask to remove disconnected island components smaller than size 3
  cleanupMaskComponents(mask, rows, cols);

  // Guarantee at least center is active as a fallback safety
  let activeCount = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (mask[r][c]) activeCount++;
    }
  }

  if (activeCount === 0) {
    mask[Math.floor(rows / 2)][Math.floor(cols / 2)] = true;
  }

  return mask;
}

// Remove disconnected islands in shape mask smaller than size 3
function cleanupMaskComponents(mask: boolean[][], rows: number, cols: number) {
  const visited = new Set<string>();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!mask[r][c]) continue;
      const key = `${c},${r}`;
      if (visited.has(key)) continue;

      const component: Point[] = [{ x: c, y: r }];
      visited.add(key);
      let qIdx = 0;

      while (qIdx < component.length) {
        const curr = component[qIdx++];
        const dirs = [
          { dx: 1, dy: 0 },
          { dx: -1, dy: 0 },
          { dx: 0, dy: 1 },
          { dx: 0, dy: -1 },
        ];
        for (const d of dirs) {
          const nx = curr.x + d.dx;
          const ny = curr.y + d.dy;
          if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && mask[ny][nx]) {
            const nKey = `${nx},${ny}`;
            if (!visited.has(nKey)) {
              visited.add(nKey);
              component.push({ x: nx, y: ny });
            }
          }
        }
      }

      if (component.length < 3) {
        for (const p of component) {
          mask[p.y][p.x] = false;
        }
      }
    }
  }
}

// Backtracking DFS path finder
function findPathBacktracking(
  start: Point,
  targetLength: number,
  occupied: Set<string>,
  shapeMask: boolean[][],
  rows: number,
  cols: number,
  rand: () => number
): Point[] | null {
  const path: Point[] = [start];
  const visited = new Set<string>([`${start.x},${start.y}`]);

  function dfs(curr: Point): boolean {
    if (path.length === targetLength) {
      return true;
    }

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
        if (shapeMask[ny][nx]) {
          const key = `${nx},${ny}`;
          if (!occupied.has(key) && !visited.has(key)) {
            neighbors.push({ x: nx, y: ny });
          }
        }
      }
    }

    if (neighbors.length === 0) return false;

    // Seeded random shuffle of neighbors
    for (let i = neighbors.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      const temp = neighbors[i];
      neighbors[i] = neighbors[j];
      neighbors[j] = temp;
    }

    for (const next of neighbors) {
      path.push(next);
      visited.add(`${next.x},${next.y}`);

      if (dfs(next)) {
        return true;
      }

      path.pop();
      visited.delete(`${next.x},${next.y}`);
    }

    return false;
  }

  if (dfs(start)) {
    return path;
  }
  return null;
}

// Warnsdorff scoring count
function getFreeNeighborCount(
  cell: Point,
  occupied: Set<string>,
  shapeMask: boolean[][],
  rows: number,
  cols: number
): number {
  let count = 0;
  const dirs = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];
  for (const d of dirs) {
    const nx = cell.x + d.dx;
    const ny = cell.y + d.dy;
    if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && shapeMask[ny][nx]) {
      if (!occupied.has(`${nx},${ny}`)) {
        count++;
      }
    }
  }
  return count;
}

function getPathDirection(from: Point, to: Point): Direction {
  if (to.x > from.x) return "right";
  if (to.x < from.x) return "left";
  if (to.y > from.y) return "down";
  return "up";
}

function getDistanceToBoundary(
  head: Point,
  dir: Direction,
  rows: number,
  cols: number
): number {
  if (dir === "left") return head.x;
  if (dir === "right") return cols - 1 - head.x;
  if (dir === "up") return head.y;
  return rows - 1 - head.y;
}

// Validation to check if any isolated unoccupied region is larger than 2 cells
function hasLargeIsolatedEmptyRegions(
  occupied: Set<string>,
  shapeMask: boolean[][],
  rows: number,
  cols: number
): boolean {
  const visited = new Set<string>();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!shapeMask[r][c] || occupied.has(`${c},${r}`)) continue;
      const key = `${c},${r}`;
      if (visited.has(key)) continue;

      const component: Point[] = [{ x: c, y: r }];
      visited.add(key);
      let qIdx = 0;

      while (qIdx < component.length) {
        const curr = component[qIdx++];
        const dirs = [
          { dx: 1, dy: 0 },
          { dx: -1, dy: 0 },
          { dx: 0, dy: 1 },
          { dx: 0, dy: -1 },
        ];
        for (const d of dirs) {
          const nx = curr.x + d.dx;
          const ny = curr.y + d.dy;
          if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && shapeMask[ny][nx]) {
            const nKey = `${nx},${ny}`;
            if (!occupied.has(nKey) && !visited.has(nKey)) {
              visited.add(nKey);
              component.push({ x: nx, y: ny });
            }
          }
        }
      }

      if (component.length > 2) {
        return true; // found isolated region of empty cells larger than 2
      }
    }
  }

  return false;
}

// Simulation metrics analyzer
function analyzeGridMetrics(
  arrows: Arrow[],
  rows: number,
  cols: number
): { metrics: LevelMetrics; difficulty: "Easy" | "Normal" | "Hard" | "Expert" | "Master" } {
  const arrowCount = arrows.length;
  let totalLength = 0;
  for (const a of arrows) {
    totalLength += a.cells.length;
  }
  const averageArrowLength = arrowCount > 0 ? totalLength / arrowCount : 0;

  // 1. Calculate intersections (dependencies)
  let intersections = 0;
  for (const a of arrows) {
    const head = a.cells[a.cells.length - 1];
    const dir = a.direction;
    let cx = head.x;
    let cy = head.y;
    while (true) {
      if (dir === "right") cx++;
      else if (dir === "left") cx--;
      else if (dir === "down") cy++;
      else cy--;

      if (cx < 0 || cx >= cols || cy < 0 || cy >= rows) break;

      const blocker = arrows.find(
        (other) =>
          other.id !== a.id &&
          other.cells.some((c) => c.x === cx && c.y === cy)
      );
      if (blocker) {
        intersections++;
      }
    }
  }

  // 2. Simulate solution and gather branching factor
  const removed = new Set<string>();
  let branchingSum = 0;
  let stepsCount = 0;
  let removableAtStart = 0;

  const getEscapableList = (): Arrow[] => {
    const escapable: Arrow[] = [];
    const otherOccupied = new Set<string>();
    for (const a of arrows) {
      if (!removed.has(a.id)) {
        for (const cell of a.cells) {
          otherOccupied.add(`${cell.x},${cell.y}`);
        }
      }
    }

    for (const a of arrows) {
      if (removed.has(a.id)) continue;

      const head = a.cells[a.cells.length - 1];
      const dir = a.direction;
      let cx = head.x;
      let cy = head.y;
      let blocked = false;

      while (true) {
        if (dir === "right") cx++;
        else if (dir === "left") cx--;
        else if (dir === "down") cy++;
        else cy--;

        if (cx < 0 || cx >= cols || cy < 0 || cy >= rows) break;

        const key = `${cx},${cy}`;
        if (otherOccupied.has(key) && !a.cells.some((c) => c.x === cx && c.y === cy)) {
          blocked = true;
          break;
        }
      }

      if (!blocked) {
        escapable.push(a);
      }
    }

    return escapable;
  };

  while (removed.size < arrows.length) {
    const escapable = getEscapableList();
    if (stepsCount === 0) {
      removableAtStart = escapable.length;
    }

    if (escapable.length === 0) {
      break; // Unsolvable layout
    }

    branchingSum += escapable.length;
    stepsCount++;

    removed.add(escapable[0].id);
  }

  const deadEnds = arrowCount - removableAtStart;
  const branchingFactor = stepsCount > 0 ? branchingSum / stepsCount : 0;

  const metrics: LevelMetrics = {
    arrowCount,
    averageArrowLength,
    intersections,
    deadEnds,
    removableArrowsAtStart: removableAtStart,
    branchingFactor,
  };

  // Complexity difficulty score formula
  const score =
    arrowCount * 1.8 +
    averageArrowLength * 2.2 +
    intersections * 0.9 -
    removableAtStart * 3.5;

  let difficulty: "Easy" | "Normal" | "Hard" | "Expert" | "Master" = "Normal";
  if (score < 18) difficulty = "Easy";
  else if (score < 35) difficulty = "Normal";
  else if (score < 55) difficulty = "Hard";
  else if (score < 80) difficulty = "Expert";
  else difficulty = "Master";

  return { metrics, difficulty };
}

// Microsecond solver
function solveGrid(arrows: Arrow[], rows: number, cols: number): boolean {
  const removed = new Set<string>();

  const canEscapeSim = (arrow: Arrow): boolean => {
    const otherOccupied = new Set<string>();
    for (const a of arrows) {
      if (a.id !== arrow.id && !removed.has(a.id)) {
        for (const cell of a.cells) {
          otherOccupied.add(`${cell.x},${cell.y}`);
        }
      }
    }

    const head = arrow.cells[arrow.cells.length - 1];
    const dir = arrow.direction;
    let cx = head.x;
    let cy = head.y;

    while (true) {
      if (dir === "right") cx++;
      else if (dir === "left") cx--;
      else if (dir === "down") cy++;
      else cy--;

      if (cx < 0 || cx >= cols || cy < 0 || cy >= rows) {
        break;
      }

      if (otherOccupied.has(`${cx},${cy}`)) {
        return false;
      }
    }

    return true;
  };

  let progress = true;
  while (progress && removed.size < arrows.length) {
    progress = false;
    for (const a of arrows) {
      if (!removed.has(a.id) && canEscapeSim(a)) {
        removed.add(a.id);
        progress = true;
        break;
      }
    }
  }

  return removed.size === arrows.length;
}

// Main procedural level generator
export function generateLevel(levelNumber: number): GridState {
  const levelSeed = levelNumber * 2654435761 + 1013904223;
  const rand = mulberry32(levelSeed);

  // 1. Get seeded shape and grid size
  const { rows, cols, shape } = getGridSizeAndShape(levelNumber, rand);
  const shapeMask = getShapeMask(shape, rows, cols);

  // Count active cells in shape mask
  let totalActive = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (shapeMask[r][c]) totalActive++;
    }
  }

  let attempts = 0;
  while (attempts < 1000) {
    attempts++;
    const arrows: Arrow[] = [];
    const occupied = new Set<string>();
    let arrowIdCounter = 0;

    const failedStartCells = new Set<string>();

    while (true) {
      // Find all unoccupied playable cells
      const freeCells: Point[] = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const key = `${c},${r}`;
          if (shapeMask[r][c] && !occupied.has(key)) {
            freeCells.push({ x: c, y: r });
          }
        }
      }

      if (freeCells.length === 0) break;

      // Warnsdorff score
      const cellScores = freeCells.map((cell) => ({
        cell,
        score: getFreeNeighborCount(cell, occupied, shapeMask, rows, cols),
      }));

      const validStartCells = cellScores.filter(
        (item) =>
          item.score > 0 &&
          !failedStartCells.has(`${item.cell.x},${item.cell.y}`)
      );

      if (validStartCells.length === 0) break;

      // Prefer cells with fewest unoccupied neighbors (corners and wall-huggers)
      validStartCells.sort((a, b) => a.score - b.score);

      const minScore = validStartCells[0].score;
      const candidates = validStartCells.filter((item) => item.score === minScore);
      const chosenItem = candidates[Math.floor(rand() * candidates.length)];
      const startCell = chosenItem.cell;

      let path: Point[] | null = null;
      // Target winding length between 5 and 12, scaling down to 3 if blocked
      const startLen = Math.min(12, Math.max(3, 5 + Math.floor(rand() * 8)));

      for (let len = startLen; len >= 3; len--) {
        path = findPathBacktracking(startCell, len, occupied, shapeMask, rows, cols, rand);
        if (path) break;
      }

      if (!path) {
        failedStartCells.add(`${startCell.x},${startCell.y}`);
        continue;
      }

      // Orientation scoring: Normal vs Reversed path directions
      const dirNormal = getPathDirection(path[path.length - 2], path[path.length - 1]);
      const distNormal = getDistanceToBoundary(path[path.length - 1], dirNormal, rows, cols);

      const dirReversed = getPathDirection(path[1], path[0]);
      const distReversed = getDistanceToBoundary(path[0], dirReversed, rows, cols);

      let finalPath = path;
      let finalDir = dirNormal;

      if (distReversed < distNormal) {
        finalPath = [...path].reverse();
        finalDir = dirReversed;
      }

      for (const p of finalPath) {
        occupied.add(`${p.x},${p.y}`);
      }

      arrows.push({
        id: `A-${levelNumber}-${arrowIdCounter++}`,
        direction: finalDir,
        cells: finalPath,
        isRemoved: false,
      });

      failedStartCells.clear();
    }

    const occupiedCount = occupied.size;
    const coverage = occupiedCount / totalActive;

    // Strict target coverage: 92%-98%
    let targetCoverage = 0.95;
    if (attempts > 200) targetCoverage = 0.92;
    if (attempts > 500) targetCoverage = 0.90;

    if (coverage >= targetCoverage && coverage <= 0.98) {
      // Reject if any isolated empty region is larger than 2 cells
      if (hasLargeIsolatedEmptyRegions(occupied, shapeMask, rows, cols)) {
        continue;
      }

      // Verify solvability
      if (solveGrid(arrows, rows, cols)) {
        const { metrics, difficulty } = analyzeGridMetrics(arrows, rows, cols);

        return {
          rows,
          cols,
          shape,
          shapeMask,
          arrows,
          levelNumber,
          totalArrows: arrows.length,
          removedCount: 0,
          seed: levelSeed,
          difficulty,
          metrics,
        };
      }
    }
  }

  // Fallback: simple dense, solvable layout of straight rows
  const fallbackArrows: Arrow[] = [];
  let arrowId = 0;
  for (let r = 0; r < rows; r++) {
    const path: Point[] = [];
    const dir = r % 2 === 0 ? "right" : "left";
    if (dir === "right") {
      for (let c = 0; c < cols; c++) {
        if (shapeMask[r][c]) path.push({ x: c, y: r });
      }
    } else {
      for (let c = cols - 1; c >= 0; c--) {
        if (shapeMask[r][c]) path.push({ x: c, y: r });
      }
    }
    if (path.length >= 3) {
      fallbackArrows.push({
        id: `A-${levelNumber}-FB-${arrowId++}`,
        direction: dir,
        cells: path,
        isRemoved: false,
      });
    }
  }

  const { metrics, difficulty } = analyzeGridMetrics(fallbackArrows, rows, cols);

  return {
    rows,
    cols,
    shape,
    shapeMask,
    arrows: fallbackArrows,
    levelNumber,
    totalArrows: fallbackArrows.length,
    removedCount: 0,
    seed: levelSeed,
    difficulty,
    metrics,
  };
}
