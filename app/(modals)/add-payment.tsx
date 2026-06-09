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

type Method = "cash" | "card" | "transfer";

export default function AddPaymentModal() {
  const { addPayment, customers, orders } = useApp();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const bg = isDark ? "#0F1D33" : "#FFFFFF";
  const border = isDark ? "#1A2940" : "#E2E8F5";

  const [customerId, setCustomerId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<Method>("cash");
  const [note, setNote] = useState("");

  const customerOrders = orders.filter(
    (o) => o.customerId === customerId && o.paymentStatus !== "paid" && o.status !== "cancelled"
  );

  const handleSave = () => {
    if (!customerId) {
      Alert.alert("Xato", "Mijozni tanlang");
      return;
    }
    const amt = parseInt(amount.replace(/\s/g, ""));
    if (!amt || amt <= 0) {
      Alert.alert("Xato", "To'g'ri summa kiriting");
      return;
    }
    const customer = customers.find((c) => c.id === customerId);
    addPayment({
      customerId,
      customerName: customer?.name ?? "",
      orderId: orderId || undefined,
      amount: amt,
      method,
      note: note.trim(),
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const methods: { key: Method; label: string; icon: string; color: string }[] = [
    { key: "cash", label: "Naqd", icon: "cash-outline", color: Colors.accent },
    { key: "card", label: "Karta", icon: "card-outline", color: Colors.primary },
    { key: "transfer", label: "O'tkazma", icon: "swap-horizontal-outline", color: Colors.warning },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: bg, borderBottomColor: border }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>To'lov qabul qilish</Text>
        <Pressable onPress={handleSave}>
          <Text style={[styles.saveBtn, { color: Colors.accent }]}>Saqlash</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={[styles.label, { color: theme.textSecondary }]}>Mijoz *</Text>
        {customers.map((c) => (
          <Pressable
            key={c.id}
            style={[
              styles.customerItem,
              { backgroundColor: bg, borderColor: border },
              customerId === c.id && { borderColor: Colors.accent, backgroundColor: Colors.accent + "10" },
            ]}
            onPress={() => { setCustomerId(c.id); setOrderId(""); }}
          >
            <View style={[styles.avatarCircle, { backgroundColor: Colors.primary + "20" }]}>
              <Text style={[styles.avatarText, { color: Colors.primary }]}>
                {c.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.customerName, { color: theme.text }]}>{c.name}</Text>
              {c.debt > 0 && (
                <Text style={[styles.customerDebt, { color: Colors.danger }]}>
                  Qarzi: {c.debt.toLocaleString()} UZS
                </Text>
              )}
            </View>
            {customerId === c.id && (
              <Ionicons name="checkmark-circle" size={20} color={Colors.accent} />
            )}
          </Pressable>
        ))}

        {customerId && customerOrders.length > 0 && (
          <>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Buyurtma (ixtiyoriy)</Text>
            <Pressable
              style={[styles.orderItem, { backgroundColor: bg, borderColor: border }, !orderId && { borderColor: Colors.primary }]}
              onPress={() => setOrderId("")}
            >
              <Text style={[styles.orderItemText, { color: !orderId ? Colors.primary : theme.textSecondary }]}>
                Umumiy to'lov
              </Text>
            </Pressable>
            {customerOrders.map((o) => (
              <Pressable
                key={o.id}
                style={[
                  styles.orderItem,
                  { backgroundColor: bg, borderColor: border },
                  orderId === o.id && { borderColor: Colors.primary },
                ]}
                onPress={() => setOrderId(o.id)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.orderItemNum, { color: theme.text }]}>{o.number}</Text>
                  <Text style={[styles.orderItemSub, { color: theme.textSecondary }]}>
                    {o.total.toLocaleString()} UZS · Qoldi: {(o.total - o.paidAmount).toLocaleString()} UZS
                  </Text>
                </View>
                {orderId === o.id && <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />}
              </Pressable>
            ))}
          </>
        )}

        <Text style={[styles.label, { color: theme.textSecondary }]}>To'lov usuli</Text>
        <View style={styles.methodRow}>
          {methods.map((m) => (
            <Pressable
              key={m.key}
              style={[
                styles.methodBtn,
                { borderColor: border },
                method === m.key && { backgroundColor: m.color + "20", borderColor: m.color },
              ]}
              onPress={() => setMethod(m.key)}
            >
              <Ionicons name={m.icon as any} size={20} color={method === m.key ? m.color : theme.textMuted} />
              <Text style={[styles.methodLabel, { color: method === m.key ? m.color : theme.textMuted }]}>
                {m.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.label, { color: theme.textSecondary }]}>Summa *</Text>
        <View style={[styles.amountWrap, { backgroundColor: bg, borderColor: border }]}>
          <Text style={[styles.currency, { color: theme.textSecondary }]}>UZS</Text>
          <TextInput
            style={[styles.amountInput, { color: theme.text }]}
            value={amount}
            onChangeText={setAmount}
            placeholder="0"
            placeholderTextColor={theme.textMuted}
            keyboardType="numeric"
          />
        </View>

        <Text style={[styles.label, { color: theme.textSecondary }]}>Izoh</Text>
        <TextInput
          style={[styles.noteInput, { backgroundColor: bg, borderColor: border, color: theme.text }]}
          value={note}
          onChangeText={setNote}
          placeholder="Qo'shimcha ma'lumot..."
          placeholderTextColor={theme.textMuted}
          multiline
          numberOfLines={2}
        />

        <Pressable style={[styles.saveFullBtn, { backgroundColor: Colors.accent }]} onPress={handleSave}>
          <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
          <Text style={styles.saveBtnText}>To'lovni tasdiqlash</Text>
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
  scrollContent: { padding: 16, gap: 12 },
  label: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 },
  customerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  avatarCircle: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  customerName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  customerDebt: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  orderItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  orderItemText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  orderItemNum: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  orderItemSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  methodRow: { flexDirection: "row", gap: 10 },
  methodBtn: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  methodLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  amountWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  currency: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  amountInput: { flex: 1, fontSize: 24, fontFamily: "Inter_700Bold" },
  noteInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 60,
    textAlignVertical: "top",
  },
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
