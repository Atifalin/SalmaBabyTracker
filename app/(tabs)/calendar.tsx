import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useChildStore } from '../../src/stores/childStore';
import { useTaskStore } from '../../src/stores/taskStore';
import { colors, radius, shadow, spacing } from '../../src/theme';
import {
  dayCompletionRatio,
  effectiveScoringMode,
  expectedDailyCount,
  starsForRatio,
  tasksScheduledOn,
} from '../../src/utils/stats';
import { monthGrid, monthName, toDateKey } from '../../src/utils/date';
import ChildSwitcher from '../../src/components/ChildSwitcher';

const WEEK_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function colorForStars(stars: number, hasData: boolean) {
  if (!hasData) return colors.white;
  if (stars === 5) return colors.mint;
  if (stars === 4) return colors.pastelBlue;
  if (stars === 3) return colors.yellow;
  if (stars >= 1) return colors.peach;
  return colors.creamDark;
}

function DayCell({
  date,
  stars,
  hasData,
  isToday,
  isFuture,
  isSelected,
  onPress,
}: {
  date: number;
  stars: number;
  hasData: boolean;
  isToday: boolean;
  isFuture: boolean;
  isSelected: boolean;
  onPress: () => void;
}) {
  const bg = isFuture ? colors.cream : colorForStars(stars, hasData);
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        aspectRatio: 1,
        margin: 3,
        borderRadius: radius.sm,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: isSelected ? 2 : isToday ? 2 : 0,
        borderColor: isSelected ? colors.lavenderDark : isToday ? colors.lavenderDark : 'transparent',
        opacity: isFuture ? 0.5 : 1,
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: '700',
          color: hasData ? colors.text : colors.textMuted,
        }}
      >
        {date}
      </Text>
      {hasData && stars > 0 && (
        <Text style={{ fontSize: 9, marginTop: 1 }}>{'⭐'.repeat(Math.min(stars, 5))}</Text>
      )}
    </Pressable>
  );
}

export default function CalendarScreen() {
  const { selectedChildId, children } = useChildStore();
  const { tasks, completions } = useTaskStore();
  const selectedChild = children.find((c) => c.id === selectedChildId);

  const [cursor, setCursor] = useState(() => new Date());
  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const cells = useMemo(() => monthGrid(year, month), [year, month]);
  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const todayTimestamp = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t.getTime();
  }, []);

  const dayData = useMemo(() => {
    const map = new Map<string, { stars: number; hasData: boolean; ratio: number }>();
    if (!selectedChildId) return map;
    cells.forEach((d) => {
      if (!d) return;
      const { ratio, total } = dayCompletionRatio(tasks, completions, selectedChildId, d);
      map.set(toDateKey(d), {
        stars: starsForRatio(ratio),
        hasData: total > 0,
        ratio,
      });
    });
    return map;
  }, [cells, tasks, completions, selectedChildId]);

  const monthSummary = useMemo(() => {
    let perfect = 0;
    let logged = 0;
    dayData.forEach((v) => {
      if (v.hasData) logged++;
      if (v.stars === 5) perfect++;
    });
    return { perfect, logged };
  }, [dayData]);

  const shift = (delta: number) => {
    Haptics.selectionAsync();
    setCursor(new Date(year, month + delta, 1));
    setSelectedDay(null);
  };

  // Selected-day breakdown
  const dayBreakdown = useMemo(() => {
    if (!selectedDay || !selectedChildId) return null;
    const dKey = toDateKey(selectedDay);
    const scheduled = tasksScheduledOn(tasks, selectedChildId, selectedDay);
    const entries = scheduled.map((t) => {
      const done = completions.filter(
        (c) => c.taskId === t.id && c.childId === selectedChildId && toDateKey(c.completedAt) === dKey,
      ).length;
      const expected = expectedDailyCount(t);
      const lenient = effectiveScoringMode(t) === 'lenient';
      const fullyDone = lenient ? done >= 1 : done >= expected;
      return { task: t, done, expected, lenient, fullyDone };
    });
    const { ratio, completed, total } = dayCompletionRatio(
      tasks,
      completions,
      selectedChildId,
      selectedDay,
    );
    return { entries, ratio, completed, total };
  }, [selectedDay, selectedChildId, tasks, completions]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text }}>Calendar 📅</Text>
          <Text style={{ fontSize: 14, color: colors.textSoft, marginTop: 4 }}>
            {selectedChild?.name ?? 'Baby'}'s journey
          </Text>
        </View>

        {/* Child switcher */}
        <View style={{ marginTop: spacing.md }}>
          <ChildSwitcher />
        </View>

        {/* Month card */}
        <View
          style={{
            marginHorizontal: spacing.lg,
            marginTop: spacing.md,
            backgroundColor: colors.white,
            borderRadius: radius.xl,
            padding: spacing.md,
            ...shadow.card,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 6,
              marginBottom: spacing.sm,
            }}
          >
            <TouchableOpacity
              onPress={() => shift(-1)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.creamDark,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 16 }}>‹</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>
              {monthName(month)} {year}
            </Text>
            <TouchableOpacity
              onPress={() => shift(1)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.creamDark,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 16 }}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', marginBottom: 4 }}>
            {WEEK_LABELS.map((w, i) => (
              <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '600' }}>{w}</Text>
              </View>
            ))}
          </View>

          {Array.from({ length: cells.length / 7 }).map((_, row) => (
            <View key={row} style={{ flexDirection: 'row' }}>
              {cells.slice(row * 7, row * 7 + 7).map((d, i) => {
                if (!d) return <View key={`${row}-${i}`} style={{ flex: 1, aspectRatio: 1, margin: 3 }} />;
                const dKey = toDateKey(d);
                const info = dayData.get(dKey);
                const isFuture = d.getTime() > todayTimestamp;
                const isSelected = selectedDay ? toDateKey(selectedDay) === dKey : false;
                return (
                  <DayCell
                    key={`${row}-${i}`}
                    date={d.getDate()}
                    stars={info?.stars ?? 0}
                    hasData={info?.hasData ?? false}
                    isToday={dKey === todayKey}
                    isFuture={isFuture}
                    isSelected={isSelected}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedDay(d);
                    }}
                  />
                );
              })}
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={{ flexDirection: 'row', marginTop: spacing.md, paddingHorizontal: spacing.lg }}>
          <View
            style={{
              flex: 1,
              backgroundColor: colors.mint,
              borderRadius: radius.lg,
              padding: spacing.md,
              marginRight: 8,
              ...shadow.soft,
            }}
          >
            <Text style={{ fontSize: 24 }}>🌟</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 4 }}>
              {monthSummary.perfect}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSoft }}>perfect days</Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: colors.pastelBlue,
              borderRadius: radius.lg,
              padding: spacing.md,
              ...shadow.soft,
            }}
          >
            <Text style={{ fontSize: 24 }}>📈</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 4 }}>
              {monthSummary.logged}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSoft }}>days logged</Text>
          </View>
        </View>

        <View
          style={{
            marginTop: spacing.md,
            marginHorizontal: spacing.lg,
            backgroundColor: colors.white,
            borderRadius: radius.lg,
            padding: spacing.md,
            ...shadow.soft,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
            Star guide
          </Text>
          {[
            { c: colors.mint, l: '5⭐ Perfect day' },
            { c: colors.pastelBlue, l: '4⭐ Almost there' },
            { c: colors.yellow, l: '3⭐ Good progress' },
            { c: colors.peach, l: '1–2⭐ Started' },
          ].map((row) => (
            <View key={row.l} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <View
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 4,
                  backgroundColor: row.c,
                  marginRight: 8,
                }}
              />
              <Text style={{ fontSize: 12, color: colors.textSoft }}>{row.l}</Text>
            </View>
          ))}
          <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 6 }}>
            Tap any day to see what happened
          </Text>
        </View>
      </ScrollView>

      {/* Day detail modal */}
      <Modal
        visible={!!selectedDay}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedDay(null)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
          onPress={() => setSelectedDay(null)}
        >
          <Pressable
            style={{
              backgroundColor: colors.cream,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              padding: spacing.lg,
              maxHeight: '80%',
            }}
            onPress={() => {}}
          >
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: colors.textMuted,
                borderRadius: 2,
                alignSelf: 'center',
                marginBottom: spacing.md,
              }}
            />
            {selectedDay && dayBreakdown && (
              <>
                <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text }}>
                  {selectedDay.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                  <Text style={{ fontSize: 18 }}>
                    {'⭐'.repeat(starsForRatio(dayBreakdown.ratio))}
                    {'☆'.repeat(5 - starsForRatio(dayBreakdown.ratio))}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.textSoft, marginLeft: 8 }}>
                    {dayBreakdown.completed} / {dayBreakdown.total} units
                  </Text>
                </View>

                <ScrollView style={{ marginTop: spacing.md }}>
                  {dayBreakdown.entries.length === 0 && (
                    <View
                      style={{
                        backgroundColor: colors.white,
                        borderRadius: radius.lg,
                        padding: spacing.lg,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 32 }}>🌙</Text>
                      <Text style={{ fontSize: 14, color: colors.textSoft, marginTop: 6 }}>
                        No tasks were scheduled for this day
                      </Text>
                    </View>
                  )}
                  {dayBreakdown.entries.map(({ task, done, expected, lenient, fullyDone }) => (
                    <View
                      key={task.id}
                      style={{
                        backgroundColor: task.color || colors.white,
                        borderRadius: radius.lg,
                        padding: spacing.md,
                        marginBottom: 10,
                        flexDirection: 'row',
                        alignItems: 'center',
                        opacity: fullyDone ? 1 : 0.7,
                        ...shadow.soft,
                      }}
                    >
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          backgroundColor: colors.white,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                        }}
                      >
                        <Text style={{ fontSize: 22 }}>{task.icon}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>
                          {task.title}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.textSoft, marginTop: 2 }}>
                          {lenient
                            ? `Logged ${done}${done > 0 ? ' ✓' : ' — missed'}`
                            : `${done}/${expected}${fullyDone ? ' ✓' : done > 0 ? ' partial' : ' — missed'}`}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 22 }}>
                        {fullyDone ? '✅' : done > 0 ? '🟡' : '⚪'}
                      </Text>
                    </View>
                  ))}
                </ScrollView>

                <TouchableOpacity
                  onPress={() => setSelectedDay(null)}
                  style={{
                    marginTop: spacing.sm,
                    paddingVertical: 14,
                    borderRadius: radius.md,
                    backgroundColor: colors.white,
                    alignItems: 'center',
                    ...shadow.soft,
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
