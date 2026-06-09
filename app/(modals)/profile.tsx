import React, { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ScrollView, useColorScheme, Alert, Image, Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useApp } from "@/contexts/AppContext";
import Colors from "@/constants/colors";
import * as Haptics from "expo-haptics";

export default function ProfileModal() {
  const { user, updateCurrentUser, logout } = useApp();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const bg = isDark ? "#0A2010" : "#FFFFFF";
  const border = isDark ? "#14532D" : "#D1FAE5";

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [avatar, setAvatar] = useState(user?.avatar ?? "");
  const [loading, setLoading] = useState(false);

  const pickAvatar = async () => {
    if (Platform.OS === "web") {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.6, base64: true });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setAvatar(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
      }
    } else {
      Alert.alert("Rasm tanlash", "", [
        { text: "Galereya", onPress: async () => {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) return;
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.6, base64: true });
          if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            setAvatar(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
          }
        }},
        { text: "Kamera", onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) return;
          const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.6, base64: true });
          if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            setAvatar(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
          }
        }},
        { text: "Bekor qilish", style: "cancel" },
      ]);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert("Xato", "Ismingizni kiriting"); return; }
    setLoading(true);
    try {
      await updateCurrentUser({ name: name.trim(), phone: phone.trim(), avatar: avatar || undefined });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Saqlandi", "Profil yangilandi", [{ text: "OK", onPress: () => router.back() }]);
    } catch (e: any) {
      Alert.alert("Xato", e.message);
    } finally {
      setLoading(false);
    }
  };

  const initials = name.trim().split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: bg, borderBottomColor: border }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Profil tahrirlash</Text>
        <Pressable onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator size="small" color={Colors.primary} /> : (
            <Text style={[styles.saveBtn, { color: Colors.primary }]}>Saqlash</Text>
          )}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <Pressable onPress={pickAvatar} style={styles.avatarWrap}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: Colors.primary }]}>
                <Text style={styles.avatarInitials}>{initials || "?"}</Text>
              </View>
            )}
            <View style={[styles.avatarEditBtn, { backgroundColor: Colors.primary }]}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </Pressable>
          <Text style={[styles.avatarHint, { color: theme.textMuted }]}>Rasm o'zgartirish uchun bosing</Text>
        </View>

        {/* Role badge */}
        <View style={[styles.roleBadge, { backgroundColor: Colors.primary + "20", borderColor: Colors.primary + "40" }]}>
          <Ionicons name={user?.role === "admin" ? "shield-checkmark" : "person"} size={16} color={Colors.primary} />
          <Text style={[styles.roleText, { color: Colors.primary }]}>
            {user?.role === "admin" ? "Administrator" : "Klient"}
          </Text>
          <Text style={[styles.usernameText, { color: Colors.primaryDark }]}>@{user?.username}</Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Ism Familiya *</Text>
          <View style={[styles.inputWrap, { backgroundColor: bg, borderColor: border }]}>
            <Ionicons name="person-outline" size={18} color={theme.textMuted} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={name}
              onChangeText={setName}
              placeholder="To'liq ismingiz"
              placeholderTextColor={theme.textMuted}
              autoCapitalize="words"
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Telefon raqam</Text>
          <View style={[styles.inputWrap, { backgroundColor: bg, borderColor: border }]}>
            <Ionicons name="call-outline" size={18} color={theme.textMuted} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={phone}
              onChangeText={setPhone}
              placeholder="+998901234567"
              placeholderTextColor={theme.textMuted}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: bg, borderColor: border }]}>
          <Ionicons name="information-circle-outline" size={16} color={theme.textMuted} />
          <Text style={[styles.infoText, { color: theme.textMuted }]}>
            Login (@{user?.username}) o'zgartirib bo'lmaydi
          </Text>
        </View>

        <Pressable style={[styles.saveFullBtn, { backgroundColor: Colors.primary }]} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : (
            <>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>O'zgarishlarni saqlash</Text>
            </>
          )}
        </Pressable>

        <Pressable
          style={[styles.saveFullBtn, { backgroundColor: Colors.danger + "15", borderWidth: 1, borderColor: Colors.danger + "50" }]}
          onPress={async () => { await logout(); router.replace("/(auth)/login" as any); }}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
          <Text style={[styles.saveBtnText, { color: Colors.danger }]}>Tizimdan chiqish</Text>
        </Pressable>
        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  saveBtn: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  scrollContent: { padding: 20, gap: 16 },
  avatarSection: { alignItems: "center", gap: 10 },
  avatarWrap: { position: "relative" },
  avatar: { width: 90, height: 90, borderRadius: 45 },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center" },
  avatarInitials: { fontSize: 32, fontFamily: "Inter_700Bold", color: "#fff" },
  avatarEditBtn: { position: "absolute", bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  avatarHint: { fontSize: 12, fontFamily: "Inter_400Regular" },
  roleBadge: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, alignSelf: "center" },
  roleText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  usernameText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  fieldGroup: {},
  label: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  infoCard: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1 },
  infoText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  saveFullBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 14 },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
