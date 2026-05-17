import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Task, RecurrenceType, ScoringMode } from '../types';
import { colors, radius, shadow, spacing, taskPalette } from '../theme';
import { defaultScoringMode } from '../utils/stats';

const ICON_CHOICES = [
  '☀️', '🥛', '🍼', '🧷', '🛁', '🧸', '💊', '😴',
  '🍎', '🥕', '🦷', '👕', '📖', '🎵', '🚶', '💧',
];

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface Props {
  visible: boolean;
  initial?: Task | null;
  archivedTasks?: Task[];
  onClose: () => void;
  onSave: (data: {
    title: string;
    icon: string;
    color: string;
    recurrenceType: RecurrenceType;
    timesPerDay?: number;
    hoursInterval?: number;
    customDays?: number[];
    pointValue: number;
    scoringMode: ScoringMode;
  }) => void;
  onDelete?: () => void;
  onRestore?: (taskId: string) => void;
}

export default function TaskEditor({
  visible,
  initial,
  archivedTasks,
  onClose,
  onSave,
  onDelete,
  onRestore,
}: Props) {
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState(ICON_CHOICES[0]);
  const [color, setColor] = useState(taskPalette[0].bg);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('once-daily');
  const [timesPerDay, setTimesPerDay] = useState(2);
  const [hoursInterval, setHoursInterval] = useState(4);
  const [customDays, setCustomDays] = useState<number[]>([1, 3, 5]);
  const [pointValue, setPointValue] = useState(10);
  const [scoringMode, setScoringMode] = useState<ScoringMode>('strict');
  const [scoringTouched, setScoringTouched] = useState(false);

  useEffect(() => {
    if (visible) {
      if (initial) {
        setTitle(initial.title);
        setIcon(initial.icon);
        setColor(initial.color);
        setRecurrenceType(initial.recurrenceType);
        setTimesPerDay(initial.timesPerDay ?? 2);
        setHoursInterval(initial.hoursInterval ?? 4);
        setCustomDays(initial.customDays ?? [1, 3, 5]);
        setPointValue(initial.pointValue);
        setScoringMode(initial.scoringMode ?? defaultScoringMode(initial));
        setScoringTouched(initial.scoringMode != null);
      } else {
        setTitle('');
        setIcon(ICON_CHOICES[0]);
        setColor(taskPalette[0].bg);
        setRecurrenceType('once-daily');
        setTimesPerDay(2);
        setHoursInterval(4);
        setCustomDays([1, 3, 5]);
        setPointValue(10);
        setScoringMode('strict');
        setScoringTouched(false);
      }
    }
  }, [visible, initial]);

  const toggleDay = (d: number) => {
    setCustomDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort(),
    );
  };

  const handleSave = () => {
    const t = title.trim();
    if (!t) {
      Alert.alert('Name required', 'Please give the task a title');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave({
      title: t,
      icon,
      color,
      recurrenceType,
      timesPerDay: recurrenceType === 'multiple-daily' ? timesPerDay : undefined,
      hoursInterval: recurrenceType === 'every-x-hours' ? hoursInterval : undefined,
      customDays: recurrenceType === 'custom-days' ? customDays : undefined,
      pointValue,
      scoringMode,
    });
    onClose();
  };

  // Auto-adjust scoring default when recurrence changes (unless user already chose explicitly)
  useEffect(() => {
    if (!scoringTouched) {
      setScoringMode(defaultScoringMode({ recurrenceType }));
    }
  }, [recurrenceType, scoringTouched]);

  const handleDelete = () => {
    if (!onDelete) return;
    Alert.alert('Delete task?', 'This will remove the task and its history.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          onDelete();
          onClose();
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: colors.cream,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            maxHeight: '92%',
          }}
        >
          <View
            style={{
              width: 40,
              height: 4,
              backgroundColor: colors.textMuted,
              borderRadius: 2,
              alignSelf: 'center',
              marginTop: 10,
            }}
          />
          <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text }}>
              {initial ? 'Edit task' : 'New task'}
            </Text>

            {/* Restore archived */}
            {!initial && archivedTasks && archivedTasks.length > 0 && onRestore && (
              <View style={{ marginTop: spacing.md }}>
                <Text style={styles.label}>Bring back a previous task</Text>
                {archivedTasks.map((t) => (
                  <View
                    key={t.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors.white,
                      borderRadius: radius.md,
                      padding: 12,
                      marginBottom: 8,
                      ...shadow.soft,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: t.color,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 10,
                      }}
                    >
                      <Text style={{ fontSize: 20 }}>{t.icon}</Text>
                    </View>
                    <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: colors.text }}>
                      {t.title}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        onRestore(t.id);
                        onClose();
                      }}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: radius.pill,
                        backgroundColor: colors.mint,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>
                        Restore
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
                <View
                  style={{
                    height: 1,
                    backgroundColor: colors.creamDark,
                    marginVertical: spacing.md,
                  }}
                />
                <Text style={{ fontSize: 12, color: colors.textSoft, marginBottom: 4 }}>
                  Or create a new one below
                </Text>
              </View>
            )}

            {/* Title */}
            <Text style={styles.label}>Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Vitamin D"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />

            {/* Icon */}
            <Text style={styles.label}>Icon</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {ICON_CHOICES.map((i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setIcon(i)}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: icon === i ? color : colors.white,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 8,
                    marginBottom: 8,
                    ...shadow.soft,
                  }}
                >
                  <Text style={{ fontSize: 22 }}>{i}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Color */}
            <Text style={styles.label}>Color</Text>
            <View style={{ flexDirection: 'row' }}>
              {taskPalette.map((p) => (
                <TouchableOpacity
                  key={p.label}
                  onPress={() => setColor(p.bg)}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    backgroundColor: p.bg,
                    marginRight: 10,
                    borderWidth: color === p.bg ? 3 : 0,
                    borderColor: colors.text,
                  }}
                />
              ))}
            </View>

            {/* Recurrence */}
            <Text style={styles.label}>How often?</Text>
            {(
              [
                { key: 'once-daily', label: 'Once a day', icon: '☀️' },
                { key: 'multiple-daily', label: 'Multiple times a day', icon: '🔁' },
                { key: 'every-x-hours', label: 'Every X hours', icon: '⏱️' },
                { key: 'custom-days', label: 'Specific days of week', icon: '📅' },
              ] as { key: RecurrenceType; label: string; icon: string }[]
            ).map((opt) => {
              const active = recurrenceType === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setRecurrenceType(opt.key)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 14,
                    borderRadius: radius.md,
                    backgroundColor: active ? color : colors.white,
                    marginBottom: 8,
                    ...shadow.soft,
                  }}
                >
                  <Text style={{ fontSize: 20, marginRight: 12 }}>{opt.icon}</Text>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text, flex: 1 }}>
                    {opt.label}
                  </Text>
                  {active && <Text style={{ fontSize: 18 }}>✓</Text>}
                </TouchableOpacity>
              );
            })}

            {/* Recurrence params */}
            {recurrenceType === 'multiple-daily' && (
              <Stepper
                label="Times per day"
                value={timesPerDay}
                min={2}
                max={12}
                onChange={setTimesPerDay}
              />
            )}
            {recurrenceType === 'every-x-hours' && (
              <Stepper
                label="Hours between"
                value={hoursInterval}
                min={1}
                max={12}
                onChange={setHoursInterval}
              />
            )}
            {recurrenceType === 'custom-days' && (
              <View style={{ flexDirection: 'row', marginTop: 8 }}>
                {DAY_LABELS.map((l, i) => {
                  const active = customDays.includes(i);
                  return (
                    <TouchableOpacity
                      key={i}
                      onPress={() => toggleDay(i)}
                      style={{
                        flex: 1,
                        marginHorizontal: 3,
                        paddingVertical: 12,
                        borderRadius: radius.md,
                        backgroundColor: active ? color : colors.white,
                        alignItems: 'center',
                        ...shadow.soft,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '700',
                          color: colors.text,
                        }}
                      >
                        {l}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Scoring mode */}
            <Text style={styles.label}>Daily score</Text>
            {(
              [
                {
                  key: 'lenient' as ScoringMode,
                  title: 'Logging is enough',
                  sub: 'Any log that day gives full credit (e.g. diapers, feeding)',
                  icon: '💛',
                },
                {
                  key: 'strict' as ScoringMode,
                  title: 'Track every dose',
                  sub: 'Need to hit the full target to score full (e.g. Calcium 2×)',
                  icon: '🎯',
                },
              ]
            ).map((opt) => {
              const active = scoringMode === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => {
                    setScoringMode(opt.key);
                    setScoringTouched(true);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 14,
                    borderRadius: radius.md,
                    backgroundColor: active ? color : colors.white,
                    marginBottom: 8,
                    ...shadow.soft,
                  }}
                >
                  <Text style={{ fontSize: 20, marginRight: 12 }}>{opt.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
                      {opt.title}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textSoft, marginTop: 2 }}>
                      {opt.sub}
                    </Text>
                  </View>
                  {active && <Text style={{ fontSize: 18, marginLeft: 8 }}>✓</Text>}
                </TouchableOpacity>
              );
            })}

            {/* Points */}
            <Stepper
              label="Points per completion"
              value={pointValue}
              min={1}
              max={50}
              step={5}
              onChange={setPointValue}
            />

            {/* Actions */}
            <View style={{ flexDirection: 'row', marginTop: spacing.lg }}>
              <TouchableOpacity
                onPress={onClose}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: radius.md,
                  backgroundColor: colors.white,
                  marginRight: 8,
                  alignItems: 'center',
                  ...shadow.soft,
                }}
              >
                <Text style={{ fontSize: 15, color: colors.textSoft, fontWeight: '600' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: radius.md,
                  backgroundColor: color,
                  alignItems: 'center',
                  ...shadow.soft,
                }}
              >
                <Text style={{ fontSize: 15, color: colors.text, fontWeight: '700' }}>
                  {initial ? 'Save' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>

            {initial && onDelete && (
              <TouchableOpacity
                onPress={handleDelete}
                style={{
                  marginTop: 12,
                  paddingVertical: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 14, color: colors.peachDark, fontWeight: '600' }}>
                  🗑️  Delete task
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={{ marginTop: spacing.md }}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.white,
          borderRadius: radius.md,
          padding: 6,
          ...shadow.soft,
        }}
      >
        <TouchableOpacity
          onPress={() => onChange(Math.max(min, value - step))}
          style={stepperBtn}
        >
          <Text style={{ fontSize: 22, color: colors.text, fontWeight: '700' }}>−</Text>
        </TouchableOpacity>
        <Text
          style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 18,
            fontWeight: '700',
            color: colors.text,
          }}
        >
          {value}
        </Text>
        <TouchableOpacity
          onPress={() => onChange(Math.min(max, value + step))}
          style={stepperBtn}
        >
          <Text style={{ fontSize: 22, color: colors.text, fontWeight: '700' }}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = {
  label: {
    fontSize: 13,
    color: colors.textSoft,
    marginTop: spacing.md,
    marginBottom: 6,
    fontWeight: '600' as const,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    ...shadow.soft,
  },
};

const stepperBtn = {
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: colors.creamDark,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};
