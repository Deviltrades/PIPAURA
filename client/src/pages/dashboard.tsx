import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Percent, Activity, Calculator, ArrowUp, ArrowDown } from "lucide-react";
import { formatCurrency, formatPercentage } from "@/lib/utils";

export default function Dashboard() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/analytics"],
    retry: false,
  });

  const { data: trades } = useQuery({
    queryKey: ["/api/trades"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="mb-8">
          <div className="h-8 bg-muted animate-pulse rounded mb-2 w-48"></div>
          <div className="h-4 bg-muted animate-pulse rounded w-64"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 bg-muted animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = analytics || {
    totalPnL: 0,
    winRate: 0,
    avgWin: 0,
    avgLoss: 0,
    totalTrades: 0,
    activeTrades: 0
  };

  const recentTrades = trades?.slice(0, 5) || [];

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Trading Dashboard</h1>
        <p className="text-muted-foreground">Monitor your trading performance and key metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(stats.totalPnL)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {stats.totalPnL >= 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
              {formatPercentage(5.2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.winRate.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">
              {stats.totalTrades} total trades
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Win/Loss</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.avgWin)}
            </div>
            <div className="text-sm text-red-600">
              {formatCurrency(stats.avgLoss)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Trades</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTrades}</div>
            <div className="text-xs text-muted-foreground">
              Currently open
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTrades.length > 0 ? recentTrades.map((trade: any) => (
              <div key={trade.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Badge variant={trade.tradeType === 'BUY' ? 'default' : 'secondary'}>
                    {trade.tradeType}
                  </Badge>
                  <div>
                    <p className="font-medium">{trade.instrument}</p>
                    <p className="text-sm text-muted-foreground">{new Date(trade.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(trade.pnl || 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">{trade.status}</p>
                </div>
              </div>
            )) : (
              <p className="text-muted-foreground text-center py-4">No trades yet. Start by adding your first trade!</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}