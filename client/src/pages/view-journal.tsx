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
  Grid3X3,
  Brain,
  FileText,
  X,
  ArrowLeft
} from "lucide-react";
import { PipAuraLogo } from "@/components/PipAuraLogo";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

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
    name: "Widgets", 
    id: "widgets",
    icon: Grid3X3,
    screenshotUrl: "/screenshots/widgets.png",
    description: "Customize your dashboard with drag-and-drop widget layouts"
  },
  { 
    name: "AI Trading Mentor", 
    id: "mentor",
    icon: Brain,
    screenshotUrl: "/screenshots/mentor.png",
    description: "AI-powered trading insights and performance recommendations"
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
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

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
                <div>
                  <span className="text-lg font-bold text-white">PipAura Journal</span>
                  <p className="text-xs text-slate-400">Preview Mode</p>
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
                <Button
                  variant="outline"
                  className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                  onClick={() => setIsLightboxOpen(true)}
                  data-testid="button-view-fullscreen"
                >
                  View Fullscreen
                </Button>
              </div>
              <div className="h-px bg-gradient-to-r from-cyan-500/50 via-transparent to-transparent"></div>
            </div>

            {/* Screenshot Display */}
            <div 
              className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-900 cursor-pointer group"
              onClick={() => setIsLightboxOpen(true)}
              data-testid={`screenshot-${activeSection}`}
            >
              {/* Aspect Ratio Container */}
              <div className="aspect-video relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-8xl mb-4">📸</div>
                    <p className="text-slate-500 text-lg font-medium">
                      Screenshot Preview
                    </p>
                    <p className="text-slate-600 text-sm mt-2">
                      {currentSection?.name} page
                    </p>
                    <p className="text-slate-700 text-xs mt-4">
                      Add screenshot at: <code className="text-cyan-500">{currentSection?.screenshotUrl}</code>
                    </p>
                  </div>
                </div>
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="text-white font-medium bg-black/50 px-6 py-3 rounded-lg">
                    Click to view fullscreen
                  </div>
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className="mt-8 bg-gradient-to-br from-cyan-600/10 to-blue-600/10 border border-cyan-500/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                💡 Interactive Preview
              </h3>
              <p className="text-slate-400 text-sm">
                Click on any menu item in the sidebar to preview different sections of the PipAura journal. 
                This is a static preview - the actual app includes full interactivity, real-time data, and advanced features.
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
        </main>
      </div>

      {/* Fullscreen Lightbox */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsLightboxOpen(false)}
          data-testid="lightbox-overlay"
        >
          <div className="relative max-w-7xl w-full">
            {/* Close Button */}
            <button
              className="absolute -top-12 right-0 text-white hover:text-cyan-400 transition-colors"
              onClick={() => setIsLightboxOpen(false)}
              data-testid="button-close-lightbox"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Section Info */}
            <div className="text-center mb-4">
              <h3 className="text-2xl font-bold text-white mb-2">
                {currentSection?.name}
              </h3>
              <p className="text-slate-400">
                {currentSection?.description}
              </p>
            </div>

            {/* Fullscreen Image */}
            <div 
              className="rounded-xl overflow-hidden bg-slate-900 border border-slate-700 aspect-video"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-9xl mb-6">📸</div>
                  <p className="text-slate-500 text-xl">
                    Fullscreen preview: {currentSection?.name}
                  </p>
                  <p className="text-slate-600 text-sm mt-2">
                    Replace with actual screenshot at:<br/>
                    <code className="text-cyan-400">{currentSection?.screenshotUrl}</code>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
