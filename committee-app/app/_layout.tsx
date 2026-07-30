import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useState, useEffect } from 'react';
import { initializeAuth } from '../services/api';

export default function RootLayout() {
  const [authInitialized, setAuthInitialized] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    ...Ionicons.font,
  });
  usePushNotifications();

  useEffect(() => {
    initializeAuth().then(() => setAuthInitialized(true));
  }, []);

  if ((!fontsLoaded && !fontError) || !authInitialized) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F0F1A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0F0F1A' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/register" />
        <Stack.Screen name="(main)" />
      </Stack>
    </SafeAreaProvider>
  );
}
