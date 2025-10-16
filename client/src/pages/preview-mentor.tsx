import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Bot, Sparkles } from "lucide-react";

export default function PreviewMentor() {
  const [message, setMessage] = useState("");

  return (
    <div className="p-4 lg:p-8 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative">
      {/* Coming Soon Watermark */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
        <div className="relative">
          <div className="absolute inset-0 blur-3xl opacity-30">
            <div className="text-[200px] font-black bg-gradient-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent">
              COMING SOON
            </div>
          </div>
          <div className="text-[200px] font-black bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent opacity-20 transform -rotate-12">
            COMING SOON
          </div>
        </div>
      </div>

      <div className="mb-6 relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3" data-testid="text-mentor-title">
              <Bot className="h-8 w-8 text-cyan-400" />
              AI Trading Mentor
            </h1>
            <p className="text-gray-300">Get personalized trading advice and analysis</p>
          </div>
          <div className="bg-purple-500/20 border border-purple-500/40 rounded-lg px-4 py-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <p className="text-sm text-purple-300 font-semibold">Coming Soon</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <Card className="h-96 bg-[#0f1f3a] border-[#1a2f4a]">
            <CardHeader>
              <CardTitle className="text-lg text-white">Trading Assistant</CardTitle>
              <CardDescription>Ask questions about your trades, strategies, or market analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-64 bg-slate-900/50 rounded-lg p-4 overflow-y-auto border border-cyan-500/20">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      AI
                    </div>
                    <div className="bg-slate-800 rounded-lg p-3 max-w-xs border border-cyan-500/20">
                      <p className="text-sm text-gray-200">Hello! I'm your AI trading mentor. I can help you analyze trades, improve your strategy, and answer questions about the markets. What would you like to discuss?</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 justify-end">
                    <div className="bg-cyan-600 rounded-lg p-3 max-w-xs text-white">
                      <p className="text-sm">Can you analyze my recent EUR/USD trade?</p>
                    </div>
                    <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      You
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      AI
                    </div>
                    <div className="bg-slate-800 rounded-lg p-3 max-w-sm border border-cyan-500/20">
                      <p className="text-sm text-gray-200">I'd be happy to analyze your EUR/USD trade! Please share the trade details including entry price, exit price, timeframe, and reasoning behind the trade. I'll provide feedback on your execution and suggest improvements.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Ask me anything about trading..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="bg-slate-900/50 border-cyan-500/30"
                  disabled
                  data-testid="input-mentor-message"
                />
                <Button disabled className="bg-cyan-600/50">Send</Button>
              </div>
              <p className="text-xs text-muted-foreground">AI features coming soon - Advanced analytics powered by GPT-4</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Insights */}
        <div className="space-y-4">
          <Card className="bg-[#0f1f3a] border-[#1a2f4a]">
            <CardHeader>
              <CardTitle className="text-lg text-white">Quick Analysis</CardTitle>
              <CardDescription>Common trading questions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start text-left border-cyan-500/50 hover:bg-cyan-600/20" disabled>
                📊 Analyze my last 10 trades
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-left border-cyan-500/50 hover:bg-cyan-600/20" disabled>
                🛡️ Review risk management
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-left border-cyan-500/50 hover:bg-cyan-600/20" disabled>
                📈 Strategy performance check
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-left border-cyan-500/50 hover:bg-cyan-600/20" disabled>
                🌍 Market outlook today
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-left border-cyan-500/50 hover:bg-cyan-600/20" disabled>
                🧠 Psychology assessment
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#0f1f3a] border-[#1a2f4a]">
            <CardHeader>
              <CardTitle className="text-lg text-white">Trading Tips</CardTitle>
              <CardDescription>Daily insights</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-cyan-950/30 rounded-lg border border-cyan-500/20">
                <div className="font-medium text-sm text-cyan-100">Risk Management</div>
                <p className="text-xs text-cyan-300 mt-1">
                  Never risk more than 2% of your account on a single trade
                </p>
              </div>
              
              <div className="p-3 bg-green-950/30 rounded-lg border border-green-500/20">
                <div className="font-medium text-sm text-green-100">Market Timing</div>
                <p className="text-xs text-green-300 mt-1">
                  London-New York session overlap offers highest volatility
                </p>
              </div>

              <div className="p-3 bg-purple-950/30 rounded-lg border border-purple-500/20">
                <div className="font-medium text-sm text-purple-100">Psychology</div>
                <p className="text-xs text-purple-300 mt-1">
                  Keep a trading journal to identify emotional patterns
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0f1f3a] border-[#1a2f4a]">
            <CardHeader>
              <CardTitle className="text-lg text-white">Performance Insights</CardTitle>
              <CardDescription>AI-powered analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Trade Accuracy</span>
                <Badge variant="default" className="bg-green-600">68%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Risk Score</span>
                <Badge variant="secondary">Moderate</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Discipline Level</span>
                <Badge variant="default" className="bg-cyan-600">Good</Badge>
              </div>
              <Button variant="outline" size="sm" className="w-full border-cyan-500/50 hover:bg-cyan-600/20" disabled>
                Full Assessment
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 relative z-10">
        <Card className="bg-[#0f1f3a] border-[#1a2f4a]">
          <CardHeader>
            <CardTitle className="text-lg text-white">Learning Resources</CardTitle>
            <CardDescription>Recommended reading</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="p-2 hover:bg-slate-800/50 rounded cursor-pointer border border-transparent hover:border-cyan-500/20 transition-colors">
                <div className="font-medium text-sm text-white">Technical Analysis Basics</div>
                <p className="text-xs text-muted-foreground">Support, resistance, and trend lines</p>
              </div>
              <div className="p-2 hover:bg-slate-800/50 rounded cursor-pointer border border-transparent hover:border-cyan-500/20 transition-colors">
                <div className="font-medium text-sm text-white">Risk Management Rules</div>
                <p className="text-xs text-muted-foreground">Position sizing and stop losses</p>
              </div>
              <div className="p-2 hover:bg-slate-800/50 rounded cursor-pointer border border-transparent hover:border-cyan-500/20 transition-colors">
                <div className="font-medium text-sm text-white">Trading Psychology</div>
                <p className="text-xs text-muted-foreground">Managing emotions and discipline</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0f1f3a] border-[#1a2f4a]">
          <CardHeader>
            <CardTitle className="text-lg text-white">Market Alerts</CardTitle>
            <CardDescription>Important events today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Badge variant="destructive" className="text-xs">HIGH</Badge>
                <div>
                  <div className="font-medium text-sm text-white">ECB Meeting</div>
                  <p className="text-xs text-muted-foreground">Expected rate decision at 13:45</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="secondary" className="text-xs">MED</Badge>
                <div>
                  <div className="font-medium text-sm text-white">US GDP Release</div>
                  <p className="text-xs text-muted-foreground">Preliminary Q4 data at 15:30</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0f1f3a] border-[#1a2f4a]">
          <CardHeader>
            <CardTitle className="text-lg text-white">Trading Plan</CardTitle>
            <CardDescription>Today's focus</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" className="rounded" disabled />
                <span className="text-sm text-gray-300">Review morning market analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" className="rounded" disabled />
                <span className="text-sm text-gray-300">Check economic calendar</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" className="rounded" checked readOnly disabled />
                <span className="text-sm line-through text-muted-foreground">Update trading journal</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" className="rounded" disabled />
                <span className="text-sm text-gray-300">Review open positions</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
