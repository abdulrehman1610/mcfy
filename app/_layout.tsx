import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';
import * as SystemUI from 'expo-system-ui';
import * as SplashScreen from 'expo-splash-screen';
import { Colors } from '../src/constants/theme';
// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might cause this error, safe to ignore */
});

export default function RootLayout() {
  useEffect(() => {
    async function prepare() {
      try {
        // Force the native root view to be black immediately
        await SystemUI.setBackgroundColorAsync(Colors.background);
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the native splash screen to hide
        await SplashScreen.hideAsync();
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
        </Stack>
      </View>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
