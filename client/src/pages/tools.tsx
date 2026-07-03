import { useState } from "react";
import { useLocation } from "wouter";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Code2, PenTool, Calculator, Languages,
  Microscope, BarChart2, BookOpen, Image, Mic,
  Brain, Globe2, Zap, ArrowRight, Lock, ChevronRight,
  FileSpreadsheet, FileImage, Mail, Presentation,
  GitBranch, Database, Search, MessageSquare, Shield
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const TOOLS = [
  // ── Research & Knowledge
  {
    category: "Research & Knowledge",
    color: "indigo",
    items: [
      { icon: Globe2, name: "Deep Web Research", desc: "Multi-source synthesis across 30+ live sources with full citations", plan: "pro", badge: "Pro" },
      { icon: Microscope, name: "Academic Research", desc: "Search peer-reviewed papers, journals, and scientific publications", plan: "pro", badge: "Pro" },
      { icon: BookOpen, name: "Document Analysis", desc: "Upload PDFs, papers, or reports — get instant analysis and summaries", plan: "pro", badge: "Pro" },
      { icon: Brain, name: "Fact Verification", desc: "Cross-check claims against live sources in real-time", plan: "free", badge: null },
    ],
  },
  // ── Code & Development
  {
    category: "Code & Development",
    color: "cyan",
    items: [
      { icon: Code2, name: "Code Generation", desc: "Write production-ready code in any language — Python, JS, Go, Rust, and more", plan: "free", badge: null },
      { icon: GitBranch, name: "Code Review & Debug", desc: "Paste your code and get instant review, bug fixes, and optimization suggestions", plan: "free", badge: null },
      { icon: Database, name: "SQL & Database Help", desc: "Write, explain, and optimize SQL queries for any database system", plan: "free", badge: null },
      { icon: Zap, name: "API Integration Help", desc: "Get step-by-step guidance for integrating any API or service", plan: "pro", badge: "Pro" },
    ],
  },
  // ── Writing & Content
  {
    category: "Writing & Content",
    color: "violet",
    items: [
      { icon: PenTool, name: "Long-Form Writing", desc: "Essays, reports, articles, and whitepapers written at expert level", plan: "free", badge: null },
      { icon: Mail, name: "Email & Outreach", desc: "Craft compelling emails, cold outreach, and professional communications", plan: "free", badge: null },
      { icon: Presentation, name: "Presentation Scripts", desc: "Full speaker notes, slide outlines, and executive presentations", plan: "pro", badge: "Pro" },
      { icon: MessageSquare, name: "Social Media Content", desc: "Posts, threads, captions, and campaigns for every platform", plan: "free", badge: null },
    ],
  },
  // ── Analysis & Math
  {
    category: "Analysis & Math",
    color: "rose",
    items: [
      { icon: Calculator, name: "Advanced Mathematics", desc: "Algebra, calculus, statistics, linear algebra — with step-by-step proofs", plan: "free", badge: null },
      { icon: BarChart2, name: "Data Analysis", desc: "Upload CSV or describe your data — get insights, charts, and forecasts", plan: "pro", badge: "Pro" },
      { icon: FileSpreadsheet, name: "Financial Modeling", desc: "Build financial models, analyze statements, and forecast scenarios", plan: "pro", badge: "Pro" },
      { icon: Search, name: "Competitive Analysis", desc: "Deep research on competitors, markets, and industry trends", plan: "pro", badge: "Pro" },
    ],
  },
  // ── Language & Translation
  {
    category: "Language & Translation",
    color: "amber",
    items: [
      { icon: Languages, name: "100+ Language Translation", desc: "Translate with native-level accuracy, idioms, and cultural context", plan: "free", badge: null },
      { icon: Globe2, name: "Localization", desc: "Adapt content for specific regions, cultures, and markets", plan: "pro", badge: "Pro" },
      { icon: FileText, name: "Document Translation", desc: "Upload full documents and receive complete translated versions", plan: "pro", badge: "Pro" },
    ],
  },
  // ── Creative & Media
  {
    category: "Creative",
    color: "emerald",
    items: [
      { icon: PenTool, name: "Creative Writing", desc: "Stories, screenplays, poetry, game narratives — any creative format", plan: "free", badge: null },
      { icon: Image, name: "Image Prompts", desc: "Generate optimized prompts for DALL-E, Midjourney, and Stable Diffusion", plan: "pro", badge: "Pro" },
      { icon: Mic, name: "Voice & Script", desc: "Podcast scripts, video narration, and voiceover copy", plan: "pro", badge: "Pro" },
    ],
  },
];

const colorMap: Record<string, { icon: string; bg: string; badge: string }> = {
  indigo: { icon: "text-indigo-500", bg: "bg-indigo-500/10", badge: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
  cyan:   { icon: "text-cyan-500",   bg: "bg-cyan-500/10",   badge: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20" },
  violet: { icon: "text-violet-500", bg: "bg-violet-500/10", badge: "bg-violet-500/10 text-violet-600 border-violet-500/20" },
  rose:   { icon: "text-rose-500",   bg: "bg-rose-500/10",   badge: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
  amber:  { icon: "text-amber-500",  bg: "bg-amber-500/10",  badge: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  emerald:{ icon: "text-emerald-500",bg: "bg-emerald-500/10",badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
};

export default function Tools() {
  const [, navigate] = useLocation();

  const { data: user } = useQuery<{ id: number; plan: string }>({
    queryKey: ["/api/demo-user"],
    queryFn: () => apiRequest("GET", "/api/demo-user").then(r => r.json()),
  });

  const isPro = user?.plan === "pro";

  const handleTool = (tool: { name: string; plan: string }) => {
    if (tool.plan === "pro" && !isPro) {
      navigate("/pricing");
      return;
    }
    // Route to app with pre-filled query
    navigate("/app");
  };

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Zap size={20} className="text-primary" />
              </div>
              <div>
                <h1 className="font-display font-black text-xl tracking-tight">Tools</h1>
                <p className="text-sm text-muted-foreground">Every capability in one place</p>
              </div>
            </div>

            {!isPro && (
              <div className="mt-5 p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Lock size={16} className="text-primary shrink-0" />
                  <p className="text-sm font-medium">
                    Upgrade to <span className="text-primary font-bold">Pro</span> to unlock all tools — unlimited access for $24.99/month.
                  </p>
                </div>
                <Button
                  size="sm"
                  className="shrink-0 bg-primary hover:bg-primary/90 font-bold"
                  onClick={() => navigate("/pricing")}
                  data-testid="tools-upgrade-cta"
                >
                  Upgrade <ChevronRight size={13} className="ml-0.5" />
                </Button>
              </div>
            )}
          </div>

          {/* Tool categories */}
          <div className="space-y-12">
            {TOOLS.map((cat) => {
              const colors = colorMap[cat.color] || colorMap.indigo;
              return (
                <div key={cat.category}>
                  <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.1em] mb-4">
                    {cat.category}
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {cat.items.map((tool) => {
                      const locked = tool.plan === "pro" && !isPro;
                      return (
                        <button
                          key={tool.name}
                          onClick={() => handleTool(tool)}
                          className={`flex items-start gap-4 p-4 rounded-xl border text-left transition-all group ${
                            locked
                              ? "border-border bg-card opacity-75 hover:opacity-90"
                              : "border-border bg-card hover:border-primary/30 hover:shadow-md"
                          }`}
                          data-testid={`tool-${tool.name.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <div className={`w-9 h-9 rounded-xl ${colors.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                            {locked
                              ? <Lock size={15} className="text-muted-foreground" />
                              : <tool.icon size={16} className={colors.icon} />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm">{tool.name}</span>
                              {tool.badge && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colors.badge}`}>
                                  {tool.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{tool.desc}</p>
                          </div>
                          {!locked && (
                            <ArrowRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-60 shrink-0 mt-0.5 transition-opacity" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pro upsell at bottom */}
          {!isPro && (
            <div className="mt-16 p-8 rounded-2xl border-2 border-primary/20 bg-primary/5 text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Shield size={22} className="text-primary" />
              </div>
              <h3 className="font-display font-black text-lg mb-2">Unlock everything with Pro</h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                Every tool, no limits, no rate caps. $24.99/month with a 14-day free trial.
              </p>
              <Button
                className="bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-primary/25"
                onClick={() => navigate("/pricing")}
                data-testid="tools-bottom-cta"
              >
                Start Pro free for 14 days
                <ArrowRight size={15} className="ml-2" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
