import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import { storageGet, storageSet, storageRemove, KEYS } from "@/lib/storage";
import { regosApi, RegosCreds } from "@/lib/regos";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { fetch } from "expo/fetch";

export interface User {
  id: string;
  name: string;
  username: string;
  role: "admin" | "client";
  phone?: string;
  avatar?: string;
}

export interface ClientUser {
  id: string;
  name: string;
  username: string;
  phone: string;
  password: string;
  role: "client";
  createdAt: string;
  avatar?: string;
}

export interface LocationSettings {
  enabled: boolean;
  lat: number;
  lng: number;
  radius: number;
  address?: string;
}

export interface AppSettings {
  locationSettings: LocationSettings | null;
  minOrderAmount: number;
  companyName?: string;
  companyPhone?: string;
  companyAddress?: string;
  companyInn?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  unit: string;
  stock: number;
  category: string;
  image?: string;
  minStock?: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  debt: number;
  totalPurchases: number;
  agentId?: string;
  createdAt: string;
  creditLimit?: number;
  note?: string;
}

export interface Agent {
  id: string;
  name: string;
  phone: string;
  email: string;
  region: string;
  plan: number;
  fact: number;
  customers: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  qty: number;
  price: number;
  unit: string;
}

export interface Order {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  agentId?: string;
  agentName?: string;
  items: OrderItem[];
  total: number;
  status: "draft" | "confirmed" | "shipped" | "delivered" | "cancelled";
  paymentStatus: "unpaid" | "partial" | "paid";
  paidAmount: number;
  createdAt: string;
  deliveredAt?: string;
  note?: string;
  location?: { lat: number; lng: number };
  discount?: number;
}

export interface WarehouseMovement {
  id: string;
  type: "in" | "out";
  productId: string;
  productName: string;
  qty: number;
  unit: string;
  price: number;
  total: number;
  note?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  customerId: string;
  customerName: string;
  orderId?: string;
  amount: number;
  method: "cash" | "card" | "transfer";
  createdAt: string;
  note?: string;
}

interface AppContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authToken: string | null;
  creds: RegosCreds | null;
  appSettings: AppSettings;
  locationSettings: LocationSettings | null;

  products: Product[];
  customers: Customer[];
  agents: Agent[];
  orders: Order[];
  warehouseMovements: WarehouseMovement[];
  payments: Payment[];
  clientUsers: ClientUser[];

  login: (username: string, password: string, baseUrl?: string) => Promise<void>;
  register: (name: string, username: string, phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateCurrentUser: (data: Partial<User>) => Promise<void>;
  refreshData: () => Promise<void>;
  setAppSettings: (settings: Partial<AppSettings>) => Promise<void>;

  addProduct: (p: Omit<Product, "id">) => Promise<void>;
  updateProduct: (id: string, p: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addCustomer: (c: Omit<Customer, "id" | "createdAt">) => Promise<void>;
  updateCustomer: (id: string, c: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addAgent: (a: Omit<Agent, "id">) => Promise<void>;
  updateAgent: (id: string, a: Partial<Agent>) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
  addOrder: (o: Omit<Order, "id" | "number" | "createdAt">) => Promise<void>;
  updateOrder: (id: string, o: Partial<Order>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  addWarehouseMovement: (m: Omit<WarehouseMovement, "id" | "createdAt">) => Promise<void>;
  addPayment: (p: Omit<Payment, "id" | "createdAt">) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function generateOrderNumber() {
  return "ORD-" + Date.now().toString().slice(-6);
}

const ADMIN_USERNAME = "serbazar";
const ADMIN_PASSWORD = "Aa122334117@";

const DEFAULT_SETTINGS: AppSettings = {
  locationSettings: null,
  minOrderAmount: 0,
  companyName: "",
  companyPhone: "",
  companyAddress: "",
  companyInn: "",
};

// ─── API helpers ─────────────────────────────────────────────────────────────
async function apiFetch(method: string, path: string, body?: any, token?: string | null): Promise<any> {
  const baseUrl = getApiUrl();
  const url = new URL(path, baseUrl).toString();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try { msg = JSON.parse(text).error || text; } catch {}
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Sample data for offline fallback ────────────────────────────────────────
function sampleData() {
  const prods: Product[] = [
    { id: "p1", name: "Coca-Cola 0.5L", sku: "CC-001", price: 3500, unit: "dona", stock: 240, category: "Ichimliklar", minStock: 50 },
    { id: "p2", name: "Pepsi 1L", sku: "PP-002", price: 5500, unit: "dona", stock: 180, category: "Ichimliklar", minStock: 30 },
    { id: "p3", name: "Lipton Choy", sku: "LP-003", price: 12000, unit: "quti", stock: 95, category: "Choy/Qahva", minStock: 20 },
    { id: "p4", name: "Nescafe Classic", sku: "NC-004", price: 45000, unit: "quti", stock: 60, category: "Choy/Qahva", minStock: 10 },
    { id: "p5", name: "Tide Kirish Vositasi", sku: "TD-005", price: 28000, unit: "dona", stock: 120, category: "Maishiy", minStock: 25 },
    { id: "p6", name: "Ariel Poroshok", sku: "AR-006", price: 32000, unit: "dona", stock: 85, category: "Maishiy", minStock: 20 },
  ];
  const custs: Customer[] = [
    { id: "c1", name: "Bahor Supermarket", phone: "+998901234567", address: "Toshkent, Chilonzor", debt: 450000, totalPurchases: 12500000, agentId: "a1", createdAt: "2024-01-15", creditLimit: 2000000 },
    { id: "c2", name: "Gulnora Do'koni", phone: "+998907654321", address: "Toshkent, Yunusobod", debt: 0, totalPurchases: 8900000, agentId: "a1", createdAt: "2024-02-01", creditLimit: 1500000 },
    { id: "c3", name: "Rustam Savdo", phone: "+998991122334", address: "Samarqand", debt: 1200000, totalPurchases: 25000000, agentId: "a2", createdAt: "2023-11-20", creditLimit: 3000000 },
    { id: "c4", name: "Farrux Market", phone: "+998935566778", address: "Namangan", debt: 320000, totalPurchases: 6700000, createdAt: "2024-03-10", creditLimit: 1000000 },
  ];
  const agts: Agent[] = [
    { id: "a1", name: "Jasur Toshmatov", phone: "+998901111111", email: "jasur@mail.com", region: "Toshkent", plan: 50000000, fact: 38500000, customers: 12 },
    { id: "a2", name: "Dilshod Yusupov", phone: "+998902222222", email: "dilshod@mail.com", region: "Samarqand", plan: 35000000, fact: 42000000, customers: 8 },
    { id: "a3", name: "Malika Karimova", phone: "+998903333333", email: "malika@mail.com", region: "Namangan", plan: 30000000, fact: 18000000, customers: 6 },
  ];
  const ords: Order[] = [
    { id: "o1", number: "ORD-001", customerId: "c1", customerName: "Bahor Supermarket", agentId: "a1", agentName: "Jasur Toshmatov", items: [{ productId: "p1", productName: "Coca-Cola 0.5L", qty: 48, price: 3500, unit: "dona" }], total: 168000, status: "delivered", paymentStatus: "partial", paidAmount: 100000, createdAt: "2025-02-20" },
    { id: "o2", number: "ORD-002", customerId: "c3", customerName: "Rustam Savdo", agentId: "a2", agentName: "Dilshod Yusupov", items: [{ productId: "p3", productName: "Lipton Choy", qty: 10, price: 12000, unit: "quti" }], total: 120000, status: "shipped", paymentStatus: "unpaid", paidAmount: 0, createdAt: "2025-02-22" },
  ];
  const wms: WarehouseMovement[] = [
    { id: "w1", type: "in", productId: "p1", productName: "Coca-Cola 0.5L", qty: 100, unit: "dona", price: 2800, total: 280000, createdAt: "2025-02-18" },
    { id: "w2", type: "out", productId: "p1", productName: "Coca-Cola 0.5L", qty: 48, unit: "dona", price: 3500, total: 168000, note: "ORD-001", createdAt: "2025-02-20" },
  ];
  const pays: Payment[] = [
    { id: "py1", customerId: "c1", customerName: "Bahor Supermarket", orderId: "o1", amount: 100000, method: "transfer", createdAt: "2025-02-21" },
  ];
  return { products: prods, customers: custs, agents: agts, orders: ords, warehouseMovements: wms, payments: pays };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [creds, setCreds] = useState<RegosCreds | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [appSettings, setAppSettingsState] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [clientUsers, setClientUsers] = useState<ClientUser[]>([]);

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [warehouseMovements, setWarehouseMovements] = useState<WarehouseMovement[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  // Load from storage on mount, then fetch from API
  useEffect(() => {
    (async () => {
      try {
        const [savedUser, savedToken, savedCreds, savedSettings, savedClientUsers] = await Promise.all([
          storageGet<User>(KEYS.USER),
          storageGet<string>("auth_token_jwt"),
          storageGet<RegosCreds>(KEYS.AUTH_TOKEN),
          storageGet<AppSettings>(KEYS.APP_SETTINGS),
          storageGet<ClientUser[]>(KEYS.CLIENT_USERS),
        ]);

        if (savedUser) setUser(savedUser);
        if (savedToken) setAuthToken(savedToken);
        if (savedCreds) setCreds(savedCreds);
        if (savedSettings) setAppSettingsState({ ...DEFAULT_SETTINGS, ...savedSettings });
        if (savedClientUsers) setClientUsers(savedClientUsers);

        // Load cached data first for instant display
        const [p, c, a, o, w, py] = await Promise.all([
          storageGet<Product[]>(KEYS.PRODUCTS),
          storageGet<Customer[]>(KEYS.CUSTOMERS),
          storageGet<Agent[]>(KEYS.AGENTS),
          storageGet<Order[]>(KEYS.ORDERS),
          storageGet<WarehouseMovement[]>(KEYS.WAREHOUSE),
          storageGet<Payment[]>(KEYS.PAYMENTS),
        ]);
        if (p && p.length > 0) setProducts(p);
        if (c && c.length > 0) setCustomers(c);
        if (a && a.length > 0) setAgents(a);
        if (o && o.length > 0) setOrders(o);
        if (w && w.length > 0) setWarehouseMovements(w);
        if (py && py.length > 0) setPayments(py);

        // If logged in, fetch fresh data from API
        if (savedToken) {
          await loadFromApi(savedToken);
        } else if (!p || p.length === 0) {
          // No token, no cache — use sample data
          const sample = sampleData();
          setProducts(sample.products);
          setCustomers(sample.customers);
          setAgents(sample.agents);
          setOrders(sample.orders);
          setWarehouseMovements(sample.warehouseMovements);
          setPayments(sample.payments);
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const loadFromApi = async (token: string) => {
    try {
      const [prods, custs, agts, ords, wms, pays] = await Promise.all([
        apiFetch("GET", "/api/products", undefined, token),
        apiFetch("GET", "/api/customers", undefined, token),
        apiFetch("GET", "/api/agents", undefined, token),
        apiFetch("GET", "/api/orders", undefined, token),
        apiFetch("GET", "/api/warehouse", undefined, token),
        apiFetch("GET", "/api/payments", undefined, token),
      ]);
      const mappedProds = prods.map((p: any) => ({ id: p.id, name: p.name, sku: p.sku || "", price: p.price, unit: p.unit, stock: p.stock, category: p.category, image: p.image, minStock: p.minStock || p.min_stock }));
      const mappedCusts = custs.map((c: any) => ({ id: c.id, name: c.name, phone: c.phone, address: c.address, debt: c.debt, totalPurchases: c.totalPurchases || c.total_purchases, agentId: c.agentId || c.agent_id, createdAt: c.createdAt || c.created_at, creditLimit: c.creditLimit || c.credit_limit, note: c.note }));
      const mappedAgts = agts.map((a: any) => ({ id: a.id, name: a.name, phone: a.phone, email: a.email, region: a.region, plan: a.plan, fact: a.fact, customers: a.customers || a.customersCount || a.customers_count || 0 }));
      const mappedOrds = ords.map((o: any) => ({ id: o.id, number: o.number, customerId: o.customerId || o.customer_id, customerName: o.customerName || o.customer_name, agentId: o.agentId || o.agent_id, agentName: o.agentName || o.agent_name, items: Array.isArray(o.items) ? o.items : JSON.parse(o.items || "[]"), total: o.total, status: o.status, paymentStatus: o.paymentStatus || o.payment_status, paidAmount: o.paidAmount || o.paid_amount || 0, createdAt: o.createdAt || o.created_at, note: o.note, deliveredAt: o.deliveredAt || o.delivered_at }));
      const mappedWms = wms.map((w: any) => ({ id: w.id, type: w.type, productId: w.productId || w.product_id, productName: w.productName || w.product_name, qty: w.qty, unit: w.unit, price: w.price, total: w.total, note: w.note, createdAt: w.createdAt || w.created_at }));
      const mappedPays = pays.map((p: any) => ({ id: p.id, customerId: p.customerId || p.customer_id, customerName: p.customerName || p.customer_name, orderId: p.orderId || p.order_id, amount: p.amount, method: p.method, createdAt: p.createdAt || p.created_at, note: p.note }));

      setProducts(mappedProds);
      setCustomers(mappedCusts);
      setAgents(mappedAgts);
      setOrders(mappedOrds);
      setWarehouseMovements(mappedWms);
      setPayments(mappedPays);

      // Cache locally
      await Promise.all([
        storageSet(KEYS.PRODUCTS, mappedProds),
        storageSet(KEYS.CUSTOMERS, mappedCusts),
        storageSet(KEYS.AGENTS, mappedAgts),
        storageSet(KEYS.ORDERS, mappedOrds),
        storageSet(KEYS.WAREHOUSE, mappedWms),
        storageSet(KEYS.PAYMENTS, mappedPays),
      ]);
    } catch (e) {
      console.warn("API fetch failed, using cached data:", e);
    }
  };

  const login = async (username: string, password: string, baseUrl = "https://regos.online") => {
    // Admin login
    if (username.trim() === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const data = await apiFetch("POST", "/api/auth/login", { username: ADMIN_USERNAME, password: ADMIN_PASSWORD });
      const token: string = data.token;
      const newUser: User = data.user;
      const newCreds: RegosCreds = { baseUrl, token };
      await Promise.all([
        storageSet("auth_token_jwt", token),
        storageSet(KEYS.AUTH_TOKEN, newCreds),
        storageSet(KEYS.USER, newUser),
      ]);
      setAuthToken(token);
      setCreds(newCreds);
      setUser(newUser);
      await loadFromApi(token);
      return;
    }
    // Client login
    const data = await apiFetch("POST", "/api/auth/login", { username: username.trim().toLowerCase(), password });
    const token: string = data.token;
    const newUser: User = data.user;
    const newCreds: RegosCreds = { baseUrl, token: "client-mode" };
    await Promise.all([
      storageSet("auth_token_jwt", token),
      storageSet(KEYS.AUTH_TOKEN, newCreds),
      storageSet(KEYS.USER, newUser),
    ]);
    setAuthToken(token);
    setCreds(newCreds);
    setUser(newUser);
    await loadFromApi(token);
  };

  const register = async (name: string, username: string, phone: string, password: string) => {
    const data = await apiFetch("POST", "/api/auth/register", {
      name: name.trim(), username: username.trim().toLowerCase(), phone: phone.trim(), password,
    });
    const token: string = data.token;
    const newUser: User = data.user;
    const newClient: ClientUser = {
      id: newUser.id, name: newUser.name, username: newUser.username,
      phone: newUser.phone ?? "", password, role: "client",
      createdAt: new Date().toISOString().slice(0, 10),
    };
    const updatedUsers = [...clientUsers.filter(u => u.username !== newUser.username), newClient];
    setClientUsers(updatedUsers);
    const newCreds: RegosCreds = { baseUrl: "https://regos.online", token: "client-mode" };
    await Promise.all([
      storageSet("auth_token_jwt", token),
      storageSet(KEYS.AUTH_TOKEN, newCreds),
      storageSet(KEYS.USER, newUser),
      storageSet(KEYS.CLIENT_USERS, updatedUsers),
    ]);
    setAuthToken(token);
    setCreds(newCreds);
    setUser(newUser);
    await loadFromApi(token);
  };

  const logout = async () => {
    await Promise.all([
      storageRemove("auth_token_jwt"),
      storageRemove(KEYS.AUTH_TOKEN),
      storageRemove(KEYS.USER),
    ]);
    setUser(null);
    setAuthToken(null);
    setCreds(null);
  };

  const updateCurrentUser = async (data: Partial<User>) => {
    if (!user) return;
    await apiFetch("PUT", `/api/auth/profile/${user.id}`, data, authToken);
    const updated = { ...user, ...data };
    setUser(updated);
    await storageSet(KEYS.USER, updated);
  };

  const refreshData = async () => {
    setIsLoading(true);
    try {
      if (authToken) {
        await loadFromApi(authToken);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const setAppSettings = async (settings: Partial<AppSettings>) => {
    const updated = { ...appSettings, ...settings };
    setAppSettingsState(updated);
    await storageSet(KEYS.APP_SETTINGS, updated);
    if (authToken) {
      await apiFetch("POST", "/api/settings", settings, authToken).catch(() => {});
    }
  };

  // ─── PRODUCTS ──────────────────────────────────────────────────────────────
  const addProduct = async (p: Omit<Product, "id">) => {
    try {
      const item = await apiFetch("POST", "/api/products", p, authToken);
      const mapped: Product = { id: item.id, name: item.name, sku: item.sku, price: item.price, unit: item.unit, stock: item.stock, category: item.category, image: item.image, minStock: item.minStock || item.min_stock };
      setProducts(prev => { const next = [...prev, mapped]; storageSet(KEYS.PRODUCTS, next); return next; });
    } catch {
      const newP = { ...p, id: generateId() };
      setProducts(prev => { const next = [...prev, newP]; storageSet(KEYS.PRODUCTS, next); return next; });
    }
  };

  const updateProduct = async (id: string, p: Partial<Product>) => {
    try {
      await apiFetch("PUT", `/api/products/${id}`, p, authToken);
    } catch {}
    setProducts(prev => { const next = prev.map(x => x.id === id ? { ...x, ...p } : x); storageSet(KEYS.PRODUCTS, next); return next; });
  };

  const deleteProduct = async (id: string) => {
    try { await apiFetch("DELETE", `/api/products/${id}`, undefined, authToken); } catch {}
    setProducts(prev => { const next = prev.filter(x => x.id !== id); storageSet(KEYS.PRODUCTS, next); return next; });
  };

  // ─── CUSTOMERS ─────────────────────────────────────────────────────────────
  const addCustomer = async (c: Omit<Customer, "id" | "createdAt">) => {
    try {
      const item = await apiFetch("POST", "/api/customers", c, authToken);
      const mapped: Customer = { id: item.id, name: item.name, phone: item.phone, address: item.address, debt: item.debt, totalPurchases: item.totalPurchases || item.total_purchases || 0, agentId: item.agentId || item.agent_id, createdAt: item.createdAt || item.created_at, creditLimit: item.creditLimit || item.credit_limit, note: item.note };
      setCustomers(prev => { const next = [...prev, mapped]; storageSet(KEYS.CUSTOMERS, next); return next; });
    } catch {
      const newC: Customer = { ...c, id: generateId(), createdAt: new Date().toISOString().slice(0, 10) };
      setCustomers(prev => { const next = [...prev, newC]; storageSet(KEYS.CUSTOMERS, next); return next; });
    }
  };

  const updateCustomer = async (id: string, c: Partial<Customer>) => {
    try { await apiFetch("PUT", `/api/customers/${id}`, c, authToken); } catch {}
    setCustomers(prev => { const next = prev.map(x => x.id === id ? { ...x, ...c } : x); storageSet(KEYS.CUSTOMERS, next); return next; });
  };

  const deleteCustomer = async (id: string) => {
    try { await apiFetch("DELETE", `/api/customers/${id}`, undefined, authToken); } catch {}
    setCustomers(prev => { const next = prev.filter(x => x.id !== id); storageSet(KEYS.CUSTOMERS, next); return next; });
  };

  // ─── AGENTS ────────────────────────────────────────────────────────────────
  const addAgent = async (a: Omit<Agent, "id">) => {
    try {
      const item = await apiFetch("POST", "/api/agents", a, authToken);
      const mapped: Agent = { id: item.id, name: item.name, phone: item.phone, email: item.email, region: item.region, plan: item.plan, fact: item.fact, customers: item.customers || item.customersCount || 0 };
      setAgents(prev => { const next = [...prev, mapped]; storageSet(KEYS.AGENTS, next); return next; });
    } catch {
      const newA: Agent = { ...a, id: generateId() };
      setAgents(prev => { const next = [...prev, newA]; storageSet(KEYS.AGENTS, next); return next; });
    }
  };

  const updateAgent = async (id: string, a: Partial<Agent>) => {
    try { await apiFetch("PUT", `/api/agents/${id}`, a, authToken); } catch {}
    setAgents(prev => { const next = prev.map(x => x.id === id ? { ...x, ...a } : x); storageSet(KEYS.AGENTS, next); return next; });
  };

  const deleteAgent = async (id: string) => {
    try { await apiFetch("DELETE", `/api/agents/${id}`, undefined, authToken); } catch {}
    setAgents(prev => { const next = prev.filter(x => x.id !== id); storageSet(KEYS.AGENTS, next); return next; });
  };

  // ─── ORDERS ────────────────────────────────────────────────────────────────
  const addOrder = async (o: Omit<Order, "id" | "number" | "createdAt">) => {
    const tempOrder: Order = { ...o, id: generateId(), number: generateOrderNumber(), createdAt: new Date().toISOString().slice(0, 10) };
    // Optimistic update
    setOrders(prev => { const next = [...prev, tempOrder]; storageSet(KEYS.ORDERS, next); return next; });
    setCustomers(prev => { const next = prev.map(c => c.id === o.customerId ? { ...c, totalPurchases: c.totalPurchases + o.total, debt: c.debt + o.total } : c); storageSet(KEYS.CUSTOMERS, next); return next; });
    o.items.forEach(item => {
      setProducts(prev => { const next = prev.map(p => p.id === item.productId ? { ...p, stock: Math.max(0, p.stock - item.qty) } : p); storageSet(KEYS.PRODUCTS, next); return next; });
      const movement: WarehouseMovement = { id: generateId(), type: "out", productId: item.productId, productName: item.productName, qty: item.qty, unit: item.unit, price: item.price, total: item.qty * item.price, note: tempOrder.number, createdAt: tempOrder.createdAt };
      setWarehouseMovements(prev => { const next = [...prev, movement]; storageSet(KEYS.WAREHOUSE, next); return next; });
    });
    try {
      const saved = await apiFetch("POST", "/api/orders", o, authToken);
      const mapped: Order = { id: saved.id, number: saved.number, customerId: saved.customerId || saved.customer_id, customerName: saved.customerName || saved.customer_name, agentId: saved.agentId || saved.agent_id, agentName: saved.agentName || saved.agent_name, items: Array.isArray(saved.items) ? saved.items : JSON.parse(saved.items || "[]"), total: saved.total, status: saved.status, paymentStatus: saved.paymentStatus || saved.payment_status, paidAmount: saved.paidAmount || saved.paid_amount || 0, createdAt: saved.createdAt || saved.created_at, note: saved.note };
      setOrders(prev => { const next = prev.map(x => x.id === tempOrder.id ? mapped : x); storageSet(KEYS.ORDERS, next); return next; });
    } catch (e) {
      console.warn("Order save to API failed, kept locally:", e);
    }
  };

  const updateOrder = async (id: string, o: Partial<Order>) => {
    try { await apiFetch("PUT", `/api/orders/${id}`, o, authToken); } catch {}
    setOrders(prev => { const next = prev.map(x => x.id === id ? { ...x, ...o } : x); storageSet(KEYS.ORDERS, next); return next; });
  };

  const deleteOrder = async (id: string) => {
    try { await apiFetch("DELETE", `/api/orders/${id}`, undefined, authToken); } catch {}
    setOrders(prev => { const next = prev.filter(x => x.id !== id); storageSet(KEYS.ORDERS, next); return next; });
  };

  // ─── WAREHOUSE ─────────────────────────────────────────────────────────────
  const addWarehouseMovement = async (m: Omit<WarehouseMovement, "id" | "createdAt">) => {
    const newM: WarehouseMovement = { ...m, id: generateId(), createdAt: new Date().toISOString().slice(0, 10) };
    setWarehouseMovements(prev => { const next = [...prev, newM]; storageSet(KEYS.WAREHOUSE, next); return next; });
    if (m.type === "in") {
      setProducts(prev => { const next = prev.map(p => p.id === m.productId ? { ...p, stock: p.stock + m.qty } : p); storageSet(KEYS.PRODUCTS, next); return next; });
    }
    try { await apiFetch("POST", "/api/warehouse", m, authToken); } catch {}
  };

  // ─── PAYMENTS ──────────────────────────────────────────────────────────────
  const addPayment = async (p: Omit<Payment, "id" | "createdAt">) => {
    const newP: Payment = { ...p, id: generateId(), createdAt: new Date().toISOString().slice(0, 10) };
    setPayments(prev => { const next = [...prev, newP]; storageSet(KEYS.PAYMENTS, next); return next; });
    if (p.orderId) {
      setOrders(prev => { const next = prev.map(o => { if (o.id !== p.orderId) return o; const paidAmount = o.paidAmount + p.amount; return { ...o, paidAmount, paymentStatus: paidAmount >= o.total ? "paid" : paidAmount > 0 ? "partial" : "unpaid" as any }; }); storageSet(KEYS.ORDERS, next); return next; });
    }
    setCustomers(prev => { const next = prev.map(c => c.id === p.customerId ? { ...c, debt: Math.max(0, c.debt - p.amount) } : c); storageSet(KEYS.CUSTOMERS, next); return next; });
    try { await apiFetch("POST", "/api/payments", p, authToken); } catch {}
  };

  const value = useMemo(() => ({
    user, isAuthenticated: !!user, isLoading, authToken, creds, appSettings,
    locationSettings: appSettings.locationSettings,
    products, customers, agents, orders, warehouseMovements, payments, clientUsers,
    login, register, logout, updateCurrentUser, refreshData, setAppSettings,
    addProduct, updateProduct, deleteProduct,
    addCustomer, updateCustomer, deleteCustomer,
    addAgent, updateAgent, deleteAgent,
    addOrder, updateOrder, deleteOrder,
    addWarehouseMovement, addPayment,
  }), [user, isLoading, authToken, creds, appSettings, products, customers, agents, orders, warehouseMovements, payments, clientUsers]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be within AppProvider");
  return ctx;
}
