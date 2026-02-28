import { integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const agents = pgTable("agents", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  model: varchar("model", { length: 100 }).notNull().default("openai:gpt-4o"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().defaultNow(),
});
