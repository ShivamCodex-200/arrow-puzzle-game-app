import React, { useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  FadeInDown,
} from 'react-native-reanimated';
import { useProgressStore } from '../../store/useProgressStore';

const TOTAL_LEVELS = 200;
const CHAPTER_SIZE = 20;

interface LevelItemProps {
  level: number;
  isUnlocked: boolean;
  isCurrent: boolean;
  isCompleted: boolean;
  stars: number;
  onPress: () => void;
}

const LevelItem: React.FC<LevelItemProps> = ({
  level,
  isUnlocked,
  isCurrent,
  isCompleted,
  stars,
  onPress,
}) => {
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (isCurrent) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.06, { duration: 600 }),
          withTiming(1.0, { duration: 600 })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = 1;
    }
  }, [isCurrent]);

  const handlePressIn = () => {
    if (isUnlocked) {
      scale.value = withTiming(0.92, { duration: 80 });
    }
  };

  const handlePressOut = () => {
    if (isUnlocked) {
      scale.value = withTiming(1, { duration: 80 });
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    const s = scale.value * pulseScale.value;
    return {
      transform: [{ scale: s }],
    };
  });

  return (
    <View className="w-1/4 items-center justify-center my-1.5">
      {/* Stars row above the circle */}
      <View className="h-3.5 justify-center mb-1">
        {isCompleted ? (
          <View className="flex-row justify-center">
            {[1, 2, 3].map((i) => (
              <MaterialIcons
                key={i}
                name="star"
                size={10}
                color={i <= stars ? '#F59E0B' : '#E2E8F0'}
                className="mx-[0.5px]"
              />
            ))}
          </View>
        ) : (
          <View className="h-3.5" />
        )}
      </View>

      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={!isUnlocked}
          className={`w-[58px] h-[58px] rounded-full bg-white border-[1.5px] items-center justify-center shadow shadow-game-navy/5 elevation-2
            ${isCompleted ? 'border-slate-200' : ''}
            ${isCurrent ? 'border-blue-500 border-[3px]' : ''}
            ${!isUnlocked ? 'bg-slate-100 border-slate-200 shadow-none elevation-0' : 'border-slate-200'}
          `}
        >
          {!isUnlocked ? (
            <View className="items-center justify-center gap-0.5">
              <MaterialIcons name="lock" size={15} color="#94A3B8" />
              <Text className="text-[11px] font-bold text-game-secondary">{level}</Text>
            </View>
          ) : (
            <Text className={`text-[16px] font-black ${isCurrent ? 'text-blue-500' : 'text-game-navy'}`}>
              {level}
            </Text>
          )}

          {isCompleted && (
            <View className="absolute -right-0.5 -bottom-0.5 w-[15px] h-[15px] rounded-full bg-game-success items-center justify-center border-[1.5px] border-white">
              <MaterialIcons name="check" size={8} color="#FFFFFF" />
            </View>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
};

export default function LevelsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { unlockedLevel, completedLevels } = useProgressStore();

  const totalStars = Object.values(completedLevels).reduce((s, r) => s + (r.stars ?? 0), 0);
  const totalCompleted = Object.keys(completedLevels).length;

  // Group levels into chapters
  const chapters = [];
  for (let i = 0; i < TOTAL_LEVELS; i += CHAPTER_SIZE) {
    const chapterNum = i / CHAPTER_SIZE + 1;
    const startLvl = i + 1;
    const endLvl = i + CHAPTER_SIZE;
    const levelNums = [];
    for (let j = startLvl; j <= endLvl; j++) {
      levelNums.push(j);
    }
    chapters.push({
      id: chapterNum,
      title: `Chapter ${chapterNum}`,
      rangeText: `Levels ${startLvl} - ${endLvl}`,
      levels: levelNums,
    });
  }

  return (
    <View 
      className="flex-1 bg-game-bg" 
      style={{ paddingTop: insets.top }}
    >
      <StatusBar barStyle="dark-content" />

      {/* Top Bar Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full bg-white items-center justify-center shadow shadow-game-navy/5 elevation-2" hitSlop={8}>
          <MaterialIcons name="arrow-back" size={22} color="#1F355E" />
        </Pressable>
        <Text className="text-[20px] font-black text-game-navy tracking-tight">Levels</Text>
        <Pressable onPress={() => router.push('/(game)/settings')} className="w-10 h-10 rounded-full bg-white items-center justify-center shadow shadow-game-navy/5 elevation-2" hitSlop={8}>
          <MaterialIcons name="settings" size={22} color="#1F355E" />
        </Pressable>
      </View>

      {/* Progress Summary Card */}
      <View className="bg-white rounded-[16px] px-4 py-3.5 mx-4 mb-2 flex-row items-center justify-around shadow-md shadow-game-navy/5 elevation-3">
        <View className="flex-row items-center">
          <MaterialIcons name="check-circle" size={18} color="#22C55E" className="mr-1.5" />
          <Text className="text-[14px] font-extrabold text-game-navy">{totalCompleted} Cleared</Text>
        </View>
        <View className="w-[1px] h-5 bg-slate-200" />
        <View className="flex-row items-center">
          <MaterialIcons name="star" size={18} color="#F59E0B" className="mr-1.5" />
          <Text className="text-[14px] font-extrabold text-game-navy">{totalStars} Stars</Text>
        </View>
      </View>

      {/* Chapters Scroll View */}
      <FlatList
        data={chapters}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: chapter }) => (
          <Animated.View
            entering={FadeInDown.duration(400).delay(chapter.id * 40)}
            className="bg-white rounded-[20px] p-4 mx-4 my-2 shadow-sm shadow-game-navy/5 elevation-2"
          >
            <View className="flex-row justify-between items-center border-b border-game-bg pb-2 mb-2">
              <Text className="text-[15px] font-extrabold text-game-navy">{chapter.title}</Text>
              <Text className="text-[12px] font-bold text-game-secondary">{chapter.rangeText}</Text>
            </View>
            <View className="flex-row flex-wrap">
              {chapter.levels.map((level) => {
                const record = completedLevels[level];
                return (
                  <LevelItem
                    key={level}
                    level={level}
                    isUnlocked={level <= unlockedLevel}
                    isCurrent={level === unlockedLevel}
                    isCompleted={!!record}
                    stars={record?.stars ?? 0}
                    onPress={() =>
                      router.push({
                        pathname: '/(game)/play',
                        params: { level: level.toString() },
                      })
                    }
                  />
                );
              })}
            </View>
          </Animated.View>
        )}
      />
    </View>
  );
}
