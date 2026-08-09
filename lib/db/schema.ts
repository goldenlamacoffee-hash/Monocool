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
  // --- Market scope (V1.4E.1) ---
  // Which market (domain) this account belongs to: monocool.at | monocool.sk |
  // monocool.cz | monocool.eu. Set from the registration domain for
  // partner/customer accounts. Admins keep this NULL and remain global.
  // Foundation only — no access enforcement is applied in this version.
  market: text('market'),
  // --- B2B partner pricing (V1.4B) ---
  // Percentage discount applied to every product's base price for this
  // partner account. Stored as numeric(5,2); resolved to 0 when null.
  discountPercent: decimal('discountPercent', { precision: 5, scale: 2 }).default('0'),
  discountNote: text('discountNote'), // optional internal note about the discount
  partnerTier: text('partnerTier'), // optional label, e.g. "Gold", "Silver"
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
  // --- B2B invoicing & banking (V1.4G.1) -----------------------------------
  // All nullable — must be configured by operator before any document is generated.
  iban: text('iban'),
  bic: text('bic'),
  bankName: text('bankName'),
  currency: text('currency'),
  vatRate: decimal('vatRate', { precision: 5, scale: 2 }),
  invoicePrefix: text('invoicePrefix'),
  proformaPrefix: text('proformaPrefix'),
  nextInvoiceNumber: integer('nextInvoiceNumber').notNull().default(1),
  nextProformaNumber: integer('nextProformaNumber').notNull().default(1),
  paymentDueDays: integer('paymentDueDays'),
  // --- B2B sequential order numbering (V1.4J.1) ----------------------------
  // Market-specific counter for the next order number (see lib/order-number.ts).
  // Independent per domain — site_settings already has one row per market.
  // Allocated atomically inside the same transaction as the order INSERT.
  nextOrderNumber: integer('nextOrderNumber').notNull().default(115),
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
  // Better Auth Admin plugin — set when this session is an impersonation
  impersonatedBy: text('impersonatedBy'),
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

// --- Product variants (V1.4F.1) --------------------------------------------
// A product can have multiple variants / power versions (e.g. "Reverso FS 200",
// "Reverso FS 400"). The parent product remains the primary entity; variants
// belong to it and inherit the parent's market/domain (no domain column here).
// Products without variants keep working exactly as before.
export const productVariant = pgTable('product_variant', {
  id: serial('id').primaryKey(),
  productId: integer('productId')
    .notNull()
    .references(() => product.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  sku: text('sku'),
  // Nullable: when null, the frontend (a later version) falls back to the
  // parent product's price. Stored as string like product.price.
  price: decimal('price', { precision: 10, scale: 2 }),
  coolingOutput: text('coolingOutput'), // e.g. "880 W"
  heatingOutput: text('heatingOutput'), // e.g. "1100 W"
  technicalData: text('technicalData'),
  specs: jsonb('specs'),
  isActive: boolean('isActive').notNull().default(true),
  sortOrder: integer('sortOrder').notNull().default(0),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

// --- Internal product purchase costs (V1.4I.1) ------------------------------
// OWNER-ONLY. Confidential Zymbo/supplier purchase costs, kept in a table
// fully separate from "product" and "product_variant" so it can NEVER appear
// in a `select().from(product)` / `select().from(productVariant)` result or
// leak through public/partner/checkout/order queries. Every read and write of
// this table MUST go through app/actions/internal-costs.ts, whose exported
// functions all begin with `await assertOwnerAdmin()` (see lib/owner-auth.ts).
//
// One row per cost target:
//   variantId IS NULL  -> the base product's purchase cost
//   variantId = <id>   -> that specific variant's purchase cost
// Partial unique indexes (see the migration file) enforce at most one row per
// target. variantId intentionally has NO foreign key to "product_variant" —
// see the migration file for why; referential integrity for variantId is
// enforced in application code instead.
export const internalProductCost = pgTable('internal_product_cost', {
  id: serial('id').primaryKey(),
  productId: integer('productId')
    .notNull()
    .references(() => product.id, { onDelete: 'cascade' }),
  // Nullable: NULL means this row is the base product's cost, not a variant's.
  // No DB-level FK to product_variant (see migration file comment).
  variantId: integer('variantId'),
  supplier: text('supplier').notNull().default('Zymbo'),
  purchasePrice: decimal('purchasePrice', { precision: 12, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('EUR'),
  note: text('note'),
  // Owner user id who last wrote this row. Audit trail only — never surfaced
  // to non-owner admins or any client payload outside the owner-only UI.
  updatedBy: text('updatedBy'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

// --- Product documents / downloads (V1.4F.2) --------------------------------
// Admin can upload PDF documents (manuals, datasheets, energy labels, etc.)
// per product. Documents are scoped to a language that maps 1:1 to the market
// locale (de→monocool.at, sk→monocool.sk, cs→monocool.cz, en→monocool.eu).
// No domain column — documents inherit market from the parent product.
// The uploaded file lives in Vercel Blob; fileUrl is the Blob URL (public) or
// served via API route (private); pathname is the Blob pathname used for `del`.
export const productDocument = pgTable('product_document', {
  id: serial('id').primaryKey(),
  productId: integer('productId')
    .notNull()
    .references(() => product.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  type: text('type').notNull(),        // e.g. 'manual', 'datasheet', 'energy_label', ...
  language: text('language').notNull(), // 'de' | 'sk' | 'cs' | 'en'
  fileUrl: text('fileUrl').notNull(),   // URL to serve the PDF
  pathname: text('pathname').notNull(), // Blob pathname for deletion
  fileName: text('fileName'),           // original upload filename, shown in admin
  fileSize: integer('fileSize'),        // bytes, shown as "4.2 MB" on frontend
  isActive: boolean('isActive').notNull().default(true),
  sortOrder: integer('sortOrder').notNull().default(0),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
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

// --- Orders table (V1.4G.1) ------------------------------------------------
// Legacy columns (items, subtotal, tax, total, notes) are preserved for
// backward compatibility. New columns are additive and all nullable/defaulted.
//
// Allowed order statuses:   submitted | confirmed | processing | shipped | completed | cancelled
// Allowed payment statuses: unpaid | payment_request_sent | paid | refunded
export const order = pgTable('order', {
  id: serial('id').primaryKey(),
  orderNumber: text('orderNumber').notNull().unique(),
  userId: text('userId').notNull(),
  status: text('status').notNull().default('submitted'),
  // Legacy columns — kept for backward compatibility, do not drop
  items: jsonb('items').notNull().default('[]'),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull().default('0'),
  tax: decimal('tax', { precision: 10, scale: 2 }).default('0'),
  total: decimal('total', { precision: 10, scale: 2 }).notNull().default('0'),
  shippingAddress: jsonb('shippingAddress'),
  billingAddress: jsonb('billingAddress'),
  notes: text('notes'),
  // --- V1.4G.1 additions ---
  market: text('market'),
  currency: text('currency'),
  paymentStatus: text('paymentStatus').notNull().default('unpaid'),
  customerPoNumber: text('customerPoNumber'),
  customerNote: text('customerNote'),
  adminNote: text('adminNote'),
  discountTotal: decimal('discountTotal', { precision: 12, scale: 2 }).notNull().default('0'),
  vatTotal: decimal('vatTotal', { precision: 12, scale: 2 }).notNull().default('0'),
  grandTotal: decimal('grandTotal', { precision: 12, scale: 2 }),
  proformaNumber: text('proformaNumber'),
  invoiceNumber: text('invoiceNumber'),
  confirmedAt: timestamp('confirmedAt'),
  paidAt: timestamp('paidAt'),
  shippedAt: timestamp('shippedAt'),
  completedAt: timestamp('completedAt'),
  cancelledAt: timestamp('cancelledAt'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

// --- Order items (V1.4G.1) -------------------------------------------------
// Immutable price + product name snapshots. productId / variantId are nullable
// so historical rows stay valid if a product is later deleted.
export const orderItem = pgTable('order_item', {
  id: serial('id').primaryKey(),
  orderId: integer('orderId')
    .notNull()
    .references(() => order.id, { onDelete: 'cascade' }),
  productId: integer('productId').references(() => product.id, { onDelete: 'set null' }),
  variantId: integer('variantId').references(() => productVariant.id, { onDelete: 'set null' }),
  productName: text('productName').notNull(),
  variantName: text('variantName'),
  sku: text('sku'),
  quantity: integer('quantity').notNull(),
  baseUnitPrice: decimal('baseUnitPrice', { precision: 12, scale: 2 }).notNull(),
  discountPercent: decimal('discountPercent', { precision: 5, scale: 2 }).notNull(),
  finalUnitPrice: decimal('finalUnitPrice', { precision: 12, scale: 2 }).notNull(),
  vatRate: decimal('vatRate', { precision: 5, scale: 2 }).notNull(),
  vatAmount: decimal('vatAmount', { precision: 12, scale: 2 }).notNull(),
  lineSubtotal: decimal('lineSubtotal', { precision: 12, scale: 2 }).notNull(),
  lineTotal: decimal('lineTotal', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

// --- Inferred types --------------------------------------------------------
export type User = typeof user.$inferSelect
export type Product = typeof product.$inferSelect
export type NewProduct = typeof product.$inferInsert
export type ProductImage = typeof productImage.$inferSelect
export type ProductVariant = typeof productVariant.$inferSelect
export type NewProductVariant = typeof productVariant.$inferInsert
export type ProductDocument = typeof productDocument.$inferSelect
export type NewProductDocument = typeof productDocument.$inferInsert
export type InternalProductCost = typeof internalProductCost.$inferSelect
export type NewInternalProductCost = typeof internalProductCost.$inferInsert
export type CmsContent = typeof cmsContent.$inferSelect
export type SiteSettings = typeof siteSettings.$inferSelect
export type Order = typeof order.$inferSelect
export type OrderItem = typeof orderItem.$inferSelect
export type NewOrderItem = typeof orderItem.$inferInsert
