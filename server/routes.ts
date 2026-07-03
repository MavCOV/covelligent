import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import { all as dbAll } from "./db";

// Engines
import * as versionEngine from "./engines/version-engine";
import * as marketingEngine from "./engines/marketing-engine";
import * as analyticsEngine from "./engines/analytics-engine";
import { adminLogin, requireAdmin } from "./auth";
import { createCheckoutSession, createPortalSession, handleWebhook } from "./stripe";

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
  app.get("/api/demo-user", async (req, res) => {
    let user = await storage.getUserByEmail("demo@covelligent.com");
    if (!user) {
      user = await storage.createUser({
        name: "Alex Rivera",
        email: "demo@covelligent.com",
        plan: "pro",
        avatar: null,
      });
    }
    res.json(user);
  });

  app.get("/api/users/:id", async (req, res) => {
    const user = await storage.getUser(Number(req.params.id));
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  });

  app.post("/api/users", async (req, res) => {
    const parsed = insertUserSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    res.status(201).json(await storage.createUser(parsed.data));
  });

  app.patch("/api/users/:id/plan", async (req, res) => {
    const { plan } = req.body;
    if (!["free", "pro"].includes(plan)) return res.status(400).json({ message: "Invalid plan" });
    const user = await storage.updateUserPlan(Number(req.params.id), plan);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  });

  // ── Core: Conversations ─────────────────────────────────────────────────────
  app.get("/api/users/:userId/conversations", async (req, res) => {
    res.json(await storage.getConversations(Number(req.params.userId)));
  });

  app.post("/api/conversations", async (req, res) => {
    const { userId, title } = req.body;
    if (!userId || !title) return res.status(400).json({ message: "userId and title required" });
    res.status(201).json(await storage.createConversation({ user_id: Number(userId), title }));
  });

  app.get("/api/conversations/:id", async (req, res) => {
    const conv = await storage.getConversation(Number(req.params.id));
    if (!conv) return res.status(404).json({ message: "Not found" });
    res.json(conv);
  });

  app.delete("/api/conversations/:id", async (req, res) => {
    await storage.deleteConversation(Number(req.params.id));
    res.json({ success: true });
  });

  // ── Core: Messages ──────────────────────────────────────────────────────────
  app.get("/api/conversations/:id/messages", async (req, res) => {
    res.json(await storage.getMessages(Number(req.params.id)));
  });

  app.post("/api/conversations/:id/messages", async (req, res) => {
    const convId = Number(req.params.id);
    const conv = await storage.getConversation(convId);
    if (!conv) return res.status(404).json({ message: "Conversation not found" });

    await storage.createMessage({
      conversation_id: convId, role: "user",
      content: req.body.content, sources: null,
    });

    const aiResponse = generateAIResponse(req.body.content);
    const assistantMsg = await storage.createMessage({
      conversation_id: convId, role: "assistant",
      content: aiResponse.content,
      sources: JSON.stringify(aiResponse.sources),
    });

    // Track analytics
    analyticsEngine.trackEvent("message_sent", { properties: { convId } });

    res.status(201).json({ assistantMessage: assistantMsg });
  });

  // ── Core: Search ────────────────────────────────────────────────────────────
  app.post("/api/search", async (req, res) => {
    const { query, userId } = req.body;
    if (!query) return res.status(400).json({ message: "Query required" });

    if (userId) {
      await storage.createSearch({ user_id: Number(userId), query });
    }

    const conv = await storage.createConversation({
      user_id: Number(userId) || 1,
      title: query.length > 60 ? query.slice(0, 60) + "..." : query,
    });

    await storage.createMessage({ conversation_id: conv.id, role: "user", content: query, sources: null });
    const aiResponse = generateAIResponse(query);
    const assistantMsg = await storage.createMessage({
      conversation_id: conv.id, role: "assistant",
      content: aiResponse.content,
      sources: JSON.stringify(aiResponse.sources),
    });

    analyticsEngine.trackEvent("search", { userId, properties: { query: query.slice(0, 60) } });
    res.json({ conversation: conv, answer: assistantMsg });
  });

  app.get("/api/users/:userId/searches", async (req, res) => {
    res.json(await storage.getRecentSearches(Number(req.params.userId)));
  });

  // ── Version Engine ──────────────────────────────────────────────────────────
  app.get("/api/admin/versions", async (_req, res) => {
    res.json(versionEngine.getAllVersions());
  });

  app.get("/api/admin/versions/current", async (_req, res) => {
    res.json(versionEngine.getCurrentVersion());
  });

  app.post("/api/admin/versions/:id/promote", async (req, res) => {
    versionEngine.promoteVersion(Number(req.params.id));
    res.json({ success: true });
  });

  app.post("/api/admin/versions/auto-bump", (_req, res) => {
    const draft = versionEngine.autoVersionBump();
    res.json(draft ?? { message: "No new shipped items to bump" });
  });

  app.get("/api/admin/feature-flags", async (_req, res) => {
    res.json(versionEngine.getFeatureFlags());
  });

  app.patch("/api/admin/feature-flags/:key", async (req, res) => {
    const { enabled, rolloutPct } = req.body;
    if (typeof enabled === "boolean") versionEngine.toggleFeatureFlag(req.params.key, enabled);
    if (typeof rolloutPct === "number") versionEngine.setRolloutPct(req.params.key, rolloutPct);
    res.json({ success: true });
  });

  app.get("/api/admin/roadmap", async (_req, res) => {
    res.json(versionEngine.getRoadmap());
  });

  app.patch("/api/admin/roadmap/:id/status", async (req, res) => {
    versionEngine.advanceRoadmapItem(Number(req.params.id), req.body.status);
    res.json({ success: true });
  });

  app.post("/api/admin/roadmap/:id/vote", async (req, res) => {
    versionEngine.voteRoadmapItem(Number(req.params.id));
    res.json({ success: true });
  });

  // ── Marketing Engine ────────────────────────────────────────────────────────
  app.get("/api/admin/campaigns", async (_req, res) => {
    res.json(marketingEngine.getCampaigns());
  });

  app.post("/api/admin/campaigns/:id/generate-variant", async (req, res) => {
    const variant = marketingEngine.generateAdVariant(Number(req.params.id));
    if (!variant) return res.status(404).json({ message: "Campaign not found" });
    res.json(variant);
  });

  app.post("/api/admin/campaigns/auto-pause", (_req, res) => {
    const count = marketingEngine.autoPauseUnderperformers();
    res.json({ paused: count });
  });

  app.get("/api/admin/social-posts", async (_req, res) => {
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

  app.get("/api/admin/email-sequences", async (_req, res) => {
    res.json(marketingEngine.getEmailSequences());
  });

  app.get("/api/admin/ab-tests", async (_req, res) => {
    res.json(marketingEngine.getAbTests());
  });

  app.post("/api/admin/ab-tests/analyze", (_req, res) => {
    const concluded = marketingEngine.analyzeAbTests();
    res.json({ concluded });
  });

  // ── Analytics Engine ────────────────────────────────────────────────────────
  app.get("/api/admin/analytics/growth", async (req, res) => {
    const days = Number(req.query.days) || 14;
    res.json(analyticsEngine.getGrowthMetrics(days));
  });

  app.get("/api/admin/analytics/kpis", async (_req, res) => {
    res.json(analyticsEngine.getGrowthKPIs());
  });

  app.get("/api/admin/analytics/funnel", async (_req, res) => {
    res.json(analyticsEngine.getFunnelMetrics());
  });

  app.get("/api/admin/analytics/churn-risk", async (_req, res) => {
    res.json(analyticsEngine.getChurnRiskUsers());
  });

  app.get("/api/admin/analytics/events", async (_req, res) => {
    res.json(analyticsEngine.getRecentEvents(100));
  });

  app.post("/api/admin/analytics/compute-daily", (_req, res) => {
    analyticsEngine.computeDailyMetrics();
    res.json({ success: true });
  });

  app.get("/api/admin/system/health", async (_req, res) => {
    res.json(analyticsEngine.getSystemHealth());
  });

  app.get("/api/admin/system/logs", async (req, res) => {
    const limit = Number(req.query.limit) || 50;
    const logs = await dbAll(
      "SELECT * FROM system_logs ORDER BY created_at DESC LIMIT ?",
      [limit]
    );
    res.json(logs);
  });

  // ── Analytics event tracking (client-side) ──────────────────────────────────
  app.post("/api/track", async (req, res) => {
    const { event, page, userId, sessionId, referrer, properties } = req.body;
    if (!event) return res.status(400).json({ message: "event required" });
    analyticsEngine.trackEvent(event, { page, userId, sessionId, referrer, properties });
    res.json({ ok: true });
  });


  // ── Health check ────────────────────────────────────────────────────────────
  app.get("/api/health", async (_req, res) => {
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

  app.get("/api/users/:id/subscription", async (req, res) => {
    const sub = await storage.getSubscription(Number(req.params.id));
    res.json(sub || { status: "inactive", plan: "free" });
  });

  return httpServer;
}
