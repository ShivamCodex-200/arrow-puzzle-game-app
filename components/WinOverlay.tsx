import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
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
import { COLORS, SHADOWS } from '../constants/theme';

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
    position:        'absolute',
    top:             0,
    left:            0,
    width:           size,
    height:          size * 1.5,
    borderRadius:    2,
    backgroundColor: color,
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotate: `${r.value}deg` },
    ],
    opacity: o.value,
  }));

  return <Animated.View style={style} />;
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
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Dim background */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, bgStyle]} />

      {/* Confetti */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {Array.from({ length: 45 }).map((_, i) => <Particle key={i} index={i} />)}
      </View>

      {/* Card */}
      <View style={styles.center}>
        <Animated.View style={[styles.card, SHADOWS.surface, cardStyle]}>
          {/* Trophy */}
          <View style={styles.trophyRing}>
            <MaterialIcons name="emoji-events" size={52} color="#F59E0B" />
          </View>

          <Text style={styles.winTitle}>Level {grid.levelNumber} Clear!</Text>
          <Text style={styles.winSub}>Well played! 🎉</Text>

          {/* Stars */}
          <View style={styles.starsRow}>
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
          <View style={styles.statsPill}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Moves</Text>
              <Text style={styles.statVal}>{moves}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Stars</Text>
              <Text style={[styles.statVal, { color: '#F59E0B' }]}>{stars} / 3</Text>
            </View>
          </View>

          {/* Buttons */}
          <Pressable onPress={handleNext} style={styles.btnNext}>
            <Text style={styles.btnNextText}>Next Level →</Text>
          </Pressable>

          <Pressable onPress={resetLevel} style={styles.btnReplay}>
            <Text style={styles.btnReplayText}>Replay</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
  },
  center: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width:            '100%',
    maxWidth:         360,
    backgroundColor:  COLORS.cardBg,
    borderRadius:     28,
    padding:          28,
    alignItems:       'center',
    gap:              12,
  },
  trophyRing: {
    width:            80,
    height:           80,
    borderRadius:     40,
    backgroundColor:  '#FEF3C7',
    alignItems:       'center',
    justifyContent:   'center',
    borderWidth:      2,
    borderColor:      '#FDE68A',
    marginBottom:     4,
  },
  winTitle: {
    fontSize:      26,
    fontWeight:    '800',
    color:         COLORS.text,
    letterSpacing: -0.5,
  },
  winSub: {
    fontSize:   14,
    color:      COLORS.textSecondary,
    fontWeight: '500',
  },
  starsRow: {
    flexDirection: 'row',
    gap:           8,
    marginVertical: 4,
  },
  statsPill: {
    flexDirection:    'row',
    backgroundColor:  COLORS.bgGradientStart,
    borderRadius:     16,
    paddingVertical:  12,
    paddingHorizontal: 24,
    gap:              24,
    width:            '100%',
    justifyContent:   'center',
    alignItems:       'center',
  },
  stat: {
    alignItems: 'center',
    gap:        2,
  },
  statLabel: {
    fontSize:   11,
    fontWeight: '600',
    color:      COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statVal: {
    fontSize:   20,
    fontWeight: '800',
    color:      COLORS.text,
  },
  statDivider: {
    width:           1,
    height:          32,
    backgroundColor: COLORS.dot,
  },
  btnNext: {
    width:            '100%',
    backgroundColor:  COLORS.accent,
    borderRadius:     16,
    paddingVertical:  15,
    alignItems:       'center',
    marginTop:        4,
  },
  btnNextText: {
    color:      '#FFFFFF',
    fontSize:   16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  btnReplay: {
    width:          '100%',
    borderRadius:   16,
    paddingVertical: 12,
    alignItems:     'center',
    borderWidth:    1.5,
    borderColor:    COLORS.dot,
  },
  btnReplayText: {
    color:      COLORS.textSecondary,
    fontSize:   14,
    fontWeight: '700',
  },
});
