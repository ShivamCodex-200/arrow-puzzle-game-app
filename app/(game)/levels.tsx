import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  FadeInDown,
} from 'react-native-reanimated';
import { useProgressStore } from '../../store/useProgressStore';

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
    <View className="w-1/4 items-center justify-center my-2.5">
      {/* Stars row above the circle */}
      <View className="h-3.5 justify-center mb-1">
        {isCompleted ? (
          <View className="flex-row justify-center">
            {[1, 2, 3].map((i) => (
              <MaterialIcons
                key={i}
                name="star"
                size={11}
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
            ${!isUnlocked ? 'bg-slate-100 border-slate-200/60 shadow-none elevation-0' : 'border-slate-200'}
          `}
        >
          {!isUnlocked ? (
            <View className="items-center justify-center gap-0.5 opacity-60">
              <MaterialIcons name="lock" size={14} color="#94A3B8" />
              <Text className="text-[10px] font-bold text-game-secondary">{level}</Text>
            </View>
          ) : (
            <Text className={`text-[17px] font-black ${isCurrent ? 'text-blue-500' : 'text-game-navy'}`}>
              {level}
            </Text>
          )}

          {isCompleted && (
            <View className="absolute -right-0.5 -bottom-0.5 w-[16px] h-[16px] rounded-full bg-game-success items-center justify-center border-[1.5px] border-white">
              <MaterialIcons name="check" size={8} color="#FFFFFF" />
            </View>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
};

console.log('All levels');

export default function LevelsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { unlockedLevel, completedLevels } = useProgressStore();

  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);

  const totalStars = Object.values(completedLevels).reduce((s, r) => s + (r.stars ?? 0), 0);
  const totalCompleted = Object.keys(completedLevels).length;

  // Dynamically calculate visible chapters based on highest unlocked level
  const activeChapterId = Math.max(1, Math.ceil(unlockedLevel / CHAPTER_SIZE));
  
  const chapters = [];
  for (let c = 1; c <= activeChapterId; c++) {
    const startLvl = (c - 1) * CHAPTER_SIZE + 1;
    const endLvl = c * CHAPTER_SIZE;
    
    let completedCount = 0;
    let chapterStars = 0;
    for (let lvl = startLvl; lvl <= endLvl; lvl++) {
      const record = completedLevels[lvl];
      if (record) {
        completedCount++;
        chapterStars += record.stars ?? 0;
      }
    }

    chapters.push({
      id: c,
      title: `Chapter ${c}`,
      rangeText: `Levels ${startLvl} - ${endLvl}`,
      startLvl,
      endLvl,
      completedCount,
      chapterStars,
      isCompleted: completedCount === CHAPTER_SIZE,
      isActive: c === activeChapterId,
    });
  }

  // Handle header back action
  const handleBack = () => {
    if (selectedChapterId !== null) {
      setSelectedChapterId(null);
    } else {
      router.back();
    }
  };

  // Find info about the currently selected chapter
  const selectedChapter = chapters.find(c => c.id === selectedChapterId);

  // Generate levels list for grid display
  const levelNumbers = [];
  if (selectedChapter) {
    for (let lvl = selectedChapter.startLvl; lvl <= selectedChapter.endLvl; lvl++) {
      levelNumbers.push(lvl);
    }
  }

  return (
    <LinearGradient
      colors={['#EDF3FA', '#E4EDF7']}
      className="flex-1"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <StatusBar barStyle="dark-content" />

      {/* Header Bar */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable 
          onPress={handleBack} 
          className="w-10 h-10 rounded-full bg-white items-center justify-center shadow shadow-game-navy/5 border border-white/80 elevation-2" 
          hitSlop={8}
        >
          <MaterialIcons name="arrow-back" size={22} color="#1F355E" />
        </Pressable>
        
        <View className="items-center">
          <Text className="text-[20px] font-black text-game-navy tracking-tight">
            {selectedChapterId !== null ? `Chapter ${selectedChapterId}` : 'Chapters'}
          </Text>
          {selectedChapterId !== null && selectedChapter && (
            <Text className="text-[11px] font-bold text-game-secondary mt-[1px] uppercase tracking-wider">
              {selectedChapter.rangeText}
            </Text>
          )}
        </View>

        <Pressable 
          onPress={() => router.push('/(game)/settings')} 
          className="w-10 h-10 rounded-full bg-white items-center justify-center shadow shadow-game-navy/5 border border-white/80 elevation-2" 
          hitSlop={8}
        >
          <MaterialIcons name="settings" size={22} color="#1F355E" />
        </Pressable>
      </View>

      {selectedChapterId === null ? (
        /* CHAPTERS LIST VIEW */
        <ScrollView 
          contentContainerStyle={{ paddingBottom: 24 }}
          className="flex-1"
          showsVerticalScrollIndicator={false}
        >
          {/* Progress Summary Box */}
          <View className="bg-white rounded-[20px] px-4 py-4 mx-5 my-2 flex-row items-center justify-around shadow-sm shadow-game-navy/5 border border-white/80">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-emerald-50 items-center justify-center mr-2 border border-emerald-100/50">
                <MaterialIcons name="done" size={16} color="#10B981" />
              </View>
              <View>
                <Text className="text-[15px] font-black text-game-navy">{totalCompleted}</Text>
                <Text className="text-[10px] font-bold text-game-secondary mt-0.5">Cleared</Text>
              </View>
            </View>
            <View className="w-[1px] h-8 bg-slate-100" />
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-amber-50 items-center justify-center mr-2 border border-amber-100/50">
                <MaterialIcons name="star" size={16} color="#F59E0B" />
              </View>
              <View>
                <Text className="text-[15px] font-black text-game-navy">{totalStars}</Text>
                <Text className="text-[10px] font-bold text-game-secondary mt-0.5">Total Stars</Text>
              </View>
            </View>
          </View>

          {/* Chapters List */}
          <View className="gap-1 mt-2">
            {chapters.map((chapter) => {
              const percent = Math.min(100, (chapter.completedCount / 20) * 100);
              return (
                <Animated.View
                  entering={FadeInDown.duration(450).delay(chapter.id * 35)}
                  key={chapter.id}
                  className="mx-5 my-2"
                >
                  <Pressable
                    onPress={() => setSelectedChapterId(chapter.id)}
                    style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }]}
                    className="bg-white rounded-[22px] p-[16px] flex-row items-center justify-between shadow-sm shadow-game-navy/5 border border-white/80"
                  >
                    {/* Chapter details block */}
                    <View className="flex-row items-center flex-1 pr-4">
                      {/* Left Badge: CH ID */}
                      <View className={`w-12 h-12 rounded-[16px] items-center justify-center mr-3.5 border
                        ${chapter.isCompleted 
                          ? 'bg-emerald-50 border-emerald-100/40' 
                          : chapter.isActive 
                            ? 'bg-blue-50 border-blue-100/40' 
                            : 'bg-slate-50 border-slate-100/40'
                        }
                      `}>
                        <Text className={`text-[14px] font-black uppercase
                          ${chapter.isCompleted 
                            ? 'text-emerald-500' 
                            : chapter.isActive 
                              ? 'text-blue-500' 
                              : 'text-game-secondary'
                          }
                        `}>
                          CH{chapter.id}
                        </Text>
                      </View>

                      {/* Middle description and progress bar */}
                      <View className="flex-1">
                        <View className="flex-row items-center gap-1.5 flex-wrap">
                          <Text className="text-[16px] font-bold text-game-navy">{chapter.title}</Text>
                          {chapter.isCompleted ? (
                            <View className="bg-emerald-50 border border-emerald-100/50 px-2 py-0.5 rounded-full">
                              <Text className="text-[9px] font-bold text-emerald-500 uppercase">Cleared</Text>
                            </View>
                          ) : chapter.isActive ? (
                            <View className="bg-blue-50 border border-blue-100/50 px-2 py-0.5 rounded-full">
                              <Text className="text-[9px] font-bold text-blue-500 uppercase">Active</Text>
                            </View>
                          ) : null}
                        </View>
                        
                        <Text className="text-[11px] font-medium text-game-secondary mt-0.5">
                          {chapter.completedCount}/20 Completed
                        </Text>

                        {/* Custom Progress Bar */}
                        <View className="h-1.5 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
                          <View 
                            style={{ width: `${percent}%` }} 
                            className={`h-full rounded-full 
                              ${chapter.isCompleted ? 'bg-emerald-500' : 'bg-blue-500'}
                            `} 
                          />
                        </View>
                      </View>
                    </View>

                    {/* Right block: star count and chevron */}
                    <View className="flex-row items-center gap-2">
                      <View className="items-end">
                        <View className="flex-row items-center">
                          <MaterialIcons name="star" size={13} color="#F59E0B" className="mr-0.5" />
                          <Text className="text-[12px] font-black text-game-navy">
                            {chapter.chapterStars}
                          </Text>
                        </View>
                        <Text className="text-[9px] font-bold text-game-secondary mt-0.5">/ 60 Stars</Text>
                      </View>
                      <MaterialIcons name="chevron-right" size={20} color="#94A3B8" />
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        </ScrollView>
      ) : (
        /* DETAIL GRID VIEW FOR SELECTED CHAPTER */
        <View className="flex-1">
          {/* Chapter Level Grid Summary */}
          {selectedChapter && (
            <View className="bg-white rounded-[20px] p-4 mx-5 my-2.5 shadow-sm shadow-game-navy/5 border border-white/80">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-[14px] font-bold text-game-navy">Chapter Progression</Text>
                <Text className="text-[12px] font-extrabold text-game-navy">
                  {selectedChapter.completedCount} / 20 Cleared
                </Text>
              </View>
              <View className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
                <View 
                  style={{ width: `${(selectedChapter.completedCount / 20) * 100}%` }} 
                  className={`h-full rounded-full 
                    ${selectedChapter.isCompleted ? 'bg-emerald-500' : 'bg-blue-500'}
                  `} 
                />
              </View>
              <View className="flex-row justify-between items-center mt-1">
                <Text className="text-[11px] font-medium text-game-secondary">
                  Earn stars by completing levels in fewer moves
                </Text>
                <View className="flex-row items-center bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100/50">
                  <MaterialIcons name="star" size={12} color="#F59E0B" className="mr-0.5" />
                  <Text className="text-[10px] font-bold text-amber-600">
                    {selectedChapter.chapterStars} / 60
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Level Numbers Grid */}
          <FlatList
            data={levelNumbers}
            keyExtractor={(item) => item.toString()}
            numColumns={4}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, paddingTop: 4 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item: lvl }) => {
              const record = completedLevels[lvl];
              return (
                <LevelItem
                  level={lvl}
                  isUnlocked={lvl <= unlockedLevel}
                  isCurrent={lvl === unlockedLevel}
                  isCompleted={!!record}
                  stars={record?.stars ?? 0}
                  onPress={() =>
                    router.push({
                      pathname: '/(game)/play',
                      params: { level: lvl.toString() },
                    })
                  }
                />
              );
            }}
          />
        </View>
      )}
    </LinearGradient>
  );
}
