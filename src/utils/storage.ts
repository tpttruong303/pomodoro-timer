import AsyncStorage from '@react-native-async-storage/async-storage';
import { PomodoroSettings, Session, TimeValue } from '../types';

const KEYS = {
  settings: 'pomodoro_settings',
  history:  'pomodoro_history',
};

export function toTimeValue(totalSeconds: number): TimeValue {
  return {
    minutes: Math.floor(totalSeconds / 60),
    seconds: totalSeconds % 60,
  };
}

export function toTotalSeconds(time: TimeValue): number {
  return time.minutes * 60 + time.seconds;
}

export async function saveSettings(settings: PomodoroSettings): Promise<void> {
  await AsyncStorage.setItem(KEYS.settings, JSON.stringify(settings));
}

export async function loadSettings(): Promise<PomodoroSettings | null> {
  const raw = await AsyncStorage.getItem(KEYS.settings);
  return raw ? JSON.parse(raw) : null;
}

export async function saveSession(session: Session): Promise<void> {
  const raw = await AsyncStorage.getItem(KEYS.history);
  const history: Session[] = raw ? JSON.parse(raw) : [];
  history.unshift(session);               // newest first
  await AsyncStorage.setItem(KEYS.history, JSON.stringify(history));
}

export async function loadHistory(): Promise<Session[]> {
  const raw = await AsyncStorage.getItem(KEYS.history);
  return raw ? JSON.parse(raw) : [];
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.history);
}