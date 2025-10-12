import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ThemeProvider } from "@/components/ThemeProvider";
import { UserProfileProvider } from "@/hooks/use-user-profile";
import MainPage from "@/pages/main";
import Landing from "@/pages/landing";
import Pricing from "@/pages/pricing";
import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import Trades from "@/pages/trades";
import Calendar from "@/pages/calendar";
import Analytics from "@/pages/analytics";
import Signals from "@/pages/signals";
import Accounts from "@/pages/accounts";
import Widgets from "@/pages/widgets";
import Strategy from "@/pages/strategy";
import Notes from "@/pages/notes";
import Charts from "@/pages/charts";
import Fundamentals from "@/pages/fundamentals";
import Mentor from "@/pages/mentor";
import TaxReports from "@/pages/tax-reports";
import Settings from "@/pages/settings";
import CalendarSettings from "@/pages/CalendarSettings";
import Journal from "@/pages/journal";
import Layout from "@/components/Layout";
import NotFound from "@/pages/not-found";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      {!user ? (
        <>
          <Route path="/" component={MainPage} />
          <Route path="/landing" component={Landing} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/auth" component={AuthPage} />
        </>
      ) : (
        <Layout>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/journal" component={Journal} />
          <Route path="/signals" component={Signals} />
          <Route path="/trades" component={Trades} />
          <Route path="/calendar" component={Calendar} />
          <Route path="/accounts" component={Accounts} />
          <Route path="/widgets" component={Widgets} />
          <Route path="/strategy" component={Strategy} />
          <Route path="/notes" component={Notes} />
          <Route path="/charts" component={Charts} />
          <Route path="/fundamentals" component={Fundamentals} />
          <Route path="/mentor" component={Mentor} />
          <Route path="/tax-reports" component={TaxReports} />
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
          <AuthProvider>
            <UserProfileProvider>
              <Toaster />
              <Router />
            </UserProfileProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
