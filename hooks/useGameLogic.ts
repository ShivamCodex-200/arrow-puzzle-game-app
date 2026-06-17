import { useGameStore } from '../store/useGameStore';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '../store/useSettingsStore';

/**
 * Thin hook that combines store actions with haptic side-effects.
 * Use this in components that need to trigger game actions.
 */
export function useGameLogic() {
  const { tapSegment, resetLevel, useHint } = useGameStore();
  const { haptics } = useSettingsStore();

  const handleTap = (segmentId: string): boolean => {
    const escaped = tapSegment(segmentId);
    if (escaped) {
      if (haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } else {
      if (haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }
    return escaped;
  };

  const handleReset = () => {
    if (haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    resetLevel();
  };

  const handleHint = () => {
    if (haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    useHint();
  };

  return { handleTap, handleReset, handleHint };
}
