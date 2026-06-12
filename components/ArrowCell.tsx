import React, { useEffect, useRef, useMemo } from "react";
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
  withDelay,
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

const ArrowCellComponent: React.FC<Props> = ({
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

  const OVERSHOOT_CELLS = 15;
  const dir = arrow.direction;

  // ── 1. Memoize basePixels and fullPoints coordinate calculations ─────
  const { basePixels, fullPoints } = useMemo(() => {
    const base = arrow.cells.map((cell) => ({
      x: cell.x * (cellSize + cellGap) + cellSize / 2 + padding,
      y: cell.y * (cellSize + cellGap) + cellSize / 2 + padding,
    }));

    const full: Point[] = [...base];
    const head = base[base.length - 1];
    const stepDist = cellSize + cellGap;

    for (let i = 1; i <= arrow.cells.length + OVERSHOOT_CELLS; i++) {
      let px = head.x;
      let py = head.y;
      if (arrow.direction === "right") px += i * stepDist;
      else if (arrow.direction === "left") px -= i * stepDist;
      else if (arrow.direction === "down") py += i * stepDist;
      else py -= i * stepDist;
      full.push({ x: px, y: py });
    }

    return { basePixels: base, fullPoints: full };
  }, [arrow.cells, arrow.direction, cellSize, cellGap, padding]);

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
      const animDuration = 300; // 300ms slide duration

      // Wait 100ms during color transition, then slide out
      progress.value = withDelay(
        100,
        withTiming(
          totalDistance,
          { duration: animDuration, easing: Easing.bezier(0.25, 0.1, 0.25, 1) },
          (finished) => {
            if (finished) {
              runOnJS(onEscapeComplete)();
            }
          },
        )
      );
    }
  }, [arrow.isRemoved]);

  // ── Selection Highlight Animation ─────────────────────────────────────
  useEffect(() => {
    isSelectedVal.value = withTiming(isSelected ? 1 : 0, { duration: 100 });
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
    const selectedColor = COLORS.arrowHighlight; // orange-red
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
    const selectedColor = COLORS.arrowHighlight; // orange-red
    const stroke = interpolateColor(isSelectedVal.value, [0, 1], [defaultColor, selectedColor]);

    if (p >= len + 15.0) {
      return { d: "M 0 0", stroke: "transparent", fill: "transparent" };
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
    const headLength = Math.max(5, cellSize * 0.45);
    const headWidth = Math.max(3, cellSize * 0.25);

    let headD = "";
    if (dir === "right") {
      headD = `M ${ptEnd.x} ${ptEnd.y} L ${ptEnd.x - headLength} ${ptEnd.y - headWidth} L ${ptEnd.x - headLength} ${ptEnd.y + headWidth} Z`;
    } else if (dir === "left") {
      headD = `M ${ptEnd.x} ${ptEnd.y} L ${ptEnd.x + headLength} ${ptEnd.y - headWidth} L ${ptEnd.x + headLength} ${ptEnd.y + headWidth} Z`;
    } else if (dir === "up") {
      headD = `M ${ptEnd.x} ${ptEnd.y} L ${ptEnd.x - headWidth} ${ptEnd.y + headLength} L ${ptEnd.x + headWidth} ${ptEnd.y + headLength} Z`;
    } else if (dir === "down") {
      headD = `M ${ptEnd.x} ${ptEnd.y} L ${ptEnd.x - headWidth} ${ptEnd.y - headLength} L ${ptEnd.x + headWidth} ${ptEnd.y - headLength} Z`;
    }

    return { d: headD, stroke, fill: stroke };
  });

  // ── Shake translation style ───────────────────────────────────────────────
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const occupiedCells = getOccupiedCells(arrow);
  const scaledStrokeWidth = Math.max(1.8, cellSize * 0.25);

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
            strokeWidth={scaledStrokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Animated Arrowhead */}
          <AnimatedPath
            animatedProps={animatedHeadProps}
            strokeWidth={scaledStrokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
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

export const ArrowCell = React.memo(ArrowCellComponent, (prev, next) => {
  return (
    prev.arrow.id === next.arrow.id &&
    prev.arrow.isRemoved === next.arrow.isRemoved &&
    prev.arrow.direction === next.arrow.direction &&
    prev.cellSize === next.cellSize &&
    prev.cellGap === next.cellGap &&
    prev.padding === next.padding &&
    prev.isHint === next.isHint &&
    prev.isSelected === next.isSelected &&
    prev.triggerShake === next.triggerShake &&
    prev.svgWidth === next.svgWidth &&
    prev.svgHeight === next.svgHeight
  );
});

const styles = StyleSheet.create({
  tapCell: {
    position: "absolute",
    backgroundColor: "transparent",
  },
});
