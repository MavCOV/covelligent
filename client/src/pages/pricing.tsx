import { useState } from "react";
import { useLocation } from "wouter";
import { LogoWordmark } from "@/components/Logo";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check, ArrowLeft, Moon, Sun, Zap, Shield, Clock,
  CreditCard, RefreshCw, Star, HelpCircle, ChevronDown
} from "lucide-react";
import { useState as useAccordionState } from "react";

const PRO_FEATURES = [
  "Unlimited searches per day",
  "Access to all frontier AI models (GPT-5, Claude 4, Gemini Ultra)",
  "Real-time web search with live indexing",
  "Deep research mode — multi-step agent reasoning",
  "Full source citations with export (PDF, Markdown)",
  "Unlimited conversation history forever",
  "Research collections & saved searches",
  "File upload & analysis (PDF, CSV, images)",
  "API access (100k tokens/mo included)",
  "Priority queue — no wait times",
  "Early access to beta features",
  "Priority email & chat support",
];

const FREE_FEATURES = [
  "10 searches per day",
  "Standard AI model (GPT-4o)",
  "Basic web search",
  "Source citations",
  "7-day conversation history",
];

const FAQS = [
  {
    q: "What happens after my 14-day trial?",
    a: "After your trial ends, you'll be charged $24.99/month. You can cancel any time before the trial ends and you won't be charged anything.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes, absolutely. You can cancel your subscription at any time from your account settings. You'll retain Pro access until the end of your current billing period.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and Apple Pay / Google Pay.",
  },
  {
    q: "Is there a student or educational discount?",
    a: "Yes! Students and educators get 40% off with a valid .edu email address. Contact support to apply your discount.",
  },
  {
    q: "What's the difference between Covelligent and a regular AI chatbot?",
    a: "Covelligent searches the live web in real time and provides cited, up-to-date answers — not just training data from months ago. Every answer includes the sources it came from, so you can verify and go deeper.",
  },
  {
    q: "Is my search history private?",
    a: "Yes. Your searches are never sold or shared with third parties. We offer optional zero-retention mode where searches are never stored on our servers.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border-b border-border py-4 cursor-pointer"
      onClick={() => setOpen(o => !o)}
      data-testid={`faq-${q.slice(0, 20).toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="font-medium text-sm">{q}</span>
        <ChevronDown
          size={16}
          className={`text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>
      {open && (
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{a}</p>
      )}
    </div>
  );
}

export default function PricingPage() {
  const [, navigate] = useLocation();
  const { theme, toggle } = useTheme();
  const [annual, setAnnual] = useState(false);

  const monthlyPrice = 24.99;
  const annualPrice = (monthlyPrice * 0.8).toFixed(2); // 20% discount
  const displayPrice = annual ? annualPrice : monthlyPrice.toFixed(2);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
            data-testid="back-btn"
          >
            <ArrowLeft size={16} />
            <LogoWordmark />
          </button>
          <button
            onClick={toggle}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            data-testid="theme-toggle"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      <div className="pt-28 pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4 text-xs">
              <Zap size={11} className="mr-1.5 text-amber-500" />
              Covelligent Pro
            </Badge>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Upgrade your intelligence
            </h1>
            <p className="text-muted-foreground text-base max-w-xl mx-auto">
              Everything you need to research faster, think deeper, and know more.
            </p>

            {/* Toggle */}
            <div className="flex items-center justify-center gap-3 mt-8">
              <span className={`text-sm ${!annual ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                Monthly
              </span>
              <button
                onClick={() => setAnnual(a => !a)}
                className={`relative w-12 h-6 rounded-full transition-colors ${annual ? "bg-primary" : "bg-muted"}`}
                data-testid="billing-toggle"
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${annual ? "left-7" : "left-1"}`} />
              </button>
              <span className={`text-sm ${annual ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                Annual
                <Badge variant="secondary" className="ml-2 text-[10px] text-emerald-600 bg-emerald-500/10 border-emerald-500/20">
                  Save 20%
                </Badge>
              </span>
            </div>
          </div>

          {/* Plans */}
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-16">
            {/* Free */}
            <div className="rounded-2xl border border-border bg-card p-8" data-testid="free-plan">
              <div className="mb-2">
                <h2 className="font-display font-bold text-2xl">Free</h2>
              </div>
              <p className="text-muted-foreground text-sm mb-6">Start exploring, no commitment</p>
              <div className="mb-8">
                <span className="font-display text-5xl font-bold">$0</span>
                <span className="text-muted-foreground text-sm ml-1">/month</span>
              </div>
              <Button
                variant="outline"
                size="lg"
                className="w-full mb-8"
                onClick={() => navigate("/app")}
                data-testid="free-cta"
              >
                Start for free
              </Button>
              <div className="space-y-3">
                {FREE_FEATURES.map(f => (
                  <div key={f} className="flex items-start gap-2.5">
                    <Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pro */}
            <div
              className="rounded-2xl border-2 border-primary bg-card p-8 relative overflow-hidden shadow-xl shadow-primary/10"
              data-testid="pro-plan"
            >
              {/* Glow */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/15 rounded-full blur-3xl -translate-y-16 translate-x-16" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl translate-y-8 -translate-x-8" />

              <Badge className="absolute top-6 right-6 bg-primary text-primary-foreground text-xs relative z-10">
                <Star size={10} className="mr-1 fill-current" />
                Most popular
              </Badge>

              <div className="relative mb-2">
                <h2 className="font-display font-bold text-2xl">Pro</h2>
              </div>
              <p className="text-muted-foreground text-sm mb-6 relative">Full power, unlimited access</p>
              <div className="mb-2 relative">
                <span className="font-display text-5xl font-bold" data-testid="pro-price">
                  ${displayPrice}
                </span>
                <span className="text-muted-foreground text-sm ml-1">/month</span>
              </div>
              {annual && (
                <p className="text-xs text-emerald-500 font-medium mb-4">
                  Billed as ${(Number(annualPrice) * 12).toFixed(2)}/year — save $59.88
                </p>
              )}
              {!annual && <div className="mb-6" />}

              <Button
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 mb-2 relative font-semibold"
                onClick={() => navigate("/app")}
                data-testid="pro-cta"
              >
                Start 14-day free trial
              </Button>
              <p className="text-xs text-center text-muted-foreground mb-8">
                No credit card required to start
              </p>

              <div className="space-y-2.5 relative">
                {PRO_FEATURES.map(f => (
                  <div key={f} className="flex items-start gap-2.5">
                    <Check size={14} className="text-primary mt-0.5 shrink-0" />
                    <span className="text-sm">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-16 text-sm text-muted-foreground">
            {[
              { icon: Shield, text: "256-bit encryption" },
              { icon: CreditCard, text: "Secure payment via Stripe" },
              { icon: RefreshCw, text: "Cancel anytime" },
              { icon: Clock, text: "14-day free trial" },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-2">
                <item.icon size={15} className="text-primary" />
                {item.text}
              </div>
            ))}
          </div>

          {/* Testimonial strip */}
          <div className="rounded-2xl border border-border bg-card p-8 mb-16">
            <div className="flex items-center gap-1 mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={14} className="text-amber-500 fill-amber-500" />
              ))}
              <span className="text-sm text-muted-foreground ml-2">Rated 4.9/5 from 3,000+ reviews</span>
            </div>
            <blockquote className="text-base md:text-lg font-medium mb-4">
              "Covelligent Pro has become the first tool I open every morning. The research depth is unreal — it replaces a 2-hour reading session in 10 minutes."
            </blockquote>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold">
                JH
              </div>
              <div>
                <div className="font-semibold text-sm">James Hoffman</div>
                <div className="text-xs text-muted-foreground">Tech Analyst, Bloomberg</div>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <HelpCircle size={18} className="text-muted-foreground" />
              <h2 className="font-display font-bold text-xl">Frequently asked questions</h2>
            </div>
            <div>
              {FAQS.map(faq => (
                <FaqItem key={faq.q} q={faq.q} a={faq.a} />
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-8 text-center">
              Still have questions?{" "}
              <a href="mailto:hello@cove.ai" className="text-primary hover:underline">
                Contact our team
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
