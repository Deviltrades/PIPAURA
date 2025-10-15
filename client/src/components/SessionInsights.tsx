import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, DollarSign, Clock, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface SessionInsightsProps {
  trades: any[];
}

export function SessionInsights({ trades }: SessionInsightsProps) {
  // Calculate session statistics
  const sessionStats = (trades || []).reduce((acc: any, trade: any) => {
    const session = trade.session_tag || "Unknown";
    if (!acc[session]) {
      acc[session] = { 
        count: 0, 
        pnl: 0, 
        totalHoldingTime: 0, 
        holdingTimeCount: 0 
      };
    }
    acc[session].count++;
    
    if (trade.pnl !== null && trade.pnl !== undefined) {
      acc[session].pnl += parseFloat(trade.pnl);
    }
    
    if (trade.holding_time_minutes !== null && trade.holding_time_minutes !== undefined) {
      acc[session].totalHoldingTime += trade.holding_time_minutes;
      acc[session].holdingTimeCount++;
    }
    
    return acc;
  }, {});

  // Get insights
  const sessions = Object.entries(sessionStats).map(([name, stats]: [string, any]) => ({
    name,
    count: stats.count,
    pnl: stats.pnl,
    avgHoldingTime: stats.holdingTimeCount > 0 ? stats.totalHoldingTime / stats.holdingTimeCount : 0,
  }));

  // Find most active session
  const mostActive = sessions.reduce((prev, current) => 
    current.count > prev.count ? current : prev
  , sessions[0] || { name: "N/A", count: 0 });

  // Find most profitable session
  const mostProfitable = sessions.reduce((prev, current) => 
    current.pnl > prev.pnl ? current : prev
  , sessions[0] || { name: "N/A", pnl: 0 });

  // Find longest holding session
  const longestHolding = sessions.reduce((prev, current) => 
    current.avgHoldingTime > prev.avgHoldingTime ? current : prev
  , sessions[0] || { name: "N/A", avgHoldingTime: 0 });

  const getSessionColor = (session: string) => {
    switch (session.toLowerCase()) {
      case "london": return "bg-blue-600 text-white";
      case "new york": return "bg-purple-600 text-white";
      case "asia": return "bg-orange-600 text-white";
      case "overlap": return "bg-pink-600 text-white";
      default: return "bg-gray-600 text-white";
    }
  };

  const formatHoldingTime = (minutes: number) => {
    if (!minutes) return "N/A";
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (!trades || trades.length === 0) {
    return (
      <Card className="bg-[#0f1f3a] border-[#1a2f4a]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-cyan-400" />
            Session Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-center py-8">
            No session data available yet. Start trading to see insights!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#0f1f3a] border-2 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-cyan-400" />
          Session Insights
        </CardTitle>
        <p className="text-sm text-gray-400">Performance breakdown by trading session</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Most Active Session */}
          <div className="space-y-3 p-4 rounded-lg bg-slate-800/50 border border-cyan-500/20 transition-all duration-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.6)] hover:border-cyan-500/60">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-cyan-600/20">
                <Trophy className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Most Active</p>
                <p className="text-sm font-medium text-white">Trading Session</p>
              </div>
            </div>
            <div className="space-y-2">
              <Badge className={`${getSessionColor(mostActive.name)} text-base px-3 py-1`} data-testid="badge-most-active-session">
                {mostActive.name}
              </Badge>
              <p className="text-2xl font-bold text-cyan-400" data-testid="text-most-active-count">
                {mostActive.count} trades
              </p>
              <p className="text-xs text-gray-400">
                {((mostActive.count / trades.length) * 100).toFixed(1)}% of all trades
              </p>
            </div>
          </div>

          {/* Most Profitable Session */}
          <div className="space-y-3 p-4 rounded-lg bg-slate-800/50 border border-green-500/20 transition-all duration-300 hover:shadow-[0_0_20px_rgba(34,197,94,0.6)] hover:border-green-500/60">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-600/20">
                <DollarSign className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Most Profitable</p>
                <p className="text-sm font-medium text-white">Trading Session</p>
              </div>
            </div>
            <div className="space-y-2">
              <Badge className={`${getSessionColor(mostProfitable.name)} text-base px-3 py-1`} data-testid="badge-most-profitable-session">
                {mostProfitable.name}
              </Badge>
              <p className={`text-2xl font-bold ${mostProfitable.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`} data-testid="text-most-profitable-pnl">
                {formatCurrency(mostProfitable.pnl)}
              </p>
              <p className="text-xs text-gray-400">
                Total session P&L
              </p>
            </div>
          </div>

          {/* Longest Holding Session */}
          <div className="space-y-3 p-4 rounded-lg bg-slate-800/50 border border-purple-500/20 transition-all duration-300 hover:shadow-[0_0_20px_rgba(168,85,247,0.6)] hover:border-purple-500/60">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-600/20">
                <Clock className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Longest Holding</p>
                <p className="text-sm font-medium text-white">Trading Session</p>
              </div>
            </div>
            <div className="space-y-2">
              <Badge className={`${getSessionColor(longestHolding.name)} text-base px-3 py-1`} data-testid="badge-longest-holding-session">
                {longestHolding.name}
              </Badge>
              <p className="text-2xl font-bold text-purple-400" data-testid="text-longest-holding-time">
                {formatHoldingTime(longestHolding.avgHoldingTime)}
              </p>
              <p className="text-xs text-gray-400">
                Average trade duration
              </p>
            </div>
          </div>
        </div>

        {/* Session Performance Bars */}
        <div className="mt-6 space-y-3">
          <p className="text-sm font-medium text-white">Session Performance Overview</p>
          {sessions
            .filter(s => s.name !== "Unknown")
            .sort((a, b) => b.pnl - a.pnl)
            .map((session) => {
              const maxPnL = Math.max(...sessions.map(s => Math.abs(s.pnl)));
              const percentage = maxPnL > 0 ? (Math.abs(session.pnl) / maxPnL) * 100 : 0;
              
              return (
                <div key={session.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <Badge className={`${getSessionColor(session.name)} text-xs`}>
                      {session.name}
                    </Badge>
                    <span className={`font-medium ${session.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(session.pnl)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${session.pnl >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
}
