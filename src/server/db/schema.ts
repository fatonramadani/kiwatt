import { relations } from "drizzle-orm";
import {
  boolean,
  decimal,
  index,
  integer,
  json,
  pgEnum,
  pgTable,
  pgTableCreator,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `pg-drizzle_${name}`);

export const posts = createTable(
  "post",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 256 }),
    createdById: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => user.id),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("created_by_idx").on(t.createdById),
    index("name_idx").on(t.name),
  ],
);

// Enums
export const languageEnum = pgEnum("language", ["fr", "de", "it", "en"]);
export const distributionStrategyEnum = pgEnum("distribution_strategy", [
  "prorata",
  "equal",
  "priority",
]);
export const memberRoleEnum = pgEnum("member_role", ["admin", "member"]);
export const memberStatusEnum = pgEnum("member_status", [
  "active",
  "inactive",
  "pending",
]);
export const installationTypeEnum = pgEnum("installation_type", [
  "consumer",
  "producer",
  "prosumer",
]);
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled",
]);
export const invoiceLineTypeEnum = pgEnum("invoice_line_type", [
  "consumption",
  "production_credit",
  "fee",
  "adjustment",
]);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  phone: text("phone"),
  preferredLanguage: languageEnum("preferred_language").default("fr"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
});

export const userRelations = relations(user, ({ many }) => ({
  account: many(account),
  session: many(session),
  organizationMemberships: many(organizationMember),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

// ============================================================================
// CEL (Community Electricity) Schema
// ============================================================================

// Organization (CEL) table
export const organization = pgTable(
  "organization",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    address: text("address"),
    postalCode: text("postal_code"),
    city: text("city"),
    commune: text("commune"),
    canton: text("canton"),
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),
    romandeEnergieId: text("romande_energie_id"),
    billingSettings: json("billing_settings").$type<{
      currency: string;
      vatRate: number;
      paymentTermDays: number;
      // QR-bill payment information
      iban?: string;
      qrIban?: string;
      payeeName?: string;
      payeeAddress?: string;
      payeeZip?: string;
      payeeCity?: string;
      payeeCountry?: string;
    }>(),
    distributionStrategy: distributionStrategyEnum("distribution_strategy")
      .default("prorata")
      .notNull(),
    logoUrl: text("logo_url"),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [uniqueIndex("org_slug_idx").on(t.slug)],
);

// Organization Member table (connects users to organizations)
export const organizationMember = pgTable(
  "organization_member",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    role: memberRoleEnum("role").default("member").notNull(),
    firstname: text("firstname").notNull(),
    lastname: text("lastname").notNull(),
    address: text("address"),
    postalCode: text("postal_code"),
    city: text("city"),
    phone: text("phone"),
    email: text("email").notNull(),
    podNumber: text("pod_number").notNull(),
    installationType: installationTypeEnum("installation_type")
      .default("consumer")
      .notNull(),
    solarCapacityKwp: decimal("solar_capacity_kwp", { precision: 10, scale: 2 }),
    batteryCapacityKwh: decimal("battery_capacity_kwh", {
      precision: 10,
      scale: 2,
    }),
    priorityLevel: integer("priority_level").default(5).notNull(),
    status: memberStatusEnum("status").default("pending").notNull(),
    joinedAt: timestamp("joined_at").$defaultFn(() => new Date()),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index("member_org_idx").on(t.organizationId),
    index("member_user_idx").on(t.userId),
    index("member_pod_idx").on(t.podNumber),
    uniqueIndex("member_org_pod_idx").on(t.organizationId, t.podNumber),
  ],
);

// Load Curve (Courbe de Charge) table
export const loadCurve = pgTable(
  "load_curve",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    memberId: text("member_id")
      .notNull()
      .references(() => organizationMember.id, { onDelete: "cascade" }),
    periodStart: timestamp("period_start").notNull(),
    periodEnd: timestamp("period_end").notNull(),
    intervalMinutes: integer("interval_minutes").default(15).notNull(),
    dataPoints: json("data_points")
      .$type<
        Array<{
          timestamp: string;
          consumptionKwh: number;
          productionKwh: number;
        }>
      >()
      .notNull(),
    totalConsumptionKwh: decimal("total_consumption_kwh", {
      precision: 12,
      scale: 4,
    }).notNull(),
    totalProductionKwh: decimal("total_production_kwh", {
      precision: 12,
      scale: 4,
    }).notNull(),
    sourceFile: text("source_file"),
    importedAt: timestamp("imported_at")
      .$defaultFn(() => new Date())
      .notNull(),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index("load_curve_org_idx").on(t.organizationId),
    index("load_curve_member_idx").on(t.memberId),
    index("load_curve_period_idx").on(t.periodStart, t.periodEnd),
  ],
);

// Monthly Aggregation table
export const monthlyAggregation = pgTable(
  "monthly_aggregation",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    memberId: text("member_id")
      .notNull()
      .references(() => organizationMember.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    totalConsumptionKwh: decimal("total_consumption_kwh", {
      precision: 12,
      scale: 4,
    }).notNull(),
    totalProductionKwh: decimal("total_production_kwh", {
      precision: 12,
      scale: 4,
    }).notNull(),
    selfConsumptionKwh: decimal("self_consumption_kwh", {
      precision: 12,
      scale: 4,
    }).notNull(),
    communityConsumptionKwh: decimal("community_consumption_kwh", {
      precision: 12,
      scale: 4,
    }).notNull(),
    gridConsumptionKwh: decimal("grid_consumption_kwh", {
      precision: 12,
      scale: 4,
    }).notNull(),
    exportedToCommunityKwh: decimal("exported_to_community_kwh", {
      precision: 12,
      scale: 4,
    }).notNull(),
    exportedToGridKwh: decimal("exported_to_grid_kwh", {
      precision: 12,
      scale: 4,
    }).notNull(),
    calculatedAt: timestamp("calculated_at")
      .$defaultFn(() => new Date())
      .notNull(),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index("aggregation_org_idx").on(t.organizationId),
    index("aggregation_member_idx").on(t.memberId),
    uniqueIndex("aggregation_member_period_idx").on(
      t.memberId,
      t.year,
      t.month,
    ),
  ],
);

// Tariff Plan table
export const tariffPlan = pgTable(
  "tariff_plan",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    communityRateChfKwh: decimal("community_rate_chf_kwh", {
      precision: 10,
      scale: 4,
    }).notNull(),
    gridRateChfKwh: decimal("grid_rate_chf_kwh", {
      precision: 10,
      scale: 4,
    }).notNull(),
    injectionRateChfKwh: decimal("injection_rate_chf_kwh", {
      precision: 10,
      scale: 4,
    }).notNull(),
    monthlyFeeChf: decimal("monthly_fee_chf", {
      precision: 10,
      scale: 2,
    }).default("0"),
    vatRate: decimal("vat_rate", { precision: 5, scale: 2 })
      .default("7.70")
      .notNull(),
    validFrom: timestamp("valid_from").notNull(),
    validTo: timestamp("valid_to"),
    isDefault: boolean("is_default").default(false).notNull(),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index("tariff_org_idx").on(t.organizationId),
    index("tariff_valid_idx").on(t.validFrom, t.validTo),
  ],
);

// Payment method enum
export const paymentMethodEnum = pgEnum("payment_method", [
  "bank_transfer",
  "cash",
  "other",
]);

// Invoice table
export const invoice = pgTable(
  "invoice",
  {
    id: text("id").primaryKey(),
    invoiceNumber: text("invoice_number").notNull(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    memberId: text("member_id")
      .notNull()
      .references(() => organizationMember.id, { onDelete: "cascade" }),
    periodStart: timestamp("period_start").notNull(),
    periodEnd: timestamp("period_end").notNull(),
    status: invoiceStatusEnum("status").default("draft").notNull(),
    dueDate: timestamp("due_date").notNull(),
    subtotalChf: decimal("subtotal_chf", { precision: 12, scale: 2 }).notNull(),
    vatAmountChf: decimal("vat_amount_chf", {
      precision: 12,
      scale: 2,
    }).notNull(),
    totalChf: decimal("total_chf", { precision: 12, scale: 2 }).notNull(),
    pdfUrl: text("pdf_url"),
    sentAt: timestamp("sent_at"),
    paidAt: timestamp("paid_at"),
    // Payment details
    paymentMethod: paymentMethodEnum("payment_method"),
    paymentReference: text("payment_reference"),
    paymentNotes: text("payment_notes"),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index("invoice_org_idx").on(t.organizationId),
    index("invoice_member_idx").on(t.memberId),
    index("invoice_status_idx").on(t.status),
    uniqueIndex("invoice_number_org_idx").on(t.organizationId, t.invoiceNumber),
  ],
);

// Invoice Line table
export const invoiceLine = pgTable(
  "invoice_line",
  {
    id: text("id").primaryKey(),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => invoice.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    quantity: decimal("quantity", { precision: 12, scale: 4 }).notNull(),
    unit: text("unit").notNull(),
    unitPriceChf: decimal("unit_price_chf", {
      precision: 10,
      scale: 4,
    }).notNull(),
    totalChf: decimal("total_chf", { precision: 12, scale: 2 }).notNull(),
    lineType: invoiceLineTypeEnum("line_type").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [index("invoice_line_invoice_idx").on(t.invoiceId)],
);

// ============================================================================
// CEL Relations
// ============================================================================

export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(organizationMember),
  loadCurves: many(loadCurve),
  monthlyAggregations: many(monthlyAggregation),
  tariffPlans: many(tariffPlan),
  invoices: many(invoice),
}));

export const organizationMemberRelations = relations(
  organizationMember,
  ({ one, many }) => ({
    organization: one(organization, {
      fields: [organizationMember.organizationId],
      references: [organization.id],
    }),
    user: one(user, {
      fields: [organizationMember.userId],
      references: [user.id],
    }),
    loadCurves: many(loadCurve),
    monthlyAggregations: many(monthlyAggregation),
    invoices: many(invoice),
  }),
);

export const loadCurveRelations = relations(loadCurve, ({ one }) => ({
  organization: one(organization, {
    fields: [loadCurve.organizationId],
    references: [organization.id],
  }),
  member: one(organizationMember, {
    fields: [loadCurve.memberId],
    references: [organizationMember.id],
  }),
}));

export const monthlyAggregationRelations = relations(
  monthlyAggregation,
  ({ one }) => ({
    organization: one(organization, {
      fields: [monthlyAggregation.organizationId],
      references: [organization.id],
    }),
    member: one(organizationMember, {
      fields: [monthlyAggregation.memberId],
      references: [organizationMember.id],
    }),
  }),
);

export const tariffPlanRelations = relations(tariffPlan, ({ one }) => ({
  organization: one(organization, {
    fields: [tariffPlan.organizationId],
    references: [organization.id],
  }),
}));

export const invoiceRelations = relations(invoice, ({ one, many }) => ({
  organization: one(organization, {
    fields: [invoice.organizationId],
    references: [organization.id],
  }),
  member: one(organizationMember, {
    fields: [invoice.memberId],
    references: [organizationMember.id],
  }),
  lines: many(invoiceLine),
}));

export const invoiceLineRelations = relations(invoiceLine, ({ one }) => ({
  invoice: one(invoice, {
    fields: [invoiceLine.invoiceId],
    references: [invoice.id],
  }),
}));
