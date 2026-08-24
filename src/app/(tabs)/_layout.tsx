import React from 'react';
import { Tabs } from 'expo-router';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  PlayCircleIcon,
  CompassIcon,
  BookOpen01Icon,
  FavouriteIcon,
  UserIcon,
} from '@hugeicons/core-free-icons';
import { useApp } from '../../context/AppContext';

export default function TabsLayout() {
  const { colors, themeMode } = useApp();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: themeMode === 'dark' ? '#0D0D0E' : '#FFFFFF',
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <HugeiconsIcon icon={PlayCircleIcon} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => (
            <HugeiconsIcon icon={CompassIcon} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-courses"
        options={{
          title: 'My Courses',
          tabBarIcon: ({ color, size }) => (
            <HugeiconsIcon icon={BookOpen01Icon} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: 'Wishlist',
          tabBarIcon: ({ color, size }) => (
            <HugeiconsIcon icon={FavouriteIcon} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <HugeiconsIcon icon={UserIcon} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
