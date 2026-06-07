import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsStore {
  sounds: boolean;
  haptics: boolean;
  toggleSounds: () => void;
  toggleHaptics: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      sounds: true,
      haptics: true,
      toggleSounds: () => set({ sounds: !get().sounds }),
      toggleHaptics: () => set({ haptics: !get().haptics }),
    }),
    {
      name: 'arrow-puzzle-settings-v2',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
