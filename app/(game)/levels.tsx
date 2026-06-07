import React from 'react';
import {
  View, Text, Pressable, FlatList, StyleSheet, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProgressStore } from '../../store/useProgressStore';
import { COLORS, SHADOWS } from '../../constants/theme';
import { getDifficulty } from '../../constants/config';

const TOTAL_LEVELS = 200;

const DIFF_COLOR: Record<string, string> = {
  Easy:   '#22C55E',
  Normal: '#F59E0B',
  Hard:   '#EF4444',
};

interface LevelItemProps {
  level: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  stars: number;
  onPress: () => void;
}

const LevelItem: React.FC<LevelItemProps> = ({ level, isUnlocked, isCompleted, stars, onPress }) => {
  const diff  = getDifficulty(level);
  const dClr  = DIFF_COLOR[diff];

  return (
    <Pressable
      onPress={onPress}
      disabled={!isUnlocked}
      style={({ pressed }) => [
        styles.levelCell,
        !isUnlocked && styles.locked,
        pressed && isUnlocked && { opacity: 0.8 },
      ]}
    >
      {isCompleted && (
        <View style={[styles.completedDot, { backgroundColor: dClr }]} />
      )}

      {!isUnlocked ? (
        <MaterialIcons name="lock" size={18} color={COLORS.dot} />
      ) : (
        <Text style={[styles.levelNum, isCompleted && { color: COLORS.text }]}>
          {level}
        </Text>
      )}

      {isCompleted && (
        <View style={styles.starsRow}>
          {[1, 2, 3].map(i => (
            <MaterialIcons
              key={i}
              name="star"
              size={8}
              color={i <= stars ? '#F59E0B' : COLORS.dot}
            />
          ))}
        </View>
      )}
    </Pressable>
  );
};

export default function LevelsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { unlockedLevel, completedLevels } = useProgressStore();

  const levels = Array.from({ length: TOTAL_LEVELS }, (_, i) => i + 1);
  const totalStars = Object.values(completedLevels).reduce((s, r) => s + (r.stars ?? 0), 0);
  const totalCompleted = Object.keys(completedLevels).length;

  return (
    <LinearGradient
      colors={[COLORS.bgGradientStart, COLORS.bgGradientEnd]}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={22} color={COLORS.text} />
        </Pressable>
        <Text style={styles.title}>Levels</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.stat}>
          <MaterialIcons name="check-circle" size={14} color={COLORS.success} />
          <Text style={styles.statText}>{totalCompleted} cleared</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <MaterialIcons name="star" size={14} color="#F59E0B" />
          <Text style={styles.statText}>{totalStars} stars</Text>
        </View>
      </View>

      <FlatList
        data={levels}
        keyExtractor={item => item.toString()}
        numColumns={5}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const record = completedLevels[item];
          return (
            <LevelItem
              level={item}
              isUnlocked={item <= unlockedLevel}
              isCompleted={!!record}
              stars={record?.stars ?? 0}
              onPress={() =>
                router.push({ pathname: '/(game)/play', params: { level: item.toString() } })
              }
            />
          );
        }}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical:   12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.cardBg, alignItems: 'center', justifyContent: 'center',
  },
  title: {
    fontSize: 18, fontWeight: '800', color: COLORS.text, letterSpacing: -0.3,
  },
  statsBar: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'center',
    gap:              20,
    marginHorizontal: 20,
    marginBottom:     12,
    backgroundColor:  COLORS.cardBg,
    borderRadius:     14,
    paddingVertical:  10,
    ...SHADOWS.card,
  },
  stat: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  statText: {
    fontSize: 13, fontWeight: '600', color: COLORS.textSecondary,
  },
  statDivider: {
    width: 1, height: 16, backgroundColor: COLORS.dot,
  },
  grid: {
    paddingHorizontal: 12,
    paddingBottom:     32,
    gap:               8,
  },
  levelCell: {
    flex:            1,
    margin:          4,
    aspectRatio:     1,
    backgroundColor: COLORS.cardBg,
    borderRadius:    14,
    alignItems:      'center',
    justifyContent:  'center',
    gap:             2,
    ...SHADOWS.card,
    position:        'relative',
  },
  locked: {
    backgroundColor: '#F1F5F9',
    ...SHADOWS.card,
    shadowOpacity: 0.04,
  },
  completedDot: {
    position:     'absolute',
    top:          6,
    right:        6,
    width:        6,
    height:       6,
    borderRadius: 3,
  },
  levelNum: {
    fontSize:   16,
    fontWeight: '800',
    color:      COLORS.text,
  },
  starsRow: {
    flexDirection: 'row',
    gap:           1,
  },
});
