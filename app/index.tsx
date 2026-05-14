import { useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { usePomodoro } from '../src/context/PomodoroContext';
import { CircularTimer } from '../src/components/CircularTimer';
import { Phase } from '../src/types';

const PHASE_COLORS: Record<Phase, string> = {
  work:       '#e94560',
  shortBreak: '#2ecc71',
  longBreak:  '#1abc9c',
};

export default function TimerScreen() {
  const {
    timeRemaining, phase, isRunning, completedSessions,
    settings, progress, start, pause, reset, skip,
  } = usePomodoro();

  const color = PHASE_COLORS[phase];

  // Keep screen awake while timer is running
  useEffect(() => {
    if (isRunning) {
      activateKeepAwakeAsync().catch(() => {});
    } else {
      deactivateKeepAwake();
    }
    return () => { deactivateKeepAwake(); };
  }, [isRunning]);

  // Heavy haptic when session completes (timeRemaining hits 0)
  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
    if (settings.vibrationEnabled) {
      Haptics.impactAsync(style);
    }
  };

  const handleToggle = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    isRunning ? pause() : start();
  };

  const handleReset = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    reset();
  };

  const handleSkip = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    skip();
  };

  // Also update the session complete haptic
  useEffect(() => {
    if (timeRemaining === 0 && settings.vibrationEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [timeRemaining]);

  // How many dots to fill in current cycle
  const dotsCompleted = completedSessions % settings.sessionsBeforeLongBreak;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>

      {/* Phase indicator at top */}
      <View style={styles.phaseRow}>
        {(['work', 'shortBreak', 'longBreak'] as Phase[]).map(p => (
          <View
            key={p}
            style={[
              styles.phaseChip,
              phase === p && { backgroundColor: PHASE_COLORS[p] + '33', borderColor: PHASE_COLORS[p] }
            ]}
          >
            <Text style={[styles.phaseChipText, phase === p && { color: PHASE_COLORS[p] }]}>
              {p === 'work' ? 'Focus' : p === 'shortBreak' ? 'Short' : 'Long'}
            </Text>
          </View>
        ))}
      </View>

      {/* Circular timer */}
      <View style={styles.timerWrapper}>
        <CircularTimer
          progress={progress}
          timeRemaining={timeRemaining}
          phase={phase}
          isRunning={isRunning}
        />
      </View>

      {/* Session dots */}
      <View style={styles.dotsRow}>
        {Array.from({ length: settings.sessionsBeforeLongBreak }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < dotsCompleted && { backgroundColor: color, transform: [{ scale: 1.2 }] }
            ]}
          />
        ))}
      </View>
      <Text style={styles.sessionLabel}>
        Session {dotsCompleted + 1} of {settings.sessionsBeforeLongBreak}
      </Text>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleReset}>
          <Text style={styles.secondaryBtnText}>↺</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: color }]}
          onPress={handleToggle}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryBtnText}>{isRunning ? '⏸' : '▶'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={handleSkip}>
          <Text style={styles.secondaryBtnText}>⏭</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, alignItems: 'center', justifyContent: 'space-evenly', backgroundColor: '#1a1a2e', paddingHorizontal: 24 },
  phaseRow:        { flexDirection: 'row', gap: 8 },
  phaseChip:       { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'transparent', backgroundColor: 'rgba(255,255,255,0.05)' },
  phaseChipText:   { fontSize: 13, color: 'rgba(255,255,255,0.3)' },
  timerWrapper:    { alignItems: 'center', justifyContent: 'center' },
  dotsRow:         { flexDirection: 'row', gap: 10, alignItems: 'center' },
  dot:             { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.15)' },
  sessionLabel:    { fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: -8 },
  controls:        { flexDirection: 'row', alignItems: 'center', gap: 28 },
  primaryBtn:      { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText:  { fontSize: 30, color: '#fff' },
  secondaryBtn:    { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' },
  secondaryBtnText:{ fontSize: 22, color: 'rgba(255,255,255,0.5)' },
});