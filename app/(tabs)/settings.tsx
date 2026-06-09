import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, Pressable, TextInput,
  ScrollView, useColorScheme, Alert, Platform, Switch, FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useApp, LocationSettings } from "@/contexts/AppContext";
import Colors from "@/constants/colors";

type SettingsTab = "general" | "users" | "company";

export default function SettingsScreen() {
  const { appSettings, setAppSettings, user, logout, clientUsers } = useApp();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const isWeb = Platform.OS === "web";
  const isAdmin = user?.role === "admin";

  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [companyName, setCompanyName] = useState(appSettings.companyName ?? "");
  const [companyPhone, setCompanyPhone] = useState(appSettings.companyPhone ?? "");
  const [companyAddress, setCompanyAddress] = useState(appSettings.companyAddress ?? "");
  const [companyInn, setCompanyInn] = useState(appSettings.companyInn ?? "");

  const locSettings = appSettings.locationSettings;
  const [enabled, setEnabled] = useState(locSettings?.enabled ?? false);
  const [lat, setLat] = useState(locSettings?.lat?.toString() ?? "");
  const [lng, setLng] = useState(locSettings?.lng?.toString() ?? "");
  const [radius, setRadius] = useState(locSettings?.radius?.toString() ?? "5");
  const [address, setAddress] = useState(locSettings?.address ?? "");
  const [minOrder, setMinOrder] = useState(appSettings.minOrderAmount?.toString() ?? "0");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (locSettings) {
      setEnabled(locSettings.enabled);
      setLat(locSettings.lat?.toString() ?? "");
      setLng(locSettings.lng?.toString() ?? "");
      setRadius(locSettings.radius?.toString() ?? "5");
      setAddress(locSettings.address ?? "");
    }
    setMinOrder(appSettings.minOrderAmount?.toString() ?? "0");
    setCompanyName(appSettings.companyName ?? "");
    setCompanyPhone(appSettings.companyPhone ?? "");
    setCompanyAddress(appSettings.companyAddress ?? "");
    setCompanyInn(appSettings.companyInn ?? "");
  }, [appSettings]);

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { Alert.alert("Xato", "Lokatsiya ruxsati kerak"); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLat(loc.coords.latitude.toFixed(6));
      setLng(loc.coords.longitude.toFixed(6));
      try {
        const geo = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        if (geo.length > 0) {
          const g = geo[0];
          setAddress([g.street, g.district, g.city].filter(Boolean).join(", "));
        }
      } catch {}
    } catch { Alert.alert("Xato", "Lokatsiyani aniqlab bo'lmadi"); }
    finally { setLoading(false); }
  };

  const handleSaveGeneral = async () => {
    if (enabled) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      if (isNaN(latNum) || isNaN(lngNum)) { Alert.alert("Xato", "Koordinatalarni to'g'ri kiriting"); return; }
      if (isNaN(parseFloat(radius)) || parseFloat(radius) <= 0) { Alert.alert("Xato", "Radiusni kiriting (km)"); return; }
    }
    await setAppSettings({
      locationSettings: {
        enabled,
        lat: parseFloat(lat) || 0,
        lng: parseFloat(lng) || 0,
        radius: parseFloat(radius) || 5,
        address,
      },
      minOrderAmount: parseInt(minOrder.replace(/\s/g, "")) || 0,
    });
    Alert.alert("Saqlandi", "Sozlamalar saqlandi");
  };

  const handleSaveCompany = async () => {
    if (!companyName.trim()) { Alert.alert("Xato", "Kompaniya nomini kiriting"); return; }
    await setAppSettings({
      companyName: companyName.trim(),
      companyPhone: companyPhone.trim(),
      companyAddress: companyAddress.trim(),
      companyInn: companyInn.trim(),
    });
    Alert.alert("Saqlandi", "Kompaniya ma'lumotlari saqlandi");
  };

  const topPadding = isWeb ? 67 : insets.top;

  const tabs: { key: SettingsTab; label: string; icon: string }[] = [
    { key: "general", label: "Umumiy", icon: "settings-outline" },
    { key: "company", label: "Kompaniya", icon: "business-outline" },
    { key: "users", label: "Foydalanuvchilar", icon: "people-outline" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Ionicons name="settings" size={22} color={Colors.primary} />
        <Text style={[styles.headerTitle, { color: theme.text }]}>Sozlamalar</Text>
      </View>

      {isAdmin && (
        <View style={[styles.tabRow, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          {tabs.map((tab) => (
            <Pressable
              key={tab.key}
              style={[styles.tabBtn, activeTab === tab.key && { borderBottomColor: Colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons name={tab.icon as any} size={16} color={activeTab === tab.key ? Colors.primary : theme.textMuted} />
              <Text style={[styles.tabBtnText, { color: activeTab === tab.key ? Colors.primary : theme.textSecondary }]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 80 }]}>
        {/* Profile Card — always shown */}
        <Pressable
          style={[styles.profileCard, { backgroundColor: Colors.primary + "15", borderColor: Colors.primary + "40" }]}
          onPress={() => router.push("/(modals)/profile")}
        >
          <View style={[styles.avatar, { backgroundColor: Colors.primary }]}>
            <Text style={styles.avatarInitials}>
              {user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: theme.text }]}>{user?.name}</Text>
            <Text style={[styles.profileSub, { color: theme.textSecondary }]}>
              @{user?.username} · {isAdmin ? "Administrator" : "Klient"}
              {user?.phone ? ` · ${user.phone}` : ""}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
        </Pressable>

        {/* GENERAL TAB */}
        {(!isAdmin || activeTab === "general") && (
          <>
            {isAdmin && (
              <>
                <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={styles.sectionHeader}>
                    <View style={[styles.sectionIcon, { backgroundColor: Colors.warning + "20" }]}>
                      <Ionicons name="cash-outline" size={20} color={Colors.warning} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.sectionTitle, { color: theme.text }]}>Minimal buyurtma summasi</Text>
                      <Text style={[styles.sectionDesc, { color: theme.textSecondary }]}>Bu summadan past buyurtma qabul qilinmaydi</Text>
                    </View>
                  </View>
                  <View style={[styles.inputWrap, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <Ionicons name="pricetag-outline" size={18} color={theme.textMuted} />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      value={minOrder}
                      onChangeText={setMinOrder}
                      placeholder="0"
                      placeholderTextColor={theme.textMuted}
                      keyboardType="numeric"
                    />
                    <Text style={[styles.unit, { color: theme.textMuted }]}>UZS</Text>
                  </View>
                </View>

                <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={styles.sectionHeader}>
                    <View style={[styles.sectionIcon, { backgroundColor: Colors.primary + "20" }]}>
                      <Ionicons name="location" size={20} color={Colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.sectionTitle, { color: theme.text }]}>Lokatsiya oralig'i</Text>
                      <Text style={[styles.sectionDesc, { color: theme.textSecondary }]}>Hududdan tashqarida buyurtma berib bo'lmaydi</Text>
                    </View>
                    <Switch
                      value={enabled}
                      onValueChange={setEnabled}
                      trackColor={{ false: theme.border, true: Colors.primary + "80" }}
                      thumbColor={enabled ? Colors.primary : theme.textMuted}
                    />
                  </View>

                  {enabled && (
                    <View style={styles.locFields}>
                      <Pressable style={[styles.locBtn, { backgroundColor: Colors.primary }]} onPress={getCurrentLocation} disabled={loading}>
                        <Ionicons name="locate" size={18} color="#fff" />
                        <Text style={styles.locBtnText}>{loading ? "Aniqlanmoqda..." : "Joriy joylashuv"}</Text>
                      </Pressable>
                      {address ? (
                        <View style={[styles.addressRow, { backgroundColor: Colors.primary + "15", borderColor: Colors.primary + "40" }]}>
                          <Ionicons name="location" size={14} color={Colors.primary} />
                          <Text style={[styles.addressText, { color: Colors.primary }]}>{address}</Text>
                        </View>
                      ) : null}
                      <View style={styles.coordRow}>
                        {[
                          { label: "Kenglik (lat)", value: lat, onChange: setLat, placeholder: "41.2995" },
                          { label: "Uzunlik (lng)", value: lng, onChange: setLng, placeholder: "69.2401" },
                        ].map((f) => (
                          <View key={f.label} style={[styles.coordField, { backgroundColor: theme.background, borderColor: theme.border }]}>
                            <Text style={[styles.coordLabel, { color: theme.textMuted }]}>{f.label}</Text>
                            <TextInput style={[styles.coordValue, { color: theme.text }]} value={f.value} onChangeText={f.onChange} placeholder={f.placeholder} placeholderTextColor={theme.textMuted} keyboardType="decimal-pad" />
                          </View>
                        ))}
                      </View>
                      <View style={[styles.inputWrap, { backgroundColor: theme.background, borderColor: theme.border }]}>
                        <Ionicons name="radio-outline" size={18} color={theme.textMuted} />
                        <TextInput style={[styles.input, { color: theme.text }]} value={radius} onChangeText={setRadius} placeholder="Radius" placeholderTextColor={theme.textMuted} keyboardType="decimal-pad" />
                        <Text style={[styles.unit, { color: theme.textMuted }]}>km</Text>
                      </View>
                      {lat && lng && (
                        <View style={[styles.previewRow, { backgroundColor: Colors.primary + "15", borderColor: Colors.primary + "40" }]}>
                          <Ionicons name="information-circle" size={14} color={Colors.primary} />
                          <Text style={[styles.previewText, { color: Colors.primary }]}>
                            {parseFloat(lat).toFixed(4)}, {parseFloat(lng).toFixed(4)} · {radius} km radius
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>

                <Pressable style={[styles.saveBtn, { backgroundColor: Colors.primary }]} onPress={handleSaveGeneral}>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                  <Text style={styles.saveBtnText}>Sozlamalarni saqlash</Text>
                </Pressable>
              </>
            )}

            <Pressable
              style={[styles.logoutBtn, { borderColor: Colors.danger + "60" }]}
              onPress={() => Alert.alert("Chiqish", "Tizimdan chiqishni xohlaysizmi?", [
                { text: "Bekor qilish", style: "cancel" },
                { text: "Chiqish", style: "destructive", onPress: logout },
              ])}
            >
              <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
              <Text style={[styles.logoutText, { color: Colors.danger }]}>Tizimdan chiqish</Text>
            </Pressable>
          </>
        )}

        {/* COMPANY TAB */}
        {isAdmin && activeTab === "company" && (
          <>
            <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Kompaniya ma'lumotlari</Text>
              <Text style={[styles.sectionDesc, { color: theme.textSecondary }]}>
                Bu ma'lumotlar hisob-faktura va cheklarda ko'rinadi
              </Text>

              {[
                { label: "Kompaniya nomi *", value: companyName, onChange: setCompanyName, placeholder: "Ser Bazar MChJ", icon: "business-outline" },
                { label: "Telefon raqami", value: companyPhone, onChange: setCompanyPhone, placeholder: "+998 71 123 45 67", icon: "call-outline", keyboardType: "phone-pad" },
                { label: "Manzil", value: companyAddress, onChange: setCompanyAddress, placeholder: "Toshkent sh., Chilonzor tumani", icon: "location-outline" },
                { label: "INN / STIR", value: companyInn, onChange: setCompanyInn, placeholder: "123456789", icon: "card-outline", keyboardType: "numeric" },
              ].map((f) => (
                <View key={f.label}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{f.label}</Text>
                  <View style={[styles.inputWrap, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <Ionicons name={f.icon as any} size={18} color={theme.textMuted} />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      value={f.value}
                      onChangeText={f.onChange}
                      placeholder={f.placeholder}
                      placeholderTextColor={theme.textMuted}
                      keyboardType={(f as any).keyboardType ?? "default"}
                    />
                  </View>
                </View>
              ))}
            </View>

            {appSettings.companyName ? (
              <View style={[styles.section, { backgroundColor: Colors.primary + "10", borderColor: Colors.primary + "30" }]}>
                <Text style={[styles.sectionTitle, { color: Colors.primary }]}>Joriy ma'lumotlar</Text>
                {appSettings.companyName && <Text style={[styles.companyInfoRow, { color: theme.text }]}>🏢 {appSettings.companyName}</Text>}
                {appSettings.companyPhone && <Text style={[styles.companyInfoRow, { color: theme.textSecondary }]}>📞 {appSettings.companyPhone}</Text>}
                {appSettings.companyAddress && <Text style={[styles.companyInfoRow, { color: theme.textSecondary }]}>📍 {appSettings.companyAddress}</Text>}
                {appSettings.companyInn && <Text style={[styles.companyInfoRow, { color: theme.textSecondary }]}>🔢 INN: {appSettings.companyInn}</Text>}
              </View>
            ) : null}

            <Pressable style={[styles.saveBtn, { backgroundColor: Colors.primary }]} onPress={handleSaveCompany}>
              <Ionicons name="business-outline" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>Kompaniyani saqlash</Text>
            </Pressable>
          </>
        )}

        {/* USERS TAB */}
        {isAdmin && activeTab === "users" && (
          <>
            <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: Colors.primary + "20" }]}>
                  <Ionicons name="people" size={20} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Ro'yxatdan o'tgan klientlar</Text>
                  <Text style={[styles.sectionDesc, { color: theme.textSecondary }]}>{clientUsers.length} ta klient</Text>
                </View>
              </View>
            </View>

            {clientUsers.length === 0 ? (
              <View style={styles.emptyUsers}>
                <Ionicons name="person-add-outline" size={40} color={theme.textMuted} />
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>Hali klientlar yo'q</Text>
                <Text style={[styles.emptySubText, { color: theme.textMuted }]}>
                  Klientlar ro'yxatdan o'tganda bu yerda ko'rinadi
                </Text>
              </View>
            ) : (
              clientUsers.map((u) => (
                <View key={u.id} style={[styles.userCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={[styles.userAvatar, { backgroundColor: Colors.accent + "25" }]}>
                    <Text style={[styles.userAvatarText, { color: Colors.accent }]}>
                      {u.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.userName, { color: theme.text }]}>{u.name}</Text>
                    <Text style={[styles.userMeta, { color: theme.textSecondary }]}>
                      @{u.username} · {u.phone || "Tel yo'q"}
                    </Text>
                    <Text style={[styles.userDate, { color: theme.textMuted }]}>
                      Ro'yxatdan o'tgan: {u.createdAt}
                    </Text>
                  </View>
                  <View style={[styles.userRoleBadge, { backgroundColor: Colors.primary + "20" }]}>
                    <Text style={[styles.userRoleText, { color: Colors.primary }]}>Klient</Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  tabRow: { flexDirection: "row", borderBottomWidth: 1 },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12 },
  tabBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  scroll: { padding: 16, gap: 14 },
  profileCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  avatarInitials: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  profileName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  profileSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  section: { borderRadius: 16, padding: 14, borderWidth: 1, gap: 12 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  sectionIcon: { width: 42, height: 42, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  sectionDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_600SemiBold" },
  unit: { fontSize: 13, fontFamily: "Inter_500Medium" },
  locFields: { gap: 10 },
  locBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 12 },
  locBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 6, padding: 10, borderRadius: 10, borderWidth: 1 },
  addressText: { fontSize: 12, fontFamily: "Inter_500Medium", flex: 1 },
  coordRow: { flexDirection: "row", gap: 10 },
  coordField: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 10, gap: 4 },
  coordLabel: { fontSize: 10, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.3 },
  coordValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  previewRow: { flexDirection: "row", alignItems: "center", gap: 6, padding: 10, borderRadius: 10, borderWidth: 1 },
  previewText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  companyInfoRow: { fontSize: 14, fontFamily: "Inter_500Medium" },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 14 },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5 },
  logoutText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  emptyUsers: { alignItems: "center", paddingVertical: 30, gap: 8 },
  emptyText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  emptySubText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  userCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  userAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  userAvatarText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  userName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  userMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  userDate: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  userRoleBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  userRoleText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
});
