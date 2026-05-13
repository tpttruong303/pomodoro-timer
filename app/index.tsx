import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import * as Haptics from 'expo-haptics';
import { usePomodoro } from '../src/context/PomodoroContext';
import { CircularTimer } from '../src/components/CircularTimer';

export default function TimerScreen() {
  const { timeRemaining, phase, isRunning, completedSessions,
          settings, progress, start, pause, reset, skip } = usePomodoro();

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    isRunning ? pause() : start();
  };

  return (
    <SafeAreaView style={styles.container}>
      <CircularTimer progress={progress} timeRemaining={timeRemaining} phase={phase} />
      <View style={styles.dots}>
        {Array.from({ length: settings.sessionsBeforeLongBreak }).map((_, i) => (
          <View key={i} style={[styles.dot, i < (completedSessions % settings.sessionsBeforeLongBreak) && styles.dotFilled]} />
        ))}
      </View>
      <View style={styles.controls}>
        <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); reset(); }}>
          <Text style={styles.secondaryBtn}>↺</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleToggle}>
          <Text style={styles.primaryBtnText}>{isRunning ? '⏸' : '▶'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); skip(); }}>
          <Text style={styles.secondaryBtn}>⏭</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a2e', gap: 32 },
  dots:           { flexDirection: 'row', gap: 8 },
  dot:            { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' },
  dotFilled:      { backgroundColor: '#e94560' },
  controls:       { flexDirection: 'row', alignItems: 'center', gap: 32 },
  primaryBtn:     { width: 72, height: 72, borderRadius: 36, backgroundColor: '#e94560', alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { fontSize: 28, color: '#fff' },
  secondaryBtn:   { fontSize: 28, color: 'rgba(255,255,255,0.5)' },
});