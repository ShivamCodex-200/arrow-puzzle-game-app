import * as Haptics from "expo-haptics";
import React, { useCallback, useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { CELL_GAP, getCellSize, GRID_PADDING } from "../constants/config";
import { COLORS } from "../constants/theme";
import { useGameStore } from "../store/useGameStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { useSound } from "../hooks/useSound";
import { ArrowCell } from "./ArrowCell";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export const GameGrid: React.FC = () => {
  const { grid, tapArrow, removeArrowState, hintCellIds, isWon, selectedArrowId } =
    useGameStore();
  const { haptics } = useSettingsStore();
  const { playTap } = useSound();

  const [shakingArrowId, setShakingArrowId] = useState<string | null>(null);

  // Zoom and Pan Shared Values
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const handleShakeDone = useCallback((arrowId: string) => {
    setShakingArrowId((prev) => (prev === arrowId ? null : prev));
  }, []);

  if (!grid) return null;

  const cellSize = getCellSize(SCREEN_WIDTH, grid.cols);
  const boardWidth =
    cellSize * grid.cols + CELL_GAP * (grid.cols - 1) + GRID_PADDING * 2;
  const boardHeight =
    cellSize * grid.rows + CELL_GAP * (grid.rows - 1) + GRID_PADDING * 2;

  // Layer 1: Build a list of dot positions based on shape mask (if present)
  const dots: { x: number; y: number }[] = [];
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      if (!grid.shapeMask || grid.shapeMask[r]?.[c]) {
        const cx = c * (cellSize + CELL_GAP) + cellSize / 2 + GRID_PADDING;
        const cy = r * (cellSize + CELL_GAP) + cellSize / 2 + GRID_PADDING;
        dots.push({ x: cx, y: cy });
      }
    }
  }

  // RNGH v2 Gestures
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(0.5, Math.min(4, savedScale.value * e.scale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      const tx = savedTranslateX.value + e.translationX;
      const ty = savedTranslateY.value + e.translationY;

      // Allow dragging in all directions. Limit drag distance to avoid losing the board.
      const limitX = Math.max(SCREEN_WIDTH * 0.8, (boardWidth * scale.value) / 2);
      const limitY = Math.max(SCREEN_HEIGHT * 0.6, (boardHeight * scale.value) / 2);

      translateX.value = Math.max(-limitX, Math.min(limitX, tx));
      translateY.value = Math.max(-limitY, Math.min(limitY, ty));
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      savedScale.value = scale.value;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onStart(() => {
      scale.value = withTiming(1);
      translateX.value = withTiming(0);
      translateY.value = withTiming(0);
      savedScale.value = 1;
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
    });

  // Combine Pinch and Pan gestures to execute concurrently, and allow double-tap
  const gesture = Gesture.Simultaneous(
    Gesture.Simultaneous(pinchGesture, panGesture),
    doubleTapGesture
  );

  const animatedBoardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <View style={styles.container}>
      <GestureDetector gesture={gesture}>
        <Animated.View
          style={[
            styles.board,
            { width: boardWidth, height: boardHeight },
            animatedBoardStyle,
          ]}
        >
          {/* Layer 1: Static Background Dot Grid (Drawn in background, covered by arrows) */}
          <Svg
            width={boardWidth}
            height={boardHeight}
            style={StyleSheet.absoluteFill}
          >
            {dots.map((dot, index) => (
              <Circle
                key={index}
                cx={dot.x}
                cy={dot.y}
                r={3.5}
                fill={COLORS.dot}
                opacity={0.8}
              />
            ))}
          </Svg>

          {/* Layer 2: SVG Arrows and Interaction Targets */}
          {grid.arrows.map((arrow) => {
            const isHint = hintCellIds.includes(arrow.id);
            const handleTap = () => {
              if (arrow.isRemoved || isWon) return;

              const escaped = tapArrow(arrow.id);

              if (escaped) {
                // Play arrow click sound effect
                playTap();
              } else {
                if (haptics) {
                  Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Warning,
                  ).catch(() => {});
                }
                setShakingArrowId(arrow.id);
              }
            };

            return (
              <ArrowCell
                key={arrow.id}
                arrow={arrow}
                cellSize={cellSize}
                cellGap={CELL_GAP}
                padding={GRID_PADDING}
                isHint={isHint}
                isSelected={selectedArrowId === arrow.id}
                onTap={handleTap}
                onEscapeComplete={() => {
                  if (haptics) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
                      () => {},
                    );
                  }
                  removeArrowState(arrow.id);
                }}
                triggerShake={shakingArrowId === arrow.id}
                onShakeDone={() => handleShakeDone(arrow.id)}
                svgWidth={boardWidth}
                svgHeight={boardHeight}
              />
            );
          })}
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible", // Allow escaping arrows to travel far away off the screen boundaries
  },
  board: {
    backgroundColor: "transparent",
    overflow: "visible", // Ensure escaping arrows are not clipped by the canvas container
  },
});
