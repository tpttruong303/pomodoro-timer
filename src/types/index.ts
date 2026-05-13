export type Phase = 'work' | 'shortBreak' | 'longBreak';

export interface PomodoroSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface TimeValue {
  minutes: number;
  seconds: number;
}

export interface PomodoroState {
  timeRemaining: number;
  phase: Phase;
  isRunning: boolean;
  completedSessions: number;
}

export interface Session {
  id: string;
  date: string;
  phase: Phase;
  durationSeconds: number;
  completed: boolean;
}