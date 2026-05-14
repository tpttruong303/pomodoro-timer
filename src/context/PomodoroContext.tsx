import { loadSound, playCompleteSound, unloadSound } from '../utils/sound';
import { loadSettings, saveSettings, saveSession } from '../utils/storage';
import { Session } from '../types';
import { createContext, useContext, useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Phase, PomodoroSettings, PomodoroState } from '../types';
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

  // Refs so interval callbacks always see latest values
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const phaseRef = useRef<Phase>('work');
  const settingsRef = useRef<PomodoroSettings>(DEFAULT_SETTINGS);
  const completedSessionsRef = useRef<number>(0);
  const timeRemainingRef = useRef<number>(DEFAULT_SETTINGS.workDuration);

  // Keep all refs in sync with state
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { completedSessionsRef.current = completedSessions; }, [completedSessions]);
  useEffect(() => { timeRemainingRef.current = timeRemaining; }, [timeRemaining]);

  // Request notification permission on startup
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    loadSound();
    return () => { unloadSound(); };
  }, []);

  // Load saved settings on startup
  useEffect(() => {
    loadSettings().then(saved => {
      if (saved) {
        setSettings(saved);
        settingsRef.current = saved;
        setTimeRemaining(saved.workDuration);
        timeRemainingRef.current = saved.workDuration;
      }
    });
  }, []);

  // Background drift fix
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active' && startedAtRef.current !== null && isRunning) {
        const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
        const corrected = Math.max(0, timeRemainingRef.current - elapsed);
        setTimeRemaining(corrected);
        timeRemainingRef.current = corrected;
        startedAtRef.current = Date.now();
      }
    });
    return () => subscription.remove();
  }, [isRunning]);

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

  // Uses refs directly so it always has latest values inside interval
  const advancePhase = useCallback(() => {
    const currentPhase = phaseRef.current;
    const currentCompleted = completedSessionsRef.current;
    const currentSettings = settingsRef.current;

    // Save session and play sound on work completion
    if (currentPhase === 'work') {
      const session: Session = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        phase: currentPhase,
        durationSeconds: currentSettings.workDuration,
        completed: true,
      };
      saveSession(session).catch(() => {});

      // Play sound only if enabled in settings
      if (currentSettings.soundEnabled) {
        playCompleteSound().catch(() => {});
      }
    } else {
      // Also play sound when break ends
      if (currentSettings.soundEnabled) {
        playCompleteSound().catch(() => {});
      }
    }

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

    const nextDuration = getDuration(nextPhase, currentSettings);

    phaseRef.current = nextPhase;
    completedSessionsRef.current = nextCompleted;
    timeRemainingRef.current = nextDuration;
    startedAtRef.current = null;

    setPhase(nextPhase);
    setCompletedSessions(nextCompleted);
    setTimeRemaining(nextDuration);
    setIsRunning(false);
    stopInterval();
  }, [getDuration, stopInterval]);

  const start = useCallback(() => {
    setIsRunning(true);
    startedAtRef.current = Date.now();

    scheduleTimerNotification(phaseRef.current, timeRemainingRef.current);

    intervalRef.current = setInterval(() => {
      const next = timeRemainingRef.current - 1;
      timeRemainingRef.current = next;

      if (next <= 0) {
        setTimeRemaining(0);
        cancelTimerNotification();
        advancePhase();
      } else {
        setTimeRemaining(next);
      }
    }, 1000);
  }, [advancePhase]);

  const pause = useCallback(() => {
    stopInterval();
    setIsRunning(false);
    startedAtRef.current = null;
    cancelTimerNotification();
  }, [stopInterval]);

  const reset = useCallback(() => {
    stopInterval();
    cancelTimerNotification();
    setIsRunning(false);
    startedAtRef.current = null;
    const duration = getDuration(phaseRef.current, settingsRef.current);
    timeRemainingRef.current = duration;
    setTimeRemaining(duration);
  }, [stopInterval, getDuration]);

  const skip = useCallback(() => {
    cancelTimerNotification();
    advancePhase();
    startedAtRef.current = null;
  }, [advancePhase]);

  const updateSettings = useCallback((newSettings: PomodoroSettings) => {
    stopInterval();
    cancelTimerNotification();
    setIsRunning(false);
    setCompletedSessions(0);
    setPhase('work');

    const duration = newSettings.workDuration;
    setTimeRemaining(duration);

    // Update refs immediately
    phaseRef.current = 'work';
    settingsRef.current = newSettings;
    completedSessionsRef.current = 0;
    timeRemainingRef.current = duration;
    startedAtRef.current = null;

    setSettings(newSettings);
    saveSettings(newSettings);
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