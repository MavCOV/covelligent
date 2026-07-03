import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { LogoWordmark, Logo } from "@/components/Logo";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import {
  Plus, Search, Clock, Bookmark, Settings, Moon, Sun,
  ChevronLeft, ChevronRight, Trash2, MoreHorizontal, User,
  Zap, Home, MessageCircle
} from "lucide-react";
import type { Conversation, User as UserType } from "@shared/schema";

interface Props {
  children: React.ReactNode;
  currentConvId?: number;
}

export default function AppLayout({ children, currentConvId }: Props) {
  const [, navigate] = useLocation();
  const { theme, toggle } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const qc = useQueryClient();

  const { data: user } = useQuery<UserType>({
    queryKey: ["/api/demo-user"],
    queryFn: () => apiRequest("GET", "/api/demo-user").then(r => r.json()),
  });

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/users", user?.id, "conversations"],
    queryFn: () => apiRequest("GET", `/api/users/${user!.id}/conversations`).then(r => r.json()),
    enabled: !!user,
  });

  const deleteConv = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/conversations/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/users", user?.id, "conversations"] });
      navigate("/app");
    },
  });

  const initials = user?.name?.split(" ").map(n => n[0]).join("") ?? "U";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={`flex flex-col border-r border-border bg-card transition-all duration-300 shrink-0 ${
          collapsed ? "w-14" : "w-64"
        }`}
        data-testid="sidebar"
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-border h-14 shrink-0">
          {!collapsed && <LogoWordmark className="scale-90 origin-left" />}
          {collapsed && <Logo size={26} className="mx-auto" />}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground ml-auto"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            data-testid="sidebar-toggle"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* New search */}
        <div className="px-2 py-3 border-b border-border">
          <button
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium text-sm ${
              collapsed ? "justify-center px-2" : ""
            }`}
            onClick={() => navigate("/app")}
            data-testid="new-search-btn"
          >
            <Plus size={16} />
            {!collapsed && "New search"}
          </button>
        </div>

        {/* Nav items */}
        <div className="px-2 py-2 border-b border-border space-y-1">
          {[
            { icon: Home, label: "Home", href: "/app" },
            { icon: Search, label: "Discover", href: "/app" },
            { icon: Zap, label: "Tools", href: "/tools" },
            { icon: Bookmark, label: "Collections", href: "/app" },
          ].map(item => (
            <Link key={item.label} href={item.href}>
              <div
                className={`sidebar-item ${collapsed ? "justify-center" : ""}`}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <item.icon size={16} className="shrink-0" />
                {!collapsed && item.label}
              </div>
            </Link>
          ))}
        </div>

        {/* Recent conversations */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {!collapsed && (
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
              Recent
            </div>
          )}
          <div className="space-y-0.5">
            {conversations.slice(0, 20).map(conv => (
              <div
                key={conv.id}
                className={`group relative sidebar-item ${currentConvId === conv.id ? "active" : ""} ${
                  collapsed ? "justify-center" : ""
                }`}
                onClick={() => navigate(`/app/c/${conv.id}`)}
                data-testid={`conv-${conv.id}`}
              >
                <MessageCircle size={14} className="shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate text-xs">{conv.title}</span>
                    <button
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-destructive transition-all"
                      onClick={e => { e.stopPropagation(); deleteConv.mutate(conv.id); }}
                      data-testid={`delete-conv-${conv.id}`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </>
                )}
              </div>
            ))}
            {conversations.length === 0 && !collapsed && (
              <p className="text-xs text-muted-foreground px-3 py-2">No searches yet</p>
            )}
          </div>
        </div>

        {/* Bottom actions */}
        <div className="px-2 py-2 border-t border-border space-y-1">
          <button
            onClick={toggle}
            className={`sidebar-item w-full ${collapsed ? "justify-center" : ""}`}
            data-testid="theme-toggle-sidebar"
          >
            {theme === "dark" ? <Sun size={16} className="shrink-0" /> : <Moon size={16} className="shrink-0" />}
            {!collapsed && (theme === "dark" ? "Light mode" : "Dark mode")}
          </button>

          {/* User card */}
          <div
            className={`sidebar-item cursor-default ${collapsed ? "justify-center" : ""}`}
            data-testid="user-card"
          >
            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
              {initials}
            </div>
            {!collapsed && user && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{user.name}</div>
                <div className="flex items-center gap-1">
                  <Zap size={9} className="text-amber-500" />
                  <span className="text-[10px] text-amber-500 font-medium capitalize">{user.plan}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex flex-col" data-testid="main-content">
        {children}
      </main>
    </div>
  );
}
