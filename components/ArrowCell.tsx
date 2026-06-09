import React, { useEffect, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { COLORS } from "../constants/theme";
import { getOccupiedCells } from "../engine/canEscape";
import type { Arrow, Point } from "../engine/types";

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface Props {
  arrow: Arrow;
  cellSize: number;
  cellGap: number;
  padding: number;
  isHint: boolean;
  isSelected: boolean;
  onTap: () => void;
  onEscapeComplete: () => void;
  triggerShake: boolean;
  onShakeDone: () => void;
  svgWidth: number;
  svgHeight: number;
}

export const ArrowCell: React.FC<Props> = ({
  arrow,
  cellSize,
  cellGap,
  padding,
  isHint,
  isSelected,
  onTap,
  onEscapeComplete,
  triggerShake,
  onShakeDone,
  svgWidth,
  svgHeight,
}) => {
  const progress = useSharedValue(0);
  const shakeX = useSharedValue(0);
  const isSelectedVal = useSharedValue(0);

  const prevRemovedRef = useRef(false);
  const prevIdRef = useRef<string | undefined>(undefined);

  // ── 1. Calculate the full coordinate path (including exit extension) ─────
  const basePixels = arrow.cells.map((cell) => ({
    x: cell.x * (cellSize + cellGap) + cellSize / 2 + padding,
    y: cell.y * (cellSize + cellGap) + cellSize / 2 + padding,
  }));

  const fullPoints: Point[] = [...basePixels];
  const headPixel = basePixels[basePixels.length - 1];
  const stepDist = cellSize + cellGap;
  const dir = arrow.direction;

  // Extend the path straight off-screen by N cells so the tail can exit fully
  const OVERSHOOT_CELLS = 15;
  for (let i = 1; i <= arrow.cells.length + OVERSHOOT_CELLS; i++) {
    let px = headPixel.x;
    let py = headPixel.y;
    if (dir === "right") px += i * stepDist;
    else if (dir === "left") px -= i * stepDist;
    else if (dir === "down") py += i * stepDist;
    else py -= i * stepDist;
    fullPoints.push({ x: px, y: py });
  }

  // ── Reset values when arrow ID changes (new level loaded) ───────────────
  useEffect(() => {
    if (arrow.id !== prevIdRef.current) {
      prevIdRef.current = arrow.id;
      prevRemovedRef.current = false;
      progress.value = 0;
      shakeX.value = 0;
      isSelectedVal.value = 0;
    }
  }, [arrow.id]);

  // ── Escape Animation (Snake path consumption crawling) ────────────────
  useEffect(() => {
    if (arrow.isRemoved && !prevRemovedRef.current) {
      prevRemovedRef.current = true;

      const totalDistance = arrow.cells.length + OVERSHOOT_CELLS;
      const animDuration = totalDistance * 35; // 35ms per cell speed

      // Crawl forward by cells.length + OVERSHOOT_CELLS units (extend far outside the board area)
      progress.value = withTiming(
        totalDistance,
        { duration: animDuration, easing: Easing.linear },
        (finished) => {
          if (finished) {
            runOnJS(onEscapeComplete)();
          }
        },
      );
    }
  }, [arrow.isRemoved]);

  // ── Selection Highlight Animation ─────────────────────────────────────
  useEffect(() => {
    isSelectedVal.value = withTiming(isSelected ? 1 : 0, { duration: 120 });
  }, [isSelected]);

  // ── Shake animation when blocked ──────────────────────────────────────────
  useEffect(() => {
    if (triggerShake) {
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

  // ── Animated Props for SVG Path ──────────────────────────────────────────
  const animatedStemProps = useAnimatedProps(() => {
    "worklet";
    const p = progress.value;
    const len = basePixels.length;

    // Interpolate stroke color dynamically
    const defaultColor = isHint ? COLORS.arrowHint : COLORS.arrowNormal;
    const selectedColor = "#3B82F6"; // bright blue
    const stroke = interpolateColor(isSelectedVal.value, [0, 1], [defaultColor, selectedColor]);

    if (p >= len + 15.0) {
      return { d: "M 0 0", stroke: "transparent" };
    }

    const t_start = p;
    const t_end = len - 1 + p;

    // Helper to get interpolated coordinate along the path
    const getPoint = (t: number) => {
      const idx = Math.floor(t);
      const frac = t - idx;
      const p1 = fullPoints[idx];
      const p2 = fullPoints[idx + 1] || p1;
      return {
        x: p1.x + (p2.x - p1.x) * frac,
        y: p1.y + (p2.y - p1.y) * frac,
      };
    };

    const ptStart = getPoint(t_start);
    const ptEnd = getPoint(t_end);

    let d = `M ${ptStart.x} ${ptStart.y}`;

    const firstInt = Math.floor(t_start) + 1;
    const lastInt = Math.floor(t_end);

    for (let i = firstInt; i <= lastInt; i++) {
      if (i < fullPoints.length) {
        d += ` L ${fullPoints[i].x} ${fullPoints[i].y}`;
      }
    }

    d += ` L ${ptEnd.x} ${ptEnd.y}`;

    return { d, stroke };
  });

  const animatedHeadProps = useAnimatedProps(() => {
    "worklet";
    const p = progress.value;
    const len = basePixels.length;

    // Interpolate stroke color dynamically
    const defaultColor = isHint ? COLORS.arrowHint : COLORS.arrowNormal;
    const selectedColor = "#3B82F6"; // bright blue
    const stroke = interpolateColor(isSelectedVal.value, [0, 1], [defaultColor, selectedColor]);

    if (p >= len + 15.0) {
      return { d: "M 0 0", stroke: "transparent" };
    }

    const t_end = len - 1 + p;

    const getPoint = (t: number) => {
      const idx = Math.floor(t);
      const frac = t - idx;
      const p1 = fullPoints[idx];
      const p2 = fullPoints[idx + 1] || p1;
      return {
        x: p1.x + (p2.x - p1.x) * frac,
        y: p1.y + (p2.y - p1.y) * frac,
      };
    };

    const ptEnd = getPoint(t_end);
    const headSize = 6; // slightly smaller arrowheads

    let headD = "";
    if (dir === "right") {
      headD = `M ${ptEnd.x - headSize} ${ptEnd.y - headSize} L ${ptEnd.x} ${ptEnd.y} L ${ptEnd.x - headSize} ${ptEnd.y + headSize}`;
    } else if (dir === "left") {
      headD = `M ${ptEnd.x + headSize} ${ptEnd.y - headSize} L ${ptEnd.x} ${ptEnd.y} L ${ptEnd.x + headSize} ${ptEnd.y + headSize}`;
    } else if (dir === "up") {
      headD = `M ${ptEnd.x - headSize} ${ptEnd.y + headSize} L ${ptEnd.x} ${ptEnd.y} L ${ptEnd.x + headSize} ${ptEnd.y + headSize}`;
    } else if (dir === "down") {
      headD = `M ${ptEnd.x - headSize} ${ptEnd.y - headSize} L ${ptEnd.x} ${ptEnd.y} L ${ptEnd.x + headSize} ${ptEnd.y - headSize}`;
    }

    return { d: headD, stroke };
  });

  // ── Shake translation style ───────────────────────────────────────────────
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const occupiedCells = getOccupiedCells(arrow);

  return (
    <View style={[StyleSheet.absoluteFill, { overflow: 'visible' }]} pointerEvents="box-none">
      {/* Visual rendering layer clipped to the grid canvas boundary */}
      <Animated.View
        style={[StyleSheet.absoluteFill, shakeStyle, { overflow: 'visible' }]}
        pointerEvents="none"
      >
        <Svg
          width={svgWidth}
          height={svgHeight}
          style={[StyleSheet.absoluteFill, { overflow: 'visible' }]}
          pointerEvents="none"
        >
          {/* Animated Stem */}
          <AnimatedPath
            animatedProps={animatedStemProps}
            strokeWidth={7}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Animated Arrowhead */}
          <AnimatedPath
            animatedProps={animatedHeadProps}
            strokeWidth={7}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      </Animated.View>

      {/* Invisible tap targets on occupied cells */}
      {!arrow.isRemoved &&
        occupiedCells.map((cell) => {
          const lpx = cell.x * (cellSize + cellGap) + padding;
          const lpy = cell.y * (cellSize + cellGap) + padding;

          return (
            <Pressable
              key={`${cell.x}-${cell.y}`}
              onPress={onTap}
              style={[
                styles.tapCell,
                {
                  left: lpx,
                  top: lpy,
                  width: cellSize,
                  height: cellSize,
                },
              ]}
            />
          );
        })}
    </View>
  );
};

const styles = StyleSheet.create({
  tapCell: {
    position: "absolute",
    backgroundColor: "transparent",
  },
});
