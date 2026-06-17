import React, { useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { useProgressStore } from '../../store/useProgressStore';

interface AnimatedButtonProps {
  onPress: () => void;
  className?: string;
  style?: any;
  children: React.ReactNode;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ScalePressable: React.FC<AnimatedButtonProps> = ({ onPress, className, style, children }) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withTiming(0.96, { duration: 80 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 80 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      className={className}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { unlockedLevel, completedLevels } = useProgressStore();

  const totalCompleted = Object.keys(completedLevels).length;
  const totalStars = Object.values(completedLevels).reduce((s, r) => s + (r.stars ?? 0), 0);

  // Logo Floating Micro-Animation
  const floatValue = useSharedValue(0);

  useEffect(() => {
    floatValue.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  return (
    <LinearGradient
      colors={['#EDF3FA', '#E4EDF7']}
      className="flex-1"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <StatusBar barStyle="dark-content" />

      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        className="px-6 py-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 justify-center gap-6">
          {/* Header Title Section */}
          <Animated.View entering={FadeIn.duration(600)} className="items-center gap-1">
            <Text className="text-[11px] font-bold text-game-secondary tracking-[3px] uppercase">
              Tap • Escape • Clear
            </Text>
            <Text className="text-[36px] font-black text-game-navy tracking-tight">
              Arrow Puzzle
            </Text>
          </Animated.View>

          {/* Visual Gameplay Preview - Custom Floating Logo Frame */}
          <Animated.View 
            entering={FadeIn.duration(700).delay(100)} 
            className="items-center my-3"
          >
            <View className="w-[146px] h-[146px] rounded-md items-center justify-center shadow-xl shadow-game-navy/10 border-4 border-white/60 overflow-hidden">
              <Image
                source={require('../../assets/arrow_game_logo.png')}
                style={{ width: 138, height: 138, }}
                contentFit="contain"
              />
            </View>
          </Animated.View>

          {/* Primary CTA: Continue Playing Card with Gradient */}
          <Animated.View entering={FadeInDown.duration(600).delay(200)}>
            <ScalePressable
              onPress={() =>
                router.push({
                  pathname: '/(game)/play',
                  params: { level: unlockedLevel.toString() },
                })
              }
              className="overflow-hidden rounded-[24px] shadow-lg shadow-blue-500/25 border border-white/20"
            >
              <LinearGradient
                colors={['#3B82F6', '#1D4ED8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="px-6 py-5 flex-row items-center justify-between"
              >
                <View className="flex-row items-center flex-1 pr-4">
                  <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center mr-4 border border-white/10">
                    <MaterialIcons name="play-arrow" size={30} color="#FFFFFF" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[11px] font-bold text-white/80 uppercase tracking-widest">Adventure Mode</Text>
                    <Text className="text-[22px] font-black text-white mt-0.5">Continue</Text>
                    <Text className="text-[13px] font-medium text-sky-100 mt-[1px]">Level {unlockedLevel}</Text>
                  </View>
                </View>
                <View className="w-8 h-8 rounded-full bg-white/10 items-center justify-center">
                  <MaterialIcons name="chevron-right" size={24} color="#FFFFFF" />
                </View>
              </LinearGradient>
            </ScalePressable>
          </Animated.View>

          {/* Progress Stats Card */}
          <Animated.View entering={FadeInDown.duration(600).delay(350)}>
            <View className="bg-white rounded-[24px] p-4 flex-row items-center justify-around shadow-sm shadow-game-navy/5 border border-white/80">
              <View className="items-center flex-1">
                <View className="w-10 h-10 rounded-full bg-emerald-50 items-center justify-center mb-1.5 border border-emerald-100/50">
                  <MaterialIcons name="done" size={20} color="#10B981" />
                </View>
                <Text className="text-[17px] font-black text-game-navy">{totalCompleted}</Text>
                <Text className="text-[11px] font-bold text-game-secondary mt-0.5">Cleared</Text>
              </View>
              <View className="w-[1px] h-10 bg-slate-100" />
              <View className="items-center flex-1">
                <View className="w-10 h-10 rounded-full bg-amber-50 items-center justify-center mb-1.5 border border-amber-100/50">
                  <MaterialIcons name="star" size={20} color="#F59E0B" />
                </View>
                <Text className="text-[17px] font-black text-game-navy">{totalStars}</Text>
                <Text className="text-[11px] font-bold text-game-secondary mt-0.5">Stars</Text>
              </View>
              <View className="w-[1px] h-10 bg-slate-100" />
              <View className="items-center flex-1">
                <View className="w-10 h-10 rounded-full bg-red-50 items-center justify-center mb-1.5 border border-red-100/50">
                  <MaterialIcons name="local-fire-department" size={20} color="#EF4444" />
                </View>
                <Text className="text-[17px] font-black text-game-navy">{totalCompleted}</Text>
                <Text className="text-[11px] font-bold text-game-secondary mt-0.5">Streak</Text>
              </View>
            </View>
          </Animated.View>

          {/* Menu Cards */}
          <View className="gap-3.5">
            {/* All Levels */}
            <Animated.View entering={FadeInDown.duration(600).delay(450)}>
              <ScalePressable
                onPress={() => router.push('/(game)/levels')}
                className="bg-white rounded-[22px] p-[16px] flex-row items-center justify-between shadow-sm shadow-game-navy/5 border border-white/80"
              >
                <View className="flex-row items-center flex-1 pr-4">
                  <View className="w-12 h-12 rounded-[18px] bg-indigo-50 items-center justify-center mr-3.5 border border-indigo-100/30">
                    <MaterialIcons name="grid-on" size={22} color="#4F46E5" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[16px] font-bold text-game-navy">All Levels</Text>
                    <Text className="text-[12px] font-regular text-game-secondary mt-0.5">Explore 100+ arrow puzzles</Text>
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={22} color="#94A3B8" />
              </ScalePressable>
            </Animated.View>

            {/* Daily Challenge */}
            <Animated.View entering={FadeInDown.duration(600).delay(525)}>
              <ScalePressable
                onPress={() => router.push('/(game)/daily-challenge')}
                className="bg-white rounded-[22px] p-[16px] flex-row items-center justify-between shadow-sm shadow-game-navy/5 border border-white/80"
              >
                <View className="flex-row items-center flex-1 pr-4">
                  <View className="w-12 h-12 rounded-[18px] bg-amber-50 items-center justify-center mr-3.5 border border-amber-100/30">
                    <MaterialIcons name="event" size={22} color="#D97706" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[16px] font-bold text-game-navy">Daily Challenge</Text>
                    <Text className="text-[12px] font-regular text-game-secondary mt-0.5">Solve today's unique board seed</Text>
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={22} color="#94A3B8" />
              </ScalePressable>
            </Animated.View>

            {/* Settings */}
            <Animated.View entering={FadeInDown.duration(600).delay(600)}>
              <ScalePressable
                onPress={() => router.push('/(game)/settings')}
                className="bg-white rounded-[22px] p-[16px] flex-row items-center justify-between shadow-sm shadow-game-navy/5 border border-white/80"
              >
                <View className="flex-row items-center flex-1 pr-4">
                  <View className="w-12 h-12 rounded-[18px] bg-slate-50 items-center justify-center mr-3.5 border border-slate-100/30">
                    <MaterialIcons name="settings" size={22} color="#475569" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[16px] font-bold text-game-navy">Settings</Text>
                    <Text className="text-[12px] font-regular text-game-secondary mt-0.5">Configure audio and preferences</Text>
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={22} color="#94A3B8" />
              </ScalePressable>
            </Animated.View>
          </View>

          {/* Footer Label */}
          <Text className="text-center text-game-secondary/60 text-[11px] font-medium mt-2">
            v1.0.0 • Developed with ❤️
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}
