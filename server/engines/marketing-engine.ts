/**
 * Covelligent Marketing Engine
 * Self-generates ad copy, rotates campaigns, schedules social posts,
 * tracks A/B test performance, and auto-pauses underperforming ads.
 */
import { db } from "../db";
import {
  adCampaigns, emailSequences, socialPosts,
  abTests, growthMetrics, systemLogs
} from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";

const now = () => new Date().toISOString();

function log(level: string, message: string, data?: object) {
  db.insert(systemLogs).values({
    level, source: "marketing_engine", message,
    data: data ? JSON.stringify(data) : null,
    createdAt: now(),
  }).run();
}

// ─── Campaign Management ──────────────────────────────────────────────────────

export function getCampaigns() {
  return db.select().from(adCampaigns).orderBy(desc(adCampaigns.createdAt)).all();
}

export function getActiveCampaigns(channel?: string) {
  const q = db.select().from(adCampaigns).where(eq(adCampaigns.status, "active"));
  return q.all().filter(c => !channel || c.channel === channel);
}

export function recordImpression(campaignId: number) {
  db.update(adCampaigns)
    .set({ impressions: sql`impressions + 1` })
    .where(eq(adCampaigns.id, campaignId))
    .run();
}

export function recordClick(campaignId: number) {
  db.update(adCampaigns)
    .set({ clicks: sql`clicks + 1` })
    .where(eq(adCampaigns.id, campaignId))
    .run();
}

export function recordConversion(campaignId: number) {
  db.update(adCampaigns)
    .set({ conversions: sql`conversions + 1` })
    .where(eq(adCampaigns.id, campaignId))
    .run();
}

/** Auto-generate new ad copy variants based on top performers */
export function generateAdVariant(baseCampaignId: number): typeof adCampaigns.$inferSelect | null {
  const base = db.select().from(adCampaigns).where(eq(adCampaigns.id, baseCampaignId)).get();
  if (!base) return null;

  const ctr = base.impressions > 0 ? (base.clicks / base.impressions) : 0;
  const convRate = base.clicks > 0 ? (base.conversions / base.clicks) : 0;

  // Templates for auto-generated variants
  const variants = [
    {
      headline: `${base.headline.split("—")[0].trim()} — now with file upload`,
      body: `${base.body} New: Drop in any PDF or document and ask Covelligent about it.`,
      cta: base.cta,
    },
    {
      headline: `Over 1,000 researchers trust Covelligent. Here's why.`,
      body: base.body,
      cta: "See what they're saying",
    },
    {
      headline: base.headline,
      body: base.body.replace(/free/gi, "free (no credit card)"),
      cta: "Start free — no card needed",
    },
  ];

  const variantData = variants[Math.floor(Math.random() * variants.length)];
  const newVariantGroup = `${base.variantGroup || "auto"}-${Date.now().toString(36)}`;

  const created = db.insert(adCampaigns).values({
    name: `${base.name} [Auto-Variant]`,
    channel: base.channel,
    headline: variantData.headline,
    body: variantData.body,
    cta: variantData.cta,
    targetAudience: base.targetAudience,
    status: "active",
    impressions: 0,
    clicks: 0,
    conversions: 0,
    variantGroup: newVariantGroup,
    createdAt: now(),
  }).returning().get();

  log("success", `Auto-generated ad variant from campaign #${baseCampaignId}`, {
    newId: created.id,
    baseCTR: (ctr * 100).toFixed(2) + "%",
    baseConvRate: (convRate * 100).toFixed(2) + "%",
  });

  return created;
}

/** Auto-pause campaigns with CTR below threshold */
export function autoPauseUnderperformers(minImpressions = 500, minCTR = 0.02) {
  const campaigns = db.select().from(adCampaigns)
    .where(eq(adCampaigns.status, "active"))
    .all();

  let paused = 0;
  for (const c of campaigns) {
    if (c.impressions < minImpressions) continue;
    const ctr = c.clicks / c.impressions;
    if (ctr < minCTR) {
      db.update(adCampaigns).set({ status: "paused" }).where(eq(adCampaigns.id, c.id)).run();
      paused++;
      log("warn", `Auto-paused campaign #${c.id} '${c.name}' — CTR ${(ctr * 100).toFixed(2)}% below ${(minCTR * 100)}% threshold`);
    }
  }

  if (paused > 0) log("info", `Auto-pause run complete: ${paused} campaign(s) paused`);
  return paused;
}

/** Schedule a social post for a specific time */
export function scheduleSocialPost(
  platform: string,
  content: string,
  hashtags: string[],
  scheduledFor: Date
) {
  return db.insert(socialPosts).values({
    platform,
    content,
    hashtags: JSON.stringify(hashtags),
    status: "queued",
    scheduledFor: scheduledFor.toISOString(),
    generatedBy: "system",
    createdAt: now(),
  }).returning().get();
}

/** Mark queued posts as "posted" if their scheduledFor has passed */
export function processScheduledPosts() {
  const now_ts = new Date().toISOString();
  const due = db.select().from(socialPosts)
    .where(eq(socialPosts.status, "queued"))
    .all()
    .filter(p => p.scheduledFor && p.scheduledFor <= now_ts);

  for (const post of due) {
    db.update(socialPosts)
      .set({ status: "posted", postedAt: now() })
      .where(eq(socialPosts.id, post.id))
      .run();
    log("success", `Auto-posted ${post.platform} post #${post.id}`);
  }
  return due.length;
}

/** Get all social posts */
export function getSocialPosts() {
  return db.select().from(socialPosts).orderBy(desc(socialPosts.createdAt)).all();
}

/** Auto-generate next week's social content based on feature flags / roadmap */
export function generateWeeklySocialContent(): string[] {
  const templates = [
    { platform: "twitter", content: "This week in Covelligent: we've shipped improvements to citation ranking and answer depth. Ask a complex question today — the difference is noticeable.", hashtags: ["#AI", "#Covelligent", "#Update"] },
    { platform: "twitter", content: "Reminder: Covelligent Pro includes API access. If you're building on top of AI search, we're a great foundation. Documentation is live.", hashtags: ["#AI", "#API", "#Developers"] },
    { platform: "linkedin", content: "Why citation quality matters in AI search:\n\nA confident wrong answer is worse than no answer. Covelligent ranks sources by credibility, cross-references claims, and flags conflicts. We'd rather show uncertainty than manufacture confidence.", hashtags: ["#AI", "#Research", "#Trust"] },
    { platform: "twitter", content: "The best Covelligent queries are the ones you'd never type into Google. Try: 'What are the second-order effects of the latest Fed rate decision?' Watch what happens.", hashtags: ["#AI", "#Research"] },
    { platform: "reddit", content: "Weekly thread: What's the most interesting thing you've researched with Covelligent this week? Drop your best query + what surprised you about the answer.", hashtags: [] },
  ];

  const generated: string[] = [];
  const baseDate = Date.now();

  templates.forEach((t, i) => {
    const scheduled = new Date(baseDate + (i + 1) * 1.5 * 86400000);
    const post = scheduleSocialPost(t.platform, t.content, t.hashtags, scheduled);
    generated.push(`${t.platform} #${post.id}`);
  });

  log("success", `Generated ${generated.length} social posts for the next week`);
  return generated;
}

// ─── A/B Tests ────────────────────────────────────────────────────────────────

export function getAbTests() {
  return db.select().from(abTests).orderBy(desc(abTests.startedAt)).all();
}

/** Analyze A/B tests and auto-conclude winners */
export function analyzeAbTests() {
  const running = db.select().from(abTests).where(eq(abTests.status, "running")).all();
  const concluded: string[] = [];

  for (const test of running) {
    const results = JSON.parse(test.results || "[]") as Array<{ variantId: string; conversions: number; impressions: number }>;
    if (results.length < 2) continue;

    const totalImpressions = results.reduce((s, r) => s + r.impressions, 0);
    if (totalImpressions < 2000) continue; // Need statistical significance

    // Simple conversion rate comparison
    const sorted = [...results].sort((a, b) =>
      (b.conversions / Math.max(b.impressions, 1)) - (a.conversions / Math.max(a.impressions, 1))
    );

    const winner = sorted[0];
    const winnerRate = winner.conversions / Math.max(winner.impressions, 1);
    const runnerRate = sorted[1].conversions / Math.max(sorted[1].impressions, 1);

    // Only conclude if winner is >15% better
    if (winnerRate > runnerRate * 1.15) {
      db.update(abTests).set({
        status: "concluded",
        winner: winner.variantId,
        concludedAt: now(),
      }).where(eq(abTests.id, test.id)).run();

      concluded.push(test.name);
      log("success", `A/B test '${test.name}' concluded — winner: Variant ${winner.variantId} (${(winnerRate * 100).toFixed(1)}% vs ${(runnerRate * 100).toFixed(1)}%)`);
    }
  }

  return concluded;
}

// ─── Email Sequences ─────────────────────────────────────────────────────────

export function getEmailSequences() {
  return db.select().from(emailSequences).orderBy(emailSequences.stepNumber).all();
}

export function updateEmailMetrics(id: number, openRate: number, clickRate: number, sentCount: number) {
  db.update(emailSequences)
    .set({ openRate, clickRate, sentCount })
    .where(eq(emailSequences.id, id))
    .run();
}
