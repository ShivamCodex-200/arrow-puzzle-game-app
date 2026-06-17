import type { Direction, PathPoint, PuzzleState, Segment } from './types';

function headCell(seg: Segment): PathPoint {
  return seg.cells[seg.cells.length - 1];
}

const DIR_DELTA: Record<Direction, { dx: number; dy: number }> = {
  right: { dx: 1, dy: 0 },
  left: { dx: -1, dy: 0 },
  down: { dx: 0, dy: 1 },
  up: { dx: 0, dy: -1 },
};

export function canSegmentEscape(
  seg: Segment,
  activeSegIds: Set<string>,
  cellToSegId: Record<string, string>,
  rows: number,
  cols: number
): boolean {
  if (seg.isRemoved || seg.isRemoving) return false;

  const head = headCell(seg);
  const { dx, dy } = DIR_DELTA[seg.direction];

  let c = head.col + dx;
  let r = head.row + dy;

  while (c >= 0 && c < cols && r >= 0 && r < rows) {
    const key = `${c},${r}`;
    const segId = cellToSegId[key];
    if (segId && segId !== seg.id && activeSegIds.has(segId)) return false;
    c += dx;
    r += dy;
  }

  return true;
}

export function getEscapableIds(puzzle: PuzzleState): string[] {
  return puzzle.segments
    .filter(
      s =>
        !s.isRemoved &&
        !s.isRemoving &&
        puzzle.activeSegIds.has(s.id) &&
        canSegmentEscape(
          s,
          puzzle.activeSegIds,
          puzzle.cellToSegId,
          puzzle.rows,
          puzzle.cols
        )
    )
    .map(s => s.id);
}

export function isDeadlocked(puzzle: PuzzleState): boolean {
  if (puzzle.activeSegIds.size === 0) return false;
  return getEscapableIds(puzzle).length === 0;
}

export function checkWin(puzzle: PuzzleState): boolean {
  return puzzle.activeSegIds.size === 0;
}

export function escapeSegment(
  puzzle: PuzzleState,
  segmentId: string
): PuzzleState {
  const newActive = new Set(puzzle.activeSegIds);
  newActive.delete(segmentId);

  const newSegments = puzzle.segments.map(s =>
    s.id === segmentId ? { ...s, isRemoving: true } : s
  );

  return {
    ...puzzle,
    segments: newSegments,
    activeSegIds: newActive,
  };
}

export function finalizeRemoval(
  puzzle: PuzzleState,
  segmentId: string
): PuzzleState {
  const newSegments = puzzle.segments.map(s =>
    s.id === segmentId ? { ...s, isRemoved: true, isRemoving: false } : s
  );
  return { ...puzzle, segments: newSegments };
}
