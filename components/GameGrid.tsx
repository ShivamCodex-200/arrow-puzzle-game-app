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
import { ArrowCell } from "./ArrowCell";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const GameGrid: React.FC = () => {
  const { grid, tapArrow, removeArrowState, hintCellIds, isWon } =
    useGameStore();
  const { haptics } = useSettingsStore();

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
      scale.value = Math.max(1, Math.min(4, savedScale.value * e.scale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (scale.value > 1) {
        const tx = savedTranslateX.value + e.translationX;
        const ty = savedTranslateY.value + e.translationY;

        // Keep the board from dragging off-screen
        const boundX = (boardWidth * (scale.value - 1)) / 2;
        const boundY = (boardHeight * (scale.value - 1)) / 2;

        translateX.value = Math.max(-boundX, Math.min(boundX, tx));
        translateY.value = Math.max(-boundY, Math.min(boundY, ty));
      }
    })
    .onEnd(() => {
      if (scale.value <= 1.05) {
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      }
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
            { width: boardWidth, height: boardHeight },
            animatedBoardStyle,
          ]}
        >
          {/* Layer 1: Static Background Dot Grid */}
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
                r={1.5}
                fill="#D1D5DB"
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
                if (haptics) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
                    () => {},
                  );
                }
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
                onTap={handleTap}
                onEscapeComplete={() => removeArrowState(arrow.id)}
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
  },
});
