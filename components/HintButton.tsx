import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import { useGameStore } from '../store/useGameStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { COLORS, SHADOWS } from '../constants/theme';

export const HintButton: React.FC = () => {
  const { hints, useHint, isWon, isDeadlocked, grid, undoMove, history } = useGameStore();
  const { haptics } = useSettingsStore();

  const handleHint = () => {
    if (hints <= 0 || isWon || !grid) return;
    if (haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    useHint();
  };

  const handleEraser = () => {
    if (history.length === 0) return;
    if (haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    undoMove();
  };

  const hintDisabled   = hints <= 0 || isWon;
  const eraserDisabled = history.length === 0 || isWon;

  return (
    <View style={styles.barWrap}>
      <View style={[styles.pill, SHADOWS.surface]}>
        {/* Hint / Lightbulb */}
        <Pressable
          onPress={handleHint}
          disabled={hintDisabled}
          style={[styles.btn, hintDisabled && styles.btnDisabled]}
          hitSlop={8}
        >
          <View style={styles.btnInner}>
            <MaterialIcons
              name="lightbulb"
              size={28}
              color={hintDisabled ? COLORS.textSecondary : COLORS.warning}
            />
            {hints > 0 && (
              <View style={[styles.badge, { backgroundColor: COLORS.warning }]}>
                <Text style={styles.badgeText}>{hints}</Text>
              </View>
            )}
          </View>
        </Pressable>

        <View style={styles.pillDivider} />

        {/* Eraser / Undo */}
        <Pressable
          onPress={handleEraser}
          disabled={eraserDisabled}
          style={[styles.btn, eraserDisabled && styles.btnDisabled]}
          hitSlop={8}
        >
          <View style={styles.btnInner}>
            <MaterialIcons
              name="backspace"
              size={26}
              color={eraserDisabled ? COLORS.textSecondary : COLORS.text}
            />
          </View>
        </Pressable>
      </View>

      {isDeadlocked && (
        <View style={styles.deadlockBanner}>
          <MaterialIcons name="block" size={14} color={COLORS.danger} />
          <Text style={styles.deadlockText}>No moves left! Tap Undo or Reset.</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  barWrap: {
    alignItems:    'center',
    paddingBottom: 24,
    gap:           8,
  },
  pill: {
    flexDirection:  'row',
    alignItems:     'center',
    backgroundColor: COLORS.bottomBar,
    borderRadius:   40,
    paddingHorizontal: 20,
    paddingVertical:   10,
    gap:            24,
  },
  btn: {
    alignItems:     'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.35,
  },
  btnInner: {
    position: 'relative',
  },
  badge: {
    position:       'absolute',
    top:            -6,
    right:          -8,
    minWidth:       18,
    height:         18,
    borderRadius:   9,
    alignItems:     'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth:    1.5,
    borderColor:    '#FFFFFF',
  },
  badgeText: {
    color:      '#FFFFFF',
    fontSize:   10,
    fontWeight: '800',
  },
  pillDivider: {
    width:           1,
    height:          28,
    backgroundColor: '#E2E8F0',
  },
  deadlockBanner: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              6,
    backgroundColor:  COLORS.danger + '15',
    paddingHorizontal: 14,
    paddingVertical:  6,
    borderRadius:     20,
  },
  deadlockText: {
    color:      COLORS.danger,
    fontSize:   12,
    fontWeight: '600',
  },
});
