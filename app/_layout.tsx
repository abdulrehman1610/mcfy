import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Analytics } from '@vercel/analytics/react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import 'react-native-reanimated';
import * as SystemUI from 'expo-system-ui';
import * as SplashScreen from 'expo-splash-screen';
import { AlertProvider } from '../src/components/AlertProvider';
import { Colors } from '../src/constants/theme';
// Keep the splash screen visible while we fetch resources
if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync().catch(() => {
    /* reloading the app might cause this error, safe to ignore */
  });
}

export default function RootLayout() {
  useEffect(() => {
    async function prepare() {
      try {
        // Force the native/web root view to be black immediately
        await SystemUI.setBackgroundColorAsync(Colors.background);
      } catch (e) {
        console.warn(e);
      } finally {
        if (Platform.OS !== 'web') {
          // Tell the native splash screen to hide
          await SplashScreen.hideAsync();
        }
      }
    }

    prepare();
  }, []);

  const customDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: Colors.primary,
      background: Colors.background,
      card: Colors.card,
      text: Colors.text,
      border: Colors.border,
      notification: Colors.secondary,
    },
  };

  return (
    <ThemeProvider value={customDarkTheme}>
      <AlertProvider>
        <View style={{ flex: 1, backgroundColor: Colors.background }}>
          <Stack screenOptions={{ 
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
            animation: 'fade', // Using a simpler fade animation helps reduce flicker
          }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen 
              name="practice/[id]" 
              options={{ 
                presentation: 'fullScreenModal',
                animation: 'fade_from_bottom',
                contentStyle: { backgroundColor: Colors.background }
              }} 
            />
            <Stack.Screen 
              name="results" 
              options={{ 
                presentation: 'fullScreenModal',
                animation: 'fade',
                contentStyle: { backgroundColor: Colors.background }
              }} 
            />
            <Stack.Screen 
              name="import-preview" 
              options={{ 
                presentation: 'modal',
                contentStyle: { backgroundColor: Colors.background }
              }} 
            />
            <Stack.Screen 
              name="paste-import" 
              options={{ 
                presentation: 'modal',
                contentStyle: { backgroundColor: Colors.background }
              }} 
            />
          </Stack>
        </View>
      </AlertProvider>
      {Platform.OS === 'web' &&
        typeof window !== 'undefined' &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1' && <Analytics />}
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
