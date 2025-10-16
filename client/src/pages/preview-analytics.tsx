import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info, BarChart3, Heart } from "lucide-react";
import { SessionInsights } from "@/components/SessionInsights";
import { EmotionalAnalyticsTab } from "@/components/emotional-analytics-tab";
import { 
  LineChart, 
  Line, 
  ResponsiveContainer,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  RadarChart
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { FloatingDNACore } from "@/components/FloatingDNACore";
import { demoTrades, demoAnalytics, demoAccounts } from "@/lib/demo-data";

export default function PreviewAnalytics() {
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(null);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const selectedAccount = demoAccounts[0].id;

  const stats = {
    totalPnL: demoAnalytics.totalPnL,
    winRate: demoAnalytics.winRate,
    profitFactor: demoAnalytics.profitFactor,
    maxDrawdown: demoAnalytics.maxDrawdown,
    equityCurve: [
      { date: "Jan 15", balance: 11750 },
      { date: "Jan 16", balance: 12450 },
      { date: "Jan 17", balance: 12085 },
      { date: "Jan 18", balance: 14185 },
      { date: "Jan 19", balance: 14835 },
      { date: "Jan 20", balance: 14835 }
    ],
    monthlyPerformance: [
      { month: "Jan 2025", pnl: 4835, trades: 6 }
    ],
    averageMonthlyReturn: 4835,
    bestMonth: 4835,
    bestMonthName: 'Jan 2025'
  };

  const avgMonthlyReturnPercent = (stats.averageMonthlyReturn / 10000) * 100;

  const monthlyOrbitData = stats.monthlyPerformance.map(m => ({
    month: m.month.split(' ')[0],
    value: Math.abs(m.pnl),
    pnl: m.pnl,
    fullMonth: m.month
  }));

  const currentMonth = "Jan";

  return (
    <div className="p-4 lg:p-8 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Advanced Analytics</h1>
            <p className="text-gray-300">Deep dive into your trading performance</p>
          </div>
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-4 py-2">
            <p className="text-sm text-cyan-400">📊 Preview Mode - Demo Data</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="dna" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="dna" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Trader DNA Core
          </TabsTrigger>
          <TabsTrigger value="session" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Session Insights
          </TabsTrigger>
          <TabsTrigger value="emotional" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Emotional Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dna" className="space-y-6">
          {/* Trader DNA Core */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl text-white flex items-center gap-2">
                  Trader DNA Core
                  <button 
                    onClick={() => setIsInfoDialogOpen(true)}
                    className="text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    <Info className="w-5 h-5" />
                  </button>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <FloatingDNACore />
            </CardContent>
          </Card>

          {/* Equity Curve */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Equity Curve</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.equityCurve}>
                  <Line 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="hsl(188, 94%, 60%)" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(188, 94%, 60%)", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-sm text-slate-400">Total P&L</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-500">{formatCurrency(stats.totalPnL)}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-sm text-slate-400">Win Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">{stats.winRate.toFixed(1)}%</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-sm text-slate-400">Profit Factor</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">{stats.profitFactor.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-sm text-slate-400">Max Drawdown</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-500">{formatCurrency(stats.maxDrawdown)}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="session">
          <SessionInsights trades={demoTrades} />
        </TabsContent>

        <TabsContent value="emotional">
          <EmotionalAnalyticsTab accountId={selectedAccount} />
        </TabsContent>
      </Tabs>

      {/* Info Dialog */}
      <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trader DNA Core Metrics</DialogTitle>
            <DialogDescription>
              Understanding your trading DNA
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-1">Edge Integrity</h4>
              <p className="text-slate-400">Overall measure of your trading edge</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Emotional Control</h4>
              <p className="text-slate-400">How well you manage emotions while trading</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Session Focus</h4>
              <p className="text-slate-400">Consistency in your best trading sessions</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
