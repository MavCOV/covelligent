import { useState, useRef, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import AppLayout from "@/components/AppLayout";
import { ArrowUp, User, Zap, ExternalLink, Copy, Check } from "lucide-react";
import { LogoWordmark } from "@/components/Logo";

function CitationList({ sources }: { sources: string[] }) {
  if (!sources.length) return null;
  return (
    <div className="mt-4 pt-4 border-t border-border">
      <p className="text-xs font-medium text-muted-foreground mb-2">Sources</p>
      <div className="flex flex-wrap gap-2">
        {sources.slice(0, 8).map((url, i) => {
          let domain = "";
          try { domain = new URL(url).hostname.replace("www.", ""); } catch { domain = url; }
          return (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1 bg-border/50 hover:bg-primary/10 hover:border-primary/30 border border-transparent rounded-lg text-xs text-muted-foreground hover:text-primary transition-all"
            >
              <span className="font-mono text-[10px] opacity-60">[{i + 1}]</span>
              {domain}
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          );
        })}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: any }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  let sources: string[] = [];
  try { sources = JSON.parse(message.sources || "[]"); } catch {}

  function copyContent() {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (isUser) {
    return (
      <div className="flex justify-end mb-6">
        <div className="max-w-[80%] bg-primary text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 mb-8">
      <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Zap className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="prose prose-sm dark:prose-invert max-w-none text-foreground text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
        <CitationList sources={sources} />
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={copyContent}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Conversation() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("web");
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const [streamCitations, setStreamCitations] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: conversation } = useQuery({
    queryKey: ["/api/conversations", id],
    queryFn: () => apiRequest("GET", `/api/conversations/${id}`).then(r => r.json()),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["/api/conversations", id, "messages"],
    queryFn: () => apiRequest("GET", `/api/conversations/${id}/messages`).then(r => r.json()),
    refetchInterval: streaming ? false : undefined,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamContent]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 180) + "px";
  }, [input]);

  async function sendMessage() {
    const q = input.trim();
    if (!q || streaming) return;
    setInput("");
    setStreamContent("");
    setStreamCitations([]);
    setStreaming(true);

    try {
      const res = await fetch("/api/search/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, userId: user?.id, mode, conversationId: Number(id) }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

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
            if (evt.type === "delta") setStreamContent(prev => prev + evt.content);
            if (evt.type === "citations") setStreamCitations(evt.citations || []);
            if (evt.type === "done") {
              setStreaming(false);
              setStreamContent("");
              setStreamCitations([]);
              qc.invalidateQueries({ queryKey: ["/api/conversations", id, "messages"] });
            }
          } catch {}
        }
      }
    } catch {
      setStreaming(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        {/* Title bar */}
        {conversation && (
          <div className="px-6 py-3 border-b border-border">
            <h2 className="text-sm font-medium text-foreground truncate">{(conversation as any).title}</h2>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 max-w-3xl mx-auto w-full">
          {(messages as any[]).map((msg: any) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {/* Streaming message */}
          {streaming && (
            <div className="flex gap-3 mb-8">
              <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Zap className="w-3.5 h-3.5 text-primary animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                {streamContent ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                    {streamContent}
                    <span className="inline-block w-1 h-4 bg-primary ml-0.5 animate-pulse" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    Searching and thinking...
                  </div>
                )}
                {streamCitations.length > 0 && <CitationList sources={streamCitations} />}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border px-4 py-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative bg-surface border border-border rounded-2xl focus-within:border-primary/50 transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask a follow-up..."
                rows={1}
                data-testid="input-followup"
                className="w-full bg-transparent px-4 pt-3.5 pb-12 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none min-h-[52px]"
              />
              <div className="absolute bottom-2.5 left-3 flex gap-1">
                {["web","code","academic","news"].map(m => (
                  <button key={m} onClick={() => setMode(m)}
                    className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-all ${mode === m ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}>
                    {m}
                  </button>
                ))}
              </div>
              <button
                onClick={sendMessage}
                disabled={!input.trim() || streaming}
                data-testid="button-send"
                className="absolute bottom-2.5 right-2.5 w-8 h-8 bg-primary hover:bg-primary/90 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-all"
              >
                {streaming
                  ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <ArrowUp className="w-3.5 h-3.5" />
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
