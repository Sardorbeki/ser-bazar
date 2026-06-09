import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  useColorScheme,
  Platform,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useApp } from "@/contexts/AppContext";
import Colors from "@/constants/colors";

function StatCard({
  label,
  value,
  icon,
  color,
  sub,
  cardBg,
}: {
  label: string;
  value: string;
  icon: string;
  color: string;
  sub?: string;
  cardBg: string;
}) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color, backgroundColor: cardBg }]}>
      <View style={[styles.statIcon, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={[styles.statValue, { color: cardBg === "#FFFFFF" ? "#0A1628" : "#F0FFF4" }]}>{value}</Text>
        {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
      </View>
    </View>
  );
}

function QuickAction({
  label,
  icon,
  color,
  onPress,
  cardBg,
}: {
  label: string;
  icon: string;
  color: string;
  onPress: () => void;
  cardBg: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.quickAction, { opacity: pressed ? 0.75 : 1, backgroundColor: cardBg }]}
      onPress={onPress}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <Text style={[styles.quickActionLabel, { color: "#6B7A99" }]}>{label}</Text>
    </Pressable>
  );
}

function formatMoney(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + " mln";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + " ming";
  return n.toLocaleString();
}

export default function DashboardScreen() {
  const { user, orders, customers, products, payments, agents, logout, refreshData, isLoading } = useApp();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const cardBg = isDark ? Colors.dark.card : Colors.light.card;

  const today = new Date().toISOString().slice(0, 10);

  const stats = useMemo(() => {
    const todayOrders = orders.filter((o) => o.createdAt === today);
    const todaySales = todayOrders.reduce((s, o) => s + o.total, 0);
    const totalDebt = customers.reduce((s, c) => s + c.debt, 0);
    const totalOrders = orders.filter((o) => o.status !== "cancelled").length;
    const pendingOrders = orders.filter(
      (o) => o.status === "confirmed" || o.status === "shipped"
    ).length;
    const warehouseValue = products.reduce((s, p) => s + p.stock * p.price, 0);
    const lowStock = products.filter((p) => p.stock < 20).length;
    const todayPayments = payments
      .filter((p) => p.createdAt === today)
      .reduce((s, p) => s + p.amount, 0);
    return {
      todaySales,
      totalDebt,
      totalOrders,
      pendingOrders,
      warehouseValue,
      lowStock,
      todayPayments,
      todayOrdersCount: todayOrders.length,
    };
  }, [orders, customers, products, payments]);

  const recentOrders = useMemo(
    () => [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4),
    [orders]
  );

  const topAgents = useMemo(
    () => [...agents].sort((a, b) => b.fact - a.fact).slice(0, 3),
    [agents]
  );

  if (user?.role === "client") {
    const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <LinearGradient
          colors={["#061408", "#0A2010", "#16A34A"]}
          style={{ paddingTop: (Platform.OS === "web" ? 67 : insets.top) + 16, paddingBottom: 32, paddingHorizontal: 20 }}
        >
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, marginBottom: 4 }}>Xush kelibsiz</Text>
              <Text style={{ color: "#fff", fontSize: 26, fontWeight: "700" }}>{user?.name || user?.username}</Text>
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 4 }}>Ser Bazar mijoz paneli</Text>
            </View>
            <Pressable
              onPress={() => router.push("/(modals)/profile" as any)}
              style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", marginLeft: 12 }}
            >
              <Ionicons name="person-outline" size={20} color="#fff" />
            </Pressable>
          </View>
        </LinearGradient>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: bottomPad + 80 }}>
          <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
            Bo'limlar
          </Text>

          <Pressable
            onPress={() => router.navigate("/(tabs)/catalog" as any)}
            style={({ pressed }) => [{
              backgroundColor: Colors.primary,
              borderRadius: 18,
              padding: 24,
              opacity: pressed ? 0.9 : 1,
              ...(Platform.OS === "web"
                ? { boxShadow: "0 4px 20px rgba(34,197,94,0.3)" }
                : { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 }),
            }]}
          >
            <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <Ionicons name="grid" size={28} color="#fff" />
            </View>
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>Mahsulotlar</Text>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, marginTop: 4 }}>Katalogni ko'rish va buyurtma berish</Text>
            <View style={{ marginTop: 16, flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: "600" }}>Ochish</Text>
              <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.8)" />
            </View>
          </Pressable>

          <Pressable
            onPress={() => router.navigate("/(tabs)/sales" as any)}
            style={({ pressed }) => [{
              backgroundColor: "#1E6FD9",
              borderRadius: 18,
              padding: 24,
              opacity: pressed ? 0.9 : 1,
              ...(Platform.OS === "web"
                ? { boxShadow: "0 4px 20px rgba(30,111,217,0.3)" }
                : { shadowColor: "#1E6FD9", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 }),
            }]}
          >
            <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <Ionicons name="cart" size={28} color="#fff" />
            </View>
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>Buyurtmalarim</Text>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, marginTop: 4 }}>Barcha buyurtmalarni ko'rish</Text>
            <View style={{ marginTop: 16, flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: "600" }}>Ochish</Text>
              <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.8)" />
            </View>
          </Pressable>

          <Pressable
            onPress={() => { logout(); }}
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: Colors.danger + "60", backgroundColor: Colors.danger + "10" }}
          >
            <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
            <Text style={{ color: Colors.danger, fontSize: 15, fontWeight: "600" }}>Tizimdan chiqish</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  const statusColor: Record<string, string> = {
    draft: "#9CA3B8",
    confirmed: "#1E6FD9",
    shipped: Colors.warning,
    delivered: Colors.accent,
    cancelled: Colors.danger,
  };
  const statusLabel: Record<string, string> = {
    draft: "Qoralama",
    confirmed: "Tasdiqlangan",
    shipped: "Yo'lda",
    delivered: "Yetkazildi",
    cancelled: "Bekor",
  };

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={["#061408", "#0A2010", "#16A34A"]}
        style={[styles.header, { paddingTop: topPadding + 16 }]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerGreeting}>Xush kelibsiz</Text>
            <Text style={styles.headerName}>{user?.name ?? "Admin"}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable onPress={refreshData} style={styles.logoutBtn}>
              <Ionicons name="refresh-outline" size={22} color="rgba(255,255,255,0.8)" />
            </Pressable>
            <Pressable
              onPress={() => router.push("/(modals)/payment-history" as any)}
              style={styles.logoutBtn}
            >
              <Ionicons name="card-outline" size={22} color="rgba(255,255,255,0.8)" />
            </Pressable>
            <Pressable onPress={() => router.push("/(tabs)/settings")} style={styles.logoutBtn}>
              <Ionicons name="settings-outline" size={22} color="rgba(255,255,255,0.8)" />
            </Pressable>
            <Pressable onPress={logout} style={styles.logoutBtn}>
              <Ionicons name="log-out-outline" size={22} color="rgba(255,255,255,0.8)" />
            </Pressable>
          </View>
        </View>

        <View style={styles.heroCard}>
          <View>
            <Text style={styles.heroLabel}>Bugungi savdo</Text>
            <Text style={styles.heroValue}>{formatMoney(stats.todaySales)} UZS</Text>
            <Text style={styles.heroSub}>
              {stats.todayOrdersCount} ta buyurtma · {formatMoney(stats.todayPayments)} UZS to'lov
            </Text>
          </View>
          <View style={styles.heroChart}>
            <Ionicons name="trending-up" size={48} color="rgba(30,111,217,0.4)" />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshData} tintColor={Colors.primary} />}
      >
        <View style={styles.statsGrid}>
          <StatCard
            label="Jami buyurtmalar"
            value={stats.totalOrders.toString()}
            icon="receipt-outline"
            color="#1E6FD9"
            sub={`${stats.pendingOrders} ta jarayonda`}
            cardBg={cardBg}
          />
          <StatCard
            label="Umumiy qarzdorlik"
            value={formatMoney(stats.totalDebt) + " UZS"}
            icon="alert-circle-outline"
            color={Colors.danger}
            cardBg={cardBg}
          />
          <StatCard
            label="Ombor qiymati"
            value={formatMoney(stats.warehouseValue) + " UZS"}
            icon="cube-outline"
            color={Colors.accent}
            sub={stats.lowStock > 0 ? `${stats.lowStock} ta kam` : undefined}
            cardBg={cardBg}
          />
          <StatCard
            label="Savdo agentlari"
            value={agents.length.toString()}
            icon="people-outline"
            color={Colors.warning}
            cardBg={cardBg}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Tezkor amallar</Text>
        <View style={styles.quickActions}>
          <QuickAction
            label="Buyurtma"
            icon="add-circle-outline"
            color="#1E6FD9"
            onPress={() => router.push("/(modals)/add-order")}
            cardBg={cardBg}
          />
          <QuickAction
            label="To'lov"
            icon="card-outline"
            color={Colors.accent}
            onPress={() => router.push("/(modals)/add-payment")}
            cardBg={cardBg}
          />
          <QuickAction
            label="Kirim"
            icon="arrow-down-circle-outline"
            color={Colors.warning}
            onPress={() => router.push("/(modals)/warehouse-move")}
            cardBg={cardBg}
          />
          <QuickAction
            label="Qaytarma"
            icon="return-up-back-outline"
            color={Colors.danger}
            onPress={() => router.push("/(modals)/add-return" as any)}
            cardBg={cardBg}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>So'nggi buyurtmalar</Text>
          <Pressable onPress={() => router.push("/(tabs)/sales")}>
            <Text style={styles.sectionLink}>Hammasi</Text>
          </Pressable>
        </View>

        {recentOrders.map((order) => (
          <Pressable
            key={order.id}
            style={[styles.orderCard, { backgroundColor: cardBg, borderColor: theme.border }]}
            onPress={() => router.push({ pathname: "/(modals)/order-detail", params: { id: order.id } } as any)}
          >
            <View style={styles.orderCardLeft}>
              <View style={[styles.orderStatusDot, { backgroundColor: statusColor[order.status] }]} />
              <View>
                <Text style={[styles.orderNum, { color: theme.text }]}>{order.number}</Text>
                <Text style={[styles.orderCustomer, { color: theme.textSecondary }]}>
                  {order.customerName}
                </Text>
              </View>
            </View>
            <View style={styles.orderCardRight}>
              <Text style={[styles.orderTotal, { color: theme.text }]}>
                {formatMoney(order.total)} UZS
              </Text>
              <View style={[styles.orderStatusBadge, { backgroundColor: statusColor[order.status] + "20" }]}>
                <Text style={[styles.orderStatusText, { color: statusColor[order.status] }]}>
                  {statusLabel[order.status]}
                </Text>
              </View>
            </View>
          </Pressable>
        ))}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Eng yaxshi agentlar</Text>
          <Pressable onPress={() => router.push("/(tabs)/customers")}>
            <Text style={styles.sectionLink}>Barchasi</Text>
          </Pressable>
        </View>

        {topAgents.map((agent, i) => {
          const percent = agent.plan > 0 ? Math.min(100, (agent.fact / agent.plan) * 100) : 0;
          return (
            <Pressable
              key={agent.id}
              style={[styles.agentCard, { backgroundColor: cardBg, borderColor: theme.border }]}
              onPress={() => router.push({ pathname: "/(modals)/agent-detail", params: { id: agent.id } } as any)}
            >
              <View style={[styles.agentRank, { backgroundColor: i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : "#CD7F32" }]}>
                <Text style={styles.agentRankText}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.agentRow}>
                  <Text style={[styles.agentName, { color: theme.text }]}>{agent.name}</Text>
                  <Text style={[styles.agentFact, { color: Colors.accent }]}>
                    {formatMoney(agent.fact)} UZS
                  </Text>
                </View>
                <View style={styles.agentProgress}>
                  <View
                    style={[
                      styles.agentProgressFill,
                      {
                        width: `${percent}%` as any,
                        backgroundColor: percent >= 100 ? Colors.accent : Colors.primary,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.agentRegion, { color: theme.textSecondary }]}>
                  {agent.region} · {Math.round(percent)}% plan
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </Pressable>
          );
        })}

        <View style={{ height: Platform.OS === "web" ? 34 : 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerGreeting: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.5)",
  },
  headerName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCard: {
    backgroundColor: "rgba(30,111,217,0.15)",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(30,111,217,0.3)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.5)",
    marginBottom: 4,
  },
  heroValue: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.5)",
  },
  heroChart: { opacity: 0.6 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20 },
  statsGrid: { gap: 10, marginBottom: 24 },
  statCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    ...Platform.select({
      web: { boxShadow: "0px 2px 8px rgba(0,0,0,0.06)" },
      default: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    }),
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#6B7A99",
    marginBottom: 2,
  },
  statValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  statSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.danger,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 8,
  },
  sectionLink: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.primary,
  },
  quickActions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  quickAction: {
    flex: 1,
    alignItems: "center",
    gap: 8,
    padding: 14,
    borderRadius: 16,
    ...Platform.select({
      web: { boxShadow: "0px 2px 8px rgba(0,0,0,0.06)" },
      default: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    }),
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  orderCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  orderCardLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  orderStatusDot: { width: 8, height: 8, borderRadius: 4 },
  orderNum: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  orderCustomer: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  orderCardRight: { alignItems: "flex-end" },
  orderTotal: { fontSize: 14, fontFamily: "Inter_700Bold" },
  orderStatusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
  orderStatusText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  agentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  agentRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  agentRankText: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#fff" },
  agentRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  agentName: { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1 },
  agentFact: { fontSize: 14, fontFamily: "Inter_700Bold" },
  agentProgress: {
    height: 4,
    backgroundColor: "#E2E8F5",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 4,
  },
  agentProgressFill: { height: 4, borderRadius: 2 },
  agentRegion: { fontSize: 11, fontFamily: "Inter_400Regular" },
});
