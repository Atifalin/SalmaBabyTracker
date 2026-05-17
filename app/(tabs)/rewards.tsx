import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView, Animated, Easing, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChildStore } from '../../src/stores/childStore';
import { useTaskStore } from '../../src/stores/taskStore';
import { colors, radius, shadow, spacing } from '../../src/theme';
import {
  BADGES,
  countPerfectDays,
  currentStreak,
} from '../../src/utils/stats';
import { toDateKey } from '../../src/utils/date';
import { Child, Task, TaskCompletion } from '../../src/types';

const { width: SCREEN_W } = Dimensions.get('window');

interface Level {
  name: string;
  emoji: string;
  threshold: number;
  color: string;
}

const LEVELS: Level[] = [
  { name: 'Sprout', emoji: '🌱', threshold: 0, color: colors.mint },
  { name: 'Petal', emoji: '🌸', threshold: 100, color: colors.pink },
  { name: 'Bloom', emoji: '🌺', threshold: 300, color: colors.peach },
  { name: 'Sunbeam', emoji: '☀️', threshold: 600, color: colors.yellow },
  { name: 'Starlight', emoji: '✨', threshold: 1000, color: colors.lavender },
  { name: 'Constellation', emoji: '🌌', threshold: 2000, color: colors.pastelBlue },
  { name: 'Galaxy', emoji: '🪐', threshold: 5000, color: colors.lavenderDark },
];

function levelFor(points: number) {
  let current = LEVELS[0];
  let next: Level | null = LEVELS[1] ?? null;
  for (let i = 0; i < LEVELS.length; i++) {
    if (points >= LEVELS[i].threshold) {
      current = LEVELS[i];
      next = LEVELS[i + 1] ?? null;
    }
  }
  return { current, next };
}

function Confetti({ run }: { run: boolean }) {
  const pieces = useRef(
    Array.from({ length: 14 }).map(() => ({
      v: new Animated.Value(0),
      x: Math.random() * SCREEN_W,
      delay: Math.random() * 400,
      emoji: ['🎉', '✨', '⭐', '💛', '🌟'][Math.floor(Math.random() * 5)],
      rot: Math.random() * 360,
    })),
  ).current;

  useEffect(() => {
    if (!run) return;
    Animated.stagger(
      40,
      pieces.map((p) =>
        Animated.timing(p.v, {
          toValue: 1,
          duration: 1800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
          delay: p.delay,
        }),
      ),
    ).start();
  }, [run]);

  if (!run) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', inset: 0 }}>
      {pieces.map((p, i) => {
        const translateY = p.v.interpolate({ inputRange: [0, 1], outputRange: [-20, 220] });
        const opacity = p.v.interpolate({
          inputRange: [0, 0.1, 0.8, 1],
          outputRange: [0, 1, 1, 0],
        });
        return (
          <Animated.Text
            key={i}
            style={{
              position: 'absolute',
              top: 0,
              left: p.x,
              transform: [{ translateY }, { rotate: `${p.rot}deg` }],
              opacity,
              fontSize: 18,
            }}
          >
            {p.emoji}
          </Animated.Text>
        );
      })}
    </View>
  );
}

function LevelHeroCard({
  points,
  badgesUnlocked,
  badgesTotal,
}: {
  points: number;
  badgesUnlocked: number;
  badgesTotal: number;
}) {
  const { current, next } = levelFor(points);
  const span = next ? next.threshold - current.threshold : 1;
  const progress = next ? Math.min(1, (points - current.threshold) / span) : 1;

  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulse]);
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  return (
    <View
      style={{
        marginHorizontal: spacing.lg,
        marginTop: spacing.md,
        borderRadius: radius.xl,
        padding: spacing.lg,
        backgroundColor: current.color,
        overflow: 'hidden',
        ...shadow.card,
      }}
    >
      <Confetti run={progress >= 1} />
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Animated.View
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: colors.white,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing.md,
            transform: [{ scale }],
            ...shadow.soft,
          }}
        >
          <Text style={{ fontSize: 44 }}>{current.emoji}</Text>
        </Animated.View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: colors.textSoft, fontWeight: '700', letterSpacing: 1 }}>
            FAMILY LEVEL
          </Text>
          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text, marginTop: 2 }}>
            {current.name}
          </Text>
          <Text style={{ fontSize: 13, color: colors.textSoft, marginTop: 2 }}>
            💛 {points} pts · 🏅 {badgesUnlocked}/{badgesTotal} badges
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View
        style={{
          height: 10,
          backgroundColor: 'rgba(255,255,255,0.6)',
          borderRadius: 5,
          marginTop: spacing.md,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${progress * 100}%`,
            height: '100%',
            backgroundColor: colors.text,
            opacity: 0.7,
            borderRadius: 5,
          }}
        />
      </View>
      <Text style={{ fontSize: 11, color: colors.textSoft, marginTop: 6, fontWeight: '600' }}>
        {next
          ? `${next.threshold - points} pts until ${next.emoji} ${next.name}`
          : 'Max level reached — you are stardust ✨'}
      </Text>
    </View>
  );
}

function StatTile({
  icon,
  value,
  label,
  bg,
}: {
  icon: string;
  value: string | number;
  label: string;
  bg: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: bg,
        borderRadius: radius.lg,
        padding: spacing.md,
        marginHorizontal: 4,
        ...shadow.soft,
      }}
    >
      <Text style={{ fontSize: 24 }}>{icon}</Text>
      <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 4 }}>
        {value}
      </Text>
      <Text style={{ fontSize: 11, color: colors.textSoft }}>{label}</Text>
    </View>
  );
}

function ChildCard({
  child,
  points,
  streak,
  perfectDays,
  badges,
}: {
  child: Child;
  points: number;
  streak: number;
  perfectDays: number;
  badges: number;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        borderLeftWidth: 6,
        borderLeftColor: child.themeColor || colors.lavender,
        ...shadow.soft,
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: child.themeColor || colors.lavender,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing.md,
        }}
      >
        <Text style={{ fontSize: 28 }}>{child.avatar}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{child.name}</Text>
        <View style={{ flexDirection: 'row', marginTop: 6, flexWrap: 'wrap' }}>
          <Chip icon="💛" label={`${points}`} />
          <Chip icon="🔥" label={`${streak}d`} />
          <Chip icon="🌟" label={`${perfectDays}`} />
          <Chip icon="🏅" label={`${badges}`} />
        </View>
      </View>
    </View>
  );
}

function Chip({ icon, label }: { icon: string; label: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.creamDark,
        borderRadius: radius.pill,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginRight: 6,
        marginBottom: 4,
      }}
    >
      <Text style={{ fontSize: 11, marginRight: 3 }}>{icon}</Text>
      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.text }}>{label}</Text>
    </View>
  );
}

function BadgeTile({
  icon,
  name,
  description,
  unlocked,
  index,
}: {
  icon: string;
  name: string;
  description: string;
  unlocked: boolean;
  index: number;
}) {
  const bounce = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!unlocked) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: 1,
          duration: 1800 + index * 80,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 1800 + index * 80,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [unlocked, bounce, index]);
  const translateY = bounce.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const rotate = bounce.interpolate({ inputRange: [0, 1], outputRange: ['-4deg', '4deg'] });

  return (
    <View
      style={{
        width: '31%',
        backgroundColor: unlocked ? colors.white : colors.creamDark,
        borderRadius: radius.lg,
        padding: 10,
        marginBottom: 10,
        alignItems: 'center',
        opacity: unlocked ? 1 : 0.5,
        ...(unlocked ? shadow.card : shadow.soft),
      }}
    >
      <Animated.Text
        style={{
          fontSize: 38,
          marginBottom: 4,
          transform: [{ translateY }, { rotate }],
        }}
      >
        {unlocked ? icon : '🔒'}
      </Animated.Text>
      <Text
        numberOfLines={2}
        style={{
          fontSize: 11,
          fontWeight: '700',
          color: colors.text,
          textAlign: 'center',
        }}
      >
        {name}
      </Text>
      <Text
        numberOfLines={2}
        style={{
          fontSize: 9,
          color: colors.textSoft,
          marginTop: 2,
          textAlign: 'center',
        }}
      >
        {description}
      </Text>
    </View>
  );
}

export default function RewardsScreen() {
  const { children } = useChildStore();
  const { tasks, completions } = useTaskStore();

  // Per-child computed stats
  const perChild = useMemo(() => {
    return children.map((child) => {
      const childCompletions = completions.filter((c) => c.childId === child.id);
      const points = childCompletions.reduce((s, c) => s + c.points, 0);
      const streak = currentStreak(tasks, completions, child.id);
      const perfectDays = countPerfectDays(tasks, completions, child.id);
      const unlocked = BADGES.filter((b) =>
        b.check({
          tasks,
          completions,
          childId: child.id,
          streak,
          totalPoints: points,
          perfectDays,
        }),
      ).length;
      return { child, points, streak, perfectDays, badges: unlocked };
    });
  }, [children, tasks, completions]);

  // Household aggregates
  const totalPoints = perChild.reduce((s, c) => s + c.points, 0);
  const bestStreak = perChild.reduce((s, c) => Math.max(s, c.streak), 0);
  const totalPerfectDays = perChild.reduce((s, c) => s + c.perfectDays, 0);
  const todayKey = toDateKey(new Date());
  const todayPoints = completions
    .filter((c) => toDateKey(c.completedAt) === todayKey)
    .reduce((s, c) => s + c.points, 0);

  // Household badges = unique union across kids
  const householdBadges = useMemo(() => {
    return BADGES.map((b) => {
      const unlocked = children.some((child) => {
        const childStreak = perChild.find((p) => p.child.id === child.id)?.streak ?? 0;
        const childPoints = perChild.find((p) => p.child.id === child.id)?.points ?? 0;
        const childPerfectDays = perChild.find((p) => p.child.id === child.id)?.perfectDays ?? 0;
        return b.check({
          tasks,
          completions,
          childId: child.id,
          streak: childStreak,
          totalPoints: childPoints,
          perfectDays: childPerfectDays,
        });
      });
      return { ...b, unlocked };
    });
  }, [tasks, completions, children, perChild]);

  const unlockedCount = householdBadges.filter((b) => b.unlocked).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text }}>Trophy room 🏆</Text>
          <Text style={{ fontSize: 14, color: colors.textSoft, marginTop: 4 }}>
            The whole family is doing great 💛
          </Text>
        </View>

        {/* Level hero */}
        <LevelHeroCard
          points={totalPoints}
          badgesUnlocked={unlockedCount}
          badgesTotal={BADGES.length}
        />

        {/* Family stats row */}
        <View style={{ flexDirection: 'row', marginTop: spacing.md, paddingHorizontal: spacing.md }}>
          <StatTile icon="🔥" value={bestStreak} label="best streak" bg={colors.peach} />
          <StatTile icon="🌟" value={totalPerfectDays} label="perfect days" bg={colors.mint} />
          <StatTile icon="✨" value={`+${todayPoints}`} label="today" bg={colors.pastelBlue} />
        </View>

        {/* Per child cards */}
        {children.length > 0 && (
          <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.md }}>
              By little one
            </Text>
            {perChild.map((p) => (
              <ChildCard
                key={p.child.id}
                child={p.child}
                points={p.points}
                streak={p.streak}
                perfectDays={p.perfectDays}
                badges={p.badges}
              />
            ))}
          </View>
        )}

        {/* Badges */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.sm }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: spacing.md,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
              Family badges
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSoft, fontWeight: '600' }}>
              {unlockedCount} / {BADGES.length}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {householdBadges.map((b, i) => (
              <BadgeTile
                key={b.id}
                icon={b.icon}
                name={b.name}
                description={b.description}
                unlocked={b.unlocked}
                index={i}
              />
            ))}
          </View>
        </View>

        <Text
          style={{
            fontSize: 11,
            color: colors.textMuted,
            textAlign: 'center',
            marginTop: spacing.md,
            paddingHorizontal: spacing.lg,
          }}
        >
          A badge unlocks when any child in the family earns it
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
