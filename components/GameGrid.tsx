import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { CELL_GAP, GRID_PADDING } from "../constants/config";
import { COLORS } from "../constants/theme";
import { useSound } from "../hooks/useSound";
import { useGameStore } from "../store/useGameStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { ArrowCell } from "./ArrowCell";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const CANVAS_SIZE = 2400;

const getDynamicCellSize = (cols: number, rows: number) => {
  const maxDim = Math.max(cols, rows);
  if (maxDim <= 6) return 60;
  if (maxDim <= 10) return 55;
  if (maxDim <= 15) return 50;
  if (maxDim <= 20) return 45;
  return 40;
};

export const GameGrid: React.FC = () => {
  const {
    grid,
    tapGroup,
    removeGroupState,
    hintGroupIds,
    isWon,
    selectedGroupId,
  } = useGameStore();
  const { haptics } = useSettingsStore();
  const { playTap } = useSound();

  const [shakingGroupId, setShakingGroupId] = useState<string | null>(null);

  const [viewportSize, setViewportSize] = useState({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 200,
  });

  const onViewportLayout = useCallback((event: any) => {
    const { width, height } = event.nativeEvent.layout;
    setViewportSize({ width, height });
  }, []);

  // Zoom and Pan Shared Values
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const handleShakeDone = useCallback((groupId: string) => {
    setShakingGroupId((prev) => (prev === groupId ? null : prev));
  }, []);

  // Center camera whenever level loads or viewport changes
  useEffect(() => {
    if (!grid) return;
    const initX = viewportSize.width / 2 - CANVAS_SIZE / 2;
    const initY = viewportSize.height / 2 - CANVAS_SIZE / 2;

    scale.value = 1;
    savedScale.value = 1;
    translateX.value = initX;
    translateY.value = initY;
    savedTranslateX.value = initX;
    savedTranslateY.value = initY;
  }, [grid?.levelNumber, grid?.seed, viewportSize.width, viewportSize.height]);

  // Calculate dynamic cell size and centered offsets safely
  const cellSize = grid ? getDynamicCellSize(grid.cols, grid.rows) : 55;
  const boardWidth = grid
    ? cellSize * grid.cols + CELL_GAP * (grid.cols - 1) + GRID_PADDING * 2
    : 0;
  const boardHeight = grid
    ? cellSize * grid.rows + CELL_GAP * (grid.rows - 1) + GRID_PADDING * 2
    : 0;

  const gridOffsetX = (CANVAS_SIZE - boardWidth) / 2;
  const gridOffsetY = (CANVAS_SIZE - boardHeight) / 2;

  // Build a list of dot positions across the active shape mask on the grid
  const dots = useMemo(() => {
    if (!grid) return [];
    const pts: { x: number; y: number; col: number; row: number }[] = [];
    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        if (grid.shapeMask[r][c]) {
          const cx =
            c * (cellSize + CELL_GAP) +
            cellSize / 2 +
            GRID_PADDING +
            gridOffsetX;
          const cy =
            r * (cellSize + CELL_GAP) +
            cellSize / 2 +
            GRID_PADDING +
            gridOffsetY;
          pts.push({ x: cx, y: cy, col: c, row: r });
        }
      }
    }
    return pts;
  }, [
    grid?.rows,
    grid?.cols,
    grid?.shapeMask,
    cellSize,
    gridOffsetX,
    gridOffsetY,
  ]);

  // Memoize static background SVG dot grid — shown only within the level's active shape mask
  const dotGridSvg = useMemo(
    () => (
      <Svg
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        style={StyleSheet.absoluteFill}
      >
        {dots.map((dot, index) => (
          <Circle
            key={index}
            cx={dot.x}
            cy={dot.y}
            r={2.8}
            fill={COLORS.dot}
            opacity={0.75}
          />
        ))}
      </Svg>
    ),
    [dots],
  );

  // RNGH v2 Gestures
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(0.8, Math.min(3, savedScale.value * e.scale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      const tx = savedTranslateX.value + e.translationX;
      const ty = savedTranslateY.value + e.translationY;

      // Limit drag distance to avoid losing the board entirely
      const initX = viewportSize.width / 2 - CANVAS_SIZE / 2;
      const initY = viewportSize.height / 2 - CANVAS_SIZE / 2;
      const limitX = 800 * scale.value;
      const limitY = 800 * scale.value;

      translateX.value = Math.max(initX - limitX, Math.min(initX + limitX, tx));
      translateY.value = Math.max(initY - limitY, Math.min(initY + limitY, ty));
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      savedScale.value = scale.value;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onStart(() => {
      const initX = viewportSize.width / 2 - CANVAS_SIZE / 2;
      const initY = viewportSize.height / 2 - CANVAS_SIZE / 2;
      scale.value = withTiming(1);
      translateX.value = withTiming(initX);
      translateY.value = withTiming(initY);
      savedScale.value = 1;
      savedTranslateX.value = initX;
      savedTranslateY.value = initY;
    });

  // Combine Pinch and Pan gestures to execute concurrently, and allow double-tap
  const gesture = Gesture.Simultaneous(
    Gesture.Simultaneous(pinchGesture, panGesture),
    doubleTapGesture,
  );

  const animatedBoardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  if (!grid) return null;

  return (
    <View style={styles.container} onLayout={onViewportLayout}>
      <GestureDetector gesture={gesture}>
        <View style={StyleSheet.absoluteFill} collapsable={false}>
          <Animated.View
            style={[
              styles.board,
              { width: CANVAS_SIZE, height: CANVAS_SIZE },
              animatedBoardStyle,
            ]}
          >
            {/* Layer 1: Static Background Dot Grid */}
            {dotGridSvg}

            {/* Layer 2: SVG Arrows and Interaction Targets */}
            {Object.values(grid.cells).map((cell) => {
              const isHint = hintGroupIds.includes(cell.groupId);
              const handleTap = () => {
                if (cell.isRemoved || isWon) return;

                const escaped = tapGroup(cell.groupId);

                if (escaped) {
                  // Play tap sound
                  playTap();
                } else {
                  if (haptics) {
                    Haptics.notificationAsync(
                      Haptics.NotificationFeedbackType.Warning,
                    ).catch(() => {});
                  }
                  setShakingGroupId(cell.groupId);
                }
              };

              return (
                <ArrowCell
                  key={cell.id}
                  cell={cell}
                  cellSize={cellSize}
                  cellGap={CELL_GAP}
                  padding={GRID_PADDING}
                  isHint={isHint}
                  isSelected={selectedGroupId === cell.groupId}
                  onTap={handleTap}
                  onEscapeComplete={() => {
                    if (haptics) {
                      Haptics.impactAsync(
                        Haptics.ImpactFeedbackStyle.Light,
                      ).catch(() => {});
                    }
                    removeGroupState(cell.groupId);
                  }}
                  triggerShake={shakingGroupId === cell.groupId}
                  onShakeDone={() => handleShakeDone(cell.groupId)}
                  offsetX={gridOffsetX}
                  offsetY={gridOffsetY}
                />
              );
            })}
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
    position: "relative",
  },
  board: {
    backgroundColor: "transparent",
    overflow: "visible", // Ensure escaping arrows are not clipped by the canvas container
  },
});
