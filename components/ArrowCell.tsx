/**
 * ArrowCell.tsx
 *
 * NO background box. NO border. NO shadow.
 * Just a transparent pressable area with an arrow drawn on it.
 * Exactly like the real Arrow Puzzle game.
 */

import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { Cell } from '../engine/types';
import { ArrowCellIcon } from './ArrowCellIcon';

interface Props {
  cell: Cell;
  cellSize: number;
  cellGap: number;
  padding: number;
  isHint: boolean;
  isSelected: boolean;
  onTap: () => void;
  onEscapeComplete: () => void;
  triggerShake: boolean;
  onShakeDone: () => void;
  offsetX: number;
  offsetY: number;
  boardWidth: number;
  boardHeight: number;
}

const ESCAPE_DISTANCE = 1000;

const ArrowCellComponent: React.FC<Props> = ({
  cell,
  cellSize,
  cellGap,
  padding,
  isHint,
  isSelected,
  onTap,
  onEscapeComplete,
  triggerShake,
  onShakeDone,
  offsetX,
  offsetY,
}) => {
  const escapeX = useSharedValue(0);
  const escapeY = useSharedValue(0);
  const shakeX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const prevRemovedRef = useRef(false);
  const prevIdRef = useRef<string | undefined>(undefined);
  const completedRef = useRef(false);

  const dir = cell.direction;
  const left = padding + offsetX + cell.col * (cellSize + cellGap);
  const top = padding + offsetY + cell.row * (cellSize + cellGap);

  // Reset on new cell / undo
  useEffect(() => {
    if (cell.id !== prevIdRef.current) {
      prevIdRef.current = cell.id;
      prevRemovedRef.current = false;
      completedRef.current = false;
      escapeX.value = 0;
      escapeY.value = 0;
      shakeX.value = 0;
      opacity.value = 1;
    } else if (!cell.isRemoved && prevRemovedRef.current) {
      prevRemovedRef.current = false;
      completedRef.current = false;
      escapeX.value = 0;
      escapeY.value = 0;
      opacity.value = 1;
    }
  }, [cell.id, cell.isRemoved]);

  // Escape animation
  useEffect(() => {
    if (!cell.isRemoved || prevRemovedRef.current) return;
    prevRemovedRef.current = true;
    completedRef.current = false;

    const tx =
      dir === 'right' ? ESCAPE_DISTANCE :
      dir === 'left'  ? -ESCAPE_DISTANCE : 0;
    const ty =
      dir === 'down' ? ESCAPE_DISTANCE :
      dir === 'up'   ? -ESCAPE_DISTANCE : 0;

    const DURATION = 350;

    escapeX.value = withTiming(tx, {
      duration: DURATION,
      easing: Easing.out(Easing.cubic),
    });

    escapeY.value = withTiming(ty, {
      duration: DURATION,
      easing: Easing.out(Easing.cubic),
    });

    opacity.value = withTiming(0, {
      duration: DURATION * 0.8,
      easing: Easing.in(Easing.quad),
    }, (finished) => {
      if (finished && !completedRef.current) {
        completedRef.current = true;
        runOnJS(onEscapeComplete)();
      }
    });
  }, [cell.isRemoved, dir]);

  // Shake animation
  useEffect(() => {
    if (!triggerShake) return;
    shakeX.value = withSequence(
      withTiming(-8, { duration: 40 }),
      withTiming(8,  { duration: 40 }),
      withTiming(-6, { duration: 40 }),
      withTiming(6,  { duration: 40 }),
      withTiming(0,  { duration: 40 }, (fin) => {
        if (fin) runOnJS(onShakeDone)();
      })
    );
  }, [triggerShake]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: escapeX.value + shakeX.value },
      { translateY: escapeY.value },
    ],
    opacity: opacity.value,
  }));

  // Arrow color logic — matches real game style
  const getColor = () => {
    if (isHint) return '#E53935';      // red highlight for hint
    if (isSelected) return '#E53935';  // red when just tapped/escaped
    return '#1A1A2E';                  // default dark navy
  };

  // Stroke width scales with cell size
  const strokeWidth = Math.max(1.5, cellSize * 0.06);

  return (
    <Pressable
      onPress={cell.isRemoved ? undefined : onTap}
      pointerEvents={cell.isRemoved ? 'none' : 'auto'}
      style={[
        styles.cell,
        {
          left,
          top,
          width: cellSize,
          height: cellSize,
        },
      ]}
    >
      <Animated.View style={[styles.inner, animStyle]}>
        <ArrowCellIcon
          direction={dir}
          size={cellSize}
          color={getColor()}
          strokeWidth={strokeWidth}
        />
      </Animated.View>
    </Pressable>
  );
};

export const ArrowCell = React.memo(ArrowCellComponent, (prev, next) => {
  return (
    prev.cell.id          === next.cell.id &&
    prev.cell.isRemoved   === next.cell.isRemoved &&
    prev.cell.direction   === next.cell.direction &&
    prev.cellSize         === next.cellSize &&
    prev.cellGap          === next.cellGap &&
    prev.padding          === next.padding &&
    prev.isHint           === next.isHint &&
    prev.isSelected       === next.isSelected &&
    prev.triggerShake     === next.triggerShake &&
    prev.offsetX          === next.offsetX &&
    prev.offsetY          === next.offsetY
  );
});

const styles = StyleSheet.create({
  cell: {
    position: 'absolute',
    // NO background, NO border, NO shadow
  },
  inner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
