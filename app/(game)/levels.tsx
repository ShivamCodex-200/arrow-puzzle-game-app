import React, { useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
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
import { COLORS } from '../../constants/theme';

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
    <View style={styles.levelCellWrapper}>
      {/* Stars row above the circle */}
      <View style={styles.starsContainer}>
        {isCompleted ? (
          <View style={styles.starsRow}>
            {[1, 2, 3].map((i) => (
              <MaterialIcons
                key={i}
                name="star"
                size={10}
                color={i <= stars ? '#F59E0B' : '#E2E8F0'}
                style={styles.starIcon}
              />
            ))}
          </View>
        ) : (
          <View style={styles.starsPlaceholder} />
        )}
      </View>

      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={!isUnlocked}
          style={[
            styles.circleButton,
            isCompleted && styles.circleCompleted,
            isCurrent && styles.circleCurrent,
            !isUnlocked && styles.circleLocked,
          ]}
        >
          {!isUnlocked ? (
            <View style={styles.lockedContent}>
              <MaterialIcons name="lock" size={15} color="#94A3B8" />
              <Text style={styles.lockedText}>{level}</Text>
            </View>
          ) : (
            <Text style={[styles.circleText, isCurrent && styles.currentText]}>
              {level}
            </Text>
          )}

          {isCompleted && (
            <View style={styles.checkBadge}>
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* Top Bar Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerIconBtn} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={22} color="#1F355E" />
        </Pressable>
        <Text style={styles.headerTitle}>Levels</Text>
        <Pressable onPress={() => router.push('/(game)/settings')} style={styles.headerIconBtn} hitSlop={8}>
          <MaterialIcons name="settings" size={22} color="#1F355E" />
        </Pressable>
      </View>

      {/* Progress Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <MaterialIcons name="check-circle" size={18} color="#22C55E" style={{ marginRight: 6 }} />
          <Text style={styles.summaryLabel}>{totalCompleted} Cleared</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <MaterialIcons name="star" size={18} color="#F59E0B" style={{ marginRight: 6 }} />
          <Text style={styles.summaryLabel}>{totalStars} Stars</Text>
        </View>
      </View>

      {/* Chapters Scroll View */}
      <FlatList
        data={chapters}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.scrollList}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: chapter }) => (
          <Animated.View
            entering={FadeInDown.duration(400).delay(chapter.id * 40)}
            style={styles.chapterCard}
          >
            <View style={styles.chapterHeader}>
              <Text style={styles.chapterTitle}>{chapter.title}</Text>
              <Text style={styles.chapterRange}>{chapter.rangeText}</Text>
            </View>
            <View style={styles.chapterGrid}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2F6', // Soft gray theme background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1F355E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F355E', // Accent dark navy
    letterSpacing: -0.3,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#1F355E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F355E',
  },
  summaryDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
  },
  scrollList: {
    paddingBottom: 24,
  },
  chapterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#1F355E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  chapterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
    paddingBottom: 8,
    marginBottom: 8,
  },
  chapterTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F355E',
  },
  chapterRange: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  chapterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  levelCellWrapper: {
    width: '25%', // Exactly 4 columns
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  starsContainer: {
    height: 14,
    justifyContent: 'center',
    marginBottom: 4,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  starIcon: {
    marginHorizontal: 0.5,
  },
  starsPlaceholder: {
    height: 14,
  },
  circleButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1F355E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  circleCompleted: {
    borderColor: '#E2E8F0',
  },
  circleCurrent: {
    borderColor: '#3B82F6', // Blue border
    borderWidth: 3,
  },
  circleLocked: {
    backgroundColor: '#F1F5F9', // Locked Gray background
    borderColor: '#E2E8F0',
    shadowOpacity: 0.01,
    elevation: 0,
  },
  circleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F355E', // Navy
  },
  currentText: {
    color: '#3B82F6', // Current Level Blue
  },
  lockedContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  lockedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  checkBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#22C55E', // Success Green
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
