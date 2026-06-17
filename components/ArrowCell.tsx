/**
 * components/ArrowCell.tsx
 *
 * Cell component representing a single grid cell with its own arrow.
 * Animates off-screen when the group escapes, shakes when blocked.
 */

import React, { useEffect, useRef } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import type { Cell } from "../engine/types";
import { ArrowCellIcon } from "./ArrowCellIcon";

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
}

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
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const shakeX = useSharedValue(0);
  const isSelectedVal = useSharedValue(0);
  const isErrorVal = useSharedValue(0);

  const prevRemovedRef = useRef(false);
  const prevIdRef = useRef<string | undefined>(undefined);

  const dir = cell.direction;

  // Position on grid canvas
  const left = cell.col * (cellSize + cellGap) + padding + offsetX;
  const top = cell.row * (cellSize + cellGap) + padding + offsetY;

  // Reset values when cell changes or is restored (undo/reset)
  useEffect(() => {
    if (cell.id !== prevIdRef.current) {
      prevIdRef.current = cell.id;
      prevRemovedRef.current = false;
      translateX.value = 0;
      translateY.value = 0;
      shakeX.value = 0;
      isSelectedVal.value = 0;
      isErrorVal.value = 0;
    } else if (!cell.isRemoved && prevRemovedRef.current) {
      prevRemovedRef.current = false;
      translateX.value = withTiming(0, { duration: 0 });
      translateY.value = withTiming(0, { duration: 0 });
    }
  }, [cell.id, cell.isRemoved]);

  // Escape Animation: translate off screen
  useEffect(() => {
    if (cell.isRemoved && !prevRemovedRef.current) {
      prevRemovedRef.current = true;

      // 1200px is enough to slide fully off the board canvas
      const travelDistance = 1500;
      const targetX =
        dir === "left" ? -travelDistance : dir === "right" ? travelDistance : 0;
      const targetY =
        dir === "up" ? -travelDistance : dir === "down" ? travelDistance : 0;

      translateX.value = withTiming(
        targetX,
        { duration: 400, easing: Easing.out(Easing.cubic) },
        (finished) => {
          if (finished) {
            runOnJS(onEscapeComplete)();
          }
        },
      );

      translateY.value = withTiming(targetY, {
        duration: 400,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [cell.isRemoved, dir]);

  // Selection Highlight Animation
  useEffect(() => {
    isSelectedVal.value = withTiming(isSelected ? 1 : 0, { duration: 150 });
  }, [isSelected]);

  // Shake animation when blocked
  useEffect(() => {
    if (triggerShake) {
      // Red background flash
      isErrorVal.value = withSequence(
        withTiming(1, { duration: 75 }),
        withTiming(0, { duration: 75 }),
      );

      // Horizontal shake
      shakeX.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(0, { duration: 50 }, (finished) => {
          if (finished) {
            runOnJS(onShakeDone)();
          }
        }),
      );
    }
  }, [triggerShake]);

  // Premium design style: rounded square tile with dynamic color transitions
  const animatedStyle = useAnimatedStyle(() => {
    const defaultBg = "#FFFFFF";
    const selectedBg = "#E0F2FE"; // Light blue
    const hintBg = "#FEF3C7"; // Light yellow/amber
    const errorBg = "#FEE2E2"; // Light red

    const normalOrSelectedBg = interpolateColor(
      isSelectedVal.value,
      [0, 1],
      [defaultBg, selectedBg],
    );
    const withHintBg = isHint ? hintBg : normalOrSelectedBg;
    const finalBg = interpolateColor(
      isErrorVal.value,
      [0, 1],
      [withHintBg, errorBg],
    );

    return {
      backgroundColor: finalBg,
      transform: [
        { translateX: translateX.value + shakeX.value },
        { translateY: translateY.value },
      ],
    };
  });

  // Icon color configuration
  const getIconColor = () => {
    if (isHint) return "#D97706"; // amber-600
    if (isSelected) return "#0284C7"; // sky-600
    return "#1E293B"; // slate-800
  };

  const iconSize = cellSize * 0.5;

  return (
    <Pressable
      onPress={cell.isRemoved ? undefined : onTap}
      style={({ pressed }) => [
        styles.cellContainer,
        {
          left,
          top,
          width: cellSize,
          height: cellSize,
          borderRadius: Math.round(cellSize * 0.22),
          opacity: cell.isRemoved ? 0 : pressed ? 0.85 : 1,
        },
      ]}
      pointerEvents={cell.isRemoved ? "none" : "auto"}
    >
      <Animated.View
        style={[
          styles.cellInner,
          {
            borderRadius: Math.round(cellSize * 0.22),
          },
          animatedStyle,
        ]}
      >
        <ArrowCellIcon direction={dir} size={iconSize} color={getIconColor()} />
      </Animated.View>
    </Pressable>
  );
};

export const ArrowCell = React.memo(ArrowCellComponent, (prev, next) => {
  return (
    prev.cell.id === next.cell.id &&
    prev.cell.isRemoved === next.cell.isRemoved &&
    prev.cell.direction === next.cell.direction &&
    prev.cellSize === next.cellSize &&
    prev.cellGap === next.cellGap &&
    prev.padding === next.padding &&
    prev.isHint === next.isHint &&
    prev.isSelected === next.isSelected &&
    prev.triggerShake === next.triggerShake &&
    prev.offsetX === next.offsetX &&
    prev.offsetY === next.offsetY
  );
});

const styles = StyleSheet.create({
  cellContainer: {
    position: "absolute",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cellInner: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0", // slate-200
  },
});
