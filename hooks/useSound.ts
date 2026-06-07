import { useAudioPlayer } from 'expo-audio';
import { useSettingsStore } from '../store/useSettingsStore';

/**
 * Hook for playing game sound effects.
 * Checks the user's sound preference before playing anything.
 *
 * Usage example:
 *   const { playTap, playWin } = useSound();
 *   onPress={() => { playTap(); doSomething(); }}
 *
 * NOTE: Place your .mp3/.wav files in assets/sounds/
 * and update the require() paths below when you add them.
 */
export function useSound() {
  const { sounds } = useSettingsStore();

  // Uncomment and update these when you add audio assets:
  // const tapPlayer = useAudioPlayer(require('../assets/sounds/tap.mp3'));
  // const winPlayer = useAudioPlayer(require('../assets/sounds/win.mp3'));
  // const hintPlayer = useAudioPlayer(require('../assets/sounds/hint.mp3'));

  const playTap = async () => {
    if (!sounds) return;
    // tapPlayer.seekTo(0);
    // tapPlayer.play();
  };

  const playWin = async () => {
    if (!sounds) return;
    // winPlayer.seekTo(0);
    // winPlayer.play();
  };

  const playHint = async () => {
    if (!sounds) return;
    // hintPlayer.seekTo(0);
    // hintPlayer.play();
  };

  return { playTap, playWin, playHint };
}
