import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  useColorScheme,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useApp } from "@/contexts/AppContext";
import Colors from "@/constants/colors";
import * as Haptics from "expo-haptics";

export default function AddAgentModal() {
  const { addAgent } = useApp();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const bg = isDark ? "#0F1D33" : "#FFFFFF";
  const border = isDark ? "#1A2940" : "#E2E8F5";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [region, setRegion] = useState("");
  const [plan, setPlan] = useState("");

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Xato", "Agent nomini kiriting");
      return;
    }
    addAgent({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      region: region.trim(),
      plan: parseInt(plan) || 0,
      fact: 0,
      customers: 0,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const fieldStyle = (bg: string, border: string, theme: any) => ({
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: bg,
    borderColor: border,
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: bg, borderBottomColor: border }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Yangi agent</Text>
        <Pressable onPress={handleSave}>
          <Text style={[styles.saveBtn, { color: Colors.primary }]}>Saqlash</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {[
          { label: "Ism Familya *", value: name, onChange: setName, placeholder: "To'liq ism", icon: "person-outline", keyboardType: "default" },
          { label: "Telefon", value: phone, onChange: setPhone, placeholder: "+998 90 000 00 00", icon: "call-outline", keyboardType: "phone-pad" },
          { label: "Email", value: email, onChange: setEmail, placeholder: "agent@mail.com", icon: "mail-outline", keyboardType: "email-address" },
          { label: "Hudud / Viloyat", value: region, onChange: setRegion, placeholder: "Toshkent, Samarqand...", icon: "location-outline", keyboardType: "default" },
          { label: "Oylik plan (UZS)", value: plan, onChange: setPlan, placeholder: "50000000", icon: "trending-up-outline", keyboardType: "numeric" },
        ].map((f) => (
          <View key={f.label} style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>{f.label}</Text>
            <View style={fieldStyle(bg, border, theme)}>
              <Ionicons name={f.icon as any} size={18} color={theme.textMuted} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={f.value}
                onChangeText={f.onChange}
                placeholder={f.placeholder}
                placeholderTextColor={theme.textMuted}
                keyboardType={f.keyboardType as any}
              />
            </View>
          </View>
        ))}

        <Pressable style={[styles.saveFullBtn, { backgroundColor: Colors.warning }]} onPress={handleSave}>
          <Ionicons name="person-add-outline" size={18} color="#fff" />
          <Text style={styles.saveBtnText}>Agent qo'shish</Text>
        </Pressable>

        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  saveBtn: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  scrollContent: { padding: 16 },
  fieldGroup: { marginBottom: 14 },
  label: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  saveFullBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
