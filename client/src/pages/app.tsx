import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import AppLayout from "@/components/AppLayout";
import {
  Search, ArrowUp, Globe2, Code2, TrendingUp, PenTool,
  Microscope, Calculator, BarChart2, Languages, BookOpen,
  Newspaper, LogIn, User, Zap
} from "lucide-react";

const SUGGESTED = [
  { icon: Globe2,     label: "Research",   color: "text-indigo-500",  bg: "bg-indigo-500/10",  mode: "web",
    query: "What are the most important global events happening right now?" },
  { icon: Code2,      label: "Code",       color: "text-cyan-500",    bg: "bg-cyan-500/10",    mode: "code",
    query: "Write a production-ready REST API in Python with FastAPI" },
  { icon: TrendingUp, label: "Finance",    color: "text-emerald-500", bg: "bg-emerald-500/10", mode: "web",
    query: "Analyze the current state of global markets and top opportunities" },
  { icon: PenTool,    label: "Writing",    color: "text-violet-500",  bg: "bg-violet-500/10",  mode: "web",
    query: "Write a compelling executive summary for a Series A pitch deck" },
  { icon: Microscope, label: "Science",    color: "text-blue-500",    bg: "bg-blue-500/10",    mode: "academic",
    query: "Explain the latest breakthroughs in quantum computing" },
  { icon: Calculator, label: "Math",       color: "text-rose-500",    bg: "bg-rose-500/10",    mode: "reasoning",
    query: "Solve and explain a complex optimization problem step by step" },
  { icon: BarChart2,  label: "Analytics",  color: "text-amber-500",   bg: "bg-amber-500/10",   mode: "web",
    query: "Perform a competitive analysis of the top 5 SaaS CRM tools" },
  { icon: Languages,  label: "Translate",  color: "text-orange-500",  bg: "bg-orange-500/10",  mode: "web",
    query: "Translate and localize this text into formal Japanese" },
  { icon: BookOpen,   label: "Learning",   color: "text-teal-500",    bg: "bg-teal-500/10",    mode: "web",
    query: "Create a complete learning roadmap for machine learning in 2026" },
];

const SEARCH_MODES = [
  { key: "web",       label: "Web",           desc: "Live web search" },
  { key: "reasoning", label: "Deep Reason",   desc: "Step-by-step analysis" },
  { key: "code",      label: "Code",          desc: "Generate & debug" },
  { key: "academic",  label: "Academic",      desc: "Peer-reviewed sources" },
  { key: "news",      label: "News",          desc: "Breaking events" },
];

export default function AppHome() {
  const { user, loading } = useAuth();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("web");
  const [searching, setSearching] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const [citations, setCitations] = useState<string[]>([]);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [, setLocation] = useLocation();

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [query]);

  async function handleSearch(q?: string) {
    const searchQuery = (q || query).trim();
    if (!searchQuery || searching) return;
    setError("");
    setStreamContent("");
    setCitations([]);
    setSearching(true);

    try {
      const res = await fetch("/api/search/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          userId: user?.id,
          mode,
        }),
      });

      if (!res.ok) throw new Error("Search failed");

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let convId: number | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.type === "conversation") convId = evt.conversationId;
            if (evt.type === "delta") setStreamContent(prev => prev + evt.content);
            if (evt.type === "citations") setCitations(evt.citations || []);
            if (evt.type === "done") {
              setSearching(false);
              if (convId) setLocation(`/app/c/${convId}`);
            }
            if (evt.type === "error") {
              setError(evt.message);
              setSearching(false);
            }
          } catch { /* skip bad chunks */ }
        }
      }
    } catch (err: any) {
      setError(err.message || "Search failed");
      setSearching(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  }

  const greeting = user
    ? `What do you want to know, ${user.name.split(" ")[0]}?`
    : "What do you want to know?";

  return (
    <AppLayout>
      <div className="flex flex-col items-center min-h-full px-4 py-12">

        {/* Auth prompt if not logged in */}
        {!loading && !user && (
          <div className="w-full max-w-2xl mb-6">
            <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-foreground">
                <User className="w-4 h-4 text-primary" />
                <span>Sign in to save your searches and access conversation history</span>
              </div>
              <a
                href="/#/auth"
                className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Sign in
              </a>
            </div>
          </div>
        )}

        {/* Greeting */}
        <h1 className="text-2xl font-bold text-foreground mb-8 text-center">{greeting}</h1>

        {/* Search box */}
        <div className="w-full max-w-2xl">
          <div className="relative bg-surface border border-border rounded-2xl shadow-xl focus-within:border-primary/50 focus-within:shadow-primary/10 transition-all">
            <textarea
              ref={textareaRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask anything — research, code, analysis, writing..."
              rows={1}
              data-testid="input-search"
              className="w-full bg-transparent px-5 pt-4 pb-14 text-base text-foreground placeholder:text-muted-foreground resize-none focus:outline-none min-h-[56px]"
            />

            {/* Mode selector */}
            <div className="absolute bottom-3 left-3 flex gap-1">
              {SEARCH_MODES.map(m => (
                <button
                  key={m.key}
                  onClick={() => setMode(m.key)}
                  data-testid={`mode-${m.key}`}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    mode === m.key
                      ? "bg-primary text-white"
                      : "text-muted-foreground hover:text-foreground hover:bg-border"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Submit button */}
            <button
              onClick={() => handleSearch()}
              disabled={!query.trim() || searching}
              data-testid="button-search"
              className="absolute bottom-3 right-3 w-9 h-9 bg-primary hover:bg-primary/90 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-all shadow-lg shadow-primary/25"
            >
              {searching
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <ArrowUp className="w-4 h-4" />
              }
            </button>
          </div>

          {/* Streaming preview */}
          {(searching || streamContent) && (
            <div className="mt-4 bg-surface border border-border rounded-2xl p-5">
              {searching && !streamContent && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Zap className="w-4 h-4 text-primary animate-pulse" />
                  Searching the web and synthesizing an answer...
                </div>
              )}
              {streamContent && (
                <div className="prose prose-sm dark:prose-invert max-w-none text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                  {streamContent}
                  {searching && <span className="inline-block w-1 h-4 bg-primary ml-0.5 animate-pulse" />}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Category pills */}
        {!streamContent && !searching && (
          <>
            <div className="w-full max-w-2xl mt-8 grid grid-cols-3 sm:grid-cols-5 gap-2">
              {SUGGESTED.map((s) => (
                <button
                  key={s.label}
                  onClick={() => { setQuery(s.query); setMode(s.mode); setTimeout(() => handleSearch(s.query), 50); }}
                  data-testid={`category-${s.label.toLowerCase()}`}
                  className="flex flex-col items-center gap-2 p-3 bg-surface border border-border rounded-xl hover:border-primary/30 hover:bg-primary/5 transition-all group"
                >
                  <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    {s.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Plan badge */}
            {user && (
              <div className="mt-6 text-xs text-muted-foreground">
                {user.plan === "pro"
                  ? <span className="text-primary font-medium">Pro — unlimited searches</span>
                  : <span>Free plan · <a href="/#/pricing" className="text-primary hover:underline">Upgrade to Pro for unlimited</a></span>
                }
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
