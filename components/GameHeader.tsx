import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useGameStore } from '../store/useGameStore';
import { COLORS } from '../constants/theme';
import { getDifficulty } from '../constants/config';

const DIFF_COLOR: Record<string, string> = {
  Easy:   '#22C55E', // Green
  Normal: '#F59E0B', // Orange
  Hard:   '#8B5CF6', // Purple
  Expert: '#EC4899', // Pink
  Master: '#EF4444', // Red
};

export const GameHeader: React.FC = () => {
  const router = useRouter();
  const { grid, moves, resetLevel, undoMove, history, lives } = useGameStore();

  if (!grid) return null;

  const level      = grid.levelNumber;
  const diff       = grid.difficulty || getDifficulty(level);
  const diffColor  = DIFF_COLOR[diff] || '#64748B';
  const canUndo    = history.length > 0;

  // Count remaining active arrows
  const remainingCount = grid.arrows.filter((a) => !a.isRemoved).length;
  
  // Pulse animation on count change
  const remainingScale = useSharedValue(1);

  useEffect(() => {
    remainingScale.value = withSequence(
      withTiming(1.22, { duration: 80 }),
      withSpring(1, { damping: 9, stiffness: 120 })
    );
  }, [remainingCount]);

  const animatedPillStyle = useAnimatedStyle(() => ({
    transform: [{ scale: remainingScale.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Top row: back button / level title + difficulty / settings */}
      <View style={styles.topRow}>
        <Pressable
          onPress={() => router.replace('/(game)/home')}
          style={styles.iconBtn}
          hitSlop={8}
        >
          <MaterialIcons name="arrow-back" size={22} color={COLORS.text} />
        </Pressable>

        <View style={styles.titleGroup}>
          <Text style={styles.levelText}>Level {level}</Text>
          <View style={[styles.diffBadge, { backgroundColor: diffColor + '22' }]}>
            <Text style={[styles.diffText, { color: diffColor }]}>{diff}</Text>
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/(game)/settings')}
          style={styles.iconBtn}
          hitSlop={8}
        >
          <MaterialIcons name="settings" size={22} color={COLORS.text} />
        </Pressable>
      </View>

      {/* Second row (sub-header): Remaining Count (top-left aligned) | Hearts centered */}
      <View style={styles.secondRow}>
        {/* Remaining arrows pill */}
        <Animated.View style={[styles.remainingPill, animatedPillStyle]}>
          <MaterialIcons name="call-made" size={14} color={COLORS.text} style={styles.remainingIcon} />
          <Text style={styles.remainingText}>{remainingCount}</Text>
        </Animated.View>

        {/* Hearts row (chances remaining) */}
        <View style={styles.heartsRow}>
          {Array.from({ length: 3 }).map((_, idx) => (
            <MaterialIcons
              key={idx}
              name={idx < lives ? "favorite" : "favorite-border"}
              size={18}
              color={idx < lives ? "#EF4444" : "#D1D5DB"}
              style={styles.heartIcon}
            />
          ))}
        </View>

        {/* Balance spacer matching the width of the remaining badge */}
        <View style={styles.spacerPill} />
      </View>

      {/* Bottom row: moves count | Undo + Reset actions */}
      <View style={styles.bottomRow}>
        <View style={styles.movesGroup}>
          <MaterialIcons name="swap-vert" size={14} color={COLORS.textSecondary} />
          <Text style={styles.movesText}>Moves: {moves}</Text>
        </View>

        <View style={styles.actionGroup}>
          <Pressable
            onPress={undoMove}
            disabled={!canUndo}
            style={[styles.actionBtn, !canUndo && styles.disabled]}
            hitSlop={8}
          >
            <MaterialIcons name="undo" size={15} color={canUndo ? COLORS.accent : COLORS.textSecondary} />
            <Text style={[styles.actionText, { color: canUndo ? COLORS.accent : COLORS.textSecondary }]}>
              Undo
            </Text>
          </Pressable>

          <View style={styles.divider} />

          <Pressable onPress={resetLevel} style={styles.actionBtn} hitSlop={8}>
            <MaterialIcons name="refresh" size={15} color={COLORS.accent} />
            <Text style={[styles.actionText, { color: COLORS.accent }]}>Reset</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop:        8,
    paddingBottom:     6,
    gap:               8,
  },
  topRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width:          40,
    height:         40,
    alignItems:     'center',
    justifyContent: 'center',
    borderRadius:   20,
    backgroundColor: COLORS.cardBg,
  },
  titleGroup: {
    alignItems: 'center',
    gap:        2,
  },
  levelText: {
    fontSize:   18,
    fontWeight: '800',
    color:      COLORS.text,
    letterSpacing: -0.3,
  },
  diffBadge: {
    paddingHorizontal: 10,
    paddingVertical:   2,
    borderRadius:      20,
  },
  diffText: {
    fontSize:   11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  secondRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop:      2,
  },
  remainingPill: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius:    14,
    borderWidth:     1,
    borderColor:     '#E2E8F0',
    gap:             3,
    minWidth:        52,
    justifyContent:  'center',
  },
  remainingIcon: {
  },
  remainingText: {
    fontSize:   13,
    fontWeight: '800',
    color:      COLORS.text,
  },
  heartsRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },
  heartIcon: {
    marginHorizontal: 1,
    transform: [{ scale: 1.05 }],
  },
  spacerPill: {
    width: 52, // balances remainingPill width to keep hearts centered
  },
  bottomRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop:      2,
  },
  movesGroup: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
  },
  movesText: {
    fontSize:   13,
    fontWeight: '600',
    color:      COLORS.textSecondary,
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
  },
  actionText: {
    fontSize:   13,
    fontWeight: '700',
  },
  divider: {
    width:           1,
    height:          14,
    backgroundColor: COLORS.dot,
  },
  disabled: {
    opacity: 0.35,
  },
});
