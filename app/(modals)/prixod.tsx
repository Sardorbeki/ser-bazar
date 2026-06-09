import React, { useState, useMemo } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  TextInput, useColorScheme, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useApp } from "@/contexts/AppContext";
import Colors from "@/constants/colors";
import * as Haptics from "expo-haptics";

export default function PrixodModal() {
  const { products, addWarehouseMovement } = useApp();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const bg = isDark ? "#0A2010" : "#FFFFFF";
  const border = isDark ? "#14532D" : "#D1FAE5";

  const [search, setSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [qty, setQty] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [note, setNote] = useState("");
  const [step, setStep] = useState<"product" | "details">("product");

  const filteredProducts = useMemo(
    () => products.filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase())),
    [products, search]
  );

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const total = useMemo(() => {
    const q = parseInt(qty) || 0;
    const p = parseInt(buyPrice.replace(/\s/g, "")) || 0;
    return q * p;
  }, [qty, buyPrice]);

  const handleSave = () => {
    if (!selectedProductId) { Alert.alert("Xato", "Mahsulot tanlang"); return; }
    const qtyNum = parseInt(qty);
    if (!qtyNum || qtyNum <= 0) { Alert.alert("Xato", "Miqdorni kiriting"); return; }
    const priceNum = parseInt(buyPrice.replace(/\s/g, "")) || 0;

    addWarehouseMovement({
      type: "in",
      productId: selectedProductId,
      productName: selectedProduct!.name,
      qty: qtyNum,
      unit: selectedProduct!.unit,
      price: priceNum,
      total: qtyNum * priceNum,
      note: note.trim() || "Prixod",
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Prixod — Tovar kirimi</Text>
        {step === "details" && (
          <Pressable onPress={handleSave}>
            <Text style={[styles.saveBtn, { color: Colors.primary }]}>Saqlash</Text>
          </Pressable>
        )}
        {step === "product" && <View style={{ width: 50 }} />}
      </View>

      {/* Step indicator */}
      <View style={[styles.steps, { backgroundColor: bg, borderBottomColor: border }]}>
        <Pressable style={[styles.stepItem, step === "product" && styles.stepActive]} onPress={() => setStep("product")}>
          <View style={[styles.stepDot, { backgroundColor: step === "product" ? Colors.primary : border }]}>
            <Text style={styles.stepNum}>1</Text>
          </View>
          <Text style={[styles.stepLabel, { color: step === "product" ? Colors.primary : theme.textMuted }]}>Mahsulot</Text>
        </Pressable>
        <View style={[styles.stepLine, { backgroundColor: border }]} />
        <Pressable style={[styles.stepItem, step === "details" && styles.stepActive]} onPress={() => selectedProductId && setStep("details")}>
          <View style={[styles.stepDot, { backgroundColor: step === "details" ? Colors.primary : border }]}>
            <Text style={styles.stepNum}>2</Text>
          </View>
          <Text style={[styles.stepLabel, { color: step === "details" ? Colors.primary : theme.textMuted }]}>Miqdor</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {step === "product" && (
          <>
            <View style={[styles.searchWrap, { backgroundColor: bg, borderColor: border }]}>
              <Ionicons name="search-outline" size={16} color={theme.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                value={search}
                onChangeText={setSearch}
                placeholder="Mahsulot qidirish..."
                placeholderTextColor={theme.textMuted}
              />
            </View>

            {filteredProducts.map((p) => (
              <Pressable
                key={p.id}
                style={[
                  styles.productRow,
                  { backgroundColor: bg, borderColor: border },
                  selectedProductId === p.id && { borderColor: Colors.primary, backgroundColor: Colors.primary + "10" },
                ]}
                onPress={() => { setSelectedProductId(p.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              >
                <View style={[styles.productIcon, { backgroundColor: Colors.primary + "20" }]}>
                  <Ionicons name="cube" size={20} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.productName, { color: theme.text }]}>{p.name}</Text>
                  <Text style={[styles.productMeta, { color: theme.textSecondary }]}>
                    Joriy qoldiq: {p.stock} {p.unit} · {p.price.toLocaleString()} UZS
                  </Text>
                </View>
                {selectedProductId === p.id && <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />}
              </Pressable>
            ))}

            {selectedProductId && (
              <Pressable
                style={[styles.nextBtn, { backgroundColor: Colors.primary }]}
                onPress={() => setStep("details")}
              >
                <Text style={styles.nextBtnText}>Davom etish</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </Pressable>
            )}
          </>
        )}

        {step === "details" && selectedProduct && (
          <>
            {/* Selected product info */}
            <View style={[styles.selectedProduct, { backgroundColor: Colors.primary + "15", borderColor: Colors.primary + "40" }]}>
              <Ionicons name="cube" size={24} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.selectedProductName, { color: Colors.primary }]}>{selectedProduct.name}</Text>
                <Text style={[styles.selectedProductMeta, { color: Colors.primaryDark }]}>
                  Joriy qoldiq: {selectedProduct.stock} {selectedProduct.unit}
                </Text>
              </View>
              <Pressable onPress={() => setStep("product")}>
                <Ionicons name="swap-horizontal" size={20} color={Colors.primary} />
              </Pressable>
            </View>

            {[
              { label: `Kelgan miqdor (${selectedProduct.unit}) *`, value: qty, onChange: setQty, placeholder: "0", icon: "layers-outline", kt: "numeric" },
              { label: "Kelish narxi (UZS)", value: buyPrice, onChange: setBuyPrice, placeholder: "0", icon: "pricetag-outline", kt: "numeric" },
            ].map((f) => (
              <View key={f.label} style={styles.fieldGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>{f.label}</Text>
                <View style={[styles.inputWrap, { backgroundColor: bg, borderColor: border }]}>
                  <Ionicons name={f.icon as any} size={18} color={theme.textMuted} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    value={f.value}
                    onChangeText={f.onChange}
                    placeholder={f.placeholder}
                    placeholderTextColor={theme.textMuted}
                    keyboardType={f.kt as any}
                  />
                </View>
              </View>
            ))}

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Izoh</Text>
              <View style={[styles.inputWrap, { backgroundColor: bg, borderColor: border }]}>
                <Ionicons name="document-text-outline" size={18} color={theme.textMuted} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={note}
                  onChangeText={setNote}
                  placeholder="Yetkazuvchi, shartnoma raqami..."
                  placeholderTextColor={theme.textMuted}
                />
              </View>
            </View>

            {total > 0 && (
              <View style={[styles.totalCard, { backgroundColor: Colors.primary + "15", borderColor: Colors.primary + "30" }]}>
                <Text style={[styles.totalLabel, { color: Colors.primary }]}>Jami summa:</Text>
                <Text style={[styles.totalValue, { color: Colors.primary }]}>{total.toLocaleString()} UZS</Text>
              </View>
            )}

            <View style={[styles.resultCard, { backgroundColor: bg, borderColor: border }]}>
              <Ionicons name="information-circle" size={18} color={theme.textMuted} />
              <Text style={[styles.resultText, { color: theme.textSecondary }]}>
                Saqlashdan keyin: {selectedProduct.stock} + {parseInt(qty) || 0} = {selectedProduct.stock + (parseInt(qty) || 0)} {selectedProduct.unit}
              </Text>
            </View>

            <Pressable style={[styles.saveFullBtn, { backgroundColor: Colors.primary }]} onPress={handleSave}>
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>Qoldiqqa qo'shish</Text>
            </Pressable>
          </>
        )}

        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  saveBtn: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  steps: { flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingVertical: 12, borderBottomWidth: 1 },
  stepItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepActive: {},
  stepDot: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  stepNum: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#fff" },
  stepLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  stepLine: { flex: 1, height: 1, marginHorizontal: 8 },
  scrollContent: { padding: 16, gap: 12 },
  searchWrap: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  productRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  productIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  productName: { fontSize: 14, fontFamily: "Inter_500Medium" },
  productMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 14, marginTop: 4 },
  nextBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  selectedProduct: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  selectedProductName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  selectedProductMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  fieldGroup: { marginBottom: 4 },
  label: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  totalCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1 },
  totalLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  totalValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  resultCard: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1 },
  resultText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  saveFullBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 14, marginTop: 4 },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
