import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useGameStore } from '../store/useGameStore';
import { getDifficulty } from '../constants/config';

const DIFF_COLOR: Record<string, string> = {
  Easy:   '#22C55E', // Green
  Normal: '#F59E0B', // Orange
  Hard:   '#8B5CF6', // Purple
  Expert: '#EC4899', // Pink
  Master: '#EF4444', // Red
};

export const GameHeader: React.FC = () => {
  const router = useRouter();
  const { grid, moves, resetLevel, undoMove, history, lives } = useGameStore();

  if (!grid) return null;

  const level      = grid.levelNumber;
  const diff       = grid.difficulty || getDifficulty(level);
  const diffColor  = DIFF_COLOR[diff] || '#64748B';
  const canUndo    = history.length > 0;

  // Count remaining active arrows
  const remainingCount = grid.arrows.filter((a) => !a.isRemoved).length;
  
  // Pulse animation on count change
  const remainingScale = useSharedValue(1);

  useEffect(() => {
    remainingScale.value = withSequence(
      withTiming(1.22, { duration: 80 }),
      withSpring(1, { damping: 9, stiffness: 120 })
    );
  }, [remainingCount]);

  const animatedPillStyle = useAnimatedStyle(() => ({
    transform: [{ scale: remainingScale.value }],
  }));

  return (
    <View className="px-4 pt-2 pb-1.5 gap-2">
      {/* Top row: back button / level title + difficulty / settings */}
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={() => router.replace('/(game)/home')}
          className="w-10 h-10 items-center justify-center rounded-full bg-white shadow shadow-game-navy/5 elevation-2"
          hitSlop={8}
        >
          <MaterialIcons name="arrow-back" size={22} color="#1F355E" />
        </Pressable>

        <View className="items-center gap-0.5">
          <Text className="text-[18px] font-black text-game-navy tracking-tight">Level {level}</Text>
          <View 
            className="px-2.5 py-0.5 rounded-full" 
            style={{ backgroundColor: diffColor + '22' }}
          >
            <Text className="text-[11px] font-bold tracking-wider" style={{ color: diffColor }}>{diff}</Text>
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/(game)/settings')}
          className="w-10 h-10 items-center justify-center rounded-full bg-white shadow shadow-game-navy/5 elevation-2"
          hitSlop={8}
        >
          <MaterialIcons name="settings" size={22} color="#1F355E" />
        </Pressable>
      </View>

      {/* Second row (sub-header): Remaining Count (top-left aligned) | Hearts centered */}
      <View className="flex-row items-center justify-between px-1 mt-0.5">
        {/* Remaining arrows pill */}
        <Animated.View 
          className="flex-row items-center bg-white px-2.5 py-1 rounded-[14px] border border-slate-200 gap-[3px] min-w-[52px] justify-center" 
          style={animatedPillStyle}
        >
          <MaterialIcons name="call-made" size={14} color="#1F355E" />
          <Text className="text-[13px] font-black text-game-navy">{remainingCount}</Text>
        </Animated.View>

        {/* Hearts row (chances remaining) */}
        <View className="flex-row items-center gap-1.5">
          {Array.from({ length: 3 }).map((_, idx) => (
            <MaterialIcons
              key={idx}
              name={idx < lives ? "favorite" : "favorite-border"}
              size={18}
              color={idx < lives ? "#EF4444" : "#D1D5DB"}
              className="mx-[1px] scale-[1.05]"
            />
          ))}
        </View>

        {/* Balance spacer matching the width of the remaining badge */}
        <View className="w-[52px]" />
      </View>

      {/* Bottom row: moves count | Undo + Reset actions */}
      <View className="flex-row items-center justify-between px-1 mt-0.5">
        <View className="flex-row items-center gap-1">
          <MaterialIcons name="swap-vert" size={14} color="#64748B" />
          <Text className="text-[13px] font-semibold text-game-secondary">Moves: {moves}</Text>
        </View>

        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={undoMove}
            disabled={!canUndo}
            className={`flex-row items-center gap-1 ${!canUndo ? 'opacity-[0.35]' : ''}`}
            hitSlop={8}
          >
            <MaterialIcons name="undo" size={15} color={canUndo ? "#1F355E" : "#64748B"} />
            <Text className={`text-[13px] font-bold ${canUndo ? 'text-game-navy' : 'text-game-secondary'}`}>
              Undo
            </Text>
          </Pressable>

          <View className="w-[1px] h-3.5 bg-game-dot" />

          <Pressable onPress={resetLevel} className="flex-row items-center gap-1" hitSlop={8}>
            <MaterialIcons name="refresh" size={15} color="#1F355E" />
            <Text className="text-[13px] font-bold text-game-navy">Reset</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};
