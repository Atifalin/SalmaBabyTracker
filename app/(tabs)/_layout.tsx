import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { colors } from '../../src/theme';

function TabBarIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: focused ? colors.lavender : 'transparent',
      }}
    >
      <Text style={{ fontSize: 22 }}>{icon}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 0,
          elevation: 0,
          shadowColor: colors.text,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          height: 84,
          paddingBottom: 24,
          paddingTop: 10,
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 16,
          borderRadius: 28,
          marginHorizontal: 16,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ tabBarIcon: ({ focused }) => <TabBarIcon icon="🏠" focused={focused} /> }}
      />
      <Tabs.Screen
        name="profiles"
        options={{ tabBarIcon: ({ focused }) => <TabBarIcon icon="👶" focused={focused} /> }}
      />
      <Tabs.Screen
        name="calendar"
        options={{ tabBarIcon: ({ focused }) => <TabBarIcon icon="📅" focused={focused} /> }}
      />
      <Tabs.Screen
        name="rewards"
        options={{ tabBarIcon: ({ focused }) => <TabBarIcon icon="⭐" focused={focused} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ tabBarIcon: ({ focused }) => <TabBarIcon icon="⚙️" focused={focused} /> }}
      />
    </Tabs>
  );
}
