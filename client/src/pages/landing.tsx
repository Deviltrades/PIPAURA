import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  TrendingUp, 
  BarChart3, 
  Calendar, 
  Signal, 
  Shield, 
  Zap,
  Brain,
  Target,
  LineChart,
  ArrowRight,
  Check
} from "lucide-react";
import { PipAuraLogo } from "@/components/PipAuraLogo";
import { useLocation } from "wouter";
import calendarImage from "@assets/image_1760701750968.png";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Navigation Header */}
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="scale-50 sm:scale-75">
                <PipAuraLogo />
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Button 
                variant="ghost" 
                className="text-white hover:text-cyan-400 hover:bg-white/10 text-xs sm:text-sm px-2 sm:px-4 hidden sm:inline-flex"
                onClick={() => setLocation("/view-journal")}
                data-testid="button-view-journal"
              >
                View Demo
              </Button>
              <Button 
                variant="ghost" 
                className="text-white hover:text-cyan-400 hover:bg-white/10 text-xs sm:text-sm px-2 sm:px-4"
                onClick={() => setLocation("/pricing")}
                data-testid="button-pricing"
              >
                Pricing
              </Button>
              <Button 
                className="bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/50 text-xs sm:text-sm px-3 sm:px-4"
                onClick={() => setLocation("/auth")}
                data-testid="button-login"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-3 sm:px-4 py-10 sm:py-16 lg:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mb-6 sm:mb-8">
            <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
            <span className="text-xs sm:text-sm text-cyan-300">Professional Trading Analytics Platform</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight px-2">
            Elevate Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Trading Edge</span>
          </h1>
          
          <p className="text-sm sm:text-base lg:text-xl text-slate-300 mb-3 sm:mb-4 max-w-2xl mx-auto leading-relaxed px-4">
            The comprehensive trading journal built for serious traders. Advanced analytics, 
            automated insights, and performance tracking that transforms your trading journey.
          </p>
          
          <p className="text-sm sm:text-base lg:text-lg text-cyan-400 mb-6 sm:mb-8 lg:mb-10 max-w-2xl mx-auto font-medium italic px-4">
            "Powered by elite Fundamental Scorecards — institutional precision for retail traders."
          </p>

          {/* Calendar Preview Image */}
          <div className="mb-6 sm:mb-8 lg:mb-10 mx-auto relative group cursor-pointer max-w-[80%] sm:max-w-[60%] lg:max-w-[40%]" onClick={() => setLocation("/view-journal")}>
            <img 
              src={calendarImage} 
              alt="PipAura Calendar Analytics Dashboard" 
              className="rounded-xl sm:rounded-2xl shadow-2xl shadow-cyan-500/20 border border-cyan-500/30 w-full transition-all group-hover:brightness-75"
              data-testid="img-calendar-preview"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                size="lg"
                className="text-sm sm:text-base lg:text-lg px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-xl shadow-cyan-500/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                data-testid="button-view-demo"
              >
                View Demo
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8 sm:mb-12 px-4">
            <Button 
              size="lg" 
              className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-xl shadow-cyan-500/30 group"
              onClick={() => setLocation("/auth")}
              data-testid="button-get-started"
            >
              What's Included
              <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 border-2 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400"
              onClick={() => setLocation("/pricing")}
              data-testid="button-view-pricing"
            >
              View Pricing
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap gap-3 sm:gap-4 lg:gap-6 justify-center text-xs sm:text-sm text-slate-400 px-4">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
              <span>More power, precision, and value than any other trading journal.</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
              <span>Demo Sneak Peek to get an idea of whats inside</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
              <span>Upgrade/Downgrade As Needed</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
              <span>Cancel Anytime</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-3 sm:px-4 py-10 sm:py-16 lg:py-20 bg-gradient-to-br from-slate-900/50 to-slate-800/30 rounded-2xl sm:rounded-3xl mb-10 sm:mb-16 lg:mb-20">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16 px-4">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-sm sm:text-base lg:text-xl text-slate-400 max-w-2xl mx-auto">
            Professional-grade tools designed to give you a competitive edge in the markets
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Feature Cards */}
          <Card 
            className="bg-slate-800/50 border-slate-700/50 hover:border-cyan-500/50 transition-all group cursor-pointer"
            onClick={() => setLocation("/preview/analytics")}
            data-testid="card-trader-dna"
          >
            <CardContent className="p-4 sm:p-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">Trader DNA Core</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Visualize your trading psychology with our unique DNA Core visualization. Track emotional control, discipline, and edge metrics in real-time.
              </p>
            </CardContent>
          </Card>

          <Card 
            className="bg-slate-800/50 border-slate-700/50 hover:border-cyan-500/50 transition-all group cursor-pointer"
            onClick={() => setLocation("/preview/dashboard")}
            data-testid="card-advanced-analytics"
          >
            <CardContent className="p-4 sm:p-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">Advanced Analytics</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Win rates, profit factors, Sharpe ratios, and custom metrics. See exactly where your edge comes from.
              </p>
            </CardContent>
          </Card>

          <Card 
            className="bg-slate-800/50 border-slate-700/50 hover:border-cyan-500/50 transition-all group cursor-pointer"
            onClick={() => setLocation("/preview/calendar")}
            data-testid="card-smart-calendar"
          >
            <CardContent className="p-4 sm:p-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">Smart Calendar</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Visual P&L tracking, consistency monitoring, and pattern identification. Know your best and worst trading days.
              </p>
            </CardContent>
          </Card>

          <Card 
            className="bg-slate-800/50 border-slate-700/50 hover:border-cyan-500/50 transition-all group cursor-pointer"
            onClick={() => setLocation("/preview/accounts")}
            data-testid="card-multi-account"
          >
            <CardContent className="p-4 sm:p-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                <Target className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">Multi-Account Management</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Track demo, prop firm, and live accounts separately. Compare performance across different strategies.
              </p>
            </CardContent>
          </Card>

          <Card 
            className="bg-slate-800/50 border-slate-700/50 hover:border-cyan-500/50 transition-all group cursor-pointer"
            onClick={() => setLocation("/preview/fundamentals")}
            data-testid="card-fundamental-analysis"
          >
            <CardContent className="p-4 sm:p-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                <LineChart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">Fundamental Analysis</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Real-time economic calendar, automated bias calculation for 38+ FX pairs, and live market news integration.
              </p>
            </CardContent>
          </Card>

          <Card 
            className="bg-slate-800/50 border-slate-700/50 hover:border-cyan-500/50 transition-all group cursor-pointer"
            onClick={() => setLocation("/preview/mentor-dashboard")}
            data-testid="card-mentor"
          >
            <CardContent className="p-4 sm:p-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">Mentor</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Connect with experienced traders and mentors. Get personalized guidance to accelerate your trading journey.
              </p>
            </CardContent>
          </Card>

          <Card 
            className="bg-slate-800/50 border-slate-700/50 hover:border-cyan-500/50 transition-all group cursor-pointer"
            onClick={() => setLocation("/preview/trades")}
            data-testid="card-trade-import"
          >
            <CardContent className="p-4 sm:p-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">Trade Import</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Upload trades from MT4/MT5, CSV, Excel, or screenshots. AI-powered OCR extracts trade data automatically.
              </p>
            </CardContent>
          </Card>

          <Card 
            className="bg-slate-800/50 border-slate-700/50 hover:border-cyan-500/50 transition-all group cursor-pointer"
            onClick={() => setLocation("/preview/tax-reports")}
            data-testid="card-tax-reports"
          >
            <CardContent className="p-4 sm:p-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                <Signal className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">Tax Reports</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Generate comprehensive tax reports with detailed P&L statements and trade summaries for easy tax filing.
              </p>
            </CardContent>
          </Card>

          <Card 
            className="bg-slate-800/50 border-slate-700/50 hover:border-cyan-500/50 transition-all group cursor-pointer"
            onClick={() => setLocation("/preview/analytics?tab=emotional")}
            data-testid="card-emotional-analytics"
          >
            <CardContent className="p-4 sm:p-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">Emotional Analytics</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Track your mood and energy levels. Discover how emotions impact your trading performance.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 text-center backdrop-blur-sm">
          <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 px-4">
            Ready to Transform Your Trading?
          </h2>
          <p className="text-sm sm:text-base lg:text-xl text-slate-300 mb-6 sm:mb-8 lg:mb-10 max-w-2xl mx-auto px-4">
            Join thousands of traders who trust PipAura to track, analyze, and improve their performance
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-6 sm:mb-8 px-4">
            <Button 
              size="lg" 
              className="w-full sm:w-auto text-base sm:text-lg px-8 sm:px-10 py-5 sm:py-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-xl shadow-cyan-500/30"
              onClick={() => setLocation("/auth")}
              data-testid="button-cta-start"
            >
              Start Now
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="w-full sm:w-auto text-base sm:text-lg px-8 sm:px-10 py-5 sm:py-6 border-2 border-white/30 text-white hover:bg-white/10"
              onClick={() => setLocation("/pricing")}
              data-testid="button-cta-pricing"
            >
              View Pricing
            </Button>
          </div>

          <p className="text-xs sm:text-sm text-slate-400 px-4">
            Starting at £7.99/month • No credit card required • Cancel anytime
          </p>
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
