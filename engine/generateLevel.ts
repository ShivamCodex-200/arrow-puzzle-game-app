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

// Sizing logic that assigns dynamic, randomized, and screen-ratio friendly sizes per level
function getGridSizeForSeed(level: number): { rows: number; cols: number } {
  const shape = getShapeForLevel(level);

  // If it's a shape level, we want a square grid to avoid shape distortion
  if (shape !== "rectangle") {
    let size = 12;
    if (level <= 10) size = 12;
    else if (level <= 30) size = 14;
    else if (level <= 70) size = 16;
    else size = 18;
    return { rows: size, cols: size };
  }

  // Use a deterministic seed to make sizes stable per level number
  const levelSeed = level * 1618033988 + 9973;
  const rand = mulberry32(levelSeed);

  let minCols = 7;
  let maxCols = 9;
  let minDiff = 3;
  let maxDiff = 5;

  if (level <= 10) {
    minCols = 7;
    maxCols = 9;
    minDiff = 3;
    maxDiff = 5;
  } else if (level <= 30) {
    minCols = 9;
    maxCols = 11;
    minDiff = 4;
    maxDiff = 6;
  } else if (level <= 70) {
    minCols = 11;
    maxCols = 13;
    minDiff = 4;
    maxDiff = 7;
  } else if (level <= 150) {
    minCols = 12;
    maxCols = 14;
    minDiff = 5;
    maxDiff = 8;
  } else {
    minCols = 13;
    maxCols = 15;
    minDiff = 6;
    maxDiff = 9;
  }

  const cols = minCols + Math.floor(rand() * (maxCols - minCols + 1));
  const diff = minDiff + Math.floor(rand() * (maxDiff - minDiff + 1));
  const rows = cols + diff;

  return { rows, cols };
}

export function getGridSize(level: number): { rows: number; cols: number } {
  const size = getGridSizeForSeed(level);
  if (level <= 4) return size;

  const s1 = getGridSizeForSeed(level - 1);
  const s2 = getGridSizeForSeed(level - 2);
  const s3 = getGridSizeForSeed(level - 3);

  // Avoid more than 3 consecutive levels with the exact same dimensions
  if (
    size.rows === s1.rows && size.cols === s1.cols &&
    s1.rows === s2.rows && s1.cols === s2.cols &&
    s2.rows === s3.rows && s2.cols === s3.cols
  ) {
    const levelSeed = level * 1618033988 + 9973;
    const rand = mulberry32(levelSeed);
    const perturbRows = rand() < 0.5;
    if (perturbRows) {
      const change = rand() < 0.5 ? 1 : -1;
      const newRows = size.rows + change;
      if (newRows > size.cols + 1) {
        return { rows: newRows, cols: size.cols };
      }
    }
    const change = rand() < 0.5 ? 1 : -1;
    const newCols = size.cols + change;
    if (size.rows > newCols + 1) {
      return { rows: size.rows, cols: newCols };
    }
  }

  return size;
}

// Determines the shape category for a given level
export function getShapeForLevel(level: number): ShapeType {
  // Shape milestones (high achievements)
  if (level === 100) return "diamond";
  if (level === 250) return "circle";
  if (level === 500) return "cross";
  if (level === 1000) return "spiral";

  // Level 6 is heart shape as shown in screenshot
  if (level === 6) return "heart";

  // A shape level occurs every 12 to 15 levels deterministically
  const shapeLevels = [6, 18, 32, 45, 58, 72, 85, 115, 128, 142, 155, 168, 182, 195, 208, 222, 235, 248, 262, 275, 288];
  
  let isShape = shapeLevels.includes(level);
  if (level > 300) {
    isShape = (level - 301) % 13 === 0;
  }

  if (!isShape) return "rectangle";

  // Select a non-rectangle shape deterministically based on level seed
  const shapes: ShapeType[] = ["heart", "circle", "diamond", "cross", "spiral", "donut", "hex"];
  const levelSeed = level * 1618033988 + 9973;
  const rand = mulberry32(levelSeed);
  return shapes[Math.floor(rand() * shapes.length)];
}

// Multi-dimension and Shape progression
function getGridSizeAndShape(
  level: number,
  rand: () => number
): { rows: number; cols: number; shape: ShapeType } {
  const shape = getShapeForLevel(level);
  const { rows, cols } = getGridSize(level);
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

        case "heart":
          // Heart shape algebraic formula
          const hx = cols > 1 ? (c - (cols - 1) / 2) / ((cols - 1) / 2) * 1.3 : 0;
          const hy = rows > 1 ? -((r - (rows - 1) / 2) / ((rows - 1) / 2) * 1.2 - 0.15) : 0;
          const hVal = Math.pow(hx * hx + hy * hy - 0.95, 3) - hx * hx * Math.pow(hy, 3);
          active = hVal <= 0;
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
  occupied: Uint8Array,
  shapeMask: boolean[][],
  rows: number,
  cols: number,
  rand: () => number,
  pathVisited: Uint8Array
): Point[] | null {
  const path: Point[] = [start];
  pathVisited.fill(0);
  pathVisited[start.y * cols + start.x] = 1;

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
          const idx = ny * cols + nx;
          if (occupied[idx] === 0 && pathVisited[idx] === 0) {
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
      const idx = next.y * cols + next.x;
      pathVisited[idx] = 1;

      if (dfs(next)) {
        return true;
      }

      path.pop();
      pathVisited[idx] = 0;
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
  occupied: Uint8Array,
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
      const idx = ny * cols + nx;
      if (occupied[idx] === 0) {
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

// Microsecond solver using fast flat occupied arrays
function solveGrid(arrows: Arrow[], rows: number, cols: number): boolean {
  const numArrows = arrows.length;
  const occupied = new Uint8Array(rows * cols);

  for (const a of arrows) {
    for (const cell of a.cells) {
      occupied[cell.y * cols + cell.x] = 1;
    }
  }

  const removed = new Uint8Array(numArrows);
  let removedCount = 0;

  function canEscapeSim(arrow: Arrow): boolean {
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

      const idx = cy * cols + cx;
      if (occupied[idx] === 1) {
        return false;
      }
    }

    return true;
  }

  let progress = true;
  while (progress && removedCount < numArrows) {
    progress = false;
    for (let i = 0; i < numArrows; i++) {
      if (removed[i] === 1) continue;
      const a = arrows[i];

      // Temporarily clear current arrow's cells
      for (const cell of a.cells) {
        occupied[cell.y * cols + cell.x] = 0;
      }

      if (canEscapeSim(a)) {
        removed[i] = 1;
        removedCount++;
        progress = true;
        break;
      } else {
        // Restore current arrow's cells
        for (const cell of a.cells) {
          occupied[cell.y * cols + cell.x] = 1;
        }
      }
    }
  }

  return removedCount === numArrows;
}

// Dead-end pruning check: returns true if any isolated group of free cells has size < 3
function isPackingDeadEnd(
  occupied: Uint8Array,
  shapeMask: boolean[][],
  rows: number,
  cols: number,
  visited: Int32Array,
  q: Int32Array,
  visitedToken: { value: number }
): boolean {
  visitedToken.value++;
  const token = visitedToken.value;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      if (!shapeMask[r][c] || occupied[idx] === 1) continue;
      if (visited[idx] === token) continue;

      let qHead = 0;
      let qTail = 0;
      q[qTail++] = idx;
      visited[idx] = token;

      while (qHead < qTail) {
        const currIdx = q[qHead++];
        const cx = currIdx % cols;
        const cy = Math.floor(currIdx / cols);

        const dirs = [
          { dx: 1, dy: 0 },
          { dx: -1, dy: 0 },
          { dx: 0, dy: 1 },
          { dx: 0, dy: -1 },
        ];
        for (const d of dirs) {
          const nx = cx + d.dx;
          const ny = cy + d.dy;
          if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && shapeMask[ny][nx]) {
            const nIdx = ny * cols + nx;
            if (occupied[nIdx] === 0 && visited[nIdx] !== token) {
              visited[nIdx] = token;
              q[qTail++] = nIdx;
            }
          }
        }
      }

      if (qTail < 3) {
        return true; // Prune!
      }
    }
  }

  return false;
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
  // Try to find a perfect 100% covered, solvable board first
  while (attempts < 500) {
    attempts++;
    const arrows: Arrow[] = [];
    
    // Fast flat structures
    const occupied = new Uint8Array(rows * cols);
    const visited = new Int32Array(rows * cols);
    const q = new Int32Array(rows * cols);
    const visitedToken = { value: 0 };
    const pathVisited = new Uint8Array(rows * cols);

    let recursiveSteps = 0;

    function pack(occupiedCount: number): boolean {
      recursiveSteps++;
      if (recursiveSteps > 1500) {
        return false; // Limit depth to prevent UI freeze
      }

      if (occupiedCount === totalActive) {
        return solveGrid(arrows, rows, cols);
      }

      if (isPackingDeadEnd(occupied, shapeMask, rows, cols, visited, q, visitedToken)) {
        return false;
      }

      const freeCells: Point[] = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          if (shapeMask[r][c] && occupied[idx] === 0) {
            freeCells.push({ x: c, y: r });
          }
        }
      }

      if (freeCells.length === 0) return false;

      const cellScores = freeCells.map((cell) => ({
        cell,
        score: getFreeNeighborCount(cell, occupied, shapeMask, rows, cols),
      }));

      const validStartCells = cellScores.filter((item) => item.score > 0);
      if (validStartCells.length === 0) return false;

      validStartCells.sort((a, b) => a.score - b.score);

      const minScore = validStartCells[0].score;
      const candidates = validStartCells.filter((item) => item.score === minScore);
      const chosenItem = candidates[Math.floor(rand() * candidates.length)];
      const startCell = chosenItem.cell;

      const startLen = Math.min(12, Math.max(3, 5 + Math.floor(rand() * 8)));

      for (let len = startLen; len >= 3; len--) {
        const path = findPathBacktracking(startCell, len, occupied, shapeMask, rows, cols, rand, pathVisited);
        if (!path) continue;

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

        // Add path to occupied
        for (const p of finalPath) {
          occupied[p.y * cols + p.x] = 1;
        }

        const newArrow: Arrow = {
          id: `A-${levelNumber}-${arrows.length}`,
          direction: finalDir,
          cells: finalPath,
          isRemoved: false,
        };
        arrows.push(newArrow);

        if (pack(occupiedCount + finalPath.length)) {
          return true;
        }

        // Backtrack
        arrows.pop();
        for (const p of finalPath) {
          occupied[p.y * cols + p.x] = 0;
        }
      }

      return false;
    }

    if (pack(0)) {
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

  // Fallback: If 100% packing is slow, run a relaxed greedy pack that targets 92%+ coverage
  let fallbackAttempts = 0;
  while (fallbackAttempts < 200) {
    fallbackAttempts++;
    const arrows: Arrow[] = [];
    const occupied = new Uint8Array(rows * cols);
    let arrowIdCounter = 0;
    const failedStartCells = new Uint8Array(rows * cols);
    const pathVisited = new Uint8Array(rows * cols);

    while (true) {
      const freeCells: Point[] = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          if (shapeMask[r][c] && occupied[idx] === 0) {
            freeCells.push({ x: c, y: r });
          }
        }
      }

      if (freeCells.length === 0) break;

      const cellScores = freeCells.map((cell) => ({
        cell,
        score: getFreeNeighborCount(cell, occupied, shapeMask, rows, cols),
      }));

      const validStartCells = cellScores.filter(
        (item) =>
          item.score > 0 &&
          failedStartCells[item.cell.y * cols + item.cell.x] === 0
      );

      if (validStartCells.length === 0) break;

      validStartCells.sort((a, b) => a.score - b.score);

      const minScore = validStartCells[0].score;
      const candidates = validStartCells.filter((item) => item.score === minScore);
      const chosenItem = candidates[Math.floor(rand() * candidates.length)];
      const startCell = chosenItem.cell;

      let path: Point[] | null = null;
      const startLen = Math.min(12, Math.max(3, 5 + Math.floor(rand() * 8)));

      for (let len = startLen; len >= 3; len--) {
        path = findPathBacktracking(startCell, len, occupied, shapeMask, rows, cols, rand, pathVisited);
        if (path) break;
      }

      if (!path) {
        failedStartCells[startCell.y * cols + startCell.x] = 1;
        continue;
      }

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
        occupied[p.y * cols + p.x] = 1;
      }

      arrows.push({
        id: `A-${levelNumber}-${arrowIdCounter++}`,
        direction: finalDir,
        cells: finalPath,
        isRemoved: false,
      });

      failedStartCells.fill(0);
    }

    let occupiedCount = 0;
    for (let i = 0; i < occupied.length; i++) {
      if (occupied[i] === 1) occupiedCount++;
    }
    const coverage = occupiedCount / totalActive;
    if (coverage >= 0.92 && solveGrid(arrows, rows, cols)) {
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

  // Double fallback: straight grid of arrows
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
