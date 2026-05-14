import { useState, useEffect, useCallback } from 'react';
import { Session } from '../types';
import { loadHistory } from '../utils/storage';

export interface DayStat {
  day: string;        // e.g. "Mon"
  date: string;       // e.g. "May 12"
  sessions: number;
  minutes: number;
  isToday: boolean;
}

export interface Stats {
  week: DayStat[];
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  bestStreak: number;
  averageSessionsPerDay: number;
}

function getStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function calcStreak(sessions: Session[]): { current: number; best: number } {
  if (sessions.length === 0) return { current: 0, best: 0 };

  // Get unique days with at least one work session
  const days = [...new Set(
    sessions
      .filter(s => s.phase === 'work')
      .map(s => getStartOfDay(new Date(s.date)).getTime())
  )].sort((a, b) => b - a);   // newest first

  if (days.length === 0) return { current: 0, best: 0 };

  const today = getStartOfDay(new Date()).getTime();
  const yesterday = today - 86400000;

  // Current streak — must include today or yesterday to be active
  let current = 0;
  if (days[0] === today || days[0] === yesterday) {
    current = 1;
    for (let i = 1; i < days.length; i++) {
      if (days[i - 1] - days[i] === 86400000) {
        current++;
      } else {
        break;
      }
    }
  }

  // Best streak
  let best = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    if (days[i - 1] - days[i] === 86400000) {
      run++;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }

  return { current, best };
}

export function useStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const compute = useCallback(async () => {
    setLoading(true);
    const sessions = await loadHistory();
    const workSessions = sessions.filter(s => s.phase === 'work');

    // Build last 7 days
    const week: DayStat[] = [];
    const today = getStartOfDay(new Date());

    for (let i = 6; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const daySessions = workSessions.filter(s => {
        const d = new Date(s.date);
        return d >= day && d <= dayEnd;
      });

      week.push({
        day: day.toLocaleDateString('en', { weekday: 'short' }),
        date: day.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        sessions: daySessions.length,
        minutes: Math.floor(daySessions.reduce((sum, s) => sum + s.durationSeconds, 0) / 60),
        isToday: i === 0,
      });
    }

    const { current, best } = calcStreak(sessions);
    const daysWithSessions = week.filter(d => d.sessions > 0).length;

    setStats({
      week,
      totalSessions: workSessions.length,
      totalMinutes: Math.floor(workSessions.reduce((sum, s) => sum + s.durationSeconds, 0) / 60),
      currentStreak: current,
      bestStreak: best,
      averageSessionsPerDay: daysWithSessions > 0
        ? Math.round((workSessions.length / daysWithSessions) * 10) / 10
        : 0,
    });
    setLoading(false);
  }, []);

  useEffect(() => { compute(); }, [compute]);

  return { stats, loading, refresh: compute };
}