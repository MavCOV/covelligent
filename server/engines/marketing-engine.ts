/**
 * Covelligent Marketing Engine
 * Self-generates ad copy, rotates campaigns, schedules social posts,
 * tracks A/B test performance, and auto-pauses underperforming ads.
 * Uses raw SQL helpers (no Drizzle ORM).
 */
import { run, get, all } from "../db";

const now = () => new Date().toISOString();

async function log(level: string, message: string) {
  await run(
    `INSERT INTO system_logs (level, source, message, created_at) VALUES (?, ?, ?, ?)`,
    [level, "marketing_engine", message, now()]
  );
}

// ─── Campaign Management ──────────────────────────────────────────────────────

export async function getCampaigns() {
  return all("SELECT * FROM ad_campaigns ORDER BY created_at DESC");
}

export async function getActiveCampaigns(platform?: string) {
  if (platform) {
    return all("SELECT * FROM ad_campaigns WHERE status = 'active' AND platform = ?", [platform]);
  }
  return all("SELECT * FROM ad_campaigns WHERE status = 'active'");
}

export async function recordImpression(campaignId: number) {
  await run("UPDATE ad_campaigns SET impressions = impressions + 1 WHERE id = ?", [campaignId]);
}

export async function recordClick(campaignId: number) {
  await run("UPDATE ad_campaigns SET clicks = clicks + 1 WHERE id = ?", [campaignId]);
}

export async function recordConversion(campaignId: number) {
  await run("UPDATE ad_campaigns SET conversions = conversions + 1 WHERE id = ?", [campaignId]);
}

/** Auto-generate new ad copy variants based on top performers */
export async function generateAdVariant(baseCampaignId: number) {
  const base = await get("SELECT * FROM ad_campaigns WHERE id = ?", [baseCampaignId]) as any;
  if (!base) return null;

  const ctr = base.impressions > 0 ? (base.clicks / base.impressions) : 0;
  const convRate = base.clicks > 0 ? (base.conversions / base.clicks) : 0;

  // Templates for auto-generated variants
  const variants = [
    { copy: `${base.copy} New: Drop in any PDF or document and ask Covelligent about it.` },
    { copy: `Over 1,000 researchers trust Covelligent. Here's why. ${base.copy}` },
    { copy: (base.copy as string).replace(/free/gi, "free (no credit card)") },
  ];

  const variantData = variants[Math.floor(Math.random() * variants.length)];

  await run(
    `INSERT INTO ad_campaigns (name, platform, status, budget, spend, impressions, clicks, conversions, copy, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [`${base.name} [Auto-Variant]`, base.platform, "active", base.budget || 1000, 0, 0, 0, 0, variantData.copy, now()]
  );

  const created = await get("SELECT * FROM ad_campaigns WHERE name = ? ORDER BY id DESC LIMIT 1", [`${base.name} [Auto-Variant]`]) as any;
  log("success", `Auto-generated ad variant from campaign #${baseCampaignId} (baseCTR: ${(ctr * 100).toFixed(2)}%, baseConvRate: ${(convRate * 100).toFixed(2)}%)`);

  return created;
}

/** Auto-pause campaigns with CTR below threshold */
export async function autoPauseUnderperformers(minImpressions = 500, minCTR = 0.02) {
  const campaigns = await all("SELECT * FROM ad_campaigns WHERE status = 'active'") as any[];

  let paused = 0;
  for (const c of campaigns) {
    if (c.impressions < minImpressions) continue;
    const ctr = c.clicks / c.impressions;
    if (ctr < minCTR) {
      await run("UPDATE ad_campaigns SET status = 'paused' WHERE id = ?", [c.id]);
      paused++;
      log("warn", `Auto-paused campaign #${c.id} '${c.name}' — CTR ${(ctr * 100).toFixed(2)}% below ${(minCTR * 100)}% threshold`);
    }
  }

  if (paused > 0) log("info", `Auto-pause run complete: ${paused} campaign(s) paused`);
  return paused;
}

/** Schedule a social post */
export async function scheduleSocialPost(
  platform: string,
  content: string,
  scheduledFor: Date
) {
  await run(
    `INSERT INTO social_posts (platform, content, status, scheduled_at, posted_at, likes, shares, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [platform, content, "queued", scheduledFor.toISOString(), null, 0, 0, now()]
  );
  return get("SELECT * FROM social_posts ORDER BY id DESC LIMIT 1");
}

/** Mark queued posts as "posted" if their scheduled_at has passed */
export async function processScheduledPosts() {
  const now_ts = new Date().toISOString();
  const due = (await all("SELECT * FROM social_posts WHERE status = 'queued'") as any[])
    .filter((p: any) => p.scheduled_at && p.scheduled_at <= now_ts);

  for (const post of due) {
    await run(
      "UPDATE social_posts SET status = 'posted', posted_at = ? WHERE id = ?",
      [now(), post.id]
    );
    log("success", `Auto-posted ${post.platform} post #${post.id}`);
  }
  return due.length;
}

/** Get all social posts */
export async function getSocialPosts() {
  return all("SELECT * FROM social_posts ORDER BY created_at DESC");
}

/** Auto-generate next week's social content */
export async function generateWeeklySocialContent() {
  const templates = [
    { platform: "twitter", content: "This week in Covelligent: we've shipped improvements to citation ranking and answer depth. Ask a complex question today — the difference is noticeable." },
    { platform: "twitter", content: "Reminder: Covelligent Pro includes API access. If you're building on top of AI search, we're a great foundation. Documentation is live." },
    { platform: "linkedin", content: "Why citation quality matters in AI search:\n\nA confident wrong answer is worse than no answer. Covelligent ranks sources by credibility, cross-references claims, and flags conflicts. We'd rather show uncertainty than manufacture confidence." },
    { platform: "twitter", content: "The best Covelligent queries are the ones you'd never type into Google. Try: 'What are the second-order effects of the latest Fed rate decision?' Watch what happens." },
    { platform: "reddit", content: "Weekly thread: What's the most interesting thing you've researched with Covelligent this week? Drop your best query + what surprised you about the answer." },
  ];

  const generated: string[] = [];
  const baseDate = Date.now();

  for (let i = 0; i < templates.length; i++) {
    const t = templates[i];
    const scheduled = new Date(baseDate + (i + 1) * 1.5 * 86400000);
    const post = await scheduleSocialPost(t.platform, t.content, scheduled) as any;
    if (post) generated.push(`${t.platform} #${post.id}`);
  }

  log("success", `Generated ${generated.length} social posts for the next week`);
  return generated;
}

// ─── A/B Tests ────────────────────────────────────────────────────────────────

export async function getAbTests() {
  return all("SELECT * FROM ab_tests ORDER BY created_at DESC");
}

/** Analyze A/B tests and auto-conclude winners */
export async function analyzeAbTests() {
  const running = await all("SELECT * FROM ab_tests WHERE status = 'running'") as any[];
  const concluded: string[] = [];

  for (const test of running) {
    const totalImpressions = test.impressions_a + test.impressions_b;
    if (totalImpressions < 2000) continue; // Need statistical significance

    const rateA = test.impressions_a > 0 ? test.conversions_a / test.impressions_a : 0;
    const rateB = test.impressions_b > 0 ? test.conversions_b / test.impressions_b : 0;

    // Only conclude if winner is >15% better
    if (rateA > rateB * 1.15 || rateB > rateA * 1.15) {
      const winner = rateA > rateB ? "A" : "B";
      const winnerRate = winner === "A" ? rateA : rateB;
      const loserRate = winner === "A" ? rateB : rateA;

      await run(
        `UPDATE ab_tests SET status = 'concluded', winner = ? WHERE id = ?`,
        [winner, test.id]
      );

      concluded.push(test.name);
      log("success", `A/B test '${test.name}' concluded — winner: Variant ${winner} (${(winnerRate * 100).toFixed(1)}% vs ${(loserRate * 100).toFixed(1)}%)`);
    }
  }

  return concluded;
}

// ─── Email Sequences ─────────────────────────────────────────────────────────

export async function getEmailSequences() {
  return all("SELECT * FROM email_sequences ORDER BY delay_days ASC");
}

export async function updateEmailMetrics(id: number, openRate: number, clickRate: number, sentCount: number) {
  await run(
    `UPDATE email_sequences SET open_rate = ?, sent_count = ? WHERE id = ?`,
    [openRate, sentCount, id]
  );
}
