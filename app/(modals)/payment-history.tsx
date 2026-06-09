import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  useColorScheme,
  Platform,
  TextInput,
  Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useApp } from "@/contexts/AppContext";
import Colors from "@/constants/colors";

type MethodFilter = "all" | "cash" | "card" | "transfer";
type PeriodFilter = "today" | "week" | "month" | "all";

function formatMoney(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + " mln";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + " ming";
  return n.toLocaleString();
}

const METHOD_ICONS: Record<string, string> = {
  cash: "cash-outline",
  card: "card-outline",
  transfer: "swap-horizontal-outline",
};

const METHOD_LABELS: Record<string, string> = {
  cash: "Naqd",
  card: "Karta",
  transfer: "O'tkazma",
};

const METHOD_COLORS: Record<string, string> = {
  cash: Colors.accent,
  card: Colors.primary,
  transfer: Colors.warning,
};

export default function PaymentHistoryModal() {
  const { payments } = useApp();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const bg = isDark ? Colors.dark.card : Colors.light.card;
  const border = isDark ? Colors.dark.border : Colors.light.border;

  const [methodFilter, setMethodFilter] = useState<MethodFilter>("all");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("month");
  const [search, setSearch] = useState("");

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    let list = [...payments].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    if (periodFilter === "today") {
      list = list.filter((p) => p.createdAt === todayStr);
    } else if (periodFilter === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
      list = list.filter((p) => p.createdAt >= weekAgo);
    } else if (periodFilter === "month") {
      list = list.filter((p) => p.createdAt.startsWith(todayStr.slice(0, 7)));
    }

    if (methodFilter !== "all") {
      list = list.filter((p) => p.method === methodFilter);
    }

    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((p) => p.customerName.toLowerCase().includes(s));
    }

    return list;
  }, [payments, methodFilter, periodFilter, search]);

  const totalAmount = useMemo(
    () => filtered.reduce((s, p) => s + p.amount, 0),
    [filtered]
  );

  const cashTotal = useMemo(() => filtered.filter((p) => p.method === "cash").reduce((s, p) => s + p.amount, 0), [filtered]);
  const cardTotal = useMemo(() => filtered.filter((p) => p.method === "card").reduce((s, p) => s + p.amount, 0), [filtered]);
  const transferTotal = useMemo(() => filtered.filter((p) => p.method === "transfer").reduce((s, p) => s + p.amount, 0), [filtered]);

  const handleExport = async () => {
    const lines = [
      `💳 TO'LOV TARIXI`,
      `📅 Sana: ${todayStr}`,
      ``,
      `💰 Jami: ${formatMoney(totalAmount)} UZS`,
      `  • Naqd: ${formatMoney(cashTotal)} UZS`,
      `  • Karta: ${formatMoney(cardTotal)} UZS`,
      `  • O'tkazma: ${formatMoney(transferTotal)} UZS`,
      ``,
      ...filtered.slice(0, 20).map((p) =>
        `${p.createdAt} | ${p.customerName} | ${METHOD_LABELS[p.method]} | ${formatMoney(p.amount)} UZS`
      ),
    ].join("\n");
    try {
      await Share.share({ message: lines });
    } catch {}
  };

  const periods: { key: PeriodFilter; label: string }[] = [
    { key: "today", label: "Bugun" },
    { key: "week", label: "Hafta" },
    { key: "month", label: "Oy" },
    { key: "all", label: "Jami" },
  ];

  const methods: { key: MethodFilter; label: string }[] = [
    { key: "all", label: "Barchasi" },
    { key: "cash", label: "Naqd" },
    { key: "card", label: "Karta" },
    { key: "transfer", label: "O'tkazma" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: bg, borderBottomColor: border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>To'lov tarixi</Text>
        <Pressable onPress={handleExport} style={styles.exportBtn}>
          <Ionicons name="share-outline" size={22} color={Colors.primary} />
        </Pressable>
      </View>

      {/* Summary Cards */}
      <View style={[styles.summaryRow, { backgroundColor: bg, borderBottomColor: border }]}>
        <View style={[styles.summaryCard, { backgroundColor: Colors.accent + "15" }]}>
          <Text style={[styles.summaryVal, { color: Colors.accent }]}>{formatMoney(cashTotal)}</Text>
          <Text style={[styles.summaryLbl, { color: theme.textSecondary }]}>Naqd</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: Colors.primary + "15" }]}>
          <Text style={[styles.summaryVal, { color: Colors.primary }]}>{formatMoney(cardTotal)}</Text>
          <Text style={[styles.summaryLbl, { color: theme.textSecondary }]}>Karta</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: Colors.warning + "15" }]}>
          <Text style={[styles.summaryVal, { color: Colors.warning }]}>{formatMoney(transferTotal)}</Text>
          <Text style={[styles.summaryLbl, { color: theme.textSecondary }]}>O'tkazma</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: "#0A1628" + "15" }]}>
          <Text style={[styles.summaryVal, { color: theme.text }]}>{formatMoney(totalAmount)}</Text>
          <Text style={[styles.summaryLbl, { color: theme.textSecondary }]}>Jami</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={[styles.filtersWrap, { backgroundColor: bg, borderBottomColor: border }]}>
        <FlatList
          horizontal
          data={periods}
          keyExtractor={(i) => i.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 8 }}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.filterChip, periodFilter === item.key && { backgroundColor: Colors.primary }]}
              onPress={() => setPeriodFilter(item.key)}
            >
              <Text style={[styles.filterChipText, periodFilter === item.key && { color: "#fff" }]}>{item.label}</Text>
            </Pressable>
          )}
        />
        <FlatList
          horizontal
          data={methods}
          keyExtractor={(i) => i.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.filterChip, methodFilter === item.key && { backgroundColor: Colors.primary }]}
              onPress={() => setMethodFilter(item.key)}
            >
              <Text style={[styles.filterChipText, methodFilter === item.key && { color: "#fff" }]}>{item.label}</Text>
            </Pressable>
          )}
        />
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: bg, borderBottomColor: border }]}>
        <Ionicons name="search-outline" size={16} color={theme.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          value={search}
          onChangeText={setSearch}
          placeholder="Mijoz nomi bo'yicha qidirish..."
          placeholderTextColor={theme.textMuted}
        />
        {search ? (
          <Pressable onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={16} color={theme.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        scrollEnabled={!!filtered.length}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="card-outline" size={48} color={theme.textMuted} />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>To'lovlar topilmadi</Text>
          </View>
        }
        renderItem={({ item }) => {
          const color = METHOD_COLORS[item.method] ?? Colors.primary;
          return (
            <View style={[styles.payCard, { backgroundColor: bg, borderColor: border }]}>
              <View style={[styles.payIcon, { backgroundColor: color + "20" }]}>
                <Ionicons name={METHOD_ICONS[item.method] as any} size={20} color={color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.payCustomer, { color: theme.text }]}>{item.customerName}</Text>
                <Text style={[styles.payMeta, { color: theme.textSecondary }]}>
                  {METHOD_LABELS[item.method]} · {item.createdAt}
                </Text>
                {item.note ? <Text style={[styles.payNote, { color: theme.textMuted }]}>{item.note}</Text> : null}
              </View>
              <Text style={[styles.payAmount, { color: color }]}>{formatMoney(item.amount)} UZS</Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold", flex: 1 },
  exportBtn: { padding: 8 },
  summaryRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
  },
  summaryCard: { flex: 1, borderRadius: 12, padding: 10, alignItems: "center", gap: 2 },
  summaryVal: { fontSize: 13, fontFamily: "Inter_700Bold" },
  summaryLbl: { fontSize: 10, fontFamily: "Inter_400Regular" },
  filtersWrap: { paddingTop: 10, paddingBottom: 10, gap: 6, borderBottomWidth: 1 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F0F4FF",
  },
  filterChipText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#6B7A99" },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  listContent: { padding: 16, gap: 10 },
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  payCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  payIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  payCustomer: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  payMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  payNote: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  payAmount: { fontSize: 15, fontFamily: "Inter_700Bold" },
});
