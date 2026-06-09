import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { db } from "./db";
import {
  users, products, customers, agents, orders,
  warehouseMovements, payments, appSettings,
} from "../shared/schema";
import { eq, desc, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "distrouz-secret-key-2025";
const SALT_ROUNDS = 10;

function makeToken(userId: string, role: string) {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "30d" });
}

function authMiddleware(req: any, res: any, next: any) {
  const auth = req.headers["authorization"];
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token kerak" });
  }
  try {
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Token yaroqsiz" });
  }
}

function adminOnly(req: any, res: any, next: any) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Faqat admin uchun" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {

  // ══════════════════════════════════════════════════════════════════
  // AUTH
  // ══════════════════════════════════════════════════════════════════

  // POST /api/auth/register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const schema = z.object({
        name: z.string().min(2, "Ism kamida 2 ta belgi"),
        username: z.string().min(3, "Login kamida 3 ta belgi").regex(/^[a-z0-9_]+$/, "Faqat kichik harf, raqam va _"),
        phone: z.string().optional().default(""),
        password: z.string().min(6, "Parol kamida 6 ta belgi"),
      });
      const body = schema.safeParse(req.body);
      if (!body.success) {
        return res.status(400).json({ error: body.error.errors[0].message });
      }
      const { name, username, phone, password } = body.data;
      if (username === "serbazar") {
        return res.status(400).json({ error: "Bu login band" });
      }
      const existing = await db.select().from(users).where(eq(users.username, username));
      if (existing.length > 0) {
        return res.status(400).json({ error: "Bu login allaqachon mavjud" });
      }
      if (phone) {
        const byPhone = await db.select().from(users).where(eq(users.phone, phone));
        if (byPhone.length > 0) {
          return res.status(400).json({ error: "Bu telefon allaqachon ro'yxatdan o'tgan" });
        }
      }
      const hashed = await bcrypt.hash(password, SALT_ROUNDS);
      const [newUser] = await db.insert(users).values({
        username, password: hashed, name, phone, role: "client",
      }).returning();
      const token = makeToken(newUser.id, newUser.role);
      res.json({ success: true, token, user: { id: newUser.id, username: newUser.username, name: newUser.name, phone: newUser.phone, role: newUser.role, avatar: newUser.avatar } });
    } catch (e: any) {
      console.error("Register error:", e);
      res.status(500).json({ error: "Server xatosi" });
    }
  });

  // POST /api/auth/login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Login va parol majburiy" });
      }
      const [found] = await db.select().from(users).where(eq(users.username, username.trim().toLowerCase()));
      if (!found) {
        return res.status(401).json({ error: "Login yoki parol noto'g'ri" });
      }
      const valid = await bcrypt.compare(password, found.password);
      if (!valid) {
        return res.status(401).json({ error: "Login yoki parol noto'g'ri" });
      }
      const token = makeToken(found.id, found.role);
      res.json({ success: true, token, user: { id: found.id, username: found.username, name: found.name, phone: found.phone, role: found.role, avatar: found.avatar } });
    } catch (e: any) {
      console.error("Login error:", e);
      res.status(500).json({ error: "Server xatosi" });
    }
  });

  // PUT /api/auth/profile/:id
  app.put("/api/auth/profile/:id", authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      if (req.user.userId !== id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Ruxsat yo'q" });
      }
      const { name, phone, avatar, password } = req.body;
      const updates: Record<string, any> = {};
      if (name) updates.name = name;
      if (avatar !== undefined) updates.avatar = avatar;
      if (phone !== undefined) updates.phone = phone;
      if (password) updates.password = await bcrypt.hash(password, SALT_ROUNDS);
      if (Object.keys(updates).length > 0) {
        await db.update(users).set(updates).where(eq(users.id, id));
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: "Server xatosi" });
    }
  });

  // GET /api/auth/me
  app.get("/api/auth/me", authMiddleware, async (req, res) => {
    try {
      const [u] = await db.select().from(users).where(eq(users.id, req.user.userId));
      if (!u) return res.status(404).json({ error: "Foydalanuvchi topilmadi" });
      res.json({ id: u.id, username: u.username, name: u.name, phone: u.phone, role: u.role, avatar: u.avatar });
    } catch {
      res.status(500).json({ error: "Server xatosi" });
    }
  });

  // GET /api/auth/users (admin only)
  app.get("/api/auth/users", authMiddleware, adminOnly, async (req, res) => {
    try {
      const list = await db.select().from(users).orderBy(desc(users.createdAt));
      res.json(list.map(u => ({ id: u.id, username: u.username, name: u.name, phone: u.phone, role: u.role, createdAt: u.createdAt })));
    } catch {
      res.status(500).json({ error: "Server xatosi" });
    }
  });

  // ══════════════════════════════════════════════════════════════════
  // PRODUCTS
  // ══════════════════════════════════════════════════════════════════

  app.get("/api/products", authMiddleware, async (req, res) => {
    try {
      const list = await db.select().from(products).orderBy(desc(products.createdAt));
      res.json(list);
    } catch { res.status(500).json({ error: "Server xatosi" }); }
  });

  app.post("/api/products", authMiddleware, adminOnly, async (req, res) => {
    try {
      const schema = z.object({
        name: z.string().min(1),
        sku: z.string().default(""),
        price: z.number().min(0),
        unit: z.string().default("dona"),
        stock: z.number().min(0).default(0),
        category: z.string().default("Umumiy"),
        image: z.string().optional(),
        minStock: z.number().default(0),
      });
      const body = schema.safeParse(req.body);
      if (!body.success) return res.status(400).json({ error: body.error.errors[0].message });
      const [item] = await db.insert(products).values(body.data).returning();
      res.json(item);
    } catch { res.status(500).json({ error: "Server xatosi" }); }
  });

  app.put("/api/products/:id", authMiddleware, adminOnly, async (req, res) => {
    try {
      const [item] = await db.update(products).set(req.body).where(eq(products.id, req.params.id)).returning();
      res.json(item);
    } catch { res.status(500).json({ error: "Server xatosi" }); }
  });

  app.delete("/api/products/:id", authMiddleware, adminOnly, async (req, res) => {
    try {
      await db.delete(products).where(eq(products.id, req.params.id));
      res.json({ success: true });
    } catch { res.status(500).json({ error: "Server xatosi" }); }
  });

  // ══════════════════════════════════════════════════════════════════
  // CUSTOMERS
  // ══════════════════════════════════════════════════════════════════

  app.get("/api/customers", authMiddleware, async (req, res) => {
    try {
      const list = await db.select().from(customers).orderBy(desc(customers.createdAt));
      res.json(list);
    } catch { res.status(500).json({ error: "Server xatosi" }); }
  });

  app.post("/api/customers", authMiddleware, adminOnly, async (req, res) => {
    try {
      const [item] = await db.insert(customers).values(req.body).returning();
      res.json(item);
    } catch { res.status(500).json({ error: "Server xatosi" }); }
  });

  app.put("/api/customers/:id", authMiddleware, adminOnly, async (req, res) => {
    try {
      const [item] = await db.update(customers).set(req.body).where(eq(customers.id, req.params.id)).returning();
      res.json(item);
    } catch { res.status(500).json({ error: "Server xatosi" }); }
  });

  app.delete("/api/customers/:id", authMiddleware, adminOnly, async (req, res) => {
    try {
      await db.delete(customers).where(eq(customers.id, req.params.id));
      res.json({ success: true });
    } catch { res.status(500).json({ error: "Server xatosi" }); }
  });

  // ══════════════════════════════════════════════════════════════════
  // AGENTS
  // ══════════════════════════════════════════════════════════════════

  app.get("/api/agents", authMiddleware, async (req, res) => {
    try {
      const list = await db.select().from(agents).orderBy(desc(agents.createdAt));
      res.json(list.map(a => ({ ...a, customers: a.customersCount })));
    } catch { res.status(500).json({ error: "Server xatosi" }); }
  });

  app.post("/api/agents", authMiddleware, adminOnly, async (req, res) => {
    try {
      const body = { ...req.body, customersCount: req.body.customers ?? 0 };
      delete body.customers;
      const [item] = await db.insert(agents).values(body).returning();
      res.json({ ...item, customers: item.customersCount });
    } catch { res.status(500).json({ error: "Server xatosi" }); }
  });

  app.put("/api/agents/:id", authMiddleware, adminOnly, async (req, res) => {
    try {
      const body = { ...req.body };
      if (body.customers !== undefined) { body.customersCount = body.customers; delete body.customers; }
      const [item] = await db.update(agents).set(body).where(eq(agents.id, req.params.id)).returning();
      res.json({ ...item, customers: item.customersCount });
    } catch { res.status(500).json({ error: "Server xatosi" }); }
  });

  app.delete("/api/agents/:id", authMiddleware, adminOnly, async (req, res) => {
    try {
      await db.delete(agents).where(eq(agents.id, req.params.id));
      res.json({ success: true });
    } catch { res.status(500).json({ error: "Server xatosi" }); }
  });

  // ══════════════════════════════════════════════════════════════════
  // ORDERS
  // ══════════════════════════════════════════════════════════════════

  app.get("/api/orders", authMiddleware, async (req, res) => {
    try {
      const list = await db.select().from(orders).orderBy(desc(orders.createdAt));
      res.json(list.map(o => ({ ...o, items: JSON.parse(o.items || "[]"), location: o.locationLat ? { lat: o.locationLat, lng: o.locationLng } : undefined })));
    } catch { res.status(500).json({ error: "Server xatosi" }); }
  });

  app.get("/api/orders/:id", authMiddleware, async (req, res) => {
    try {
      const [o] = await db.select().from(orders).where(eq(orders.id, req.params.id));
      if (!o) return res.status(404).json({ error: "Topilmadi" });
      res.json({ ...o, items: JSON.parse(o.items || "[]") });
    } catch { res.status(500).json({ error: "Server xatosi" }); }
  });

  app.post("/api/orders", authMiddleware, async (req, res) => {
    try {
      const body = { ...req.body, items: JSON.stringify(req.body.items || []), locationLat: req.body.location?.lat?.toString(), locationLng: req.body.location?.lng?.toString() };
      delete body.location;
      const [item] = await db.insert(orders).values(body).returning();
      // Update customer debt and totalPurchases
      if (item.customerId) {
        const [cust] = await db.select().from(customers).where(eq(customers.id, item.customerId));
        if (cust) {
          await db.update(customers).set({
            debt: cust.debt + item.total,
            totalPurchases: cust.totalPurchases + item.total,
          }).where(eq(customers.id, item.customerId));
        }
      }
      // Reduce stock for each item
      const orderItems = JSON.parse(item.items);
      for (const oi of orderItems) {
        const [prod] = await db.select().from(products).where(eq(products.id, oi.productId));
        if (prod) {
          await db.update(products).set({ stock: Math.max(0, prod.stock - oi.qty) }).where(eq(products.id, oi.productId));
        }
        // Add warehouse out movement
        await db.insert(warehouseMovements).values({
          type: "out", productId: oi.productId, productName: oi.productName,
          qty: oi.qty, unit: oi.unit || "dona", price: oi.price, total: oi.qty * oi.price, note: item.number,
        });
      }
      res.json({ ...item, items: orderItems });
    } catch (e: any) {
      console.error("Order create error:", e);
      res.status(500).json({ error: "Server xatosi" });
    }
  });

  app.put("/api/orders/:id", authMiddleware, async (req, res) => {
    try {
      const body = { ...req.body };
      if (body.items) body.items = JSON.stringify(body.items);
      delete body.location;
      const [item] = await db.update(orders).set(body).where(eq(orders.id, req.params.id)).returning();
      res.json({ ...item, items: JSON.parse(item.items || "[]") });
    } catch { res.status(500).json({ error: "Server xatosi" }); }
  });

  app.delete("/api/orders/:id", authMiddleware, adminOnly, async (req, res) => {
    try {
      await db.delete(orders).where(eq(orders.id, req.params.id));
      res.json({ success: true });
    } catch { res.status(500).json({ error: "Server xatosi" }); }
  });

  // ══════════════════════════════════════════════════════════════════
  // WAREHOUSE MOVEMENTS
  // ══════════════════════════════════════════════════════════════════

  app.get("/api/warehouse", authMiddleware, async (req, res) => {
    try {
      const list = await db.select().from(warehouseMovements).orderBy(desc(warehouseMovements.createdAt));
      res.json(list);
    } catch { res.status(500).json({ error: "Server xatosi" }); }
  });

  app.post("/api/warehouse", authMiddleware, adminOnly, async (req, res) => {
    try {
      const [item] = await db.insert(warehouseMovements).values(req.body).returning();
      if (item.type === "in") {
        const [prod] = await db.select().from(products).where(eq(products.id, item.productId));
        if (prod) {
          await db.update(products).set({ stock: prod.stock + item.qty }).where(eq(products.id, item.productId));
        }
      }
      res.json(item);
    } catch { res.status(500).json({ error: "Server xatosi" }); }
  });

  // ══════════════════════════════════════════════════════════════════
  // PAYMENTS
  // ══════════════════════════════════════════════════════════════════

  app.get("/api/payments", authMiddleware, async (req, res) => {
    try {
      const list = await db.select().from(payments).orderBy(desc(payments.createdAt));
      res.json(list);
    } catch { res.status(500).json({ error: "Server xatosi" }); }
  });

  app.post("/api/payments", authMiddleware, async (req, res) => {
    try {
      const [item] = await db.insert(payments).values(req.body).returning();
      // Update order paidAmount
      if (item.orderId) {
        const [ord] = await db.select().from(orders).where(eq(orders.id, item.orderId));
        if (ord) {
          const paidAmount = ord.paidAmount + item.amount;
          const paymentStatus = paidAmount >= ord.total ? "paid" : paidAmount > 0 ? "partial" : "unpaid";
          await db.update(orders).set({ paidAmount, paymentStatus }).where(eq(orders.id, item.orderId));
        }
      }
      // Reduce customer debt
      const [cust] = await db.select().from(customers).where(eq(customers.id, item.customerId));
      if (cust) {
        await db.update(customers).set({ debt: Math.max(0, cust.debt - item.amount) }).where(eq(customers.id, item.customerId));
      }
      res.json(item);
    } catch { res.status(500).json({ error: "Server xatosi" }); }
  });

  app.delete("/api/payments/:id", authMiddleware, adminOnly, async (req, res) => {
    try {
      await db.delete(payments).where(eq(payments.id, req.params.id));
      res.json({ success: true });
    } catch { res.status(500).json({ error: "Server xatosi" }); }
  });

  // ══════════════════════════════════════════════════════════════════
  // APP SETTINGS
  // ══════════════════════════════════════════════════════════════════

  app.get("/api/settings", authMiddleware, adminOnly, async (req, res) => {
    try {
      const list = await db.select().from(appSettings);
      const result: Record<string, any> = {};
      list.forEach(s => {
        try { result[s.key] = JSON.parse(s.value); } catch { result[s.key] = s.value; }
      });
      res.json(result);
    } catch { res.status(500).json({ error: "Server xatosi" }); }
  });

  app.post("/api/settings", authMiddleware, adminOnly, async (req, res) => {
    try {
      for (const [key, value] of Object.entries(req.body)) {
        const valStr = JSON.stringify(value);
        const existing = await db.select().from(appSettings).where(eq(appSettings.key, key));
        if (existing.length > 0) {
          await db.update(appSettings).set({ value: valStr }).where(eq(appSettings.key, key));
        } else {
          await db.insert(appSettings).values({ key, value: valStr });
        }
      }
      res.json({ success: true });
    } catch { res.status(500).json({ error: "Server xatosi" }); }
  });

  // ══════════════════════════════════════════════════════════════════
  // BULK SYNC (mobile app sends all local data at once)
  // ══════════════════════════════════════════════════════════════════

  app.post("/api/sync", authMiddleware, adminOnly, async (req, res) => {
    try {
      const { products: prods, customers: custs, agents: agts, orders: ords, warehouseMovements: wms, payments: pays } = req.body;
      let counts = { products: 0, customers: 0, agents: 0, orders: 0, warehouseMovements: 0, payments: 0 };

      if (Array.isArray(prods) && prods.length > 0) {
        for (const p of prods) {
          const ex = await db.select().from(products).where(eq(products.id, p.id));
          if (ex.length === 0) { await db.insert(products).values({ ...p, id: p.id }).catch(() => {}); counts.products++; }
        }
      }
      if (Array.isArray(custs) && custs.length > 0) {
        for (const c of custs) {
          const ex = await db.select().from(customers).where(eq(customers.id, c.id));
          if (ex.length === 0) { await db.insert(customers).values({ ...c, id: c.id }).catch(() => {}); counts.customers++; }
        }
      }
      if (Array.isArray(agts) && agts.length > 0) {
        for (const a of agts) {
          const ex = await db.select().from(agents).where(eq(agents.id, a.id));
          if (ex.length === 0) { await db.insert(agents).values({ ...a, id: a.id, customersCount: a.customers ?? 0 }).catch(() => {}); counts.agents++; }
        }
      }
      if (Array.isArray(ords) && ords.length > 0) {
        for (const o of ords) {
          const ex = await db.select().from(orders).where(eq(orders.id, o.id));
          if (ex.length === 0) { await db.insert(orders).values({ ...o, id: o.id, items: JSON.stringify(o.items || []) }).catch(() => {}); counts.orders++; }
        }
      }
      if (Array.isArray(wms) && wms.length > 0) {
        for (const w of wms) {
          const ex = await db.select().from(warehouseMovements).where(eq(warehouseMovements.id, w.id));
          if (ex.length === 0) { await db.insert(warehouseMovements).values({ ...w, id: w.id }).catch(() => {}); counts.warehouseMovements++; }
        }
      }
      if (Array.isArray(pays) && pays.length > 0) {
        for (const p of pays) {
          const ex = await db.select().from(payments).where(eq(payments.id, p.id));
          if (ex.length === 0) { await db.insert(payments).values({ ...p, id: p.id }).catch(() => {}); counts.payments++; }
        }
      }
      res.json({ success: true, synced: counts });
    } catch (e: any) {
      console.error("Sync error:", e);
      res.status(500).json({ error: "Sync xatosi: " + e.message });
    }
  });

  // ══════════════════════════════════════════════════════════════════
  // REGOS & TELEGRAM (existing)
  // ══════════════════════════════════════════════════════════════════

  const path = await import("path");
  const fs = await import("fs");

  app.get("/admin", (_req, res) => {
    const htmlPath = path.join(process.cwd(), "server/templates/admin-panel.html");
    if (fs.existsSync(htmlPath)) res.sendFile(htmlPath);
    else res.status(404).send("Admin panel not found");
  });

  app.post("/api/regos-handler", (req, res) => {
    console.log("Regos webhook:", req.body);
    res.json({ success: true });
  });

  app.post("/api/proxy/order", async (req, res) => {
    try {
      const response = await fetch("https://integration.regos.uz/gateway/out/226baa0399ae43bba261165a4d4de611/orders", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(req.body),
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}
