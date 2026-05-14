import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Phase } from '../types';

interface CircularTimerProps {
  progress: number;
  timeRemaining: number;
  phase: Phase;
  isRunning: boolean;
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

// Animated circle needs a wrapped component
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function CircularTimer({ progress, timeRemaining, phase, isRunning }: CircularTimerProps) {
  const color = PHASE_COLORS[phase];
  const animatedProgress = useRef(new Animated.Value(progress)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // Smooth ring tick animation
  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 900,
      useNativeDriver: false, // strokeDashoffset doesn't support native driver
    }).start();
  }, [progress]);

  // Pulse animation when timer is running
  useEffect(() => {
    if (isRunning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.02, duration: 1000, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1,    duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      scaleAnim.stopAnimation();
      Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
  }, [isRunning]);

  // Flash animation on phase change
  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacityAnim, { toValue: 0.3, duration: 200, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1,   duration: 300, useNativeDriver: true }),
    ]).start();
  }, [phase]);

  const strokeDashoffset = animatedProgress.interpolate({
    inputRange:  [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  const mins = String(Math.floor(timeRemaining / 60)).padStart(2, '0');
  const secs = String(timeRemaining % 60).padStart(2, '0');

  return (
    <Animated.View style={[
      styles.container,
      { transform: [{ scale: scaleAnim }], opacity: opacityAnim }
    ]}>
      <Svg width={SIZE} height={SIZE}>
        {/* Background track */}
        <Circle
          cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={STROKE}
          fill="none"
        />
        {/* Animated progress ring */}
        <G rotation="-90" origin={`${SIZE / 2}, ${SIZE / 2}`}>
          <AnimatedCircle
            cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
            stroke={color}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </G>
      </Svg>

      {/* Center text */}
      <View style={styles.textOverlay}>
        <Text style={styles.time}>{mins}:{secs}</Text>
        <Text style={[styles.label, { color }]}>{PHASE_LABELS[phase]}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container:   { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  textOverlay: { position: 'absolute', alignItems: 'center' },
  time:        { fontSize: 56, fontWeight: '100', color: '#fff', fontVariant: ['tabular-nums'] },
  label:       { fontSize: 14, marginTop: 4 },
});