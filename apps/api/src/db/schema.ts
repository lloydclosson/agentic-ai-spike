import { decimal, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

// ============ Employee / PTO Entities ============

export const employees = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  ssn: varchar("ssn", { length: 11 }).notNull(),
  payRate: decimal("pay_rate", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const ptoAccruals = pgTable("pto_accruals", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  totalHoursRemaining: decimal("total_hours_remaining", {
    precision: 6,
    scale: 2,
  }).notNull(),
  totalHoursAllotted: decimal("total_hours_allotted", {
    precision: 6,
    scale: 2,
  }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const pto = pgTable("pto", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  dateTime: timestamp("date_time").notNull(),
  hoursTaken: decimal("hours_taken", { precision: 6, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============ Chat Entities ============

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 20 }).notNull(), // "user" | "assistant" | "system"
  content: text("content").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("complete"), // "streaming" | "complete" | "error"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
