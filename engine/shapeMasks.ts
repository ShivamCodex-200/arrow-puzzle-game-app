/**
 * engine/shapeMasks.ts
 *
 * Shape mask definitions for each level range.
 * true = active cell with an arrow, false = empty (background)
 */

/**
 * Returns a 2D boolean mask [row][col]
 */
export function getShapeMask(
  levelNumber: number,
  rows: number,
  cols: number
): boolean[][] {
  // Full rectangle for simplest levels
  const full = (): boolean[][] =>
    Array.from({ length: rows }, () => new Array<boolean>(cols).fill(true));

  if (levelNumber <= 5) {
    // Rounded rectangle (nicer than plain square)
    const mask = full();
    const cut = 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const nearTop = r < cut, nearBot = r > rows - 1 - cut;
        const nearL = c < cut, nearR = c > cols - 1 - cut;
        if ((nearTop || nearBot) && (nearL || nearR)) mask[r][c] = false;
      }
    }
    return mask;
  }

  if (levelNumber <= 15) {
    // Octagon: cut corners by ~18%
    const mask = full();
    const cut = Math.floor(Math.min(rows, cols) * 0.18);
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
    return mask;
  }

  if (levelNumber <= 30) {
    // Mountain / pyramid: wider at bottom, pointed at top
    const mask = full();
    for (let r = 0; r < rows; r++) {
      // At row 0 (top): only center 2 cells active
      // At row rows-1 (bottom): all cols active
      const halfWidth = Math.floor((cols / 2) * (r / (rows - 1)) + 1);
      const centerC = Math.floor(cols / 2);
      for (let c = 0; c < cols; c++) {
        if (Math.abs(c - centerC) > halfWidth) {
          mask[r][c] = false;
        }
      }
    }
    return mask;
  }

  if (levelNumber <= 60) {
    // Shield / hexagon: flat top and bottom, slanted sides
    const mask = full();
    for (let r = 0; r < rows; r++) {
      const progress = r < rows / 2
        ? r / (rows / 2)                     // top half: widening
        : (rows - 1 - r) / (rows / 2);       // bottom half: narrowing
      const cutSide = Math.floor((cols * 0.15) * (1 - progress));
      for (let c = 0; c < cutSide; c++) mask[r][c] = false;
      for (let c = cols - cutSide; c < cols; c++) mask[r][c] = false;
    }
    return mask;
  }

  // Level 61+: Diamond shape
  const mask = full();
  const centerR = (rows - 1) / 2;
  const centerC = (cols - 1) / 2;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const distR = Math.abs(r - centerR) / centerR;
      const distC = Math.abs(c - centerC) / centerC;
      if (distR + distC > 1.05) {
        mask[r][c] = false;
      }
    }
  }
  return mask;
}
