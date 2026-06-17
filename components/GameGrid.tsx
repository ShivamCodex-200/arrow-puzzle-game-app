import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { CELL_GAP, GRID_PADDING } from '../constants/config';
import { useSound } from '../hooks/useSound';
import { useGameStore } from '../store/useGameStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { SnakeRenderer } from './SnakeRenderer';

const { width: SW, height: SH } = Dimensions.get('window');

function computeCellSize(cols: number, rows: number, vw: number, vh: number): number {
  const byW = Math.floor((vw - GRID_PADDING * 2) / cols);
  const byH = Math.floor((vh - GRID_PADDING * 2) / rows);
  // Use the smaller so the whole board fits
  return Math.max(20, Math.min(byW, byH, 58));
}

export const GameGrid: React.FC = () => {
  const {
    puzzle,
    tapSegment,
    removeSegmentState,
    hintSegIds,
    isWon,
    selectedSegId,
    fullyRemovedSegIds,
  } = useGameStore();

  const { haptics } = useSettingsStore();
  const { playTap } = useSound();
  const [shakingSegId, setShakingSegId] = useState<string | null>(null);
  const [vp, setVp] = useState({ w: SW, h: SH - 200 });

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) setVp({ w: width, h: height });
  }, []);

  const cellSize = puzzle
    ? computeCellSize(puzzle.cols, puzzle.rows, vp.w, vp.h)
    : 36;

  const boardW = puzzle
    ? cellSize * puzzle.cols + CELL_GAP * (puzzle.cols - 1) + GRID_PADDING * 2
    : 0;
  const boardH = puzzle
    ? cellSize * puzzle.rows + CELL_GAP * (puzzle.rows - 1) + GRID_PADDING * 2
    : 0;

  // Pan/Pinch/DoubleTap
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const stx = useSharedValue(0);
  const sty = useSharedValue(0);

  useEffect(() => {
    if (!puzzle || boardW === 0 || boardH === 0) return;
    const ix = (vp.w - boardW) / 2;
    const iy = (vp.h - boardH) / 2;
    scale.value = 1;
    savedScale.value = 1;
    tx.value = ix; ty.value = iy;
    stx.value = ix; sty.value = iy;
  }, [puzzle?.levelNumber, vp.w, vp.h, boardW, boardH]);

  const pinch = Gesture.Pinch()
    .onUpdate(e => { scale.value = Math.max(0.5, Math.min(3, savedScale.value * e.scale)); })
    .onEnd(() => { savedScale.value = scale.value; });

  const pan = Gesture.Pan()
    .onUpdate(e => {
      const ix = (vp.w - boardW) / 2;
      const iy = (vp.h - boardH) / 2;
      const lim = Math.max(boardW, boardH) * scale.value;
      tx.value = Math.max(ix - lim, Math.min(ix + lim, stx.value + e.translationX));
      ty.value = Math.max(iy - lim, Math.min(iy + lim, sty.value + e.translationY));
    })
    .onEnd(() => { stx.value = tx.value; sty.value = ty.value; });

  const dblTap = Gesture.Tap().numberOfTaps(2).onStart(() => {
    const ix = (vp.w - boardW) / 2;
    const iy = (vp.h - boardH) / 2;
    scale.value = withTiming(1);
    tx.value = withTiming(ix);
    ty.value = withTiming(iy);
    savedScale.value = 1;
    stx.value = ix;
    sty.value = iy;
  });

  const gesture = Gesture.Simultaneous(
    Gesture.Simultaneous(pinch, pan),
    dblTap
  );

  const boardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
  }));

  const handleTap = useCallback((segId: string) => {
    if (isWon) return;
    const escaped = tapSegment(segId);
    if (escaped) {
      playTap();
    } else {
      if (haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      setShakingSegId(segId);
    }
  }, [isWon, tapSegment, playTap, haptics]);

  const handleEscapeComplete = useCallback((segId: string) => {
    if (haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    removeSegmentState(segId);
  }, [removeSegmentState, haptics]);

  const handleShakeDone = useCallback((segId: string) => {
    setShakingSegId(prev => prev === segId ? null : prev);
  }, []);

  if (!puzzle) return null;

  return (
    <View style={styles.viewport} onLayout={onLayout}>
      <GestureDetector gesture={gesture}>
        <Animated.View
          style={[styles.board, { width: boardW, height: boardH }, boardStyle]}
        >
          {/* Snake lines and arrowheads */}
          <SnakeRenderer
            puzzle={puzzle}
            cellSize={cellSize}
            cellGap={CELL_GAP}
            padding={GRID_PADDING}
            hintSegIds={hintSegIds}
            selectedSegId={selectedSegId}
            shakingSegId={shakingSegId}
            onShakeDone={handleShakeDone}
            onEscapeComplete={handleEscapeComplete}
          />

          {/* Tap zones — transparent but interactive */}
          {puzzle.segments.map(seg => {
            if (fullyRemovedSegIds.has(seg.id)) return null;
            if (seg.isRemoved || seg.isRemoving) return null;

            return seg.cells.map((cell, idx) => {
              const left = GRID_PADDING + cell.col * (cellSize + CELL_GAP);
              const top = GRID_PADDING + cell.row * (cellSize + CELL_GAP);
              return (
                <Pressable
                  key={`${seg.id}-${idx}`}
                  onPress={() => handleTap(seg.id)}
                  style={[styles.tapZone, { left, top, width: cellSize, height: cellSize }]}
                />
              );
            });
          })}
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  board: {
    position: 'absolute',
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  tapZone: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
});
