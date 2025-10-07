import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { getAnalytics } from "@/lib/supabase-service";

export default function Analytics() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: getAnalytics,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a1628] p-4 lg:p-8">
        <div className="mb-8">
          <div className="h-8 bg-muted animate-pulse rounded w-48 mb-2"></div>
          <div className="h-4 bg-muted animate-pulse rounded w-64"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-96 bg-muted animate-pulse rounded"></div>
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
    equityCurve: analytics?.equityCurve || [],
    monthlyPerformance: analytics?.monthlyPerformance || [],
    averageMonthlyReturn: analytics?.averageMonthlyReturn || 0,
    bestMonth: analytics?.bestMonth || 0,
    bestMonthName: 'N/A'
  };

  // Calculate average monthly return as percentage
  const avgMonthlyReturnPercent = stats.totalPnL > 0 && stats.monthlyPerformance.length > 0
    ? (stats.averageMonthlyReturn / (stats.totalPnL / stats.monthlyPerformance.length)) * 100
    : 0;

  // Find best month name
  if (stats.monthlyPerformance.length > 0) {
    const bestMonthData = stats.monthlyPerformance.reduce((max, current) => 
      current.pnl > max.pnl ? current : max
    );
    stats.bestMonthName = bestMonthData.month;
  }

  // Prepare monthly orbit data (last 12 months)
  const monthlyOrbitData = stats.monthlyPerformance.slice(-12).map(m => ({
    month: m.month.split(' ')[0],
    value: Math.abs(m.pnl),
    pnl: m.pnl,
    fullMonth: m.month
  }));

  // Get current month for highlighting
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'short' });

  return (
    <div className="min-h-screen bg-[#0a1628] p-4 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">Trading Analytics</h1>
        <p className="text-gray-400 text-sm lg:text-base">Detailed performance analysis and metrics</p>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
        {/* Total P&L */}
        <Card className="bg-[#0f1f3a] border-[#1a2f4a]" data-testid="card-total-pnl">
          <CardContent className="p-4 lg:p-6">
            <div className="text-gray-400 text-sm mb-2">Total P&L</div>
            <div className={`text-2xl lg:text-3xl font-bold ${stats.totalPnL >= 0 ? 'text-cyan-400' : 'text-red-500'}`} data-testid="text-total-pnl">
              {formatCurrency(stats.totalPnL)}
            </div>
          </CardContent>
        </Card>

        {/* Win Rate */}
        <Card className="bg-[#0f1f3a] border-[#1a2f4a]" data-testid="card-win-rate">
          <CardContent className="p-4 lg:p-6">
            <div className="text-gray-400 text-sm mb-2">Win Rate</div>
            <div className="text-2xl lg:text-3xl font-bold text-white" data-testid="text-win-rate">
              {stats.winRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        {/* Profit Factor */}
        <Card className="bg-[#0f1f3a] border-[#1a2f4a]" data-testid="card-profit-factor">
          <CardContent className="p-4 lg:p-6">
            <div className="text-gray-400 text-sm mb-2">Profit Factor</div>
            <div className="text-2xl lg:text-3xl font-bold text-white" data-testid="text-profit-factor">
              {stats.profitFactor >= 999 ? '∞' : stats.profitFactor.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        {/* Max Drawdown */}
        <Card className="bg-[#0f1f3a] border-[#1a2f4a]" data-testid="card-max-drawdown">
          <CardContent className="p-4 lg:p-6">
            <div className="text-gray-400 text-sm mb-2">Max Drawdown</div>
            <div className="text-2xl lg:text-3xl font-bold text-red-500" data-testid="text-max-drawdown">
              +{stats.maxDrawdown.toFixed(2)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Visualizations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Flow Curve */}
        <Card className="bg-[#0f1f3a] border-[#1a2f4a]" data-testid="card-flow-curve">
          <CardHeader>
            <CardTitle className="text-xl text-white">Flow Curve</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {stats.equityCurve.length > 0 ? (
              <div className="relative">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.equityCurve} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <defs>
                      <linearGradient id="flowGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#0891b2" stopOpacity={0.3} />
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <Line 
                      type="monotone" 
                      dataKey="equity" 
                      stroke="url(#flowGradient)"
                      strokeWidth={4}
                      dot={false}
                      filter="url(#glow)"
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-6 text-center">
                  <span className="text-gray-400 text-sm lg:text-base">Avg Monthly Return: </span>
                  <span className="text-cyan-400 font-bold text-base lg:text-lg">
                    {avgMonthlyReturnPercent > 0 ? '+' : ''}{avgMonthlyReturnPercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <p>No flow data available</p>
                  <p className="text-sm mt-1">Add trades to see equity flow</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Orbit Rings */}
        <Card className="bg-[#0f1f3a] border-[#1a2f4a]" data-testid="card-monthly-orbit">
          <CardHeader>
            <CardTitle className="text-xl text-white">Monthly Orbit Rings</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {monthlyOrbitData.length > 0 ? (
              <div className="relative">
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={monthlyOrbitData}>
                    <defs>
                      <linearGradient id="orbitGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="#0891b2" stopOpacity={0.2} />
                      </linearGradient>
                    </defs>
                    <PolarGrid 
                      stroke="#1a2f4a" 
                      strokeWidth={1}
                    />
                    <PolarAngleAxis 
                      dataKey="month" 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <Radar 
                      name="Monthly P&L" 
                      dataKey="value" 
                      stroke="#06b6d4" 
                      fill="url(#orbitGradient)" 
                      fillOpacity={0.6}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
                <div className="mt-6 text-center">
                  <span className="text-gray-400 text-sm lg:text-base">Best Month: </span>
                  <span className="text-white font-bold text-base lg:text-lg">
                    {formatCurrency(stats.bestMonth)} ({stats.bestMonthName})
                  </span>
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <p>No monthly data available</p>
                  <p className="text-sm mt-1">Add trades to see monthly orbit</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
