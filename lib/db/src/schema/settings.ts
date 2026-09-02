import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const settingsTable = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  language: text("language").notNull().default("en"),
  theme: text("theme").notNull().default("light"),
  assistantName: text("assistant_name").notNull().default("Hamad AI"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Settings = typeof settingsTable.$inferSelect;