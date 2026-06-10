import React, { useEffect } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useGameStore } from '../store/useGameStore';

const { width: W, height: H } = Dimensions.get('window');

// ── Confetti particle ─────────────────────────────────────────────────────
const CONFETTI_COLORS = ['#F87171', '#60A5FA', '#34D399', '#FBBF24', '#A78BFA', '#F472B6'];

const Particle = ({ index }: { index: number }) => {
  const color  = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const size   = 6 + (index % 5) * 2;
  const startX = (W / 40) * index;
  const drift  = (index % 2 === 0 ? 1 : -1) * (20 + (index % 4) * 25);

  const y = useSharedValue(-20);
  const x = useSharedValue(startX);
  const r = useSharedValue(0);
  const o = useSharedValue(1);

  useEffect(() => {
    const delay    = (index % 20) * 70;
    const duration = 1800 + (index % 8) * 250;

    y.value = withDelay(delay, withTiming(H + 20, { duration, easing: Easing.linear }));
    x.value = withDelay(delay, withTiming(startX + drift, { duration }));
    r.value = withDelay(delay, withRepeat(withTiming(360, { duration: 700, easing: Easing.linear }), -1));
    o.value = withDelay(delay + duration * 0.65, withTiming(0, { duration: duration * 0.35 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    width:           size,
    height:          size * 1.5,
    backgroundColor: color,
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotate: `${r.value}deg` },
    ],
    opacity: o.value,
  }));

  return <Animated.View className="absolute top-0 left-0 rounded-[2px]" style={style} />;
};

// ── Win Overlay ───────────────────────────────────────────────────────────
export const WinOverlay: React.FC = () => {
  const { grid, moves, isWon, nextLevel, resetLevel } = useGameStore();

  const scale  = useSharedValue(0.6);
  const opCard = useSharedValue(0);
  const opBg   = useSharedValue(0);

  useEffect(() => {
    if (isWon) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      opBg.value   = withTiming(1, { duration: 300 });
      scale.value  = withDelay(100, withSpring(1, { damping: 14, stiffness: 130 }));
      opCard.value = withDelay(100, withTiming(1, { duration: 300 }));
    } else {
      scale.value  = 0.6;
      opCard.value = 0;
      opBg.value   = 0;
    }
  }, [isWon]);

  const bgStyle   = useAnimatedStyle(() => ({ opacity: opBg.value }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity:   opCard.value,
    transform: [{ scale: scale.value }],
  }));

  if (!isWon || !grid) return null;

  const total = grid.totalArrows;
  const stars = moves <= total ? 3 : moves <= Math.floor(total * 1.5) ? 2 : 1;

  const handleNext = () => {
    nextLevel();
  };

  return (
    <View className="absolute inset-0" pointerEvents="box-none">
      {/* Dim background */}
      <Animated.View className="absolute inset-0 bg-slate-900/75" style={bgStyle} />

      {/* Confetti */}
      <View className="absolute inset-0" pointerEvents="none">
        {Array.from({ length: 45 }).map((_, i) => <Particle key={i} index={i} />)}
      </View>

      {/* Card */}
      <View className="flex-1 items-center justify-center px-7">
        <Animated.View className="w-full max-w-[360px] bg-white rounded-[28px] p-7 items-center gap-3 shadow-2xl elevation-6" style={cardStyle}>
          {/* Trophy */}
          <View className="w-20 h-20 rounded-full bg-amber-100 items-center justify-center border-2 border-amber-200 mb-1">
            <MaterialIcons name="emoji-events" size={52} color="#F59E0B" />
          </View>

          <Text className="text-[26px] font-black text-game-navy tracking-tight">Level {grid.levelNumber} Clear!</Text>
          <Text className="text-[14px] text-game-secondary font-medium">Well played! 🎉</Text>

          {/* Stars */}
          <View className="flex-row gap-2 my-1">
            {[1, 2, 3].map(i => (
              <MaterialIcons
                key={i}
                name="star"
                size={40}
                color={i <= stars ? '#F59E0B' : '#D1D5DB'}
                style={{ transform: [{ scale: i <= stars ? 1.1 : 0.85 }] }}
              />
            ))}
          </View>

          {/* Stats */}
          <View className="flex-row bg-game-bg rounded-[16px] py-3 px-6 gap-6 w-full justify-center items-center">
            <View className="items-center gap-0.5">
              <Text className="text-[11px] font-semibold text-game-secondary uppercase tracking-wider">Moves</Text>
              <Text className="text-[20px] font-black text-game-navy">{moves}</Text>
            </View>
            <View className="w-[1px] h-8 bg-game-dot" />
            <View className="items-center gap-0.5">
              <Text className="text-[11px] font-semibold text-game-secondary uppercase tracking-wider">Stars</Text>
              <Text className="text-[20px] font-black text-amber-500">{stars} / 3</Text>
            </View>
          </View>

          {/* Buttons */}
          <Pressable onPress={handleNext} className="w-full bg-game-navy rounded-[16px] py-[15px] items-center mt-1">
            <Text className="text-white text-[16px] font-black tracking-wide">Next Level →</Text>
          </Pressable>

          <Pressable onPress={resetLevel} className="w-full rounded-[16px] py-3 items-center border-[1.5px] border-game-dot">
            <Text className="text-game-secondary text-[14px] font-bold">Replay</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
};
