import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import AppLayout from "@/components/AppLayout";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import {
  ArrowUp, Search, Copy, ThumbsUp, ThumbsDown, Share2,
  ExternalLink, Globe, RefreshCw, BookmarkPlus, MoreHorizontal,
  ChevronDown
} from "lucide-react";
import type { Conversation, Message } from "@shared/schema";

function parseMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^### (.*?)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*?)$/gm, "<h2>$1</h2>")
    .replace(/^• (.*?)$/gm, "<li>$1</li>")
    .replace(/^- (.*?)$/gm, "<li>$1</li>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[hli])(.+)$/gm, (m) => m.startsWith("<") ? m : `<p>${m}</p>`);
}

function SourcePill({ url }: { url: string }) {
  let domain = url;
  try { domain = new URL(url).hostname.replace("www.", ""); } catch {}
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="source-pill"
      data-testid={`source-${domain}`}
    >
      <Globe size={10} />
      {domain}
      <ExternalLink size={9} />
    </a>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex items-start gap-3 animate-fade-in">
      <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0 mt-0.5">
        <Logo size={32} />
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold mb-2 text-primary">Covelligent</div>
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl rounded-tl-sm bg-muted/50 border border-border w-fit">
          <span className="text-xs text-muted-foreground">Searching the web</span>
          <div className="flex gap-1">
            <div className="thinking-dot" />
            <div className="thinking-dot" />
            <div className="thinking-dot" />
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const sources: string[] = message.sources ? JSON.parse(message.sources) : [];

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (isUser) {
    return (
      <div className="flex justify-end" data-testid={`msg-user-${message.id}`}>
        <div className="max-w-xl bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 animate-fade-up" data-testid={`msg-assistant-${message.id}`}>
      <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0 mt-0.5">
        <Logo size={32} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold mb-2 text-primary">Covelligent</div>

        {/* Sources */}
        {sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {sources.map(src => (
              <SourcePill key={src} url={src} />
            ))}
          </div>
        )}

        {/* Answer */}
        <div
          className="prose-cove"
          dangerouslySetInnerHTML={{ __html: parseMarkdown(message.content) }}
        />

        {/* Actions */}
        <div className="flex items-center gap-1 mt-4 pt-3 border-t border-border/50">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            data-testid="copy-btn"
          >
            <Copy size={12} />
            {copied ? "Copied!" : "Copy"}
          </button>
          <button className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all" data-testid="thumbsup-btn">
            <ThumbsUp size={13} />
          </button>
          <button className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all" data-testid="thumbsdown-btn">
            <ThumbsDown size={13} />
          </button>
          <button className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all" data-testid="share-btn">
            <Share2 size={13} />
          </button>
          <button className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all ml-auto" data-testid="bookmark-btn">
            <BookmarkPlus size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ConversationPage() {
  const params = useParams<{ id: string }>();
  const convId = Number(params.id);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data: conversation } = useQuery<Conversation>({
    queryKey: ["/api/conversations", convId],
    queryFn: () => apiRequest("GET", `/api/conversations/${convId}`).then(r => r.json()),
    enabled: !!convId,
  });

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/conversations", convId, "messages"],
    queryFn: () => apiRequest("GET", `/api/conversations/${convId}/messages`).then(r => r.json()),
    enabled: !!convId,
  });

  const sendMessage = useMutation({
    mutationFn: (content: string) =>
      apiRequest("POST", `/api/conversations/${convId}/messages`, { content }).then(r => r.json()),
    onMutate: () => setIsThinking(true),
    onSuccess: () => {
      setIsThinking(false);
      qc.invalidateQueries({ queryKey: ["/api/conversations", convId, "messages"] });
    },
    onError: () => setIsThinking(false),
  });

  const handleSend = () => {
    const q = input.trim();
    if (!q || sendMessage.isPending) return;
    setInput("");
    sendMessage.mutate(q);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  return (
    <AppLayout currentConvId={convId}>
      <div className="flex flex-col h-full">
        {/* Thread header */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-border bg-background/80 backdrop-blur-sm shrink-0">
          <Search size={14} className="text-muted-foreground" />
          <h1 className="text-sm font-medium truncate flex-1" data-testid="conv-title">
            {conversation?.title ?? "Loading..."}
          </h1>
          <Button variant="ghost" size="icon" className="h-7 w-7" data-testid="conv-share">
            <Share2 size={13} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" data-testid="conv-more">
            <MoreHorizontal size={13} />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8" data-testid="messages-area">
          <div className="max-w-2xl mx-auto space-y-8">
            {isLoading && (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton h-4 rounded" style={{ width: `${60 + i * 15}%` }} />
                ))}
              </div>
            )}

            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {isThinking && <ThinkingIndicator />}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="px-4 py-4 border-t border-border bg-background/90 backdrop-blur-sm shrink-0">
          <div className="max-w-2xl mx-auto">
            <div className="search-bar" data-testid="followup-bar">
              <Search size={16} className="text-muted-foreground shrink-0" />
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask a follow-up question..."
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                className="flex-1 bg-transparent border-none outline-none resize-none font-inherit text-sm text-foreground placeholder:text-muted-foreground min-h-[24px] max-h-[120px]"
                style={{ lineHeight: 1.5 }}
                data-testid="followup-input"
              />
              <Button
                size="icon"
                className="h-8 w-8 bg-primary hover:bg-primary/90 rounded-lg shrink-0"
                onClick={handleSend}
                disabled={!input.trim() || sendMessage.isPending}
                data-testid="followup-submit"
              >
                {sendMessage.isPending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ArrowUp size={15} />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              Covelligent can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
