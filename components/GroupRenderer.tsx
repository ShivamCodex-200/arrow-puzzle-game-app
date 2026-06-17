/**
 * components/GroupRenderer.tsx
 *
 * Renders ONE group as a single connected SVG — exactly like the real game.
 *
 * Real game visual:  ←——←——←——←   (one spine, multiple arrowheads)
 * Our old visual:    ←    ←    ←   (isolated individual arrows)
 *
 * Key: One Svg per group, spanning the full bounding box of all cells.
 * - Single spine Line through all cell centers
 * - Filled Polygon arrowhead at each cell center
 * - Group escape animation moves the whole SVG as one unit
 */

import React, { useEffect, useRef } from 'react';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Line, Polygon } from 'react-native-svg';
import type { Cell, Group } from '../engine/types';

interface Props {
  group: Group;
  cells: Cell[];           // All cells belonging to this group
  cellSize: number;
  cellGap: number;
  padding: number;
  isHint: boolean;
  isSelected: boolean;
  triggerShake: boolean;
  onShakeDone: () => void;
  onEscapeComplete: () => void;
}

const ESCAPE_DIST = 950;

export const GroupRenderer: React.FC<Props> = ({
  group,
  cells,
  cellSize,
  cellGap,
  padding,
  isHint,
  isSelected,
  triggerShake,
  onShakeDone,
  onEscapeComplete,
}) => {
  if (cells.length === 0) return null;

  const dir = group.direction;
  const isHoriz = dir === 'right' || dir === 'left';

  // Bounding box of this group in grid coordinates
  const minCol = Math.min(...cells.map(c => c.col));
  const maxCol = Math.max(...cells.map(c => c.col));
  const minRow = Math.min(...cells.map(c => c.row));
  const maxRow = Math.max(...cells.map(c => c.row));

  const svgLeft   = padding + minCol * (cellSize + cellGap);
  const svgTop    = padding + minRow * (cellSize + cellGap);
  const svgWidth  = (maxCol - minCol + 1) * cellSize + Math.max(0, maxCol - minCol) * cellGap;
  const svgHeight = (maxRow - minRow + 1) * cellSize + Math.max(0, maxRow - minRow) * cellGap;

  // ── Animation shared values ─────────────────────────────────────────────
  const escX    = useSharedValue(0);
  const escY    = useSharedValue(0);
  const shakeX  = useSharedValue(0);
  const opacity = useSharedValue(1);

  const prevRemovedRef = useRef(false);
  const completedRef   = useRef(false);
  const prevGroupId    = useRef(group.id);

  // Reset on undo / new level
  useEffect(() => {
    if (group.id !== prevGroupId.current) {
      prevGroupId.current    = group.id;
      prevRemovedRef.current = false;
      completedRef.current   = false;
      escX.value    = 0;
      escY.value    = 0;
      shakeX.value  = 0;
      opacity.value = 1;
    } else if (!group.isRemoved && prevRemovedRef.current) {
      prevRemovedRef.current = false;
      completedRef.current   = false;
      escX.value    = 0;
      escY.value    = 0;
      opacity.value = 1;
    }
  }, [group.id, group.isRemoved]);

  // Escape: fly the whole group off screen as one unit
  useEffect(() => {
    if (!group.isRemoved || prevRemovedRef.current) return;
    prevRemovedRef.current = true;
    completedRef.current   = false;

    const tx = dir === 'right' ? ESCAPE_DIST : dir === 'left' ? -ESCAPE_DIST : 0;
    const ty = dir === 'down'  ? ESCAPE_DIST : dir === 'up'   ? -ESCAPE_DIST : 0;
    const D  = 350;

    escX.value    = withTiming(tx, { duration: D, easing: Easing.out(Easing.cubic) });
    escY.value    = withTiming(ty, { duration: D, easing: Easing.out(Easing.cubic) });
    opacity.value = withTiming(0, { duration: D * 0.75, easing: Easing.in(Easing.quad) },
      (fin) => {
        if (fin && !completedRef.current) {
          completedRef.current = true;
          runOnJS(onEscapeComplete)();
        }
      }
    );
  }, [group.isRemoved, dir]);

  // Shake on blocked tap
  useEffect(() => {
    if (!triggerShake) return;
    shakeX.value = withSequence(
      withTiming(-9, { duration: 40 }),
      withTiming(9,  { duration: 40 }),
      withTiming(-6, { duration: 40 }),
      withTiming(6,  { duration: 40 }),
      withTiming(0,  { duration: 40 }, fin => { if (fin) runOnJS(onShakeDone)(); })
    );
  }, [triggerShake]);

  const animStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    left: svgLeft,
    top:  svgTop,
    transform: [
      { translateX: escX.value + shakeX.value },
      { translateY: escY.value },
    ],
    opacity: opacity.value,
  }));

  // ── Visual parameters ───────────────────────────────────────────────────
  const color = isHint || isSelected ? '#CC0000' : '#1A1A2E';
  const sw    = Math.max(2, cellSize * 0.075);  // stroke width
  const hs    = cellSize * 0.24;                // arrowhead half-size

  const svgElements: React.ReactNode[] = [];

  if (isHoriz) {
    const cy = svgHeight / 2;

    // ONE continuous spine line for the whole group
    svgElements.push(
      <Line
        key="spine"
        x1={0} y1={cy} x2={svgWidth} y2={cy}
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="square"
      />
    );

    // Filled arrowhead at each cell center
    cells.forEach((cell, i) => {
      const cx = (cell.col - minCol) * (cellSize + cellGap) + cellSize / 2;
      if (dir === 'right') {
        svgElements.push(
          <Polygon
            key={`h${i}`}
            points={`${cx + hs},${cy} ${cx - hs * 0.65},${cy - hs * 0.7} ${cx - hs * 0.65},${cy + hs * 0.7}`}
            fill={color}
          />
        );
      } else {
        svgElements.push(
          <Polygon
            key={`h${i}`}
            points={`${cx - hs},${cy} ${cx + hs * 0.65},${cy - hs * 0.7} ${cx + hs * 0.65},${cy + hs * 0.7}`}
            fill={color}
          />
        );
      }
    });
  } else {
    const cx = svgWidth / 2;

    // ONE continuous spine line
    svgElements.push(
      <Line
        key="spine"
        x1={cx} y1={0} x2={cx} y2={svgHeight}
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="square"
      />
    );

    // Filled arrowhead at each cell center
    cells.forEach((cell, i) => {
      const cy = (cell.row - minRow) * (cellSize + cellGap) + cellSize / 2;
      if (dir === 'down') {
        svgElements.push(
          <Polygon
            key={`h${i}`}
            points={`${cx},${cy + hs} ${cx - hs * 0.7},${cy - hs * 0.65} ${cx + hs * 0.7},${cy - hs * 0.65}`}
            fill={color}
          />
        );
      } else {
        svgElements.push(
          <Polygon
            key={`h${i}`}
            points={`${cx},${cy - hs} ${cx - hs * 0.7},${cy + hs * 0.65} ${cx + hs * 0.7},${cy + hs * 0.65}`}
            fill={color}
          />
        );
      }
    });
  }

  return (
    // pointerEvents="none" — touch is handled by the TapZone layer above
    <Animated.View style={animStyle} pointerEvents="none">
      <Svg width={svgWidth} height={svgHeight}>
        {svgElements}
      </Svg>
    </Animated.View>
  );
};
