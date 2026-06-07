import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useGameStore } from '../store/useGameStore';
import { COLORS } from '../constants/theme';
import { getDifficulty } from '../constants/config';

const DIFF_COLOR: Record<string, string> = {
  Easy:   '#22C55E',
  Normal: '#F59E0B',
  Hard:   '#EF4444',
  Expert: '#8B5CF6',
  Master: '#EC4899',
};

export const GameHeader: React.FC = () => {
  const router = useRouter();
  const { grid, moves, resetLevel, undoMove, history } = useGameStore();

  if (!grid) return null;

  const level      = grid.levelNumber;
  const diff       = grid.difficulty || getDifficulty(level);
  const diffColor  = DIFF_COLOR[diff] || '#64748B';
  const canUndo    = history.length > 0;

  return (
    <View style={styles.container}>
      {/* Top row: back / level + badge / settings */}
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

      {/* Bottom row: moves / undo + reset */}
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
    paddingBottom:     4,
    gap:               6,
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
    gap:        4,
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
  bottomRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
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
