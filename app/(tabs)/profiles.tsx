import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useChildStore } from '../../src/stores/childStore';
import { colors, radius, shadow, spacing } from '../../src/theme';

const AVATAR_CHOICES = ['👶', '🧒', '👧', '👦', '🍼', '🧸', '🐣', '🦄'];
const COLOR_CHOICES = [
  colors.lavender,
  colors.pastelBlue,
  colors.mint,
  colors.peach,
  colors.yellow,
  colors.pink,
];

export default function ProfilesScreen() {
  const { children, selectedChildId, selectChild, addChild, updateChild, deleteChild } =
    useChildStore();

  const [editing, setEditing] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATAR_CHOICES[0]);
  const [themeColor, setThemeColor] = useState(COLOR_CHOICES[0]);

  const reset = () => {
    setName('');
    setAvatar(AVATAR_CHOICES[0]);
    setThemeColor(COLOR_CHOICES[0]);
    setEditing(null);
    setShowAdd(false);
  };

  const startAdd = () => {
    reset();
    setShowAdd(true);
  };

  const startEdit = (id: string) => {
    const c = children.find((x) => x.id === id);
    if (!c) return;
    setEditing(id);
    setName(c.name);
    setAvatar(c.avatar);
    setThemeColor(c.themeColor || COLOR_CHOICES[0]);
    setShowAdd(true);
  };

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Please enter a name');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (editing) {
      updateChild(editing, { name: trimmed, avatar, themeColor });
    } else {
      addChild({
        name: trimmed,
        avatar,
        themeColor,
        birthDate: new Date().toISOString(),
      });
    }
    reset();
  };

  const confirmDelete = (id: string) => {
    Alert.alert('Delete profile', 'This removes the child and their data references.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteChild(id),
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 140 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text }}>Little ones 👶</Text>
        <Text style={{ fontSize: 14, color: colors.textSoft, marginTop: 4 }}>
          Add a profile for each child you care for
        </Text>

        <View style={{ marginTop: spacing.lg }}>
          {children.map((c) => {
            const active = c.id === selectedChildId;
            return (
              <View
                key={c.id}
                style={{
                  backgroundColor: colors.white,
                  borderRadius: radius.lg,
                  padding: spacing.md,
                  marginBottom: spacing.md,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: active ? 2 : 0,
                  borderColor: active ? c.themeColor : 'transparent',
                  ...shadow.card,
                }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: c.themeColor || colors.lavender,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: spacing.md,
                  }}
                >
                  <Text style={{ fontSize: 28 }}>{c.avatar}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>{c.name}</Text>
                  <Text style={{ fontSize: 12, color: colors.textSoft, marginTop: 2 }}>
                    {active ? 'Currently active' : 'Tap to switch'}
                  </Text>
                </View>
                {!active && (
                  <TouchableOpacity
                    onPress={() => selectChild(c.id)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: radius.pill,
                      backgroundColor: colors.creamDark,
                      marginRight: 6,
                    }}
                  >
                    <Text style={{ fontSize: 12, color: colors.text, fontWeight: '600' }}>
                      Switch
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => startEdit(c.id)} style={{ padding: 6 }}>
                  <Text style={{ fontSize: 18 }}>✏️</Text>
                </TouchableOpacity>
                {children.length > 1 && (
                  <TouchableOpacity onPress={() => confirmDelete(c.id)} style={{ padding: 6 }}>
                    <Text style={{ fontSize: 18 }}>🗑️</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}

          <TouchableOpacity
            onPress={startAdd}
            style={{
              backgroundColor: colors.lavender,
              borderRadius: radius.lg,
              padding: spacing.md,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              ...shadow.soft,
            }}
          >
            <Text style={{ fontSize: 20, marginRight: 8 }}>➕</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
              Add a child
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={reset}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: colors.cream,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              padding: spacing.lg,
            }}
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
            <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text }}>
              {editing ? 'Edit profile' : 'New profile'}
            </Text>

            <Text style={{ fontSize: 13, color: colors.textSoft, marginTop: spacing.md, marginBottom: 6 }}>
              Name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Their name"
              placeholderTextColor={colors.textMuted}
              style={{
                backgroundColor: colors.white,
                borderRadius: radius.md,
                padding: 14,
                fontSize: 16,
                color: colors.text,
                ...shadow.soft,
              }}
            />

            <Text style={{ fontSize: 13, color: colors.textSoft, marginTop: spacing.md, marginBottom: 6 }}>
              Avatar
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {AVATAR_CHOICES.map((a) => (
                <TouchableOpacity
                  key={a}
                  onPress={() => setAvatar(a)}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: avatar === a ? themeColor : colors.white,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 8,
                    marginBottom: 8,
                    ...shadow.soft,
                  }}
                >
                  <Text style={{ fontSize: 22 }}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontSize: 13, color: colors.textSoft, marginTop: spacing.sm, marginBottom: 6 }}>
              Theme color
            </Text>
            <View style={{ flexDirection: 'row' }}>
              {COLOR_CHOICES.map((col) => (
                <TouchableOpacity
                  key={col}
                  onPress={() => setThemeColor(col)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: col,
                    marginRight: 10,
                    borderWidth: themeColor === col ? 3 : 0,
                    borderColor: colors.text,
                  }}
                />
              ))}
            </View>

            <View style={{ flexDirection: 'row', marginTop: spacing.lg }}>
              <TouchableOpacity
                onPress={reset}
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
                onPress={save}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: radius.md,
                  backgroundColor: themeColor,
                  alignItems: 'center',
                  ...shadow.soft,
                }}
              >
                <Text style={{ fontSize: 15, color: colors.text, fontWeight: '700' }}>
                  {editing ? 'Save' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
