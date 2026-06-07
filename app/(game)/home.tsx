import React from 'react';
import {
  View, Text, Pressable, StyleSheet, Dimensions, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProgressStore } from '../../store/useProgressStore';
import { COLORS, SHADOWS } from '../../constants/theme';

const { width: W } = Dimensions.get('window');

import Svg, { Path } from 'react-native-svg';
import type { Direction } from '../../engine/types';

const MINI_ARROW_PATHS: Record<Direction, string> = {
  up:    'M11 18 L11 4 M5 10 L11 4 L17 10',
  down:  'M11 4 L11 18 M5 12 L11 18 L17 12',
  left:  'M18 11 L4 11 M10 5 L4 11 L10 17',
  right: 'M4 11 L18 11 M12 5 L18 11 L12 17',
};

// Mini arrow preview for the home logo
const MiniArrow = ({ dir, color }: { dir: Direction; color: string }) => {
  return (
    <View style={[miniStyles.cell, { borderColor: color + '30' }]}>
      <Svg width={22} height={22} viewBox="0 0 22 22">
        <Path
          d={MINI_ARROW_PATHS[dir]}
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
};

const miniStyles = StyleSheet.create({
  cell: {
    width: 52, height: 52, borderRadius: 12, borderWidth: 1.5,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#1A2340', shadowOpacity: 0.08, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
});

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { unlockedLevel, completedLevels } = useProgressStore();

  const totalCompleted = Object.keys(completedLevels).length;

  return (
    <LinearGradient
      colors={[COLORS.bgGradientStart, COLORS.bgGradientEnd]}
      style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
    >
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.tagline}>Tap • Escape • Clear</Text>
        <Text style={styles.title}>Arrow Puzzle</Text>
      </View>

      {/* Logo grid (2x2 arrow preview) */}
      <View style={styles.logoSection}>
        <View style={styles.logoGrid}>
          <View style={styles.logoRow}>
            <MiniArrow dir="right" color={COLORS.arrowEscapable} />
            <MiniArrow dir="up"    color={COLORS.arrowNormal} />
          </View>
          <View style={styles.logoRow}>
            <MiniArrow dir="down"  color={COLORS.arrowNormal} />
            <MiniArrow dir="left"  color={COLORS.arrowEscapable} />
          </View>
        </View>

        {/* How to play blurb */}
        <View style={styles.howToCard}>
          <MaterialIcons name="info-outline" size={16} color={COLORS.accent} />
          <Text style={styles.howToText}>
            Tap an arrow to escape it in its direction. Clear the path first!
          </Text>
        </View>
      </View>

      {/* CTA Buttons */}
      <View style={styles.btnGroup}>
        {/* Play */}
        <Pressable
          onPress={() =>
            router.push({ pathname: '/(game)/play', params: { level: unlockedLevel.toString() } })
          }
          style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.88 }]}
        >
          <MaterialIcons name="play-arrow" size={22} color="#FFFFFF" />
          <Text style={styles.btnPrimaryText}>
            {totalCompleted === 0 ? 'Start Playing' : `Continue  –  Level ${unlockedLevel}`}
          </Text>
        </Pressable>

        {/* Levels */}
        <Pressable
          onPress={() => router.push('/(game)/levels')}
          style={({ pressed }) => [styles.btnSecondary, pressed && { opacity: 0.8 }]}
        >
          <MaterialIcons name="grid-view" size={18} color={COLORS.text} />
          <Text style={styles.btnSecondaryText}>All Levels</Text>
        </Pressable>

        {/* Settings */}
        <Pressable
          onPress={() => router.push('/(game)/settings')}
          style={({ pressed }) => [styles.btnSecondary, pressed && { opacity: 0.8 }]}
        >
          <MaterialIcons name="settings" size={18} color={COLORS.text} />
          <Text style={styles.btnSecondaryText}>Settings</Text>
        </Pressable>
      </View>

      {/* Stats footer */}
      {totalCompleted > 0 && (
        <View style={styles.statsRow}>
          <MaterialIcons name="check-circle" size={14} color={COLORS.success} />
          <Text style={styles.statsText}>{totalCompleted} levels cleared</Text>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent:    'space-between',
  },
  header: {
    alignItems: 'center',
    gap:        6,
  },
  tagline: {
    fontSize:      11,
    fontWeight:    '700',
    color:         COLORS.textSecondary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize:      36,
    fontWeight:    '900',
    color:         COLORS.text,
    letterSpacing: -0.8,
  },
  logoSection: {
    alignItems: 'center',
    gap:        20,
  },
  logoGrid: {
    gap: 10,
  },
  logoRow: {
    flexDirection: 'row',
    gap:           10,
  },
  howToCard: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              8,
    backgroundColor:  COLORS.cardBgEscapable,
    borderRadius:     14,
    paddingHorizontal: 16,
    paddingVertical:  10,
    maxWidth:         W - 60,
    borderWidth:      1,
    borderColor:      COLORS.borderEscapable + '40',
  },
  howToText: {
    flex:       1,
    fontSize:   13,
    fontWeight: '500',
    color:      COLORS.text,
    lineHeight: 18,
  },
  btnGroup: {
    gap: 10,
  },
  btnPrimary: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             8,
    backgroundColor: COLORS.accent,
    borderRadius:    18,
    paddingVertical: 17,
    ...SHADOWS.card,
  },
  btnPrimaryText: {
    color:      '#FFFFFF',
    fontSize:   16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  btnSecondary: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             8,
    backgroundColor: COLORS.cardBg,
    borderRadius:    16,
    paddingVertical: 14,
    borderWidth:     1,
    borderColor:     '#E2E8F0',
  },
  btnSecondaryText: {
    color:      COLORS.text,
    fontSize:   15,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            6,
  },
  statsText: {
    fontSize:   13,
    color:      COLORS.textSecondary,
    fontWeight: '500',
  },
});
