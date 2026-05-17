import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useChildStore } from '../src/stores/childStore';
import { useTaskStore } from '../src/stores/taskStore';

export default function RootLayout() {
  const loadChildren = useChildStore((state) => state.loadChildren);
  const loadTasks = useTaskStore((state) => state.loadTasks);

  useEffect(() => {
    loadChildren();
    loadTasks();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFF8F0' } }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SafeAreaProvider>
  );
}
