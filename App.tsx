import React, { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  Manrope_300Light,
  Manrope_400Regular,
  Manrope_500Medium,
} from '@expo-google-fonts/manrope';
import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AlertProvider } from './src/components/ThemedAlert';
import { useTheme } from './src/theme';
import { useThemeStore } from './src/store/themeStore';
import { useTourStore } from './src/store/tourStore';
import { useAuthStore } from './src/store/authStore';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    Manrope_300Light,
    Manrope_400Regular,
    Manrope_500Medium,
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
  });

  const { colors, isDark } = useTheme();

  useEffect(() => {
    useThemeStore.getState().hydrate();
    useTourStore.getState().hydrate();
    useAuthStore.getState().hydrate();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.surface }}>
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: colors.surface }} onLayout={onLayoutRootView}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <AlertProvider>
            <AppNavigator />
          </AlertProvider>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
