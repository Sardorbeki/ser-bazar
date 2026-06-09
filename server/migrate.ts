import { db } from "./db";
import {
  users, products, customers, agents, orders,
  warehouseMovements, payments, appSettings,
} from "../shared/schema";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function migrate() {
  console.log("🔧 Migration boshlandi...");

  // Create tables
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT 'client',
      avatar TEXT,
      created_at TEXT NOT NULL DEFAULT NOW()::text
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      sku TEXT NOT NULL DEFAULT '',
      price INTEGER NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT 'dona',
      stock INTEGER NOT NULL DEFAULT 0,
      category TEXT NOT NULL DEFAULT 'Umumiy',
      image TEXT,
      min_stock INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT NOW()::text
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS customers (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      debt INTEGER NOT NULL DEFAULT 0,
      total_purchases INTEGER NOT NULL DEFAULT 0,
      agent_id VARCHAR(36),
      credit_limit INTEGER DEFAULT 0,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT NOW()::text
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS agents (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      region TEXT NOT NULL DEFAULT '',
      plan INTEGER NOT NULL DEFAULT 0,
      fact INTEGER NOT NULL DEFAULT 0,
      customers_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT NOW()::text
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      number TEXT NOT NULL,
      customer_id VARCHAR(36) NOT NULL,
      customer_name TEXT NOT NULL,
      agent_id VARCHAR(36),
      agent_name TEXT,
      items TEXT NOT NULL DEFAULT '[]',
      total INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'confirmed',
      payment_status TEXT NOT NULL DEFAULT 'unpaid',
      paid_amount INTEGER NOT NULL DEFAULT 0,
      note TEXT,
      location_lat TEXT,
      location_lng TEXT,
      discount INTEGER DEFAULT 0,
      delivered_at TEXT,
      created_at TEXT NOT NULL DEFAULT NOW()::text
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS warehouse_movements (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      type TEXT NOT NULL,
      product_id VARCHAR(36) NOT NULL,
      product_name TEXT NOT NULL,
      qty INTEGER NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT 'dona',
      price INTEGER NOT NULL DEFAULT 0,
      total INTEGER NOT NULL DEFAULT 0,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT NOW()::text
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS payments (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id VARCHAR(36) NOT NULL,
      customer_name TEXT NOT NULL,
      order_id VARCHAR(36),
      amount INTEGER NOT NULL DEFAULT 0,
      method TEXT NOT NULL DEFAULT 'cash',
      note TEXT,
      created_at TEXT NOT NULL DEFAULT NOW()::text
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS app_settings (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL DEFAULT ''
    )
  `);

  console.log("✅ Jadvallar yaratildi");

  // Seed sample data if empty
  const existingProducts = await db.select().from(products);
  if (existingProducts.length === 0) {
    console.log("📦 Namuna ma'lumotlar qo'shilmoqda...");

    const sampleAgents = await db.insert(agents).values([
      { id: "a1", name: "Jasur Toshmatov", phone: "+998901111111", email: "jasur@mail.com", region: "Toshkent", plan: 50000000, fact: 38500000, customersCount: 12 },
      { id: "a2", name: "Dilshod Yusupov", phone: "+998902222222", email: "dilshod@mail.com", region: "Samarqand", plan: 35000000, fact: 42000000, customersCount: 8 },
      { id: "a3", name: "Malika Karimova", phone: "+998903333333", email: "malika@mail.com", region: "Namangan", plan: 30000000, fact: 18000000, customersCount: 6 },
    ]).returning();

    await db.insert(products).values([
      { id: "p1", name: "Coca-Cola 0.5L", sku: "CC-001", price: 3500, unit: "dona", stock: 240, category: "Ichimliklar", minStock: 50 },
      { id: "p2", name: "Pepsi 1L", sku: "PP-002", price: 5500, unit: "dona", stock: 180, category: "Ichimliklar", minStock: 30 },
      { id: "p3", name: "Lipton Choy", sku: "LP-003", price: 12000, unit: "quti", stock: 95, category: "Choy/Qahva", minStock: 20 },
      { id: "p4", name: "Nescafe Classic", sku: "NC-004", price: 45000, unit: "quti", stock: 60, category: "Choy/Qahva", minStock: 10 },
      { id: "p5", name: "Tide Kirish Vositasi", sku: "TD-005", price: 28000, unit: "dona", stock: 120, category: "Maishiy", minStock: 25 },
      { id: "p6", name: "Ariel Poroshok", sku: "AR-006", price: 32000, unit: "dona", stock: 85, category: "Maishiy", minStock: 20 },
    ]);

    await db.insert(customers).values([
      { id: "c1", name: "Bahor Supermarket", phone: "+998901234567", address: "Toshkent, Chilonzor", debt: 450000, totalPurchases: 12500000, agentId: "a1", creditLimit: 2000000 },
      { id: "c2", name: "Gulnora Do'koni", phone: "+998907654321", address: "Toshkent, Yunusobod", debt: 0, totalPurchases: 8900000, agentId: "a1", creditLimit: 1500000 },
      { id: "c3", name: "Rustam Savdo", phone: "+998991122334", address: "Samarqand", debt: 1200000, totalPurchases: 25000000, agentId: "a2", creditLimit: 3000000 },
      { id: "c4", name: "Farrux Market", phone: "+998935566778", address: "Namangan", debt: 320000, totalPurchases: 6700000, creditLimit: 1000000 },
    ]);

    console.log("✅ Namuna ma'lumotlar qo'shildi");
  }

  // Check if admin exists, create if not
  const adminExists = await db.select().from(users).where(sql`username = 'serbazar'`);
  if (adminExists.length === 0) {
    const hashedPwd = await bcrypt.hash("Aa122334117@", 10);
    await db.insert(users).values({
      id: "admin-001",
      username: "serbazar",
      password: hashedPwd,
      name: "Admin",
      role: "admin",
      phone: "",
    });
    console.log("✅ Admin yaratildi: serbazar / Aa122334117@");
  } else {
    console.log("ℹ️  Admin allaqachon mavjud");
  }

  console.log("🎉 Migration muvaffaqiyatli yakunlandi!");
}

migrate().catch(e => { console.error("❌ Migration xatosi:", e); process.exit(1); });
