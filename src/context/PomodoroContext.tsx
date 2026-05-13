import { createContext, useContext, useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Phase, PomodoroSettings, PomodoroState } from '../types';
import { loadSettings, saveSettings } from '../utils/storage';
import {
  scheduleTimerNotification,
  cancelTimerNotification,
  requestNotificationPermission,
} from '../utils/notifications';

const DEFAULT_SETTINGS: PomodoroSettings = {
  workDuration: 1500,
  shortBreakDuration: 300,
  longBreakDuration: 900,
  sessionsBeforeLongBreak: 4,
  soundEnabled: true,
  vibrationEnabled: true,
};

interface PomodoroContextValue extends PomodoroState {
  settings: PomodoroSettings;
  progress: number;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
  updateSettings: (s: PomodoroSettings) => void;
}

const PomodoroContext = createContext<PomodoroContextValue | null>(null);

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_SETTINGS);
  const [phase, setPhase] = useState<Phase>('work');
  const [timeRemaining, setTimeRemaining] = useState<number>(DEFAULT_SETTINGS.workDuration);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completedSessions, setCompletedSessions] = useState<number>(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const timeRemainingRef = useRef<number>(timeRemaining);
  const phaseRef = useRef<Phase>(phase);
  const settingsRef = useRef<PomodoroSettings>(settings);

  // Keep refs in sync
  useEffect(() => { timeRemainingRef.current = timeRemaining; }, [timeRemaining]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  // Request permission on startup
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Load saved settings on startup
  useEffect(() => {
    loadSettings().then(saved => {
      if (saved) {
        setSettings(saved);
        setTimeRemaining(saved.workDuration);
      }
    });
  }, []);

  // Background drift fix
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active' && startedAtRef.current !== null) {
        const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
        const corrected = Math.max(0, timeRemainingRef.current - elapsed);
        setTimeRemaining(corrected);
        startedAtRef.current = Date.now();
      }
    });
    return () => subscription.remove();
  }, []);

  const getDuration = useCallback((p: Phase, s: PomodoroSettings): number => {
    if (p === 'work') return s.workDuration;
    if (p === 'shortBreak') return s.shortBreakDuration;
    return s.longBreakDuration;
  }, []);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const advancePhase = useCallback((
    currentPhase: Phase,
    currentCompleted: number,
    currentSettings: PomodoroSettings
  ) => {
    stopInterval();
    setIsRunning(false);

    let nextPhase: Phase;
    let nextCompleted = currentCompleted;

    if (currentPhase === 'work') {
      nextCompleted = currentCompleted + 1;
      nextPhase = nextCompleted % currentSettings.sessionsBeforeLongBreak === 0
        ? 'longBreak'
        : 'shortBreak';
    } else {
      nextPhase = 'work';
    }

    setCompletedSessions(nextCompleted);
    setPhase(nextPhase);
    setTimeRemaining(getDuration(nextPhase, currentSettings));
  }, [stopInterval, getDuration]);

  const start = useCallback(() => {
    setIsRunning(true);
    startedAtRef.current = Date.now();

    // Schedule notification for when this session ends
    scheduleTimerNotification(phaseRef.current, timeRemainingRef.current);

    intervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setPhase(p => {
            setCompletedSessions(c => {
              setSettings(s => {
                advancePhase(p, c, s);
                return s;
              });
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
    cancelTimerNotification();   // cancel alert since timer is paused
  }, [stopInterval]);

  const reset = useCallback(() => {
    pause();
    setSettings(s => {
      setTimeRemaining(getDuration(phaseRef.current, s));
      return s;
    });
  }, [pause, getDuration]);

  const skip = useCallback(() => {
    cancelTimerNotification();   // cancel current session's alert
    setPhase(p => {
      setCompletedSessions(c => {
        setSettings(s => {
          advancePhase(p, c, s);
          return s;
        });
        return c;
      });
      return p;
    });
  }, [advancePhase]);

  const updateSettings = useCallback((newSettings: PomodoroSettings) => {
    stopInterval();
    cancelTimerNotification();
    setIsRunning(false);
    setCompletedSessions(0);
    setPhase('work');
    setTimeRemaining(newSettings.workDuration);
    setSettings(newSettings);
    saveSettings(newSettings);
    startedAtRef.current = null;
  }, [stopInterval]);

  const progress = timeRemaining / getDuration(phase, settings);

  return (
    <PomodoroContext.Provider value={{
      timeRemaining, phase, isRunning, completedSessions,
      settings, progress,
      start, pause, reset, skip, updateSettings,
    }}>
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoro(): PomodoroContextValue {
  const ctx = useContext(PomodoroContext);
  if (!ctx) throw new Error('usePomodoro must be used inside PomodoroProvider');
  return ctx;
}