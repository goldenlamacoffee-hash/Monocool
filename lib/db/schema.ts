import { pgTable, text, timestamp, boolean, serial, integer, decimal, jsonb } from 'drizzle-orm/pg-core'

// --- Better Auth required tables -------------------------------------------
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  // Better Auth admin plugin fields
  role: text('role').default('user'),
  banned: boolean('banned').default(false),
  banReason: text('banReason'),
  banExpires: timestamp('banExpires'),
  // Custom user fields
  companyName: text('companyName'),
  companyId: text('companyId'),
  vatNumber: text('vatNumber'),
  address: text('address'),
  city: text('city'),
  postalCode: text('postalCode'),
  country: text('country'),
  phone: text('phone'),
  status: text('status').default('pending'), // pending, approved, rejected
  notes: text('notes'),
})

// --- Site Settings table (per domain) --------------------------------------
export const siteSettings = pgTable('site_settings', {
  id: serial('id').primaryKey(),
  domain: text('domain').notNull().unique(), // e.g., 'monocool.at', 'monocool.sk', 'monocool.cz'
  // Contact information
  companyName: text('companyName'),
  email: text('email'),
  emailSales: text('emailSales'),
  emailSupport: text('emailSupport'),
  phone: text('phone'),
  phoneSecondary: text('phoneSecondary'),
  fax: text('fax'),
  // Address
  address: text('address'),
  city: text('city'),
  postalCode: text('postalCode'),
  country: text('country'),
  // Legal info
  companyId: text('companyId'), // IČO
  vatNumber: text('vatNumber'), // DIČ
  registrationCourt: text('registrationCourt'),
  registrationNumber: text('registrationNumber'),
  responsiblePerson: text('responsiblePerson'),
  // Social media
  facebook: text('facebook'),
  instagram: text('instagram'),
  linkedin: text('linkedin'),
  youtube: text('youtube'),
  // Business hours
  businessHours: text('businessHours'),
  // SEO foundation fields (V1.3B)
  seoTitle: text('seoTitle'),
  seoDescription: text('seoDescription'),
  ogImage: text('ogImage'),
  // Metadata
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

// --- App tables ------------------------------------------------------------
export const product = pgTable('product', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  shortDescription: text('shortDescription'),
  price: decimal('price', { precision: 10, scale: 2 }),
  category: text('category'),
  coolingCapacity: text('coolingCapacity'),
  heatingCapacity: text('heatingCapacity'),
  energyClass: text('energyClass'),
  noiseLevel: text('noiseLevel'),
  dimensions: text('dimensions'),
  weight: text('weight'),
  features: text('features').array(),
  technicalData: text('technicalData'), // Technical data / datasheet info
  specifications: jsonb('specifications'),
  specs: jsonb('specs'), // Fan-coil specific specs (power, airflow, noise, dimensions)
  imageUrl: text('imageUrl'), // Primary product image (mirrors the primary product_image)
  // SEO foundation fields (V1.3B)
  seoTitle: text('seoTitle'),
  seoDescription: text('seoDescription'),
  ogImage: text('ogImage'),
  isActive: boolean('isActive').notNull().default(true),
  sortOrder: integer('sortOrder').notNull().default(0),
  domain: text('domain').notNull().default('monocool.at'), // Domain-specific content
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const productImage = pgTable('product_image', {
  id: serial('id').primaryKey(),
  productId: integer('productId')
    .notNull()
    .references(() => product.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  pathname: text('pathname').notNull(),
  alt: text('alt'),
  sortOrder: integer('sortOrder').notNull().default(0),
  isPrimary: boolean('isPrimary').notNull().default(false),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const cmsContent = pgTable('cms_content', {
  id: serial('id').primaryKey(),
  key: text('key').notNull(),
  title: text('title'),
  subtitle: text('subtitle'),
  content: text('content'),
  imageUrl: text('imageUrl'),
  gallery: jsonb('gallery').$type<string[]>(), // Array of image URLs
  metadata: jsonb('metadata'),
  // SEO foundation fields (V1.3B)
  seoTitle: text('seoTitle'),
  seoDescription: text('seoDescription'),
  ogImage: text('ogImage'),
  domain: text('domain').notNull().default('monocool.at'), // Domain-specific content
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

// --- Orders table ----------------------------------------------------------
export const order = pgTable('order', {
  id: serial('id').primaryKey(),
  orderNumber: text('orderNumber').notNull().unique(),
  userId: text('userId').notNull(),
  status: text('status').notNull().default('pending'), // pending, confirmed, shipped, delivered, cancelled
  items: jsonb('items').notNull(),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  tax: decimal('tax', { precision: 10, scale: 2 }).default('0'),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  shippingAddress: jsonb('shippingAddress'),
  billingAddress: jsonb('billingAddress'),
  notes: text('notes'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

// --- Inferred types --------------------------------------------------------
export type User = typeof user.$inferSelect
export type Product = typeof product.$inferSelect
export type NewProduct = typeof product.$inferInsert
export type ProductImage = typeof productImage.$inferSelect
export type CmsContent = typeof cmsContent.$inferSelect
export type SiteSettings = typeof siteSettings.$inferSelect
export type Order = typeof order.$inferSelect
