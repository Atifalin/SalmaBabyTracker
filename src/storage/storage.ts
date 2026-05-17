import AsyncStorage from '@react-native-async-storage/async-storage';

export const storageKeys = {
  CHILDREN: 'children',
  TASKS: 'tasks',
  COMPLETIONS: 'completions',
  BADGES: 'badges',
  CHILD_BADGES: 'child_badges',
  STREAKS: 'streaks',
  SELECTED_CHILD: 'selected_child',
  DAY_STATS: 'day_stats',
} as const;

export async function getItem<T>(key: string): Promise<T | null> {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export async function removeItem(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

export async function clearAll(): Promise<void> {
  await AsyncStorage.clear();
}
