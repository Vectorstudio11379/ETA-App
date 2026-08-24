import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from '../context/AppContext';
import { Toast } from '../components/Toast';
import { Colors } from '../constants/theme';

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="light" />
      <Toast />
      <Stack
        initialRouteName="auth/splash"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="auth/splash" options={{ headerShown: false }} />
        <Stack.Screen name="auth/onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
        <Stack.Screen name="auth/choose-country" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />

        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="instructors/index" options={{ headerShown: false }} />
        <Stack.Screen name="instructor/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="course/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="cart" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
        <Stack.Screen name="course-viewer/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="player/[lessonId]" options={{ headerShown: false }} />

        <Stack.Screen name="profile-settings" options={{ headerShown: false }} />
        <Stack.Screen name="downloads" options={{ headerShown: false }} />
        <Stack.Screen name="help-support" options={{ headerShown: false }} />
        <Stack.Screen name="premium" options={{ headerShown: false }} />
        <Stack.Screen name="gift-course" options={{ headerShown: false }} />
      </Stack>
    </AppProvider>
  );
}
