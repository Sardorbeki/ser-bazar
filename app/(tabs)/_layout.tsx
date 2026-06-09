import { Tabs, Redirect } from "expo-router";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, useColorScheme, View } from "react-native";
import React from "react";
import { SymbolView } from "expo-symbols";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "@/contexts/AppContext";
import Colors from "@/constants/colors";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useApp();

  if (isLoading) {
    return <View style={{ flex: 1 }} />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return <>{children}</>;
}

function TabIcon({ name, color }: { name: any; color: string }) {
  return <Ionicons name={name} size={22} color={color} />;
}

function AdminTabs() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const theme = isDark ? Colors.dark : Colors.light;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: theme.tabIconDefault,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : isWeb ? theme.card : theme.card,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: theme.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={80}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.card }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Bosh sahifa",
          tabBarIcon: ({ color, focused }) => (
            Platform.OS === "ios" ? (
              <SymbolView name={focused ? "house.fill" : "house"} tintColor={color} size={22} />
            ) : (
              <TabIcon name={focused ? "home" : "home-outline"} color={color} />
            )
          ),
        }}
      />
      <Tabs.Screen
        name="warehouse"
        options={{
          title: "Ombor",
          tabBarIcon: ({ color, focused }) => (
            Platform.OS === "ios" ? (
              <SymbolView name={focused ? "shippingbox.fill" : "shippingbox"} tintColor={color} size={22} />
            ) : (
              <TabIcon name={focused ? "cube" : "cube-outline"} color={color} />
            )
          ),
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: "Savdo",
          tabBarIcon: ({ color, focused }) => (
            Platform.OS === "ios" ? (
              <SymbolView name={focused ? "cart.fill" : "cart"} tintColor={color} size={22} />
            ) : (
              <TabIcon name={focused ? "cart" : "cart-outline"} color={color} />
            )
          ),
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: "Mijozlar",
          tabBarIcon: ({ color, focused }) => (
            Platform.OS === "ios" ? (
              <SymbolView name={focused ? "person.2.fill" : "person.2"} tintColor={color} size={22} />
            ) : (
              <TabIcon name={focused ? "people" : "people-outline"} color={color} />
            )
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Hisobot",
          tabBarIcon: ({ color, focused }) => (
            Platform.OS === "ios" ? (
              <SymbolView name={focused ? "chart.bar.fill" : "chart.bar"} tintColor={color} size={22} />
            ) : (
              <TabIcon name={focused ? "bar-chart" : "bar-chart-outline"} color={color} />
            )
          ),
        }}
      />
      <Tabs.Screen name="catalog" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}

function ClientTabs() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const theme = isDark ? Colors.dark : Colors.light;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: theme.tabIconDefault,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : isWeb ? theme.card : theme.card,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: theme.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={80}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.card }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Bosh sahifa",
          tabBarIcon: ({ color, focused }) => (
            Platform.OS === "ios" ? (
              <SymbolView name={focused ? "house.fill" : "house"} tintColor={color} size={22} />
            ) : (
              <TabIcon name={focused ? "home" : "home-outline"} color={color} />
            )
          ),
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: "Mahsulotlar",
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: "Buyurtmalarim",
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen name="warehouse" options={{ href: null }} />
      <Tabs.Screen name="customers" options={{ href: null }} />
      <Tabs.Screen name="reports" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}

export default function TabLayout() {
  const { user } = useApp();
  const isClient = user?.role === "client";

  return (
    <AuthGuard>
      {isClient ? <ClientTabs /> : <AdminTabs />}
    </AuthGuard>
  );
}
