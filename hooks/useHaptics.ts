import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '../store/useSettingsStore';

/**
 * Returns haptic trigger functions that automatically respect the
 * user's haptics preference from the settings store.
 */
export function useHaptics() {
  const { haptics } = useSettingsStore();

  const light = () => {
    if (!haptics) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const medium = () => {
    if (!haptics) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  };

  const heavy = () => {
    if (!haptics) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  };

  const success = () => {
    if (!haptics) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  const warning = () => {
    if (!haptics) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  };

  return { light, medium, heavy, success, warning };
}
