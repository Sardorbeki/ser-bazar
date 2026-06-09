import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  TextInput,
  useColorScheme,
  Platform,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useApp } from "@/contexts/AppContext";
import Colors from "@/constants/colors";

type FilterStatus = "all" | "confirmed" | "shipped" | "delivered" | "unpaid" | "draft";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  draft: { label: "Qoralama", color: "#9CA3B8", icon: "document-outline" },
  confirmed: { label: "Tasdiqlangan", color: Colors.primary, icon: "checkmark-circle-outline" },
  shipped: { label: "Yo'lda", color: Colors.warning, icon: "car-outline" },
  delivered: { label: "Yetkazildi", color: Colors.accent, icon: "checkmark-done-circle-outline" },
  cancelled: { label: "Bekor", color: Colors.danger, icon: "close-circle-outline" },
};

const PAYMENT_CONFIG: Record<string, { label: string; color: string }> = {
  unpaid: { label: "To'lanmagan", color: Colors.danger },
  partial: { label: "Qisman", color: Colors.warning },
  paid: { label: "To'liq", color: Colors.accent },
};

function formatMoney(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + " mln";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + " ming";
  return n.toLocaleString();
}

export default function SalesScreen() {
  const { orders, updateOrder, user, refreshData, isLoading } = useApp();
  const isClient = user?.role === "client";
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");

  const filters: { key: FilterStatus; label: string }[] = [
    { key: "all", label: "Barchasi" },
    { key: "confirmed", label: "Tasdiqlangan" },
    { key: "shipped", label: "Yo'lda" },
    { key: "delivered", label: "Yetkazildi" },
    { key: "unpaid", label: "Qarzdor" },
    { key: "draft", label: "Qoralama" },
  ];

  const myOrders = useMemo(() => {
    if (isClient) return orders.filter((o) => o.customerId === user?.id || o.customerName === user?.name);
    return orders;
  }, [orders, isClient, user]);

  const filtered = useMemo(() => {
    let list = [...myOrders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.number.toLowerCase().includes(s) ||
          o.customerName.toLowerCase().includes(s)
      );
    }
    if (filter === "unpaid") {
      list = list.filter((o) => o.paymentStatus !== "paid" && o.status !== "cancelled");
    } else if (filter !== "all") {
      list = list.filter((o) => o.status === filter);
    }
    return list;
  }, [myOrders, search, filter]);

  const totalRevenue = useMemo(
    () => myOrders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0),
    [myOrders]
  );
  const totalDebt = useMemo(
    () => myOrders.filter((o) => o.paymentStatus !== "paid" && o.status !== "cancelled").reduce((s, o) => s + (o.total - o.paidAmount), 0),
    [myOrders]
  );

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 16, backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={styles.headerRow}>
          {isClient && (
            <Pressable
              onPress={() => router.navigate("/(tabs)/" as any)}
              style={{ marginRight: 10, padding: 6, borderRadius: 10, backgroundColor: theme.background }}
            >
              <Ionicons name="home-outline" size={20} color={theme.text} />
            </Pressable>
          )}
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {isClient ? "Buyurtmalarim" : "Savdo"}
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {!isClient && (
              <Pressable
                style={[styles.iconBtn, { backgroundColor: Colors.primary + "15" }]}
                onPress={() => router.push("/(modals)/add-return" as any)}
              >
                <Ionicons name="return-up-back-outline" size={18} color={Colors.primary} />
              </Pressable>
            )}
            <Pressable
              style={[styles.addBtn, { backgroundColor: Colors.primary }]}
              onPress={() => router.push("/(modals)/add-order")}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.addBtnText}>Buyurtma</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.miniStat, { backgroundColor: Colors.primary + "10" }]}>
            <Text style={[styles.miniStatVal, { color: theme.text }]}>{myOrders.length}</Text>
            <Text style={[styles.miniStatLbl, { color: theme.textSecondary }]}>Jami buyurtma</Text>
          </View>
          <View style={[styles.miniStat, { backgroundColor: Colors.accent + "10" }]}>
            <Text style={[styles.miniStatVal, { color: theme.text }]}>{formatMoney(totalRevenue)}</Text>
            <Text style={[styles.miniStatLbl, { color: theme.textSecondary }]}>UZS savdo</Text>
          </View>
          <View style={[styles.miniStat, { backgroundColor: Colors.danger + "10" }]}>
            <Text style={[styles.miniStatVal, { color: theme.text }]}>{formatMoney(totalDebt)}</Text>
            <Text style={[styles.miniStatLbl, { color: theme.textSecondary }]}>UZS qarz</Text>
          </View>
        </View>

        <View style={[styles.searchWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="search-outline" size={16} color={theme.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            value={search}
            onChangeText={setSearch}
            placeholder="Qidirish..."
            placeholderTextColor={theme.textMuted}
          />
          {search ? (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={16} color={theme.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={[styles.filterRow, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <FlatList
          horizontal
          data={filters}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.filterChip, filter === item.key && styles.filterChipActive]}
              onPress={() => setFilter(item.key)}
            >
              <Text style={[styles.filterChipText, filter === item.key && styles.filterChipTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          )}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        scrollEnabled={!!filtered.length}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshData} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={48} color={theme.textMuted} />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>Buyurtma topilmadi</Text>
          </View>
        }
        renderItem={({ item }) => {
          const sc = STATUS_CONFIG[item.status];
          const pc = PAYMENT_CONFIG[item.paymentStatus];
          return (
            <Pressable
              style={[styles.orderCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => router.push({ pathname: "/(modals)/order-detail", params: { id: item.id } } as any)}
            >
              <View style={styles.orderHeader}>
                <View style={styles.orderHeaderLeft}>
                  <View style={[styles.statusDot, { backgroundColor: sc.color }]} />
                  <Text style={[styles.orderNum, { color: theme.text }]}>{item.number}</Text>
                  <Text style={[styles.orderDate, { color: theme.textSecondary }]}>{item.createdAt}</Text>
                </View>
                <View style={[styles.payBadge, { backgroundColor: pc.color + "20" }]}>
                  <Text style={[styles.payBadgeText, { color: pc.color }]}>{pc.label}</Text>
                </View>
              </View>

              <Text style={[styles.orderCustomer, { color: theme.text }]}>{item.customerName}</Text>
              {item.agentName ? (
                <Text style={[styles.orderAgent, { color: theme.textSecondary }]}>
                  <Ionicons name="person-outline" size={11} color={theme.textMuted} /> {item.agentName}
                </Text>
              ) : null}

              <View style={styles.orderItems}>
                {item.items.slice(0, 2).map((it, idx) => (
                  <Text key={idx} style={[styles.orderItem, { color: theme.textSecondary }]}>
                    · {it.productName} × {it.qty} {it.unit}
                  </Text>
                ))}
                {item.items.length > 2 && (
                  <Text style={[styles.orderItem, { color: theme.textMuted }]}>
                    +{item.items.length - 2} ta boshqa...
                  </Text>
                )}
              </View>

              <View style={styles.orderFooter}>
                <View>
                  <Text style={[styles.orderTotal, { color: theme.text }]}>
                    {formatMoney(item.total)} UZS
                  </Text>
                  {item.paidAmount > 0 && item.paymentStatus !== "paid" && (
                    <Text style={[styles.orderPaid, { color: theme.textSecondary }]}>
                      To'landi: {formatMoney(item.paidAmount)} UZS
                    </Text>
                  )}
                </View>
                <View style={styles.orderActions}>
                  {item.status === "confirmed" && !isClient && (
                    <Pressable
                      style={[styles.miniBtn, { backgroundColor: Colors.warning + "20" }]}
                      onPress={() => updateOrder(item.id, { status: "shipped" })}
                    >
                      <Ionicons name="car-outline" size={14} color={Colors.warning} />
                      <Text style={[styles.miniBtnText, { color: Colors.warning }]}>Jo'natish</Text>
                    </Pressable>
                  )}
                  {item.status === "shipped" && !isClient && (
                    <Pressable
                      style={[styles.miniBtn, { backgroundColor: Colors.accent + "20" }]}
                      onPress={() => updateOrder(item.id, { status: "delivered" })}
                    >
                      <Ionicons name="checkmark-circle-outline" size={14} color={Colors.accent} />
                      <Text style={[styles.miniBtnText, { color: Colors.accent }]}>Yetkazildi</Text>
                    </Pressable>
                  )}
                  {item.paymentStatus !== "paid" && !isClient && (
                    <Pressable
                      style={[styles.miniBtn, { backgroundColor: Colors.primary + "20" }]}
                      onPress={() => router.push({ pathname: "/(modals)/add-payment", params: { orderId: item.id, customerId: item.customerId } } as any)}
                    >
                      <Ionicons name="card-outline" size={14} color={Colors.primary} />
                      <Text style={[styles.miniBtnText, { color: Colors.primary }]}>To'lov</Text>
                    </Pressable>
                  )}
                  <Ionicons name="chevron-forward" size={16} color={theme.textMuted} style={{ marginLeft: 4 }} />
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold", flex: 1 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  miniStat: { flex: 1, borderRadius: 12, padding: 10, alignItems: "center", gap: 2 },
  miniStatVal: { fontSize: 14, fontFamily: "Inter_700Bold" },
  miniStatLbl: { fontSize: 10, fontFamily: "Inter_400Regular" },
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
  filterRow: { paddingVertical: 10, borderBottomWidth: 1 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F0F4FF",
  },
  filterChipActive: { backgroundColor: Colors.primary },
  filterChipText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#6B7A99" },
  filterChipTextActive: { color: "#fff" },
  listContent: { padding: 16, gap: 12, paddingBottom: 100 },
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  orderCard: { borderRadius: 16, borderWidth: 1, padding: 14 },
  orderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  orderHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  orderNum: { fontSize: 14, fontFamily: "Inter_700Bold" },
  orderDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  payBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  payBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  orderCustomer: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  orderAgent: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 8 },
  orderItems: { marginBottom: 12 },
  orderItem: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 2 },
  orderFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  orderTotal: { fontSize: 16, fontFamily: "Inter_700Bold" },
  orderPaid: { fontSize: 11, fontFamily: "Inter_400Regular" },
  orderActions: { flexDirection: "row", gap: 8, alignItems: "center" },
  miniBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  miniBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
});
