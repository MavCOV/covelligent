import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── CORE ───────────────────────────────────────────────────────────────────

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  plan: text("plan").notNull().default("free"),
  avatar: text("avatar"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const conversations = sqliteTable("conversations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  createdAt: text("created_at").notNull(),
});
export const insertConversationSchema = createInsertSchema(conversations).omit({ id: true });
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  conversationId: integer("conversation_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  sources: text("sources"),
  createdAt: text("created_at").notNull(),
});
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true });
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export const searches = sqliteTable("searches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  query: text("query").notNull(),
  createdAt: text("created_at").notNull(),
});
export const insertSearchSchema = createInsertSchema(searches).omit({ id: true });
export type InsertSearch = z.infer<typeof insertSearchSchema>;
export type Search = typeof searches.$inferSelect;

// ─── VERSION / CHANGELOG ENGINE ─────────────────────────────────────────────

export const versions = sqliteTable("versions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  version: text("version").notNull(),           // e.g. "1.2.0"
  codename: text("codename"),                   // e.g. "Harbour"
  releaseNotes: text("release_notes").notNull(),
  changes: text("changes").notNull(),           // JSON array of change objects
  status: text("status").notNull().default("draft"), // draft | staging | live
  deployedAt: text("deployed_at"),
  createdAt: text("created_at").notNull(),
});
export const insertVersionSchema = createInsertSchema(versions).omit({ id: true });
export type InsertVersion = z.infer<typeof insertVersionSchema>;
export type Version = typeof versions.$inferSelect;

export const featureFlags = sqliteTable("feature_flags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  description: text("description"),
  enabled: integer("enabled").notNull().default(0), // 0=off, 1=on
  rolloutPct: integer("rollout_pct").notNull().default(0), // 0-100
  updatedAt: text("updated_at").notNull(),
});
export const insertFeatureFlagSchema = createInsertSchema(featureFlags).omit({ id: true });
export type InsertFeatureFlag = z.infer<typeof insertFeatureFlagSchema>;
export type FeatureFlag = typeof featureFlags.$inferSelect;

export const roadmapItems = sqliteTable("roadmap_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(), // "feature" | "improvement" | "bugfix" | "experiment"
  status: text("status").notNull().default("planned"), // planned | in_progress | shipped | cancelled
  priority: integer("priority").notNull().default(2), // 1=high 2=med 3=low
  votes: integer("votes").notNull().default(0),
  quarter: text("quarter"),             // e.g. "Q3 2026"
  createdAt: text("created_at").notNull(),
  shippedAt: text("shipped_at"),
});
export const insertRoadmapItemSchema = createInsertSchema(roadmapItems).omit({ id: true });
export type InsertRoadmapItem = z.infer<typeof insertRoadmapItemSchema>;
export type RoadmapItem = typeof roadmapItems.$inferSelect;

// ─── MARKETING ENGINE ────────────────────────────────────────────────────────

export const adCampaigns = sqliteTable("ad_campaigns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  channel: text("channel").notNull(), // "twitter" | "reddit" | "email" | "blog" | "banner"
  headline: text("headline").notNull(),
  body: text("body").notNull(),
  cta: text("cta").notNull(),
  targetAudience: text("target_audience"),
  status: text("status").notNull().default("active"), // active | paused | archived
  impressions: integer("impressions").notNull().default(0),
  clicks: integer("clicks").notNull().default(0),
  conversions: integer("conversions").notNull().default(0),
  variantGroup: text("variant_group"),  // A/B group ID
  createdAt: text("created_at").notNull(),
  scheduledFor: text("scheduled_for"),
});
export const insertAdCampaignSchema = createInsertSchema(adCampaigns).omit({ id: true });
export type InsertAdCampaign = z.infer<typeof insertAdCampaignSchema>;
export type AdCampaign = typeof adCampaigns.$inferSelect;

export const emailSequences = sqliteTable("email_sequences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  triggerEvent: text("trigger_event").notNull(), // "signup" | "trial_start" | "upgrade" | "churn_risk"
  stepNumber: integer("step_number").notNull(),
  delayDays: integer("delay_days").notNull().default(0),
  subject: text("subject").notNull(),
  preheader: text("preheader"),
  body: text("body").notNull(),
  ctaText: text("cta_text"),
  ctaUrl: text("cta_url"),
  active: integer("active").notNull().default(1),
  sentCount: integer("sent_count").notNull().default(0),
  openRate: real("open_rate").notNull().default(0),
  clickRate: real("click_rate").notNull().default(0),
  createdAt: text("created_at").notNull(),
});
export const insertEmailSequenceSchema = createInsertSchema(emailSequences).omit({ id: true });
export type InsertEmailSequence = z.infer<typeof insertEmailSequenceSchema>;
export type EmailSequence = typeof emailSequences.$inferSelect;

export const socialPosts = sqliteTable("social_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  platform: text("platform").notNull(), // "twitter" | "linkedin" | "reddit"
  content: text("content").notNull(),
  hashtags: text("hashtags"),           // JSON array
  status: text("status").notNull().default("queued"), // queued | posted | failed
  scheduledFor: text("scheduled_for"),
  postedAt: text("posted_at"),
  engagement: text("engagement"),       // JSON: { likes, shares, comments }
  generatedBy: text("generated_by").notNull().default("system"), // system | admin
  createdAt: text("created_at").notNull(),
});
export const insertSocialPostSchema = createInsertSchema(socialPosts).omit({ id: true });
export type InsertSocialPost = z.infer<typeof insertSocialPostSchema>;
export type SocialPost = typeof socialPosts.$inferSelect;

// ─── ANALYTICS ENGINE ────────────────────────────────────────────────────────

export const analyticsEvents = sqliteTable("analytics_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  event: text("event").notNull(),          // "pageview" | "search" | "signup" | "upgrade" | "share"
  page: text("page"),
  userId: integer("user_id"),
  sessionId: text("session_id"),
  referrer: text("referrer"),
  properties: text("properties"),         // JSON blob
  createdAt: text("created_at").notNull(),
});
export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({ id: true });
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;

export const abTests = sqliteTable("ab_tests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  hypothesis: text("hypothesis"),
  metric: text("metric").notNull(),        // "ctr" | "signup_rate" | "upgrade_rate"
  variants: text("variants").notNull(),   // JSON: [{id, label, weight}]
  results: text("results"),              // JSON: [{variantId, conversions, impressions}]
  status: text("status").notNull().default("running"), // running | paused | concluded
  winner: text("winner"),
  startedAt: text("started_at").notNull(),
  concludedAt: text("concluded_at"),
});
export const insertAbTestSchema = createInsertSchema(abTests).omit({ id: true });
export type InsertAbTest = z.infer<typeof insertAbTestSchema>;
export type AbTest = typeof abTests.$inferSelect;

export const growthMetrics = sqliteTable("growth_metrics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull().unique(),  // YYYY-MM-DD
  dau: integer("dau").notNull().default(0),
  mau: integer("mau").notNull().default(0),
  newSignups: integer("new_signups").notNull().default(0),
  proUpgrades: integer("pro_upgrades").notNull().default(0),
  churned: integer("churned").notNull().default(0),
  totalSearches: integer("total_searches").notNull().default(0),
  avgSessionMin: real("avg_session_min").notNull().default(0),
  revenue: real("revenue").notNull().default(0),
  createdAt: text("created_at").notNull(),
});
export const insertGrowthMetricSchema = createInsertSchema(growthMetrics).omit({ id: true });
export type InsertGrowthMetric = z.infer<typeof insertGrowthMetricSchema>;
export type GrowthMetric = typeof growthMetrics.$inferSelect;

// ─── SYSTEM LOGS ─────────────────────────────────────────────────────────────

export const systemLogs = sqliteTable("system_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  level: text("level").notNull().default("info"), // info | warn | error | success
  source: text("source").notNull(),  // "version_engine" | "marketing_engine" | "analytics" | "cron"
  message: text("message").notNull(),
  data: text("data"),               // JSON blob
  createdAt: text("created_at").notNull(),
});
export const insertSystemLogSchema = createInsertSchema(systemLogs).omit({ id: true });
export type InsertSystemLog = z.infer<typeof insertSystemLogSchema>;
export type SystemLog = typeof systemLogs.$inferSelect;

// ─── USER TOOLS ──────────────────────────────────────────────────────────────

export const collections = sqliteTable("collections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: text("created_at").notNull(),
});
export const insertCollectionSchema = createInsertSchema(collections).omit({ id: true });
export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type Collection = typeof collections.$inferSelect;

export const savedSearches = sqliteTable("saved_searches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  collectionId: integer("collection_id"),
  conversationId: integer("conversation_id").notNull(),
  note: text("note"),
  createdAt: text("created_at").notNull(),
});
export const insertSavedSearchSchema = createInsertSchema(savedSearches).omit({ id: true });
export type InsertSavedSearch = z.infer<typeof insertSavedSearchSchema>;
export type SavedSearch = typeof savedSearches.$inferSelect;

export const subscriptions = sqliteTable("subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().unique(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  status: text("status").notNull().default("inactive"), // active | inactive | trialing | canceled
  plan: text("plan").notNull().default("free"),
  currentPeriodEnd: text("current_period_end"),
  createdAt: text("created_at").notNull(),
});
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true });
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
