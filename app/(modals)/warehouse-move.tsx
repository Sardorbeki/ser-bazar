import React, { useState } from "react";
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

type MoveType = "in" | "out";

export default function WarehouseMoveModal() {
  const { products, addWarehouseMovement } = useApp();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const bg = isDark ? "#0F1D33" : "#FFFFFF";
  const border = isDark ? "#1A2940" : "#E2E8F5";

  const [moveType, setMoveType] = useState<MoveType>("in");
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const selectedProduct = products.find((p) => p.id === productId);

  const handleSave = () => {
    if (!productId) {
      Alert.alert("Xato", "Mahsulotni tanlang");
      return;
    }
    const qtyNum = parseInt(qty);
    if (!qtyNum || qtyNum <= 0) {
      Alert.alert("Xato", "Miqdorni kiriting");
      return;
    }
    const priceNum = parseInt(price.replace(/\s/g, "")) || selectedProduct?.price || 0;
    addWarehouseMovement({
      type: moveType,
      productId,
      productName: selectedProduct?.name ?? "",
      qty: qtyNum,
      unit: selectedProduct?.unit ?? "dona",
      price: priceNum,
      total: qtyNum * priceNum,
      note: note.trim() || undefined,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: bg, borderBottomColor: border }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Ombor harakati</Text>
        <Pressable onPress={handleSave}>
          <Text style={[styles.saveBtn, { color: moveType === "in" ? Colors.accent : Colors.danger }]}>
            Saqlash
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={[styles.label, { color: theme.textSecondary }]}>Harakat turi</Text>
        <View style={styles.typeRow}>
          <Pressable
            style={[
              styles.typeBtn,
              { borderColor: border },
              moveType === "in" && { backgroundColor: Colors.accent + "20", borderColor: Colors.accent },
            ]}
            onPress={() => setMoveType("in")}
          >
            <Ionicons name="arrow-down-circle" size={24} color={moveType === "in" ? Colors.accent : theme.textMuted} />
            <Text style={[styles.typeBtnText, { color: moveType === "in" ? Colors.accent : theme.textMuted }]}>
              Kirim
            </Text>
            <Text style={[styles.typeBtnSub, { color: theme.textMuted }]}>Omborga kirish</Text>
          </Pressable>
          <Pressable
            style={[
              styles.typeBtn,
              { borderColor: border },
              moveType === "out" && { backgroundColor: Colors.danger + "20", borderColor: Colors.danger },
            ]}
            onPress={() => setMoveType("out")}
          >
            <Ionicons name="arrow-up-circle" size={24} color={moveType === "out" ? Colors.danger : theme.textMuted} />
            <Text style={[styles.typeBtnText, { color: moveType === "out" ? Colors.danger : theme.textMuted }]}>
              Chiqim
            </Text>
            <Text style={[styles.typeBtnSub, { color: theme.textMuted }]}>Ombordan chiqish</Text>
          </Pressable>
        </View>

        <Text style={[styles.label, { color: theme.textSecondary }]}>Mahsulot *</Text>
        <View style={[styles.searchWrap, { backgroundColor: bg, borderColor: border }]}>
          <Ionicons name="search-outline" size={16} color={theme.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            value={productSearch}
            onChangeText={setProductSearch}
            placeholder="Mahsulot qidirish..."
            placeholderTextColor={theme.textMuted}
          />
        </View>

        {selectedProduct && (
          <View style={[styles.selectedProduct, { backgroundColor: Colors.primary + "10", borderColor: Colors.primary }]}>
            <Ionicons name="cube" size={20} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.selectedProductName, { color: theme.text }]}>{selectedProduct.name}</Text>
              <Text style={[styles.selectedProductMeta, { color: theme.textSecondary }]}>
                Qoldiq: {selectedProduct.stock} {selectedProduct.unit}
              </Text>
            </View>
            <Pressable onPress={() => setProductId("")}>
              <Ionicons name="close-circle" size={18} color={theme.textMuted} />
            </Pressable>
          </View>
        )}

        {!selectedProduct && filteredProducts.slice(0, 8).map((p) => (
          <Pressable
            key={p.id}
            style={[styles.productRow, { backgroundColor: bg, borderColor: border }]}
            onPress={() => {
              setProductId(p.id);
              setPrice(p.price.toString());
              setProductSearch("");
            }}
          >
            <View style={[styles.productIcon, { backgroundColor: Colors.primary + "10" }]}>
              <Ionicons name="cube-outline" size={18} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.productName, { color: theme.text }]}>{p.name}</Text>
              <Text style={[styles.productMeta, { color: theme.textSecondary }]}>
                {p.price.toLocaleString()} UZS · {p.stock} {p.unit}
              </Text>
            </View>
          </Pressable>
        ))}

        <View style={styles.row}>
          <View style={[styles.fieldHalf]}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Miqdor *</Text>
            <View style={[styles.inputWrap, { backgroundColor: bg, borderColor: border }]}>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={qty}
                onChangeText={setQty}
                placeholder="0"
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
              />
              <Text style={[styles.unit, { color: theme.textMuted }]}>{selectedProduct?.unit ?? "dona"}</Text>
            </View>
          </View>
          <View style={[styles.fieldHalf]}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Narx (UZS)</Text>
            <View style={[styles.inputWrap, { backgroundColor: bg, borderColor: border }]}>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={price}
                onChangeText={setPrice}
                placeholder="0"
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {qty && price && (
          <View style={[styles.totalWrap, { backgroundColor: theme.surface, borderColor: border }]}>
            <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>Jami:</Text>
            <Text style={[styles.totalValue, { color: theme.text }]}>
              {((parseInt(qty) || 0) * (parseInt(price.replace(/\s/g, "")) || 0)).toLocaleString()} UZS
            </Text>
          </View>
        )}

        <Text style={[styles.label, { color: theme.textSecondary }]}>Izoh</Text>
        <TextInput
          style={[styles.noteInput, { backgroundColor: bg, borderColor: border, color: theme.text }]}
          value={note}
          onChangeText={setNote}
          placeholder="Sabab, hujjat raqami..."
          placeholderTextColor={theme.textMuted}
          multiline
          numberOfLines={2}
        />

        <Pressable
          style={[styles.saveFullBtn, { backgroundColor: moveType === "in" ? Colors.accent : Colors.danger }]}
          onPress={handleSave}
        >
          <Ionicons
            name={moveType === "in" ? "arrow-down-circle-outline" : "arrow-up-circle-outline"}
            size={18}
            color="#fff"
          />
          <Text style={styles.saveBtnText}>{moveType === "in" ? "Kirim tasdiqlash" : "Chiqim tasdiqlash"}</Text>
        </Pressable>

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
  scrollContent: { padding: 16, gap: 12 },
  label: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 },
  typeRow: { flexDirection: "row", gap: 10 },
  typeBtn: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  typeBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  typeBtnSub: { fontSize: 11, fontFamily: "Inter_400Regular" },
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
  selectedProduct: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  selectedProductName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  selectedProductMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  productIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  productName: { fontSize: 14, fontFamily: "Inter_500Medium" },
  productMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  row: { flexDirection: "row", gap: 10 },
  fieldHalf: { flex: 1 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 8,
  },
  input: { flex: 1, fontSize: 16, fontFamily: "Inter_700Bold" },
  unit: { fontSize: 13, fontFamily: "Inter_500Medium" },
  totalWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  totalLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  totalValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  noteInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 60,
    textAlignVertical: "top",
  },
  saveFullBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 4,
  },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
