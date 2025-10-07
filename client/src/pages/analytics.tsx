import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  LineChart, 
  Line, 
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { getAnalytics } from "@/lib/supabase-service";
import { TrendingUp, TrendingDown, Activity, Target } from "lucide-react";

export default function Analytics() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: getAnalytics,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="mb-8">
          <div className="h-8 bg-muted animate-pulse rounded w-48 mb-2"></div>
          <div className="h-4 bg-muted animate-pulse rounded w-64"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-64 bg-muted animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = {
    totalPnL: analytics?.totalPnL || 0,
    winRate: analytics?.winRate || 0,
    profitFactor: analytics?.profitFactor || 0,
    maxDrawdown: analytics?.maxDrawdown || 0,
    monthlyData: analytics?.monthlyPerformance || [],
    equityCurve: analytics?.equityCurve || [],
    averageMonthlyReturn: analytics?.averageMonthlyReturn || 0,
    bestMonth: analytics?.bestMonth || 0,
    worstMonth: analytics?.worstMonth || 0,
    totalTrades: analytics?.totalTrades || 0
  };

  // Custom tooltip for monthly performance
  const CustomMonthlyTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-xl">
          <p className="font-semibold text-foreground mb-1">{data.month}</p>
          <p className={`text-sm font-bold ${data.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            P&L: {formatCurrency(data.pnl)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Win Rate: {data.winRate.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground">
            Trades: {data.trades}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for equity curve
  const CustomEquityTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-xl">
          <p className="font-semibold text-foreground mb-1">{data.date}</p>
          <p className={`text-sm font-bold ${data.equity >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
            Equity: {formatCurrency(data.equity)}
          </p>
          <p className={`text-xs mt-1 ${data.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            Trade P&L: {formatCurrency(data.pnl)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Trading Analytics</h1>
        <p className="text-muted-foreground">Comprehensive performance analysis and insights</p>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-cyan-500/20 bg-gradient-to-br from-background to-cyan-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Total P&L
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${stats.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(stats.totalPnL)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalTrades} trades
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-gradient-to-br from-background to-blue-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Win Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400">
              {stats.winRate.toFixed(1)}%
            </div>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                style={{ width: `${Math.min(stats.winRate, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 bg-gradient-to-br from-background to-purple-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Profit Factor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${stats.profitFactor >= 1 ? 'text-purple-400' : 'text-orange-400'}`}>
              {stats.profitFactor >= 999 ? '∞' : stats.profitFactor.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.profitFactor >= 2 ? 'Excellent' : stats.profitFactor >= 1.5 ? 'Good' : stats.profitFactor >= 1 ? 'Fair' : 'Poor'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-500/20 bg-gradient-to-br from-background to-red-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Max Drawdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-400">
              {stats.maxDrawdown.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Peak to trough
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Performance Chart */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-gradient-to-r from-green-500 to-red-500" />
              Monthly Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={stats.monthlyData}>
                  <defs>
                    <linearGradient id="greenGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#16a34a" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="redGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#dc2626" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip content={<CustomMonthlyTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }} />
                  <Bar 
                    dataKey="pnl" 
                    radius={[8, 8, 0, 0]}
                    fill="url(#greenGlow)"
                    className="drop-shadow-[0_0_12px_rgba(34,197,94,0.5)]"
                  >
                    {stats.monthlyData.map((entry, index) => (
                      <rect 
                        key={`bar-${index}`}
                        fill={entry.pnl >= 0 ? 'url(#greenGlow)' : 'url(#redGlow)'}
                        className={entry.pnl >= 0 
                          ? 'drop-shadow-[0_0_12px_rgba(34,197,94,0.5)]' 
                          : 'drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>No trade data available</p>
                  <p className="text-sm mt-1">Add trades to see monthly performance</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Equity Curve Chart */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 animate-pulse" />
              Equity Curve
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.equityCurve.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={stats.equityCurve}>
                  <defs>
                    <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.6} />
                      <stop offset="50%" stopColor="#14b8a6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip content={<CustomEquityTooltip />} cursor={{ stroke: '#06b6d4', strokeWidth: 2 }} />
                  <Area 
                    type="monotone" 
                    dataKey="equity" 
                    stroke="#06b6d4" 
                    strokeWidth={3}
                    fill="url(#equityGradient)"
                    className="drop-shadow-[0_0_16px_rgba(6,182,212,0.6)]"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>No equity data available</p>
                  <p className="text-sm mt-1">Add trades to see equity growth</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-background to-blue-950/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Monthly Return
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.averageMonthlyReturn >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
              {formatCurrency(stats.averageMonthlyReturn)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-background to-green-950/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Best Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {formatCurrency(stats.bestMonth)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-background to-red-950/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Worst Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {formatCurrency(stats.worstMonth)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-background to-purple-950/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Volatility
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">
              {stats.bestMonth > 0 && stats.worstMonth < 0 
                ? `${((stats.bestMonth - stats.worstMonth) / stats.bestMonth * 100).toFixed(0)}%`
                : 'N/A'
              }
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
