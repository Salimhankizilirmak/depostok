import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const companies = sqliteTable("companies", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  adminEmail: text("admin_email").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  locationSystemEnabled: integer("location_system_enabled", { mode: "boolean" }).notNull().default(false),
  locationFormat: text("location_format").notNull().default("free"),
});

export const products = sqliteTable("products", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull(),
  name: text("name").notNull(),
  sku: text("sku"),
  currentStock: integer("current_stock").notNull().default(0),
  price: real("price").notNull().default(0),
  criticalThreshold: integer("critical_threshold").notNull().default(10),
  location: text("location"),
  attributes: text("attributes"),
  importBatchId: text("import_batch_id"),
}, (table) => ({
  companySkuIndex: uniqueIndex("company_sku_idx").on(table.companyId, table.sku),
}));

export const stockMovements = sqliteTable("stock_movements", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  productId: text("product_id").notNull(),
  companyId: text("company_id").notNull(),
  type: text("type", { enum: ["in", "out"] }).notNull(),
  quantity: integer("quantity").notNull(),
  userEmail: text("user_email"),
  description: text("description").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const companyUsers = sqliteTable("company_users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("Personel"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// Type helpers
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type StockMovement = typeof stockMovements.$inferSelect;
export type NewStockMovement = typeof stockMovements.$inferInsert;

export type CompanyUser = typeof companyUsers.$inferSelect;
export type NewCompanyUser = typeof companyUsers.$inferInsert;
