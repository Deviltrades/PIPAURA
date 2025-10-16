import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info, BarChart3, Heart, Smile, Zap } from "lucide-react";
import { SessionInsights } from "@/components/SessionInsights";
import { 
  LineChart, 
  Line, 
  ResponsiveContainer,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  RadarChart,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { demoTrades, demoAnalytics, demoAccounts, demoEmotionalLogs } from "@/lib/demo-data";

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

  // Calculate DNA Core metrics from demo data
  const dnaMetrics = useMemo(() => {
    const winRate = demoAnalytics.winRate;
    const profitFactor = demoAnalytics.profitFactor;
    const riskReward = Math.min((profitFactor / 2) * 100, 100);
    const riskConsistency = Math.max(0, 100 - (demoAnalytics.maxDrawdownPercent || 0));
    
    // Calculate emotional control from emotional logs
    const avgMood = demoEmotionalLogs.reduce((sum, log) => sum + log.mood, 0) / demoEmotionalLogs.length;
    const moodVariance = demoEmotionalLogs.reduce((sum, log) => sum + Math.pow(log.mood - avgMood, 2), 0) / demoEmotionalLogs.length;
    const moodVolatility = Math.sqrt(moodVariance);
    const emotionalControl = Math.max(0, 100 - (moodVolatility * 15));
    
    const discipline = Math.max(1, 100 - (demoAnalytics.maxDrawdownPercent || 0));
    
    // Calculate session focus
    const sessionStats: { [key: string]: { pnl: number; count: number } } = {};
    demoTrades.forEach(trade => {
      const session = trade.session_tag || 'Unknown';
      if (!sessionStats[session]) {
        sessionStats[session] = { pnl: 0, count: 0 };
      }
      sessionStats[session].pnl += trade.pnl;
      sessionStats[session].count++;
    });
    
    const totalPnL = Math.abs(demoAnalytics.totalPnL);
    const bestSessionPnL = Math.max(...Object.values(sessionStats).map(s => Math.abs(s.pnl)));
    const sessionFocus = (bestSessionPnL / totalPnL) * 100;
    
    const edgeIntegrity = (winRate + riskReward + riskConsistency + emotionalControl + discipline + sessionFocus) / 6;
    
    return {
      winRate,
      riskReward,
      riskConsistency,
      emotionalControl,
      discipline,
      sessionFocus,
      edgeIntegrity
    };
  }, []);

  const radarData = [
    { metric: 'Win Rate', value: dnaMetrics.winRate, fullMark: 100 },
    { metric: 'Risk/Reward', value: dnaMetrics.riskReward, fullMark: 100 },
    { metric: 'Consistency', value: dnaMetrics.riskConsistency, fullMark: 100 },
    { metric: 'Emotional', value: dnaMetrics.emotionalControl, fullMark: 100 },
    { metric: 'Discipline', value: dnaMetrics.discipline, fullMark: 100 },
    { metric: 'Focus', value: dnaMetrics.sessionFocus, fullMark: 100 },
  ];

  // Prepare emotional analytics data
  const emotionalChartData = demoEmotionalLogs.map(log => {
    // Find trades on this date
    const tradesOnDate = demoTrades.filter(t => 
      new Date(t.entry_date).toISOString().split('T')[0] === log.log_date
    );
    const pnl = tradesOnDate.reduce((sum, t) => sum + t.pnl, 0);
    
    return {
      date: log.log_date,
      mood: log.mood,
      energy: log.energy,
      pnl: pnl,
      result: pnl >= 0 ? 'Win' : 'Loss'
    };
  });

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
              <div className="flex flex-col lg:flex-row gap-8 items-center">
                {/* DNA Radar Chart */}
                <div className="flex-1 w-full">
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis 
                        dataKey="metric" 
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                      />
                      <Radar
                        name="Trader DNA"
                        dataKey="value"
                        stroke="hsl(188, 94%, 60%)"
                        fill="hsl(188, 94%, 60%)"
                        fillOpacity={0.5}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* DNA Metrics */}
                <div className="flex-1 w-full space-y-4">
                  <div className="text-center mb-6">
                    <h3 className="text-4xl font-bold text-cyan-400 mb-2">
                      {dnaMetrics.edgeIntegrity.toFixed(1)}%
                    </h3>
                    <p className="text-sm text-slate-400">Edge Integrity Score</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <p className="text-xs text-slate-400 mb-1">Win Rate</p>
                      <p className="text-lg font-bold text-white">{dnaMetrics.winRate.toFixed(1)}%</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <p className="text-xs text-slate-400 mb-1">Risk/Reward</p>
                      <p className="text-lg font-bold text-white">{dnaMetrics.riskReward.toFixed(1)}%</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <p className="text-xs text-slate-400 mb-1">Consistency</p>
                      <p className="text-lg font-bold text-white">{dnaMetrics.riskConsistency.toFixed(1)}%</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <p className="text-xs text-slate-400 mb-1">Emotional</p>
                      <p className="text-lg font-bold text-white">{dnaMetrics.emotionalControl.toFixed(1)}%</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <p className="text-xs text-slate-400 mb-1">Discipline</p>
                      <p className="text-lg font-bold text-white">{dnaMetrics.discipline.toFixed(1)}%</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <p className="text-xs text-slate-400 mb-1">Session Focus</p>
                      <p className="text-lg font-bold text-white">{dnaMetrics.sessionFocus.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              </div>
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

        <TabsContent value="emotional" className="space-y-6">
          {/* Emotional Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                  <Smile className="w-4 h-4" />
                  Average Mood
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-cyan-400">
                  {(demoEmotionalLogs.reduce((sum, log) => sum + log.mood, 0) / demoEmotionalLogs.length).toFixed(1)}/10
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Average Energy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-cyan-400">
                  {(demoEmotionalLogs.reduce((sum, log) => sum + log.energy, 0) / demoEmotionalLogs.length).toFixed(1)}/10
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Total Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">{demoEmotionalLogs.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Mood vs Performance Chart */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Mood & Energy Correlation</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="mood" 
                    name="Mood" 
                    stroke="#64748b"
                    tick={{ fill: '#64748b' }}
                    label={{ value: 'Mood', position: 'bottom', fill: '#64748b' }}
                  />
                  <YAxis 
                    dataKey="energy" 
                    name="Energy" 
                    stroke="#64748b"
                    tick={{ fill: '#64748b' }}
                    label={{ value: 'Energy', angle: -90, position: 'left', fill: '#64748b' }}
                  />
                  <ZAxis dataKey="pnl" range={[50, 400]} />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value: any, name: string) => {
                      if (name === 'P&L') return formatCurrency(value);
                      return value;
                    }}
                  />
                  <Scatter 
                    data={emotionalChartData} 
                    fill="hsl(188, 94%, 60%)"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Mood Trend */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Mood & Energy Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={emotionalChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#64748b"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="mood" 
                    stroke="hsl(188, 94%, 60%)" 
                    strokeWidth={2}
                    name="Mood"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="energy" 
                    stroke="hsl(280, 94%, 60%)" 
                    strokeWidth={2}
                    name="Energy"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Emotional Logs List */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Emotional Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {demoEmotionalLogs.map((log) => (
                  <div key={log.id} className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-4">
                        <div>
                          <p className="text-xs text-slate-500">Mood</p>
                          <p className="text-lg font-bold text-cyan-400">{log.mood}/10</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Energy</p>
                          <p className="text-lg font-bold text-purple-400">{log.energy}/10</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-400">{log.log_date}</p>
                    </div>
                    <div className="flex gap-2 mb-2">
                      {log.tags.map((tag, idx) => (
                        <span key={idx} className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                    {log.notes && (
                      <p className="text-sm text-slate-300 italic">"{log.notes}"</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
