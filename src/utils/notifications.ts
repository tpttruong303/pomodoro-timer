import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Phase } from '../types';

// How notifications behave when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const NOTIFICATION_ID = 'pomodoro_timer';

const PHASE_MESSAGES: Record<Phase, { title: string; body: string }> = {
  work:       { title: 'Focus time is over!',  body: 'Great work — time for a break.' },
  shortBreak: { title: 'Break is over!',        body: 'Ready to focus again?' },
  longBreak:  { title: 'Long break is over!',   body: 'You got this — back to work!' },
};

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleTimerNotification(
  phase: Phase,
  seconds: number
): Promise<void> {
  if (seconds < 2) return;

  // Cancel any previous pending notification first
  await cancelTimerNotification();

  const permission = await requestNotificationPermission();
  if (!permission) return;

  const { title, body } = PHASE_MESSAGES[phase];

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_ID,
    content: {
      title,
      body,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: seconds > 0
    ? {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
        repeats: false,
      }
    : null,
  });
}

export async function cancelTimerNotification(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID)
    .catch(() => {}); // Ignore error if notification doesn't exist
}