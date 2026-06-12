import React from 'react';
import { View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle } from 'react-native-svg';
import { useGameStore } from '../store/useGameStore';
import { useSettingsStore } from '../store/useSettingsStore';

const BulbIcon = () => (
  <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
    {/* Lightbulb head */}
    <Path
      d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7z"
      fill="#FFB020"
      stroke="#D97706"
      strokeWidth={1.5}
    />
    {/* Lightbulb base thread */}
    <Path
      d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zM10 19h4v-1h-4v1z"
      fill="#94A3B8"
      stroke="#64748B"
      strokeWidth={1.5}
    />
  </Svg>
);

const RulerIcon = () => (
  <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
    {/* Purple ruler body */}
    <Path
      d="M5 19L19 5"
      stroke="#8B5CF6"
      strokeWidth={8}
      strokeLinecap="round"
    />
    {/* Little white ruler ticks */}
    <Path d="M7.5 14.5L9.5 16.5" stroke="#FFFFFF" strokeWidth={1.5} />
    <Path d="M10.5 11.5L12.5 13.5" stroke="#FFFFFF" strokeWidth={1.5} />
    <Path d="M13.5 8.5L15.5 10.5" stroke="#FFFFFF" strokeWidth={1.5} />
    <Path d="M16.5 5.5L18.5 7.5" stroke="#FFFFFF" strokeWidth={1.5} />
  </Svg>
);

export const HintButton: React.FC = () => {
  const { hints, useHint, isWon, isDeadlocked, grid, undoMove, history } = useGameStore();
  const { haptics } = useSettingsStore();

  const handleHint = () => {
    if (hints <= 0 || isWon || !grid) return;
    if (haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    useHint();
  };

  const handleRuler = () => {
    if (history.length === 0 || isWon) return;
    if (haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    undoMove();
  };

  const hintDisabled   = hints <= 0 || isWon;
  const rulerDisabled  = history.length === 0 || isWon;

  return (
    <View className="items-center absolute bottom-6 left-0 right-0 gap-3" pointerEvents="box-none">
      {/* Tool 1: Hint Bulb */}
      <Pressable
        onPress={handleHint}
        disabled={hintDisabled}
        className={`w-[68px] h-[68px] rounded-full bg-white items-center justify-center shadow-lg shadow-black/12 elevation-4 ${hintDisabled ? 'opacity-40' : ''}`}
        style={({ pressed }) => pressed ? { transform: [{ scale: 0.95 }] } : undefined}
        hitSlop={8}
      >
        <View className="relative w-8 h-8 items-center justify-center">
          <BulbIcon />
          {hints > 0 && (
            <View className="absolute -top-1.5 -right-1.5 bg-blue-500 rounded-full min-w-[18px] h-[18px] items-center justify-center px-1 border-[1.5px] border-white">
              <Text className="text-white text-[9px] font-black">{hints}</Text>
            </View>
          )}
        </View>
      </Pressable>

      {isDeadlocked && !isWon && (
        <View className="bg-red-500/10 rounded-[16px] px-4 py-1.5">
          <Text className="text-red-500 text-[12px] font-semibold">No moves left! Tap Reset in Settings.</Text>
        </View>
      )}
    </View>
  );
};
