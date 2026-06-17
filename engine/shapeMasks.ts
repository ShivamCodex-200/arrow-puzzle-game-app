export function getShapeMask(
  levelNumber: number,
  rows: number,
  cols: number
): boolean[][] {
  const full = (): boolean[][] =>
    Array.from({ length: rows }, () => new Array<boolean>(cols).fill(true));

  let mask: boolean[][];

  if (levelNumber <= 5) {
    // Simple rectangle - no border removal for small grids
    mask = full();
  } else if (levelNumber <= 15) {
    // Octagon: cut corners
    mask = full();
    const cut = Math.floor(Math.min(rows, cols) * 0.15);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (
          r + c < cut ||
          r + (cols - 1 - c) < cut ||
          (rows - 1 - r) + c < cut ||
          (rows - 1 - r) + (cols - 1 - c) < cut
        ) {
          mask[r][c] = false;
        }
      }
    }
  } else if (levelNumber <= 30) {
    // Triangle/pyramid
    mask = full();
    for (let r = 0; r < rows; r++) {
      const halfWidth = Math.floor((cols / 2) * (r / (rows - 1)) + 1);
      const centerC = Math.floor(cols / 2);
      for (let c = 0; c < cols; c++) {
        if (Math.abs(c - centerC) > halfWidth) {
          mask[r][c] = false;
        }
      }
    }
  } else if (levelNumber <= 60) {
    // Diamond
    mask = full();
    const centerR = (rows - 1) / 2;
    const centerC = (cols - 1) / 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const distR = Math.abs(r - centerR) / (rows / 2);
        const distC = Math.abs(c - centerC) / (cols / 2);
        if (distR + distC > 1.0) {
          mask[r][c] = false;
        }
      }
    }
  } else {
    // Cross / plus shape
    mask = Array.from({ length: rows }, () => new Array<boolean>(cols).fill(false));
    const midR = Math.floor(rows / 2);
    const midC = Math.floor(cols / 2);
    const armW = Math.floor(Math.min(rows, cols) * 0.35);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (
          Math.abs(r - midR) <= armW ||
          Math.abs(c - midC) <= armW
        ) {
          mask[r][c] = true;
        }
      }
    }
  }

  return mask;
}
