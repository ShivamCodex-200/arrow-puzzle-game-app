import type { Arrow, Direction, Point } from './types';

export interface DailyChallenge {
  id: string;
  date: string;
  difficulty: "easy" | "medium" | "hard" | "expert";
  boardWidth: number;
  boardHeight: number;
  arrows: Arrow[];
  rewardCoins: number;
}

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

// Convert string date (YYYY-MM-DD) into numerical seed
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Get direction from point A to point B
function getPathDirection(from: Point, to: Point): Direction {
  if (to.x > from.x) return "right";
  if (to.x < from.x) return "left";
  if (to.y > from.y) return "down";
  return "up";
}

// Helper to check if unvisited cell coordinates are valid
function isValidAndUnvisited(x: number, y: number, rows: number, cols: number, visited: boolean[][]): boolean {
  return x >= 0 && x < cols && y >= 0 && y < rows && !visited[y][x];
}

// Count unvisited neighbors of a cell
function getUnvisitedNeighborCount(x: number, y: number, rows: number, cols: number, visited: boolean[][]): number {
  let count = 0;
  const dirs = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];
  for (const d of dirs) {
    if (isValidAndUnvisited(x + d.dx, y + d.dy, rows, cols, visited)) {
      count++;
    }
  }
  return count;
}

// Generates a fully solvable, high-density daily challenge board
export function generateDailyChallenge(dateStr: string): DailyChallenge {
  const seed = hashCode(dateStr);

  // Determine difficulty based on seed
  const diffs: ("easy" | "medium" | "hard" | "expert")[] = ["easy", "medium", "hard", "expert"];
  const difficulty = diffs[seed % diffs.length];

  // Map difficulty to grid dimensions and reward coins
  let rows = 20;
  let cols = 20;
  let rewardCoins = 30;

  if (difficulty === "medium") {
    rows = 24;
    cols = 24;
    rewardCoins = 50;
  } else if (difficulty === "hard") {
    rows = 28;
    cols = 28;
    rewardCoins = 75;
  } else if (difficulty === "expert") {
    rows = 30;
    cols = 30;
    rewardCoins = 100;
  }

  const totalCells = rows * cols;
  let finalArrows: Arrow[] = [];
  let attempt = 0;
  const maxAttempts = 50;

  while (attempt < maxAttempts) {
    attempt++;
    const attemptSeed = seed + attempt * 12345;
    const rand = mulberry32(attemptSeed);

    const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
    const paths: Point[][] = [];

    // Track unvisited list for O(1) random access and quick neighbor searches
    const unvisitedList: Point[] = [];
    const indexMap = Array.from({ length: rows }, () => Array(cols).fill(0));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        unvisitedList.push({ x: c, y: r });
        indexMap[r][c] = r * cols + c;
      }
    }

    function markVisited(x: number, y: number) {
      if (visited[y][x]) return;
      visited[y][x] = true;
      const idx = indexMap[y][x];
      const last = unvisitedList[unvisitedList.length - 1];
      unvisitedList[idx] = last;
      indexMap[last.y][last.x] = idx;
      unvisitedList.pop();
    }

    // ── STEP 1: INITIAL RANDOMIZED PATH TILING (Sub-sampled Warnsdorff starting choice) ──
    while (unvisitedList.length > 0) {
      // Pick a start cell using tournament selection of 8 random unvisited cells
      const numCandidates = Math.min(8, unvisitedList.length);
      let startCell: Point | null = null;
      let minNeighbors = 5;

      for (let i = 0; i < numCandidates; i++) {
        const randIdx = Math.floor(rand() * unvisitedList.length);
        const cand = unvisitedList[randIdx];
        const count = getUnvisitedNeighborCount(cand.x, cand.y, rows, cols, visited);
        if (count > 0 && count < minNeighbors) {
          minNeighbors = count;
          startCell = cand;
        }
      }

      // Linear search fallback if no candidate has unvisited neighbors
      if (!startCell) {
        for (const cell of unvisitedList) {
          if (getUnvisitedNeighborCount(cell.x, cell.y, rows, cols, visited) > 0) {
            startCell = cell;
            break;
          }
        }
      }

      // If absolutely no cells have unvisited neighbors, remaining cells are isolated
      if (!startCell) break;

      // Grow a simple path of length 3 to 6
      const targetLength = 3 + Math.floor(rand() * 4); // 3 to 6
      const path: Point[] = [{ x: startCell.x, y: startCell.y }];
      markVisited(startCell.x, startCell.y);

      let current: Point = { x: startCell.x, y: startCell.y };
      while (path.length < targetLength) {
        const neighbors: Point[] = [];
        const dirs = [
          { dx: 1, dy: 0 },
          { dx: -1, dy: 0 },
          { dx: 0, dy: 1 },
          { dx: 0, dy: -1 },
        ];
        for (const d of dirs) {
          const nx = current.x + d.dx;
          const ny = current.y + d.dy;
          if (isValidAndUnvisited(nx, ny, rows, cols, visited)) {
            neighbors.push({ x: nx, y: ny });
          }
        }

        if (neighbors.length === 0) break;

        const next = neighbors[Math.floor(rand() * neighbors.length)];
        path.push(next);
        markVisited(next.x, next.y);
        current = next;
      }

      if (path.length >= 3) {
        paths.push(path);
      } else {
        // Backtrack: restore cells to unvisited list
        for (const p of path) {
          visited[p.y][p.x] = false;
          unvisitedList.push(p);
          indexMap[p.y][p.x] = unvisitedList.length - 1;
        }
        // Temporarily mark the starting cell as visited to prevent infinite loop
        markVisited(startCell.x, startCell.y);
      }
    }

    // Clean up temporary starting cells that were marked visited but failed to grow
    for (let r = 0; r < rows; r++) {
      visited[r].fill(false);
    }
    for (const path of paths) {
      for (const p of path) {
        visited[p.y][p.x] = true;
      }
    }

    // ── STEP 2: HEALING/MERGE PHASE ──────────────────────────────────────────

    // Pass 1: Iteratively append/prepend isolated unvisited cells to adjacent paths
    let changed = true;
    while (changed) {
      changed = false;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (visited[r][c]) continue;

          // Look at neighbors of unvisited cell (c, r)
          const dirs = [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 },
          ];
          for (const d of dirs) {
            const nx = c + d.dx;
            const ny = r + d.dy;
            if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
              // Find path that starts or ends at (nx, ny)
              const pathIdx = paths.findIndex(p => {
                return (p[0].x === nx && p[0].y === ny) || 
                       (p[p.length - 1].x === nx && p[p.length - 1].y === ny);
              });

              if (pathIdx !== -1) {
                const path = paths[pathIdx];
                if (path.length < 8) {
                  // Merge!
                  if (path[0].x === nx && path[0].y === ny) {
                    path.unshift({ x: c, y: r });
                  } else {
                    path.push({ x: c, y: r });
                  }
                  visited[r][c] = true;
                  changed = true;
                  break;
                }
              }
            }
          }
          if (visited[r][c]) break;
        }
      }
    }

    // Pass 2: Merge adjacent pairs of unvisited cells into existing paths
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (visited[r][c]) continue;

        // Try to find an adjacent unvisited cell to form a pair
        const dirs = [
          { dx: 1, dy: 0 },
          { dx: -1, dy: 0 },
          { dx: 0, dy: 1 },
          { dx: 0, dy: -1 },
        ];
        for (const d of dirs) {
          const nx = c + d.dx;
          const ny = r + d.dy;
          if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && !visited[ny][nx]) {
            // Found a pair: (c, r) and (nx, ny)
            // Look for a path adjacent to (c, r)'s endpoint
            let merged = false;
            for (const d2 of dirs) {
              const px = c + d2.dx;
              const py = r + d2.dy;
              if (px >= 0 && px < cols && py >= 0 && py < rows && (px !== nx || py !== ny)) {
                const pathIdx = paths.findIndex(p => {
                  return (p[0].x === px && p[0].y === py) || 
                         (p[p.length - 1].x === px && p[p.length - 1].y === py);
                });

                if (pathIdx !== -1) {
                  const path = paths[pathIdx];
                  if (path.length < 7) {
                    if (path[0].x === px && path[0].y === py) {
                      path.unshift({ x: c, y: r });
                      path.unshift({ x: nx, y: ny });
                    } else {
                      path.push({ x: c, y: r });
                      path.push({ x: nx, y: ny });
                    }
                    visited[r][c] = true;
                    visited[ny][nx] = true;
                    merged = true;
                    break;
                  }
                }
              }
            }

            if (merged) break;
          }
        }
      }
    }

    // Pass 3: Gather remaining unvisited cells and form paths of length 3+ if possible
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (visited[r][c]) continue;

        // Grow a path of length 3 out of unvisited cells
        const path: Point[] = [{ x: c, y: r }];
        visited[r][c] = true;
        let current = { x: c, y: r };

        while (path.length < 3) {
          const neighbors: Point[] = [];
          const dirs = [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 },
          ];
          for (const d of dirs) {
            const nx = current.x + d.dx;
            const ny = current.y + d.dy;
            if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && !visited[ny][nx]) {
              neighbors.push({ x: nx, y: ny });
            }
          }
          if (neighbors.length === 0) break;
          const next = neighbors[Math.floor(rand() * neighbors.length)];
          path.push(next);
          visited[next.y][next.x] = true;
          current = next;
        }

        if (path.length >= 3) {
          paths.push(path);
        } else {
          // Roll back
          for (const p of path) {
            visited[p.y][p.x] = false;
          }
        }
      }
    }

    // ── STEP 3: DENSITY CHECK ───────────────────────────────────────────────
    let occupiedCount = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (visited[r][c]) occupiedCount++;
      }
    }

    const coverage = occupiedCount / totalCells;
    if (coverage < 0.95) {
      continue; // Density target not met, retry with next seed
    }

    // ── STEP 4: SOLVABILITY VALIDATION & DIRECTION ASSIGNMENT ────────────────
    const orientedArrows = solveAndAssignDirections(paths, rows, cols, rand, dateStr);
    if (orientedArrows) {
      finalArrows = orientedArrows;
      break; // Successfully generated and solved!
    }
  }

  // Fallback in case of failure after max attempts
  if (finalArrows.length === 0) {
    // Basic fallback: horizontal rows of straight arrows
    let idCounter = 0;
    for (let r = 0; r < rows; r++) {
      const dir: Direction = r % 2 === 0 ? "right" : "left";
      const path: Point[] = [];
      if (dir === "right") {
        for (let c = 0; c < cols; c++) {
          path.push({ x: c, y: r });
        }
      } else {
        for (let c = cols - 1; c >= 0; c--) {
          path.push({ x: c, y: r });
        }
      }

      // Slice the row into paths of length 5
      for (let i = 0; i < path.length; i += 5) {
        const slice = path.slice(i, i + 5);
        if (slice.length >= 3) {
          finalArrows.push({
            id: `daily-${dateStr}-fallback-${idCounter++}`,
            direction: dir,
            cells: slice,
            isRemoved: false,
          });
        }
      }
    }
  }

  return {
    id: `daily-${dateStr}`,
    date: dateStr,
    difficulty,
    boardWidth: cols,
    boardHeight: rows,
    arrows: finalArrows,
    rewardCoins,
  };
}

// Greedy solver to assign arrow directions and verify 100% solvability
function solveAndAssignDirections(
  paths: Point[][],
  rows: number,
  cols: number,
  rand: () => number,
  dateStr: string
): Arrow[] | null {
  const numPaths = paths.length;
  const occupied = new Uint8Array(rows * cols);
  for (const path of paths) {
    for (const p of path) {
      occupied[p.y * cols + p.x] = 1;
    }
  }

  const orientedArrows: Arrow[] = [];
  const removed = new Uint8Array(numPaths);

  // Helper to check if a path from the head cell to the grid boundary is clear
  function isRayClear(x: number, y: number, dir: Direction): boolean {
    let cx = x;
    let cy = y;
    while (true) {
      if (dir === "up") cy--;
      else if (dir === "down") cy++;
      else if (dir === "left") cx--;
      else if (dir === "right") cx++;

      if (cx < 0 || cx >= cols || cy < 0 || cy >= rows) {
        break; // Successfully reached boundary
      }

      if (occupied[cy * cols + cx] === 1) {
        return false; // Blocked by another remaining path
      }
    }
    return true;
  }

  let solvedCount = 0;
  while (solvedCount < numPaths) {
    // Find all paths that can escape in the current state
    const candidates: { pathIdx: number; headIdx: number; dir: Direction }[] = [];

    for (let i = 0; i < numPaths; i++) {
      if (removed[i] === 1) continue;
      const path = paths[i];
      const len = path.length;

      // Check both endpoints as potential head of the arrow
      const heads = [
        { headCell: path[0], prevCell: path[1], headIdx: 0 },
        { headCell: path[len - 1], prevCell: path[len - 2], headIdx: len - 1 },
      ];

      for (const h of heads) {
        const dir = getPathDirection(h.prevCell, h.headCell);
        
        // Temporarily clear current path from occupied to simulate sliding along its own body
        for (const p of path) {
          occupied[p.y * cols + p.x] = 0;
        }

        const clear = isRayClear(h.headCell.x, h.headCell.y, dir);

        // Restore occupied
        for (const p of path) {
          occupied[p.y * cols + p.x] = 1;
        }

        if (clear) {
          candidates.push({ pathIdx: i, headIdx: h.headIdx, dir });
        }
      }
    }

    if (candidates.length === 0) {
      return null; // Unsolvable layout (deadlock)
    }

    // Pick one candidate randomly to keep directions randomized and natural
    const chosen = candidates[Math.floor(rand() * candidates.length)];
    const path = paths[chosen.pathIdx];
    const orientedCells = chosen.headIdx === 0 ? [...path].reverse() : [...path];

    // Remove current path from occupied
    for (const p of path) {
      occupied[p.y * cols + p.x] = 0;
    }
    removed[chosen.pathIdx] = 1;

    orientedArrows.push({
      id: `daily-${dateStr}-${chosen.pathIdx}`,
      direction: chosen.dir,
      cells: orientedCells,
      isRemoved: false,
    });

    solvedCount++;
  }

  return orientedArrows;
}
