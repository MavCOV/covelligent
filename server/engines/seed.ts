/**
 * Covelligent Seed Engine
 * Seeds all system tables with realistic bootstrap data on first run.
 * Uses raw SQL helpers (no Drizzle ORM).
 */
import { run, get, all } from "../db";

const now = () => new Date().toISOString();
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

export async function seedSystem() {
  // Only seed if versions table is empty
  const existing = await all("SELECT id FROM versions LIMIT 1");
  if (existing.length > 0) return;

  console.log("[seed] Seeding Covelligent system tables...");

  // ── Versions ────────────────────────────────────────────────────────────────
  await run(
    `INSERT INTO versions (version, codename, status, changelog, created_at, deployed_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      "1.0.0",
      "Harbour",
      "live",
      JSON.stringify([
        { type: "feature", text: "Real-time web search with source citations" },
        { type: "feature", text: "Multi-model AI orchestration (GPT-5, Claude 4, Gemini Ultra)" },
        { type: "feature", text: "Conversational threads with unlimited follow-ups" },
        { type: "feature", text: "Pro subscription — $24.99/month, 14-day free trial" },
        { type: "feature", text: "Dark mode + light mode with system preference detection" },
      ]),
      now(),
      now(),
    ]
  );

  // ── Feature Flags ───────────────────────────────────────────────────────────
  const flags = [
    { key: "deep_research_mode", name: "Deep Research Mode", enabled: 1, rollout_pct: 100, description: "Multi-step agent that breaks complex queries into sub-queries" },
    { key: "file_upload", name: "File Upload & Analysis", enabled: 0, rollout_pct: 0, description: "Allow users to upload PDFs, CSVs, and images for analysis" },
    { key: "voice_input", name: "Voice Input", enabled: 0, rollout_pct: 0, description: "Speech-to-text search input via microphone" },
    { key: "shared_threads", name: "Shareable Threads", enabled: 1, rollout_pct: 100, description: "Public share links for conversations" },
    { key: "api_access", name: "API Access (Pro)", enabled: 1, rollout_pct: 100, description: "REST API with 100k token/mo limit for Pro users" },
    { key: "team_workspaces", name: "Team Workspaces", enabled: 0, rollout_pct: 0, description: "Shared research spaces for teams — coming Q4 2026" },
    { key: "browser_extension", name: "Browser Extension", enabled: 0, rollout_pct: 0, description: "Chrome/Firefox extension for highlight-to-search" },
    { key: "mobile_app", name: "Mobile App (iOS/Android)", enabled: 0, rollout_pct: 0, description: "Native mobile apps" },
  ];
  for (const f of flags) {
    await run(
      `INSERT OR IGNORE INTO feature_flags (key, name, enabled, rollout_pct, description, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [f.key, f.name, f.enabled, f.rollout_pct, f.description, now()]
    );
  }

  // ── Roadmap ──────────────────────────────────────────────────────────────────
  const roadmap = [
    { title: "File Upload & Analysis", description: "Upload PDFs, spreadsheets, and images — Covelligent analyzes and answers questions about your documents.", status: "in_progress", votes: 847, priority: "high" },
    { title: "Voice Input", description: "Speak your query — Covelligent transcribes and searches instantly.", status: "planned", votes: 612, priority: "high" },
    { title: "Team Workspaces", description: "Collaborate with your team — shared collections, annotation, and real-time co-research.", status: "planned", votes: 1204, priority: "high" },
    { title: "Browser Extension", description: "Highlight any text on any webpage to instantly ask Covelligent about it.", status: "planned", votes: 538, priority: "medium" },
    { title: "Mobile App (iOS + Android)", description: "Full-featured native mobile experience.", status: "planned", votes: 2104, priority: "high" },
    { title: "Answer Export (PDF/Markdown/Notion)", description: "Export any conversation or research collection in multiple formats.", status: "in_progress", votes: 391, priority: "medium" },
    { title: "Citation Quality Improvements", description: "Smarter source ranking, deduplication, and credibility scoring.", status: "in_progress", votes: 276, priority: "high" },
    { title: "Personalized Trending Feed", description: "Trending topics curated to your search history and interests.", status: "planned", votes: 183, priority: "medium" },
    { title: "Real-time Collaboration", description: "Multiple users in the same research thread simultaneously.", status: "planned", votes: 445, priority: "medium" },
  ];
  for (const r of roadmap) {
    await run(
      `INSERT INTO roadmap_items (title, description, status, votes, priority, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [r.title, r.description, r.status, r.votes, r.priority, now()]
    );
  }

  // ── Ad Campaigns ─────────────────────────────────────────────────────────────
  const campaigns = [
    { name: "Launch — Twitter A", platform: "twitter", status: "active", budget: 5000, spend: 1482, impressions: 14820, clicks: 892, conversions: 67, copy: "The search engine that actually thinks. Covelligent reads the web, synthesizes the best answer, and cites every source. Try free →" },
    { name: "Launch — Twitter B", platform: "twitter", status: "active", budget: 5000, spend: 1356, impressions: 13560, clicks: 1034, conversions: 89, copy: "Stop reading 10 articles. Ask Covelligent once. Real-time web search + AI synthesis + cited sources. Free plan available." },
    { name: "Pro Upgrade — Reddit", platform: "reddit", status: "active", budget: 3000, spend: 824, impressions: 8240, clicks: 641, conversions: 48, copy: "I switched from Perplexity to Covelligent — here's why. Citation quality is better, conversation UX is cleaner, multi-model approach catches things others miss. Pro is $24.99/mo with a 14-day trial." },
    { name: "Feature Drop — File Upload", platform: "twitter", status: "paused", budget: 2000, spend: 0, impressions: 0, clicks: 0, conversions: 0, copy: "New: Upload your documents to Covelligent. PDF? Spreadsheet? Research paper? Drop it in and ask anything. Pro users get early access this week." },
    { name: "Email Re-engagement", platform: "email", status: "active", budget: 1000, spend: 320, impressions: 3200, clicks: 284, conversions: 31, copy: "We've shipped 12 improvements since you last used Covelligent. Citation quality is up 40%, answers are 2x faster, and we've added Deep Research mode. Come back and try it." },
  ];
  for (const c of campaigns) {
    await run(
      `INSERT INTO ad_campaigns (name, platform, status, budget, spend, impressions, clicks, conversions, copy, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [c.name, c.platform, c.status, c.budget, c.spend, c.impressions, c.clicks, c.conversions, c.copy, now()]
    );
  }

  // ── Email Sequences ──────────────────────────────────────────────────────────
  const emails = [
    { name: "Onboarding — Day 0", trigger: "signup", subject: "Welcome to Covelligent — here's where to start", body: "You just joined the smartest search engine on the web. Covelligent isn't a chatbot — it searches the real-time web, synthesizes the best answer, and shows you exactly where it came from.", delay_days: 0, sent_count: 1247, open_rate: 0.68, active: 1 },
    { name: "Onboarding — Day 3", trigger: "signup", subject: "3 Covelligent features most people miss", body: "You've been with Covelligent for a few days — here are three features that make the biggest difference: follow-up questions, source filtering, and search modes.", delay_days: 3, sent_count: 1089, open_rate: 0.52, active: 1 },
    { name: "Onboarding — Day 7 (Trial Pitch)", trigger: "signup", subject: "Unlock unlimited searches — 14 days free", body: "A week in — you've seen what Covelligent can do. Pro unlocks unlimited searches, all frontier AI models, Deep Research mode, file upload, and unlimited conversation history. $24.99/month. 14 days free. Cancel anytime.", delay_days: 7, sent_count: 943, open_rate: 0.59, active: 1 },
    { name: "Trial — Day 12 Warning", trigger: "trial_start", subject: "Your Covelligent Pro trial ends in 2 days", body: "Your 14-day Pro trial ends in 2 days. After that, you'll drop to the free plan (10 searches/day, standard model only). If you want to keep unlimited access — no action needed, we'll charge $24.99 on your trial end date.", delay_days: 12, sent_count: 412, open_rate: 0.74, active: 1 },
    { name: "Churn Risk — Re-engage", trigger: "churn_risk", subject: "We noticed you've been away — anything we can fix?", body: "You haven't searched in 14+ days. Did something not work? Was an answer wrong or unhelpful? Did you find a better tool? We're actively building Covelligent and your experience matters.", delay_days: 0, sent_count: 287, open_rate: 0.48, active: 1 },
  ];
  for (const e of emails) {
    await run(
      `INSERT INTO email_sequences (name, trigger, subject, body, delay_days, sent_count, open_rate, active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [e.name, e.trigger, e.subject, e.body, e.delay_days, e.sent_count, e.open_rate, e.active, now()]
    );
  }

  // ── Social Posts Queue ────────────────────────────────────────────────────────
  const posts = [
    { platform: "twitter", content: "Most people search. Covelligent reasons.\n\nWe read the web, pick the best sources, and synthesize the answer — with citations. Every time.\n\nTry it free →", status: "posted", scheduled_at: null, posted_at: new Date(Date.now() - 2 * 86400000).toISOString() },
    { platform: "twitter", content: "\"I replaced my 2-hour morning reading session with 10 minutes of Covelligent.\"\n\n— James, Bloomberg analyst\n\nThat's the goal.", status: "posted", scheduled_at: null, posted_at: new Date(Date.now() - 1 * 86400000).toISOString() },
    { platform: "linkedin", content: "We just shipped Deep Research Mode in Covelligent.\n\nInstead of one search → one answer, it:\n1. Breaks your query into sub-questions\n2. Researches each independently\n3. Synthesizes a comprehensive, cited report\n\nPerfect for market research, literature reviews, competitive analysis. Pro users get access today.", status: "posted", scheduled_at: null, posted_at: new Date(Date.now() - 3 * 86400000).toISOString() },
    { platform: "twitter", content: "Hot take: most AI search tools are just ChatGPT with a search bar bolted on.\n\nCovelligent actually re-ranks sources, cross-references claims, and flags conflicting information.\n\nThe difference shows up when the answer matters.", status: "queued", scheduled_at: new Date(Date.now() + 1 * 86400000).toISOString(), posted_at: null },
    { platform: "twitter", content: "File upload is coming to Covelligent in 2 weeks.\n\nDrop in a PDF research paper and ask: \"what are the three biggest limitations the authors identified?\"\n\nEarly access for Pro users. Sign up for the waitlist →", status: "queued", scheduled_at: new Date(Date.now() + 3 * 86400000).toISOString(), posted_at: null },
    { platform: "reddit", content: "Built Covelligent after getting frustrated with AI search that gives confident wrong answers with no sources. Six months later, here's what we've learned:\n\n1. Citation quality matters more than answer fluency\n2. Conversation context is everything — most tools lose it after 2 exchanges\n3. Multi-model beats single-model for complex queries\n\nWe're 1,200+ Pro users in. Happy to answer questions about the product or the build.", status: "queued", scheduled_at: new Date(Date.now() + 5 * 86400000).toISOString(), posted_at: null },
  ];
  for (const p of posts) {
    await run(
      `INSERT INTO social_posts (platform, content, status, scheduled_at, posted_at, likes, shares, created_at) VALUES (?, ?, ?, ?, ?, 0, 0, ?)`,
      [p.platform, p.content, p.status, p.scheduled_at, p.posted_at, now()]
    );
  }

  // ── A/B Tests ─────────────────────────────────────────────────────────────────
  await run(
    `INSERT INTO ab_tests (name, status, variant_a, variant_b, metric, impressions_a, impressions_b, conversions_a, conversions_b, winner, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ["Hero CTA Copy", "running", "Get started", "Ask Covelligent free", "signup_rate", 2840, 2860, 142, 198, null, new Date(Date.now() - 7 * 86400000).toISOString()]
  );
  await run(
    `INSERT INTO ab_tests (name, status, variant_a, variant_b, metric, impressions_a, impressions_b, conversions_a, conversions_b, winner, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ["Pricing — Monthly vs Trial Framing", "running", "Start Pro — $24.99/mo", "Start 14-day free trial", "upgrade_rate", 1420, 1440, 31, 58, null, new Date(Date.now() - 10 * 86400000).toISOString()]
  );

  // ── Growth Metrics (last 14 days simulated) ────────────────────────────────
  for (let i = 13; i >= 0; i--) {
    const base = 1200 + (13 - i) * 85;
    const date = daysAgo(i);
    try {
      await run(
        `INSERT OR IGNORE INTO growth_metrics (date, dau, mau, revenue, searches, signups, pro_upgrades, churned) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          date,
          base + Math.floor(Math.random() * 120 - 60),
          8400 + (13 - i) * 220,
          (4 + Math.floor(Math.random() * 8)) * 24.99,
          base * 9 + Math.floor(Math.random() * 2000),
          28 + Math.floor(Math.random() * 30),
          4 + Math.floor(Math.random() * 8),
          Math.floor(Math.random() * 3),
        ]
      );
    } catch { /* skip if date already exists */ }
  }

  // ── System Logs ───────────────────────────────────────────────────────────────
  const logs = [
    { level: "success", source: "version_engine", message: "v1.0.0 'Harbour' deployed to production" },
    { level: "info", source: "marketing_engine", message: "Generated 6 social posts for the launch queue" },
    { level: "info", source: "analytics", message: "Growth metrics seeded for 14-day baseline" },
    { level: "success", source: "ab_tests", message: "2 A/B tests initialized and running" },
  ];
  for (const l of logs) {
    await run(
      `INSERT INTO system_logs (level, source, message, created_at) VALUES (?, ?, ?, ?)`,
      [l.level, l.source, l.message, now()]
    );
  }

  console.log("[seed] ✓ System seeded successfully");
}
