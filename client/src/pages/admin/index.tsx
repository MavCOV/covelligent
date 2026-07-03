import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useTheme } from "@/components/ThemeProvider";
import { LogoWordmark } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import {
  BarChart2, Zap, Megaphone, GitBranch, FlaskConical as Flask, Activity,
  Sun, Moon, ArrowLeft, TrendingUp, TrendingDown, Users,
  Search, DollarSign, RefreshCw, AlertCircle, CheckCircle,
  Play, Pause, ChevronRight, Layers, Bell, Settings,
  Globe, Mail, Twitter, Star, Eye, MousePointer, UserCheck
} from "lucide-react";

// ─── Subpages ────────────────────────────────────────────────────────────────
type AdminPage = "overview" | "growth" | "campaigns" | "social" | "emails" | "abtests" | "versions" | "flags" | "roadmap" | "logs";

// ─── Shared helpers ───────────────────────────────────────────────────────────
function KPICard({ label, value, change, icon: Icon, color = "text-primary", prefix = "", suffix = "" }: {
  label: string; value: string | number; change?: number;
  icon: React.ElementType; color?: string; prefix?: string; suffix?: string;
}) {
  const isUp = (change ?? 0) >= 0;
  return (
    <div className="p-5 rounded-2xl border border-border bg-card" data-testid={`kpi-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className={`w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center`}>
          <Icon size={15} className={color} />
        </div>
      </div>
      <div className="font-display text-2xl font-bold mb-1">{prefix}{typeof value === "number" ? value.toLocaleString() : value}{suffix}</div>
      {change !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-medium ${isUp ? "text-emerald-500" : "text-rose-500"}`}>
          {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {isUp ? "+" : ""}{change.toFixed(1)}% vs yesterday
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    live: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20",
    active: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20",
    running: "bg-blue-500/15 text-blue-600 border-blue-500/20",
    draft: "bg-amber-500/15 text-amber-600 border-amber-500/20",
    staging: "bg-violet-500/15 text-violet-600 border-violet-500/20",
    paused: "bg-orange-500/15 text-orange-600 border-orange-500/20",
    planned: "bg-slate-500/15 text-slate-600 border-slate-500/20",
    in_progress: "bg-blue-500/15 text-blue-600 border-blue-500/20",
    shipped: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20",
    queued: "bg-amber-500/15 text-amber-600 border-amber-500/20",
    posted: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20",
    concluded: "bg-violet-500/15 text-violet-600 border-violet-500/20",
    cancelled: "bg-red-500/15 text-red-600 border-red-500/20",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${map[status] ?? "bg-muted text-muted-foreground border-border"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function MiniSparkline({ data, color = "#3b82f6" }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80; const h = 28;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Overview Page ────────────────────────────────────────────────────────────
function OverviewPage() {
  const { data: kpis } = useQuery({ queryKey: ["/api/admin/analytics/kpis"], queryFn: () => apiRequest("GET", "/api/admin/analytics/kpis").then(r => r.json()) });
  const { data: health } = useQuery({ queryKey: ["/api/admin/system/health"], queryFn: () => apiRequest("GET", "/api/admin/system/health").then(r => r.json()) });
  const { data: currentVersion } = useQuery({ queryKey: ["/api/admin/versions/current"], queryFn: () => apiRequest("GET", "/api/admin/versions/current").then(r => r.json()) });
  const { data: churnRisk = [] } = useQuery({ queryKey: ["/api/admin/analytics/churn-risk"], queryFn: () => apiRequest("GET", "/api/admin/analytics/churn-risk").then(r => r.json()) });
  const { data: logs = [] } = useQuery({ queryKey: ["/api/admin/system/logs"], queryFn: () => apiRequest("GET", "/api/admin/system/logs?limit=8").then(r => r.json()) });

  const qc = useQueryClient();
  const computeMetrics = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/analytics/compute-daily"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/analytics/kpis"] }),
  });
  const autoPause = useMutation({ mutationFn: () => apiRequest("POST", "/api/admin/campaigns/auto-pause") });
  const processScheduled = useMutation({ mutationFn: () => apiRequest("POST", "/api/admin/social-posts/process-scheduled") });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl">System Overview</h2>
          <p className="text-sm text-muted-foreground mt-0.5">All engines running · {currentVersion?.version ?? "v1.0.0"} '{currentVersion?.codename ?? "Harbour"}'</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => computeMetrics.mutate()} disabled={computeMetrics.isPending} data-testid="compute-metrics-btn">
            <RefreshCw size={13} className={`mr-1.5 ${computeMetrics.isPending ? "animate-spin" : ""}`} /> Refresh metrics
          </Button>
          <Button size="sm" variant="outline" onClick={() => autoPause.mutate()} data-testid="auto-pause-btn">
            <Pause size={13} className="mr-1.5" /> Auto-pause ads
          </Button>
          <Button size="sm" variant="outline" onClick={() => processScheduled.mutate()} data-testid="process-posts-btn">
            <Play size={13} className="mr-1.5" /> Process posts
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Daily Active Users" value={kpis?.dau ?? "—"} change={kpis?.dauChange} icon={Users} />
        <KPICard label="Monthly Revenue" value={kpis ? `$${kpis.revenue.toFixed(0)}` : "—"} change={kpis?.revenueChange} icon={DollarSign} color="text-emerald-500" />
        <KPICard label="Total Searches" value={kpis?.totalSearches ?? "—"} change={kpis?.searchesChange} icon={Search} color="text-blue-500" />
        <KPICard label="Retention Rate" value={kpis ? `${kpis.retentionRate.toFixed(1)}%` : "—"} icon={UserCheck} color="text-violet-500" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="New Signups Today" value={kpis?.newSignups ?? "—"} icon={Users} color="text-cyan-500" />
        <KPICard label="Pro Upgrades Today" value={kpis?.proUpgrades ?? "—"} icon={Zap} color="text-amber-500" />
        <KPICard label="Churned Today" value={kpis?.churned ?? "—"} icon={TrendingDown} color="text-rose-500" />
        <KPICard label="Avg Session (min)" value={kpis ? kpis.avgSessionMin.toFixed(1) : "—"} icon={Activity} color="text-teal-500" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Churn Risk */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={16} className="text-rose-500" />
            <h3 className="font-semibold text-sm">Churn Risk Users</h3>
            <Badge variant="secondary" className="text-xs ml-auto">{churnRisk.length} flagged</Badge>
          </div>
          <div className="space-y-3">
            {(churnRisk as any[]).map((u: any) => (
              <div key={u.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
                <div className="w-7 h-7 rounded-full bg-rose-500/15 text-rose-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                  {u.name?.split(" ").map((n: string) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{u.name}</div>
                  <div className="text-[10px] text-muted-foreground">{u.reason}</div>
                </div>
                <div className={`text-xs font-bold ${u.riskScore > 60 ? "text-rose-500" : "text-amber-500"}`}>
                  {u.riskScore}%
                </div>
              </div>
            ))}
            {churnRisk.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No high-risk users detected</p>}
          </div>
        </div>

        {/* System Logs */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-primary" />
            <h3 className="font-semibold text-sm">Live System Log</h3>
          </div>
          <div className="space-y-2 font-mono">
            {(logs as any[]).map((log: any) => (
              <div key={log.id} className="flex items-start gap-2 text-[11px]">
                <span className={`shrink-0 font-bold ${log.level === "success" ? "text-emerald-500" : log.level === "error" ? "text-rose-500" : log.level === "warn" ? "text-amber-500" : "text-blue-500"}`}>
                  [{log.level.toUpperCase()}]
                </span>
                <span className="text-muted-foreground shrink-0">[{log.source}]</span>
                <span className="truncate">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle size={16} className="text-emerald-500" />
          <h3 className="font-semibold text-sm">Engine Health</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Version Engine", status: "running" },
            { label: "Marketing Engine", status: "running" },
            { label: "Analytics Engine", status: "running" },
            { label: "A/B Test Engine", status: "running" },
            { label: "Social Post Queue", status: "running" },
            { label: "Email Sequences", status: "running" },
            { label: "Database", status: "healthy" },
            { label: "Auto-Versioning", status: "running" },
          ].map(e => (
            <div key={e.label} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-xs text-muted-foreground">{e.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Growth Analytics Page ────────────────────────────────────────────────────
function GrowthPage() {
  const { data: metrics = [] } = useQuery<any[]>({ queryKey: ["/api/admin/analytics/growth"], queryFn: () => apiRequest("GET", "/api/admin/analytics/growth?days=14").then(r => r.json()) });
  const { data: funnel } = useQuery({ queryKey: ["/api/admin/analytics/funnel"], queryFn: () => apiRequest("GET", "/api/admin/analytics/funnel").then(r => r.json()) });

  const dauData = metrics.map((m: any) => m.dau);
  const revenueData = metrics.map((m: any) => m.revenue);

  return (
    <div className="space-y-6">
      <h2 className="font-display font-bold text-xl">Growth Analytics</h2>

      {/* Sparkline summary */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { label: "DAU (14d)", data: dauData, color: "#3b82f6" },
          { label: "Revenue (14d)", data: revenueData, color: "#10b981" },
          { label: "Searches (14d)", data: metrics.map((m: any) => m.total_searches), color: "#8b5cf6" },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-xl border border-border bg-card">
            <div className="text-xs font-semibold text-muted-foreground mb-2">{s.label}</div>
            <MiniSparkline data={s.data} color={s.color} />
          </div>
        ))}
      </div>

      {/* Funnel */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-semibold text-sm mb-4">Conversion Funnel (30d)</h3>
        {funnel && (
          <div className="space-y-3">
            {[
              { label: "Visitors", value: funnel.visitors, pct: 100, color: "bg-primary" },
              { label: "Signups", value: funnel.signups, pct: funnel.visitorToSignup, color: "bg-blue-500" },
              { label: "Pro Upgrades", value: funnel.upgrades, pct: funnel.signupToUpgrade, color: "bg-emerald-500" },
            ].map(step => (
              <div key={step.label} className="flex items-center gap-4">
                <div className="w-24 text-xs font-medium">{step.label}</div>
                <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${step.color} rounded-full transition-all`} style={{ width: `${Math.min(step.pct, 100)}%` }} />
                </div>
                <div className="w-20 text-xs text-right text-muted-foreground">
                  {step.value.toLocaleString()} · {typeof step.pct === "number" ? step.pct.toFixed(1) : step.pct}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Daily metrics table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="font-semibold text-sm">Daily Metrics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr className="text-muted-foreground">
                {["Date", "DAU", "New Signups", "Pro Upgrades", "Churned", "Searches", "Revenue"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[...metrics].reverse().map((m: any) => (
                <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5 font-mono">{m.date}</td>
                  <td className="px-4 py-2.5 font-semibold">{m.dau.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-emerald-600">+{m.new_signups}</td>
                  <td className="px-4 py-2.5 text-primary">+{m.pro_upgrades}</td>
                  <td className="px-4 py-2.5 text-rose-500">{m.churned}</td>
                  <td className="px-4 py-2.5">{m.total_searches.toLocaleString()}</td>
                  <td className="px-4 py-2.5 font-semibold">${m.revenue.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Campaigns Page ───────────────────────────────────────────────────────────
function CampaignsPage() {
  const { data: campaigns = [] } = useQuery<any[]>({ queryKey: ["/api/admin/campaigns"], queryFn: () => apiRequest("GET", "/api/admin/campaigns").then(r => r.json()) });
  const qc = useQueryClient();

  const genVariant = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/admin/campaigns/${id}/generate-variant`).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/campaigns"] }),
  });

  const channelIcon: Record<string, React.ElementType> = { twitter: Twitter, email: Mail, reddit: Globe, blog: Globe, banner: Globe, linkedin: Globe };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-xl">Ad Campaigns</h2>
        <Badge variant="secondary">{campaigns.filter((c: any) => c.status === "active").length} active</Badge>
      </div>

      <div className="space-y-3">
        {campaigns.map((c: any) => {
          const ChanIcon = channelIcon[c.channel] ?? Globe;
          const ctr = c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(1) : "0.0";
          const cvr = c.clicks > 0 ? ((c.conversions / c.clicks) * 100).toFixed(1) : "0.0";
          return (
            <div key={c.id} className="p-4 rounded-xl border border-border bg-card" data-testid={`campaign-${c.id}`}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <ChanIcon size={14} className="text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-sm">{c.name}</span>
                    <StatusBadge status={c.status} />
                    {c.variant_group && <span className="text-[10px] text-muted-foreground font-mono">{c.variant_group}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{c.headline} — {c.body.slice(0, 80)}…</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye size={11} />{c.impressions.toLocaleString()}</span>
                    <span className="flex items-center gap-1"><MousePointer size={11} />{c.clicks} ({ctr}%)</span>
                    <span className="flex items-center gap-1 text-emerald-600"><UserCheck size={11} />{c.conversions} ({cvr}%)</span>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="text-xs shrink-0" onClick={() => genVariant.mutate(c.id)} disabled={genVariant.isPending} data-testid={`gen-variant-${c.id}`}>
                  <Zap size={12} className="mr-1" /> Generate variant
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Social Posts Page ────────────────────────────────────────────────────────
function SocialPage() {
  const { data: posts = [] } = useQuery<any[]>({ queryKey: ["/api/admin/social-posts"], queryFn: () => apiRequest("GET", "/api/admin/social-posts").then(r => r.json()) });
  const qc = useQueryClient();

  const genWeekly = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/social-posts/generate-weekly").then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/social-posts"] }),
  });

  const platformIcon: Record<string, React.ElementType> = { twitter: Twitter, linkedin: Globe, reddit: Globe };
  const platformColor: Record<string, string> = { twitter: "text-sky-500", linkedin: "text-blue-600", reddit: "text-orange-500" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-xl">Social Post Queue</h2>
        <Button size="sm" onClick={() => genWeekly.mutate()} disabled={genWeekly.isPending} data-testid="gen-weekly-btn">
          <Zap size={13} className="mr-1.5" /> Generate this week's posts
        </Button>
      </div>

      <div className="space-y-3">
        {posts.map((p: any) => {
          const PIcon = platformIcon[p.platform] ?? Globe;
          const hashtags = p.hashtags ? JSON.parse(p.hashtags) : [];
          return (
            <div key={p.id} className="p-4 rounded-xl border border-border bg-card" data-testid={`post-${p.id}`}>
              <div className="flex items-start gap-3">
                <PIcon size={16} className={`${platformColor[p.platform] ?? "text-muted-foreground"} mt-0.5 shrink-0`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold capitalize">{p.platform}</span>
                    <StatusBadge status={p.status} />
                    {p.scheduled_for && <span className="text-[10px] text-muted-foreground">· Scheduled {new Date(p.scheduled_for).toLocaleDateString()}</span>}
                    {p.posted_at && <span className="text-[10px] text-muted-foreground">· Posted {new Date(p.posted_at).toLocaleDateString()}</span>}
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{p.content}</p>
                  {hashtags.length > 0 && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {hashtags.map((h: string) => <span key={h} className="text-[10px] text-primary">{h}</span>)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── A/B Tests Page ───────────────────────────────────────────────────────────
function AbTestsPage() {
  const { data: tests = [] } = useQuery<any[]>({ queryKey: ["/api/admin/ab-tests"], queryFn: () => apiRequest("GET", "/api/admin/ab-tests").then(r => r.json()) });
  const qc = useQueryClient();
  const analyze = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/ab-tests/analyze").then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/ab-tests"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-xl">A/B Tests</h2>
        <Button size="sm" variant="outline" onClick={() => analyze.mutate()} disabled={analyze.isPending} data-testid="analyze-abtests-btn">
          <RefreshCw size={13} className={`mr-1.5 ${analyze.isPending ? "animate-spin" : ""}`} /> Analyze & conclude
        </Button>
      </div>

      <div className="space-y-4">
        {tests.map((t: any) => {
          const variants = JSON.parse(t.variants || "[]");
          const results = JSON.parse(t.results || "[]");
          return (
            <div key={t.id} className="p-5 rounded-2xl border border-border bg-card" data-testid={`abtest-${t.id}`}>
              <div className="flex items-start gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{t.name}</span>
                    <StatusBadge status={t.status} />
                    {t.winner && <Badge className="text-[10px] bg-emerald-500 text-white">Winner: Variant {t.winner}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{t.hypothesis}</p>
                </div>
              </div>
              <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${variants.length}, 1fr)` }}>
                {variants.map((v: any) => {
                  const result = results.find((r: any) => r.variantId === v.id);
                  const rate = result && result.impressions > 0 ? (result.conversions / result.impressions * 100).toFixed(1) : "0.0";
                  const isWinner = t.winner === v.id;
                  return (
                    <div key={v.id} className={`p-3 rounded-xl border ${isWinner ? "border-emerald-500/40 bg-emerald-500/5" : "border-border bg-muted/30"}`}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-xs font-bold">Variant {v.id}</span>
                        {isWinner && <Star size={11} className="text-amber-500 fill-amber-500" />}
                      </div>
                      <div className="text-xs text-muted-foreground mb-1">{v.label}</div>
                      <div className="text-sm font-bold">{rate}%</div>
                      <div className="text-[10px] text-muted-foreground">
                        {result?.conversions ?? 0} / {result?.impressions ?? 0}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Versions Page ────────────────────────────────────────────────────────────
function VersionsPage() {
  const { data: versions = [] } = useQuery<any[]>({ queryKey: ["/api/admin/versions"], queryFn: () => apiRequest("GET", "/api/admin/versions").then(r => r.json()) });
  const { data: flags = [] } = useQuery<any[]>({ queryKey: ["/api/admin/feature-flags"], queryFn: () => apiRequest("GET", "/api/admin/feature-flags").then(r => r.json()) });
  const qc = useQueryClient();

  const autoBump = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/versions/auto-bump").then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/versions"] }),
  });
  const promote = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/admin/versions/${id}/promote`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/versions"] }),
  });
  const toggleFlag = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) =>
      apiRequest("PATCH", `/api/admin/feature-flags/${key}`, { enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/feature-flags"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-xl">Versions & Feature Flags</h2>
        <Button size="sm" onClick={() => autoBump.mutate()} disabled={autoBump.isPending} data-testid="auto-bump-btn">
          <GitBranch size={13} className="mr-1.5" /> Auto-bump version
        </Button>
      </div>

      {/* Versions */}
      <div className="space-y-3">
        {versions.map((v: any) => {
          const changes = JSON.parse(v.changes || "[]");
          return (
            <div key={v.id} className="p-4 rounded-xl border border-border bg-card" data-testid={`version-${v.id}`}>
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-display font-bold">v{v.version}</span>
                    {v.codename && <span className="text-muted-foreground text-sm">'{v.codename}'</span>}
                    <StatusBadge status={v.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{v.release_notes}</p>
                  <div className="flex flex-wrap gap-1">
                    {changes.slice(0, 4).map((c: any, i: number) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {c.type}: {c.text.slice(0, 40)}
                      </span>
                    ))}
                  </div>
                </div>
                {v.status === "draft" && (
                  <Button size="sm" onClick={() => promote.mutate(v.id)} data-testid={`promote-${v.id}`}>
                    Promote to live
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Flags */}
      <div>
        <h3 className="font-display font-semibold text-base mb-3">Feature Flags</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {flags.map((f: any) => (
            <div key={f.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card" data-testid={`flag-${f.key}`}>
              <button
                onClick={() => toggleFlag.mutate({ key: f.key, enabled: !f.enabled })}
                className={`relative w-10 h-5.5 rounded-full transition-colors shrink-0 ${f.enabled ? "bg-primary" : "bg-muted"}`}
                style={{ height: "22px", width: "40px" }}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${f.enabled ? "left-5" : "left-0.5"}`} />
              </button>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate">{f.label}</div>
                <div className="text-[10px] text-muted-foreground truncate">{f.description}</div>
              </div>
              {f.rollout_pct < 100 && f.enabled ? (
                <span className="text-[10px] text-amber-500 font-bold shrink-0">{f.rollout_pct}%</span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Roadmap Page ─────────────────────────────────────────────────────────────
function RoadmapPage() {
  const { data: items = [] } = useQuery<any[]>({ queryKey: ["/api/admin/roadmap"], queryFn: () => apiRequest("GET", "/api/admin/roadmap").then(r => r.json()) });
  const qc = useQueryClient();

  const advance = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("PATCH", `/api/admin/roadmap/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/roadmap"] }),
  });
  const vote = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/admin/roadmap/${id}/vote`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/roadmap"] }),
  });

  const statusOrder = ["planned", "in_progress", "shipped", "cancelled"];
  const nextStatus: Record<string, string> = { planned: "in_progress", in_progress: "shipped" };

  return (
    <div className="space-y-6">
      <h2 className="font-display font-bold text-xl">Product Roadmap</h2>
      <div className="space-y-3">
        {items.map((item: any) => (
          <div key={item.id} className="p-4 rounded-xl border border-border bg-card" data-testid={`roadmap-${item.id}`}>
            <div className="flex items-start gap-3">
              <button
                onClick={() => vote.mutate(item.id)}
                className="flex flex-col items-center gap-0.5 p-2 rounded-lg hover:bg-muted transition-colors shrink-0"
                data-testid={`vote-${item.id}`}
              >
                <Star size={12} className={`${item.votes > 500 ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`} />
                <span className="text-[10px] font-bold">{item.votes}</span>
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">{item.title}</span>
                  <StatusBadge status={item.status} />
                  <Badge variant="secondary" className="text-[10px]">{item.category}</Badge>
                  {item.quarter && <span className="text-[10px] text-muted-foreground">{item.quarter}</span>}
                </div>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              {nextStatus[item.status] && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs shrink-0"
                  onClick={() => advance.mutate({ id: item.id, status: nextStatus[item.status] })}
                  data-testid={`advance-${item.id}`}
                >
                  → {nextStatus[item.status].replace("_", " ")}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Email Sequences Page ─────────────────────────────────────────────────────
function EmailsPage() {
  const { data: sequences = [] } = useQuery<any[]>({ queryKey: ["/api/admin/email-sequences"], queryFn: () => apiRequest("GET", "/api/admin/email-sequences").then(r => r.json()) });

  return (
    <div className="space-y-6">
      <h2 className="font-display font-bold text-xl">Email Sequences</h2>
      <div className="space-y-3">
        {sequences.map((s: any) => (
          <div key={s.id} className="p-4 rounded-xl border border-border bg-card" data-testid={`email-${s.id}`}>
            <div className="flex items-start gap-3">
              <Mail size={14} className="text-primary mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">{s.name}</span>
                  <Badge variant="secondary" className="text-[10px]">{s.trigger_event}</Badge>
                  <span className="text-[10px] text-muted-foreground">Day {s.delay_days}</span>
                  <StatusBadge status={s.active ? "active" : "paused"} />
                </div>
                <p className="text-xs font-medium mb-1">"{s.subject}"</p>
                <div className="flex gap-4 text-[10px] text-muted-foreground">
                  <span>Sent: <strong className="text-foreground">{s.sent_count.toLocaleString()}</strong></span>
                  <span>Open rate: <strong className="text-foreground">{(s.open_rate * 100).toFixed(0)}%</strong></span>
                  <span>Click rate: <strong className="text-foreground">{(s.click_rate * 100).toFixed(0)}%</strong></span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Admin Layout ────────────────────────────────────────────────────────
const NAV_ITEMS: { id: AdminPage; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "growth", label: "Growth", icon: BarChart2 },
  { id: "campaigns", label: "Campaigns", icon: Megaphone },
  { id: "social", label: "Social", icon: Twitter },
  { id: "emails", label: "Emails", icon: Mail },
  { id: "abtests", label: "A/B Tests", icon: Flask },
  { id: "versions", label: "Versions", icon: GitBranch },
  { id: "roadmap", label: "Roadmap", icon: Layers },
];

export default function AdminDashboard() {
  const token = typeof window !== "undefined" ? sessionStorage.getItem("covelligent_admin_token") : null;
  const [, navigate] = useLocation();

  // Auth guard — redirect to login if no token
  if (!token) {
    if (typeof window !== "undefined") navigate("/admin/login");
    return null;
  }

  const [page, setPage] = useState<AdminPage>("overview");
  const { theme, toggle } = useTheme();

  const pageMap: Record<AdminPage, React.ReactNode> = {
    overview: <OverviewPage />,
    growth: <GrowthPage />,
    campaigns: <CampaignsPage />,
    social: <SocialPage />,
    emails: <EmailsPage />,
    abtests: <AbTestsPage />,
    versions: <VersionsPage />,
    flags: <VersionsPage />,
    roadmap: <RoadmapPage />,
    logs: <OverviewPage />,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-56 flex flex-col border-r border-border bg-card shrink-0">
        <div className="px-4 py-3 border-b border-border h-14 flex items-center gap-2">
          <LogoWordmark className="scale-90 origin-left" />
          <Badge variant="secondary" className="text-[9px] ml-auto">ADMIN</Badge>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`sidebar-item w-full text-left ${page === item.id ? "active" : ""}`}
              data-testid={`admin-nav-${item.id}`}
            >
              <item.icon size={15} className="shrink-0" />
              {item.label}
            </button>
          ))}
        </div>

        <div className="px-2 py-3 border-t border-border space-y-1">
          <button onClick={toggle} className="sidebar-item w-full">
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <button onClick={() => navigate("/")} className="sidebar-item w-full">
            <ArrowLeft size={14} />
            Back to site
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-8 max-w-5xl">
          {pageMap[page]}
        </div>
      </main>
    </div>
  );
}
