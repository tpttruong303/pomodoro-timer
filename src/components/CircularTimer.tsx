import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Phase } from '../types';

interface CircularTimerProps {
  progress: number;
  timeRemaining: number;
  phase: Phase;
}

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

const SIZE = 260;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CircularTimer({ progress, timeRemaining, phase }: CircularTimerProps) {
  const color = PHASE_COLORS[phase];
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  const mins = String(Math.floor(timeRemaining / 60)).padStart(2, '0');
  const secs = String(timeRemaining % 60).padStart(2, '0');

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE}>
        <Circle
          cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={STROKE}
          fill="none"
        />
        <Circle
          cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
          stroke={color}
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${SIZE / 2}, ${SIZE / 2}`}
        />
      </Svg>
      <View style={styles.textOverlay}>
        <Text style={styles.time}>{mins}:{secs}</Text>
        <Text style={styles.label}>{PHASE_LABELS[phase]}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  textOverlay: { position: 'absolute', alignItems: 'center' },
  time:        { fontSize: 56, fontWeight: '100', color: '#fff', fontVariant: ['tabular-nums'] },
  label:       { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
});