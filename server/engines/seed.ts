/**
 * Covelligent Seed Engine
 * Seeds all system tables with realistic bootstrap data on first run.
 */
import { db } from "../db";
import {
  versions, featureFlags, roadmapItems,
  adCampaigns, emailSequences, socialPosts,
  abTests, growthMetrics, systemLogs
} from "@shared/schema";
import { sql } from "drizzle-orm";

const now = () => new Date().toISOString();
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

export async function seedSystem() {
  // Only seed if tables are empty
  const existing = await db.select().from(versions).all();
  if (existing.length > 0) return;

  console.log("[seed] Seeding Covelligent system tables...");

  // ── Versions ────────────────────────────────────────────────────────────────
  await db.insert(versions).values([
    {
      version: "1.0.0",
      codename: "Harbour",
      releaseNotes: "Initial launch of Covelligent. Real-time web search, multi-model AI, cited answers, conversation threads, and Pro subscription at $24.99/mo.",
      changes: JSON.stringify([
        { type: "feature", text: "Real-time web search with source citations" },
        { type: "feature", text: "Multi-model AI orchestration (GPT-5, Claude 4, Gemini Ultra)" },
        { type: "feature", text: "Conversational threads with unlimited follow-ups" },
        { type: "feature", text: "Pro subscription — $24.99/month, 14-day free trial" },
        { type: "feature", text: "Dark mode + light mode with system preference detection" },
        { type: "feature", text: "Research Collections for saving and organizing answers" },
      ]),
      status: "live",
      deployedAt: now(),
      createdAt: now(),
    },
  ]).run();

  // ── Feature Flags ───────────────────────────────────────────────────────────
  await db.insert(featureFlags).values([
    { key: "deep_research_mode", label: "Deep Research Mode", description: "Multi-step agent that breaks complex queries into sub-queries", enabled: 1, rolloutPct: 100, updatedAt: now() },
    { key: "file_upload", label: "File Upload & Analysis", description: "Allow users to upload PDFs, CSVs, and images for analysis", enabled: 0, rolloutPct: 0, updatedAt: now() },
    { key: "voice_input", label: "Voice Input", description: "Speech-to-text search input via microphone", enabled: 0, rolloutPct: 0, updatedAt: now() },
    { key: "shared_threads", label: "Shareable Threads", description: "Public share links for conversations", enabled: 1, rolloutPct: 100, updatedAt: now() },
    { key: "api_access", label: "API Access (Pro)", description: "REST API with 100k token/mo limit for Pro users", enabled: 1, rolloutPct: 100, updatedAt: now() },
    { key: "team_workspaces", label: "Team Workspaces", description: "Shared research spaces for teams — coming Q4 2026", enabled: 0, rolloutPct: 0, updatedAt: now() },
    { key: "browser_extension", label: "Browser Extension", description: "Chrome/Firefox extension for highlight-to-search", enabled: 0, rolloutPct: 0, updatedAt: now() },
    { key: "mobile_app", label: "Mobile App (iOS/Android)", description: "Native mobile apps", enabled: 0, rolloutPct: 0, updatedAt: now() },
  ]).run();

  // ── Roadmap ──────────────────────────────────────────────────────────────────
  await db.insert(roadmapItems).values([
    { title: "File Upload & Analysis", description: "Upload PDFs, spreadsheets, and images — Covelligent analyzes and answers questions about your documents.", category: "feature", status: "in_progress", priority: 1, votes: 847, quarter: "Q3 2026", createdAt: now() },
    { title: "Voice Input", description: "Speak your query — Covelligent transcribes and searches instantly.", category: "feature", status: "planned", priority: 1, votes: 612, quarter: "Q3 2026", createdAt: now() },
    { title: "Team Workspaces", description: "Collaborate with your team — shared collections, annotation, and real-time co-research.", category: "feature", status: "planned", priority: 1, votes: 1204, quarter: "Q4 2026", createdAt: now() },
    { title: "Browser Extension", description: "Highlight any text on any webpage to instantly ask Covelligent about it.", category: "feature", status: "planned", priority: 2, votes: 538, quarter: "Q3 2026", createdAt: now() },
    { title: "Mobile App (iOS + Android)", description: "Full-featured native mobile experience.", category: "feature", status: "planned", priority: 1, votes: 2104, quarter: "Q4 2026", createdAt: now() },
    { title: "Answer Export (PDF/Markdown/Notion)", description: "Export any conversation or research collection in multiple formats.", category: "improvement", status: "in_progress", priority: 2, votes: 391, quarter: "Q3 2026", createdAt: now() },
    { title: "Citation Quality Improvements", description: "Smarter source ranking, deduplication, and credibility scoring.", category: "improvement", status: "in_progress", priority: 1, votes: 276, quarter: "Q3 2026", createdAt: now() },
    { title: "Personalized Trending Feed", description: "Trending topics curated to your search history and interests.", category: "feature", status: "planned", priority: 2, votes: 183, quarter: "Q4 2026", createdAt: now() },
    { title: "Perplexity/ChatGPT Import", description: "One-click import of your conversation history from other AI tools.", category: "feature", status: "planned", priority: 3, votes: 94, quarter: "Q4 2026", createdAt: now() },
    { title: "Real-time Collaboration", description: "Multiple users in the same research thread simultaneously.", category: "feature", status: "planned", priority: 2, votes: 445, quarter: "Q1 2027", createdAt: now() },
  ]).run();

  // ── Ad Campaigns ─────────────────────────────────────────────────────────────
  await db.insert(adCampaigns).values([
    {
      name: "Launch — Twitter A",
      channel: "twitter",
      headline: "The search engine that actually thinks.",
      body: "Covelligent reads the web, synthesizes the best answer, and cites every source. Ask anything — get clarity, not links. Try free →",
      cta: "Try Covelligent free",
      targetAudience: "researchers, students, knowledge workers",
      status: "active",
      impressions: 14820,
      clicks: 892,
      conversions: 67,
      variantGroup: "launch-v1-A",
      createdAt: now(),
    },
    {
      name: "Launch — Twitter B",
      channel: "twitter",
      headline: "Stop reading 10 articles. Ask Covelligent once.",
      body: "Real-time web search + AI synthesis + cited sources. Covelligent gives you the answer, not the rabbit hole. Free plan available.",
      cta: "Start for free",
      targetAudience: "professionals, journalists",
      status: "active",
      impressions: 13560,
      clicks: 1034,
      conversions: 89,
      variantGroup: "launch-v1-B",
      createdAt: now(),
    },
    {
      name: "Pro Upgrade — Reddit",
      channel: "reddit",
      headline: "I switched from Perplexity to Covelligent — here's why",
      body: "After 3 months of daily use: the citation quality is better, the conversation UX is cleaner, and the multi-model approach catches things single-model tools miss. Pro is $24.99/mo with a 14-day trial.",
      cta: "Try Pro free for 14 days",
      targetAudience: "r/artificial, r/MachineLearning, r/productivity",
      status: "active",
      impressions: 8240,
      clicks: 641,
      conversions: 48,
      variantGroup: "reddit-organic",
      createdAt: now(),
    },
    {
      name: "Feature Drop — File Upload",
      channel: "twitter",
      headline: "New: Upload your documents to Covelligent",
      body: "PDF? Spreadsheet? Research paper? Drop it in Covelligent and ask anything. Pro users get early access this week.",
      cta: "Get early access",
      targetAudience: "existing users, researchers",
      status: "paused",
      impressions: 0,
      clicks: 0,
      conversions: 0,
      variantGroup: "feature-file-upload",
      createdAt: now(),
      scheduledFor: new Date(Date.now() + 14 * 86400000).toISOString(),
    },
    {
      name: "Email Re-engagement",
      channel: "email",
      headline: "You haven't searched in a while",
      body: "We've shipped 12 improvements since you last used Covelligent. Citation quality is up 40%, answers are 2x faster, and we've added Deep Research mode. Come back and try it.",
      cta: "Return to Covelligent",
      targetAudience: "churned / inactive users",
      status: "active",
      impressions: 3200,
      clicks: 284,
      conversions: 31,
      variantGroup: "reengagement-v1",
      createdAt: now(),
    },
  ]).run();

  // ── Email Sequences ──────────────────────────────────────────────────────────
  await db.insert(emailSequences).values([
    // Onboarding sequence
    {
      name: "Onboarding — Day 0",
      triggerEvent: "signup",
      stepNumber: 1,
      delayDays: 0,
      subject: "Welcome to Covelligent — here's where to start",
      preheader: "Your first search is one click away.",
      body: `Hi {{name}},\n\nYou just joined the smartest search engine on the web.\n\nCovelligent isn't a chatbot — it searches the real-time web, synthesizes the best answer, and shows you exactly where it came from. Every answer. Every time.\n\n**Your first search:** Try asking something you've been meaning to research. Hit Enter. Watch what happens.\n\nIf you have any questions, just reply to this email — we read every one.\n\nWelcome aboard,\nThe Covelligent Team`,
      ctaText: "Make your first search",
      ctaUrl: "https://cove.ai/app",
      active: 1,
      sentCount: 1247,
      openRate: 0.68,
      clickRate: 0.41,
      createdAt: now(),
    },
    {
      name: "Onboarding — Day 3",
      triggerEvent: "signup",
      stepNumber: 2,
      delayDays: 3,
      subject: "3 Covelligent features most people miss",
      preheader: "You're already using the basics. Here's what's underneath.",
      body: `Hi {{name}},\n\nYou've been with Covelligent for a few days — here are three features that make the biggest difference:\n\n**1. Follow-up questions**\nEvery answer is the start of a conversation. Ask "tell me more about the second point" or "now explain it simply." Covelligent holds full context.\n\n**2. Source filtering**\nClick any source pill under an answer to read the original. You can also tell Covelligent to "use only peer-reviewed sources" or "avoid Wikipedia."\n\n**3. Search modes**\nSwitch between Web, Academic, News, and Code mode for dramatically different results on the same query.\n\nGo try one now →`,
      ctaText: "Open Covelligent",
      ctaUrl: "https://cove.ai/app",
      active: 1,
      sentCount: 1089,
      openRate: 0.52,
      clickRate: 0.28,
      createdAt: now(),
    },
    {
      name: "Onboarding — Day 7 (Trial Pitch)",
      triggerEvent: "signup",
      stepNumber: 3,
      delayDays: 7,
      subject: "Unlock unlimited searches — 14 days free",
      preheader: "No credit card needed.",
      body: `Hi {{name}},\n\nA week in — you've seen what Covelligent can do. Here's what Pro unlocks:\n\n✓ Unlimited searches (free = 10/day)\n✓ All frontier AI models — GPT-5, Claude 4, Gemini Ultra\n✓ Deep Research mode — multi-step agent reasoning\n✓ File upload & analysis\n✓ Unlimited conversation history\n✓ Priority queue — no wait times\n\n**$24.99/month. 14 days free. Cancel anytime.**\n\nIf you've found Covelligent useful this week, Pro is a no-brainer. If you haven't — tell me why, and I'll fix it personally.\n\n— Alex, Covelligent founder`,
      ctaText: "Start 14-day Pro trial",
      ctaUrl: "https://cove.ai/pricing",
      active: 1,
      sentCount: 943,
      openRate: 0.59,
      clickRate: 0.34,
      createdAt: now(),
    },
    // Trial-to-paid sequence
    {
      name: "Trial — Day 12 Warning",
      triggerEvent: "trial_start",
      stepNumber: 1,
      delayDays: 12,
      subject: "Your Covelligent Pro trial ends in 2 days",
      preheader: "Keep unlimited access — here's what happens next.",
      body: `Hi {{name}},\n\nYour 14-day Pro trial ends in 2 days.\n\nAfter that, you'll drop to the free plan (10 searches/day, standard model only).\n\nIf you want to keep unlimited searches, all AI models, and Deep Research mode — no action needed. We'll charge $24.99 on {{trial_end_date}} and you're set.\n\nNot sure? You can cancel any time from Settings > Subscription before your trial ends.\n\nQuestions? Just reply.`,
      ctaText: "Manage subscription",
      ctaUrl: "https://cove.ai/app/settings",
      active: 1,
      sentCount: 412,
      openRate: 0.74,
      clickRate: 0.21,
      createdAt: now(),
    },
    // Churn-risk sequence
    {
      name: "Churn Risk — Re-engage",
      triggerEvent: "churn_risk",
      stepNumber: 1,
      delayDays: 0,
      subject: "We noticed you've been away — anything we can fix?",
      preheader: "Honest question.",
      body: `Hi {{name}},\n\nYou haven't searched in 14+ days. That's unusual, and I want to understand why.\n\nDid something not work? Was an answer wrong or unhelpful? Did you find a better tool?\n\nI'm not asking to sell you anything — I'm asking because we're actively building Covelligent and your experience matters.\n\nJust reply to this email with what's on your mind. I read every response.\n\n— Alex\nCovelligent Founder`,
      ctaText: "Try Covelligent again",
      ctaUrl: "https://cove.ai/app",
      active: 1,
      sentCount: 287,
      openRate: 0.48,
      clickRate: 0.19,
      createdAt: now(),
    },
  ]).run();

  // ── Social Posts Queue ────────────────────────────────────────────────────────
  const posts = [
    { platform: "twitter", content: "Most people search. Covelligent reasons.\n\nWe read the web, pick the best sources, and synthesize the answer — with citations. Every time.\n\nTry it free →", hashtags: JSON.stringify(["#AI", "#Search", "#Covelligent"]), status: "posted", postedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
    { platform: "twitter", content: "\"I replaced my 2-hour morning reading session with 10 minutes of Covelligent.\"\n\n— James, Bloomberg analyst\n\nThat's the goal.", hashtags: JSON.stringify(["#productivity", "#AI"]), status: "posted", postedAt: new Date(Date.now() - 1 * 86400000).toISOString() },
    { platform: "linkedin", content: "We just shipped Deep Research Mode in Covelligent.\n\nInstead of one search → one answer, it:\n1. Breaks your query into sub-questions\n2. Researches each independently\n3. Synthesizes a comprehensive, cited report\n\nPerfect for market research, literature reviews, competitive analysis. Pro users get access today.", hashtags: JSON.stringify(["#AI", "#Research", "#Productivity", "#Covelligent"]), status: "posted", postedAt: new Date(Date.now() - 3 * 86400000).toISOString() },
    { platform: "twitter", content: "Hot take: most AI search tools are just ChatGPT with a search bar bolted on.\n\nCovelligent actually re-ranks sources, cross-references claims, and flags conflicting information.\n\nThe difference shows up when the answer matters.", hashtags: JSON.stringify(["#AI", "#Search"]), status: "queued", scheduledFor: new Date(Date.now() + 1 * 86400000).toISOString() },
    { platform: "twitter", content: "File upload is coming to Covelligent in 2 weeks.\n\nDrop in a PDF research paper and ask: \"what are the three biggest limitations the authors identified?\"\n\nEarly access for Pro users. Sign up for the waitlist →", hashtags: JSON.stringify(["#AI", "#Covelligent", "#ProductUpdate"]), status: "queued", scheduledFor: new Date(Date.now() + 3 * 86400000).toISOString() },
    { platform: "reddit", content: "Built Covelligent after getting frustrated with AI search that gives confident wrong answers with no sources. Six months later, here's what we've learned:\n\n1. Citation quality matters more than answer fluency\n2. Conversation context is everything — most tools lose it after 2 exchanges\n3. Multi-model beats single-model for complex queries\n\nWe're 1,200+ Pro users in. Happy to answer questions about the product or the build.", hashtags: JSON.stringify([]), status: "queued", scheduledFor: new Date(Date.now() + 5 * 86400000).toISOString() },
  ];

  for (const post of posts) {
    await db.insert(socialPosts).values({
      ...post,
      generatedBy: "system",
      createdAt: now(),
    }).run();
  }

  // ── A/B Tests ─────────────────────────────────────────────────────────────────
  await db.insert(abTests).values([
    {
      name: "Hero CTA Copy",
      description: "Test two hero CTA button labels against each other",
      hypothesis: "More specific CTA ('Ask Covelligent') outperforms generic ('Get started')",
      metric: "signup_rate",
      variants: JSON.stringify([
        { id: "A", label: "Get started", weight: 0.5 },
        { id: "B", label: "Ask Covelligent free", weight: 0.5 },
      ]),
      results: JSON.stringify([
        { variantId: "A", conversions: 142, impressions: 2840 },
        { variantId: "B", conversions: 198, impressions: 2860 },
      ]),
      status: "running",
      startedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
    {
      name: "Pricing — Monthly vs Trial Framing",
      description: "Does '$24.99/mo' or '14-day free trial' convert better?",
      hypothesis: "Trial framing reduces friction and improves Pro trial starts",
      metric: "upgrade_rate",
      variants: JSON.stringify([
        { id: "A", label: "Start Pro — $24.99/mo", weight: 0.5 },
        { id: "B", label: "Start 14-day free trial", weight: 0.5 },
      ]),
      results: JSON.stringify([
        { variantId: "A", conversions: 31, impressions: 1420 },
        { variantId: "B", conversions: 58, impressions: 1440 },
      ]),
      status: "running",
      startedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
  ]).run();

  // ── Growth Metrics (last 14 days simulated) ────────────────────────────────
  for (let i = 13; i >= 0; i--) {
    const base = 1200 + (13 - i) * 85;
    const date = daysAgo(i);
    try {
      await db.insert(growthMetrics).values({
        date,
        dau: base + Math.floor(Math.random() * 120 - 60),
        mau: 8400 + (13 - i) * 220,
        newSignups: 28 + Math.floor(Math.random() * 30),
        proUpgrades: 4 + Math.floor(Math.random() * 8),
        churned: Math.floor(Math.random() * 3),
        totalSearches: base * 9 + Math.floor(Math.random() * 2000),
        avgSessionMin: 7.2 + Math.random() * 3,
        revenue: (4 + Math.floor(Math.random() * 8)) * 24.99,
        createdAt: now(),
      }).run();
    } catch { /* skip if date already exists */ }
  }

  // ── System Logs ───────────────────────────────────────────────────────────────
  await db.insert(systemLogs).values([
    { level: "success", source: "version_engine", message: "v1.0.0 'Harbour' deployed to production", createdAt: now() },
    { level: "info", source: "marketing_engine", message: "Generated 6 social posts for the launch queue", createdAt: now() },
    { level: "info", source: "analytics", message: "Growth metrics seeded for 14-day baseline", createdAt: now() },
    { level: "info", source: "cron", message: "Daily digest cron registered — runs at 07:00 UTC", createdAt: now() },
    { level: "success", source: "ab_tests", message: "2 A/B tests initialized and running", createdAt: now() },
  ]).run();

  console.log("[seed] ✓ System seeded successfully");
}
