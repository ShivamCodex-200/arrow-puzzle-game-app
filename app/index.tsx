import React, { useEffect } from 'react';
import { View, Text, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

export default function SplashScreen() {
  const router = useRouter();

  // Animation Shared Values
  const splashOpacity = useSharedValue(1);
  const gridOpacity = useSharedValue(0);

  // Arrow Entry Values (Offset from 0)
  const arrowTopY = useSharedValue(-200);
  const arrowTopOpacity = useSharedValue(0);

  const arrowBottomY = useSharedValue(200);
  const arrowBottomOpacity = useSharedValue(0);

  const arrowLeftX = useSharedValue(-200);
  const arrowLeftOpacity = useSharedValue(0);

  const arrowRightX = useSharedValue(200);
  const arrowRightOpacity = useSharedValue(0);

  // Wiggle / Loading Loop Value
  const arrowWiggle = useSharedValue(0);

  // Text Animation Values
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.85);
  const taglineOpacity = useSharedValue(0);

  // Sequence Timeline
  useEffect(() => {
    // Step 1: Fade in grid
    gridOpacity.value = withTiming(1, { duration: 300 });

    // Step 2 & 3: Arrows entering
    const entryConfig = {
      duration: 800,
      easing: Easing.out(Easing.back(1.0)),
    };
    const opacityConfig = { duration: 500 };

    arrowTopY.value = withDelay(300, withTiming(0, entryConfig));
    arrowTopOpacity.value = withDelay(300, withTiming(1, opacityConfig));

    arrowBottomY.value = withDelay(300, withTiming(0, entryConfig));
    arrowBottomOpacity.value = withDelay(300, withTiming(1, opacityConfig));

    arrowLeftX.value = withDelay(300, withTiming(0, entryConfig));
    arrowLeftOpacity.value = withDelay(300, withTiming(1, opacityConfig));

    arrowRightX.value = withDelay(300, withTiming(0, entryConfig));
    arrowRightOpacity.value = withDelay(300, withTiming(1, opacityConfig));

    // Step 4: Organic Loading movement loop (wiggle) starting around 1100ms
    const wiggleTimeout = setTimeout(() => {
      arrowWiggle.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      );
    }, 1100);

    // Step 5: Logo Text Fade & Scale (1600ms)
    logoOpacity.value = withDelay(
      1600,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) })
    );
    logoScale.value = withDelay(
      1600,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.back(1.2)) })
    );

    // Step 6: Tagline Fade (2000ms)
    taglineOpacity.value = withDelay(
      2000,
      withTiming(1, { duration: 250 })
    );

    // Transition smoothly to Home (2600ms - 2900ms)
    const transitionTimeout = setTimeout(() => {
      splashOpacity.value = withTiming(0, { duration: 300 }, (finished) => {
        if (finished) {
          runOnJS(navigateToHome)();
        }
      });
    }, 2600);

    return () => {
      clearTimeout(wiggleTimeout);
      clearTimeout(transitionTimeout);
    };
  }, []);

  const navigateToHome = () => {
    router.replace('/(game)/home');
  };

  // Animated Styles
  const animatedSplashStyle = useAnimatedStyle(() => ({
    opacity: splashOpacity.value,
  }));

  const animatedGridStyle = useAnimatedStyle(() => ({
    opacity: gridOpacity.value,
  }));

  const animatedTopArrowStyle = useAnimatedStyle(() => ({
    opacity: arrowTopOpacity.value,
    transform: [{ translateY: arrowTopY.value + arrowWiggle.value * 4 }],
  }));

  const animatedBottomArrowStyle = useAnimatedStyle(() => ({
    opacity: arrowBottomOpacity.value,
    transform: [{ translateY: arrowBottomY.value - arrowWiggle.value * 4 }],
  }));

  const animatedLeftArrowStyle = useAnimatedStyle(() => ({
    opacity: arrowLeftOpacity.value,
    transform: [{ translateX: arrowLeftX.value + arrowWiggle.value * 4 }],
  }));

  const animatedRightArrowStyle = useAnimatedStyle(() => ({
    opacity: arrowRightOpacity.value,
    transform: [{ translateX: arrowRightX.value - arrowWiggle.value * 4 }],
  }));

  const animatedLogoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const animatedTaglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  // Render 4x4 background grid dots at coordinates (40, 80, 120, 160)
  const dots: { x: number; y: number }[] = [];
  const gridCoords = [40, 80, 120, 160];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      dots.push({ x: gridCoords[c], y: gridCoords[r] });
    }
  }

  return (
    <Animated.View className="flex-1 bg-game-bg items-center justify-center" style={animatedSplashStyle}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEF2F6" />

      <View className="items-center gap-9">
        {/* Animated Puzzle Board Container */}
        <View className="w-[200px] h-[200px] rounded-[28px] bg-white shadow-lg shadow-game-navy/10 elevation-4 overflow-hidden">
          {/* Layer 1: Dot Grid */}
          <Animated.View className="absolute inset-0" style={animatedGridStyle}>
            <Svg width={200} height={200} viewBox="0 0 200 200">
              {dots.map((dot, i) => (
                <Circle
                  key={i}
                  cx={dot.x}
                  cy={dot.y}
                  r={3.5}
                  fill="#C2C7D0"
                  opacity={0.8}
                />
              ))}
            </Svg>
          </Animated.View>

          {/* Layer 2: Top Arrow ↓ (Navy) */}
          <Animated.View className="absolute inset-0" style={animatedTopArrowStyle} pointerEvents="none">
            <Svg width={200} height={200} viewBox="0 0 200 200">
              <Path
                d="M 120 40 L 120 120"
                stroke="#1F355E"
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <Path
                d="M 113 113 L 120 120 L 127 113"
                stroke="#1F355E"
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
          </Animated.View>

          {/* Layer 3: Bottom Arrow ↑ (Navy) */}
          <Animated.View className="absolute inset-0" style={animatedBottomArrowStyle} pointerEvents="none">
            <Svg width={200} height={200} viewBox="0 0 200 200">
              <Path
                d="M 80 160 L 80 80"
                stroke="#1F355E"
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <Path
                d="M 73 87 L 80 80 L 87 87"
                stroke="#1F355E"
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
          </Animated.View>

          {/* Layer 4: Left Arrow → (Accent Green #4CAF50) */}
          <Animated.View className="absolute inset-0" style={animatedLeftArrowStyle} pointerEvents="none">
            <Svg width={200} height={200} viewBox="0 0 200 200">
              <Path
                d="M 40 120 L 120 120"
                stroke="#4CAF50"
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <Path
                d="M 113 113 L 120 120 L 113 127"
                stroke="#4CAF50"
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
          </Animated.View>

          {/* Layer 5: Right Arrow ← (Navy) */}
          <Animated.View className="absolute inset-0" style={animatedRightArrowStyle} pointerEvents="none">
            <Svg width={200} height={200} viewBox="0 0 200 200">
              <Path
                d="M 160 80 L 80 80"
                stroke="#1F355E"
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <Path
                d="M 87 73 L 80 80 L 87 87"
                stroke="#1F355E"
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
          </Animated.View>
        </View>

        {/* Text Logo & Tagline */}
        <View className="items-center gap-1.5">
          <Animated.Text className="text-[28px] font-black text-game-navy tracking-tight" style={animatedLogoStyle}>
            Arrow Puzzle
          </Animated.Text>
          <Animated.Text className="text-[11px] font-bold text-game-secondary tracking-[2.5px] uppercase" style={animatedTaglineStyle}>
            Tap • Escape • Clear
          </Animated.Text>
        </View>
      </View>
    </Animated.View>
  );
}
