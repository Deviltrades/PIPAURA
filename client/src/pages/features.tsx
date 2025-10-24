import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft, BarChart3, Calendar, TrendingUp, Target, FileText, Users, Trophy, DollarSign } from "lucide-react";
import PipAuraLogo from "@/components/PipAuraLogo";

export default function Features() {
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: FileText,
      title: "Trading Journal",
      description: "Log every trade with comprehensive details including entry/exit prices, position sizes, stop loss, take profit, and custom notes. Upload trade confirmations and screenshots for complete documentation.",
      benefits: [
        "Manual and automated trade import (CSV, Excel, MT4/MT5)",
        "MyFxBook auto-sync integration",
        "Attachment support for trade confirmations",
        "Custom tags and strategy categorization",
      ]
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Deep dive into your trading performance with powerful analytics tools that reveal your strengths, weaknesses, and areas for improvement.",
      benefits: [
        "Win rate, profit factor, and expectancy calculations",
        "Risk-reward ratio analysis",
        "Session performance breakdown (Asia, London, NY)",
        "Instrument and asset class exposure tracking",
      ]
    },
    {
      icon: Calendar,
      title: "Interactive Calendar",
      description: "Visualize your trading activity at a glance with our intuitive calendar view. See profit/loss by day, identify patterns, and track your consistency.",
      benefits: [
        "Daily P&L heat map visualization",
        "Trading frequency tracking",
        "Customizable views (monthly, weekly)",
        "Filter by account, instrument, or strategy",
      ]
    },
    {
      icon: TrendingUp,
      title: "Dashboard Widgets",
      description: "Customize your dashboard with 18+ widget types. Drag, drop, and resize widgets to create your perfect trading command center.",
      benefits: [
        "Streak tracker and hold time analysis",
        "Monthly progress bar with custom targets",
        "Risk deviation histogram",
        "First vs last trade comparison",
      ]
    },
    {
      icon: Target,
      title: "Strategy & Playbook",
      description: "Document your trading strategies and rules. Track performance by setup type and refine your edge over time.",
      benefits: [
        "Create unlimited strategies with detailed rules",
        "Setup breakdown with win rates and P&L",
        "Performance tracking per strategy",
        "Custom tag system for trade categorization",
      ]
    },
    {
      icon: DollarSign,
      title: "Reports & Statistics",
      description: "Generate comprehensive trading reports with advanced filtering. Get insights into your best months, consecutive streaks, and detailed metrics.",
      benefits: [
        "27+ performance metrics",
        "Advanced filtering by instrument, session, and tags",
        "Date range selection for custom analysis",
        "Best/worst month tracking",
      ]
    },
    {
      icon: Trophy,
      title: "Prop Firm Tracker",
      description: "Monitor your proprietary firm challenges with real-time risk metrics and funding phase progression.",
      benefits: [
        "Daily and overall max loss tracking",
        "Profit target visualization",
        "Phase progression (Challenge → Verification → Funded)",
        "Automatic sync with trade imports",
      ]
    },
    {
      icon: Users,
      title: "Mentor-Mentee System",
      description: "Enable experienced traders to guide students with secure, read-only access to mentee accounts and performance data.",
      benefits: [
        "Email or username-based invitations",
        "Read-only access for mentors",
        "Full visibility into mentee trades and stats",
        "Secure access control",
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-white/10 sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={() => setLocation("/")}>
              <div className="scale-50 sm:scale-75">
                <PipAuraLogo />
              </div>
              <div>
                <div className="text-white font-bold text-sm sm:text-base">PipAura</div>
                <div className="text-xs sm:text-sm text-slate-400 hidden sm:block">Trading Journal</div>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="text-white hover:text-cyan-400 hover:bg-white/10 text-xs sm:text-sm px-2 sm:px-4"
              onClick={() => {
                setLocation("/");
                window.scrollTo(0, 0);
              }}
              data-testid="button-back-home"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Back to Home</span>
              <span className="sm:hidden">Home</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-12 lg:py-16">
        {/* Hero Section */}
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 px-4">
            What's Included
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-slate-300 max-w-3xl mx-auto px-4">
            Everything you need to track, analyze, and improve your trading performance in one comprehensive platform
          </p>
        </div>

        {/* Features Grid */}
        <div className="space-y-8 sm:space-y-12 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-cyan-500/30 rounded-2xl p-6 sm:p-8 backdrop-blur-sm hover:border-cyan-500/50 transition-all"
              data-testid={`feature-${index}`}
            >
              <div className="flex items-start gap-4 sm:gap-6 mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 sm:mb-3">
                    {feature.title}
                  </h2>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
              
              <div className="ml-0 sm:ml-20">
                <h3 className="text-base sm:text-lg font-semibold text-cyan-400 mb-3">Key Features:</h3>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm sm:text-base text-slate-300">
                      <span className="text-green-400 mt-1 flex-shrink-0">✓</span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-12 sm:mt-16 lg:mt-20 bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 text-center backdrop-blur-sm">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4 px-4">
            Ready to Transform Your Trading?
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-slate-300 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Join thousands of traders using PipAura to track, analyze, and improve their performance
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="w-full sm:w-auto text-base sm:text-lg px-8 sm:px-10 py-5 sm:py-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-xl shadow-cyan-500/30"
              onClick={() => {
                setLocation("/pricing");
                window.scrollTo(0, 0);
              }}
              data-testid="button-view-pricing"
            >
              View Pricing
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="w-full sm:w-auto text-base sm:text-lg px-8 sm:px-10 py-5 sm:py-6 border-2 border-white/30 text-white hover:bg-white/10"
              onClick={() => {
                setLocation("/");
                window.scrollTo(0, 0);
              }}
              data-testid="button-back-to-home"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/20">
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="scale-50 sm:scale-75">
                <PipAuraLogo />
              </div>
              <div className="text-center md:text-left">
                <div className="text-white font-bold text-sm sm:text-base">PipAura</div>
                <div className="text-xs sm:text-sm text-slate-400">Trading Journal & Analytics</div>
              </div>
            </div>
            <div className="text-xs sm:text-sm text-slate-400">
              © 2025 PipAura. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
