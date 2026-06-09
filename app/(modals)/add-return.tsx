import React, { useState, useMemo } from "react";
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

function formatMoney(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + " mln";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + " ming";
  return n.toLocaleString();
}

export default function AddReturnModal() {
  const { orders, addWarehouseMovement, updateOrder } = useApp();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const bg = isDark ? Colors.dark.card : Colors.light.card;
  const border = isDark ? Colors.dark.border : Colors.light.border;

  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [reason, setReason] = useState("");
  const [returnQtys, setReturnQtys] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

  const deliveredOrders = useMemo(
    () =>
      orders
        .filter((o) => o.status === "delivered")
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [orders]
  );

  const filteredOrders = useMemo(() => {
    if (!search.trim()) return deliveredOrders;
    const s = search.toLowerCase();
    return deliveredOrders.filter(
      (o) => o.number.toLowerCase().includes(s) || o.customerName.toLowerCase().includes(s)
    );
  }, [deliveredOrders, search]);

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId),
    [orders, selectedOrderId]
  );

  const returnTotal = useMemo(() => {
    if (!selectedOrder) return 0;
    return selectedOrder.items.reduce((s, item) => {
      const qty = parseInt(returnQtys[item.productId] ?? "0") || 0;
      return s + qty * item.price;
    }, 0);
  }, [selectedOrder, returnQtys]);

  const handleSave = () => {
    if (!selectedOrder) {
      Alert.alert("Xato", "Buyurtmani tanlang");
      return;
    }
    if (!reason.trim()) {
      Alert.alert("Xato", "Qaytarish sababini kiriting");
      return;
    }

    const hasReturn = selectedOrder.items.some(
      (item) => parseInt(returnQtys[item.productId] ?? "0") > 0
    );
    if (!hasReturn) {
      Alert.alert("Xato", "Kamida bitta mahsulot miqdorini kiriting");
      return;
    }

    const invalidItem = selectedOrder.items.find((item) => {
      const qty = parseInt(returnQtys[item.productId] ?? "0") || 0;
      return qty > item.qty;
    });
    if (invalidItem) {
      Alert.alert("Xato", `${invalidItem.productName} uchun miqdor ${invalidItem.qty} dan oshmasligi kerak`);
      return;
    }

    // Add warehouse movements for returned items
    selectedOrder.items.forEach((item) => {
      const qty = parseInt(returnQtys[item.productId] ?? "0") || 0;
      if (qty > 0) {
        addWarehouseMovement({
          type: "in",
          productId: item.productId,
          productName: item.productName,
          qty,
          unit: item.unit,
          price: item.price,
          total: qty * item.price,
          note: `Qaytarma: ${selectedOrder.number} — ${reason}`,
        });
      }
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "Muvaffaqiyatli",
      `Qaytarma qayd etildi. Mahsulotlar omborga qaytarildi.\nJami qaytarilgan summa: ${formatMoney(returnTotal)} UZS`,
      [{ text: "OK", onPress: () => router.back() }]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: bg, borderBottomColor: border }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Qaytarma (Retur)</Text>
        <Pressable onPress={handleSave}>
          <Text style={[styles.saveBtn, { color: Colors.danger }]}>Saqlash</Text>
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Select Order */}
        {!selectedOrder ? (
          <>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Buyurtmani tanlang</Text>
            <View style={[styles.searchWrap, { backgroundColor: bg, borderColor: border }]}>
              <Ionicons name="search-outline" size={16} color={theme.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                value={search}
                onChangeText={setSearch}
                placeholder="Buyurtma qidirish..."
                placeholderTextColor={theme.textMuted}
              />
            </View>
            {filteredOrders.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="receipt-outline" size={40} color={theme.textMuted} />
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                  Yetkazilgan buyurtmalar yo'q
                </Text>
              </View>
            ) : (
              filteredOrders.map((order) => (
                <Pressable
                  key={order.id}
                  style={[styles.orderCard, { backgroundColor: bg, borderColor: border }]}
                  onPress={() => setSelectedOrderId(order.id)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.orderNum, { color: theme.text }]}>{order.number}</Text>
                    <Text style={[styles.orderCustomer, { color: theme.textSecondary }]}>
                      {order.customerName} · {order.createdAt}
                    </Text>
                    <Text style={[styles.orderItems, { color: theme.textMuted }]}>
                      {order.items.map((i) => `${i.productName} ×${i.qty}`).join(", ")}
                    </Text>
                  </View>
                  <Text style={[styles.orderTotal, { color: theme.text }]}>
                    {formatMoney(order.total)} UZS
                  </Text>
                </Pressable>
              ))
            )}
          </>
        ) : (
          <>
            {/* Selected Order Info */}
            <View style={[styles.selectedOrder, { backgroundColor: Colors.warning + "15", borderColor: Colors.warning + "40" }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.orderNum, { color: theme.text }]}>{selectedOrder.number}</Text>
                <Text style={[styles.orderCustomer, { color: theme.textSecondary }]}>
                  {selectedOrder.customerName} · {selectedOrder.createdAt}
                </Text>
              </View>
              <Pressable onPress={() => { setSelectedOrderId(""); setReturnQtys({}); }}>
                <Ionicons name="close-circle" size={22} color={Colors.warning} />
              </Pressable>
            </View>

            {/* Return Items */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>Qaytariladigan mahsulotlar</Text>
            {selectedOrder.items.map((item) => {
              const qty = returnQtys[item.productId] ?? "0";
              const qtyNum = parseInt(qty) || 0;
              return (
                <View key={item.productId} style={[styles.itemCard, { backgroundColor: bg, borderColor: border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemName, { color: theme.text }]}>{item.productName}</Text>
                    <Text style={[styles.itemMeta, { color: theme.textSecondary }]}>
                      {item.price.toLocaleString()} UZS · Sotilgan: {item.qty} {item.unit}
                    </Text>
                  </View>
                  <View style={styles.qtyRow}>
                    <Pressable
                      style={[styles.qtyBtn, { backgroundColor: Colors.danger + "20" }]}
                      onPress={() => setReturnQtys((prev) => ({ ...prev, [item.productId]: String(Math.max(0, qtyNum - 1)) }))}
                    >
                      <Ionicons name="remove" size={16} color={Colors.danger} />
                    </Pressable>
                    <TextInput
                      style={[styles.qtyInput, { color: theme.text, borderColor: border }]}
                      value={qty}
                      onChangeText={(v) => setReturnQtys((prev) => ({ ...prev, [item.productId]: v }))}
                      keyboardType="numeric"
                    />
                    <Pressable
                      style={[styles.qtyBtn, { backgroundColor: Colors.warning + "20" }]}
                      onPress={() => setReturnQtys((prev) => ({ ...prev, [item.productId]: String(Math.min(item.qty, qtyNum + 1)) }))}
                    >
                      <Ionicons name="add" size={16} color={Colors.warning} />
                    </Pressable>
                  </View>
                </View>
              );
            })}

            {/* Reason */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>Qaytarish sababi *</Text>
            <TextInput
              style={[styles.reasonInput, { backgroundColor: bg, borderColor: border, color: theme.text }]}
              value={reason}
              onChangeText={setReason}
              placeholder="Masalan: Mahsulot yaroqsiz, noto'g'ri yetkazildi..."
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={3}
            />

            {/* Return Total */}
            {returnTotal > 0 && (
              <View style={[styles.totalCard, { backgroundColor: Colors.warning + "15", borderColor: Colors.warning + "40" }]}>
                <Ionicons name="refresh-outline" size={20} color={Colors.warning} />
                <Text style={[styles.totalText, { color: Colors.warning }]}>
                  Qaytarma summasi: {formatMoney(returnTotal)} UZS
                </Text>
              </View>
            )}

            <Pressable
              style={[styles.saveFullBtn, { backgroundColor: Colors.danger }]}
              onPress={handleSave}
            >
              <Ionicons name="return-up-back-outline" size={18} color="#fff" />
              <Text style={styles.saveBtnText}>Qaytarmani tasdiqlash</Text>
            </Pressable>
          </>
        )}

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
  scrollContent: { padding: 16, gap: 10 },
  label: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  emptyWrap: { alignItems: "center", paddingVertical: 30, gap: 10 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  orderCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  selectedOrder: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  orderNum: { fontSize: 14, fontFamily: "Inter_700Bold" },
  orderCustomer: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  orderItems: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  orderTotal: { fontSize: 14, fontFamily: "Inter_700Bold" },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  itemName: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  itemMeta: { fontSize: 11, fontFamily: "Inter_400Regular" },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  qtyBtn: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  qtyInput: {
    width: 40,
    height: 32,
    borderWidth: 1,
    borderRadius: 8,
    textAlign: "center",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  reasonInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 80,
    textAlignVertical: "top",
  },
  totalCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  totalText: { fontSize: 15, fontFamily: "Inter_700Bold" },
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
