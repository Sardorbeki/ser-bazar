import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── USERS ───────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull().default(""),
  phone: text("phone").notNull().default(""),
  role: text("role").notNull().default("client"),
  avatar: text("avatar"),
  createdAt: text("created_at").notNull().default(sql`NOW()::text`),
});

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────
export const products = pgTable("products", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  sku: text("sku").notNull().default(""),
  price: integer("price").notNull().default(0),
  unit: text("unit").notNull().default("dona"),
  stock: integer("stock").notNull().default(0),
  category: text("category").notNull().default("Umumiy"),
  image: text("image"),
  minStock: integer("min_stock").default(0),
  createdAt: text("created_at").notNull().default(sql`NOW()::text`),
});

// ─── CUSTOMERS ────────────────────────────────────────────────────────────────
export const customers = pgTable("customers", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone").notNull().default(""),
  address: text("address").notNull().default(""),
  debt: integer("debt").notNull().default(0),
  totalPurchases: integer("total_purchases").notNull().default(0),
  agentId: varchar("agent_id", { length: 36 }),
  creditLimit: integer("credit_limit").default(0),
  note: text("note"),
  createdAt: text("created_at").notNull().default(sql`NOW()::text`),
});

// ─── AGENTS ───────────────────────────────────────────────────────────────────
export const agents = pgTable("agents", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  region: text("region").notNull().default(""),
  plan: integer("plan").notNull().default(0),
  fact: integer("fact").notNull().default(0),
  customersCount: integer("customers_count").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`NOW()::text`),
});

// ─── ORDERS ───────────────────────────────────────────────────────────────────
export const orders = pgTable("orders", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  number: text("number").notNull(),
  customerId: varchar("customer_id", { length: 36 }).notNull(),
  customerName: text("customer_name").notNull(),
  agentId: varchar("agent_id", { length: 36 }),
  agentName: text("agent_name"),
  items: text("items").notNull().default("[]"),
  total: integer("total").notNull().default(0),
  status: text("status").notNull().default("confirmed"),
  paymentStatus: text("payment_status").notNull().default("unpaid"),
  paidAmount: integer("paid_amount").notNull().default(0),
  note: text("note"),
  locationLat: text("location_lat"),
  locationLng: text("location_lng"),
  discount: integer("discount").default(0),
  deliveredAt: text("delivered_at"),
  createdAt: text("created_at").notNull().default(sql`NOW()::text`),
});

// ─── WAREHOUSE MOVEMENTS ──────────────────────────────────────────────────────
export const warehouseMovements = pgTable("warehouse_movements", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(),
  productId: varchar("product_id", { length: 36 }).notNull(),
  productName: text("product_name").notNull(),
  qty: integer("qty").notNull().default(0),
  unit: text("unit").notNull().default("dona"),
  price: integer("price").notNull().default(0),
  total: integer("total").notNull().default(0),
  note: text("note"),
  createdAt: text("created_at").notNull().default(sql`NOW()::text`),
});

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────
export const payments = pgTable("payments", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id", { length: 36 }).notNull(),
  customerName: text("customer_name").notNull(),
  orderId: varchar("order_id", { length: 36 }),
  amount: integer("amount").notNull().default(0),
  method: text("method").notNull().default("cash"),
  note: text("note"),
  createdAt: text("created_at").notNull().default(sql`NOW()::text`),
});

// ─── APP SETTINGS ─────────────────────────────────────────────────────────────
export const appSettings = pgTable("app_settings", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull().default(""),
});

// ─── TYPES ────────────────────────────────────────────────────────────────────
export type DbUser = typeof users.$inferSelect;
export type User = DbUser;
export type InsertUser = typeof users.$inferInsert;
export type DbProduct = typeof products.$inferSelect;
export type DbCustomer = typeof customers.$inferSelect;
export type DbAgent = typeof agents.$inferSelect;
export type DbOrder = typeof orders.$inferSelect;
export type DbWarehouseMovement = typeof warehouseMovements.$inferSelect;
export type DbPayment = typeof payments.$inferSelect;

export const insertUserSchema = createInsertSchema(users).pick({
  username: true, password: true, name: true, phone: true,
});
