import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePomodoro } from '../src/context/PomodoroContext';
import { PomodoroSettings, TimeValue } from '../src/types';
import { toTimeValue, toTotalSeconds } from '../src/utils/storage';

interface StepperProps {
  value: number;
  min: number;
  max: number;
  onDecrement: () => void;
  onIncrement: () => void;
  unit: string;
}

function Stepper({ value, min, max, onDecrement, onIncrement, unit }: StepperProps) {
  return (
    <View style={styles.stepper}>
      <TouchableOpacity
        style={[styles.stepBtn, value <= min && styles.stepBtnDisabled]}
        onPress={onDecrement}
        disabled={value <= min}
      >
        <Text style={styles.stepBtnText}>−</Text>
      </TouchableOpacity>
      <Text style={styles.stepValue}>
        {String(value).padStart(2, '0')}{unit}
      </Text>
      <TouchableOpacity
        style={[styles.stepBtn, value >= max && styles.stepBtnDisabled]}
        onPress={onIncrement}
        disabled={value >= max}
      >
        <Text style={styles.stepBtnText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

interface DurationRowProps {
  label: string;
  subtitle: string;
  time: TimeValue;
  onChangeMinutes: (delta: number) => void;
  onChangeSeconds: (delta: number) => void;
}

function DurationRow({ label, subtitle, time, onChangeMinutes, onChangeSeconds }: DurationRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <View style={styles.durationSteppers}>
        <Stepper
          value={time.minutes} min={0} max={60} unit="m"
          onDecrement={() => onChangeMinutes(-1)}
          onIncrement={() => onChangeMinutes(1)}
        />
        <Text style={styles.timeSeparator}>:</Text>
        <Stepper
          value={time.seconds} min={0} max={55} unit="s"
          onDecrement={() => onChangeSeconds(-5)}
          onIncrement={() => onChangeSeconds(5)}
        />
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const { settings, updateSettings, isRunning } = usePomodoro();
  const [draft, setDraft] = useState<PomodoroSettings>(settings);
  const hasChanges = JSON.stringify(draft) !== JSON.stringify(settings);

  const adjustDuration = (
    key: 'workDuration' | 'shortBreakDuration' | 'longBreakDuration',
    field: 'minutes' | 'seconds',
    delta: number
  ) => {
    const current = toTimeValue(draft[key]);
    const updated = { ...current, [field]: current[field] + delta };

    // Clamp minutes 0–60, seconds 0–55
    updated.minutes = Math.max(0, Math.min(60, updated.minutes));
    updated.seconds = Math.max(0, Math.min(55, updated.seconds));

    // Minimum total of 5 seconds
    const total = toTotalSeconds(updated);
    if (total < 5) return;

    setDraft(prev => ({ ...prev, [key]: toTotalSeconds(updated) }));
  };

  const handleApply = () => {
    if (isRunning) {
      Alert.alert(
        'Timer is running',
        'Applying settings will reset the current timer. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Apply', style: 'destructive', onPress: () => updateSettings(draft) },
        ]
      );
    } else {
      updateSettings(draft);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>

        <Text style={styles.sectionTitle}>Durations</Text>

        <DurationRow
          label="Focus"
          subtitle="Work session length"
          time={toTimeValue(draft.workDuration)}
          onChangeMinutes={d => adjustDuration('workDuration', 'minutes', d)}
          onChangeSeconds={d => adjustDuration('workDuration', 'seconds', d)}
        />
        <DurationRow
          label="Short break"
          subtitle="Rest between sessions"
          time={toTimeValue(draft.shortBreakDuration)}
          onChangeMinutes={d => adjustDuration('shortBreakDuration', 'minutes', d)}
          onChangeSeconds={d => adjustDuration('shortBreakDuration', 'seconds', d)}
        />
        <DurationRow
          label="Long break"
          subtitle="Rest after full cycle"
          time={toTimeValue(draft.longBreakDuration)}
          onChangeMinutes={d => adjustDuration('longBreakDuration', 'minutes', d)}
          onChangeSeconds={d => adjustDuration('longBreakDuration', 'seconds', d)}
        />

        <Text style={styles.sectionTitle}>Cycle</Text>

        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>Sessions before long break</Text>
            <Text style={styles.rowSubtitle}>Focus sessions per cycle</Text>
          </View>
          <Stepper
            value={draft.sessionsBeforeLongBreak} min={1} max={8} unit=""
            onDecrement={() => setDraft(p => ({ ...p, sessionsBeforeLongBreak: p.sessionsBeforeLongBreak - 1 }))}
            onIncrement={() => setDraft(p => ({ ...p, sessionsBeforeLongBreak: p.sessionsBeforeLongBreak + 1 }))}
          />
        </View>

        {hasChanges ? (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.discardBtn} onPress={() => setDraft(settings)}>
              <Text style={styles.discardBtnText}>Discard</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
              <Text style={styles.applyBtnText}>Apply changes</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.hint}>Adjust values above to see changes</Text>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#1a1a2e' },
  content:          { padding: 24, gap: 8 },
  sectionTitle:     { fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 24, marginBottom: 8 },
  row:              { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, gap: 12 },
  rowText:          { flex: 1, gap: 2 },
  rowLabel:         { fontSize: 16, color: '#fff' },
  rowSubtitle:      { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  durationSteppers: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeSeparator:    { fontSize: 18, color: 'rgba(255,255,255,0.4)', paddingHorizontal: 2 },
  stepper:          { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepBtn:          { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  stepBtnDisabled:  { opacity: 0.3 },
  stepBtnText:      { fontSize: 18, color: '#fff', lineHeight: 22 },
  stepValue:        { fontSize: 15, color: '#fff', minWidth: 32, textAlign: 'center', fontVariant: ['tabular-nums'] },
  actions:          { flexDirection: 'row', gap: 12, marginTop: 32 },
  discardBtn:       { flex: 1, padding: 16, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
  discardBtnText:   { color: 'rgba(255,255,255,0.5)', fontSize: 16 },
  applyBtn:         { flex: 2, padding: 16, borderRadius: 12, backgroundColor: '#e94560', alignItems: 'center' },
  applyBtnText:     { color: '#fff', fontSize: 16, fontWeight: '500' },
  hint:             { fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 32 },
});