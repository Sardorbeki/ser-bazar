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
  Image,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useApp } from "@/contexts/AppContext";
import Colors from "@/constants/colors";
import * as Haptics from "expo-haptics";

const UNITS = ["dona", "kg", "litr", "metr", "quti", "juft", "to'plam"];
const CATEGORIES = ["Ichimliklar", "Choy/Qahva", "Maishiy", "Oziq-ovqat", "Kosmetika", "Elektronika", "Boshqa"];

export default function AddProductModal() {
  const { addProduct } = useApp();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const bg = isDark ? "#0F1D33" : "#FFFFFF";
  const border = isDark ? "#1A2940" : "#E2E8F5";

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [unit, setUnit] = useState("dona");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [image, setImage] = useState("");

  const pickImage = async () => {
    if (Platform.OS === "web") {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.6, base64: true });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setImage(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
      }
    } else {
      Alert.alert("Rasm tanlash", "", [
        { text: "Galereya", onPress: async () => {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) return;
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.6, base64: true });
          if (!result.canceled && result.assets[0]) { const a = result.assets[0]; setImage(a.base64 ? `data:image/jpeg;base64,${a.base64}` : a.uri); }
        }},
        { text: "Kamera", onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) return;
          const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.6, base64: true });
          if (!result.canceled && result.assets[0]) { const a = result.assets[0]; setImage(a.base64 ? `data:image/jpeg;base64,${a.base64}` : a.uri); }
        }},
        { text: "Bekor qilish", style: "cancel" },
      ]);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Xato", "Mahsulot nomini kiriting");
      return;
    }
    const priceNum = parseInt(price.replace(/\s/g, ""));
    if (!priceNum || priceNum <= 0) {
      Alert.alert("Xato", "To'g'ri narx kiriting");
      return;
    }
    addProduct({
      name: name.trim(),
      sku: sku.trim() || `SKU-${Date.now().toString().slice(-5)}`,
      price: priceNum,
      stock: parseInt(stock) || 0,
      unit,
      category,
      image: image || undefined,
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Yangi mahsulot</Text>
        <Pressable onPress={handleSave}>
          <Text style={[styles.saveBtn, { color: Colors.primary }]}>Saqlash</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Image Picker */}
        <Pressable style={[styles.imagePicker, { borderColor: border }]} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <View style={[styles.imagePickerEmpty, { backgroundColor: Colors.primary + "10" }]}>
              <Ionicons name="camera-outline" size={28} color={Colors.primary} />
              <Text style={[styles.imagePickerText, { color: Colors.primary }]}>Rasm qo'shish (ixtiyoriy)</Text>
              <Text style={[styles.imagePickerSub, { color: theme.textMuted ?? "#999" }]}>Istalgan format</Text>
            </View>
          )}
        </Pressable>

        {[
          { label: "Mahsulot nomi *", value: name, onChange: setName, placeholder: "Masalan: Coca-Cola 0.5L", icon: "cube-outline", kt: "default" },
          { label: "SKU / Kod", value: sku, onChange: setSku, placeholder: "CC-001", icon: "barcode-outline", kt: "default" },
          { label: "Narx (UZS) *", value: price, onChange: setPrice, placeholder: "3500", icon: "pricetag-outline", kt: "numeric" },
          { label: "Dastlabki qoldiq", value: stock, onChange: setStock, placeholder: "0", icon: "archive-outline", kt: "numeric" },
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

        <Text style={[styles.label, { color: theme.textSecondary }]}>O'lchov birligi</Text>
        <View style={styles.chips}>
          {UNITS.map((u) => (
            <Pressable
              key={u}
              style={[styles.chip, { borderColor: border }, unit === u && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
              onPress={() => setUnit(u)}
            >
              <Text style={[styles.chipText, unit === u && { color: "#fff" }]}>{u}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.label, { color: theme.textSecondary }]}>Kategoriya</Text>
        <View style={styles.chips}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              style={[styles.chip, { borderColor: border }, category === cat && { backgroundColor: Colors.accent, borderColor: Colors.accent }]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.chipText, category === cat && { color: "#fff" }]}>{cat}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={[styles.saveFullBtn, { backgroundColor: Colors.primary }]} onPress={handleSave}>
          <Ionicons name="add-circle-outline" size={18} color="#fff" />
          <Text style={styles.saveBtnText}>Mahsulot qo'shish</Text>
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
  scrollContent: { padding: 16 },
  fieldGroup: { marginBottom: 14 },
  label: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#6B7A99" },
  saveFullBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  imagePicker: { width: "100%", height: 140, borderRadius: 14, borderWidth: 2, borderStyle: "dashed", overflow: "hidden", marginBottom: 16 },
  productImage: { width: "100%", height: "100%" },
  imagePickerEmpty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6 },
  imagePickerText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  imagePickerSub: { fontSize: 11, fontFamily: "Inter_400Regular" },
});
