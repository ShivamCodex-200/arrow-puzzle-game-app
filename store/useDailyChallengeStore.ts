import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DailyChallengeStore {
  completedDates: string[]; // YYYY-MM-DD format
  coins: number;
  streak: number;
  claimedRewards: Record<string, boolean>; // date -> boolean
  lastPlayedDate: string | null;

  completeChallenge: (
    dateStr: string,
    difficulty: "easy" | "medium" | "hard" | "expert"
  ) => { coinsEarned: number; newStreak: number };
  
  addCoins: (amount: number) => void;
  recalculateStreak: (todayStr: string) => number;
  resetDailyStore: () => void;
}

export const useDailyChallengeStore = create<DailyChallengeStore>()(
  persist(
    (set, get) => ({
      completedDates: [],
      coins: 0,
      streak: 0,
      claimedRewards: {},
      lastPlayedDate: null,

      completeChallenge: (dateStr, difficulty) => {
        const { completedDates, coins, claimedRewards } = get();

        // 1. Check if already completed
        if (completedDates.includes(dateStr)) {
          return { coinsEarned: 0, newStreak: get().streak };
        }

        // 2. Determine reward coins
        let rewardCoins = 20;
        if (difficulty === "medium") rewardCoins = 35;
        else if (difficulty === "hard") rewardCoins = 50;
        else if (difficulty === "expert") rewardCoins = 100;

        const nextCompletedDates = [...completedDates, dateStr];

        // 3. Compute dynamic streak
        const newStreak = get().recalculateStreak(dateStr);

        set({
          completedDates: nextCompletedDates,
          coins: coins + rewardCoins,
          streak: newStreak,
          lastPlayedDate: dateStr,
          claimedRewards: {
            ...claimedRewards,
            [dateStr]: true,
          },
        });

        return { coinsEarned: rewardCoins, newStreak };
      },

      addCoins: (amount) => {
        set((state) => ({ coins: state.coins + amount }));
      },

      recalculateStreak: (todayStr) => {
        const { completedDates } = get();
        const completedSet = new Set(completedDates);
        completedSet.add(todayStr); // Include today as we are completing it now

        let currentStreak = 0;
        let checkDate = new Date(todayStr);

        // Walk backwards day-by-day and check if completed
        while (true) {
          const checkStr = checkDate.toISOString().split('T')[0];
          if (completedSet.has(checkStr)) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
        return currentStreak;
      },

      resetDailyStore: () => {
        set({
          completedDates: [],
          coins: 0,
          streak: 0,
          claimedRewards: {},
          lastPlayedDate: null,
        });
      },
    }),
    {
      name: 'arrow-puzzle-daily-challenge-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
