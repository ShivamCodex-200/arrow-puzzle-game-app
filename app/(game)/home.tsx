import React, { useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { useProgressStore } from '../../store/useProgressStore';
import { COLORS } from '../../constants/theme';

interface AnimatedButtonProps {
  onPress: () => void;
  style: any;
  children: React.ReactNode;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ScalePressable: React.FC<AnimatedButtonProps> = ({ onPress, style, children }) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withTiming(0.95, { duration: 80 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 80 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { unlockedLevel, completedLevels } = useProgressStore();

  const totalCompleted = Object.keys(completedLevels).length;
  const totalStars = Object.values(completedLevels).reduce((s, r) => s + (r.stars ?? 0), 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Title Section */}
        <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
          <Text style={styles.tagline}>Tap • Escape • Clear</Text>
          <Text style={styles.title}>Arrow Puzzle</Text>
        </Animated.View>

        {/* Visual Gameplay Preview */}
        <Animated.View entering={FadeIn.duration(700).delay(100)} style={styles.previewContainer}>
          <View style={styles.previewBoard}>
            <Svg width={120} height={120} viewBox="0 0 120 120">
              {/* Uncovered background grid dots */}
              <Circle cx={98} cy={14} r={2.8} fill="#C2C7D0" opacity={0.8} />
              <Circle cx={14} cy={42} r={2.8} fill="#C2C7D0" opacity={0.8} />
              <Circle cx={42} cy={42} r={2.8} fill="#C2C7D0" opacity={0.8} />
              <Circle cx={14} cy={70} r={2.8} fill="#C2C7D0" opacity={0.8} />
              <Circle cx={42} cy={70} r={2.8} fill="#C2C7D0" opacity={0.8} />

              {/* Arrow Line 1: L-shape pointing down */}
              <Path
                d="M 14 14 L 70 14 L 70 70"
                stroke={COLORS.arrowNormal}
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <Path
                d="M 66 64 L 70 70 L 74 64"
                stroke={COLORS.arrowNormal}
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />

              {/* Arrow Line 2: Straight pointing right */}
              <Path
                d="M 14 98 L 70 98"
                stroke="#3B82F6"
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <Path
                d="M 64 94 L 70 98 L 64 102"
                stroke="#3B82F6"
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />

              {/* Arrow Line 3: Straight pointing down */}
              <Path
                d="M 98 42 L 98 98"
                stroke={COLORS.arrowNormal}
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <Path
                d="M 94 92 L 98 98 L 102 92"
                stroke={COLORS.arrowNormal}
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
          </View>
        </Animated.View>

        {/* Primary CTA: Continue Playing Card */}
        <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.ctaWrapper}>
          <ScalePressable
            onPress={() =>
              router.push({
                pathname: '/(game)/play',
                params: { level: unlockedLevel.toString() },
              })
            }
            style={styles.ctaCard}
          >
            <View style={styles.ctaIconContainer}>
              <MaterialIcons name="play-arrow" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.ctaTextContainer}>
              <Text style={styles.ctaTitle}>Continue</Text>
              <Text style={styles.ctaSubtitle}>Level {unlockedLevel}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#FFFFFF" opacity={0.8} />
          </ScalePressable>
        </Animated.View>

        {/* Progress Stats Card */}
        <Animated.View entering={FadeInDown.duration(600).delay(350)} style={styles.statsWrapper}>
          <View style={styles.progressCard}>
            <View style={styles.progressItem}>
              <Text style={styles.progressValue}>✓ {totalCompleted}</Text>
              <Text style={styles.progressLabel}>Cleared</Text>
            </View>
            <View style={styles.progressDivider} />
            <View style={styles.progressItem}>
              <Text style={styles.progressValue}>⭐ {totalStars}</Text>
              <Text style={styles.progressLabel}>Stars</Text>
            </View>
            <View style={styles.progressDivider} />
            <View style={styles.progressItem}>
              <Text style={styles.progressValue}>🏅 {totalCompleted}</Text>
              <Text style={styles.progressLabel}>Streak</Text>
            </View>
          </View>
        </Animated.View>

        {/* Menu Cards */}
        <View style={styles.menuWrapper}>
          <Animated.View entering={FadeInDown.duration(600).delay(450)}>
            <ScalePressable
              onPress={() => router.push('/(game)/levels')}
              style={styles.menuCard}
            >
              <View style={styles.menuCardLeft}>
                <Text style={styles.menuIcon}>📚</Text>
                <Text style={styles.menuText}>All Levels</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#94A3B8" />
            </ScalePressable>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(600).delay(550)}>
            <ScalePressable
              onPress={() =>
                router.push({
                  pathname: '/(game)/play',
                  params: { level: '999' },
                })
              }
              style={styles.menuCard}
            >
              <View style={styles.menuCardLeft}>
                <Text style={styles.menuIcon}>🔥</Text>
                <Text style={styles.menuText}>Daily Challenge</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#94A3B8" />
            </ScalePressable>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(600).delay(650)}>
            <ScalePressable
              onPress={() => router.push('/(game)/settings')}
              style={styles.menuCard}
            >
              <View style={styles.menuCardLeft}>
                <Text style={styles.menuIcon}>⚙️</Text>
                <Text style={styles.menuText}>Settings</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#94A3B8" />
            </ScalePressable>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2F6', // Soft gray theme background
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    justifyContent: 'center',
    gap: 20,
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    gap: 4,
  },
  tagline: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#1F355E', // Navy accent color
    letterSpacing: -0.8,
  },
  previewContainer: {
    alignItems: 'center',
  },
  previewBoard: {
    width: 144,
    height: 144,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1F355E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  ctaWrapper: {},
  ctaCard: {
    backgroundColor: '#3B82F6', // Highlight Blue
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  ctaTextContainer: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  ctaSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E0F2FE',
    marginTop: 1,
  },
  statsWrapper: {},
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#1F355E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  progressItem: {
    alignItems: 'center',
    flex: 1,
  },
  progressValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F355E',
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
  progressDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#EEF2F6',
  },
  menuWrapper: {
    gap: 10,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#1F355E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  menuCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIcon: {
    fontSize: 18,
  },
  menuText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F355E',
  },
});
