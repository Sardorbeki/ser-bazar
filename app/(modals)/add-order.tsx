import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  useColorScheme,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Location from "expo-location";
import { useApp, Product, OrderItem } from "@/contexts/AppContext";
import Colors from "@/constants/colors";
import * as Haptics from "expo-haptics";

interface CartItem extends OrderItem {
  localId: string;
  discount: number;
}

function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function AddOrderModal() {
  const { customers, agents, products, addOrder, user, locationSettings, appSettings } = useApp();
  const { customerId: preSelectedCustomerId } = useLocalSearchParams<{ customerId?: string }>();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const isClient = user?.role === "client";

  const [selectedCustomerId, setSelectedCustomerId] = useState(preSelectedCustomerId ?? "");
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [note, setNote] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Barchasi");
  const [step, setStep] = useState<"details" | "products">("details");
  const [globalDiscount, setGlobalDiscount] = useState("");

  const [locationStatus, setLocationStatus] = useState<"idle" | "checking" | "ok" | "denied" | "out_of_range" | "error">("idle");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [checkingLoc, setCheckingLoc] = useState(false);

  const categories = useMemo(() => {
    const cats = [...new Set(products.map((p) => p.category).filter(Boolean))];
    return ["Barchasi", ...cats.sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()));
    if (categoryFilter !== "Barchasi") {
      list = list.filter((p) => p.category === categoryFilter);
    }
    return list;
  }, [products, productSearch, categoryFilter]);

  const subtotal = useMemo(
    () => cart.reduce((s, i) => s + i.qty * i.price, 0),
    [cart]
  );

  const discountAmount = useMemo(() => {
    const pct = parseFloat(globalDiscount) || 0;
    return Math.round(subtotal * pct / 100);
  }, [subtotal, globalDiscount]);

  const total = subtotal - discountAmount;

  const needsLocationCheck = locationSettings?.enabled === true;

  const checkLocation = async (): Promise<boolean> => {
    setCheckingLoc(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationStatus("denied");
        Alert.alert("Lokatsiya kerak", "Buyurtma berish uchun lokatsiya ruxsati talab qilinadi.");
        return false;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const myLat = loc.coords.latitude;
      const myLng = loc.coords.longitude;
      setUserLocation({ lat: myLat, lng: myLng });
      if (locationSettings && locationSettings.enabled && locationSettings.lat && locationSettings.lng) {
        const dist = getDistanceKm(myLat, myLng, locationSettings.lat, locationSettings.lng);
        if (dist > locationSettings.radius) {
          setLocationStatus("out_of_range");
          Alert.alert("Hudud tashqarisi", `Siz ruxsat etilgan hududdan ${dist.toFixed(1)} km uzoqdasiz.`);
          return false;
        }
      }
      setLocationStatus("ok");
      return true;
    } catch {
      setLocationStatus("error");
      Alert.alert("Xato", "Lokatsiyani aniqlab bo'lmadi.");
      return false;
    } finally {
      setCheckingLoc(false);
    }
  };

  const addToCart = (product: Product) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) => i.productId === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [
        ...prev,
        {
          localId: Math.random().toString(36).slice(2),
          productId: product.id,
          productName: product.name,
          qty: 1,
          price: product.price,
          unit: product.unit,
          discount: 0,
        },
      ];
    });
  };

  const updateCartQty = (localId: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.localId !== localId));
    } else {
      setCart((prev) => prev.map((i) => (i.localId === localId ? { ...i, qty } : i)));
    }
  };

  const updateCartPrice = (localId: string, priceStr: string) => {
    const price = parseFloat(priceStr.replace(/\s/g, "")) || 0;
    setCart((prev) => prev.map((i) => i.localId === localId ? { ...i, price } : i));
  };

  const handleSave = async () => {
    if (!isClient && !selectedCustomerId) {
      Alert.alert("Xato", "Mijozni tanlang");
      return;
    }
    if (cart.length === 0) {
      Alert.alert("Xato", "Kamida bitta mahsulot qo'shing");
      return;
    }
    const minAmt = appSettings.minOrderAmount || 0;
    if (minAmt > 0 && total < minAmt) {
      Alert.alert("Minimal summa", `Buyurtma summasi kamida ${minAmt.toLocaleString()} UZS bo'lishi kerak.`);
      return;
    }
    if (needsLocationCheck && locationStatus !== "ok") {
      const ok = await checkLocation();
      if (!ok) return;
    }

    const customer = isClient
      ? { id: user?.id ?? "", name: user?.name ?? "" }
      : customers.find((c) => c.id === selectedCustomerId) ?? { id: selectedCustomerId, name: "" };
    const agent = agents.find((a) => a.id === selectedAgentId);

    const discPct = parseFloat(globalDiscount) || 0;
    const noteWithDiscount = discPct > 0 ? `${note}${note ? " | " : ""}Chegirma: ${discPct}%`.trim() : note;

    addOrder({
      customerId: customer.id,
      customerName: customer.name,
      agentId: selectedAgentId || undefined,
      agentName: agent?.name ?? undefined,
      items: cart.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        qty: i.qty,
        price: i.price,
        unit: i.unit,
      })),
      total,
      status: "confirmed",
      paymentStatus: "unpaid",
      paidAmount: 0,
      note: noteWithDiscount,
      location: userLocation ?? undefined,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const bg = isDark ? Colors.dark.card : Colors.light.card;
  const border = isDark ? Colors.dark.border : Colors.light.border;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: bg, borderBottomColor: border }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Yangi buyurtma</Text>
        <Pressable onPress={handleSave} disabled={checkingLoc}>
          {checkingLoc ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={[styles.saveBtn, { color: Colors.primary }]}>Saqlash</Text>
          )}
        </Pressable>
      </View>

      {needsLocationCheck && (
        <Pressable
          style={[styles.locBanner, {
            backgroundColor: locationStatus === "ok" ? Colors.primary + "20" : locationStatus === "out_of_range" || locationStatus === "denied" ? Colors.danger + "15" : Colors.primary + "10",
            borderColor: (locationStatus === "ok" ? Colors.primary : locationStatus === "out_of_range" || locationStatus === "denied" ? Colors.danger : Colors.primary) + "40"
          }]}
          onPress={locationStatus !== "ok" ? checkLocation : undefined}
          disabled={checkingLoc}
        >
          {checkingLoc ? <ActivityIndicator size="small" color={Colors.primary} /> : (
            <Ionicons name={locationStatus === "ok" ? "checkmark-circle" : locationStatus === "out_of_range" ? "close-circle" : "location-outline"} size={18} color={locationStatus === "ok" ? Colors.primary : locationStatus === "out_of_range" || locationStatus === "denied" ? Colors.danger : Colors.primary} />
          )}
          <Text style={[styles.locBannerText, { color: locationStatus === "ok" ? Colors.primary : locationStatus === "out_of_range" || locationStatus === "denied" ? Colors.danger : Colors.primary }]}>
            {checkingLoc ? "Lokatsiya tekshirilmoqda..." : locationStatus === "ok" ? "Lokatsiya tasdiqlandi" : locationStatus === "out_of_range" ? "Hududdan tashqari" : "Lokatsiyani tekshirish uchun bosing"}
          </Text>
        </Pressable>
      )}

      <View style={[styles.tabRow, { backgroundColor: bg, borderBottomColor: border }]}>
        <Pressable
          style={[styles.tabBtn, step === "details" && [styles.tabBtnActive, { borderBottomColor: Colors.primary }]]}
          onPress={() => setStep("details")}
        >
          <Text style={[styles.tabBtnText, step === "details" && { color: Colors.primary }]}>Ma'lumotlar</Text>
        </Pressable>
        <Pressable
          style={[styles.tabBtn, step === "products" && [styles.tabBtnActive, { borderBottomColor: Colors.primary }]]}
          onPress={() => setStep("products")}
        >
          <Text style={[styles.tabBtnText, step === "products" && { color: Colors.primary }]}>
            Mahsulotlar {cart.length > 0 ? `(${cart.length})` : ""}
          </Text>
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {step === "details" && (
          <>
            {!isClient && (
              <>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Mijoz *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {customers.map((c) => (
                    <Pressable
                      key={c.id}
                      style={[
                        styles.chip,
                        { borderColor: border },
                        selectedCustomerId === c.id && { backgroundColor: Colors.primary, borderColor: Colors.primary },
                      ]}
                      onPress={() => setSelectedCustomerId(c.id)}
                    >
                      <Text style={[styles.chipText, { color: theme.textSecondary }, selectedCustomerId === c.id && { color: "#fff" }]}>
                        {c.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <Text style={[styles.label, { color: theme.textSecondary }]}>Agent</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  <Pressable
                    style={[styles.chip, { borderColor: border }, selectedAgentId === "" && { backgroundColor: Colors.primary + "20", borderColor: Colors.primary }]}
                    onPress={() => setSelectedAgentId("")}
                  >
                    <Text style={[styles.chipText, { color: theme.textSecondary }, selectedAgentId === "" && { color: Colors.primary }]}>Yo'q</Text>
                  </Pressable>
                  {agents.map((a) => (
                    <Pressable
                      key={a.id}
                      style={[styles.chip, { borderColor: border }, selectedAgentId === a.id && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
                      onPress={() => setSelectedAgentId(a.id)}
                    >
                      <Text style={[styles.chipText, { color: theme.textSecondary }, selectedAgentId === a.id && { color: "#fff" }]}>{a.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            )}

            {isClient && (
              <View style={[styles.clientInfo, { backgroundColor: Colors.primary + "15", borderColor: Colors.primary + "40" }]}>
                <Ionicons name="person-circle" size={24} color={Colors.primary} />
                <Text style={[styles.clientInfoText, { color: Colors.primary }]}>Buyurtma: {user?.name}</Text>
              </View>
            )}

            <Text style={[styles.label, { color: theme.textSecondary }]}>Chegirma (%)</Text>
            <View style={[styles.discountWrap, { backgroundColor: bg, borderColor: border }]}>
              <Ionicons name="pricetag-outline" size={18} color={theme.textMuted} />
              <TextInput
                style={[styles.discountInput, { color: theme.text }]}
                value={globalDiscount}
                onChangeText={setGlobalDiscount}
                placeholder="0"
                placeholderTextColor={theme.textMuted}
                keyboardType="decimal-pad"
              />
              <Text style={[styles.discountUnit, { color: theme.textMuted }]}>%</Text>
            </View>
            {parseFloat(globalDiscount) > 0 && subtotal > 0 && (
              <View style={[styles.discountInfo, { backgroundColor: Colors.warning + "15", borderColor: Colors.warning + "40" }]}>
                <Ionicons name="pricetag" size={14} color={Colors.warning} />
                <Text style={[styles.discountInfoText, { color: Colors.warning }]}>
                  Chegirma: -{discountAmount.toLocaleString()} UZS → Jami: {total.toLocaleString()} UZS
                </Text>
              </View>
            )}

            <Text style={[styles.label, { color: theme.textSecondary }]}>Izoh</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: bg, borderColor: border, color: theme.text }]}
              value={note}
              onChangeText={setNote}
              placeholder="Buyurtma haqida qo'shimcha..."
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={3}
            />

            {needsLocationCheck && locationStatus !== "ok" && (
              <Pressable style={[styles.checkLocBtn, { backgroundColor: Colors.primary }]} onPress={checkLocation} disabled={checkingLoc}>
                {checkingLoc ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Ionicons name="location" size={18} color="#fff" />
                    <Text style={styles.checkLocBtnText}>Lokatsiyani tekshirish</Text>
                  </>
                )}
              </Pressable>
            )}

            <Pressable style={[styles.nextBtn, { backgroundColor: Colors.primary }]} onPress={() => setStep("products")}>
              <Text style={styles.nextBtnText}>Mahsulot qo'shish</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </Pressable>
          </>
        )}

        {step === "products" && (
          <>
            <View style={[styles.searchWrap, { backgroundColor: bg, borderColor: border }]}>
              <Ionicons name="search-outline" size={16} color={theme.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                value={productSearch}
                onChangeText={setProductSearch}
                placeholder="Mahsulot qidirish..."
                placeholderTextColor={theme.textMuted}
              />
              {productSearch ? (
                <Pressable onPress={() => setProductSearch("")}>
                  <Ionicons name="close-circle" size={16} color={theme.textMuted} />
                </Pressable>
              ) : null}
            </View>

            {/* Category filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
              {categories.map((cat) => (
                <Pressable
                  key={cat}
                  style={[styles.catChip, { borderColor: border }, categoryFilter === cat && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
                  onPress={() => setCategoryFilter(cat)}
                >
                  <Text style={[styles.catChipText, { color: theme.textSecondary }, categoryFilter === cat && { color: "#fff" }]}>{cat}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {cart.length > 0 && (
              <>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Savat</Text>
                {cart.map((item) => (
                  <View key={item.localId} style={[styles.cartItem, { backgroundColor: bg, borderColor: Colors.primary }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cartItemName, { color: theme.text }]}>{item.productName}</Text>
                      <TextInput
                        style={[styles.cartPriceInput, { color: theme.textSecondary, borderColor: border }]}
                        value={item.price.toString()}
                        onChangeText={(v) => updateCartPrice(item.localId, v)}
                        keyboardType="numeric"
                        placeholder="Narx"
                        placeholderTextColor={theme.textMuted}
                      />
                    </View>
                    <View style={styles.qtyRow}>
                      <Pressable style={[styles.qtyBtn, { backgroundColor: Colors.danger + "20" }]} onPress={() => updateCartQty(item.localId, item.qty - 1)}>
                        <Ionicons name="remove" size={16} color={Colors.danger} />
                      </Pressable>
                      <Text style={[styles.qtyText, { color: theme.text }]}>{item.qty}</Text>
                      <Pressable style={[styles.qtyBtn, { backgroundColor: Colors.primary + "20" }]} onPress={() => updateCartQty(item.localId, item.qty + 1)}>
                        <Ionicons name="add" size={16} color={Colors.primary} />
                      </Pressable>
                    </View>
                    <Text style={[styles.cartItemTotal, { color: theme.text }]}>
                      {(item.qty * item.price).toLocaleString()}
                    </Text>
                  </View>
                ))}
                <View style={[styles.totalRow, { borderTopColor: border }]}>
                  <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>Jami summa:</Text>
                  <View style={{ alignItems: "flex-end" }}>
                    {discountAmount > 0 && (
                      <Text style={{ color: theme.textMuted, fontSize: 12, fontFamily: "Inter_400Regular", textDecorationLine: "line-through" }}>
                        {subtotal.toLocaleString()} UZS
                      </Text>
                    )}
                    <Text style={[styles.totalValue, { color: Colors.primary }]}>{total.toLocaleString()} UZS</Text>
                    {discountAmount > 0 && (
                      <Text style={{ color: Colors.warning, fontSize: 11, fontFamily: "Inter_500Medium" }}>
                        Chegirma: -{discountAmount.toLocaleString()} UZS
                      </Text>
                    )}
                  </View>
                </View>
              </>
            )}

            <Text style={[styles.label, { color: theme.textSecondary }]}>Mahsulotlar</Text>
            {filteredProducts.map((p) => {
              const inCart = cart.find((i) => i.productId === p.id);
              return (
                <Pressable
                  key={p.id}
                  style={[
                    styles.productRow,
                    { backgroundColor: bg, borderColor: border },
                    !!inCart && { borderColor: Colors.primary },
                  ]}
                  onPress={() => addToCart(p)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.productName, { color: theme.text }]}>{p.name}</Text>
                    <Text style={[styles.productMeta, { color: theme.textSecondary }]}>
                      {p.price.toLocaleString()} UZS · Qoldiq: {p.stock} {p.unit} · {p.category}
                    </Text>
                  </View>
                  {inCart && (
                    <Text style={[styles.inCartBadge, { color: Colors.primary }]}>{inCart.qty}</Text>
                  )}
                  <View style={[styles.addToCartBtn, { backgroundColor: inCart ? Colors.primary + "20" : Colors.primary + "15" }]}>
                    <Ionicons name={inCart ? "checkmark" : "add"} size={18} color={Colors.primary} />
                  </View>
                </Pressable>
              );
            })}
          </>
        )}
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
  locBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  locBannerText: { fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 },
  tabRow: { flexDirection: "row", borderBottomWidth: 1 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabBtnActive: { borderBottomWidth: 2 },
  tabBtnText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#6B7A99" },
  scrollContent: { padding: 16, gap: 10 },
  label: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 },
  chipScroll: { marginBottom: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 4,
  },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  catChipText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  clientInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  clientInfoText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  discountWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  discountInput: { flex: 1, fontSize: 16, fontFamily: "Inter_600SemiBold" },
  discountUnit: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  discountInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  discountInfoText: { fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 80,
    textAlignVertical: "top",
  },
  checkLocBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  checkLocBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  nextBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
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
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  cartItemName: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 4 },
  cartPriceInput: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    borderBottomWidth: 1,
    paddingVertical: 2,
    minWidth: 80,
  },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  qtyBtn: { width: 26, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  qtyText: { fontSize: 14, fontFamily: "Inter_700Bold", minWidth: 24, textAlign: "center" },
  cartItemTotal: { fontSize: 13, fontFamily: "Inter_700Bold", minWidth: 70, textAlign: "right" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: 10,
    borderTopWidth: 1,
  },
  totalLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  totalValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  productName: { fontSize: 14, fontFamily: "Inter_500Medium" },
  productMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  inCartBadge: { fontSize: 14, fontFamily: "Inter_700Bold", marginRight: 4 },
  addToCartBtn: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
});
