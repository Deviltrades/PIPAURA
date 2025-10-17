import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, TrendingUp, Building2, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function Pricing() {
  const [, setLocation] = useLocation();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const litePlan = {
    name: "Lite",
    description: "All of the core plan features but limited to 1 account",
    monthlyPrice: 4.99,
    yearlyPrice: 49.99,
    icon: TrendingUp,
    features: [
      "1 Trading Account",
      "Unlimited Trade Logging",
      "Advanced Analytics Dashboard",
      "Trader DNA Core Visualization",
      "Smart Calendar with Filters",
      "Multi-Format Trade Import (CSV, Excel, HTML)",
      "Automated Trade Enrichment",
      "Session Detection (London/NY/Asia)",
      "Prop Firm Challenge Tracker",
      "Real-time Fundamental Analysis",
      "Limited to 15 Image Uploads/Month",
      "Email Support"
    ],
    popular: false,
    cta: "Start Lite"
  };

  const plans = [
    {
      name: "Core",
      description: "Perfect for individual traders",
      monthlyPrice: 14,
      yearlyPrice: 114,
      icon: TrendingUp,
      features: [
        "Up to 5 Trading Accounts",
        "Unlimited Trade Logging",
        "Advanced Analytics Dashboard",
        "Trader DNA Core Visualization",
        "Smart Calendar with Filters",
        "Multi-Format Trade Import (CSV, Excel, HTML)",
        "Automated Trade Enrichment",
        "Session Detection (London/NY/Asia)",
        "Prop Firm Challenge Tracker",
        "Real-time Fundamental Analysis",
        "Economic Calendar & News",
        "Unlimited Image Uploads",
        "Email Support"
      ],
      popular: true,
      cta: "Start Core"
    },
    {
      name: "Institutional",
      description: "Built for professional trading teams",
      monthlyPrice: 24,
      yearlyPrice: 230,
      icon: Building2,
      features: [
        "Everything in Core, plus:",
        "Unlimited Trading Accounts",
        "Team Collaboration Tools",
        "Custom Report Generation",
        "Advanced Tax Reporting",
        "API Access for Integrations",
        "Bulk Data Export",
        "White-label Options",
        "Multi-user Account Management",
        "Priority Support (24/7)",
        "Dedicated Account Manager",
        "Custom Feature Requests",
        "Early Access to New Features"
      ],
      popular: false,
      cta: "Start Institutional"
    }
  ];

  const getPrice = (plan: typeof plans[0]) => {
    return billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
  };

  const getSavings = (plan: typeof plans[0]) => {
    const yearlyTotal = plan.monthlyPrice * 12;
    const savings = yearlyTotal - plan.yearlyPrice;
    const percentage = Math.round((savings / yearlyTotal) * 100);
    return { amount: savings, percentage };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/30 to-slate-950">
      {/* Header */}
      <nav className="border-b border-white/10 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <button 
                onClick={() => setLocation("/")}
                className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 transition-all"
                data-testid="link-home"
              >
                PipAura
              </button>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                className="text-white hover:text-cyan-400 hover:bg-white/10"
                onClick={() => setLocation("/")}
                data-testid="button-back-home"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <Button 
                className="bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/50"
                onClick={() => setLocation("/auth")}
                data-testid="button-sign-in"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-16 lg:py-24">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Trading Plan</span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
            Join thousands of traders who are elevating their performance with PipAura. 
            Select the plan that matches your trading journey.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm ${billingCycle === "monthly" ? "text-white font-semibold" : "text-slate-400"}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
              className="relative w-14 h-7 bg-slate-700 rounded-full transition-colors hover:bg-slate-600"
              data-testid="toggle-billing"
            >
              <div 
                className={`absolute top-1 left-1 w-5 h-5 bg-cyan-500 rounded-full transition-transform ${
                  billingCycle === "yearly" ? "translate-x-7" : ""
                }`}
              />
            </button>
            <span className={`text-sm ${billingCycle === "yearly" ? "text-white font-semibold" : "text-slate-400"}`}>
              Yearly
            </span>
            {billingCycle === "yearly" && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                Save up to 32%
              </Badge>
            )}
          </div>
        </div>

        {/* Pricing Plans with Lightning Connectors */}
        <div className="relative max-w-5xl mx-auto">
          {/* Lightning SVG Connectors - Hidden on mobile, visible on desktop */}
          <svg 
            className="hidden md:block absolute top-0 left-0 w-full pointer-events-none" 
            viewBox="0 0 1000 800"
            style={{ height: '800px', zIndex: 0 }}
          >
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <linearGradient id="lightning-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="1" />
                <stop offset="50%" stopColor="#06b6d4" stopOpacity="1" />
                <stop offset="100%" stopColor="#0891b2" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            
            {/* Lightning from Lite (center top) to Core (bottom left) - zigzag pattern */}
            <path
              d="M 500 260 L 380 310 L 400 315 L 350 360 L 370 365 L 280 420"
              stroke="url(#lightning-gradient)"
              strokeWidth="4"
              fill="none"
              filter="url(#glow)"
              className="animate-pulse"
            />
            
            {/* Lightning from Lite (center top) to Institutional (bottom right) - zigzag pattern */}
            <path
              d="M 500 260 L 620 310 L 600 315 L 650 360 L 630 365 L 720 420"
              stroke="url(#lightning-gradient)"
              strokeWidth="4"
              fill="none"
              filter="url(#glow)"
              className="animate-pulse"
              style={{ animationDelay: '0.5s' }}
            />
          </svg>

          {/* Lite Plan - Smaller Box */}
          <div className="max-w-md mx-auto mb-8 relative" style={{ zIndex: 1 }}>
            <Card 
              className="bg-slate-900/50 border-slate-700 hover:border-cyan-500/50 transition-all duration-300 backdrop-blur-sm"
              data-testid="card-plan-lite"
            >
              <CardHeader className="text-center pb-3">
                <CardTitle className="text-xl text-white">{litePlan.name}</CardTitle>
                <p className="text-slate-400 text-xs mt-1">{litePlan.description}</p>
                
                <div className="mt-4">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-slate-400 text-base">£</span>
                    <span className="text-3xl font-bold text-white">{billingCycle === "monthly" ? litePlan.monthlyPrice : litePlan.yearlyPrice}</span>
                    <span className="text-slate-400 text-sm">
                      /{billingCycle === "monthly" ? "month" : "year"}
                    </span>
                  </div>
                  
                  {billingCycle === "yearly" && (
                    <p className="text-xs text-green-400 mt-1">
                      Save £{((litePlan.monthlyPrice * 12) - litePlan.yearlyPrice).toFixed(2)}/year
                    </p>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-2 mb-4">
                  {litePlan.features.slice(0, 5).map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="h-3 w-3 text-cyan-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  size="sm" 
                  className="w-full bg-cyan-500/30 hover:bg-cyan-500/50 text-cyan-300 border border-cyan-500/40"
                  onClick={() => setLocation("/auth")}
                  data-testid="button-cta-lite"
                >
                  {litePlan.cta}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 relative" style={{ zIndex: 1 }}>
          {plans.map((plan) => {
            const IconComponent = plan.icon;
            const savings = getSavings(plan);
            
            return (
              <Card 
                key={plan.name} 
                className={`relative bg-slate-900/50 border-slate-700 hover:border-cyan-500/50 transition-all duration-300 h-full flex flex-col backdrop-blur-sm ${
                  plan.popular ? 'border-cyan-500 shadow-xl shadow-cyan-500/20' : ''
                }`}
                data-testid={`card-plan-${plan.name.toLowerCase()}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-none">
                    Most Popular
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className={`p-3 rounded-full ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600' 
                        : 'bg-slate-800'
                    }`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl text-white">{plan.name}</CardTitle>
                  <p className="text-slate-400 text-sm mt-2">{plan.description}</p>
                  
                  <div className="mt-6">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-slate-400 text-lg">£</span>
                      <span className="text-5xl font-bold text-white">{getPrice(plan)}</span>
                      <span className="text-slate-400">
                        /{billingCycle === "monthly" ? "month" : "year"}
                      </span>
                    </div>
                    
                    {billingCycle === "yearly" && (
                      <div className="mt-2">
                        <p className="text-sm text-green-400">
                          Save £{savings.amount}/year ({savings.percentage}% off)
                        </p>
                        <p className="text-xs text-slate-500">
                          £{(plan.yearlyPrice / 12).toFixed(2)}/month when billed annually
                        </p>
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-3 mb-6 flex-1">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Check className="h-4 w-4 text-cyan-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-slate-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    size="lg" 
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/30' 
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                    onClick={() => setLocation("/auth")}
                    data-testid={`button-cta-${plan.name.toLowerCase()}`}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-wrap gap-6 justify-center text-sm text-slate-400 mb-16">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-400" />
            <span>No Credit Card Required</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-400" />
            <span>Cancel Anytime</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-400" />
            <span>Instant Access</span>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-12">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="text-left bg-slate-900/50 p-6 rounded-lg border border-slate-700">
              <h3 className="font-semibold text-white mb-2">How quickly can I get started?</h3>
              <p className="text-slate-400 text-sm">
                You get instant access to all features immediately after signup. Start logging trades and analyzing your performance right away.
              </p>
            </div>
            <div className="text-left bg-slate-900/50 p-6 rounded-lg border border-slate-700">
              <h3 className="font-semibold text-white mb-2">Can I switch between plans?</h3>
              <p className="text-slate-400 text-sm">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately with prorated billing.
              </p>
            </div>
            <div className="text-left bg-slate-900/50 p-6 rounded-lg border border-slate-700">
              <h3 className="font-semibold text-white mb-2">Is my trading data secure?</h3>
              <p className="text-slate-400 text-sm">
                Absolutely. We use enterprise-grade encryption and Supabase's secure infrastructure to protect all your trading data.
              </p>
            </div>
            <div className="text-left bg-slate-900/50 p-6 rounded-lg border border-slate-700">
              <h3 className="font-semibold text-white mb-2">What if I need to cancel?</h3>
              <p className="text-slate-400 text-sm">
                You can cancel anytime with no questions asked. Your data remains accessible until the end of your billing period.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 rounded-3xl p-12 text-center backdrop-blur-sm">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Trading?
          </h2>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
            Join thousands of traders using PipAura to track, analyze, and improve their performance
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="text-lg px-10 py-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-xl shadow-cyan-500/30"
              onClick={() => setLocation("/auth")}
              data-testid="button-cta-start"
            >
              Start Now
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-10 py-6 border-2 border-white/30 text-white hover:bg-white/10"
              onClick={() => setLocation("/")}
              data-testid="button-back-to-home"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
