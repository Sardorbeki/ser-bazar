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

export default function AddCustomerModal() {
  const { addCustomer, agents } = useApp();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const bg = isDark ? Colors.dark.card : Colors.light.card;
  const border = isDark ? Colors.dark.border : Colors.light.border;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [agentId, setAgentId] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [note, setNote] = useState("");

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Xato", "Mijoz nomini kiriting");
      return;
    }
    const creditLimitNum = parseFloat(creditLimit.replace(/\s/g, "").replace(",", ".")) || 0;
    addCustomer({
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      debt: 0,
      totalPurchases: 0,
      agentId: agentId || undefined,
      creditLimit: creditLimitNum > 0 ? creditLimitNum : undefined,
      note: note.trim() || undefined,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: bg, borderBottomColor: border }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Yangi mijoz</Text>
        <Pressable onPress={handleSave}>
          <Text style={[styles.saveBtn, { color: Colors.primary }]}>Saqlash</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Field label="Nomi *" value={name} onChange={setName} placeholder="Mijoz yoki tashkilot nomi" bg={bg} border={border} theme={theme} icon="person-outline" />
        <Field label="Telefon" value={phone} onChange={setPhone} placeholder="+998 90 123 45 67" bg={bg} border={border} theme={theme} icon="call-outline" keyboardType="phone-pad" />
        <Field label="Manzil" value={address} onChange={setAddress} placeholder="Shahar, tuman, ko'cha" bg={bg} border={border} theme={theme} icon="location-outline" />

        <Text style={[styles.label, { color: theme.textSecondary }]}>Kredit limiti (UZS)</Text>
        <View style={[styles.inputWrap, { backgroundColor: bg, borderColor: border }]}>
          <Ionicons name="card-outline" size={18} color={theme.textMuted} />
          <TextInput
            style={[styles.input, { color: theme.text }]}
            value={creditLimit}
            onChangeText={setCreditLimit}
            placeholder="0 — cheksiz"
            placeholderTextColor={theme.textMuted}
            keyboardType="numeric"
          />
          <Text style={[styles.unit, { color: theme.textMuted }]}>UZS</Text>
        </View>
        {parseFloat(creditLimit) > 0 && (
          <View style={[styles.creditInfo, { backgroundColor: Colors.primary + "15", borderColor: Colors.primary + "40" }]}>
            <Ionicons name="information-circle-outline" size={14} color={Colors.primary} />
            <Text style={[styles.creditInfoText, { color: Colors.primary }]}>
              Bu mijoz maksimum {parseFloat(creditLimit).toLocaleString()} UZS gacha qarz ola oladi
            </Text>
          </View>
        )}

        <Field label="Izoh" value={note} onChange={setNote} placeholder="Qo'shimcha ma'lumot..." bg={bg} border={border} theme={theme} icon="document-text-outline" multiline />

        <Text style={[styles.label, { color: theme.textSecondary }]}>Agent</Text>
        <View style={styles.chips}>
          <Pressable
            style={[styles.chip, { borderColor: border }, !agentId && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
            onPress={() => setAgentId("")}
          >
            <Text style={[styles.chipText, { color: theme.textSecondary }, !agentId && { color: "#fff" }]}>Tayinlanmagan</Text>
          </Pressable>
          {agents.map((a) => (
            <Pressable
              key={a.id}
              style={[styles.chip, { borderColor: border }, agentId === a.id && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
              onPress={() => setAgentId(a.id)}
            >
              <Text style={[styles.chipText, { color: theme.textSecondary }, agentId === a.id && { color: "#fff" }]}>{a.name}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={[styles.saveFullBtn, { backgroundColor: Colors.primary }]} onPress={handleSave}>
          <Ionicons name="person-add-outline" size={18} color="#fff" />
          <Text style={styles.saveBtnText}>Mijoz qo'shish</Text>
        </Pressable>

        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
    </View>
  );
}

function Field({ label, value, onChange, placeholder, bg, border, theme, icon, keyboardType, multiline }: any) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={[fieldStyles.label, { color: theme.textSecondary }]}>{label}</Text>
      <View style={[fieldStyles.inputWrap, { backgroundColor: bg, borderColor: border }]}>
        <Ionicons name={icon} size={18} color={theme.textMuted} />
        <TextInput
          style={[fieldStyles.input, { color: theme.text }]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={theme.textMuted}
          keyboardType={keyboardType ?? "default"}
          multiline={multiline}
        />
      </View>
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
});

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
  label: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  unit: { fontSize: 13, fontFamily: "Inter_500Medium" },
  creditInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  creditInfoText: { fontSize: 12, fontFamily: "Inter_500Medium", flex: 1 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
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
