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

type SubTab = "customers" | "agents";
type DebtFilter = "all" | "debt" | "noDebt";

function formatMoney(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + " mln";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + " ming";
  return n.toLocaleString();
}

export default function CustomersScreen() {
  const { customers, agents, refreshData, isLoading } = useApp();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;

  const [tab, setTab] = useState<SubTab>("customers");
  const [search, setSearch] = useState("");
  const [debtFilter, setDebtFilter] = useState<DebtFilter>("all");

  const filteredCustomers = useMemo(() => {
    let list = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search)
    );
    if (debtFilter === "debt") list = list.filter((c) => c.debt > 0);
    else if (debtFilter === "noDebt") list = list.filter((c) => c.debt === 0);
    return list.sort((a, b) => b.debt - a.debt);
  }, [customers, search, debtFilter]);

  const filteredAgents = useMemo(
    () =>
      agents
        .filter(
          (a) =>
            a.name.toLowerCase().includes(search.toLowerCase()) ||
            a.region.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => b.fact - a.fact),
    [agents, search]
  );

  const totalDebt = useMemo(
    () => customers.reduce((s, c) => s + c.debt, 0),
    [customers]
  );
  const totalPurchases = useMemo(
    () => customers.reduce((s, c) => s + c.totalPurchases, 0),
    [customers]
  );
  const debtCount = useMemo(() => customers.filter((c) => c.debt > 0).length, [customers]);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 16, backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {tab === "customers" ? "Mijozlar" : "Agentlar"}
          </Text>
          <Pressable
            style={[styles.addBtn, { backgroundColor: Colors.primary }]}
            onPress={() =>
              tab === "customers"
                ? router.push("/(modals)/add-customer")
                : router.push("/(modals)/add-agent")
            }
          >
            <Ionicons name="person-add-outline" size={16} color="#fff" />
            <Text style={styles.addBtnText}>{tab === "customers" ? "Mijoz" : "Agent"}</Text>
          </Pressable>
        </View>

        {tab === "customers" && (
          <View style={styles.statsRow}>
            <View style={[styles.miniStat, { backgroundColor: Colors.primary + "10" }]}>
              <Text style={[styles.miniStatVal, { color: theme.text }]}>{customers.length}</Text>
              <Text style={[styles.miniStatLbl, { color: theme.textSecondary }]}>Mijozlar</Text>
            </View>
            <View style={[styles.miniStat, { backgroundColor: Colors.accent + "10" }]}>
              <Text style={[styles.miniStatVal, { color: theme.text }]}>{formatMoney(totalPurchases)}</Text>
              <Text style={[styles.miniStatLbl, { color: theme.textSecondary }]}>UZS sotib oldi</Text>
            </View>
            <View style={[styles.miniStat, { backgroundColor: Colors.danger + "10" }]}>
              <Text style={[styles.miniStatVal, { color: Colors.danger }]}>{debtCount}</Text>
              <Text style={[styles.miniStatLbl, { color: theme.textSecondary }]}>Qarzdor</Text>
            </View>
          </View>
        )}

        {tab === "agents" && (
          <View style={styles.statsRow}>
            <View style={[styles.miniStat, { backgroundColor: Colors.primary + "10" }]}>
              <Text style={[styles.miniStatVal, { color: theme.text }]}>{agents.length}</Text>
              <Text style={[styles.miniStatLbl, { color: theme.textSecondary }]}>Agentlar</Text>
            </View>
            <View style={[styles.miniStat, { backgroundColor: Colors.accent + "10" }]}>
              <Text style={[styles.miniStatVal, { color: theme.text }]}>
                {formatMoney(agents.reduce((s, a) => s + a.fact, 0))}
              </Text>
              <Text style={[styles.miniStatLbl, { color: theme.textSecondary }]}>UZS fakt</Text>
            </View>
            <View style={[styles.miniStat, { backgroundColor: Colors.warning + "10" }]}>
              <Text style={[styles.miniStatVal, { color: theme.text }]}>
                {agents.length > 0
                  ? Math.round(
                      (agents.reduce((s, a) => s + a.fact, 0) /
                        Math.max(1, agents.reduce((s, a) => s + a.plan, 0))) *
                        100
                    )
                  : 0}%
              </Text>
              <Text style={[styles.miniStatLbl, { color: theme.textSecondary }]}>O'rta plan</Text>
            </View>
          </View>
        )}

        <View style={[styles.tabRow, { backgroundColor: theme.surface }]}>
          <Pressable
            style={[styles.tabBtn, tab === "customers" && [styles.tabBtnActive, { backgroundColor: theme.card }]]}
            onPress={() => setTab("customers")}
          >
            <Text style={[styles.tabBtnText, { color: tab === "customers" ? theme.text : theme.textSecondary }]}>
              Mijozlar ({customers.length})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, tab === "agents" && [styles.tabBtnActive, { backgroundColor: theme.card }]]}
            onPress={() => setTab("agents")}
          >
            <Text style={[styles.tabBtnText, { color: tab === "agents" ? theme.text : theme.textSecondary }]}>
              Agentlar ({agents.length})
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.searchArea, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
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
        {tab === "customers" && (
          <View style={styles.debtFilterRow}>
            {[
              { key: "all" as DebtFilter, label: "Barchasi" },
              { key: "debt" as DebtFilter, label: `Qarzdor (${debtCount})` },
              { key: "noDebt" as DebtFilter, label: "To'liq" },
            ].map((f) => (
              <Pressable
                key={f.key}
                style={[styles.debtChip, debtFilter === f.key && { backgroundColor: Colors.primary }]}
                onPress={() => setDebtFilter(f.key)}
              >
                <Text style={[styles.debtChipText, debtFilter === f.key && { color: "#fff" }]}>
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {tab === "customers" && (
        <FlatList
          data={filteredCustomers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          scrollEnabled={!!filteredCustomers.length}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refreshData} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color={theme.textMuted} />
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>Mijoz topilmadi</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.customerCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => router.push({ pathname: "/(modals)/customer-detail", params: { id: item.id } } as any)}
            >
              <View style={[styles.avatarCircle, { backgroundColor: Colors.primary + "20" }]}>
                <Text style={[styles.avatarText, { color: Colors.primary }]}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.customerName, { color: theme.text }]}>{item.name}</Text>
                <Text style={[styles.customerPhone, { color: theme.textSecondary }]}>
                  <Ionicons name="call-outline" size={12} /> {item.phone || "Tel yo'q"}
                </Text>
                <Text style={[styles.customerAddress, { color: theme.textMuted }]}>
                  <Ionicons name="location-outline" size={12} /> {item.address || "Manzil yo'q"}
                </Text>
              </View>
              <View style={styles.customerRight}>
                {item.debt > 0 ? (
                  <View style={[styles.debtBadge, { backgroundColor: Colors.danger + "15" }]}>
                    <Text style={[styles.debtText, { color: Colors.danger }]}>
                      -{formatMoney(item.debt)}
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.debtBadge, { backgroundColor: Colors.accent + "15" }]}>
                    <Ionicons name="checkmark-circle" size={14} color={Colors.accent} />
                  </View>
                )}
                <Text style={[styles.totalPurchases, { color: theme.textSecondary }]}>
                  {formatMoney(item.totalPurchases)} UZS
                </Text>
                <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
              </View>
            </Pressable>
          )}
        />
      )}

      {tab === "agents" && (
        <FlatList
          data={filteredAgents}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          scrollEnabled={!!filteredAgents.length}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refreshData} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="person-outline" size={48} color={theme.textMuted} />
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>Agent topilmadi</Text>
            </View>
          }
          renderItem={({ item }) => {
            const percent = item.plan > 0 ? Math.min(100, (item.fact / item.plan) * 100) : 0;
            const barColor = percent >= 100 ? Colors.accent : percent >= 70 ? Colors.primary : Colors.warning;
            return (
              <Pressable
                style={[styles.agentCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => router.push({ pathname: "/(modals)/agent-detail", params: { id: item.id } } as any)}
              >
                <View style={[styles.avatarCircle, { backgroundColor: Colors.warning + "20" }]}>
                  <Text style={[styles.avatarText, { color: Colors.warning }]}>
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.agentTopRow}>
                    <Text style={[styles.agentName, { color: theme.text }]}>{item.name}</Text>
                    <Text style={[styles.agentPercent, { color: barColor }]}>
                      {Math.round(percent)}%
                    </Text>
                  </View>
                  <Text style={[styles.agentRegion, { color: theme.textSecondary }]}>
                    <Ionicons name="location-outline" size={12} /> {item.region} · {item.customers} mijoz
                  </Text>
                  <View style={styles.agentProgress}>
                    <View style={[styles.agentProgressFill, { width: `${percent}%` as any, backgroundColor: barColor }]} />
                  </View>
                  <View style={styles.agentStats}>
                    <Text style={[styles.agentStatText, { color: theme.textSecondary }]}>
                      Fakt: {formatMoney(item.fact)} UZS
                    </Text>
                    <Text style={[styles.agentStatText, { color: theme.textMuted }]}>
                      Plan: {formatMoney(item.plan)} UZS
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.textMuted} style={{ marginTop: 4 }} />
              </Pressable>
            );
          }}
        />
      )}
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
  tabRow: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 3,
  },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  tabBtnActive: { ...Platform.select({ web: { boxShadow: "0px 1px 4px rgba(0,0,0,0.08)" }, default: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 } }) },
  tabBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  searchArea: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, gap: 8 },
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
  debtFilterRow: { flexDirection: "row", gap: 8 },
  debtChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F0F4FF",
  },
  debtChipText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#6B7A99" },
  listContent: { padding: 16, gap: 10, paddingBottom: 100 },
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  customerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  customerName: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  customerPhone: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 2 },
  customerAddress: { fontSize: 12, fontFamily: "Inter_400Regular" },
  customerRight: { alignItems: "flex-end", gap: 4 },
  debtBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  debtText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  totalPurchases: { fontSize: 11, fontFamily: "Inter_400Regular" },
  agentCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  agentTopRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  agentName: { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1 },
  agentPercent: { fontSize: 14, fontFamily: "Inter_700Bold" },
  agentRegion: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 6 },
  agentProgress: {
    height: 4,
    backgroundColor: "#E2E8F5",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 4,
  },
  agentProgressFill: { height: 4, borderRadius: 2 },
  agentStats: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  agentStatText: { fontSize: 11, fontFamily: "Inter_400Regular" },
});
