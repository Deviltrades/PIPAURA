import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import Landing from "@/pages/landing";
import Pricing from "@/pages/pricing";
import Dashboard from "@/pages/dashboard";
import Trades from "@/pages/trades";
import Calendar from "@/pages/calendar";
import Analytics from "@/pages/analytics";
import Signals from "@/pages/signals";
import Positions from "@/pages/positions";
import Accounts from "@/pages/accounts";
import Widgets from "@/pages/widgets";
import Strategy from "@/pages/strategy";
import Notes from "@/pages/notes";
import Charts from "@/pages/charts";
import Mentor from "@/pages/mentor";
import Settings from "@/pages/settings";
import CalendarSettings from "@/pages/CalendarSettings";
import Layout from "@/components/Layout";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/pricing" component={Pricing} />
        </>
      ) : (
        <Layout>
          <Route path="/" component={Dashboard} />
          <Route path="/signals" component={Signals} />
          <Route path="/trades" component={Trades} />
          <Route path="/positions" component={Positions} />
          <Route path="/calendar" component={Calendar} />
          <Route path="/accounts" component={Accounts} />
          <Route path="/widgets" component={Widgets} />
          <Route path="/strategy" component={Strategy} />
          <Route path="/notes" component={Notes} />
          <Route path="/charts" component={Charts} />
          <Route path="/mentor" component={Mentor} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/settings" component={Settings} />
          <Route path="/calendar-settings" component={CalendarSettings} />
        </Layout>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
