import React, { useEffect, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
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
  onTap,
  onEscapeComplete,
  triggerShake,
  onShakeDone,
  svgWidth,
  svgHeight,
}) => {
  const progress = useSharedValue(0);
  const shakeX = useSharedValue(0);

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
  for (let i = 1; i <= arrow.cells.length + 2; i++) {
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
    }
  }, [arrow.id]);

  // ── Escape Animation (Snake path consumption crawling) ────────────────
  useEffect(() => {
    if (arrow.isRemoved && !prevRemovedRef.current) {
      prevRemovedRef.current = true;

      // Crawl forward by cells.length units (entire length of the path)
      progress.value = withTiming(
        arrow.cells.length,
        { duration: 320, easing: Easing.linear },
        (finished) => {
          if (finished) {
            runOnJS(onEscapeComplete)();
          }
        },
      );
    }
  }, [arrow.isRemoved]);

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

    if (p >= len) {
      return { d: "M 0 0" };
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
    return { d };
  });

  const animatedHeadProps = useAnimatedProps(() => {
    "worklet";
    const p = progress.value;
    const len = basePixels.length;

    if (p >= len) {
      return { d: "M 0 0" };
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
    const headSize = 7;

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

    return { d: headD };
  });

  // ── Shake translation style ───────────────────────────────────────────────
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const occupiedCells = getOccupiedCells(arrow);
  const strokeColor = isHint ? COLORS.arrowHint : COLORS.arrowNormal;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Visual rendering layer clipped to the grid canvas boundary */}
      <Animated.View
        style={[StyleSheet.absoluteFill, shakeStyle]}
        pointerEvents="none"
      >
        <Svg
          width={svgWidth}
          height={svgHeight}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          {/* Animated Stem */}
          <AnimatedPath
            animatedProps={animatedStemProps}
            stroke={strokeColor}
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Animated Arrowhead */}
          <AnimatedPath
            animatedProps={animatedHeadProps}
            stroke={strokeColor}
            strokeWidth={6}
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
