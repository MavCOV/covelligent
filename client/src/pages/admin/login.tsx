import { useState } from "react";
import { useLocation } from "wouter";
import { LogoWordmark } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Lock, Eye, EyeOff, Shield } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await apiRequest("POST", "/api/admin/login", { password });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Invalid password");
      }
      const { token } = await res.json();
      sessionStorage.setItem("covelligent_admin_token", token);
      navigate("/admin");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Shield size={28} className="text-primary" />
            </div>
          </div>
          <LogoWordmark className="justify-center mb-2" />
          <p className="text-sm text-muted-foreground mt-2">Admin access only</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Admin Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full pl-10 pr-10 py-3 rounded-xl border border-border bg-card text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                data-testid="admin-password-input"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5 font-medium">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 font-bold h-11"
            disabled={!password || loading}
            data-testid="admin-login-submit"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verifying...
              </span>
            ) : "Access Admin Dashboard"}
          </Button>
        </form>

        <p className="text-xs text-center text-muted-foreground mt-6">
          This area is restricted to Covelligent administrators only.
        </p>
      </div>
    </div>
  );
}
