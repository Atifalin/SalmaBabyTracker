import React from 'react';
import { ScrollView, TouchableOpacity, Text } from 'react-native';
import { useChildStore } from '../stores/childStore';
import { colors, radius, shadow, spacing } from '../theme';

interface Props {
  paddingHorizontal?: number;
}

export default function ChildSwitcher({ paddingHorizontal = spacing.lg }: Props) {
  const { children, selectedChildId, selectChild } = useChildStore();
  if (children.length === 0) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal, paddingVertical: 4 }}
    >
      {children.map((c) => {
        const active = c.id === selectedChildId;
        return (
          <TouchableOpacity
            key={c.id}
            onPress={() => selectChild(c.id)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: radius.pill,
              backgroundColor: active ? c.themeColor || colors.lavender : colors.white,
              marginRight: 8,
              ...shadow.soft,
            }}
          >
            <Text style={{ fontSize: 18, marginRight: 6 }}>{c.avatar}</Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: active ? colors.text : colors.textSoft,
              }}
            >
              {c.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
