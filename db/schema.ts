import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  type: text('type', { enum: ['painting', 'clothing'] }).notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  priceRappen: integer('price_rappen').notNull(),
  imagePath: text('image_path').notNull(),
  width: integer('width'),
  height: integer('height'),
  year: integer('year'),
  technique: text('technique'),
  status: text('status', { enum: ['available', 'reserved', 'sold'] })
    .notNull()
    .default('available'),
  // Slot key for the museum/wardrobe layout, e.g. "museum:back:0", "wardrobe:left:2".
  // Null = unplaced (renders in any free slot).
  wallSlot: text('wall_slot'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),
  status: text('status', { enum: ['pending', 'paid', 'shipped', 'cancelled'] })
    .notNull()
    .default('pending'),
  buyerName: text('buyer_name').notNull(),
  buyerEmail: text('buyer_email').notNull(),
  buyerStreet: text('buyer_street').notNull(),
  buyerZip: text('buyer_zip').notNull(),
  buyerCity: text('buyer_city').notNull(),
  buyerCountry: text('buyer_country').notNull().default('CH'),
  totalRappen: integer('total_rappen').notNull(),
  reservedUntil: integer('reserved_until', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  paidAt: integer('paid_at', { mode: 'timestamp' }),
  shippedAt: integer('shipped_at', { mode: 'timestamp' }),
});

export const admins = sqliteTable('admins', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  adminId: integer('admin_id')
    .notNull()
    .references(() => admins.id),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
