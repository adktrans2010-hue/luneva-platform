import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
} from "drizzle-orm/pg-core";

export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: text("name").notNull(),

  age: text("age"),

  text: text("text").notNull(),

  image: text("image"),

  published: boolean("published")
    .default(true)
    .notNull(),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});