import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useGameStore } from '../store/useGameStore';
import { COLORS, SHADOWS } from '../constants/theme';
import { useRouter } from 'expo-router';

export const GameOverOverlay: React.FC = () => {
  const router = useRouter();
  const { grid, isGameOver, resetLevel } = useGameStore();

  const scale  = useSharedValue(0.6);
  const opCard = useSharedValue(0);
  const opBg   = useSharedValue(0);

  useEffect(() => {
    if (isGameOver) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      opBg.value   = withTiming(1, { duration: 300 });
      scale.value  = withDelay(100, withSpring(1, { damping: 14, stiffness: 130 }));
      opCard.value = withDelay(100, withTiming(1, { duration: 300 }));
    } else {
      scale.value  = 0.6;
      opCard.value = 0;
      opBg.value   = 0;
    }
  }, [isGameOver]);

  const bgStyle   = useAnimatedStyle(() => ({ opacity: opBg.value }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity:   opCard.value,
    transform: [{ scale: scale.value }],
  }));

  if (!isGameOver || !grid) return null;

  const handleRetry = () => {
    resetLevel();
  };

  const handleHome = () => {
    router.replace('/(game)/home');
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Dim background */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, bgStyle]} />

      {/* Card */}
      <View style={styles.center}>
        <Animated.View style={[styles.card, SHADOWS.surface, cardStyle]}>
          {/* Failed Icon */}
          <View style={styles.heartRing}>
            <MaterialIcons name="heart-broken" size={52} color="#EF4444" />
          </View>

          <Text style={styles.failTitle}>Level Failed!</Text>
          <Text style={styles.failSub}>You ran out of lives. Keep trying! 💪</Text>

          {/* Buttons */}
          <Pressable onPress={handleRetry} style={styles.btnRetry}>
            <Text style={styles.btnRetryText}>Retry Level 🔄</Text>
          </Pressable>

          <Pressable onPress={handleHome} style={styles.btnHome}>
            <Text style={styles.btnHomeText}>Back to Home</Text>
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
  heartRing: {
    width:            80,
    height:           80,
    borderRadius:     40,
    backgroundColor:  '#FEE2E2',
    alignItems:       'center',
    justifyContent:   'center',
    borderWidth:      2,
    borderColor:      '#FCA5A5',
    marginBottom:     4,
  },
  failTitle: {
    fontSize:      26,
    fontWeight:    '800',
    color:         COLORS.text,
    letterSpacing: -0.5,
  },
  failSub: {
    fontSize:   14,
    color:      COLORS.textSecondary,
    fontWeight: '500',
    textAlign:  'center',
  },
  btnRetry: {
    width:            '100%',
    backgroundColor:  COLORS.accent,
    borderRadius:     16,
    paddingVertical:  15,
    alignItems:       'center',
    marginTop:        4,
  },
  btnRetryText: {
    color:      '#FFFFFF',
    fontSize:   16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  btnHome: {
    width:          '100%',
    borderRadius:   16,
    paddingVertical: 12,
    alignItems:     'center',
    borderWidth:    1.5,
    borderColor:    COLORS.dot,
  },
  btnHomeText: {
    color:      COLORS.textSecondary,
    fontSize:   14,
    fontWeight: '700',
  },
});
