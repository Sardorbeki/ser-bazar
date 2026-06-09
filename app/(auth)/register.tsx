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

export default function RegisterScreen() {
  const { register, isAuthenticated, user } = useApp();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace("/(tabs)/catalog");
    }
  }, [isAuthenticated, user]);

  const handleRegister = async () => {
    setError("");
    if (!name.trim() || !username.trim() || !password.trim()) {
      setError("Ism va login va parol majburiy maydonlar");
      return;
    }
    if (password !== confirmPassword) {
      setError("Parollar mos kelmaydi");
      return;
    }
    if (password.length < 6) {
      setError("Parol kamida 6 ta belgi bo'lishi kerak");
      return;
    }
    setLoading(true);
    try {
      await register(name.trim(), username.trim(), phone.trim(), password);
    } catch (e: any) {
      setError(e.message ?? "Ro'yxatdan o'tishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#061408", "#0A2010", "#14532D"]} style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoSection}>
            <Image source={require("../../assets/images/ser-bazar-logo.png")} style={styles.logo} resizeMode="contain" />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ro'yxatdan o'tish</Text>
            <Text style={styles.cardSub}>Klient akkaunt yaratish</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {[
              { label: "Ism *", value: name, onChange: setName, placeholder: "To'liq ismingiz", icon: "person-outline", autoCapitalize: "words" as const },
              { label: "Login *", value: username, onChange: setUsername, placeholder: "foydalanuvchi_nomi", icon: "at-outline", autoCapitalize: "none" as const },
              { label: "Telefon", value: phone, onChange: setPhone, placeholder: "+998901234567", icon: "call-outline", autoCapitalize: "none" as const, keyboardType: "phone-pad" as const },
            ].map((f) => (
              <View key={f.label} style={styles.fieldGroup}>
                <Text style={styles.label}>{f.label}</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name={f.icon as any} size={18} color="#86EFAC" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={f.value}
                    onChangeText={(v) => { f.onChange(v); setError(""); }}
                    placeholder={f.placeholder}
                    placeholderTextColor="#4A6A5A"
                    autoCapitalize={f.autoCapitalize}
                    keyboardType={f.keyboardType}
                  />
                </View>
              </View>
            ))}

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Parol *</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color="#86EFAC" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={password}
                  onChangeText={(v) => { setPassword(v); setError(""); }}
                  placeholder="••••••"
                  placeholderTextColor="#4A6A5A"
                  secureTextEntry={!showPass}
                />
                <Pressable onPress={() => setShowPass((v) => !v)}>
                  <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={18} color="#86EFAC" />
                </Pressable>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Parolni tasdiqlang *</Text>
              <View style={[styles.inputWrap, confirmPassword && password !== confirmPassword && { borderColor: "#EF4444" }]}>
                <Ionicons name="lock-closed-outline" size={18} color="#86EFAC" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={(v) => { setConfirmPassword(v); setError(""); }}
                  placeholder="••••••"
                  placeholderTextColor="#4A6A5A"
                  secureTextEntry={!showPass}
                />
                {confirmPassword.length > 0 && (
                  <Ionicons
                    name={password === confirmPassword ? "checkmark-circle" : "close-circle"}
                    size={18}
                    color={password === confirmPassword ? "#22C55E" : "#EF4444"}
                  />
                )}
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.85 : 1 }]}
              onPress={handleRegister}
              disabled={loading}
            >
              <LinearGradient colors={["#22C55E", "#16A34A"]} style={styles.btnInner}>
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Text style={styles.btnText}>Ro'yxatdan o'tish</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </Pressable>

            <Pressable style={styles.loginLink} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={16} color="#22C55E" />
              <Text style={styles.loginLinkText}>Kirish sahifasiga qaytish</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 24, alignItems: "center", justifyContent: "center" },
  logoSection: { alignItems: "center", marginBottom: 16 },
  logo: { width: 120, height: 90 },
  card: { width: "100%", backgroundColor: "#0A2010", borderRadius: 24, padding: 24, borderWidth: 1, borderColor: "#14532D" },
  cardTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#F0FFF4", marginBottom: 4 },
  cardSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#86EFAC", marginBottom: 20, opacity: 0.7 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(239,68,68,0.12)", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16, borderWidth: 1, borderColor: "rgba(239,68,68,0.3)" },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#EF4444", flex: 1 },
  fieldGroup: { marginBottom: 14 },
  label: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#86EFAC", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5, opacity: 0.7 },
  inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#061408", borderRadius: 12, borderWidth: 1, borderColor: "#14532D", paddingHorizontal: 14, height: 50 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", color: "#F0FFF4" },
  btn: { borderRadius: 14, overflow: "hidden", marginTop: 8, marginBottom: 16 },
  btnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16 },
  btnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  loginLink: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  loginLinkText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#22C55E" },
});
