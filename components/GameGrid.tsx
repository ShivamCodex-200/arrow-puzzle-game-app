import React, { useCallback, useState } from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useGameStore } from '../store/useGameStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { canEscape } from '../engine/canEscape';
import { ArrowCell } from './ArrowCell';
import { getCellSize, CELL_GAP, GRID_PADDING } from '../constants/config';
import { COLORS } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const GameGrid: React.FC = () => {
  const { grid, tapArrow, removeArrowState, hintCellIds, isWon } = useGameStore();
  const { haptics } = useSettingsStore();

  const [shakingArrowId, setShakingArrowId] = useState<string | null>(null);

  const handleShakeDone = useCallback((arrowId: string) => {
    setShakingArrowId(prev => (prev === arrowId ? null : prev));
  }, []);

  if (!grid) return null;

  const cellSize = getCellSize(SCREEN_WIDTH, grid.cols);
  const boardWidth = SCREEN_WIDTH;
  const boardHeight = cellSize * grid.rows + CELL_GAP * (grid.rows - 1) + GRID_PADDING * 2;

  // Layer 1: Build a list of dot positions
  const dots: { x: number; y: number }[] = [];
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      const cx = c * (cellSize + CELL_GAP) + cellSize / 2 + GRID_PADDING;
      const cy = r * (cellSize + CELL_GAP) + cellSize / 2 + GRID_PADDING;
      dots.push({ x: cx, y: cy });
    }
  }

  return (
    <View style={styles.container}>
      <View style={{ width: boardWidth, height: boardHeight }}>
        {/* Layer 1: Static Background Dot Grid */}
        <Svg width={boardWidth} height={boardHeight} style={StyleSheet.absoluteFill}>
          {dots.map((dot, index) => (
            <Circle
              key={index}
              cx={dot.x}
              cy={dot.y}
              r={2.5}
              fill={COLORS.dot}
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
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              }
            } else {
              if (haptics) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
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
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems:     'center',
    justifyContent: 'center',
  },
});
