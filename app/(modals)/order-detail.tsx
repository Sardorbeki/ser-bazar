import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  useColorScheme,
  Alert,
  Platform,
  Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useApp } from "@/contexts/AppContext";
import Colors from "@/constants/colors";
import * as Haptics from "expo-haptics";

function formatMoney(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + " mln";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + " ming";
  return n.toLocaleString();
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  draft: { label: "Qoralama", color: "#9CA3B8", icon: "document-outline" },
  confirmed: { label: "Tasdiqlangan", color: Colors.primary, icon: "checkmark-circle-outline" },
  shipped: { label: "Yo'lda", color: Colors.warning, icon: "car-outline" },
  delivered: { label: "Yetkazildi", color: Colors.accent, icon: "checkmark-done-circle-outline" },
  cancelled: { label: "Bekor", color: Colors.danger, icon: "close-circle-outline" },
};

const PAYMENT_CONFIG: Record<string, { label: string; color: string }> = {
  unpaid: { label: "To'lanmagan", color: Colors.danger },
  partial: { label: "Qisman to'langan", color: Colors.warning },
  paid: { label: "To'liq to'langan", color: Colors.primary },
};

export default function OrderDetailModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { orders, updateOrder, payments, user } = useApp();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const bg = isDark ? Colors.dark.card : Colors.light.card;
  const border = isDark ? Colors.dark.border : Colors.light.border;

  const order = useMemo(() => orders.find((o) => o.id === id), [orders, id]);
  const orderPayments = useMemo(
    () => payments.filter((p) => p.orderId === id),
    [payments, id]
  );

  if (!order) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: "center", alignItems: "center" }]}>
        <Ionicons name="receipt-outline" size={48} color={theme.textMuted} />
        <Text style={{ color: theme.textMuted, marginTop: 12, fontSize: 15 }}>Buyurtma topilmadi</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: Colors.primary, fontSize: 15, fontFamily: "Inter_600SemiBold" }}>Orqaga</Text>
        </Pressable>
      </View>
    );
  }

  const sc = STATUS_CONFIG[order.status];
  const pc = PAYMENT_CONFIG[order.paymentStatus];
  const remaining = order.total - order.paidAmount;
  const isAdmin = user?.role === "admin";

  const handleStatusChange = (newStatus: Order["status"]) => {
    Alert.alert(
      "Holatni o'zgartirish",
      `Buyurtmani "${STATUS_CONFIG[newStatus].label}" holatiga o'tkazasizmi?`,
      [
        { text: "Bekor", style: "cancel" },
        {
          text: "Tasdiqlash",
          onPress: () => {
            updateOrder(order.id, { status: newStatus });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      "Buyurtmani bekor qilish",
      "Bu amalni ortga qaytarib bo'lmaydi. Davom etasizmi?",
      [
        { text: "Yo'q", style: "cancel" },
        {
          text: "Bekor qilish",
          style: "destructive",
          onPress: () => {
            updateOrder(order.id, { status: "cancelled" });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    const lines = [
      `📦 BUYURTMA: ${order.number}`,
      `📅 Sana: ${order.createdAt}`,
      `👤 Mijoz: ${order.customerName}`,
      order.agentName ? `🧑‍💼 Agent: ${order.agentName}` : "",
      `📌 Holat: ${sc.label}`,
      `💳 To'lov: ${pc.label}`,
      ``,
      `MAHSULOTLAR:`,
      ...order.items.map((i) => `  • ${i.productName} × ${i.qty} ${i.unit} = ${formatMoney(i.qty * i.price)} UZS`),
      ``,
      `💰 JAMI: ${formatMoney(order.total)} UZS`,
      order.paidAmount > 0 ? `✅ To'landi: ${formatMoney(order.paidAmount)} UZS` : "",
      remaining > 0 ? `⚠️ Qoldi: ${formatMoney(remaining)} UZS` : "",
      order.note ? `📝 Izoh: ${order.note}` : "",
    ].filter(Boolean).join("\n");

    try {
      await Share.share({ message: lines });
    } catch {}
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: bg, borderBottomColor: border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{order.number}</Text>
          <Text style={[styles.headerSub, { color: theme.textSecondary }]}>{order.createdAt}</Text>
        </View>
        <Pressable onPress={handleShare} style={styles.shareBtn}>
          <Ionicons name="share-outline" size={22} color={Colors.primary} />
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status & Payment */}
        <View style={[styles.statusCard, { backgroundColor: bg, borderColor: border }]}>
          <View style={[styles.statusBadge, { backgroundColor: sc.color + "20" }]}>
            <Ionicons name={sc.icon as any} size={18} color={sc.color} />
            <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
          </View>
          <View style={[styles.payBadge, { backgroundColor: pc.color + "20" }]}>
            <Text style={[styles.payText, { color: pc.color }]}>{pc.label}</Text>
          </View>
        </View>

        {/* Customer & Agent */}
        <View style={[styles.section, { backgroundColor: bg, borderColor: border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>MIJOZ MA'LUMOTLARI</Text>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={16} color={theme.textMuted} />
            <Text style={[styles.infoText, { color: theme.text }]}>{order.customerName}</Text>
          </View>
          {order.agentName && (
            <View style={styles.infoRow}>
              <Ionicons name="briefcase-outline" size={16} color={theme.textMuted} />
              <Text style={[styles.infoText, { color: theme.text }]}>{order.agentName}</Text>
            </View>
          )}
          {order.note ? (
            <View style={styles.infoRow}>
              <Ionicons name="document-text-outline" size={16} color={theme.textMuted} />
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>{order.note}</Text>
            </View>
          ) : null}
        </View>

        {/* Items */}
        <View style={[styles.section, { backgroundColor: bg, borderColor: border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>MAHSULOTLAR ({order.items.length} ta)</Text>
          {order.items.map((item, idx) => (
            <View key={idx} style={[styles.itemRow, idx < order.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemName, { color: theme.text }]}>{item.productName}</Text>
                <Text style={[styles.itemMeta, { color: theme.textSecondary }]}>
                  {formatMoney(item.price)} UZS × {item.qty} {item.unit}
                </Text>
              </View>
              <Text style={[styles.itemTotal, { color: theme.text }]}>
                {formatMoney(item.qty * item.price)} UZS
              </Text>
            </View>
          ))}
        </View>

        {/* Financial Summary */}
        <View style={[styles.section, { backgroundColor: bg, borderColor: border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>MOLIYAVIY HOLAT</Text>
          <View style={styles.finRow}>
            <Text style={[styles.finLabel, { color: theme.textSecondary }]}>Jami summa:</Text>
            <Text style={[styles.finValue, { color: theme.text }]}>{formatMoney(order.total)} UZS</Text>
          </View>
          <View style={styles.finRow}>
            <Text style={[styles.finLabel, { color: theme.textSecondary }]}>To'langan:</Text>
            <Text style={[styles.finValue, { color: Colors.primary }]}>{formatMoney(order.paidAmount)} UZS</Text>
          </View>
          {remaining > 0 && (
            <View style={styles.finRow}>
              <Text style={[styles.finLabel, { color: theme.textSecondary }]}>Qolgan qarz:</Text>
              <Text style={[styles.finValue, { color: Colors.danger }]}>{formatMoney(remaining)} UZS</Text>
            </View>
          )}
        </View>

        {/* Payment History */}
        {orderPayments.length > 0 && (
          <View style={[styles.section, { backgroundColor: bg, borderColor: border }]}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>TO'LOV TARIXI</Text>
            {orderPayments.map((p) => (
              <View key={p.id} style={styles.payRow}>
                <View style={[styles.payMethodIcon, { backgroundColor: Colors.primary + "20" }]}>
                  <Ionicons
                    name={p.method === "cash" ? "cash-outline" : p.method === "card" ? "card-outline" : "swap-horizontal-outline"}
                    size={16}
                    color={Colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.payMethodText, { color: theme.text }]}>
                    {p.method === "cash" ? "Naqd" : p.method === "card" ? "Karta" : "O'tkazma"}
                  </Text>
                  <Text style={[styles.payDate, { color: theme.textSecondary }]}>{p.createdAt}</Text>
                </View>
                <Text style={[styles.payAmount, { color: Colors.primary }]}>{formatMoney(p.amount)} UZS</Text>
              </View>
            ))}
          </View>
        )}

        {/* Status Actions */}
        {isAdmin && order.status !== "cancelled" && order.status !== "delivered" && (
          <View style={[styles.section, { backgroundColor: bg, borderColor: border }]}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>AMALLAR</Text>
            <View style={styles.actionBtns}>
              {order.status === "draft" && (
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: Colors.primary + "20" }]}
                  onPress={() => handleStatusChange("confirmed")}
                >
                  <Ionicons name="checkmark-circle-outline" size={18} color={Colors.primary} />
                  <Text style={[styles.actionBtnText, { color: Colors.primary }]}>Tasdiqlash</Text>
                </Pressable>
              )}
              {order.status === "confirmed" && (
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: Colors.warning + "20" }]}
                  onPress={() => handleStatusChange("shipped")}
                >
                  <Ionicons name="car-outline" size={18} color={Colors.warning} />
                  <Text style={[styles.actionBtnText, { color: Colors.warning }]}>Jo'natish</Text>
                </Pressable>
              )}
              {order.status === "shipped" && (
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: Colors.accent + "20" }]}
                  onPress={() => handleStatusChange("delivered")}
                >
                  <Ionicons name="checkmark-done-circle-outline" size={18} color={Colors.accent} />
                  <Text style={[styles.actionBtnText, { color: Colors.accent }]}>Yetkazildi</Text>
                </Pressable>
              )}
              {order.paymentStatus !== "paid" && (
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: Colors.primary + "20" }]}
                  onPress={() => router.push({ pathname: "/(modals)/add-payment", params: { orderId: order.id, customerId: order.customerId } } as any)}
                >
                  <Ionicons name="card-outline" size={18} color={Colors.primary} />
                  <Text style={[styles.actionBtnText, { color: Colors.primary }]}>To'lov qabul qilish</Text>
                </Pressable>
              )}
              <Pressable
                style={[styles.actionBtn, { backgroundColor: Colors.danger + "15" }]}
                onPress={handleCancel}
              >
                <Ionicons name="close-circle-outline" size={18} color={Colors.danger} />
                <Text style={[styles.actionBtnText, { color: Colors.danger }]}>Bekor qilish</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={{ height: Platform.OS === "web" ? 34 : insets.bottom + 20 }} />
      </ScrollView>
    </View>
  );
}

type Order = {
  status: "draft" | "confirmed" | "shipped" | "delivered" | "cancelled";
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  shareBtn: { padding: 8 },
  scrollContent: { padding: 16, gap: 12 },
  statusCard: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    flexWrap: "wrap",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  payBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  payText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  section: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
  itemRow: { paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 10 },
  itemName: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  itemMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  itemTotal: { fontSize: 14, fontFamily: "Inter_700Bold" },
  finRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  finLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  finValue: { fontSize: 15, fontFamily: "Inter_700Bold" },
  payRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  payMethodIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  payMethodText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  payDate: { fontSize: 11, fontFamily: "Inter_400Regular" },
  payAmount: { fontSize: 14, fontFamily: "Inter_700Bold" },
  actionBtns: { gap: 8 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
  },
  actionBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
