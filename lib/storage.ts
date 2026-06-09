import AsyncStorage from "@react-native-async-storage/async-storage";

export async function storageGet<T>(key: string): Promise<T | null> {
  try {
    const val = await AsyncStorage.getItem(key);
    return val ? (JSON.parse(val) as T) : null;
  } catch {
    return null;
  }
}

export async function storageSet<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export async function storageRemove(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {}
}

export const KEYS = {
  AUTH_TOKEN: "auth_token",
  USER: "user",
  PRODUCTS: "products",
  ORDERS: "orders",
  CUSTOMERS: "customers",
  AGENTS: "agents",
  WAREHOUSE: "warehouse",
  PAYMENTS: "payments",
  REGOS_BASE_URL: "regos_base_url",
  LOCATION_SETTINGS: "location_settings",
  APP_SETTINGS: "app_settings",
  CLIENT_USERS: "client_users",
};
