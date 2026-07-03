import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertConversationSchema, insertMessageSchema, insertSearchSchema, insertUserSchema } from "@shared/schema";

// Engines
import * as versionEngine from "./engines/version-engine";
import * as marketingEngine from "./engines/marketing-engine";
import * as analyticsEngine from "./engines/analytics-engine";
import { db } from "./db";
import { adminLogin, requireAdmin } from "./auth";
import { createCheckoutSession, createPortalSession, handleWebhook } from "./stripe";
import { systemLogs } from "@shared/schema";
import { desc } from "drizzle-orm";

// ─── Mock AI response ────────────────────────────────────────────────────────
function generateAIResponse(query: string): { content: string; sources: string[] } {
  const responses = [
    {
      content: `Great question about "${query}". Based on my analysis of multiple sources, here's what I found:\n\nThe topic you're asking about is multifaceted and has several important dimensions to consider. Recent research and expert opinions suggest that this area has seen significant developments over the past few years.\n\n**Key findings:**\n- The fundamental principles remain consistent across major studies\n- New methodologies have emerged that challenge older assumptions\n- Practical applications are expanding rapidly in various sectors\n\nThe consensus among leading experts points toward a nuanced understanding that balances multiple factors. I've synthesized information from several authoritative sources to give you the most accurate picture possible.`,
      sources: ["https://www.nature.com", "https://www.scientificamerican.com", "https://www.bbc.com/news"]
    },
    {
      content: `Here's a comprehensive answer to your query about "${query}":\n\nThis is a fascinating area that I've researched thoroughly. Let me break down what you need to know:\n\n**Overview**\nThe subject has deep historical roots while also evolving rapidly in modern contexts. Understanding it requires looking at both the foundational elements and recent developments.\n\n**Current State**\nAs of the latest information available, the field is experiencing notable growth and transformation. Experts across disciplines are weighing in with diverse perspectives.\n\n**Practical Implications**\nFor most people, the most relevant aspects involve day-to-day applications and decision-making frameworks that can be immediately applied.\n\nI'll continue searching for more specific details if you'd like to dive deeper into any particular aspect.`,
      sources: ["https://www.reuters.com", "https://www.theguardian.com", "https://arxiv.org"]
    }
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

  // ── Core: Demo user ─────────────────────────────────────────────────────────
  app.get("/api/demo-user", (req, res) => {
    let user = storage.getUserByEmail("demo@covelligent.com");
    if (!user) {
      user = storage.createUser({
        name: "Alex Rivera",
        email: "demo@covelligent.com",
        plan: "pro",
        avatar: null,
      });
    }
    res.json(user);
  });

  app.get("/api/users/:id", (req, res) => {
    const user = storage.getUser(Number(req.params.id));
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  });

  app.post("/api/users", (req, res) => {
    const parsed = insertUserSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    res.status(201).json(storage.createUser(parsed.data));
  });

  app.patch("/api/users/:id/plan", (req, res) => {
    const { plan } = req.body;
    if (!["free", "pro"].includes(plan)) return res.status(400).json({ message: "Invalid plan" });
    const user = storage.updateUserPlan(Number(req.params.id), plan);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  });

  // ── Core: Conversations ─────────────────────────────────────────────────────
  app.get("/api/users/:userId/conversations", (req, res) => {
    res.json(storage.getConversations(Number(req.params.userId)));
  });

  app.post("/api/conversations", (req, res) => {
    const parsed = insertConversationSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    res.status(201).json(storage.createConversation(parsed.data));
  });

  app.get("/api/conversations/:id", (req, res) => {
    const conv = storage.getConversation(Number(req.params.id));
    if (!conv) return res.status(404).json({ message: "Not found" });
    res.json(conv);
  });

  app.delete("/api/conversations/:id", (req, res) => {
    storage.deleteConversation(Number(req.params.id));
    res.json({ success: true });
  });

  // ── Core: Messages ──────────────────────────────────────────────────────────
  app.get("/api/conversations/:id/messages", (req, res) => {
    res.json(storage.getMessages(Number(req.params.id)));
  });

  app.post("/api/conversations/:id/messages", (req, res) => {
    const convId = Number(req.params.id);
    const conv = storage.getConversation(convId);
    if (!conv) return res.status(404).json({ message: "Conversation not found" });

    storage.createMessage({
      conversationId: convId, role: "user",
      content: req.body.content, sources: null, createdAt: new Date().toISOString(),
    });

    const aiResponse = generateAIResponse(req.body.content);
    const assistantMsg = storage.createMessage({
      conversationId: convId, role: "assistant",
      content: aiResponse.content,
      sources: JSON.stringify(aiResponse.sources),
      createdAt: new Date().toISOString(),
    });

    // Track analytics
    analyticsEngine.trackEvent("message_sent", { properties: { convId } });

    res.status(201).json({ assistantMessage: assistantMsg });
  });

  // ── Core: Search ────────────────────────────────────────────────────────────
  app.post("/api/search", (req, res) => {
    const { query, userId } = req.body;
    if (!query) return res.status(400).json({ message: "Query required" });

    if (userId) {
      storage.createSearch({ userId, query, createdAt: new Date().toISOString() });
    }

    const conv = storage.createConversation({
      userId: userId || 1,
      title: query.length > 60 ? query.slice(0, 60) + "..." : query,
      createdAt: new Date().toISOString(),
    });

    storage.createMessage({ conversationId: conv.id, role: "user", content: query, sources: null, createdAt: new Date().toISOString() });
    const aiResponse = generateAIResponse(query);
    const assistantMsg = storage.createMessage({
      conversationId: conv.id, role: "assistant",
      content: aiResponse.content,
      sources: JSON.stringify(aiResponse.sources),
      createdAt: new Date().toISOString(),
    });

    analyticsEngine.trackEvent("search", { userId, properties: { query: query.slice(0, 60) } });
    res.json({ conversation: conv, answer: assistantMsg });
  });

  app.get("/api/users/:userId/searches", (req, res) => {
    res.json(storage.getRecentSearches(Number(req.params.userId)));
  });

  // ── Version Engine ──────────────────────────────────────────────────────────
  app.get("/api/admin/versions", (_req, res) => {
    res.json(versionEngine.getAllVersions());
  });

  app.get("/api/admin/versions/current", (_req, res) => {
    res.json(versionEngine.getCurrentVersion());
  });

  app.post("/api/admin/versions/:id/promote", (req, res) => {
    versionEngine.promoteVersion(Number(req.params.id));
    res.json({ success: true });
  });

  app.post("/api/admin/versions/auto-bump", (_req, res) => {
    const draft = versionEngine.autoVersionBump();
    res.json(draft ?? { message: "No new shipped items to bump" });
  });

  app.get("/api/admin/feature-flags", (_req, res) => {
    res.json(versionEngine.getFeatureFlags());
  });

  app.patch("/api/admin/feature-flags/:key", (req, res) => {
    const { enabled, rolloutPct } = req.body;
    if (typeof enabled === "boolean") versionEngine.toggleFeatureFlag(req.params.key, enabled);
    if (typeof rolloutPct === "number") versionEngine.setRolloutPct(req.params.key, rolloutPct);
    res.json({ success: true });
  });

  app.get("/api/admin/roadmap", (_req, res) => {
    res.json(versionEngine.getRoadmap());
  });

  app.patch("/api/admin/roadmap/:id/status", (req, res) => {
    versionEngine.advanceRoadmapItem(Number(req.params.id), req.body.status);
    res.json({ success: true });
  });

  app.post("/api/admin/roadmap/:id/vote", (req, res) => {
    versionEngine.voteRoadmapItem(Number(req.params.id));
    res.json({ success: true });
  });

  // ── Marketing Engine ────────────────────────────────────────────────────────
  app.get("/api/admin/campaigns", (_req, res) => {
    res.json(marketingEngine.getCampaigns());
  });

  app.post("/api/admin/campaigns/:id/generate-variant", (req, res) => {
    const variant = marketingEngine.generateAdVariant(Number(req.params.id));
    if (!variant) return res.status(404).json({ message: "Campaign not found" });
    res.json(variant);
  });

  app.post("/api/admin/campaigns/auto-pause", (_req, res) => {
    const count = marketingEngine.autoPauseUnderperformers();
    res.json({ paused: count });
  });

  app.get("/api/admin/social-posts", (_req, res) => {
    res.json(marketingEngine.getSocialPosts());
  });

  app.post("/api/admin/social-posts/generate-weekly", (_req, res) => {
    const posts = marketingEngine.generateWeeklySocialContent();
    res.json({ generated: posts });
  });

  app.post("/api/admin/social-posts/process-scheduled", (_req, res) => {
    const count = marketingEngine.processScheduledPosts();
    res.json({ processed: count });
  });

  app.get("/api/admin/email-sequences", (_req, res) => {
    res.json(marketingEngine.getEmailSequences());
  });

  app.get("/api/admin/ab-tests", (_req, res) => {
    res.json(marketingEngine.getAbTests());
  });

  app.post("/api/admin/ab-tests/analyze", (_req, res) => {
    const concluded = marketingEngine.analyzeAbTests();
    res.json({ concluded });
  });

  // ── Analytics Engine ────────────────────────────────────────────────────────
  app.get("/api/admin/analytics/growth", (req, res) => {
    const days = Number(req.query.days) || 14;
    res.json(analyticsEngine.getGrowthMetrics(days));
  });

  app.get("/api/admin/analytics/kpis", (_req, res) => {
    res.json(analyticsEngine.getGrowthKPIs());
  });

  app.get("/api/admin/analytics/funnel", (_req, res) => {
    res.json(analyticsEngine.getFunnelMetrics());
  });

  app.get("/api/admin/analytics/churn-risk", (_req, res) => {
    res.json(analyticsEngine.getChurnRiskUsers());
  });

  app.get("/api/admin/analytics/events", (_req, res) => {
    res.json(analyticsEngine.getRecentEvents(100));
  });

  app.post("/api/admin/analytics/compute-daily", (_req, res) => {
    analyticsEngine.computeDailyMetrics();
    res.json({ success: true });
  });

  app.get("/api/admin/system/health", (_req, res) => {
    res.json(analyticsEngine.getSystemHealth());
  });

  app.get("/api/admin/system/logs", (req, res) => {
    const limit = Number(req.query.limit) || 50;
    const logs = db.select().from(systemLogs)
      .orderBy(desc(systemLogs.createdAt))
      .limit(limit)
      .all();
    res.json(logs);
  });

  // ── Analytics event tracking (client-side) ──────────────────────────────────
  app.post("/api/track", (req, res) => {
    const { event, page, userId, sessionId, referrer, properties } = req.body;
    if (!event) return res.status(400).json({ message: "event required" });
    analyticsEngine.trackEvent(event, { page, userId, sessionId, referrer, properties });
    res.json({ ok: true });
  });


  // ── Health check ────────────────────────────────────────────────────────────
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", version: "1.0.0", uptime: process.uptime() });
  });

  // ── Admin Auth ───────────────────────────────────────────────────────────────
  app.post("/api/admin/login", adminLogin);

  // Protect all other /api/admin/* routes
  app.use("/api/admin", (req, res, next) => {
    // login is already handled above, skip for it
    if (req.path === "/login") return next();
    requireAdmin(req, res, next);
  });

  // ── Stripe Payments ──────────────────────────────────────────────────────────
  // Webhook must use raw body — register before json middleware applies
  app.post("/api/stripe/webhook", handleWebhook);
  app.post("/api/stripe/checkout", createCheckoutSession);
  app.post("/api/stripe/portal", createPortalSession);

  app.get("/api/users/:id/subscription", (req, res) => {
    const sub = storage.getSubscription(Number(req.params.id));
    res.json(sub || { status: "inactive", plan: "free" });
  });

  return httpServer;
}
