import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LogoWordmark } from "@/components/Logo";
import { Home } from "lucide-react";

export default function NotFound() {
  const [, navigate] = useLocation();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center px-6 gap-6">
      <LogoWordmark />
      <h1 className="font-display text-6xl font-bold text-muted/30">404</h1>
      <p className="text-muted-foreground">Page not found</p>
      <Button onClick={() => navigate("/")} data-testid="home-btn">
        <Home size={16} className="mr-2" />
        Go home
      </Button>
    </div>
  );
}
