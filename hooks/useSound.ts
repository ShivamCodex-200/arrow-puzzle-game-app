import { useState, useEffect } from 'react';
import { createAudioPlayer, AudioPlayer } from 'expo-audio';
import { useSettingsStore } from '../store/useSettingsStore';

/**
 * Hook for playing game sound effects.
 * Checks the user's sound preference before playing anything.
 * Uses lazy loading and handles resource cleanup to avoid crashes on mount.
 */
export function useSound() {
  const { sounds } = useSettingsStore();
  const [player, setPlayer] = useState<AudioPlayer | null>(null);

  useEffect(() => {
    if (!sounds) return;
    let activePlayer: AudioPlayer | null = null;
    try {
      activePlayer = createAudioPlayer(require('../assets/arrow_click_sound_effect.wav'));
      setPlayer(activePlayer);
    } catch (err) {
      console.warn("Failed to initialize audio player:", err);
    }

    return () => {
      if (activePlayer) {
        try {
          if (typeof (activePlayer as any).release === 'function') {
            (activePlayer as any).release();
          }
        } catch (_) {}
      }
    };
  }, [sounds]);

  const playTap = async () => {
    if (!sounds || !player) return;
    try {
      player.seekTo(0);
      player.play();
    } catch (e) {
      try {
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
