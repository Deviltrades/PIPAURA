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
import ResetPasswordPage from "@/pages/reset-password";
import MembershipAgreement from "@/pages/membership-agreement";
import Checkout from "@/pages/checkout";
import ViewJournal from "@/pages/view-journal";
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
import MentorDashboard from "@/pages/mentor-dashboard";
import PropFirm from "@/pages/prop-firm";
import TaxReports from "@/pages/tax-reports";
import Settings from "@/pages/settings";
import CalendarSettings from "@/pages/CalendarSettings";
import Journal from "@/pages/journal";
import Layout from "@/components/Layout";
import NotFound from "@/pages/not-found";
import PreviewPropFirm from "@/pages/preview-prop-firm";
import PreviewDashboard from "@/pages/preview-dashboard";
import PreviewJournal from "@/pages/preview-journal";
import PreviewTrades from "@/pages/preview-trades";
import PreviewAccounts from "@/pages/preview-accounts";
import PreviewAnalytics from "@/pages/preview-analytics";
import PreviewCalendar from "@/pages/preview-calendar";
import PreviewCharts from "@/pages/preview-charts";
import PreviewFundamentals from "@/pages/preview-fundamentals";
import PreviewStrategy from "@/pages/preview-strategy";
import PreviewNotes from "@/pages/preview-notes";
import PreviewMentor from "@/pages/preview-mentor";
import PreviewMentorDashboard from "@/pages/preview-mentor-dashboard";
import PreviewTaxReports from "@/pages/preview-tax-reports";

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
      {/* Reset password route available regardless of auth status */}
      <Route path="/reset-password" component={ResetPasswordPage} />
      {/* Public pages available regardless of auth status */}
      <Route path="/membership-agreement" component={MembershipAgreement} />
      <Route path="/checkout" component={Checkout} />
      
      {!user ? (
        <>
          <Route path="/" component={MainPage} />
          <Route path="/landing" component={Landing} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/view-journal" component={ViewJournal} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/preview/dashboard" component={PreviewDashboard} />
          <Route path="/preview/journal" component={PreviewJournal} />
          <Route path="/preview/trades" component={PreviewTrades} />
          <Route path="/preview/accounts" component={PreviewAccounts} />
          <Route path="/preview/analytics" component={PreviewAnalytics} />
          <Route path="/preview/calendar" component={PreviewCalendar} />
          <Route path="/preview/charts" component={PreviewCharts} />
          <Route path="/preview/fundamentals" component={PreviewFundamentals} />
          <Route path="/preview/strategy" component={PreviewStrategy} />
          <Route path="/preview/notes" component={PreviewNotes} />
          <Route path="/preview/mentor" component={PreviewMentor} />
          <Route path="/preview/mentor-dashboard" component={PreviewMentorDashboard} />
          <Route path="/preview/prop-firm" component={PreviewPropFirm} />
          <Route path="/preview/tax-reports" component={PreviewTaxReports} />
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
          <Route path="/mentor-dashboard" component={MentorDashboard} />
          <Route path="/prop-firm" component={PropFirm} />
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
