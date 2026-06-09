import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  useColorScheme,
  Platform,
  Linking,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useApp } from "@/contexts/AppContext";
import Colors from "@/constants/colors";

function formatMoney(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + " mln";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + " ming";
  return n.toLocaleString();
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: "Qoralama", color: "#9CA3B8" },
  confirmed: { label: "Tasdiqlangan", color: Colors.primary },
  shipped: { label: "Yo'lda", color: Colors.warning },
  delivered: { label: "Yetkazildi", color: Colors.accent },
  cancelled: { label: "Bekor", color: Colors.danger },
};

export default function CustomerDetailModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { customers, orders, payments, agents } = useApp();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const bg = isDark ? Colors.dark.card : Colors.light.card;
  const border = isDark ? Colors.dark.border : Colors.light.border;

  const customer = useMemo(() => customers.find((c) => c.id === id), [customers, id]);
  const customerOrders = useMemo(
    () => orders.filter((o) => o.customerId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [orders, id]
  );
  const customerPayments = useMemo(
    () => payments.filter((p) => p.customerId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [payments, id]
  );
  const agent = useMemo(
    () => customer?.agentId ? agents.find((a) => a.id === customer.agentId) : null,
    [agents, customer]
  );

  if (!customer) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: "center", alignItems: "center" }]}>
        <Ionicons name="person-outline" size={48} color={theme.textMuted} />
        <Text style={{ color: theme.textMuted, marginTop: 12, fontSize: 15 }}>Mijoz topilmadi</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: Colors.primary, fontSize: 15, fontFamily: "Inter_600SemiBold" }}>Orqaga</Text>
        </Pressable>
      </View>
    );
  }

  const deliveredOrders = customerOrders.filter((o) => o.status === "delivered").length;
  const activeOrders = customerOrders.filter((o) => o.status === "confirmed" || o.status === "shipped").length;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: bg, borderBottomColor: border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Mijoz profili</Text>
        <Pressable
          style={[styles.addPayBtn, { backgroundColor: Colors.primary }]}
          onPress={() => router.push({ pathname: "/(modals)/add-payment", params: { customerId: id } } as any)}
        >
          <Ionicons name="card-outline" size={16} color="#fff" />
          <Text style={styles.addPayBtnText}>To'lov</Text>
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Avatar & Name */}
        <View style={[styles.profileCard, { backgroundColor: bg, borderColor: border }]}>
          <View style={[styles.avatar, { backgroundColor: Colors.primary + "25" }]}>
            <Text style={[styles.avatarText, { color: Colors.primary }]}>
              {customer.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.customerName, { color: theme.text }]}>{customer.name}</Text>
            {agent && (
              <Text style={[styles.agentBadge, { color: theme.textSecondary }]}>
                <Ionicons name="briefcase-outline" size={12} /> {agent.name}
              </Text>
            )}
          </View>
          {customer.phone ? (
            <Pressable
              onPress={() => Linking.openURL(`tel:${customer.phone}`)}
              style={[styles.callBtn, { backgroundColor: Colors.primary + "20" }]}
            >
              <Ionicons name="call" size={18} color={Colors.primary} />
            </Pressable>
          ) : null}
        </View>

        {/* Contact Info */}
        <View style={[styles.section, { backgroundColor: bg, borderColor: border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>ALOQA MA'LUMOTLARI</Text>
          {customer.phone ? (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={16} color={theme.textMuted} />
              <Text style={[styles.infoText, { color: theme.text }]}>{customer.phone}</Text>
            </View>
          ) : null}
          {customer.address ? (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color={theme.textMuted} />
              <Text style={[styles.infoText, { color: theme.text }]}>{customer.address}</Text>
            </View>
          ) : null}
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color={theme.textMuted} />
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              Ro'yxatdan o'tgan: {customer.createdAt}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: Colors.accent + "15", borderColor: Colors.accent + "40" }]}>
            <Text style={[styles.statVal, { color: Colors.accent }]}>{formatMoney(customer.totalPurchases)}</Text>
            <Text style={[styles.statLbl, { color: theme.textSecondary }]}>UZS jami xarid</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: customer.debt > 0 ? Colors.danger + "15" : Colors.primary + "15", borderColor: customer.debt > 0 ? Colors.danger + "40" : Colors.primary + "40" }]}>
            <Text style={[styles.statVal, { color: customer.debt > 0 ? Colors.danger : Colors.primary }]}>
              {formatMoney(customer.debt)}
            </Text>
            <Text style={[styles.statLbl, { color: theme.textSecondary }]}>UZS qarz</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: Colors.primary + "15", borderColor: Colors.primary + "40" }]}>
            <Text style={[styles.statVal, { color: Colors.primary }]}>{customerOrders.length}</Text>
            <Text style={[styles.statLbl, { color: theme.textSecondary }]}>Jami buyurtma</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: Colors.warning + "15", borderColor: Colors.warning + "40" }]}>
            <Text style={[styles.statVal, { color: Colors.warning }]}>{activeOrders}</Text>
            <Text style={[styles.statLbl, { color: theme.textSecondary }]}>Jarayonda</Text>
          </View>
        </View>

        {/* Orders */}
        <View style={[styles.section, { backgroundColor: bg, borderColor: border }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>BUYURTMALAR TARIXI</Text>
            <Text style={[styles.countBadge, { color: theme.textMuted }]}>{customerOrders.length} ta</Text>
          </View>
          {customerOrders.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>Buyurtmalar yo'q</Text>
          ) : (
            customerOrders.slice(0, 10).map((order) => {
              const sc = STATUS_CONFIG[order.status];
              return (
                <Pressable
                  key={order.id}
                  style={[styles.orderRow, { borderBottomColor: border }]}
                  onPress={() => router.push({ pathname: "/(modals)/order-detail", params: { id: order.id } } as any)}
                >
                  <View style={[styles.statusDot, { backgroundColor: sc.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.orderNum, { color: theme.text }]}>{order.number}</Text>
                    <Text style={[styles.orderDate, { color: theme.textSecondary }]}>{order.createdAt} · {sc.label}</Text>
                  </View>
                  <Text style={[styles.orderTotal, { color: theme.text }]}>{formatMoney(order.total)} UZS</Text>
                  <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
                </Pressable>
              );
            })
          )}
        </View>

        {/* Payment History */}
        {customerPayments.length > 0 && (
          <View style={[styles.section, { backgroundColor: bg, borderColor: border }]}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>TO'LOV TARIXI</Text>
            {customerPayments.slice(0, 5).map((p) => (
              <View key={p.id} style={styles.payRow}>
                <View style={[styles.payIcon, { backgroundColor: Colors.primary + "20" }]}>
                  <Ionicons
                    name={p.method === "cash" ? "cash-outline" : p.method === "card" ? "card-outline" : "swap-horizontal-outline"}
                    size={16}
                    color={Colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.payMethod, { color: theme.text }]}>
                    {p.method === "cash" ? "Naqd" : p.method === "card" ? "Karta" : "O'tkazma"}
                  </Text>
                  <Text style={[styles.payDate, { color: theme.textSecondary }]}>{p.createdAt}</Text>
                </View>
                <Text style={[styles.payAmount, { color: Colors.primary }]}>{formatMoney(p.amount)} UZS</Text>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={styles.bottomActions}>
          <Pressable
            style={[styles.bottomBtn, { backgroundColor: Colors.primary }]}
            onPress={() => router.push({ pathname: "/(modals)/add-order", params: { customerId: id } } as any)}
          >
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text style={styles.bottomBtnText}>Buyurtma qo'shish</Text>
          </Pressable>
        </View>

        <View style={{ height: Platform.OS === "web" ? 34 : insets.bottom + 20 }} />
      </ScrollView>
    </View>
  );
}

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
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold", flex: 1 },
  addPayBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  addPayBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },
  scrollContent: { padding: 16, gap: 12 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 24, fontFamily: "Inter_700Bold" },
  customerName: { fontSize: 18, fontFamily: "Inter_700Bold" },
  agentBadge: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  callBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  section: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statBox: {
    width: "47%",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    gap: 4,
  },
  statVal: { fontSize: 20, fontFamily: "Inter_700Bold" },
  statLbl: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  countBadge: { fontSize: 12, fontFamily: "Inter_500Medium" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", paddingVertical: 8 },
  orderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  orderNum: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  orderDate: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  orderTotal: { fontSize: 13, fontFamily: "Inter_700Bold" },
  payRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  payIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  payMethod: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  payDate: { fontSize: 11, fontFamily: "Inter_400Regular" },
  payAmount: { fontSize: 13, fontFamily: "Inter_700Bold" },
  bottomActions: { gap: 10 },
  bottomBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  bottomBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
