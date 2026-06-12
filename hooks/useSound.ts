import { createAudioPlayer } from 'expo-audio';
import { useSettingsStore } from '../store/useSettingsStore';

// Preload the tap sound effect as a global singleton.
// This ensures the audio file is loaded exactly once on startup and reused across all screens/components.
const tapPlayer = createAudioPlayer(require('../assets/arrow_click_sound_effect.wav'));

/**
 * Hook for playing game sound effects.
 * Checks the user's sound preference before playing anything.
 */
export function useSound() {
  const { sounds } = useSettingsStore();

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
