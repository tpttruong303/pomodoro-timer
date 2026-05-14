import { useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useHistory } from '../src/hooks/useHistory';
import { Session, Phase } from '../src/types';

const PHASE_COLORS: Record<Phase, string> = {
  work:       '#e94560',
  shortBreak: '#2ecc71',
  longBreak:  '#1abc9c',
};

const PHASE_LABELS: Record<Phase, string> = {
  work:       'Focus',
  shortBreak: 'Short break',
  longBreak:  'Long break',
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return `Today ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
    ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function SessionCard({ session }: { session: Session }) {
  const color = PHASE_COLORS[session.phase];
  return (
    <View style={styles.card}>
      <View style={[styles.cardAccent, { backgroundColor: color }]} />
      <View style={styles.cardContent}>
        <Text style={[styles.cardPhase, { color }]}>{PHASE_LABELS[session.phase]}</Text>
        <Text style={styles.cardDate}>{formatDate(session.date)}</Text>
      </View>
      <Text style={styles.cardDuration}>{formatDuration(session.durationSeconds)}</Text>
    </View>
  );
}

function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function HistoryScreen() {
  const { sessions, loading, refresh, clear, todayCount, todayMinutes, totalCount } = useHistory();

  // Refresh every time the tab comes into focus
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const handleClear = () => {
    Alert.alert(
      'Clear history',
      'This will permanently delete all session history. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clear },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#e94560" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>

      {/* Summary stats */}
      <View style={styles.statsRow}>
        <StatBox value={String(todayCount)}   label="Today" />
        <StatBox value={`${todayMinutes}m`}   label="Focus time" />
        <StatBox value={String(totalCount)}   label="All time" />
      </View>

      {/* Session list */}
      <FlatList
        data={sessions}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <SessionCard session={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#e94560" />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No sessions yet</Text>
            <Text style={styles.emptySubtext}>Complete a focus session to see it here</Text>
          </View>
        }
        ListHeaderComponent={
          sessions.length > 0
            ? (
              <View style={styles.listHeader}>
                <Text style={styles.listHeaderText}>Recent sessions</Text>
                <TouchableOpacity onPress={handleClear}>
                  <Text style={styles.clearBtn}>Clear all</Text>
                </TouchableOpacity>
              </View>
            )
            : null
        }
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#1a1a2e' },
  centered:        { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a2e' },
  statsRow:        { flexDirection: 'row', margin: 16, gap: 12 },
  statBox:         { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, alignItems: 'center', gap: 4 },
  statValue:       { fontSize: 28, fontWeight: '300', color: '#fff', fontVariant: ['tabular-nums'] },
  statLabel:       { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  list:            { paddingHorizontal: 16, paddingBottom: 32 },
  listHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  listHeaderText:  { fontSize: 13, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 },
  clearBtn:        { fontSize: 13, color: '#e94560' },
  card:            { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, marginBottom: 8, overflow: 'hidden' },
  cardAccent:      { width: 4, alignSelf: 'stretch' },
  cardContent:     { flex: 1, padding: 14, gap: 4 },
  cardPhase:       { fontSize: 15, fontWeight: '500' },
  cardDate:        { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  cardDuration:    { fontSize: 15, color: 'rgba(255,255,255,0.6)', paddingRight: 14, fontVariant: ['tabular-nums'] },
  empty:           { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyText:       { fontSize: 18, color: 'rgba(255,255,255,0.4)' },
  emptySubtext:    { fontSize: 14, color: 'rgba(255,255,255,0.2)' },
});