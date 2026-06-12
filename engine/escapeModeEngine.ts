import { SHAPE_MASKS, SHAPE_ORDER } from '../constants/shapes';

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface Node {
  id: string; // "x,y"
  x: number;
  y: number;
  direction: Direction;
  isExit: boolean;
}

export interface EscapeGrid {
  rows: number;
  cols: number;
  nodes: Record<string, Node>;
  shapeMask: number[][];
  exitNodeId: string;
  solutionStartId: string;
  levelNumber: number;
}


// Helper to check if coordinate is inside grid bounds and shape mask
export function isPlayable(x: number, y: number, mask: number[][]): boolean {
  const rows = mask.length;
  if (rows === 0) return false;
  const cols = mask[0].length;
  return y >= 0 && y < rows && x >= 0 && x < cols && mask[y][x] === 1;
}

// ── PROCEDURAL LEVEL GENERATOR ──────────────────────────────────────────────
export function generateEscapeLevel(level: number): EscapeGrid {
  // Determine shape to use
  const shapeName = SHAPE_ORDER[(level - 1) % SHAPE_ORDER.length];
  const shapeMask = SHAPE_MASKS[shapeName];
  const rows = shapeMask.length;
  const cols = shapeMask[0].length;

  const nodes: Record<string, Node> = {};
  const visited = new Set<string>();

  // Helper to find all playable coords
  const playableCoords: { x: number; y: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (shapeMask[r][c] === 1) {
        playableCoords.push({ x: c, y: r });
      }
    }
  }

  // 1. Find perimeter nodes
  // A cell is perimeter if at least one cardinal neighbor is out-of-bounds or 0-masked
  const perimeterCoords: { x: number; y: number; outDirs: Direction[] }[] = [];
  for (const { x, y } of playableCoords) {
    const outDirs: Direction[] = [];
    if (!isPlayable(x, y - 1, shapeMask)) outDirs.push('UP');
    if (!isPlayable(x, y + 1, shapeMask)) outDirs.push('DOWN');
    if (!isPlayable(x - 1, y, shapeMask)) outDirs.push('LEFT');
    if (!isPlayable(x + 1, y, shapeMask)) outDirs.push('RIGHT');

    if (outDirs.length > 0) {
      perimeterCoords.push({ x, y, outDirs });
    }
  }

  // Seeded Random Helper
  let seed = level * 12345;
  const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  const choice = <T>(arr: T[]): T => arr[Math.floor(random() * arr.length)];

  // Step A: Pick Exit Node
  const exitChoice = choice(perimeterCoords);
  const exitId = `${exitChoice.x},${exitChoice.y}`;
  const exitDir = choice(exitChoice.outDirs);

  nodes[exitId] = {
    id: exitId,
    x: exitChoice.x,
    y: exitChoice.y,
    direction: exitDir,
    isExit: true,
  };
  visited.add(exitId);

  // Step B: Backward Walk to build solution path
  let currentX = exitChoice.x;
  let currentY = exitChoice.y;
  const solutionChain: string[] = [exitId];

  // Configure path length based on level difficulty (e.g. min 5, max 15)
  const targetPathLength = Math.min(15, 5 + Math.floor(level / 2));

  for (let step = 0; step < targetPathLength; step++) {
    const neighbors: { x: number; y: number; dirFromNeighbor: Direction }[] = [];
    const candidates = [
      { dx: 0, dy: -1, dir: 'DOWN' as Direction }, // Up neighbor points DOWN to us
      { dx: 0, dy: 1, dir: 'UP' as Direction },    // Down neighbor points UP to us
      { dx: -1, dy: 0, dir: 'RIGHT' as Direction }, // Left neighbor points RIGHT to us
      { dx: 1, dy: 0, dir: 'LEFT' as Direction },   // Right neighbor points LEFT to us
    ];

    for (const cand of candidates) {
      const nx = currentX + cand.dx;
      const ny = currentY + cand.dy;
      const nid = `${nx},${ny}`;
      if (isPlayable(nx, ny, shapeMask) && !visited.has(nid)) {
        neighbors.push({ x: nx, y: ny, dirFromNeighbor: cand.dir });
      }
    }

    if (neighbors.length === 0) break; // Dead end in backward walk

    const nextCell = choice(neighbors);
    const nextId = `${nextCell.x},${nextCell.y}`;

    nodes[nextId] = {
      id: nextId,
      x: nextCell.x,
      y: nextCell.y,
      direction: nextCell.dirFromNeighbor,
      isExit: false,
    };

    visited.add(nextId);
    solutionChain.push(nextId);
    currentX = nextCell.x;
    currentY = nextCell.y;
  }

  // The starting point of the solution chain is the last node added during backward walk
  const solutionStartId = solutionChain[solutionChain.length - 1];

  // Step C: Noise & Decoy Generation for remaining unvisited cells
  const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

  for (const { x, y } of playableCoords) {
    const id = `${x},${y}`;
    if (visited.has(id)) continue;

    // Create noise arrow pointing in a random direction
    // Decoy logic: 30% of the time, try to point toward an adjacent visited node to confuse players
    let direction = choice(directions);
    if (random() < 0.3) {
      const visitedNeighbors: Direction[] = [];
      if (visited.has(`${x},${y - 1}`)) visitedNeighbors.push('UP');
      if (visited.has(`${x},${y + 1}`)) visitedNeighbors.push('DOWN');
      if (visited.has(`${x - 1},${y}`)) visitedNeighbors.push('LEFT');
      if (visited.has(`${x + 1},${y}`)) visitedNeighbors.push('RIGHT');
      if (visitedNeighbors.length > 0) {
        direction = choice(visitedNeighbors);
      }
    }

    nodes[id] = {
      id,
      x,
      y,
      direction,
      isExit: false,
    };
  }

  return {
    rows,
    cols,
    nodes,
    shapeMask,
    exitNodeId: exitId,
    solutionStartId,
    levelNumber: level,
  };
}

// ── SOLVABILITY VALIDATOR (PATH TRACER) ──────────────────────────────────────
export interface TraceResult {
  escapes: boolean;
  path: string[]; // Node IDs visited in order
}

export function tracePath(
  startId: string,
  nodes: Record<string, Node>,
  mask: number[][]
): TraceResult {
  const path: string[] = [];
  const visited = new Set<string>();
  let currentId = startId;

  while (true) {
    const node = nodes[currentId];
    if (!node) {
      // Out of bounds or empty cell
      return { escapes: false, path };
    }

    path.push(currentId);
    visited.add(currentId);

    if (node.isExit) {
      // Path successfully escaped at exit node
      return { escapes: true, path };
    }

    // Move in node's direction
    let nextX = node.x;
    let nextY = node.y;
    if (node.direction === 'UP') nextY -= 1;
    else if (node.direction === 'DOWN') nextY += 1;
    else if (node.direction === 'LEFT') nextX -= 1;
    else if (node.direction === 'RIGHT') nextX += 1;

    const nextId = `${nextX},${nextY}`;

    // Loop detection
    if (visited.has(nextId)) {
      path.push(nextId); // Show the loop overlap
      return { escapes: false, path };
    }

    // Check if next node is playable
    if (!isPlayable(nextX, nextY, mask)) {
      // Directed arrow runs out of bounds/mask on a non-exit node (Dead End)
      path.push(nextId);
      return { escapes: false, path };
    }

    currentId = nextId;
  }
}
