import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { demoTrades, demoAccounts, demoAnalytics } from "@/lib/demo-data";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Target, Award, BarChart3 } from "lucide-react";

export default function PreviewDashboard() {
  const account = demoAccounts[0];
  
  // Prepare equity curve data
  const equityCurve = [
    { date: "Jan 15", balance: 10000 + 1750 },
    { date: "Jan 16", balance: 10000 + 1750 + 700 },
    { date: "Jan 17", balance: 10000 + 1750 + 700 - 365 },
    { date: "Jan 18", balance: 10000 + 1750 + 700 - 365 + 2100 },
    { date: "Jan 19", balance: 10000 + 1750 + 700 - 365 + 2100 + 650 },
    { date: "Jan 20", balance: account.current_balance },
  ];

  // Session breakdown
  const sessionData = [
    { session: "London", pnl: 1985, trades: 3 },
    { session: "New York", pnl: 1350, trades: 2 },
    { session: "Asia", pnl: 2100, trades: 1 },
  ];

  // Recent trades for table
  const recentTrades = [...demoTrades].reverse().slice(0, 5);

  return (
    <div className="p-3 sm:p-4 lg:p-8 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-300 mb-0">Your trading overview and performance metrics</p>
          </div>
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2">
            <p className="text-xs sm:text-sm text-cyan-400">📊 Preview Mode - Demo Data</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total P&L</CardTitle>
            <DollarSign className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{formatCurrency(demoAnalytics.totalPnL)}</div>
            <p className="text-xs text-slate-500 mt-1">
              +{((demoAnalytics.totalPnL / account.starting_balance) * 100).toFixed(1)}% from starting
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{demoAnalytics.winRate.toFixed(1)}%</div>
            <p className="text-xs text-slate-500 mt-1">
              {demoAnalytics.winningTrades}W / {demoAnalytics.losingTrades}L
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Profit Factor</CardTitle>
            <Award className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{demoAnalytics.profitFactor.toFixed(2)}</div>
            <p className="text-xs text-slate-500 mt-1">Excellent performance</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Trades</CardTitle>
            <BarChart3 className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{demoAnalytics.totalTrades}</div>
            <p className="text-xs text-slate-500 mt-1">Closed positions</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        {/* Equity Curve */}
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Equity Curve
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={equityCurve}>
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
                  formatter={(value: number) => formatCurrency(value)}
                />
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

        {/* Session Performance */}
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              Session Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={sessionData}>
                <XAxis 
                  dataKey="session" 
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
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="pnl" fill="hsl(188, 94%, 60%)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Trades Table */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Recent Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <table className="w-full min-w-[600px]" data-testid="trades-table">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-slate-400">Date</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-slate-400">Instrument</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-slate-400">Type</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-slate-400">Size</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-slate-400">Session</th>
                  <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-slate-400">P&L</th>
                </tr>
              </thead>
              <tbody>
                {recentTrades.map((trade) => (
                  <tr 
                    key={trade.id} 
                    className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                    data-testid={`trade-row-${trade.id}`}
                  >
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-slate-300">
                      {new Date(trade.entry_date).toLocaleDateString()}
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-white font-medium">{trade.instrument}</td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4">
                      <span className={`inline-flex items-center gap-1 text-xs sm:text-sm ${
                        trade.trade_type === "BUY" ? "text-green-400" : "text-red-400"
                      }`}>
                        {trade.trade_type === "BUY" ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {trade.trade_type}
                      </span>
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-slate-300">{trade.position_size}</td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-slate-400">{trade.session_tag}</td>
                    <td className={`py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-right font-semibold ${
                      trade.pnl >= 0 ? "text-green-400" : "text-red-400"
                    }`}>
                      {formatCurrency(trade.pnl)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
