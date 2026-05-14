import { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useStats } from '../src/hooks/useStats';
import { WeeklyChart } from '../src/components/WeeklyChart';

interface StatCardProps {
  value: string;
  label: string;
  sublabel?: string;
}

function StatCard({ value, label, sublabel }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sublabel && <Text style={styles.statSublabel}>{sublabel}</Text>}
    </View>
  );
}

export default function StatsScreen() {
  const { stats, loading, refresh } = useStats();

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  if (loading || !stats) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#e94560" />
      </View>
    );
  }

  const totalHours = Math.floor(stats.totalMinutes / 60);
  const totalMinsRemainder = stats.totalMinutes % 60;
  const totalTimeLabel = totalHours > 0
    ? `${totalHours}h ${totalMinsRemainder}m`
    : `${stats.totalMinutes}m`;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Weekly chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This week</Text>
          <View style={styles.chartCard}>
            <WeeklyChart data={stats.week} />
          </View>
        </View>

        {/* Streak */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Streaks</Text>
          <View style={styles.row}>
            <StatCard
              value={`${stats.currentStreak}d`}
              label="Current streak"
              sublabel={stats.currentStreak > 0 ? '🔥 Keep going!' : 'Start today'}
            />
            <StatCard
              value={`${stats.bestStreak}d`}
              label="Best streak"
            />
          </View>
        </View>

        {/* Totals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All time</Text>
          <View style={styles.row}>
            <StatCard
              value={String(stats.totalSessions)}
              label="Total sessions"
            />
            <StatCard
              value={totalTimeLabel}
              label="Total focus time"
            />
          </View>
          <View style={[styles.row, { marginTop: 12 }]}>
            <StatCard
              value={String(stats.averageSessionsPerDay)}
              label="Avg sessions per day"
            />
            <StatCard
              value={`${Math.round(stats.totalMinutes / Math.max(stats.totalSessions, 1))}m`}
              label="Avg session length"
            />
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#1a1a2e' },
  centered:     { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a2e' },
  content:      { padding: 16, gap: 8 },
  section:      { gap: 10, marginBottom: 8 },
  sectionTitle: { fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 },
  chartCard:    { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16 },
  row:          { flexDirection: 'row', gap: 12 },
  statCard:     { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, alignItems: 'center', gap: 4 },
  statValue:    { fontSize: 28, fontWeight: '300', color: '#fff', fontVariant: ['tabular-nums'] },
  statLabel:    { fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
  statSublabel: { fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center' },
});