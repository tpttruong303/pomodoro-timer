import { Tabs } from 'expo-router';
import { PomodoroProvider } from '../src/context/PomodoroContext';

export default function RootLayout() {
  return (
    <PomodoroProvider>
      <Tabs
        screenOptions={{
          tabBarStyle: { backgroundColor: '#1a1a2e', borderTopColor: 'rgba(255,255,255,0.1)' },
          tabBarActiveTintColor: '#e94560',
          tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
          headerStyle: { backgroundColor: '#1a1a2e' },
          headerTintColor: '#fff',
        }}
      >
        <Tabs.Screen name="index"    options={{ title: 'Timer',    tabBarLabel: 'Timer' }} />
        <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarLabel: 'Settings' }} />
        <Tabs.Screen name="history"  options={{ title: 'History',  tabBarLabel: 'History' }} />
      </Tabs>
    </PomodoroProvider>
  );
}