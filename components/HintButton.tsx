import React from 'react';
import { View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import { useGameStore } from '../store/useGameStore';
import { useSettingsStore } from '../store/useSettingsStore';

export const HintButton: React.FC = () => {
  const { hints, useHint, isWon, isDeadlocked, grid, undoMove, history } = useGameStore();
  const { haptics } = useSettingsStore();

  const handleHint = () => {
    if (hints <= 0 || isWon || !grid) return;
    if (haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    useHint();
  };

  const handleEraser = () => {
    if (history.length === 0) return;
    if (haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    undoMove();
  };

  const hintDisabled   = hints <= 0 || isWon;
  const eraserDisabled = history.length === 0 || isWon;

  return (
    <View className="items-center pb-6 gap-2">
      <View className="flex-row items-center bg-white rounded-full px-5 py-2.5 gap-6 shadow-lg shadow-[#1A2340]/10 elevation-6">
        {/* Hint / Lightbulb */}
        <Pressable
          onPress={handleHint}
          disabled={hintDisabled}
          className={`items-center justify-center ${hintDisabled ? 'opacity-[0.35]' : ''}`}
          hitSlop={8}
        >
          <View className="relative">
            <MaterialIcons
              name="lightbulb"
              size={28}
              color={hintDisabled ? "#64748B" : "#F59E0B"}
            />
            {hints > 0 && (
              <View className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] rounded-full items-center justify-center px-[3px] border-[1.5px] border-white bg-amber-500">
                <Text className="text-white text-[10px] font-black">{hints}</Text>
              </View>
            )}
          </View>
        </Pressable>

        <View className="w-[1px] h-7 bg-slate-200" />

        {/* Eraser / Undo */}
        <Pressable
          onPress={handleEraser}
          disabled={eraserDisabled}
          className={`items-center justify-center ${eraserDisabled ? 'opacity-[0.35]' : ''}`}
          hitSlop={8}
        >
          <View className="relative">
            <MaterialIcons
              name="backspace"
              size={26}
              color={eraserDisabled ? "#64748B" : "#1F355E"}
            />
          </View>
        </Pressable>
      </View>

      {isDeadlocked && (
        <View className="flex-row items-center gap-1.5 bg-red-500/10 px-3.5 py-1.5 rounded-full">
          <MaterialIcons name="block" size={14} color="#EF4444" />
          <Text className="text-red-500 text-[12px] font-semibold">No moves left! Tap Undo or Reset.</Text>
        </View>
      )}
    </View>
  );
};
