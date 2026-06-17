import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import { useGameStore } from '../store/useGameStore';
import { getDifficulty } from '../constants/config';

const BackChevron = () => (
  <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 18l-6-6 6-6"
      stroke="#3B82F6"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SettingsGear = () => (
  <Svg width={30} height={30} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={3} stroke="#3B82F6" strokeWidth={2} />
    <Path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51-1z"
      stroke="#3B82F6"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const GameHeader: React.FC = () => {
  const router = useRouter();
  const { grid, moves, lives } = useGameStore();

  if (!grid) return null;

  const level = grid.levelNumber;
  const diff = grid.difficulty || getDifficulty(level);

  // Count active (unremoved) groups remaining
  const remainingCount = Object.values(grid.groups).filter((g) => !g.isRemoved).length;

  return (
    <View className="px-4 pt-3 pb-2 z-10 bg-game-bg">
      {/* Row 1: Back Button | Title | Settings */}
      <View className="flex-row items-center justify-between h-11">
        <Pressable
          onPress={() => router.replace('/(game)/home')}
          className="w-11 h-11 items-center justify-center"
          hitSlop={8}
        >
          <BackChevron />
        </Pressable>

        <Text className="text-[22px] font-bold text-game-navy text-center">Level {level}</Text>

        <Pressable
          onPress={() => router.push('/(game)/settings')}
          className="w-11 h-11 items-center justify-center"
          hitSlop={8}
        >
          <SettingsGear />
        </Pressable>
      </View>

      {/* Row 2: Move Counter & Remaining Arrows (Left) | Hearts (Center) | Difficulty Badge (Right) */}
      <View className="flex-row items-center justify-between mt-2">
        {/* Left Side: Combined Counters */}
        <View className="flex-row items-center gap-2">
          {/* Moves Pill */}
          <View className="bg-game-badgeBg rounded-[16px] px-3.5 py-2 flex-row items-center justify-center min-w-[56px]">
            <Text className="text-[16px] font-bold text-game-navy mr-1">↗</Text>
            <Text className="text-[13px] font-bold text-game-navy">{moves}</Text>
          </View>
          {/* Remaining Arrows Pill */}
          <View className="bg-game-badgeBg rounded-[16px] px-3.5 py-2 flex-row items-center justify-center min-w-[56px]">
            <Text className="text-[16px] font-bold text-game-navy mr-1">↑</Text>
            <Text className="text-[13px] font-bold text-game-navy">{remainingCount}</Text>
          </View>
        </View>

        {/* Center: Hearts */}
        <View className="flex-row items-center justify-center gap-3.5">
          {Array.from({ length: 3 }).map((_, idx) => (
            <View key={idx} className="shadow-sm shadow-black/12 elevation-3">
              <Text className="text-[22px]">
                {idx < lives ? "❤️" : "🖤"}
              </Text>
            </View>
          ))}
        </View>

        {/* Right Side: Difficulty Badge */}
        <View className="bg-game-badgeBg rounded-[16px] px-4 py-2 flex-row items-center justify-center min-w-[80px]">
          <Text className="text-[14px] font-bold text-game-navy">{diff}</Text>
        </View>
      </View>
    </View>
  );
};
