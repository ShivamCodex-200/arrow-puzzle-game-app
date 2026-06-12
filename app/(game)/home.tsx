import React from 'react';
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
import Svg, { Path, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { useProgressStore } from '../../store/useProgressStore';
import { COLORS } from '../../constants/theme';

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
    scale.value = withTiming(0.95, { duration: 80 });
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

  return (
    <View 
      className="flex-1 bg-game-bg" 
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <StatusBar barStyle="dark-content" />

      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        className="px-6 py-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 justify-center gap-5">
          {/* Header Title Section */}
          <Animated.View entering={FadeIn.duration(600)} className="items-center gap-1">
            <Text className="text-[11px] font-bold text-game-secondary tracking-[2.5px] uppercase">
              Tap • Escape • Clear
            </Text>
            <Text className="text-[34px] font-black text-game-navy tracking-tight">
              Arrow Puzzle
            </Text>
          </Animated.View>

          {/* Visual Gameplay Preview */}
          <Animated.View entering={FadeIn.duration(700).delay(100)} className="items-center">
            <View className="w-[144px] h-[144px] rounded-[20px] bg-white items-center justify-center shadow-md shadow-game-navy/5 elevation-3">
              <Svg width={120} height={120} viewBox="0 0 120 120">
                {/* Uncovered background grid dots */}
                <Circle cx={98} cy={14} r={2.8} fill="#C2C7D0" opacity={0.8} />
                <Circle cx={14} cy={42} r={2.8} fill="#C2C7D0" opacity={0.8} />
                <Circle cx={42} cy={42} r={2.8} fill="#C2C7D0" opacity={0.8} />
                <Circle cx={14} cy={70} r={2.8} fill="#C2C7D0" opacity={0.8} />
                <Circle cx={42} cy={70} r={2.8} fill="#C2C7D0" opacity={0.8} />

                {/* Arrow Line 1: L-shape pointing down */}
                <Path
                  d="M 14 14 L 70 14 L 70 70"
                  stroke={COLORS.arrowNormal}
                  strokeWidth={5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <Path
                  d="M 66 64 L 70 70 L 74 64"
                  stroke={COLORS.arrowNormal}
                  strokeWidth={5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />

                {/* Arrow Line 2: Straight pointing right */}
                <Path
                  d="M 14 98 L 70 98"
                  stroke="#3B82F6"
                  strokeWidth={5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <Path
                  d="M 64 94 L 70 98 L 64 102"
                  stroke="#3B82F6"
                  strokeWidth={5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />

                {/* Arrow Line 3: Straight pointing down */}
                <Path
                  d="M 98 42 L 98 98"
                  stroke={COLORS.arrowNormal}
                  strokeWidth={5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <Path
                  d="M 94 92 L 98 98 L 102 92"
                  stroke={COLORS.arrowNormal}
                  strokeWidth={5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </Svg>
            </View>
          </Animated.View>

          {/* Primary CTA: Continue Playing Card */}
          <Animated.View entering={FadeInDown.duration(600).delay(200)}>
            <ScalePressable
              onPress={() =>
                router.push({
                  pathname: '/(game)/play',
                  params: { level: unlockedLevel.toString() },
                })
              }
              className="bg-blue-500 rounded-[20px] px-5 py-4 flex-row items-center shadow-lg shadow-blue-500/20 elevation-6"
            >
              <View className="w-11 h-11 rounded-full bg-white/20 items-center justify-center mr-4">
                <MaterialIcons name="play-arrow" size={28} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="text-[18px] font-black text-white">Continue</Text>
                <Text className="text-[13px] font-semibold text-sky-100 mt-[1px]">Level {unlockedLevel}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#FFFFFF" className="opacity-80" />
            </ScalePressable>
          </Animated.View>

          {/* Progress Stats Card */}
          <Animated.View entering={FadeInDown.duration(600).delay(350)}>
            <View className="bg-white rounded-[16px] py-3.5 flex-row items-center justify-around shadow-sm shadow-game-navy/5 elevation-2">
              <View className="items-center flex-1">
                <Text className="text-[16px] font-extrabold text-game-navy">✓ {totalCompleted}</Text>
                <Text className="text-[11px] font-semibold text-game-secondary mt-0.5">Cleared</Text>
              </View>
              <View className="w-[1px] h-6 bg-game-bg" />
              <View className="items-center flex-1">
                <Text className="text-[16px] font-extrabold text-game-navy">⭐ {totalStars}</Text>
                <Text className="text-[11px] font-semibold text-game-secondary mt-0.5">Stars</Text>
              </View>
              <View className="w-[1px] h-6 bg-game-bg" />
              <View className="items-center flex-1">
                <Text className="text-[16px] font-extrabold text-game-navy">🏅 {totalCompleted}</Text>
                <Text className="text-[11px] font-semibold text-game-secondary mt-0.5">Streak</Text>
              </View>
            </View>
          </Animated.View>

          {/* Menu Cards */}
          <View className="gap-2.5">
            <Animated.View entering={FadeInDown.duration(600).delay(450)}>
              <ScalePressable
                onPress={() => router.push('/(game)/levels')}
                className="bg-white rounded-[16px] px-[18px] py-[15px] flex-row items-center justify-between shadow-sm shadow-game-navy/5 elevation-2"
              >
                <View className="flex-row items-center gap-3">
                  <Text className="text-[18px]">📚</Text>
                  <Text className="text-[15px] font-bold text-game-navy">All Levels</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#94A3B8" />
              </ScalePressable>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(600).delay(525)}>
              <ScalePressable
                onPress={() => router.push('/(game)/escape-mode')}
                className="bg-white rounded-[16px] px-[18px] py-[15px] flex-row items-center justify-between shadow-sm shadow-game-navy/5 elevation-2"
              >
                <View className="flex-row items-center gap-3">
                  <Text className="text-[18px]">🧩</Text>
                  <Text className="text-[15px] font-bold text-game-navy">Escape Mode</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#94A3B8" />
              </ScalePressable>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(600).delay(600)}>
              <ScalePressable
                onPress={() => router.push('/(game)/daily-challenge')}
                className="bg-white rounded-[16px] px-[18px] py-[15px] flex-row items-center justify-between shadow-sm shadow-game-navy/5 elevation-2"
              >
                <View className="flex-row items-center gap-3">
                  <Text className="text-[18px]">🔥</Text>
                  <Text className="text-[15px] font-bold text-game-navy">Daily Challenge</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#94A3B8" />
              </ScalePressable>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(600).delay(675)}>
              <ScalePressable
                onPress={() => router.push('/(game)/settings')}
                className="bg-white rounded-[16px] px-[18px] py-[15px] flex-row items-center justify-between shadow-sm shadow-game-navy/5 elevation-2"
              >
                <View className="flex-row items-center gap-3">
                  <Text className="text-[18px]">⚙️</Text>
                  <Text className="text-[15px] font-bold text-game-navy">Settings</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#94A3B8" />
              </ScalePressable>
            </Animated.View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
