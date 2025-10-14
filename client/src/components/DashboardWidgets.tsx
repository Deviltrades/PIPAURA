import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
 
  Percent, 
  Calculator, 
  BarChart3, 
  Calendar, 
  DollarSign,
  X,
  ArrowUp,
  ArrowDown,
  Clock
} from "lucide-react";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { TradingCalendar } from "./TradingCalendar";
import type { WidgetType } from "./WidgetManager";

interface WidgetProps {
  onRemove: () => void;
  analytics?: any;
  trades?: any[];
  isCustomizing?: boolean;
  selectedAccount?: string;
}

export function TotalPnLWidget({ onRemove, analytics }: WidgetProps) {
  const totalPnL = analytics?.totalPnL || 0;
  
  return (
    <Card className="relative group">
      <Button 
        variant="ghost" 
        size="sm" 
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </Button>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatCurrency(totalPnL)}
        </div>
        <div className="flex items-center text-xs text-muted-foreground">
          {totalPnL >= 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
          Overall performance
        </div>
      </CardContent>
    </Card>
  );
}

export function WinRateWidget({ onRemove, analytics }: WidgetProps) {
  const winRate = analytics?.winRate || 0;
  const totalTrades = analytics?.totalTrades || 0;
  
  return (
    <Card className="relative group">
      <Button 
        variant="ghost" 
        size="sm" 
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </Button>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
        <Percent className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{winRate.toFixed(1)}%</div>
        <div className="text-xs text-muted-foreground">
          {totalTrades} total trades
        </div>
      </CardContent>
    </Card>
  );
}


export function AvgWinLossWidget({ onRemove, analytics }: WidgetProps) {
  const avgTrade = analytics?.averageTrade || 0;
  
  return (
    <Card className="relative group">
      <Button 
        variant="ghost" 
        size="sm" 
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </Button>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Avg Trade</CardTitle>
        <Calculator className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${avgTrade >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatCurrency(avgTrade)}
        </div>
        <div className="text-xs text-muted-foreground">
          Per trade average
        </div>
      </CardContent>
    </Card>
  );
}

export function RecentTradesWidget({ onRemove, trades }: WidgetProps) {
  const recentTrades = trades?.slice(0, 5) || [];
  
  return (
    <Card className="relative group col-span-full">
      <Button 
        variant="ghost" 
        size="sm" 
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </Button>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Recent Trades
        </CardTitle>
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
                  <p className="text-sm text-muted-foreground">
                    {trade.createdAt ? new Date(trade.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-medium ${(trade.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
  );
}

export function DailyPnLChartWidget({ onRemove }: WidgetProps) {
  return (
    <Card className="relative group col-span-full">
      <Button 
        variant="ghost" 
        size="sm" 
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </Button>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Daily P&L Chart
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-lg">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Chart visualization coming soon</p>
            <p className="text-sm text-muted-foreground">Will show your daily performance trend</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TradingCalendarWidget({ onRemove, selectedAccount }: WidgetProps) {
  return (
    <div className="relative group col-span-full">
      <Button 
        variant="ghost" 
        size="sm" 
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 z-10"
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </Button>
      <TradingCalendar className="w-full" selectedAccount={selectedAccount} />
    </div>
  );
}

export function RiskMetricsWidget({ onRemove, analytics }: WidgetProps) {
  const winRate = analytics?.winRate || 0;
  const totalTrades = analytics?.totalTrades || 0;
  
  return (
    <Card className="relative group">
      <Button 
        variant="ghost" 
        size="sm" 
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </Button>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Risk Metrics</CardTitle>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Risk/Reward</span>
            <span className="font-medium">1:2.5</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Max Drawdown</span>
            <span className="font-medium text-red-600">-5.2%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Profit Factor</span>
            <span className="font-medium text-green-600">1.8</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SessionBreakdownWidget({ onRemove, trades }: WidgetProps) {
  // Calculate session statistics
  const sessionStats = (trades || []).reduce((acc: any, trade: any) => {
    const session = trade.session_tag || "Unknown";
    if (!acc[session]) {
      acc[session] = { count: 0, pnl: 0, wins: 0 };
    }
    acc[session].count++;
    if (trade.pnl !== null && trade.pnl !== undefined) {
      const pnlValue = parseFloat(trade.pnl);
      acc[session].pnl += pnlValue;
      if (pnlValue > 0) acc[session].wins++;
    }
    return acc;
  }, {});

  const sessions = Object.entries(sessionStats).map(([name, stats]: [string, any]) => ({
    name,
    ...stats,
    winRate: stats.count > 0 ? (stats.wins / stats.count) * 100 : 0,
  })).sort((a, b) => b.count - a.count);

  const getSessionColor = (session: string) => {
    switch (session.toLowerCase()) {
      case "london": return "bg-blue-600";
      case "new york": return "bg-purple-600";
      case "asia": return "bg-orange-600";
      case "overlap": return "bg-pink-600";
      default: return "bg-gray-600";
    }
  };

  return (
    <Card className="relative group">
      <Button 
        variant="ghost" 
        size="sm" 
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </Button>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Session Breakdown</CardTitle>
        <Clock className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sessions.length > 0 ? (
            sessions.map((session) => (
              <div key={session.name} className="space-y-1">
                <div className="flex items-center justify-between">
                  <Badge className={`${getSessionColor(session.name)} text-white`}>
                    {session.name}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{session.count} trades</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Win Rate:</span>
                  <span className="font-medium">{session.winRate.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">P&L:</span>
                  <span className={`font-medium ${session.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(session.pnl)}
                  </span>
                </div>
                {session.name !== sessions[sessions.length - 1].name && (
                  <div className="border-b border-border my-2"></div>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No session data available
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export const widgetComponents = {
  "total-pnl": TotalPnLWidget,
  "win-rate": WinRateWidget,
  "avg-win-loss": AvgWinLossWidget,
  "daily-pnl-chart": DailyPnLChartWidget,
  "recent-trades": RecentTradesWidget,
  "trading-calendar": TradingCalendarWidget,
  "risk-metrics": RiskMetricsWidget,
  "session-breakdown": SessionBreakdownWidget,
} as const;