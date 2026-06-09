import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, Image,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "@/contexts/AppContext";

export default function LoginScreen() {
  const { login, isAuthenticated, user } = useApp();
  const insets = useSafeAreaInsets();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "admin") {
        router.replace("/(tabs)");
      } else {
        router.replace("/(tabs)/catalog");
      }
    }
  }, [isAuthenticated, user]);

  const handleLogin = async () => {
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("Login va parolni kiriting");
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password.trim());
    } catch (e: any) {
      setError(e.message ?? "Kirish muvaffaqiyatsiz");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#061408", "#0A2010", "#14532D"]} style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={[styles.container, { paddingTop: insets.top + 30, paddingBottom: insets.bottom + 20 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoSection}>
            <Image source={require("../../assets/images/ser-bazar-logo.png")} style={styles.logo} resizeMode="contain" />
            <Text style={styles.logoSub}>Savdo boshqaruv tizimi</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tizimga kirish</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Login</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="person-outline" size={18} color="#86EFAC" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={(v) => { setUsername(v); setError(""); }}
                  placeholder="login nomingiz"
                  placeholderTextColor="#4A6A5A"
                  autoCapitalize="none"
                  testID="username-input"
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Parol</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color="#86EFAC" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={password}
                  onChangeText={(v) => { setPassword(v); setError(""); }}
                  placeholder="••••••••"
                  placeholderTextColor="#4A6A5A"
                  secureTextEntry={!showPassword}
                  testID="password-input"
                />
                <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color="#86EFAC" />
                </Pressable>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.loginBtn, { opacity: pressed ? 0.85 : 1 }]}
              onPress={handleLogin}
              disabled={loading}
              testID="login-button"
            >
              <LinearGradient colors={["#22C55E", "#16A34A"]} style={styles.loginBtnInner}>
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Text style={styles.loginBtnText}>Kirish</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </Pressable>

            <Pressable style={styles.registerLink} onPress={() => router.push("/(auth)/register")}>
              <Text style={styles.registerLinkText}>Akkaunt yo'qmi? </Text>
              <Text style={styles.registerLinkBold}>Ro'yxatdan o'tish</Text>
            </Pressable>
          </View>

          <Text style={styles.footer}>Ser Bazar v1.0 · regos.online integratsiyasi</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 24, alignItems: "center", justifyContent: "center" },
  logoSection: { alignItems: "center", marginBottom: 28 },
  logo: { width: 180, height: 140, marginBottom: 8 },
  logoSub: { fontSize: 14, fontFamily: "Inter_400Regular", color: "rgba(134,239,172,0.7)", marginTop: 2 },
  card: { width: "100%", backgroundColor: "#0A2010", borderRadius: 24, padding: 24, borderWidth: 1, borderColor: "#14532D" },
  cardTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#F0FFF4", marginBottom: 20 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(239,68,68,0.12)", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16, borderWidth: 1, borderColor: "rgba(239,68,68,0.3)" },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#EF4444", flex: 1 },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#86EFAC", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5, opacity: 0.7 },
  inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#061408", borderRadius: 12, borderWidth: 1, borderColor: "#14532D", paddingHorizontal: 14, height: 50 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", color: "#F0FFF4" },
  eyeBtn: { padding: 4 },
  loginBtn: { borderRadius: 14, overflow: "hidden", marginTop: 8, marginBottom: 16 },
  loginBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16 },
  loginBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  registerLink: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  registerLinkText: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#86EFAC", opacity: 0.7 },
  registerLinkBold: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#22C55E" },
  footer: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(134,239,172,0.3)", marginTop: 32, textAlign: "center" },
});
