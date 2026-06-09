import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  useColorScheme,
  Platform,
  Linking,
  TextInput,
  Alert,
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

export default function AgentDetailModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { agents, orders, customers, updateAgent } = useApp();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const bg = isDark ? Colors.dark.card : Colors.light.card;
  const border = isDark ? Colors.dark.border : Colors.light.border;

  const [editingPlan, setEditingPlan] = useState(false);
  const [newPlan, setNewPlan] = useState("");

  const agent = useMemo(() => agents.find((a) => a.id === id), [agents, id]);
  const agentOrders = useMemo(
    () => orders.filter((o) => o.agentId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [orders, id]
  );
  const agentCustomers = useMemo(
    () => customers.filter((c) => c.agentId === id),
    [customers, id]
  );

  if (!agent) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: "center", alignItems: "center" }]}>
        <Ionicons name="person-outline" size={48} color={theme.textMuted} />
        <Text style={{ color: theme.textMuted, marginTop: 12, fontSize: 15 }}>Agent topilmadi</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: Colors.primary, fontSize: 15, fontFamily: "Inter_600SemiBold" }}>Orqaga</Text>
        </Pressable>
      </View>
    );
  }

  const percent = agent.plan > 0 ? Math.min(100, (agent.fact / agent.plan) * 100) : 0;
  const barColor = percent >= 100 ? Colors.accent : percent >= 70 ? Colors.primary : Colors.warning;

  const totalRevenue = agentOrders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + o.total, 0);
  const deliveredCount = agentOrders.filter((o) => o.status === "delivered").length;
  const activeCount = agentOrders.filter((o) => o.status === "confirmed" || o.status === "shipped").length;

  const handleSavePlan = () => {
    const val = parseFloat(newPlan.replace(/\s/g, "").replace(",", "."));
    if (isNaN(val) || val <= 0) {
      Alert.alert("Xato", "To'g'ri plan summasini kiriting");
      return;
    }
    updateAgent(agent.id, { plan: val });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEditingPlan(false);
    setNewPlan("");
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: bg, borderBottomColor: border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Agent profili</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Avatar & Name */}
        <View style={[styles.profileCard, { backgroundColor: bg, borderColor: border }]}>
          <View style={[styles.avatar, { backgroundColor: Colors.warning + "25" }]}>
            <Text style={[styles.avatarText, { color: Colors.warning }]}>
              {agent.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.agentName, { color: theme.text }]}>{agent.name}</Text>
            <Text style={[styles.agentRegion, { color: theme.textSecondary }]}>
              <Ionicons name="location-outline" size={13} /> {agent.region}
            </Text>
          </View>
          {agent.phone ? (
            <Pressable
              onPress={() => Linking.openURL(`tel:${agent.phone}`)}
              style={[styles.callBtn, { backgroundColor: Colors.primary + "20" }]}
            >
              <Ionicons name="call" size={18} color={Colors.primary} />
            </Pressable>
          ) : null}
        </View>

        {/* Contact */}
        <View style={[styles.section, { backgroundColor: bg, borderColor: border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>ALOQA</Text>
          {agent.phone ? (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={16} color={theme.textMuted} />
              <Text style={[styles.infoText, { color: theme.text }]}>{agent.phone}</Text>
            </View>
          ) : null}
          {agent.email ? (
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={16} color={theme.textMuted} />
              <Text style={[styles.infoText, { color: theme.text }]}>{agent.email}</Text>
            </View>
          ) : null}
        </View>

        {/* Plan/Fact */}
        <View style={[styles.section, { backgroundColor: bg, borderColor: border }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>PLAN / FAKT</Text>
            <Pressable
              onPress={() => { setEditingPlan(true); setNewPlan(agent.plan.toString()); }}
              style={[styles.editPlanBtn, { backgroundColor: Colors.primary + "20" }]}
            >
              <Ionicons name="pencil" size={14} color={Colors.primary} />
              <Text style={[styles.editPlanText, { color: Colors.primary }]}>Plan tahrirlash</Text>
            </Pressable>
          </View>

          {editingPlan && (
            <View style={[styles.planEditRow, { borderColor: border }]}>
              <TextInput
                style={[styles.planInput, { color: theme.text, backgroundColor: theme.background }]}
                value={newPlan}
                onChangeText={setNewPlan}
                keyboardType="numeric"
                placeholder="Yangi plan (UZS)"
                placeholderTextColor={theme.textMuted}
                autoFocus
              />
              <Pressable style={[styles.planSaveBtn, { backgroundColor: Colors.primary }]} onPress={handleSavePlan}>
                <Text style={{ color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" }}>Saqlash</Text>
              </Pressable>
              <Pressable onPress={() => setEditingPlan(false)}>
                <Ionicons name="close" size={20} color={theme.textMuted} />
              </Pressable>
            </View>
          )}

          <View style={styles.planRow}>
            <View>
              <Text style={[styles.planLabel, { color: theme.textSecondary }]}>Plan</Text>
              <Text style={[styles.planValue, { color: theme.text }]}>{formatMoney(agent.plan)} UZS</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.planLabel, { color: theme.textSecondary }]}>Fakt</Text>
              <Text style={[styles.planValue, { color: barColor }]}>{formatMoney(agent.fact)} UZS</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${percent}%` as any, backgroundColor: barColor }]} />
          </View>
          <Text style={[styles.progressPct, { color: barColor }]}>{Math.round(percent)}% bajarildi</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: Colors.primary + "15", borderColor: Colors.primary + "40" }]}>
            <Text style={[styles.statVal, { color: Colors.primary }]}>{agentOrders.length}</Text>
            <Text style={[styles.statLbl, { color: theme.textSecondary }]}>Jami buyurtma</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: Colors.accent + "15", borderColor: Colors.accent + "40" }]}>
            <Text style={[styles.statVal, { color: Colors.accent }]}>{deliveredCount}</Text>
            <Text style={[styles.statLbl, { color: theme.textSecondary }]}>Yetkazildi</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: Colors.warning + "15", borderColor: Colors.warning + "40" }]}>
            <Text style={[styles.statVal, { color: Colors.warning }]}>{activeCount}</Text>
            <Text style={[styles.statLbl, { color: theme.textSecondary }]}>Jarayonda</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: "#9B59B620", borderColor: "#9B59B640" }]}>
            <Text style={[styles.statVal, { color: "#9B59B6" }]}>{agentCustomers.length}</Text>
            <Text style={[styles.statLbl, { color: theme.textSecondary }]}>Mijozlar</Text>
          </View>
        </View>

        {/* Revenue */}
        <View style={[styles.section, { backgroundColor: bg, borderColor: border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>SAVDO HAJMI</Text>
          <Text style={{ fontSize: 28, fontFamily: "Inter_700Bold", color: Colors.primary }}>
            {formatMoney(totalRevenue)} UZS
          </Text>
          <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: theme.textSecondary }}>
            Jami yetkazilgan buyurtmalar summasi
          </Text>
        </View>

        {/* Recent Orders */}
        {agentOrders.length > 0 && (
          <View style={[styles.section, { backgroundColor: bg, borderColor: border }]}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>SO'NGGI BUYURTMALAR</Text>
            {agentOrders.slice(0, 5).map((order, idx) => {
              const statusColors: Record<string, string> = {
                draft: "#9CA3B8", confirmed: Colors.primary, shipped: Colors.warning, delivered: Colors.accent, cancelled: Colors.danger
              };
              return (
                <Pressable
                  key={order.id}
                  style={[styles.orderRow, { borderBottomColor: border, borderBottomWidth: idx < Math.min(agentOrders.length, 5) - 1 ? 1 : 0 }]}
                  onPress={() => router.push({ pathname: "/(modals)/order-detail", params: { id: order.id } } as any)}
                >
                  <View style={[styles.statusDot, { backgroundColor: statusColors[order.status] }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.orderNum, { color: theme.text }]}>{order.number}</Text>
                    <Text style={[styles.orderCustomer, { color: theme.textSecondary }]}>{order.customerName}</Text>
                  </View>
                  <Text style={[styles.orderTotal, { color: theme.text }]}>{formatMoney(order.total)} UZS</Text>
                  <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
                </Pressable>
              );
            })}
          </View>
        )}

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
  agentName: { fontSize: 18, fontFamily: "Inter_700Bold" },
  agentRegion: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  callBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  section: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
  editPlanBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  editPlanText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  planEditRow: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 12, padding: 10 },
  planInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", paddingVertical: 4 },
  planSaveBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  planRow: { flexDirection: "row", justifyContent: "space-between" },
  planLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 2 },
  planValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  progressTrack: { height: 8, backgroundColor: "#E2E8F5", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: 8, borderRadius: 4 },
  progressPct: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statBox: { width: "47%", padding: 14, borderRadius: 14, borderWidth: 1, alignItems: "center", gap: 4 },
  statVal: { fontSize: 20, fontFamily: "Inter_700Bold" },
  statLbl: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  orderRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  orderNum: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  orderCustomer: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  orderTotal: { fontSize: 13, fontFamily: "Inter_700Bold" },
});
