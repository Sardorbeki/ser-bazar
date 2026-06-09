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
  Image,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useApp } from "@/contexts/AppContext";
import Colors from "@/constants/colors";

type Tab = "products" | "prixod" | "movements";

function formatMoney(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + " mln";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + " ming";
  return n.toLocaleString();
}

export default function WarehouseScreen() {
  const { products, warehouseMovements, user, refreshData, isLoading } = useApp();
  const isAdmin = user?.role === "admin";
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;

  const [tab, setTab] = useState<Tab>("products");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Barchasi");

  const categories = useMemo(() => {
    const cats = [...new Set(products.map((p) => p.category).filter(Boolean))];
    return ["Barchasi", ...cats.sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = products.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
    );
    if (selectedCategory !== "Barchasi") {
      list = list.filter((p) => p.category === selectedCategory);
    }
    return list;
  }, [products, search, selectedCategory]);

  const sortedMovements = useMemo(
    () => [...warehouseMovements].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [warehouseMovements]
  );

  const totalValue = useMemo(
    () => products.reduce((s, p) => s + p.stock * p.price, 0),
    [products]
  );
  const lowStock = products.filter((p) => p.stock > 0 && p.stock < 20).length;
  const outOfStock = products.filter((p) => p.stock === 0).length;

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 16, backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Ombor</Text>
          <View style={styles.headerActions}>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: "#16A34A20" }]}
              onPress={() => router.push("/(modals)/prixod")}
            >
              <Ionicons name="arrow-down-circle-outline" size={18} color="#16A34A" />
              <Text style={[styles.actionBtnText, { color: "#16A34A" }]}>Prixod</Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: Colors.primary + "15" }]}
              onPress={() => router.push("/(modals)/warehouse-move")}
            >
              <Ionicons name="swap-vertical-outline" size={18} color={Colors.primary} />
              <Text style={[styles.actionBtnText, { color: Colors.primary }]}>Harakat</Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: Colors.accent + "15" }]}
              onPress={() => router.push("/(modals)/add-product")}
            >
              <Ionicons name="add" size={18} color={Colors.accent} />
              <Text style={[styles.actionBtnText, { color: Colors.accent }]}>Mahsulot</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.miniStat, { backgroundColor: Colors.primary + "10" }]}>
            <Ionicons name="cube-outline" size={16} color={Colors.primary} />
            <Text style={[styles.miniStatVal, { color: theme.text }]}>{products.length}</Text>
            <Text style={[styles.miniStatLbl, { color: theme.textSecondary }]}>Mahsulot</Text>
          </View>
          <View style={[styles.miniStat, { backgroundColor: Colors.accent + "10" }]}>
            <Ionicons name="cash-outline" size={16} color={Colors.accent} />
            <Text style={[styles.miniStatVal, { color: theme.text }]}>{formatMoney(totalValue)}</Text>
            <Text style={[styles.miniStatLbl, { color: theme.textSecondary }]}>UZS qiymat</Text>
          </View>
          <View style={[styles.miniStat, { backgroundColor: Colors.warning + "10" }]}>
            <Ionicons name="warning-outline" size={16} color={Colors.warning} />
            <Text style={[styles.miniStatVal, { color: Colors.warning }]}>{lowStock}</Text>
            <Text style={[styles.miniStatLbl, { color: theme.textSecondary }]}>Kam qoldi</Text>
          </View>
          {outOfStock > 0 && (
            <View style={[styles.miniStat, { backgroundColor: Colors.danger + "10" }]}>
              <Ionicons name="close-circle-outline" size={16} color={Colors.danger} />
              <Text style={[styles.miniStatVal, { color: Colors.danger }]}>{outOfStock}</Text>
              <Text style={[styles.miniStatLbl, { color: theme.textSecondary }]}>Tugagan</Text>
            </View>
          )}
        </View>

        <View style={styles.tabRow}>
          {(["products", "prixod", "movements"] as Tab[]).map((t) => (
            <Pressable
              key={t}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>
                {t === "products" ? "Mahsulotlar" : t === "prixod" ? "Prixod" : "Harakatlar"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {tab === "products" && (
        <>
          <View style={[styles.searchWrap, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
            <Ionicons name="search-outline" size={16} color={theme.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              value={search}
              onChangeText={setSearch}
              placeholder="Qidirish..."
              placeholderTextColor={theme.textMuted}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={16} color={theme.textMuted} />
              </Pressable>
            )}
          </View>

          {/* Category Filter */}
          <View style={[styles.categoryRow, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
            <FlatList
              horizontal
              data={categories}
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.categoryChip,
                    selectedCategory === item && { backgroundColor: Colors.primary },
                  ]}
                  onPress={() => setSelectedCategory(item)}
                >
                  <Text style={[
                    styles.categoryChipText,
                    selectedCategory === item && { color: "#fff" },
                  ]}>
                    {item}
                  </Text>
                </Pressable>
              )}
            />
          </View>

          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            scrollEnabled={!!filteredProducts.length}
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={refreshData} tintColor={Colors.primary} />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="cube-outline" size={48} color={theme.textMuted} />
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>Mahsulot topilmadi</Text>
              </View>
            }
            renderItem={({ item }) => {
              const stockStatus =
                item.stock === 0 ? "danger" : item.stock < 20 ? "warning" : "ok";
              const stockColor =
                stockStatus === "danger"
                  ? Colors.danger
                  : stockStatus === "warning"
                  ? Colors.warning
                  : Colors.accent;
              return (
                <View style={[styles.productCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="cover" />
                  ) : (
                    <View style={[styles.productIconWrap, { backgroundColor: Colors.primary + "10" }]}>
                      <Ionicons name="cube" size={22} color={Colors.primary} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.productName, { color: theme.text }]}>{item.name}</Text>
                    <Text style={[styles.productSku, { color: theme.textSecondary }]}>
                      {item.sku} · {item.category}
                    </Text>
                    <Text style={[styles.productPrice, { color: theme.textSecondary }]}>
                      {item.price.toLocaleString()} UZS / {item.unit}
                    </Text>
                  </View>
                  <View style={styles.productRight}>
                    <View style={[styles.stockBadge, { backgroundColor: stockColor + "20" }]}>
                      <Text style={[styles.stockText, { color: stockColor }]}>
                        {item.stock} {item.unit}
                      </Text>
                    </View>
                    {isAdmin && (
                      <Pressable
                        style={[styles.editBtn, { backgroundColor: Colors.primary + "15" }]}
                        onPress={() => router.push({ pathname: "/(modals)/edit-product", params: { id: item.id } })}
                      >
                        <Ionicons name="pencil" size={14} color={Colors.primary} />
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            }}
          />
        </>
      )}

      {tab === "prixod" && (
        <FlatList
          data={sortedMovements.filter((m) => m.type === "in")}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          scrollEnabled
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refreshData} tintColor={Colors.primary} />
          }
          ListHeaderComponent={
            <Pressable
              style={[styles.prixodAddBtn, { backgroundColor: Colors.accent }]}
              onPress={() => router.push("/(modals)/prixod")}
            >
              <Ionicons name="add-circle-outline" size={18} color="#fff" />
              <Text style={styles.prixodAddText}>Yangi prixod qo'shish</Text>
            </Pressable>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="arrow-down-circle-outline" size={48} color={theme.textMuted} />
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>Hali prixod yo'q</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.movementCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.movementIcon, { backgroundColor: Colors.accent + "20" }]}>
                <Ionicons name="arrow-down-circle" size={22} color={Colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.movementProduct, { color: theme.text }]}>{item.productName}</Text>
                <Text style={[styles.movementDate, { color: theme.textSecondary }]}>
                  {item.createdAt}{item.note ? ` · ${item.note}` : ""}
                </Text>
              </View>
              <View style={styles.movementRight}>
                <Text style={[styles.movementQty, { color: Colors.accent }]}>
                  +{item.qty} {item.unit}
                </Text>
                {item.price > 0 && (
                  <Text style={[styles.movementTotal, { color: theme.textSecondary }]}>
                    {item.total.toLocaleString()} UZS
                  </Text>
                )}
              </View>
            </View>
          )}
        />
      )}

      {tab === "movements" && (
        <FlatList
          data={sortedMovements}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          scrollEnabled={!!sortedMovements.length}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refreshData} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="swap-vertical-outline" size={48} color={theme.textMuted} />
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>Harakatlar yo'q</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.movementCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View
                style={[
                  styles.movementIcon,
                  { backgroundColor: item.type === "in" ? Colors.accent + "20" : Colors.danger + "20" },
                ]}
              >
                <Ionicons
                  name={item.type === "in" ? "arrow-down-circle" : "arrow-up-circle"}
                  size={22}
                  color={item.type === "in" ? Colors.accent : Colors.danger}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.movementProduct, { color: theme.text }]}>{item.productName}</Text>
                <Text style={[styles.movementDate, { color: theme.textSecondary }]}>
                  {item.createdAt}{item.note ? ` · ${item.note}` : ""}
                </Text>
              </View>
              <View style={styles.movementRight}>
                <Text style={[styles.movementQty, { color: item.type === "in" ? Colors.accent : Colors.danger }]}>
                  {item.type === "in" ? "+" : "-"}{item.qty} {item.unit}
                </Text>
                <Text style={[styles.movementTotal, { color: theme.textSecondary }]}>
                  {formatMoney(item.total)} UZS
                </Text>
              </View>
            </View>
          )}
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
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold" },
  headerActions: { flexDirection: "row", gap: 8 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  actionBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  miniStat: {
    flex: 1,
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    gap: 2,
  },
  miniStatVal: { fontSize: 16, fontFamily: "Inter_700Bold" },
  miniStatLbl: { fontSize: 10, fontFamily: "Inter_400Regular" },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#F0F4FF",
    borderRadius: 10,
    padding: 3,
  },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  tabBtnActive: { backgroundColor: "#fff", ...Platform.select({ web: { boxShadow: "0px 1px 4px rgba(0,0,0,0.08)" }, default: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 } }) },
  tabBtnText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#6B7A99" },
  tabBtnTextActive: { color: "#0A1628", fontFamily: "Inter_600SemiBold" },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  categoryRow: { paddingVertical: 8, borderBottomWidth: 1 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F0F4FF",
  },
  categoryChipText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#6B7A99" },
  listContent: { padding: 16, gap: 10, paddingBottom: 100 },
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  productImage: { width: 44, height: 44, borderRadius: 10 },
  productIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  editBtn: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center", marginTop: 6 },
  productName: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  productSku: { fontSize: 12, fontFamily: "Inter_400Regular" },
  productPrice: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  productRight: { alignItems: "flex-end" },
  stockBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  stockText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  movementCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  movementIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  movementProduct: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  movementDate: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  movementRight: { alignItems: "flex-end" },
  movementQty: { fontSize: 16, fontFamily: "Inter_700Bold" },
  movementTotal: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  prixodAddBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14, marginBottom: 10 },
  prixodAddText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
