import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useGameStore } from '../store/useGameStore';
import { useRouter } from 'expo-router';

export const GameOverOverlay: React.FC = () => {
  const router = useRouter();
  const { puzzle, isGameOver, resetLevel } = useGameStore();

  const scale  = useSharedValue(0.6);
  const opCard = useSharedValue(0);
  const opBg   = useSharedValue(0);

  useEffect(() => {
    if (isGameOver) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      opBg.value   = withTiming(1, { duration: 300 });
      scale.value  = withDelay(100, withSpring(1, { damping: 20, stiffness: 120, overshootClamping: true }));
      opCard.value = withDelay(100, withTiming(1, { duration: 300 }));
    } else {
      scale.value  = 0.6;
      opCard.value = 0;
      opBg.value   = 0;
    }
  }, [isGameOver]);

  const bgStyle   = useAnimatedStyle(() => ({ opacity: opBg.value }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity:   opCard.value,
    transform: [{ scale: scale.value }],
  }));

  if (!isGameOver || !puzzle) return null;

  const handleRetry = () => {
    resetLevel();
  };

  const handleHome = () => {
    router.replace('/(game)/home');
  };

  return (
    <View className="absolute inset-0" pointerEvents="box-none">
      {/* Dim background */}
      <Animated.View className="absolute inset-0 bg-slate-900/75" style={bgStyle} />

      {/* Card */}
      <View className="flex-1 items-center justify-center px-7">
        <Animated.View className="w-full max-w-[360px] bg-white rounded-[28px] p-7 items-center gap-3 shadow-2xl elevation-6" style={cardStyle}>
          {/* Failed Icon */}
          <View className="w-20 h-20 rounded-full bg-red-100 items-center justify-center border-2 border-red-200 mb-1">
            <MaterialIcons name="heart-broken" size={52} color="#EF4444" />
          </View>

          <Text className="text-[26px] font-black text-game-navy tracking-tight">Level Failed!</Text>
          <Text className="text-[14px] text-game-secondary font-medium text-center">You ran out of lives. Keep trying! 💪</Text>

          {/* Buttons */}
          <Pressable onPress={handleRetry} className="w-full bg-game-navy rounded-[16px] py-[15px] items-center mt-1">
            <Text className="text-white text-[16px] font-black tracking-wide">Retry Level 🔄</Text>
          </Pressable>

          <Pressable onPress={handleHome} className="w-full rounded-[16px] py-3 items-center border-[1.5px] border-game-dot">
            <Text className="text-game-secondary text-[14px] font-bold">Back to Home</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
};
