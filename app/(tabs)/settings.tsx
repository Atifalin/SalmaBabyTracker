import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { clearAll } from '../../src/storage/storage';
import { useChildStore } from '../../src/stores/childStore';
import { useTaskStore } from '../../src/stores/taskStore';
import { colors, radius, shadow, spacing } from '../../src/theme';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text
        style={{
          fontSize: 12,
          fontWeight: '700',
          color: colors.textMuted,
          marginBottom: 8,
          marginLeft: 4,
          letterSpacing: 1,
        }}
      >
        {title.toUpperCase()}
      </Text>
      <View
        style={{
          backgroundColor: colors.white,
          borderRadius: radius.lg,
          overflow: 'hidden',
          ...shadow.soft,
        }}
      >
        {children}
      </View>
    </View>
  );
}

function Row({
  icon,
  label,
  rightLabel,
  onPress,
  rightElement,
  destructive,
}: {
  icon: string;
  label: string;
  rightLabel?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  destructive?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress && !rightElement}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.creamDark,
      }}
    >
      <Text style={{ fontSize: 20, marginRight: 14 }}>{icon}</Text>
      <Text
        style={{
          flex: 1,
          fontSize: 15,
          color: destructive ? colors.peachDark : colors.text,
          fontWeight: '600',
        }}
      >
        {label}
      </Text>
      {rightLabel && (
        <Text style={{ fontSize: 14, color: colors.textSoft, marginRight: 4 }}>{rightLabel}</Text>
      )}
      {rightElement}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const loadChildren = useChildStore((s) => s.loadChildren);
  const loadTasks = useTaskStore((s) => s.loadTasks);

  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleReset = () => {
    Alert.alert(
      'Reset everything?',
      'This will delete all profiles, tasks, completions and badges. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await clearAll();
            loadChildren();
            loadTasks();
            Alert.alert('Done', 'All data has been cleared.');
          },
        },
      ],
    );
  };

  const handleDonate = () => {
    Linking.openURL('https://www.buymeacoffee.com').catch(() => {});
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 140 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text }}>Settings ⚙️</Text>
        <Text style={{ fontSize: 14, color: colors.textSoft, marginTop: 4 }}>
          Everything stays on your phone.
        </Text>

        <View style={{ marginTop: spacing.lg }}>
          <Section title="Reminders">
            <Row
              icon="🔔"
              label="Daily reminders"
              rightElement={
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: colors.creamDark, true: colors.mint }}
                />
              }
            />
            <Row icon="⏰" label="Default reminder time" rightLabel="9:00 AM" />
          </Section>

          <Section title="Appearance">
            <Row
              icon="🌙"
              label="Dark mode"
              rightElement={
                <Switch
                  value={darkMode}
                  onValueChange={(v) => {
                    setDarkMode(v);
                    Alert.alert('Coming soon', 'Dark mode will be available in a future update.');
                  }}
                  trackColor={{ false: colors.creamDark, true: colors.lavender }}
                />
              }
            />
          </Section>

          <Section title="Data">
            <Row
              icon="📤"
              label="Export backup"
              onPress={() => Alert.alert('Coming soon', 'Backup export will be added soon.')}
            />
            <Row
              icon="📥"
              label="Import backup"
              onPress={() => Alert.alert('Coming soon', 'Backup import will be added soon.')}
            />
            <Row
              icon="🗑️"
              label="Reset all data"
              onPress={handleReset}
              destructive
            />
          </Section>

          <Section title="Support">
            <Row icon="☕" label="Buy us a coffee" onPress={handleDonate} />
            <Row icon="💌" label="About this app" onPress={() => Alert.alert('Baby Tracker', 'Made with love for tired parents. v1.0.0')} />
          </Section>
        </View>

        <Text
          style={{
            textAlign: 'center',
            fontSize: 12,
            color: colors.textMuted,
            marginTop: spacing.lg,
          }}
        >
          No accounts • No cloud • 100% private
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
