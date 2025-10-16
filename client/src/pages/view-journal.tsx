import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, ArrowRight } from "lucide-react";
import { PipAuraLogo } from "@/components/PipAuraLogo";
import { useLocation } from "wouter";

interface Screenshot {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
}

const screenshots: Screenshot[] = [
  {
    id: "dashboard",
    title: "Dashboard Overview",
    description: "Comprehensive analytics dashboard with Trader DNA Core visualization, performance metrics, and customizable widgets",
    imageUrl: "/screenshots/dashboard.png",
    category: "Analytics"
  },
  {
    id: "add-trade",
    title: "Add Trade",
    description: "Streamlined trade entry with OCR screenshot support, multi-format import, and automated enrichment",
    imageUrl: "/screenshots/add-trade.png",
    category: "Trading"
  },
  {
    id: "fundamentals",
    title: "Fundamental Bias",
    description: "Real-time economic calendar with automated bias calculations for 38+ FX pairs and 10 global indices",
    imageUrl: "/screenshots/fundamentals.png",
    category: "Analysis"
  },
  {
    id: "tax-reports",
    title: "Tax Reports",
    description: "Comprehensive tax reporting with P&L statements, trade summaries, and export functionality",
    imageUrl: "/screenshots/tax-reports.png",
    category: "Reports"
  },
  {
    id: "calendar",
    title: "Calendar View",
    description: "Visual P&L calendar with consistency tracking, winning/losing day highlights, and performance patterns",
    imageUrl: "/screenshots/calendar.png",
    category: "Tracking"
  },
  {
    id: "analytics",
    title: "Advanced Analytics",
    description: "Deep dive into your trading edge with win rates, session analysis, emotional correlation, and DNA metrics",
    imageUrl: "/screenshots/analytics.png",
    category: "Analytics"
  }
];

export default function ViewJournal() {
  const [, setLocation] = useLocation();
  const [selectedImage, setSelectedImage] = useState<Screenshot | null>(null);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => setLocation("/landing")}
              data-testid="link-home"
            >
              <div className="scale-75">
                <PipAuraLogo />
              </div>
              <span className="text-lg font-bold text-white">PipAura</span>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                className="text-white hover:text-cyan-400 hover:bg-white/10"
                onClick={() => setLocation("/landing")}
                data-testid="button-back"
              >
                Back to Home
              </Button>
              <Button 
                className="bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/50"
                onClick={() => setLocation("/auth")}
                data-testid="button-get-started"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center mb-16 animate-fade-in">
          <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6">
            Preview the <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">PipAura Journal</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Explore our powerful trading journal through visual screenshots. Click any image to view it in full size.
          </p>
        </div>

        {/* Screenshots Grid */}
        <div className="max-w-6xl mx-auto space-y-12">
          {screenshots.map((screenshot, index) => (
            <div
              key={screenshot.id}
              className="animate-fade-in-up opacity-0"
              style={{ 
                animation: `fadeInUp 0.6s ease-out ${index * 0.1}s forwards` 
              }}
            >
              <Card 
                className="bg-slate-800/50 border-slate-700/50 overflow-hidden hover:border-cyan-500/50 transition-all group cursor-pointer"
                onClick={() => setSelectedImage(screenshot)}
                data-testid={`screenshot-${screenshot.id}`}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="inline-block px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-medium mb-3">
                        {screenshot.category}
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        {screenshot.title}
                      </h3>
                      <p className="text-slate-400 leading-relaxed">
                        {screenshot.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Screenshot Placeholder */}
                  <div className="relative rounded-lg overflow-hidden bg-slate-900 border border-slate-700 aspect-video group-hover:border-cyan-500/50 transition-all">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-6xl mb-4">📸</div>
                        <p className="text-slate-500 text-sm">
                          Screenshot placeholder
                        </p>
                        <p className="text-slate-600 text-xs mt-1">
                          Replace with actual screenshot at:<br/>
                          <code className="text-cyan-400">{screenshot.imageUrl}</code>
                        </p>
                      </div>
                    </div>
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="text-white font-medium flex items-center gap-2">
                        Click to enlarge
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto mt-20 animate-fade-in">
          <div className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 rounded-3xl p-12 text-center backdrop-blur-sm">
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Start Your Trading Journey?
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Experience the full power of PipAura with a free trial. No credit card required.
            </p>
            <Button 
              size="lg" 
              className="text-lg px-10 py-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-xl shadow-cyan-500/30"
              onClick={() => setLocation("/auth")}
              data-testid="button-start-trial"
            >
              Start Free Trial
            </Button>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedImage(null)}
          data-testid="lightbox-overlay"
        >
          <div className="relative max-w-7xl w-full">
            {/* Close Button */}
            <button
              className="absolute -top-12 right-0 text-white hover:text-cyan-400 transition-colors"
              onClick={() => setSelectedImage(null)}
              data-testid="button-close-lightbox"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Image Info */}
            <div className="text-center mb-4">
              <div className="inline-block px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-sm font-medium mb-2">
                {selectedImage.category}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {selectedImage.title}
              </h3>
              <p className="text-slate-400">
                {selectedImage.description}
              </p>
            </div>

            {/* Image */}
            <div 
              className="rounded-lg overflow-hidden bg-slate-900 border border-slate-700 aspect-video"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-8xl mb-4">📸</div>
                  <p className="text-slate-500">
                    Full-size screenshot placeholder
                  </p>
                  <p className="text-slate-600 text-sm mt-2">
                    Replace with actual screenshot at:<br/>
                    <code className="text-cyan-400">{selectedImage.imageUrl}</code>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
