import { useState, useRef, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Phase, PomodoroSettings, PomodoroState } from '../types';
import { loadSettings, saveSettings } from '../utils/storage';

const DEFAULT_SETTINGS: PomodoroSettings = {
  workDuration: 1500,
  shortBreakDuration: 300,
  longBreakDuration: 900,
  sessionsBeforeLongBreak: 4,
  soundEnabled: true,
  vibrationEnabled: true,
};

interface UsePomodoroReturn extends PomodoroState {
  settings: PomodoroSettings;
  progress: number;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
  updateSettings: (s: PomodoroSettings) => void;
}

export function usePomodoro(): UsePomodoroReturn {
  const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_SETTINGS);
  const [phase, setPhase] = useState<Phase>('work');
  const [timeRemaining, setTimeRemaining] = useState<number>(DEFAULT_SETTINGS.workDuration);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completedSessions, setCompletedSessions] = useState<number>(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const timeRemainingRef = useRef<number>(timeRemaining);

  // Load saved settings on startup
  useEffect(() => {
    loadSettings().then(saved => {
      if (saved) {
        setSettings(saved);
        setTimeRemaining(saved.workDuration);
      }
    });
  }, []);

  useEffect(() => {
    timeRemainingRef.current = timeRemaining;
  }, [timeRemaining]);

  const updateSettings = useCallback((newSettings: PomodoroSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    // Reset timer to reflect new durations
    setPhase('work');
    setTimeRemaining(newSettings.workDuration);
    setIsRunning(false);
    setCompletedSessions(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  // Keep ref in sync so AppState handler always sees latest value
  useEffect(() => {
    timeRemainingRef.current = timeRemaining;
  }, [timeRemaining]);

  const getDuration = useCallback((p: Phase): number => {
    if (p === 'work') return settings.workDuration;
    if (p === 'shortBreak') return settings.shortBreakDuration;
    return settings.longBreakDuration;
  }, [settings]);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const advancePhase = useCallback((currentPhase: Phase, currentCompleted: number) => {
    stopInterval();
    setIsRunning(false);

    let nextPhase: Phase;
    let nextCompleted = currentCompleted;

    if (currentPhase === 'work') {
      nextCompleted = currentCompleted + 1;
      nextPhase = nextCompleted % settings.sessionsBeforeLongBreak === 0
        ? 'longBreak'
        : 'shortBreak';
    } else {
      nextPhase = 'work';
    }

    setCompletedSessions(nextCompleted);
    setPhase(nextPhase);
    setTimeRemaining(getDuration(nextPhase));
  }, [settings, getDuration, stopInterval]);

  // Background drift fix
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (state: AppStateStatus) => {
        if (state === 'active' && startedAtRef.current !== null) {
          const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
          const corrected = Math.max(0, timeRemainingRef.current - elapsed);
          setTimeRemaining(corrected);
          startedAtRef.current = Date.now();
        }
      }
    );
    return () => subscription.remove();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopInterval();
  }, [stopInterval]);

  const start = useCallback(() => {
    setIsRunning(true);
    startedAtRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setPhase(p => {
            setCompletedSessions(c => {
              advancePhase(p, c);
              return c;
            });
            return p;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [advancePhase]);

  const pause = useCallback(() => {
    stopInterval();
    setIsRunning(false);
    startedAtRef.current = null;
  }, [stopInterval]);

  const reset = useCallback(() => {
    pause();
    setTimeRemaining(getDuration(phase));
  }, [pause, phase, getDuration]);

  const skip = useCallback(() => {
    setPhase(p => {
      setCompletedSessions(c => {
        advancePhase(p, c);
        return c;
      });
      return p;
    });
  }, [advancePhase]);

  const progress = timeRemaining / getDuration(phase);

  return {
    timeRemaining, phase, isRunning,
    completedSessions, settings, progress,
    start, pause, reset, skip,
    updateSettings,
  };
}