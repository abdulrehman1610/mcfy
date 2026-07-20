import { Tabs } from 'expo-router';
import React from 'react';
import { Home, Library, BarChart2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../src/constants/theme';
import { HapticTab } from '../../components/haptic-tab';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: 'transparent',
          height: 64,
          marginBottom: insets.bottom > 0 ? insets.bottom + 8 : 24,
          marginHorizontal: 24,
          borderRadius: 32,
          borderWidth: 1,
          borderColor: Colors.border,
          position: 'absolute',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        tabBarItemStyle: {
          height: 64,
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: -4,
          marginBottom: 8,
        },
        tabBarIconStyle: {
          marginTop: 8,
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ color, size }) => <Library size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, size }) => <BarChart2 size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
