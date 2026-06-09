import { storageGet, KEYS } from "./storage";

export interface RegosCreds {
  baseUrl: string;
  token: string;
}

async function getHeaders() {
  const creds = await storageGet<RegosCreds>(KEYS.AUTH_TOKEN);
  return {
    "Content-Type": "application/json",
    Authorization: creds?.token ? `Bearer ${creds.token}` : "",
  };
}

async function getBase(): Promise<string> {
  const creds = await storageGet<RegosCreds>(KEYS.AUTH_TOKEN);
  return creds?.baseUrl ?? "https://regos.online/api";
}

async function req<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const base = await getBase();
  const headers = await getHeaders();
  const url = `${base}${path}`;
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

export const regosApi = {
  login: (username: string, password: string, baseUrl: string) =>
    fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login: username, password }),
    }).then((r) => {
      if (!r.ok) throw new Error("Login xatosi");
      return r.json();
    }),

  getProducts: () =>
    fetch("https://integration.regos.uz/gateway/out/226baa0399ae43bba261165a4d4de611", {
      method: "GET",
      headers: { "Accept": "application/json" },
    }).then((r) => {
      if (!r.ok) throw new Error("Mahsulotlarni yuklashda xatolik");
      return r.json();
    }),
  getProduct: (id: string) => req<any>("GET", `/products/${id}`),
  createProduct: (data: any) => req<any>("POST", "/products", data),
  updateProduct: (id: string, data: any) =>
    req<any>("PUT", `/products/${id}`, data),

  getWarehouse: () => req<any[]>("GET", "/warehouse"),
  getWarehouseMovements: () => req<any[]>("GET", "/warehouse/movements"),
  createWarehouseIn: (data: any) =>
    req<any>("POST", "/warehouse/in", data),
  createWarehouseOut: (data: any) =>
    req<any>("POST", "/warehouse/out", data),

  getOrders: () => req<any[]>("GET", "/orders"),
  getOrder: (id: string) => req<any>("GET", `/orders/${id}`),
  createOrder: (data: any) => req<any>("POST", "/orders", data),
  updateOrder: (id: string, data: any) =>
    req<any>("PUT", `/orders/${id}`, data),

  getCustomers: () => req<any[]>("GET", "/customers"),
  getCustomer: (id: string) => req<any>("GET", `/customers/${id}`),
  createCustomer: (data: any) => req<any>("POST", "/customers", data),
  updateCustomer: (id: string, data: any) =>
    req<any>("PUT", `/customers/${id}`, data),

  getAgents: () => req<any[]>("GET", "/agents"),
  getAgent: (id: string) => req<any>("GET", `/agents/${id}`),
  createAgent: (data: any) => req<any>("POST", "/agents", data),
  updateAgent: (id: string, data: any) =>
    req<any>("PUT", `/agents/${id}`, data),

  getPayments: () => req<any[]>("GET", "/payments"),
  createPayment: (data: any) => req<any>("POST", "/payments", data),

  getReports: (type: string, from: string, to: string) =>
    req<any>("GET", `/reports/${type}?from=${from}&to=${to}`),

  getDashboard: () => req<any>("GET", "/dashboard"),
};
