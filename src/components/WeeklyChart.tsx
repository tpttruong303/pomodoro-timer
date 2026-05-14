import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { DayStat } from '../hooks/useStats';

interface WeeklyChartProps {
  data: DayStat[];
}

const CHART_HEIGHT = 120;
const BAR_WIDTH = 28;
const BAR_RADIUS = 6;
const ACTIVE_COLOR = '#e94560';
const INACTIVE_COLOR = 'rgba(255,255,255,0.1)';
const TODAY_COLOR = '#e94560';

export function WeeklyChart({ data }: WeeklyChartProps) {
  const maxSessions = Math.max(...data.map(d => d.sessions), 1);

  return (
    <View style={styles.container}>
      <Svg width="100%" height={CHART_HEIGHT + 40} viewBox={`0 0 ${data.length * 44} ${CHART_HEIGHT + 40}`}>
        {data.map((day, i) => {
          const barHeight = Math.max((day.sessions / maxSessions) * CHART_HEIGHT, day.sessions > 0 ? 8 : 4);
          const x = i * 44 + 8;
          const y = CHART_HEIGHT - barHeight;
          const color = day.sessions > 0 ? ACTIVE_COLOR : INACTIVE_COLOR;

          return (
            <React.Fragment key={day.day}>
              {/* Bar */}
              <Rect
                x={x} y={y}
                width={BAR_WIDTH} height={barHeight}
                rx={BAR_RADIUS}
                fill={color}
                opacity={day.isToday ? 1 : day.sessions > 0 ? 0.6 : 1}
              />
              {/* Session count above bar */}
              {day.sessions > 0 && (
                <SvgText
                  x={x + BAR_WIDTH / 2} y={y - 6}
                  fontSize="11" fill="rgba(255,255,255,0.6)"
                  textAnchor="middle"
                >
                  {day.sessions}
                </SvgText>
              )}
              {/* Day label below bar */}
              <SvgText
                x={x + BAR_WIDTH / 2} y={CHART_HEIGHT + 18}
                fontSize="11"
                fill={day.isToday ? TODAY_COLOR : 'rgba(255,255,255,0.4)'}
                textAnchor="middle"
                fontWeight={day.isToday ? '600' : '400'}
              >
                {day.day}
              </SvgText>
              {/* Today dot */}
              {day.isToday && (
                <Rect
                  x={x + BAR_WIDTH / 2 - 2} y={CHART_HEIGHT + 26}
                  width={4} height={4} rx={2}
                  fill={TODAY_COLOR}
                />
              )}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', paddingHorizontal: 8 },
});