import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LevelRecord {
  stars: number;
  completed: boolean;
}

interface ProgressStore {
  unlockedLevel: number;
  completedLevels: Record<number, LevelRecord>;
  completeLevel: (level: number, stars: number) => void;
  resetProgress: () => void;
}

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      unlockedLevel: 1,
      completedLevels: {} as Record<number, LevelRecord>,

      completeLevel: (level: number, stars: number) => {
        const { completedLevels, unlockedLevel } = get();
        const existing = completedLevels[level];
        const newStars = Math.max(existing?.stars ?? 0, stars);
        set({
          completedLevels: {
            ...completedLevels,
            [level]: { stars: newStars, completed: true },
          },
          unlockedLevel: Math.max(unlockedLevel, level + 1),
        });
      },

      resetProgress: () =>
        set({ unlockedLevel: 1, completedLevels: {} }),
    }),
    {
      name: 'arrow-puzzle-progress-v2',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
