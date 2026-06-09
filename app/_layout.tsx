import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { AppProvider, useApp } from "@/contexts/AppContext";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(modals)/add-product" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="(modals)/add-customer" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="(modals)/add-agent" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="(modals)/add-order" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="(modals)/add-payment" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="(modals)/add-return" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="(modals)/warehouse-move" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="(modals)/edit-product" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="(modals)/prixod" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="(modals)/profile" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="(modals)/order-detail" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="(modals)/customer-detail" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="(modals)/agent-detail" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="(modals)/payment-history" options={{ presentation: "modal", headerShown: false }} />
    </Stack>
  );
}

function RootLayoutInner() {
  const { isLoading: authLoading } = useApp();

  useEffect(() => {
    if (!authLoading) {
      SplashScreen.hideAsync();
    }
  }, [authLoading]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootLayoutNav />
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AppProvider>
            <RootLayoutInner />
          </AppProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
