import { useAudioPlayer } from 'expo-audio';
import { useSettingsStore } from '../store/useSettingsStore';

/**
 * Hook for playing game sound effects.
 * Checks the user's sound preference before playing anything.
 */
export function useSound() {
  const { sounds } = useSettingsStore();

  const tapPlayer = useAudioPlayer(require('../assets/arrow_click_sound_effect.wav'));

  const playTap = async () => {
    if (!sounds) return;
    try {
      tapPlayer.seekTo(0);
      tapPlayer.play();
    } catch (e) {
      // Safe fallback if audio is not fully loaded or seek fails
      try {
        tapPlayer.play();
      } catch (_) {}
    }
  };

  const playWin = async () => {
    if (!sounds) return;
    // Optional placeholder
  };

  const playHint = async () => {
    if (!sounds) return;
    // Optional placeholder
  };

  return { playTap, playWin, playHint };
}
