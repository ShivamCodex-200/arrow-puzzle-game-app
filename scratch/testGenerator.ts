import { generatePuzzle } from '../engine/pathGenerator';
import { canSegmentEscape, getEscapableIds } from '../engine/segmentSolver';
import type { PuzzleState, Segment } from '../engine/types';

function runTest() {
  console.log("Starting puzzle generation and solver validation tests for rewrite...");

  for (let lvl = 1; lvl <= 65; lvl += 5) {
    console.log(`\nTesting Level ${lvl}...`);
    const puzzle = generatePuzzle(lvl);

    console.log(`- Grid: ${puzzle.rows}x${puzzle.cols}`);
    console.log(`- Difficulty: ${puzzle.difficulty}`);
    console.log(`- Total Segments: ${puzzle.totalSegments}`);

    // Verify cell coverage
    let activeCellCount = 0;
    for (let r = 0; r < puzzle.rows; r++) {
      for (let c = 0; c < puzzle.cols; c++) {
        if (puzzle.shapeMask[r][c]) activeCellCount++;
      }
    }

    const segmentsCellCount = puzzle.segments.reduce((acc, s) => acc + s.cells.length, 0);
    const coverage = (segmentsCellCount / activeCellCount) * 100;
    console.log(`- Active cells in mask: ${activeCellCount}`);
    console.log(`- Cells in segments: ${segmentsCellCount} (${coverage.toFixed(1)}% coverage)`);

    if (coverage < 80) {
      console.warn(`[WARNING] Level ${lvl} coverage ${coverage.toFixed(1)}% is below 80%!`);
    }

    // Verify segment lengths and adjacency
    for (const seg of puzzle.segments) {
      if (seg.cells.length < 1 || seg.cells.length > 12) {
        throw new Error(`Segment ${seg.id} has invalid length: ${seg.cells.length}`);
      }

      // Check adjacency within segment (should be a straight line)
      for (let i = 0; i < seg.cells.length - 1; i++) {
        const c1 = seg.cells[i];
        const c2 = seg.cells[i + 1];
        const dist = Math.abs(c1.col - c2.col) + Math.abs(c1.row - c2.row);
        if (dist !== 1) {
          throw new Error(`Non-adjacent cells in segment ${seg.id}: (${c1.col},${c1.row}) and (${c2.col},${c2.row})`);
        }
      }

      // Check that it is straight (either all cols are same, or all rows are same)
      const cols = seg.cells.map(c => c.col);
      const rows = seg.cells.map(c => c.row);
      const allColsSame = cols.every(c => c === cols[0]);
      const allRowsSame = rows.every(r => r === rows[0]);
      if (!allColsSame && !allRowsSame) {
        throw new Error(`Segment ${seg.id} is not straight!`);
      }
    }
    console.log(`- Segment straight-line and grid adjacency check: PASSED`);

    // Verify solvability
    const activeSegIds = new Set(puzzle.segments.map(s => s.id));
    let steps = 0;
    while (activeSegIds.size > 0) {
      const escapable = getEscapableIds({
        ...puzzle,
        activeSegIds,
      });

      if (escapable.length === 0) {
        throw new Error(`DEADLOCK: Puzzle is not solvable at step ${steps}! Active segments remaining: ${Array.from(activeSegIds).join(', ')}`);
      }

      // Remove an escapable segment
      const choice = escapable[0];
      activeSegIds.delete(choice);
      steps++;
    }
    console.log(`- Solvability check: PASSED (solved in ${steps} steps)`);
  }

  console.log("\nAll tests completed successfully!");
}

try {
  runTest();
} catch (e: any) {
  console.error("Test failed:", e.message);
  process.exit(1);
}
