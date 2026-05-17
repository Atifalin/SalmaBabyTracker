import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useChildStore } from '../../src/stores/childStore';
import { useTaskStore } from '../../src/stores/taskStore';
import { colors, radius, shadow, spacing, taskPalette } from '../../src/theme';
import {
  currentStreak,
  dayCompletionRatio,
  effectiveScoringMode,
  expectedDailyCount,
  starsForRatio,
  tasksScheduledOn,
} from '../../src/utils/stats';
import { greetingByHour, todayKey, toDateKey } from '../../src/utils/date';
import TaskEditor from '../../src/components/TaskEditor';
import { Task } from '../../src/types';

function StarsRow({ stars, size = 28 }: { stars: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Text key={i} style={{ fontSize: size, marginRight: 2 }}>
          {i < stars ? '⭐' : '☆'}
        </Text>
      ))}
    </View>
  );
}

function ProgressRing({ progress, label }: { progress: number; label: string }) {
  const pct = Math.round(progress * 100);
  return (
    <View
      style={{
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 8,
        borderColor: colors.lavender,
        ...shadow.soft,
      }}
    >
      <Text style={{ fontSize: 28, fontWeight: '700', color: colors.text }}>{pct}%</Text>
      <Text style={{ fontSize: 12, color: colors.textSoft, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

interface TaskCardProps {
  title: string;
  icon: string;
  done: number;
  expected: number;
  points: number;
  lenient: boolean;
  color: { bg: string; icon: string };
  onComplete: () => void;
  onUndo: () => void;
  onEdit: () => void;
}

function TaskCard({ title, icon, done, expected, points, lenient, color, onComplete, onUndo, onEdit }: TaskCardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const sparkle = useRef(new Animated.Value(0)).current;
  // For lenient tasks the card visually shows a check on first log but stays tappable to log more
  const visuallyDone = lenient ? done >= 1 : done >= expected;
  const canStillTap = done < expected; // allow logging up to the expected target for both modes

  const handlePress = () => {
    if (!canStillTap) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    sparkle.setValue(0);
    Animated.timing(sparkle, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    onComplete();
  };

  const sparkleTranslate = sparkle.interpolate({ inputRange: [0, 1], outputRange: [0, -30] });
  const sparkleOpacity = sparkle.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] });

  return (
    <Animated.View style={{ transform: [{ scale }], marginBottom: spacing.md }}>
      <Pressable
        onPress={handlePress}
        onLongPress={() => {
          if (done > 0) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onUndo();
          }
        }}
        style={{
          backgroundColor: color.bg,
          borderRadius: radius.lg,
          padding: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          opacity: visuallyDone && !canStillTap ? 0.65 : visuallyDone ? 0.85 : 1,
          ...shadow.card,
        }}
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.white,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing.md,
          }}
        >
          <Text style={{ fontSize: 28 }}>{icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 17,
              fontWeight: '700',
              color: colors.text,
              textDecorationLine: visuallyDone && !canStillTap ? 'line-through' : 'none',
            }}
          >
            {title}
          </Text>
          <Text style={{ fontSize: 13, color: colors.textSoft, marginTop: 2 }}>
            {lenient && expected > 1
              ? `Logged ${done} · +${points} pts each`
              : expected > 1
              ? `${done}/${expected} • +${points} pts each`
              : `+${points} points`}
          </Text>
        </View>
        <View style={{ alignItems: 'center', justifyContent: 'center', minWidth: 44 }}>
          {visuallyDone ? (
            <Text style={{ fontSize: 28 }}>✅</Text>
          ) : (
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.white,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 20, color: color.icon, fontWeight: '700' }}>+</Text>
            </View>
          )}
          <Animated.Text
            style={{
              position: 'absolute',
              fontSize: 18,
              opacity: sparkleOpacity,
              transform: [{ translateY: sparkleTranslate }],
            }}
          >
            ✨
          </Animated.Text>
        </View>
      </Pressable>
      <TouchableOpacity
        onPress={onEdit}
        hitSlop={8}
        style={{
          position: 'absolute',
          top: 6,
          right: 6,
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: 'rgba(255,255,255,0.7)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 13 }}>✏️</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function ChildPill({
  name,
  avatar,
  themeColor,
  active,
  onPress,
}: {
  name: string;
  avatar: string;
  themeColor: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: radius.pill,
        backgroundColor: active ? themeColor : colors.white,
        marginRight: 8,
        ...shadow.soft,
      }}
    >
      <Text style={{ fontSize: 18, marginRight: 6 }}>{avatar}</Text>
      <Text
        style={{
          fontSize: 14,
          fontWeight: '600',
          color: active ? colors.text : colors.textSoft,
        }}
      >
        {name}
      </Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { children, selectedChildId, selectChild, addChild } = useChildStore();
  const {
    tasks,
    completions,
    completeTask,
    uncompleteLatest,
    addTask,
    updateTask,
    deleteTask,
    restoreTask,
  } = useTaskStore();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const openAdd = () => {
    setEditingTask(null);
    setEditorOpen(true);
  };
  const openEdit = (t: Task) => {
    setEditingTask(t);
    setEditorOpen(true);
  };

  const selectedChild = children.find((c) => c.id === selectedChildId);

  // Seed default child once
  useEffect(() => {
    if (children.length === 0) {
      addChild({
        name: 'Baby',
        avatar: '👶',
        birthDate: new Date().toISOString(),
        themeColor: colors.lavender,
      });
    }
  }, [children.length]);

  // Seed default tasks once per child
  const seededRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!selectedChildId) return;
    if (seededRef.current.has(selectedChildId)) return;
    const childTasks = tasks.filter((t) => t.childId === selectedChildId);
    if (childTasks.length > 0) {
      seededRef.current.add(selectedChildId);
      return;
    }
    const defaults = [
      { title: 'Vitamin D', icon: '☀️', color: taskPalette[0].bg, points: 10, recurrence: 'once-daily' as const, times: 1 },
      { title: 'Calcium', icon: '🥛', color: taskPalette[2].bg, points: 10, recurrence: 'multiple-daily' as const, times: 2 },
      { title: 'Feeding', icon: '🍼', color: taskPalette[4].bg, points: 5, recurrence: 'every-x-hours' as const, hours: 4 },
      { title: 'Diaper', icon: '🧷', color: taskPalette[3].bg, points: 5, recurrence: 'multiple-daily' as const, times: 6 },
      { title: 'Bath', icon: '🛁', color: taskPalette[1].bg, points: 10, recurrence: 'once-daily' as const, times: 1 },
      { title: 'Tummy Time', icon: '🧸', color: taskPalette[5].bg, points: 5, recurrence: 'multiple-daily' as const, times: 3 },
    ];
    defaults.forEach((d, i) => {
      setTimeout(() => {
        addTask({
          childId: selectedChildId,
          title: d.title,
          icon: d.icon,
          color: d.color,
          recurrenceType: d.recurrence,
          pointValue: d.points,
          timesPerDay: d.times,
          hoursInterval: d.hours,
        });
      }, i * 5);
    });
    seededRef.current.add(selectedChildId);
  }, [selectedChildId, tasks.length]);

  const today = useMemo(() => new Date(), []);
  const todayTasks = useMemo(
    () => (selectedChildId ? tasksScheduledOn(tasks, selectedChildId, today) : []),
    [tasks, selectedChildId, today],
  );

  const dayStats = useMemo(
    () =>
      selectedChildId
        ? dayCompletionRatio(tasks, completions, selectedChildId, today)
        : { completed: 0, total: 0, ratio: 0 },
    [tasks, completions, selectedChildId, today],
  );

  const stars = starsForRatio(dayStats.ratio);
  const streak = useMemo(
    () => (selectedChildId ? currentStreak(tasks, completions, selectedChildId) : 0),
    [tasks, completions, selectedChildId],
  );

  const todayDateStr = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }, []);

  const countForTask = (taskId: string) => {
    const tKey = todayKey();
    return completions.filter(
      (c) => c.taskId === taskId && c.childId === selectedChildId && toDateKey(c.completedAt) === tKey,
    ).length;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
          <Text style={{ fontSize: 13, color: colors.textSoft, fontWeight: '500' }}>{todayDateStr}</Text>
          <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text, marginTop: 4 }}>
            {greetingByHour()} ☀️
          </Text>
          <Text style={{ fontSize: 15, color: colors.textSoft, marginTop: 2 }}>
            How's {selectedChild?.name ?? 'baby'} doing today?
          </Text>
        </View>

        {/* Child switcher */}
        {children.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: spacing.md }}
            contentContainerStyle={{ paddingHorizontal: spacing.lg }}
          >
            {children.map((c) => (
              <ChildPill
                key={c.id}
                name={c.name}
                avatar={c.avatar}
                themeColor={c.themeColor || colors.lavender}
                active={c.id === selectedChildId}
                onPress={() => selectChild(c.id)}
              />
            ))}
          </ScrollView>
        )}

        {/* Progress hero card */}
        <View
          style={{
            marginHorizontal: spacing.lg,
            marginTop: spacing.md,
            backgroundColor: colors.white,
            borderRadius: radius.xl,
            padding: spacing.lg,
            flexDirection: 'row',
            alignItems: 'center',
            ...shadow.card,
          }}
        >
          <ProgressRing progress={dayStats.ratio} label="today" />
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={{ fontSize: 13, color: colors.textSoft, fontWeight: '500' }}>Today's stars</Text>
            <View style={{ marginTop: 4 }}>
              <StarsRow stars={stars} />
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 12,
                backgroundColor: colors.goldSoft,
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: radius.pill,
                alignSelf: 'flex-start',
              }}
            >
              <Text style={{ fontSize: 14 }}>🔥</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, marginLeft: 4 }}>
                {streak} day streak
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 8 }}>
              {dayStats.completed} / {dayStats.total} tasks
            </Text>
          </View>
        </View>

        {/* Tasks */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: spacing.md,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
              Today's care
            </Text>
            <TouchableOpacity
              onPress={openAdd}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: radius.pill,
                backgroundColor: colors.white,
                ...shadow.soft,
              }}
            >
              <Text style={{ fontSize: 14, marginRight: 4 }}>➕</Text>
              <Text style={{ fontSize: 12, color: colors.text, fontWeight: '700' }}>Add task</Text>
            </TouchableOpacity>
          </View>
          {todayTasks.length === 0 && (
            <View
              style={{
                backgroundColor: colors.white,
                borderRadius: radius.lg,
                padding: spacing.lg,
                alignItems: 'center',
                ...shadow.soft,
              }}
            >
              <Text style={{ fontSize: 40 }}>🌷</Text>
              <Text style={{ fontSize: 14, color: colors.textSoft, marginTop: 8 }}>
                Setting up your tasks...
              </Text>
            </View>
          )}
          {todayTasks.map((task, idx) => {
            const palette = taskPalette[idx % taskPalette.length];
            const done = countForTask(task.id);
            const expected = expectedDailyCount(task);
            return (
              <TaskCard
                key={task.id}
                title={task.title}
                icon={task.icon}
                done={done}
                expected={expected}
                points={task.pointValue}
                lenient={effectiveScoringMode(task) === 'lenient'}
                color={{ bg: task.color || palette.bg, icon: palette.icon }}
                onComplete={() =>
                  selectedChildId && completeTask(task.id, selectedChildId, task.pointValue)
                }
                onUndo={() => selectedChildId && uncompleteLatest(task.id, selectedChildId)}
                onEdit={() => openEdit(task)}
              />
            );
          })}
          {todayTasks.length > 0 && (
            <Text style={{ fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm }}>
              Tap ✏️ to edit · Long-press card to undo
            </Text>
          )}
        </View>
      </ScrollView>

      <TaskEditor
        visible={editorOpen}
        initial={editingTask}
        archivedTasks={tasks.filter((t) => t.childId === selectedChildId && t.archivedAt)}
        onClose={() => setEditorOpen(false)}
        onSave={(data) => {
          if (editingTask) {
            updateTask(editingTask.id, data);
          } else if (selectedChildId) {
            addTask({ ...data, childId: selectedChildId });
          }
        }}
        onDelete={
          editingTask
            ? () => {
                deleteTask(editingTask.id);
              }
            : undefined
        }
        onRestore={(id) => restoreTask(id)}
      />
    </SafeAreaView>
  );
}
