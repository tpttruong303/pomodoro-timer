import { useState, useEffect, useCallback } from 'react';
import { Session } from '../types';
import { loadHistory, clearHistory } from '../utils/storage';

interface UseHistoryReturn {
  sessions: Session[];
  loading: boolean;
  refresh: () => Promise<void>;
  clear: () => Promise<void>;
  todayCount: number;
  todayMinutes: number;
  totalCount: number;
}

export function useHistory(): UseHistoryReturn {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await loadHistory();
    setSessions(data);
    setLoading(false);
  }, []);

  const clear = useCallback(async () => {
    await clearHistory();
    setSessions([]);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Today's stats
  const today = new Date().toDateString();
  const todaySessions = sessions.filter(s =>
    new Date(s.date).toDateString() === today && s.phase === 'work'
  );
  const todayCount = todaySessions.length;
  const todayMinutes = Math.floor(
    todaySessions.reduce((sum, s) => sum + s.durationSeconds, 0) / 60
  );
  const totalCount = sessions.filter(s => s.phase === 'work').length;

  return { sessions, loading, refresh, clear, todayCount, todayMinutes, totalCount };
}