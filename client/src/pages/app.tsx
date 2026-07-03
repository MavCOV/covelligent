import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Search, ArrowUp, Telescope, BookOpen, Atom, Globe2,
  TrendingUp, Cpu, Sparkles, Code2, PenTool,
  Calculator, Languages, Microscope, FileText, BarChart2
} from "lucide-react";

const SUGGESTED = [
  { icon: Globe2,     label: "Research",    color: "text-indigo-500",  bg: "bg-indigo-500/10",
    query: "What are the most important global events happening right now?" },
  { icon: Code2,      label: "Code",        color: "text-cyan-500",    bg: "bg-cyan-500/10",
    query: "Write a production-ready REST API in Python with FastAPI" },
  { icon: TrendingUp, label: "Finance",     color: "text-emerald-500", bg: "bg-emerald-500/10",
    query: "Analyze the current state of global markets and top opportunities" },
  { icon: PenTool,    label: "Writing",     color: "text-violet-500",  bg: "bg-violet-500/10",
    query: "Write a compelling executive summary for a Series A pitch deck" },
  { icon: Microscope, label: "Science",     color: "text-blue-500",    bg: "bg-blue-500/10",
    query: "Explain the latest breakthroughs in quantum computing" },
  { icon: Calculator, label: "Math",        color: "text-rose-500",    bg: "bg-rose-500/10",
    query: "Solve and explain a complex optimization problem step by step" },
  { icon: BarChart2,  label: "Analytics",  color: "text-amber-500",   bg: "bg-amber-500/10",
    query: "Perform a competitive analysis of the top 5 SaaS CRM tools" },
  { icon: Languages,  label: "Translate",  color: "text-orange-500",  bg: "bg-orange-500/10",
    query: "Translate and localize this text into formal Japanese" },
  { icon: BookOpen,   label: "Learning",   color: "text-teal-500",    bg: "bg-teal-500/10",
    query: "Create a complete learning roadmap for machine learning in 2026" },
];

const TRENDING = [
  "Build a full SaaS product from scratch — what's the fastest path?",
  "Latest breakthroughs in nuclear fusion and what they mean",
  "Best investment strategies for 2026 given current macro conditions",
  "Explain large language model architecture intuitively",
  "How do I negotiate a software engineering offer at a top company?",
  "Write a Python script to analyze stock market data with visualizations",
];

const SEARCH_MODES = [
  { label: "Web", desc: "Live web synthesis" },
  { label: "Deep Research", desc: "30+ sources, multi-step" },
  { label: "Code", desc: "Generate & debug" },
  { label: "Academic", desc: "Peer-reviewed only" },
  { label: "News", desc: "Breaking events" },
];

export default function AppHome() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [activeMode, setActiveMode] = useState("Web");

  const { data: user } = useQuery<{ id: number; name: string }>({
    queryKey: ["/api/demo-user"],
    queryFn: () => apiRequest("GET", "/api/demo-user").then(r => r.json()),
  });

  const search = useMutation({
    mutationFn: (q: string) =>
      apiRequest("POST", "/api/search", { query: q, userId: user?.id }).then(r => r.json()),
    onSuccess: (data) => {
      navigate(`/app/c/${data.conversation.id}`);
    },
  });

  const handleSearch = (q?: string) => {
    const finalQ = q || query.trim();
    if (!finalQ) return;
    search.mutate(finalQ);
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const firstName = user?.name?.split(" ")[0] ?? "";

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-14">
          {/* Greeting */}
          <div className="text-center mb-10 animate-fade-up">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles size={16} className="text-primary" />
              <span className="text-muted-foreground text-sm font-medium tracking-wide">
                {getGreeting()}{firstName ? `, ${firstName}` : ""}
              </span>
            </div>
            <h1 className="font-display text-3xl md:text-[2.1rem] font-black mb-2 tracking-tight leading-tight">
              What can I help you with?
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Research · Code · Write · Analyze · Translate — anything, with no limits.
            </p>
          </div>

          {/* Search bar */}
          <div className="mb-5 animate-fade-up" style={{ animationDelay: "60ms" }}>
            <div className={`search-bar shadow-sm transition-all ${focused ? "shadow-lg" : ""}`} data-testid="main-search-bar">
              <Search size={18} className="text-primary shrink-0" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Ask anything, create anything..."
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                className="text-base"
                data-testid="search-input"
                autoFocus
              />
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="icon"
                  className="h-9 w-9 bg-primary hover:bg-primary/90 rounded-xl shadow-md shadow-primary/25"
                  onClick={() => handleSearch()}
                  disabled={!query.trim() || search.isPending}
                  data-testid="search-submit"
                >
                  {search.isPending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <ArrowUp size={16} />
                  )}
                </Button>
              </div>
            </div>

            {/* Search mode pills */}
            <div className="flex gap-2 mt-3 flex-wrap">
              {SEARCH_MODES.map(mode => (
                <button
                  key={mode.label}
                  onClick={() => setActiveMode(mode.label)}
                  className={`text-xs px-3.5 py-1.5 rounded-full border transition-all font-medium ${
                    activeMode === mode.label
                      ? "border-primary/60 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  }`}
                  data-testid={`mode-${mode.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Categories grid */}
          <div className="mb-10 animate-fade-up" style={{ animationDelay: "120ms" }}>
            <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.12em] mb-3">
              Explore by capability
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {SUGGESTED.map(s => (
                <button
                  key={s.label}
                  onClick={() => handleSearch(s.query)}
                  disabled={search.isPending}
                  className="flex flex-col items-center gap-2 p-3.5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all group"
                  data-testid={`category-${s.label.toLowerCase()}`}
                >
                  <div className={`w-8 h-8 rounded-xl ${s.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <s.icon size={16} className={s.color} />
                  </div>
                  <span className="text-xs font-semibold">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Trending */}
          <div className="animate-fade-up" style={{ animationDelay: "180ms" }}>
            <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.12em] mb-3">
              Suggested for you
            </h2>
            <div className="space-y-1.5">
              {TRENDING.map((t, i) => (
                <button
                  key={i}
                  onClick={() => handleSearch(t)}
                  disabled={search.isPending}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:border-primary/30 text-left text-sm hover:shadow-sm transition-all group"
                  data-testid={`trending-${i}`}
                >
                  <span className="text-muted-foreground text-[10px] font-mono w-4 shrink-0 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 group-hover:text-foreground transition-colors leading-snug">{t}</span>
                  <Search size={12} className="text-muted-foreground opacity-0 group-hover:opacity-60 shrink-0 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
