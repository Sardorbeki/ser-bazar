import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  useColorScheme,
  Platform,
  Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useApp } from "@/contexts/AppContext";
import Colors from "@/constants/colors";

type Period = "today" | "week" | "month" | "all";

function formatMoney(n: number) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + " mlrd";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + " mln";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + " ming";
  return n.toLocaleString();
}

function BarChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <View style={chartStyles.container}>
      {data.map((d, i) => (
        <View key={i} style={chartStyles.bar}>
          <Text style={[chartStyles.barValue, { color }]}>{d.value > 0 ? formatMoney(d.value) : ""}</Text>
          <View style={chartStyles.barTrack}>
            <View
              style={[
                chartStyles.barFill,
                { height: `${(d.value / max) * 100}%` as any, backgroundColor: color },
              ]}
            />
          </View>
          <Text style={chartStyles.barLabel}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "flex-end", height: 140, gap: 4 },
  bar: { flex: 1, alignItems: "center", height: "100%" },
  barValue: { fontSize: 8, fontFamily: "Inter_500Medium", marginBottom: 2, textAlign: "center" },
  barTrack: {
    flex: 1,
    width: "100%",
    backgroundColor: "#E2E8F5",
    borderRadius: 4,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: { borderRadius: 4 },
  barLabel: { fontSize: 9, fontFamily: "Inter_400Regular", color: "#6B7A99", marginTop: 4 },
});

export default function ReportsScreen() {
  const { orders, payments, products, customers, agents } = useApp();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const cardBg = isDark ? Colors.dark.card : Colors.light.card;

  const [period, setPeriod] = useState<Period>("month");

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const filterByPeriod = (dateStr: string) => {
    if (period === "today") return dateStr === todayStr;
    if (period === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
      return dateStr >= weekAgo;
    }
    if (period === "month") {
      return dateStr.startsWith(todayStr.slice(0, 7));
    }
    return true;
  };

  const periodOrders = useMemo(
    () => orders.filter((o) => filterByPeriod(o.createdAt) && o.status !== "cancelled"),
    [orders, period]
  );

  const periodPayments = useMemo(
    () => payments.filter((p) => filterByPeriod(p.createdAt)),
    [payments, period]
  );

  const stats = useMemo(() => {
    const revenue = periodOrders.reduce((s, o) => s + o.total, 0);
    const collected = periodPayments.reduce((s, p) => s + p.amount, 0);
    const ordersCount = periodOrders.length;
    const deliveredCount = periodOrders.filter((o) => o.status === "delivered").length;
    const avgOrder = ordersCount > 0 ? revenue / ordersCount : 0;
    const totalDebt = customers.reduce((s, c) => s + c.debt, 0);
    const warehouseValue = products.reduce((s, p) => s + p.stock * p.price, 0);
    const topProductsMap = new Map<string, number>();
    periodOrders.forEach((o) => {
      o.items.forEach((item) => {
        topProductsMap.set(
          item.productName,
          (topProductsMap.get(item.productName) ?? 0) + item.qty * item.price
        );
      });
    });
    const topProducts = [...topProductsMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, val]) => ({ name, val }));

    const payMethodMap = new Map<string, number>();
    periodPayments.forEach((p) => {
      payMethodMap.set(p.method, (payMethodMap.get(p.method) ?? 0) + p.amount);
    });

    return { revenue, collected, ordersCount, deliveredCount, avgOrder, totalDebt, warehouseValue, topProducts, payMethodMap };
  }, [periodOrders, periodPayments, customers, products]);

  const agentStats = useMemo(
    () =>
      agents
        .map((a) => {
          const agOrders = periodOrders.filter((o) => o.agentId === a.id);
          const agRevenue = agOrders.reduce((s, o) => s + o.total, 0);
          return { ...a, periodRevenue: agRevenue, periodOrders: agOrders.length };
        })
        .sort((a, b) => b.periodRevenue - a.periodRevenue),
    [agents, periodOrders]
  );

  const weeklyData = useMemo(() => {
    const days = ["Du", "Se", "Cho", "Pa", "Ju", "Sha", "Ya"];
    return days.map((label, i) => {
      const d = new Date(now.getTime() - (6 - i) * 86400000);
      const dStr = d.toISOString().slice(0, 10);
      const value = orders
        .filter((o) => o.createdAt === dStr && o.status !== "cancelled")
        .reduce((s, o) => s + o.total, 0);
      return { label, value };
    });
  }, [orders]);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const periodBtns: { key: Period; label: string }[] = [
    { key: "today", label: "Bugun" },
    { key: "week", label: "Hafta" },
    { key: "month", label: "Oy" },
    { key: "all", label: "Jami" },
  ];

  const payLabels: Record<string, string> = {
    cash: "Naqd",
    card: "Karta",
    transfer: "O'tkazma",
  };

  const handleExport = async () => {
    const periodLabel = periodBtns.find((b) => b.key === period)?.label ?? period;
    const lines = [
      `📊 HISOBOT — ${periodLabel.toUpperCase()}`,
      `📅 Sana: ${todayStr}`,
      ``,
      `💰 Savdo hajmi: ${formatMoney(stats.revenue)} UZS`,
      `✅ Yig'ilgan: ${formatMoney(stats.collected)} UZS`,
      `📦 Buyurtmalar: ${stats.ordersCount} ta`,
      `🚚 Yetkazildi: ${stats.deliveredCount} ta`,
      `📈 O'rtacha: ${formatMoney(stats.avgOrder)} UZS`,
      ``,
      `TO'LOV USULLARI:`,
      ...[...stats.payMethodMap.entries()].map(([m, a]) => `  • ${payLabels[m] ?? m}: ${formatMoney(a)} UZS`),
      ``,
      `TOP MAHSULOTLAR:`,
      ...stats.topProducts.map((p, i) => `  ${i + 1}. ${p.name}: ${formatMoney(p.val)} UZS`),
      ``,
      `AGENTLAR:`,
      ...agentStats.map((a, i) => `  ${i + 1}. ${a.name}: ${formatMoney(a.periodRevenue)} UZS (${a.periodOrders} buyurtma)`),
      ``,
      `OMBOR:`,
      `  Jami qiymat: ${formatMoney(stats.warehouseValue)} UZS`,
      `  Mahsulotlar: ${products.length} ta`,
      `  Umumiy qarz: ${formatMoney(stats.totalDebt)} UZS`,
    ].join("\n");
    try {
      await Share.share({ message: lines });
    } catch {}
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 16, backgroundColor: cardBg, borderBottomColor: theme.border }]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Hisobotlar</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable
              onPress={() => router.push("/(modals)/payment-history" as any)}
              style={[styles.headerBtn, { backgroundColor: Colors.primary + "15" }]}
            >
              <Ionicons name="card-outline" size={18} color={Colors.primary} />
            </Pressable>
            <Pressable
              onPress={handleExport}
              style={[styles.headerBtn, { backgroundColor: Colors.primary + "15" }]}
            >
              <Ionicons name="share-outline" size={18} color={Colors.primary} />
            </Pressable>
          </View>
        </View>
        <View style={styles.periodRow}>
          {periodBtns.map((btn) => (
            <Pressable
              key={btn.key}
              style={[styles.periodBtn, period === btn.key && styles.periodBtnActive]}
              onPress={() => setPeriod(btn.key)}
            >
              <Text style={[styles.periodBtnText, period === btn.key && styles.periodBtnTextActive]}>
                {btn.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={["#0A1628", "#1E3A6E"]} style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View>
              <Text style={styles.heroLabel}>Savdo hajmi</Text>
              <Text style={styles.heroValue}>{formatMoney(stats.revenue)} UZS</Text>
            </View>
            <View>
              <Text style={styles.heroLabel}>Yig'ildi</Text>
              <Text style={[styles.heroValue, { color: Colors.accent }]}>{formatMoney(stats.collected)} UZS</Text>
            </View>
          </View>
          <View style={styles.heroRow}>
            <View>
              <Text style={styles.heroLabel}>Buyurtmalar</Text>
              <Text style={styles.heroSubValue}>{stats.ordersCount} ta</Text>
            </View>
            <View>
              <Text style={styles.heroLabel}>Yetkazildi</Text>
              <Text style={styles.heroSubValue}>{stats.deliveredCount} ta</Text>
            </View>
            <View>
              <Text style={styles.heroLabel}>O'rtacha</Text>
              <Text style={styles.heroSubValue}>{formatMoney(stats.avgOrder)} UZS</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={[styles.section, { backgroundColor: cardBg, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Haftalik savdo grafigi</Text>
          <BarChart data={weeklyData} color={Colors.primary} />
        </View>

        <View style={[styles.section, { backgroundColor: cardBg, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>To'lov usullari</Text>
          {stats.payMethodMap.size === 0 ? (
            <Text style={[styles.emptySection, { color: theme.textMuted }]}>To'lovlar yo'q</Text>
          ) : (
            [...stats.payMethodMap.entries()].map(([method, amount]) => {
              const total = stats.collected || 1;
              const pct = Math.round((amount / total) * 100);
              const methodColor = method === "cash" ? Colors.accent : method === "card" ? Colors.primary : Colors.warning;
              return (
                <View key={method} style={styles.payRow}>
                  <View style={[styles.payDot, { backgroundColor: methodColor }]} />
                  <Text style={[styles.payLabel, { color: theme.text }]}>{payLabels[method] ?? method}</Text>
                  <View style={styles.payBar}>
                    <View style={[styles.payBarFill, { width: `${pct}%` as any, backgroundColor: methodColor }]} />
                  </View>
                  <Text style={[styles.payPct, { color: theme.textSecondary }]}>{pct}%</Text>
                  <Text style={[styles.payAmount, { color: theme.text }]}>{formatMoney(amount)}</Text>
                </View>
              );
            })
          )}
        </View>

        <View style={[styles.section, { backgroundColor: cardBg, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Top mahsulotlar</Text>
          {stats.topProducts.length === 0 ? (
            <Text style={[styles.emptySection, { color: theme.textMuted }]}>Ma'lumot yo'q</Text>
          ) : (
            stats.topProducts.map((p, i) => (
              <View key={p.name} style={styles.topRow}>
                <View style={[styles.topRank, { backgroundColor: Colors.primary + "20" }]}>
                  <Text style={[styles.topRankText, { color: Colors.primary }]}>{i + 1}</Text>
                </View>
                <Text style={[styles.topName, { color: theme.text }]} numberOfLines={1}>
                  {p.name}
                </Text>
                <Text style={[styles.topVal, { color: Colors.accent }]}>{formatMoney(p.val)} UZS</Text>
              </View>
            ))
          )}
        </View>

        <View style={[styles.section, { backgroundColor: cardBg, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Agentlar reytingi</Text>
          {agentStats.length === 0 ? (
            <Text style={[styles.emptySection, { color: theme.textMuted }]}>Agent yo'q</Text>
          ) : (
            agentStats.map((a, i) => {
              const pct = a.plan > 0 ? Math.min(100, (a.fact / a.plan) * 100) : 0;
              return (
                <Pressable
                  key={a.id}
                  style={styles.agentRow}
                  onPress={() => router.push({ pathname: "/(modals)/agent-detail", params: { id: a.id } } as any)}
                >
                  <Text style={[styles.agentRankNum, { color: theme.textSecondary }]}>#{i + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={styles.agentRowTop}>
                      <Text style={[styles.agentName, { color: theme.text }]}>{a.name}</Text>
                      <Text style={[styles.agentRevenue, { color: Colors.accent }]}>
                        {formatMoney(a.periodRevenue)} UZS
                      </Text>
                    </View>
                    <Text style={[styles.agentSub, { color: theme.textSecondary }]}>
                      {a.periodOrders} ta buyurtma · Plan: {Math.round(pct)}%
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
                </Pressable>
              );
            })
          )}
        </View>

        <View style={[styles.section, { backgroundColor: cardBg, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Ombor holati</Text>
          <View style={styles.warehouseStats}>
            <View style={styles.warehouseStat}>
              <Text style={[styles.wsLabel, { color: theme.textSecondary }]}>Jami qiymat</Text>
              <Text style={[styles.wsValue, { color: theme.text }]}>{formatMoney(stats.warehouseValue)} UZS</Text>
            </View>
            <View style={styles.warehouseStat}>
              <Text style={[styles.wsLabel, { color: theme.textSecondary }]}>Mahsulotlar</Text>
              <Text style={[styles.wsValue, { color: theme.text }]}>{products.length} ta</Text>
            </View>
            <View style={styles.warehouseStat}>
              <Text style={[styles.wsLabel, { color: theme.textSecondary }]}>Umumiy qarz</Text>
              <Text style={[styles.wsValue, { color: Colors.danger }]}>{formatMoney(stats.totalDebt)} UZS</Text>
            </View>
            <View style={styles.warehouseStat}>
              <Text style={[styles.wsLabel, { color: theme.textSecondary }]}>Mijozlar</Text>
              <Text style={[styles.wsValue, { color: theme.text }]}>{customers.length} ta</Text>
            </View>
          </View>
        </View>

        <View style={{ height: Platform.OS === "web" ? 34 : 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold" },
  headerBtn: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  periodRow: { flexDirection: "row", gap: 8 },
  periodBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F0F4FF",
  },
  periodBtnActive: { backgroundColor: Colors.primary },
  periodBtnText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#6B7A99" },
  periodBtnTextActive: { color: "#fff" },
  scrollContent: { padding: 16, gap: 14 },
  heroCard: { borderRadius: 20, padding: 20, gap: 14 },
  heroRow: { flexDirection: "row", justifyContent: "space-between" },
  heroLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.5)", marginBottom: 4 },
  heroValue: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff" },
  heroSubValue: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  section: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 12 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 4 },
  emptySection: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", paddingVertical: 8 },
  payRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  payDot: { width: 8, height: 8, borderRadius: 4 },
  payLabel: { fontSize: 13, fontFamily: "Inter_400Regular", width: 70 },
  payBar: { flex: 1, height: 6, backgroundColor: "#E2E8F5", borderRadius: 3, overflow: "hidden" },
  payBarFill: { height: 6, borderRadius: 3 },
  payPct: { fontSize: 11, fontFamily: "Inter_400Regular", width: 30, textAlign: "right" },
  payAmount: { fontSize: 13, fontFamily: "Inter_600SemiBold", width: 70, textAlign: "right" },
  topRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  topRank: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  topRankText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  topName: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium" },
  topVal: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  agentRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  agentRankNum: { fontSize: 13, fontFamily: "Inter_400Regular", width: 24 },
  agentRowTop: { flexDirection: "row", justifyContent: "space-between" },
  agentName: { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1 },
  agentRevenue: { fontSize: 13, fontFamily: "Inter_700Bold" },
  agentSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  warehouseStats: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  warehouseStat: { width: "46%" },
  wsLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 2 },
  wsValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
});
