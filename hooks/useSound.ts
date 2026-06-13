import { createAudioPlayer, AudioPlayer } from 'expo-audio';
import { useSettingsStore } from '../store/useSettingsStore';

// Global reference to cache the player instance
let cachedTapPlayer: AudioPlayer | null = null;

// Lazy getter to ensure the player is only created after native modules are initialized
function getTapPlayer(): AudioPlayer {
  if (!cachedTapPlayer) {
    cachedTapPlayer = createAudioPlayer(require('../assets/arrow_click_sound_effect.wav'));
  }
  return cachedTapPlayer;
}

/**
 * Hook for playing game sound effects.
 * Checks the user's sound preference before playing anything.
 */
export function useSound() {
  const { sounds } = useSettingsStore();

  const playTap = async () => {
    if (!sounds) return;
    try {
      const player = getTapPlayer();
      player.seekTo(0);
      player.play();
    } catch (e) {
      // Safe fallback if audio is not fully loaded or seek fails
      try {
        const player = getTapPlayer();
        player.play();
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
