import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import { all as dbAll } from "./db";
import { streamPerplexity, queryPerplexity } from "./ai";
import { signup, login, logout, getMe, requireUser } from "./userAuth";

// Engines
import * as versionEngine from "./engines/version-engine";
import * as marketingEngine from "./engines/marketing-engine";
import * as analyticsEngine from "./engines/analytics-engine";
import { adminLogin, requireAdmin } from "./auth";
import { createCheckoutSession, createPortalSession, handleWebhook } from "./stripe";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

  // ── User Auth ────────────────────────────────────────────────────────────────
  app.post("/api/auth/signup", signup);
  app.post("/api/auth/login", login);
  app.post("/api/auth/logout", logout);
  app.get("/api/auth/me", getMe);

  // ── Core: Users ──────────────────────────────────────────────────────────────
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

    const { content, mode } = req.body;

    // Save user message
    await storage.createMessage({ conversation_id: convId, role: "user", content, sources: null });

    // Get conversation history for context
    const history = await storage.getMessages(convId) as any[];
    const conversationHistory = history.slice(-20).map((m: any) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      // Real AI response
      const aiResult = await queryPerplexity(content, mode || "web", conversationHistory);
      const assistantMsg = await storage.createMessage({
        conversation_id: convId,
        role: "assistant",
        content: aiResult.content,
        sources: JSON.stringify(aiResult.citations),
      });

      analyticsEngine.trackEvent("message_sent", { properties: { convId, mode } });
      res.status(201).json({ assistantMessage: assistantMsg });
    } catch (err: any) {
      console.error("AI error:", err.message);
      res.status(500).json({ message: "AI service error: " + err.message });
    }
  });

  // ── STREAMING Search — the main search endpoint ─────────────────────────────
  app.post("/api/search", async (req, res) => {
    const { query, userId, mode } = req.body;
    if (!query) return res.status(400).json({ message: "Query required" });

    // Track the search
    if (userId) {
      await storage.createSearch({ user_id: Number(userId), query });
    }

    // Create conversation
    const conv = await storage.createConversation({
      user_id: Number(userId) || 1,
      title: query.length > 80 ? query.slice(0, 80) + "..." : query,
    });

    // Save user message
    await storage.createMessage({ conversation_id: conv.id, role: "user", content: query, sources: null });

    try {
      const aiResult = await queryPerplexity(query, mode || "web", []);
      const assistantMsg = await storage.createMessage({
        conversation_id: conv.id,
        role: "assistant",
        content: aiResult.content,
        sources: JSON.stringify(aiResult.citations),
      });

      analyticsEngine.trackEvent("search", { userId: Number(userId), properties: { query: query.slice(0, 60), mode } });
      res.json({ conversation: conv, answer: assistantMsg, citations: aiResult.citations });
    } catch (err: any) {
      console.error("Search AI error:", err.message);
      res.status(500).json({ message: "AI service error: " + err.message });
    }
  });

  // ── STREAMING endpoint — real-time token-by-token response ─────────────────
  app.post("/api/search/stream", async (req, res) => {
    const { query, userId, mode, conversationId } = req.body;
    if (!query) return res.status(400).json({ message: "Query required" });

    // SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const sendEvent = (data: object) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      // Create or get conversation
      let convId = conversationId;
      if (!convId) {
        if (userId) await storage.createSearch({ user_id: Number(userId), query });
        const conv = await storage.createConversation({
          user_id: Number(userId) || 1,
          title: query.length > 80 ? query.slice(0, 80) + "..." : query,
        });
        convId = conv.id;
        await storage.createMessage({ conversation_id: convId, role: "user", content: query, sources: null });
        sendEvent({ type: "conversation", conversationId: convId });
      }

      // Get history for context
      const history = await storage.getMessages(convId) as any[];
      const conversationHistory = history.slice(-20).map((m: any) => ({ role: m.role, content: m.content }));

      let fullContent = "";
      let citations: string[] = [];

      // Stream tokens
      for await (const chunk of streamPerplexity(query, mode || "web", conversationHistory)) {
        if (chunk.type === "delta" && chunk.content) {
          fullContent += chunk.content;
          sendEvent({ type: "delta", content: chunk.content });
        } else if (chunk.type === "citations" && chunk.citations) {
          citations = chunk.citations;
          sendEvent({ type: "citations", citations });
        } else if (chunk.type === "done") {
          // Save complete message to DB
          const assistantMsg = await storage.createMessage({
            conversation_id: convId,
            role: "assistant",
            content: fullContent,
            sources: JSON.stringify(citations),
          });
          analyticsEngine.trackEvent("search_stream", { userId: Number(userId), properties: { mode } });
          sendEvent({ type: "done", messageId: (assistantMsg as any).id });
        }
      }
    } catch (err: any) {
      console.error("Stream error:", err.message);
      sendEvent({ type: "error", message: err.message });
    } finally {
      res.end();
    }
  });

  app.get("/api/users/:userId/searches", async (req, res) => {
    res.json(await storage.getRecentSearches(Number(req.params.userId)));
  });

  // ── Version Engine ──────────────────────────────────────────────────────────
  app.get("/api/admin/versions", async (_req, res) => res.json(await versionEngine.getAllVersions()));
  app.get("/api/admin/versions/current", async (_req, res) => res.json(await versionEngine.getCurrentVersion()));
  app.post("/api/admin/versions/:id/promote", async (req, res) => {
    await versionEngine.promoteVersion(Number(req.params.id));
    res.json({ success: true });
  });
  app.post("/api/admin/versions/auto-bump", async (_req, res) => {
    const draft = await versionEngine.autoVersionBump();
    res.json(draft ?? { message: "No new shipped items to bump" });
  });
  app.get("/api/admin/feature-flags", async (_req, res) => res.json(await versionEngine.getFeatureFlags()));
  app.patch("/api/admin/feature-flags/:key", async (req, res) => {
    const { enabled, rolloutPct } = req.body;
    if (typeof enabled === "boolean") await versionEngine.toggleFeatureFlag(req.params.key, enabled);
    if (typeof rolloutPct === "number") await versionEngine.setRolloutPct(req.params.key, rolloutPct);
    res.json({ success: true });
  });
  app.get("/api/admin/roadmap", async (_req, res) => res.json(await versionEngine.getRoadmap()));
  app.patch("/api/admin/roadmap/:id/status", async (req, res) => {
    await versionEngine.advanceRoadmapItem(Number(req.params.id), req.body.status);
    res.json({ success: true });
  });
  app.post("/api/admin/roadmap/:id/vote", async (req, res) => {
    await versionEngine.voteRoadmapItem(Number(req.params.id));
    res.json({ success: true });
  });

  // ── Marketing Engine ────────────────────────────────────────────────────────
  app.get("/api/admin/campaigns", async (_req, res) => res.json(await marketingEngine.getCampaigns()));
  app.post("/api/admin/campaigns/:id/generate-variant", async (req, res) => {
    const variant = await marketingEngine.generateAdVariant(Number(req.params.id));
    if (!variant) return res.status(404).json({ message: "Campaign not found" });
    res.json(variant);
  });
  app.post("/api/admin/campaigns/auto-pause", async (_req, res) => {
    const count = await marketingEngine.autoPauseUnderperformers();
    res.json({ paused: count });
  });
  app.get("/api/admin/social-posts", async (_req, res) => res.json(await marketingEngine.getSocialPosts()));
  app.post("/api/admin/social-posts/generate-weekly", async (_req, res) => {
    const posts = await marketingEngine.generateWeeklySocialContent();
    res.json({ generated: posts });
  });
  app.post("/api/admin/social-posts/process-scheduled", async (_req, res) => {
    const count = await marketingEngine.processScheduledPosts();
    res.json({ processed: count });
  });
  app.get("/api/admin/email-sequences", async (_req, res) => res.json(await marketingEngine.getEmailSequences()));
  app.get("/api/admin/ab-tests", async (_req, res) => res.json(await marketingEngine.getAbTests()));
  app.post("/api/admin/ab-tests/analyze", async (_req, res) => {
    const concluded = await marketingEngine.analyzeAbTests();
    res.json({ concluded });
  });

  // ── Analytics Engine ────────────────────────────────────────────────────────
  app.get("/api/admin/analytics/growth", async (req, res) => {
    const days = Number(req.query.days) || 14;
    res.json(await analyticsEngine.getGrowthMetrics(days));
  });
  app.get("/api/admin/analytics/kpis", async (_req, res) => res.json(await analyticsEngine.getGrowthKPIs()));
  app.get("/api/admin/analytics/funnel", async (_req, res) => res.json(await analyticsEngine.getFunnelMetrics()));
  app.get("/api/admin/analytics/churn-risk", async (_req, res) => res.json(await analyticsEngine.getChurnRiskUsers()));
  app.get("/api/admin/analytics/events", async (_req, res) => res.json(await analyticsEngine.getRecentEvents(100)));
  app.post("/api/admin/analytics/compute-daily", async (_req, res) => {
    await analyticsEngine.computeDailyMetrics();
    res.json({ success: true });
  });
  app.get("/api/admin/system/health", async (_req, res) => res.json(await analyticsEngine.getSystemHealth()));
  app.get("/api/admin/system/logs", async (req, res) => {
    const limit = Number(req.query.limit) || 50;
    res.json(await dbAll("SELECT * FROM system_logs ORDER BY created_at DESC LIMIT ?", [limit]));
  });

  // ── Analytics event tracking ─────────────────────────────────────────────────
  app.post("/api/track", async (req, res) => {
    const { event, page, userId, sessionId, referrer, properties } = req.body;
    if (!event) return res.status(400).json({ message: "event required" });
    await analyticsEngine.trackEvent(event, { page, userId, sessionId, referrer, properties });
    res.json({ ok: true });
  });

  // ── Health check ─────────────────────────────────────────────────────────────
  app.get("/api/health", async (_req, res) => {
    res.json({ status: "ok", version: "1.0.0", uptime: process.uptime(), ai: !!process.env.PPLX_API_KEY });
  });

  // ── Admin Auth ───────────────────────────────────────────────────────────────
  app.post("/api/admin/login", adminLogin);
  app.use("/api/admin", (req, res, next) => {
    if (req.path === "/login") return next();
    requireAdmin(req, res, next);
  });

  // ── Stripe Payments ──────────────────────────────────────────────────────────
  app.post("/api/stripe/webhook", handleWebhook);
  app.post("/api/stripe/checkout", createCheckoutSession);
  app.post("/api/stripe/portal", createPortalSession);

  app.get("/api/users/:id/subscription", async (req, res) => {
    const sub = await storage.getSubscription(Number(req.params.id));
    res.json(sub || { status: "inactive", plan: "free" });
  });

  return httpServer;
}
