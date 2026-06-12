import React, { useMemo } from 'react';
import { View, Text, Pressable, StatusBar, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import Animated, {
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { useArrowPuzzle } from '../../hooks/useArrowPuzzle';
import { Direction, Node } from '../../engine/escapeModeEngine';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── MEMOIZED ARROW CELL COMPONENT ───────────────────────────────────────────
interface ArrowCellProps {
  node: Node;
  isSelected: boolean;
  isPathNode: boolean;
  pathState: 'idle' | 'tracing' | 'escaped' | 'failed';
  onPress: () => void;
  cellSize: number;
}

const ArrowCellComponent: React.FC<ArrowCellProps> = ({
  node,
  isPathNode,
  pathState,
  onPress,
  cellSize,
}) => {
  // Determine color theme based on path state
  const { bgClass, arrowColor } = useMemo(() => {
    if (isPathNode) {
      if (pathState === 'escaped') {
        return { bgClass: 'bg-green-100 border-green-400', arrowColor: '#4CAF50' };
      }
      if (pathState === 'failed') {
        return { bgClass: 'bg-red-100 border-red-400', arrowColor: '#EF4444' };
      }
      return { bgClass: 'bg-blue-100 border-blue-400', arrowColor: '#3B82F6' };
    }
    return { bgClass: 'bg-white border-slate-100', arrowColor: '#090D1A' };
  }, [isPathNode, pathState]);

  // Rotations for the arrow paths
  const rotation = useMemo(() => {
    switch (node.direction) {
      case 'UP': return 'rotate-0';
      case 'RIGHT': return 'rotate-90';
      case 'DOWN': return 'rotate-180';
      case 'LEFT': return 'rotate-270';
    }
  }, [node.direction]);

  return (
    <Pressable
      onPress={onPress}
      style={{ width: cellSize, height: cellSize }}
      className={`rounded-2xl border-[1.5px] items-center justify-center shadow-sm shadow-[#1F355E]/5 elevation-2 m-0.5 ${bgClass}`}
    >
      <View className={`w-8 h-8 items-center justify-center transform ${rotation}`}>
        <Svg width={24} height={24} viewBox="0 0 24 24">
          <Path
            d="M 12 20 L 12 4"
            stroke={arrowColor}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Path
            d="M 8.5 9.5 L 12 4 L 15.5 9.5"
            stroke={arrowColor}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {node.isExit && (
            <Circle cx={12} cy={20} r={2} fill={arrowColor} />
          )}
        </Svg>
      </View>
    </Pressable>
  );
};

const ArrowCell = React.memo(ArrowCellComponent, (prev, next) => {
  return (
    prev.node.id === next.node.id &&
    prev.node.direction === next.node.direction &&
    prev.node.isExit === next.node.isExit &&
    prev.isSelected === next.isSelected &&
    prev.isPathNode === next.isPathNode &&
    prev.pathState === next.pathState &&
    prev.cellSize === next.cellSize
  );
});

// ── MAIN ESCAPE MODE SCREEN ──────────────────────────────────────────────────
export default function EscapeModeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    level,
    grid,
    selectedPath,
    pathState,
    lives,
    isGameOver,
    isWon,
    selectStartNode,
    resetLevel,
    nextLevel,
    clearPath,
  } = useArrowPuzzle(1);

  // Calculate cell sizes dynamically
  const { cellSize, boardWidth } = useMemo(() => {
    if (!grid) return { cellSize: 50, boardWidth: 300 };
    const maxDimension = Math.max(grid.cols, grid.rows);
    const size = Math.floor((SCREEN_WIDTH - 48 - (maxDimension * 4)) / maxDimension);
    const cellW = Math.max(40, Math.min(60, size));
    const width = cellW * grid.cols + (grid.cols * 4);
    return { cellSize: cellW, boardWidth: width };
  }, [grid]);

  if (!grid) return null;

  return (
    <View 
      className="flex-1 bg-game-bg" 
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <StatusBar barStyle="dark-content" />

      {/* Top Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable 
          onPress={() => router.replace('/(game)/home')} 
          className="w-10 h-10 rounded-full bg-white items-center justify-center shadow shadow-game-navy/5 elevation-2"
          hitSlop={8}
        >
          <MaterialIcons name="arrow-back" size={22} color="#1F355E" />
        </Pressable>
        <View className="items-center">
          <Text className="text-[20px] font-black text-game-navy tracking-tight">Escape Mode</Text>
          <Text className="text-[12px] font-bold text-game-secondary">Level {level}</Text>
        </View>
        <Pressable 
          onPress={resetLevel} 
          className="w-10 h-10 rounded-full bg-white items-center justify-center shadow shadow-game-navy/5 elevation-2"
          hitSlop={8}
        >
          <MaterialIcons name="refresh" size={22} color="#1F355E" />
        </Pressable>
      </View>

      {/* Lives HUD */}
      <View className="items-center mt-1 mb-3">
        <View className="flex-row items-center gap-1.5 bg-white px-4 py-1.5 rounded-full shadow-sm shadow-[#1F355E]/5 elevation-1">
          {Array.from({ length: 3 }).map((_, idx) => (
            <MaterialIcons
              key={idx}
              name={idx < lives ? "favorite" : "favorite-border"}
              size={20}
              color={idx < lives ? "#EF4444" : "#D1D5DB"}
            />
          ))}
        </View>
      </View>

      {/* Main Canvas Viewport */}
      <View className="flex-1 items-center justify-center p-4">
        <Animated.View 
          entering={FadeIn.duration(500)}
          className="bg-white/40 p-4 rounded-[28px] border border-white/60 items-center justify-center"
          style={{ width: boardWidth + 32 }}
        >
          {/* Shape Mask Grid */}
          <View style={{ width: boardWidth }}>
            {Array.from({ length: grid.rows }).map((_, r) => (
              <View key={r} className="flex-row justify-center">
                {Array.from({ length: grid.cols }).map((_, c) => {
                  const id = `${c},${r}`;
                  const node = grid.nodes[id];

                  if (!node) {
                    // Empty 0-masked cell
                    return (
                      <View
                        key={id}
                        style={{ width: cellSize, height: cellSize }}
                        className="m-0.5 items-center justify-center"
                      >
                        <Svg width={cellSize} height={cellSize}>
                          <Circle cx={cellSize / 2} cy={cellSize / 2} r={2.5} fill="#C2C7D0" opacity={0.4} />
                        </Svg>
                      </View>
                    );
                  }

                  const isPathNode = selectedPath.includes(id);

                  return (
                    <ArrowCell
                      key={id}
                      node={node}
                      isSelected={selectedPath[0] === id}
                      isPathNode={isPathNode}
                      pathState={pathState}
                      cellSize={cellSize}
                      onPress={() => selectStartNode(id)}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </Animated.View>
      </View>

      {/* Bottom Action Footer */}
      <View className="items-center pb-8">
        {pathState !== 'idle' && pathState !== 'tracing' && (
          <Animated.View entering={FadeInDown.duration(200)}>
            <Pressable
              onPress={clearPath}
              className="bg-white border border-slate-200 px-6 py-2.5 rounded-full shadow-sm elevation-1"
            >
              <Text className="text-game-secondary font-bold text-[14px]">Clear Path Trace</Text>
            </Pressable>
          </Animated.View>
        )}
      </View>

      {/* Win Modal Overlay */}
      {isWon && (
        <View className="absolute inset-0 bg-slate-900/70 items-center justify-center px-7 z-50">
          <Animated.View 
            entering={FadeInDown.duration(400)}
            className="w-full max-w-[340px] bg-white rounded-[28px] p-7 items-center gap-3 shadow-2xl elevation-6"
          >
            <View className="w-20 h-20 rounded-full bg-green-100 items-center justify-center border-2 border-green-200 mb-1">
              <MaterialIcons name="emoji-events" size={52} color="#4CAF50" />
            </View>
            <Text className="text-[24px] font-black text-game-navy tracking-tight">Escape Successful!</Text>
            <Text className="text-[14px] text-game-secondary font-medium mb-2">You found the correct path! 🎉</Text>

            <Pressable 
              onPress={nextLevel}
              className="w-full bg-green-500 rounded-[16px] py-[15px] items-center"
            >
              <Text className="text-white text-[16px] font-black tracking-wide">Next Level →</Text>
            </Pressable>
          </Animated.View>
        </View>
      )}

      {/* Game Over Modal Overlay */}
      {isGameOver && (
        <View className="absolute inset-0 bg-slate-900/70 items-center justify-center px-7 z-50">
          <Animated.View 
            entering={FadeInDown.duration(400)}
            className="w-full max-w-[340px] bg-white rounded-[28px] p-7 items-center gap-3 shadow-2xl elevation-6"
          >
            <View className="w-20 h-20 rounded-full bg-red-100 items-center justify-center border-2 border-red-200 mb-1">
              <MaterialIcons name="sentiment-very-dissatisfied" size={52} color="#EF4444" />
            </View>
            <Text className="text-[24px] font-black text-game-navy tracking-tight">Game Over</Text>
            <Text className="text-[14px] text-game-secondary font-medium mb-2 text-center">
              You ran out of attempts! Try again.
            </Text>

            <Pressable 
              onPress={resetLevel}
              className="w-full bg-red-500 rounded-[16px] py-[15px] items-center"
            >
              <Text className="text-white text-[16px] font-black tracking-wide">Try Again 🔄</Text>
            </Pressable>
            <Pressable 
              onPress={() => router.replace('/(game)/home')}
              className="w-full rounded-[16px] py-3 items-center border-[1.5px] border-game-dot mt-1"
            >
              <Text className="text-game-secondary text-[14px] font-bold">Back to Menu</Text>
            </Pressable>
          </Animated.View>
        </View>
      )}
    </View>
  );
}
