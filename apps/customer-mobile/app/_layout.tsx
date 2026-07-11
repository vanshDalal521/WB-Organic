import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../src/stores/authStore';
import { useCartStore } from '../src/stores/cartStore';
import { colors } from '../src/constants/colors';

const queryClient = new QueryClient();

export default function RootLayout() {
  const { loadUser } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background.DEFAULT },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="product/[id]"
          options={{ headerShown: false, presentation: 'card' }}
        />
        <Stack.Screen
          name="cart"
          options={{ headerShown: false, presentation: 'card' }}
        />
        <Stack.Screen
          name="checkout"
          options={{ headerShown: false, presentation: 'card' }}
        />
        <Stack.Screen
          name="(auth)/profile-setup"
          options={{ headerShown: false, presentation: 'card' }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
