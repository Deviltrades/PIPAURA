import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Wallet, 
  BookOpen, 
  BarChart3, 
  Calendar, 
  LineChart,
  Newspaper,
  MapPin,
  StickyNote,
  Brain,
  FileText,
  Users,
  X,
  ArrowLeft,
  Target
} from "lucide-react";
import { PipAuraLogo } from "@/components/PipAuraLogo";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import PreviewDashboard from "@/pages/preview-dashboard";
import PreviewAnalytics from "@/pages/preview-analytics";
import PreviewCalendar from "@/pages/preview-calendar";
import PreviewJournal from "@/pages/preview-journal";
import PreviewAccounts from "@/pages/preview-accounts";
import PreviewTrades from "@/pages/preview-trades";
import PreviewCharts from "@/pages/preview-charts";
import PreviewFundamentals from "@/pages/preview-fundamentals";
import PreviewStrategy from "@/pages/preview-strategy";
import PreviewNotes from "@/pages/preview-notes";
import PreviewMentor from "@/pages/preview-mentor";
import PreviewTaxReports from "@/pages/preview-tax-reports";
import PreviewMentorDashboard from "@/pages/preview-mentor-dashboard";
import PreviewPropFirm from "@/pages/preview-prop-firm";

interface NavigationItem {
  name: string;
  id: string;
  icon: any;
  screenshotUrl: string;
  description: string;
}

const navigation: NavigationItem[] = [
  { 
    name: "Dashboard", 
    id: "dashboard",
    icon: LayoutDashboard,
    screenshotUrl: "/screenshots/dashboard.png",
    description: "Comprehensive analytics dashboard with Trader DNA Core visualization and customizable widgets"
  },
  { 
    name: "Accounts", 
    id: "accounts",
    icon: Wallet,
    screenshotUrl: "/screenshots/accounts.png",
    description: "Manage multiple trading accounts across demo, prop firm, and live accounts"
  },
  { 
    name: "Trades", 
    id: "trades",
    icon: BookOpen,
    screenshotUrl: "/screenshots/trades.png",
    description: "View and manage all your trades with advanced filtering and bulk operations"
  },
  { 
    name: "Analytics", 
    id: "analytics",
    icon: BarChart3,
    screenshotUrl: "/screenshots/analytics.png",
    description: "Deep dive analytics with Trader DNA Core, emotional correlations, and session insights"
  },
  { 
    name: "Calendar", 
    id: "calendar",
    icon: Calendar,
    screenshotUrl: "/screenshots/calendar.png",
    description: "Visual P&L calendar with consistency tracking and performance patterns"
  },
  { 
    name: "Charts", 
    id: "charts",
    icon: LineChart,
    screenshotUrl: "/screenshots/charts.png",
    description: "Interactive charts and equity curves for visual performance analysis"
  },
  { 
    name: "Fundamentals", 
    id: "fundamentals",
    icon: Newspaper,
    screenshotUrl: "/screenshots/fundamentals.png",
    description: "Real-time economic calendar and automated fundamental bias for 38+ FX pairs"
  },
  { 
    name: "Strategy/Playbook", 
    id: "strategy",
    icon: MapPin,
    screenshotUrl: "/screenshots/strategy.png",
    description: "Document and refine your trading strategies and setups"
  },
  { 
    name: "Notes", 
    id: "notes",
    icon: StickyNote,
    screenshotUrl: "/screenshots/notes.png",
    description: "Trading journal with notes, screenshots, and trade analysis"
  },
  { 
    name: "AI Trading Mentor", 
    id: "mentor",
    icon: Brain,
    screenshotUrl: "/screenshots/mentor.png",
    description: "AI-powered trading insights and performance recommendations"
  },
  { 
    name: "Mentor Dashboard", 
    id: "mentor-dashboard",
    icon: Users,
    screenshotUrl: "/screenshots/mentor-dashboard.png",
    description: "Monitor and support your trading students as a mentor"
  },
  { 
    name: "Prop Firm Tracker", 
    id: "prop-firm",
    icon: Target,
    screenshotUrl: "/screenshots/prop-firm.png",
    description: "Track and monitor your prop firm challenge progress, daily loss limits, and profit targets"
  },
  { 
    name: "Tax Reports", 
    id: "tax-reports",
    icon: FileText,
    screenshotUrl: "/screenshots/tax-reports.png",
    description: "Comprehensive tax reporting with P&L statements and export functionality"
  },
];

export default function ViewJournal() {
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState<string>("dashboard");

  const currentSection = navigation.find(item => item.id === activeSection);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Top Navigation Bar */}
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-sm z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-white hover:text-cyan-400 hover:bg-white/10"
                onClick={() => setLocation("/landing")}
                data-testid="button-back-to-landing"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <div className="scale-75">
                  <PipAuraLogo />
                </div>
              </div>
            </div>
            <Button 
              className="bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/50"
              onClick={() => setLocation("/auth")}
              data-testid="button-start-free-trial"
            >
              Start Free Trial
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-white/10 bg-slate-900/50 overflow-y-auto">
          <div className="p-4">
            <p className="text-xs text-slate-400 mb-4 px-3">NAVIGATION</p>
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    data-testid={`nav-${item.id}`}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                      isActive 
                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50" 
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="truncate">{item.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-950">
          {/* Render the actual preview component */}
          {activeSection === "dashboard" && <PreviewDashboard />}
          {activeSection === "accounts" && <PreviewAccounts />}
          {activeSection === "journal" && <PreviewJournal />}
          {activeSection === "trades" && <PreviewTrades />}
          {activeSection === "analytics" && <PreviewAnalytics />}
          {activeSection === "calendar" && <PreviewCalendar />}
          {activeSection === "charts" && <PreviewCharts />}
          {activeSection === "fundamentals" && <PreviewFundamentals />}
          {activeSection === "strategy" && <PreviewStrategy />}
          {activeSection === "notes" && <PreviewNotes />}
          {activeSection === "mentor" && <PreviewMentor />}
          {activeSection === "mentor-dashboard" && <PreviewMentorDashboard />}
          {activeSection === "prop-firm" && <PreviewPropFirm />}
          {activeSection === "tax-reports" && <PreviewTaxReports />}
          
          {/* Show placeholder for sections without preview components */}
          {!["dashboard", "accounts", "journal", "trades", "analytics", "calendar", "charts", "fundamentals", "strategy", "notes", "mentor", "mentor-dashboard", "prop-firm", "tax-reports"].includes(activeSection) && (
            <div className="p-8">
              {/* Section Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                      {currentSection?.name}
                    </h1>
                    <p className="text-slate-400">
                      {currentSection?.description}
                    </p>
                  </div>
                  <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-4 py-2">
                    <p className="text-sm text-cyan-400">📸 Screenshot Coming Soon</p>
                  </div>
                </div>
                <div className="h-px bg-gradient-to-r from-cyan-500/50 via-transparent to-transparent"></div>
              </div>

              {/* Screenshot Placeholder */}
              <div 
                className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-900"
                data-testid={`screenshot-${activeSection}`}
              >
                <div className="aspect-video relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-8xl mb-4">📸</div>
                      <p className="text-slate-500 text-lg font-medium">
                        {currentSection?.name} Preview
                      </p>
                      <p className="text-slate-600 text-sm mt-2">
                        Live preview coming soon
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Card */}
              <div className="mt-8 bg-gradient-to-br from-cyan-600/10 to-blue-600/10 border border-cyan-500/20 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-2">
                  💡 Live Preview Available
                </h3>
                <p className="text-slate-400 text-sm">
                  Dashboard, Accounts, Journal, Trades, Analytics, Calendar, Charts, Fundamentals, Strategy, Notes, AI Mentor, Mentor Dashboard, and Tax Reports pages are available as live previews with interactive components and demo data. 
                  More sections coming soon!
                </p>
              </div>

              {/* CTA */}
              <div className="mt-8 text-center">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-xl shadow-cyan-500/30"
                  onClick={() => setLocation("/auth")}
                  data-testid="button-get-started-cta"
                >
                  Start Using PipAura Journal
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>


      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
