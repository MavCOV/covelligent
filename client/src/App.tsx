import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ThemeProvider";

import Landing from "@/pages/landing";
import AppHome from "@/pages/app";
import Conversation from "@/pages/conversation";
import Pricing from "@/pages/pricing";
import Tools from "@/pages/tools";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/index";
import NotFound from "@/pages/not-found";

export default function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router hook={useHashLocation}>
          <Switch>
            <Route path="/" component={Landing} />
            <Route path="/app" component={AppHome} />
            <Route path="/app/c/:id" component={Conversation} />
            <Route path="/pricing" component={Pricing} />
            <Route path="/tools" component={Tools} />
            <Route path="/admin/login" component={AdminLogin} />
            <Route path="/admin" component={AdminDashboard} />
            <Route component={NotFound} />
          </Switch>
        </Router>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
