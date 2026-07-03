import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTheme } from "@/components/ThemeProvider";
import { LogoWordmark } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search, ArrowRight, Check, Moon, Sun,
  Brain, Globe, Code2, FileText, Microscope,
  Image, Mic, BarChart2, Shield, Zap,
  ChevronRight, Sparkles, Star, MessageSquare,
  BookOpen, PenTool, Calculator, TrendingUp,
  Languages, Camera
} from "lucide-react";

const CAPABILITIES = [
  {
    icon: Globe,
    title: "Real-Time Intelligence",
    desc: "Live web synthesis with source citations. Not yesterday's training data — the world, right now, fully cited.",
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    span: "",
  },
  {
    icon: Code2,
    title: "Full-Stack Code Generation",
    desc: "Write, debug, refactor, and explain code in any language. Covelligent ships production-ready work.",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    span: "",
  },
  {
    icon: Brain,
    title: "Deep Research Mode",
    desc: "Multi-step reasoning across dozens of sources. The kind of research that used to take days, done in minutes.",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    span: "",
  },
  {
    icon: PenTool,
    title: "Master-Level Writing",
    desc: "Reports, essays, emails, marketing copy, legal briefs, novels. Any voice, any format, any length.",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    span: "",
  },
  {
    icon: Microscope,
    title: "Scientific Analysis",
    desc: "Parse research papers, interpret data, explain complex science, and generate hypotheses with citations.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    span: "",
  },
  {
    icon: Calculator,
    title: "Advanced Mathematics",
    desc: "From algebra to tensor calculus. Step-by-step proofs, symbolic computation, and numerical analysis.",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    span: "",
  },
  {
    icon: BarChart2,
    title: "Data & Financial Analysis",
    desc: "Upload spreadsheets, datasets, or financial reports. Get insights, forecasts, and visualizations instantly.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    span: "",
  },
  {
    icon: Languages,
    title: "100+ Languages",
    desc: "Translate, localize, and communicate in over 100 languages with native-level nuance and cultural context.",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    span: "",
  },
  {
    icon: Shield,
    title: "Privacy-First Architecture",
    desc: "End-to-end encryption. Zero data retention options. Your conversations are yours and yours alone.",
    color: "text-teal-500",
    bg: "bg-teal-500/10",
    span: "",
  },
];

const EXAMPLE_QUERIES = [
  "Build me a complete SaaS pricing strategy",
  "Analyze this research paper and find the gaps",
  "Write production-ready Python for a REST API",
  "What are the best investment opportunities right now?",
  "Help me understand quantum entanglement simply",
  "Draft a legal brief for a trademark dispute",
];

const TESTIMONIALS = [
  {
    name: "Dr. Sarah Chen",
    role: "Research Scientist, MIT",
    text: "Covelligent replaced six separate tools I was juggling. The research depth alone is unlike anything I've ever used — it thinks with me.",
    stars: 5,
    avatar: "SC",
  },
  {
    name: "Marcus Williams",
    role: "Senior Engineer, Meta",
    text: "I shipped three features in a day using Covelligent for code gen and review. It understands context at a level that's genuinely shocking.",
    stars: 5,
    avatar: "MW",
  },
  {
    name: "Priya Nair",
    role: "VP of Product, Stripe",
    text: "Every senior PM on my team now uses it daily. The analysis quality is at a level I'd expect from a McKinsey partner.",
    stars: 5,
    avatar: "PN",
  },
  {
    name: "James Okafor",
    role: "Financial Analyst, Goldman Sachs",
    text: "The financial modeling capabilities alone justify the subscription ten times over. It finds signals in data that our team missed entirely.",
    stars: 5,
    avatar: "JO",
  },
];

const COMPARISON = [
  { feature: "Real-time web search + citations", covelligent: true, perplexity: true, chatgpt: false, grok: true },
  { feature: "Deep multi-step research (30+ sources)", covelligent: true, perplexity: false, chatgpt: false, grok: false },
  { feature: "Full code generation & debugging", covelligent: true, perplexity: false, chatgpt: true, grok: true },
  { feature: "File & document analysis", covelligent: true, perplexity: false, chatgpt: true, grok: false },
  { feature: "Mathematical proofs & computation", covelligent: true, perplexity: false, chatgpt: true, grok: true },
  { feature: "100+ language translation", covelligent: true, perplexity: false, chatgpt: true, grok: false },
  { feature: "Unlimited conversation history", covelligent: true, perplexity: true, chatgpt: false, grok: false },
  { feature: "Privacy-first (zero data retention)", covelligent: true, perplexity: false, chatgpt: false, grok: false },
  { feature: "No query or rate limits (Pro)", covelligent: true, perplexity: false, chatgpt: false, grok: false },
];

function StatBadge({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center px-6 py-4">
      <div className="font-display text-3xl font-black gradient-text mb-1">{value}</div>
      <div className="text-xs text-muted-foreground font-medium tracking-wide uppercase">{label}</div>
    </div>
  );
}

export default function Landing() {
  const [, navigate] = useLocation();
  const { theme, toggle } = useTheme();
  const [activeQuery, setActiveQuery] = useState(0);
  const [typedQuery, setTypedQuery] = useState("");

  useEffect(() => {
    const target = EXAMPLE_QUERIES[activeQuery];
    let i = 0;
    setTypedQuery("");
    const interval = setInterval(() => {
      if (i < target.length) {
        setTypedQuery(target.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 28);
    return () => clearInterval(interval);
  }, [activeQuery]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveQuery(prev => (prev + 1) % EXAMPLE_QUERIES.length);
    }, 4200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* ── Nav ── */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-border/40 bg-background/85 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <LogoWordmark />

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <button
              onClick={() => document.getElementById('capabilities')?.scrollIntoView({ behavior: 'smooth' })}
              className="hover:text-foreground transition-colors"
              data-testid="nav-capabilities"
            >
              Capabilities
            </button>
            <button
              onClick={() => document.getElementById('compare')?.scrollIntoView({ behavior: 'smooth' })}
              className="hover:text-foreground transition-colors"
              data-testid="nav-compare"
            >
              Compare
            </button>
            <button
              onClick={() => document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="hover:text-foreground transition-colors"
              data-testid="nav-pricing"
            >
              Pricing
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
              aria-label="Toggle theme"
              data-testid="theme-toggle"
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <Button
              variant="ghost"
              size="sm"
              className="text-sm font-semibold"
              onClick={() => navigate("/app")}
              data-testid="nav-signin"
            >
              Sign in
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/pricing")}
              className="bg-primary hover:bg-primary/90 font-semibold shadow-lg shadow-primary/25"
              data-testid="nav-getstarted"
            >
              Get started free
              <ChevronRight size={14} className="ml-0.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative pt-36 pb-32 px-6 overflow-hidden hero-gradient">
        {/* Floating orbs */}
        <div className="orb orb-primary w-[600px] h-[600px] -top-64 -left-64 opacity-60" />
        <div className="orb orb-accent w-[400px] h-[400px] -top-32 right-0 opacity-50" />
        <div className="orb orb-primary w-[300px] h-[300px] bottom-0 right-1/4 opacity-30" />

        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.018] dark:opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative max-w-5xl mx-auto text-center">
          <Badge
            variant="secondary"
            className="mb-8 py-1.5 px-5 text-xs font-semibold border border-primary/25 bg-primary/8 text-primary dark:bg-primary/12 tracking-wide"
            data-testid="hero-badge"
          >
            <Sparkles size={11} className="mr-2" />
            Covelligent — v1 now live
          </Badge>

          {/* Hero headline — NO generic taglines */}
          <h1
            className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-[80px] font-black tracking-tight mb-8 leading-[1.0]"
            data-testid="hero-heading"
          >
            Everything you
            <br />
            <span className="gradient-text">need to know,</span>
            <br />
            <span className="text-foreground">build, and create.</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
            One intelligent platform for research, code, writing, analysis, math, translation — and everything in between.
            No limits. No compromises.
          </p>

          {/* Animated search bar — hero size */}
          <div className="max-w-3xl mx-auto mb-8">
            <div className="search-bar-hero mb-5" data-testid="hero-search">
              <Search size={22} className="text-primary shrink-0" />
              <input
                value={typedQuery}
                readOnly
                className="font-medium"
                placeholder="Ask Covelligent anything..."
              />
              <button
                className="btn-primary text-sm py-3 px-6 shrink-0 rounded-xl"
                onClick={() => navigate("/app")}
                style={{ padding: "10px 22px", fontSize: "0.9rem" }}
              >
                Ask now <ArrowRight size={15} className="inline ml-1" />
              </button>
            </div>

            {/* Query chips */}
            <div className="flex gap-2 flex-wrap justify-center">
              {EXAMPLE_QUERIES.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setActiveQuery(i)}
                  className={`text-xs px-3.5 py-1.5 rounded-full border transition-all font-medium ${
                    activeQuery === i
                      ? "border-primary/60 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  }`}
                  data-testid={`example-query-${i}`}
                >
                  {q.length > 38 ? q.slice(0, 38) + "…" : q}
                </button>
              ))}
            </div>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium"><Check size={15} className="text-emerald-500" /> Free to start</span>
            <span className="flex items-center gap-1.5 font-medium"><Check size={15} className="text-emerald-500" /> No credit card required</span>
            <span className="flex items-center gap-1.5 font-medium"><Check size={15} className="text-emerald-500" /> Cancel anytime</span>
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative max-w-4xl mx-auto mt-20">
          <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm grid grid-cols-2 md:grid-cols-4 divide-x divide-border/50">
            <StatBadge value="50M+" label="Queries answered" />
            <StatBadge value="190+" label="Countries reached" />
            <StatBadge value="100+" label="Languages supported" />
            <StatBadge value="99.9%" label="Uptime SLA" />
          </div>
        </div>
      </section>

      {/* ── Capabilities Grid ── */}
      <section id="capabilities" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <Badge variant="secondary" className="mb-5 text-xs font-semibold tracking-wide">Full capability suite</Badge>
            <h2 className="font-display text-4xl md:text-5xl font-black mb-5 tracking-tight">
              Built to do it all.
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              Every capability you could ever need, in one place — working together seamlessly.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {CAPABILITIES.map((cap) => (
              <div
                key={cap.title}
                className="capability-card group"
                data-testid={`cap-${cap.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className={`w-12 h-12 rounded-2xl ${cap.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200`}>
                  <cap.icon size={22} className={cap.color} />
                </div>
                <h3 className="font-display font-bold text-base mb-2.5 tracking-tight">{cap.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{cap.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA beneath grid */}
          <div className="text-center mt-14">
            <Button
              size="lg"
              onClick={() => navigate("/app")}
              className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 font-bold text-base h-13 px-10"
              data-testid="cap-cta"
            >
              Experience all capabilities
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── Comparison Table ── */}
      <section id="compare" className="py-28 px-6 bg-muted/30 border-y border-border/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-5 text-xs font-semibold tracking-wide">Honest comparison</Badge>
            <h2 className="font-display text-4xl md:text-5xl font-black mb-5 tracking-tight">
              The clear choice.
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              See exactly how Covelligent stacks up against every major platform.
            </p>
          </div>

          <div className="rounded-2xl border border-border overflow-hidden bg-card shadow-xl shadow-foreground/5">
            {/* Header row */}
            <div className="grid grid-cols-5 border-b border-border bg-muted/50">
              <div className="p-5 col-span-2 text-sm font-bold text-muted-foreground uppercase tracking-wider">Feature</div>
              <div className="p-5 text-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <span className="text-white text-xs font-black">C</span>
                  </div>
                  <span className="text-xs font-bold text-primary">Covelligent</span>
                </div>
              </div>
              <div className="p-5 text-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-8 h-8 rounded-lg bg-muted-foreground/20 flex items-center justify-center">
                    <span className="text-muted-foreground text-xs font-black">P</span>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">Perplexity</span>
                </div>
              </div>
              <div className="p-5 text-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-8 h-8 rounded-lg bg-muted-foreground/20 flex items-center justify-center">
                    <span className="text-muted-foreground text-xs font-black">G</span>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">ChatGPT/Grok</span>
                </div>
              </div>
            </div>

            {COMPARISON.map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-5 border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/10'}`}
                data-testid={`compare-row-${i}`}
              >
                <div className="p-4 col-span-2 text-sm font-medium flex items-center">{row.feature}</div>
                <div className="p-4 flex items-center justify-center">
                  {row.covelligent
                    ? <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"><Check size={13} className="text-white" strokeWidth={3} /></div>
                    : <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center"><span className="text-muted-foreground text-xs font-bold">—</span></div>
                  }
                </div>
                <div className="p-4 flex items-center justify-center">
                  {row.perplexity
                    ? <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center"><Check size={13} className="text-emerald-600" strokeWidth={3} /></div>
                    : <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center"><span className="text-muted-foreground text-xs font-bold">—</span></div>
                  }
                </div>
                <div className="p-4 flex items-center justify-center">
                  {row.chatgpt
                    ? <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center"><Check size={13} className="text-emerald-600" strokeWidth={3} /></div>
                    : <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center"><span className="text-muted-foreground text-xs font-bold">—</span></div>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-5 text-xs font-semibold tracking-wide">Trusted by the best</Badge>
            <h2 className="font-display text-4xl md:text-5xl font-black mb-5 tracking-tight">
              Real people. Real results.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="p-6 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-lg transition-all duration-200">
                <div className="flex mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} size={13} className="text-amber-500 fill-amber-500" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing-section" className="py-28 px-6 bg-muted/30 border-y border-border/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-5 text-xs font-semibold tracking-wide">Simple pricing</Badge>
            <h2 className="font-display text-4xl md:text-5xl font-black mb-5 tracking-tight">
              One plan. Everything.
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              No feature tiers. No query caps. Just unrestricted access to the most powerful AI platform ever built.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free */}
            <div className="rounded-2xl border border-border bg-card p-8">
              <div className="mb-5">
                <h3 className="font-display font-bold text-xl mb-1">Free</h3>
                <p className="text-muted-foreground text-sm">Start exploring. No card needed.</p>
              </div>
              <div className="mb-6">
                <span className="font-display text-4xl font-black">$0</span>
                <span className="text-muted-foreground text-sm ml-1">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {["10 queries per day", "Web search + citations", "Code generation", "Conversation history (7 days)"].map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <Check size={14} className="text-emerald-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                className="w-full font-semibold"
                onClick={() => navigate("/app")}
                data-testid="free-plan-cta"
              >
                Start free
              </Button>
            </div>

            {/* Pro */}
            <div className="rounded-2xl border-2 border-primary bg-card p-8 relative overflow-hidden shadow-2xl shadow-primary/15">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/8 rounded-full blur-3xl -translate-y-20 translate-x-20" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/8 rounded-full blur-2xl translate-y-10 -translate-x-10" />
              <Badge className="absolute top-5 right-5 bg-primary text-primary-foreground text-xs font-semibold px-3">Most popular</Badge>

              <div className="mb-5 relative">
                <h3 className="font-display font-bold text-xl mb-1">Pro</h3>
                <p className="text-muted-foreground text-sm">Unlimited power. No compromises.</p>
              </div>
              <div className="mb-6 relative">
                <span className="font-display text-4xl font-black">$24.99</span>
                <span className="text-muted-foreground text-sm ml-1">/month</span>
              </div>
              <ul className="space-y-3 mb-8 relative">
                {[
                  "Unlimited queries",
                  "Deep research mode (30+ sources)",
                  "Full code generation & debugging",
                  "File & document analysis",
                  "Advanced math & computation",
                  "100+ language translation",
                  "Unlimited history + collections",
                  "Priority response speed",
                  "Early access to new capabilities",
                ].map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm font-medium">
                    <Check size={14} className="text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full bg-primary hover:bg-primary/90 font-bold text-base h-12 relative shadow-lg shadow-primary/30"
                onClick={() => navigate("/pricing")}
                data-testid="pro-plan-cta"
              >
                Start Pro — $24.99/mo
                <ArrowRight size={15} className="ml-1.5" />
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-3">14-day free trial · Cancel anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="orb orb-primary w-[500px] h-[500px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" />
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="font-display text-5xl md:text-6xl font-black mb-6 tracking-tight leading-[1.05]">
            Your potential,
            <br />
            <span className="gradient-text">without a ceiling.</span>
          </h2>
          <p className="text-muted-foreground text-xl mb-10 leading-relaxed">
            Join the people who've stopped limiting what they can accomplish. Start with Covelligent today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 font-bold text-base h-14 px-10"
              onClick={() => navigate("/app")}
              data-testid="final-cta-try"
            >
              Start for free
              <ArrowRight size={17} className="ml-2" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="font-semibold h-14 px-10"
              onClick={() => navigate("/pricing")}
              data-testid="final-cta-pro"
            >
              View Pro plan
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-6">No credit card required · Free forever plan · Cancel Pro anytime</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/50 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-10">
            <div>
              <LogoWordmark />
              <p className="text-sm text-muted-foreground mt-3 max-w-xs leading-relaxed">
                Intelligence without limits. Built for the people who refuse to stop at good enough.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-sm">
              <div>
                <div className="font-semibold mb-3">Product</div>
                <div className="space-y-2 text-muted-foreground">
                  <button onClick={() => navigate("/app")} className="block hover:text-foreground transition-colors">Try free</button>
                  <button onClick={() => navigate("/pricing")} className="block hover:text-foreground transition-colors">Pricing</button>
                  <button onClick={() => document.getElementById('capabilities')?.scrollIntoView({ behavior: 'smooth' })} className="block hover:text-foreground transition-colors">Capabilities</button>
                </div>
              </div>
              <div>
                <div className="font-semibold mb-3">Company</div>
                <div className="space-y-2 text-muted-foreground">
                  <a href="#" className="block hover:text-foreground transition-colors">About</a>
                  <a href="#" className="block hover:text-foreground transition-colors">Blog</a>
                  <a href="#" className="block hover:text-foreground transition-colors">Careers</a>
                </div>
              </div>
              <div>
                <div className="font-semibold mb-3">Legal</div>
                <div className="space-y-2 text-muted-foreground">
                  <a href="#" className="block hover:text-foreground transition-colors">Privacy</a>
                  <a href="#" className="block hover:text-foreground transition-colors">Terms</a>
                  <a href="#" className="block hover:text-foreground transition-colors">Security</a>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">© 2026 Covelligent, Inc. All rights reserved.</p>
            <p className="text-xs text-muted-foreground">Proudly serving covelligent.com</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
