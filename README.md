# Salma Baby Tracker 👶

A gentle, gamified baby-care tracker for tired parents. Built with React Native + Expo.

> Help your partner celebrate the tiny daily wins of caring for a little one — every diaper, dose and bath — with stars, streaks and badges that make the routine feel like a game.

## ✨ Features

- 🏠 **Today's care** — bouncy task cards with sparkle animations on completion
- 👶 **Multi-child profiles** — manage routines for each little one with custom avatar + theme color
- 📅 **Calendar** — monthly grid coloured by daily star score; tap any day for a full breakdown
- ⭐ **Family trophy room** — household level progression, combined badges, per-child stat cards
- ⚙️ **Smart scoring**
  - *Lenient* — diapers and feeding need just one log to count
  - *Strict* — Calcium 2× must actually be done twice
- 🗑️ **Soft delete** — archive tasks without losing history; restore anytime
- 🔒 **100% private** — no accounts, no cloud, everything stays on device (AsyncStorage)

## 🛠️ Tech stack

- Expo SDK 55 + React Native
- expo-router for navigation
- Zustand for state
- AsyncStorage for persistence
- TypeScript

## 🚀 Run it

```bash
npm install
npx expo start --ios   # or --android
```

## 🎨 Design

- Cream pastel palette with soft shadows and rounded corners
- Generous taps, large emoji, no clutter
- Built for one-handed late-night use

## 📂 Structure

```
app/(tabs)/         — Home, Profiles, Calendar, Rewards, Settings
src/components/     — Shared UI (TaskEditor, ChildSwitcher)
src/stores/         — Zustand stores (children, tasks)
src/storage/        — AsyncStorage helpers
src/utils/          — Stats, dates, badges
src/theme.ts        — Pastel design tokens
```

## 💛 Made with love

For my wife Salma, who does the hardest job in the world every day.
