import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  useColorScheme,
  Platform,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useApp } from "@/contexts/AppContext";
import Colors from "@/constants/colors";

export default function CatalogScreen() {
  const { products, user } = useApp();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const isWeb = Platform.OS === "web";
  const isClient = user?.role === "client";

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Hammasi");

  const categories = useMemo(() => {
    const cats = ["Hammasi", ...new Set(products.map((p) => p.category).filter(Boolean))];
    return cats;
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCategory === "Hammasi" || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, search, selectedCategory]);

  const topPadding = isWeb ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        {isClient && (
          <Pressable
            onPress={() => router.navigate("/(tabs)/" as any)}
            style={{ marginRight: 12, padding: 6, borderRadius: 10, backgroundColor: theme.background }}
          >
            <Ionicons name="home-outline" size={20} color={theme.text} />
          </Pressable>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Mahsulotlar</Text>
          <Text style={[styles.headerSub, { color: theme.textSecondary }]}>
            {filteredProducts.length} ta mahsulot
          </Text>
        </View>
        <Pressable
          style={[styles.orderBtn, { backgroundColor: Colors.primary }]}
          onPress={() => router.push("/(modals)/add-order")}
        >
          <Ionicons name="cart" size={16} color="#fff" />
          <Text style={styles.orderBtnText}>Buyurtma</Text>
        </Pressable>
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Ionicons name="search-outline" size={16} color={theme.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          value={search}
          onChangeText={setSearch}
          placeholder="Mahsulot qidirish..."
          placeholderTextColor={theme.textMuted}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={16} color={theme.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.catScroll, { backgroundColor: theme.card, borderBottomColor: theme.border }]}
        contentContainerStyle={styles.catContent}
      >
        {categories.map((cat) => (
          <Pressable
            key={cat}
            style={[
              styles.catChip,
              { borderColor: theme.border },
              selectedCategory === cat && { backgroundColor: Colors.primary, borderColor: Colors.primary },
            ]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.catChipText, { color: theme.textSecondary }, selectedCategory === cat && { color: "#fff" }]}>
              {cat}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Products Grid */}
      <ScrollView contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 100 }]}>
        {filteredProducts.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="cube-outline" size={48} color={theme.textMuted} />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>Mahsulot topilmadi</Text>
          </View>
        ) : (
          filteredProducts.map((product) => (
            <View
              key={product.id}
              style={[styles.productCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <View style={[styles.productIcon, { backgroundColor: Colors.primary + "20" }]}>
                <Ionicons name="cube" size={28} color={Colors.primary} />
              </View>
              <Text style={[styles.productName, { color: theme.text }]} numberOfLines={2}>
                {product.name}
              </Text>
              <Text style={[styles.productCategory, { color: theme.textMuted }]}>
                {product.category}
              </Text>
              <Text style={[styles.productPrice, { color: Colors.primary }]}>
                {product.price.toLocaleString()} UZS
              </Text>
              <View style={styles.stockRow}>
                <Ionicons
                  name={product.stock > 0 ? "checkmark-circle" : "close-circle"}
                  size={14}
                  color={product.stock > 0 ? Colors.primary : Colors.danger}
                />
                <Text style={[styles.stockText, { color: product.stock > 0 ? Colors.primary : Colors.danger }]}>
                  {product.stock > 0 ? `${product.stock} ${product.unit}` : "Tugadi"}
                </Text>
              </View>
              <Pressable
                style={[styles.addBtn, { backgroundColor: Colors.primary, opacity: product.stock > 0 ? 1 : 0.4 }]}
                onPress={() => product.stock > 0 && router.push("/(modals)/add-order")}
                disabled={product.stock <= 0}
              >
                <Ionicons name="cart-outline" size={16} color="#fff" />
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  headerSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  orderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  orderBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  catScroll: {
    borderBottomWidth: 1,
    maxHeight: 56,
  },
  catContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    flexDirection: "row",
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  catChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  grid: {
    padding: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  productCard: {
    width: "47%",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 4,
  },
  productIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  productName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 18,
  },
  productCategory: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  productPrice: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    marginTop: 4,
  },
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  stockText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
    marginTop: 6,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
    width: "100%",
  },
  emptyText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
});
