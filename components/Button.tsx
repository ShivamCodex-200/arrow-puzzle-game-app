import React from 'react';
import { Pressable, Text, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Button: React.FC<Props> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 10, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
  };

  let bgClass = 'bg-blue-600';
  let textClass = 'text-white';

  if (variant === 'secondary') {
    bgClass = 'bg-slate-800 border border-slate-700';
  } else if (variant === 'danger') {
    bgClass = 'bg-rose-600';
  }

  if (disabled) {
    bgClass = 'bg-slate-850 opacity-50';
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[animatedStyle]}
      className={`w-full py-4 rounded-2xl items-center justify-center flex-row space-x-2 ${bgClass}`}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <Text className={`text-base font-extrabold tracking-wide ${textClass}`}>
          {title}
        </Text>
      )}
    </AnimatedPressable>
  );
};
