import { useState, useEffect, useRef, useCallback } from 'react';

interface TimerOptions {
  autoStart?: boolean;
  initialSeconds?: number;
}

/**
 * A stopwatch/countdown timer hook.
 * Useful for time-based challenge modes or showing elapsed time per level.
 */
export function useTimer({ autoStart = false, initialSeconds = 0 }: TimerOptions = {}) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setIsRunning(false);
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  const restart = useCallback(() => {
    setSeconds(initialSeconds);
    setIsRunning(true);
  }, [initialSeconds]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  // Format as MM:SS
  const formatted = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  return { seconds, formatted, isRunning, start, pause, reset, restart };
}
