import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function Mentor() {
  const [message, setMessage] = useState("");

  return (
    <div className="p-4 lg:p-8 min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">AI Trading Mentor</h1>
        <p className="text-gray-300">Get personalized trading advice and analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <Card className="h-96">
            <CardHeader>
              <CardTitle className="text-lg">Trading Assistant</CardTitle>
              <CardDescription>Ask questions about your trades, strategies, or market analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-64 bg-muted rounded-lg p-4 overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">AI</div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 max-w-xs">
                      <p className="text-sm">Hello! I'm your AI trading mentor. I can help you analyze trades, improve your strategy, and answer questions about the markets. What would you like to discuss?</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 justify-end">
                    <div className="bg-primary rounded-lg p-3 max-w-xs text-primary-foreground">
                      <p className="text-sm">Can you analyze my recent EUR/USD trade?</p>
                    </div>
                    <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">You</div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">AI</div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 max-w-sm">
                      <p className="text-sm">I'd be happy to analyze your EUR/USD trade! Please share the trade details including entry price, exit price, timeframe, and reasoning behind the trade. I'll provide feedback on your execution and suggest improvements.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Ask me anything about trading..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <Button disabled>Send</Button>
              </div>
              <p className="text-xs text-muted-foreground">AI features require API configuration</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Insights */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Analysis</CardTitle>
              <CardDescription>Common trading questions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start text-left" disabled>
                Analyze my last 10 trades
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-left" disabled>
                Review risk management
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-left" disabled>
                Strategy performance check
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-left" disabled>
                Market outlook today
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-left" disabled>
                Psychology assessment
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Trading Tips</CardTitle>
              <CardDescription>Daily insights</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="font-medium text-sm text-blue-900 dark:text-blue-100">Risk Management</div>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Never risk more than 2% of your account on a single trade
                </p>
              </div>
              
              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="font-medium text-sm text-green-900 dark:text-green-100">Market Timing</div>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  London-New York session overlap offers highest volatility
                </p>
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <div className="font-medium text-sm text-purple-900 dark:text-purple-100">Psychology</div>
                <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                  Keep a trading journal to identify emotional patterns
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance Insights</CardTitle>
              <CardDescription>AI-powered analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Trade Accuracy</span>
                <Badge variant="default">68%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Risk Score</span>
                <Badge variant="secondary">Moderate</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Discipline Level</span>
                <Badge variant="default">Good</Badge>
              </div>
              <Button variant="outline" size="sm" className="w-full" disabled>
                Full Assessment
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Learning Resources</CardTitle>
            <CardDescription>Recommended reading</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="p-2 hover:bg-muted rounded cursor-pointer">
                <div className="font-medium text-sm">Technical Analysis Basics</div>
                <p className="text-xs text-muted-foreground">Support, resistance, and trend lines</p>
              </div>
              <div className="p-2 hover:bg-muted rounded cursor-pointer">
                <div className="font-medium text-sm">Risk Management Rules</div>
                <p className="text-xs text-muted-foreground">Position sizing and stop losses</p>
              </div>
              <div className="p-2 hover:bg-muted rounded cursor-pointer">
                <div className="font-medium text-sm">Trading Psychology</div>
                <p className="text-xs text-muted-foreground">Managing emotions and discipline</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Market Alerts</CardTitle>
            <CardDescription>Important events today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Badge variant="destructive" className="text-xs">HIGH</Badge>
                <div>
                  <div className="font-medium text-sm">ECB Meeting</div>
                  <p className="text-xs text-muted-foreground">Expected rate decision at 13:45</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="secondary" className="text-xs">MED</Badge>
                <div>
                  <div className="font-medium text-sm">US GDP Release</div>
                  <p className="text-xs text-muted-foreground">Preliminary Q4 data at 15:30</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Trading Plan</CardTitle>
            <CardDescription>Today's focus</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Review morning market analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Check economic calendar</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" className="rounded" checked readOnly />
                <span className="text-sm line-through text-muted-foreground">Update trading journal</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Review open positions</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}