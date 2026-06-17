/**
 * SnakeRenderer.tsx
 *
 * Renders each segment as a straight line with an arrowhead.
 * Each segment is one straight run of cells in one direction.
 * Lines are thick and touch each other (CELL_GAP=0) creating the maze look.
 */

import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Line, Polygon } from 'react-native-svg';
import type { Direction, PathPoint, PuzzleState, Segment } from '../engine/types';

interface Props {
  puzzle: PuzzleState;
  cellSize: number;
  cellGap: number;
  padding: number;
  hintSegIds: string[];
  selectedSegId: string | null;
  shakingSegId: string | null;
  onShakeDone: (segId: string) => void;
  onEscapeComplete: (segId: string) => void;
}

const ESCAPE_DIST = 1200;
const NORMAL_COLOR = '#1A1A2E';
const HINT_COLOR = '#CC0000';

// Get pixel center of a grid cell
function cellCenter(
  col: number,
  row: number,
  cellSize: number,
  cellGap: number,
  padding: number
): { x: number; y: number } {
  return {
    x: padding + col * (cellSize + cellGap) + cellSize / 2,
    y: padding + row * (cellSize + cellGap) + cellSize / 2,
  };
}

// ── Single Segment SVG ────────────────────────────────────────────────────────
interface SegmentSvgProps {
  segment: Segment;
  cellSize: number;
  cellGap: number;
  padding: number;
  color: string;
  boardW: number;
  boardH: number;
}

const SegmentSvg: React.FC<SegmentSvgProps> = ({
  segment,
  cellSize,
  cellGap,
  padding,
  color,
  boardW,
  boardH,
}) => {
  if (segment.cells.length === 0) return null;

  const sw = Math.max(3, cellSize * 0.15); // stroke width
  const headSize = cellSize * 0.28; // arrowhead size

  // For a straight segment, we just need start and end centers
  const tail = segment.cells[0];
  const head = segment.cells[segment.cells.length - 1];

  const tailPt = cellCenter(tail.col, tail.row, cellSize, cellGap, padding);
  const headPt = cellCenter(head.col, head.row, cellSize, cellGap, padding);

  // Extend line slightly beyond tail (toward the ghost) for visual connection
  // This makes adjacent segments look connected
  const dir = segment.direction;
  const dx = dir === 'right' ? 1 : dir === 'left' ? -1 : 0;
  const dy = dir === 'down' ? 1 : dir === 'up' ? -1 : 0;

  // Line extends half a cell beyond head toward escape direction
  // and half a cell before tail toward previous cell
  const halfCell = (cellSize + cellGap) / 2;

  const lineX1 = tailPt.x - dx * halfCell;
  const lineY1 = tailPt.y - dy * halfCell;
  const lineX2 = headPt.x + dx * halfCell;
  const lineY2 = headPt.y + dy * halfCell;

  // Arrowhead at head end
  // Triangle pointing in direction
  let arrowPoints = '';
  const hx = headPt.x + dx * halfCell * 0.6;
  const hy = headPt.y + dy * halfCell * 0.6;
  const hw = headSize * 0.5;

  if (dir === 'right') {
    arrowPoints = `${hx + headSize},${hy} ${hx},${hy - hw} ${hx},${hy + hw}`;
  } else if (dir === 'left') {
    arrowPoints = `${hx - headSize},${hy} ${hx},${hy - hw} ${hx},${hy + hw}`;
  } else if (dir === 'down') {
    arrowPoints = `${hx},${hy + headSize} ${hx - hw},${hy} ${hx + hw},${hy}`;
  } else {
    arrowPoints = `${hx},${hy - headSize} ${hx - hw},${hy} ${hx + hw},${hy}`;
  }

  return (
    <Svg
      width={boardW}
      height={boardH}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      <Line
        x1={lineX1}
        y1={lineY1}
        x2={lineX2}
        y2={lineY2}
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="square"
      />
      <Polygon
        points={arrowPoints}
        fill={color}
        stroke={color}
        strokeWidth={1}
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// ── Escaping Segment ──────────────────────────────────────────────────────────
interface EscapingProps {
  segment: Segment;
  cellSize: number;
  cellGap: number;
  padding: number;
  color: string;
  onEscapeComplete: () => void;
  boardW: number;
  boardH: number;
}

const EscapingSegment: React.FC<EscapingProps> = ({
  segment,
  cellSize,
  cellGap,
  padding,
  color,
  onEscapeComplete,
  boardW,
  boardH,
}) => {
  const escX = useSharedValue(0);
  const escY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const completedRef = useRef(false);

  useEffect(() => {
    const dir = segment.direction;
    const tx = dir === 'right' ? ESCAPE_DIST : dir === 'left' ? -ESCAPE_DIST : 0;
    const ty = dir === 'down' ? ESCAPE_DIST : dir === 'up' ? -ESCAPE_DIST : 0;
    const D = 320;

    escX.value = withTiming(tx, { duration: D, easing: Easing.out(Easing.cubic) });
    escY.value = withTiming(ty, { duration: D, easing: Easing.out(Easing.cubic) });
    opacity.value = withTiming(
      0,
      { duration: D * 0.85, easing: Easing.in(Easing.quad) },
      fin => {
        if (fin && !completedRef.current) {
          completedRef.current = true;
          runOnJS(onEscapeComplete)();
        }
      }
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    ...StyleSheet.absoluteFillObject,
    transform: [
      { translateX: escX.value },
      { translateY: escY.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animStyle} pointerEvents="none">
      <SegmentSvg
        segment={segment}
        cellSize={cellSize}
        cellGap={cellGap}
        padding={padding}
        color={color}
        boardW={boardW}
        boardH={boardH}
      />
    </Animated.View>
  );
};

// ── Shaking Segment ───────────────────────────────────────────────────────────
interface ShakingProps {
  segment: Segment;
  cellSize: number;
  cellGap: number;
  padding: number;
  onShakeDone: () => void;
  boardW: number;
  boardH: number;
}

const ShakingSegment: React.FC<ShakingProps> = ({
  segment,
  cellSize,
  cellGap,
  padding,
  onShakeDone,
  boardW,
  boardH,
}) => {
  const shakeX = useSharedValue(0);

  useEffect(() => {
    shakeX.value = withSequence(
      withTiming(-10, { duration: 35 }),
      withTiming(10, { duration: 35 }),
      withTiming(-7, { duration: 35 }),
      withTiming(7, { duration: 35 }),
      withTiming(0, { duration: 35 }, fin => {
        if (fin) runOnJS(onShakeDone)();
      })
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    ...StyleSheet.absoluteFillObject,
    transform: [{ translateX: shakeX.value }],
  }));

  return (
    <Animated.View style={animStyle} pointerEvents="none">
      <SegmentSvg
        segment={segment}
        cellSize={cellSize}
        cellGap={cellGap}
        padding={padding}
        color={HINT_COLOR}
        boardW={boardW}
        boardH={boardH}
      />
    </Animated.View>
  );
};

// ── Main Renderer ─────────────────────────────────────────────────────────────
export const SnakeRenderer: React.FC<Props> = ({
  puzzle,
  cellSize,
  cellGap,
  padding,
  hintSegIds,
  selectedSegId,
  shakingSegId,
  onShakeDone,
  onEscapeComplete,
}) => {
  const boardW = cellSize * puzzle.cols + cellGap * (puzzle.cols - 1) + padding * 2;
  const boardH = cellSize * puzzle.rows + cellGap * (puzzle.rows - 1) + padding * 2;

  const sw = Math.max(3, cellSize * 0.15);

  // Separate segments by state
  const staticSegs: Segment[] = [];
  const escapingSegs: Segment[] = [];
  let shakeSeg: Segment | null = null;

  for (const seg of puzzle.segments) {
    if (seg.isRemoved) continue;
    if (seg.id === shakingSegId) {
      shakeSeg = seg;
    } else if (seg.isRemoving) {
      escapingSegs.push(seg);
    } else if (puzzle.activeSegIds.has(seg.id)) {
      staticSegs.push(seg);
    }
  }

  return (
    <>
      {/* Static segments - all drawn in one SVG for performance */}
      <Svg
        width={boardW}
        height={boardH}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        {staticSegs.map(seg => {
          if (seg.cells.length === 0) return null;

          const isHint = hintSegIds.includes(seg.id);
          const isSelected = selectedSegId === seg.id;
          const color = isHint || isSelected ? HINT_COLOR : NORMAL_COLOR;

          const tail = seg.cells[0];
          const head = seg.cells[seg.cells.length - 1];
          const tailPt = cellCenter(tail.col, tail.row, cellSize, cellGap, padding);
          const headPt = cellCenter(head.col, head.row, cellSize, cellGap, padding);

          const dir = seg.direction;
          const dx = dir === 'right' ? 1 : dir === 'left' ? -1 : 0;
          const dy = dir === 'down' ? 1 : dir === 'up' ? -1 : 0;
          const halfCell = (cellSize + cellGap) / 2;

          // Line: extends half cell past tail and half cell past head
          const x1 = tailPt.x - dx * halfCell;
          const y1 = tailPt.y - dy * halfCell;
          const x2 = headPt.x + dx * halfCell;
          const y2 = headPt.y + dy * halfCell;

          // Arrowhead at head
          const hx = headPt.x + dx * halfCell * 0.5;
          const hy = headPt.y + dy * halfCell * 0.5;
          const headSize = cellSize * 0.28;
          const hw = headSize * 0.5;
          let arrowPoints = '';

          if (dir === 'right') {
            arrowPoints = `${hx + headSize},${hy} ${hx},${hy - hw} ${hx},${hy + hw}`;
          } else if (dir === 'left') {
            arrowPoints = `${hx - headSize},${hy} ${hx},${hy - hw} ${hx},${hy + hw}`;
          } else if (dir === 'down') {
            arrowPoints = `${hx},${hy + headSize} ${hx - hw},${hy} ${hx + hw},${hy}`;
          } else {
            arrowPoints = `${hx},${hy - headSize} ${hx - hw},${hy} ${hx + hw},${hy}`;
          }

          return (
            <React.Fragment key={seg.id}>
              <Line
                x1={x1} y1={y1}
                x2={x2} y2={y2}
                stroke={color}
                strokeWidth={sw}
                strokeLinecap="square"
              />
              <Polygon
                points={arrowPoints}
                fill={color}
                stroke={color}
                strokeWidth={0.5}
              />
            </React.Fragment>
          );
        })}
      </Svg>

      {/* Shaking segment */}
      {shakeSeg && (
        <ShakingSegment
          key={`shake-${shakeSeg.id}`}
          segment={shakeSeg}
          cellSize={cellSize}
          cellGap={cellGap}
          padding={padding}
          onShakeDone={() => onShakeDone(shakeSeg!.id)}
          boardW={boardW}
          boardH={boardH}
        />
      )}

      {/* Escaping segments */}
      {escapingSegs.map(seg => (
        <EscapingSegment
          key={`escape-${seg.id}`}
          segment={seg}
          cellSize={cellSize}
          cellGap={cellGap}
          padding={padding}
          color={HINT_COLOR}
          onEscapeComplete={() => onEscapeComplete(seg.id)}
          boardW={boardW}
          boardH={boardH}
        />
      ))}
    </>
  );
};
