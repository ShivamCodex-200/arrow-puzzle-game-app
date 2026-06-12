export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface Node {
  id: string; // "x,y"
  x: number;
  y: number;
  direction: Direction;
  isExit: boolean;
}

export interface DailyGrid {
  rows: number;
  cols: number;
  nodes: Record<string, Node>;
  shapeMask: number[][];
  exitNodeId: string;
  solutionStartId: string;
  dateStr: string;
}

// ── SEED-BASED RANDOM NUMBER GENERATOR (Mulberry32) ──────────────────────────
export function createSeededRandom(seed: number) {
  let s = seed;
  return () => {
    let t = (s += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Convert date string (YYYY-MM-DD) into a numerical hash seed
export function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// ── PROGRAMMATIC MEGA SHAPE MASKS (25x25) ───────────────────────────────────

export function getStarMask(size = 25): number[][] {
  const mask: number[][] = [];
  const cx = (size - 1) / 2;
  const cy = (size - 1) / 2;
  for (let y = 0; y < size; y++) {
    const row: number[] = [];
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const r = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      // 5-point star modulation: 5 lobes
      const starRadius = (size / 2) * (0.35 + 0.65 * Math.abs(Math.sin(angle * 2.5)));
      row.push(r <= starRadius ? 1 : 0);
    }
    mask.push(row);
  }
  return mask;
}

export function getShieldMask(size = 25): number[][] {
  const mask: number[][] = [];
  for (let y = 0; y < size; y++) {
    const row: number[] = [];
    for (let x = 0; x < size; x++) {
      const cx = (size - 1) / 2;
      const dx = Math.abs(x - cx);
      const normalizedY = y / (size - 1);
      
      let maxWidth = size / 2 - 1.5;
      if (normalizedY > 0.35) {
        // Taper bottom down to a point
        maxWidth *= (1.0 - (normalizedY - 0.35) / 0.65);
      }
      row.push(dx <= maxWidth ? 1 : 0);
    }
    mask.push(row);
  }
  return mask;
}

export function getCastleMask(size = 25): number[][] {
  const mask: number[][] = [];
  for (let y = 0; y < size; y++) {
    const row: number[] = [];
    for (let x = 0; x < size; x++) {
      const cx = (size - 1) / 2;
      const dx = Math.abs(x - cx);
      
      if (y < 4) {
        // Battlements: open gaps
        const isBattlement = dx < 2 || (dx > 4 && dx < 8);
        row.push(isBattlement ? 1 : 0);
      } else if (y >= 4 && y < size - 4) {
        // Main tower body
        row.push(dx <= 7.5 ? 1 : 0);
      } else {
        // Wide castle base
        row.push(dx <= 10.5 ? 1 : 0);
      }
    }
    mask.push(row);
  }
  return mask;
}

// Check if cell is playable
export function isPlayable(x: number, y: number, mask: number[][]): boolean {
  const rows = mask.length;
  if (rows === 0) return false;
  const cols = mask[0].length;
  return y >= 0 && y < rows && x >= 0 && x < cols && mask[y][x] === 1;
}

// ── DAILY LEVEL GENERATION ──────────────────────────────────────────────────
export function generateDailyLevel(dateStr: string): DailyGrid {
  const seed = hashCode(dateStr);
  const rand = createSeededRandom(seed);
  
  const choice = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];

  // Choose shape mask based on seed hash
  const shapes = ['star', 'shield', 'castle'];
  const chosenShape = choice(shapes);
  
  const size = 25;
  let shapeMask: number[][];
  if (chosenShape === 'star') {
    shapeMask = getStarMask(size);
  } else if (chosenShape === 'shield') {
    shapeMask = getShieldMask(size);
  } else {
    shapeMask = getCastleMask(size);
  }

  const rows = size;
  const cols = size;
  const nodes: Record<string, Node> = {};
  const visited = new Set<string>();

  // Find all playable coords
  const playableCoords: { x: number; y: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (shapeMask[r][c] === 1) {
        playableCoords.push({ x: c, y: r });
      }
    }
  }

  // Find perimeter coords
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

  // Pick escape Exit Node
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

  // Backward Walk to build solution path
  let currentX = exitChoice.x;
  let currentY = exitChoice.y;
  const solutionChain: string[] = [exitId];

  // Force Daily Challenge solutions to be extremely long and complex (e.g. 40 to 50 steps)
  const targetPathLength = 40 + Math.floor(rand() * 11); // 40-50 steps

  for (let step = 0; step < targetPathLength; step++) {
    const neighbors: { x: number; y: number; dirFromNeighbor: Direction }[] = [];
    const candidates = [
      { dx: 0, dy: -1, dir: 'DOWN' as Direction },
      { dx: 0, dy: 1, dir: 'UP' as Direction },
      { dx: -1, dy: 0, dir: 'RIGHT' as Direction },
      { dx: 1, dy: 0, dir: 'LEFT' as Direction },
    ];

    for (const cand of candidates) {
      const nx = currentX + cand.dx;
      const ny = currentY + cand.dy;
      const nid = `${nx},${ny}`;
      if (isPlayable(nx, ny, shapeMask) && !visited.has(nid)) {
        neighbors.push({ x: nx, y: ny, dirFromNeighbor: cand.dir });
      }
    }

    if (neighbors.length === 0) break;

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

  const solutionStartId = solutionChain[solutionChain.length - 1];

  // Decoy & Loop generation for remainder of the grid
  const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

  for (const { x, y } of playableCoords) {
    const id = `${x},${y}`;
    if (visited.has(id)) continue;

    // Decoy logic: 40% of the time, point toward an adjacent visited node to create interwoven trap loops
    let direction = choice(directions);
    if (rand() < 0.40) {
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
    dateStr,
  };
}

// ── PATH TRACER ─────────────────────────────────────────────────────────────
export interface TraceResult {
  escapes: boolean;
  path: string[];
}

export function traceDailyPath(
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
      return { escapes: false, path };
    }

    path.push(currentId);
    visited.add(currentId);

    if (node.isExit) {
      return { escapes: true, path };
    }

    let nextX = node.x;
    let nextY = node.y;
    if (node.direction === 'UP') nextY -= 1;
    else if (node.direction === 'DOWN') nextY += 1;
    else if (node.direction === 'LEFT') nextX -= 1;
    else if (node.direction === 'RIGHT') nextX += 1;

    const nextId = `${nextX},${nextY}`;

    // Loop detection
    if (visited.has(nextId)) {
      path.push(nextId);
      return { escapes: false, path };
    }

    if (!isPlayable(nextX, nextY, mask)) {
      path.push(nextId);
      return { escapes: false, path };
    }

    currentId = nextId;
  }
}
