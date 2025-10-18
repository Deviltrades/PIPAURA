import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, DollarSign, Clock, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface SessionInsightsProps {
  trades: any[];
  bgColor?: string;
  textColor?: string;
  themeColor?: string;
}

export function SessionInsights({ trades, bgColor = "#0f1f3a", textColor = "#ffffff", themeColor = "slate" }: SessionInsightsProps) {
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
    const sessionColors: Record<string, string> = {
      "london": "bg-blue-500 text-white",
      "new york": "bg-purple-500 text-white",
      "asia": "bg-orange-600 text-white",
      "overlap": "bg-cyan-500 text-white",
    };
    return sessionColors[session.toLowerCase()] || "bg-gray-500 text-white";
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
      <Card className="border" style={{ backgroundColor: bgColor, borderColor: `${textColor}30` }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: textColor }}>
            <TrendingUp className="h-5 w-5" style={{ color: textColor }} />
            Session Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8" style={{ color: `${textColor}99` }}>
            No session data available yet. Start trading to see insights!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 transition-all duration-300 bg-slate-800/60" style={{ 
      borderColor: "rgba(6, 182, 212, 0.3)",
      boxShadow: `0 0 15px ${textColor}20`
    }}>
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2" style={{ color: textColor }}>
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: textColor }} />
          Session Insights
        </CardTitle>
        <p className="text-xs sm:text-sm" style={{ color: `${textColor}99` }}>Performance breakdown by trading session</p>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
          {/* Most Active Session */}
          <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 rounded-lg border transition-all duration-300" style={{
            backgroundColor: `${textColor}05`,
            borderColor: `${textColor}30`
          }}>
            <div className="flex items-center gap-2">
              <div className="p-1.5 sm:p-2 rounded-lg" style={{ backgroundColor: `${textColor}20` }}>
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: textColor }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: `${textColor}99` }}>Most Active</p>
                <p className="text-xs sm:text-sm font-medium" style={{ color: textColor }}>Trading Session</p>
              </div>
            </div>
            <div className="space-y-1 sm:space-y-2">
              <Badge className={`text-sm sm:text-base px-2 sm:px-3 py-0.5 sm:py-1 ${getSessionColor(mostActive.name)}`} data-testid="badge-most-active-session">
                {mostActive.name}
              </Badge>
              <p className="text-xl sm:text-2xl font-bold" style={{ color: textColor }} data-testid="text-most-active-count">
                {mostActive.count} trades
              </p>
              <p className="text-xs" style={{ color: `${textColor}99` }}>
                {((mostActive.count / trades.length) * 100).toFixed(1)}% of all trades
              </p>
            </div>
          </div>

          {/* Most Profitable Session */}
          <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 rounded-lg border transition-all duration-300" style={{
            backgroundColor: `${textColor}05`,
            borderColor: `${textColor}30`
          }}>
            <div className="flex items-center gap-2">
              <div className="p-1.5 sm:p-2 rounded-lg" style={{ backgroundColor: `${textColor}20` }}>
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: textColor }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: `${textColor}99` }}>Most Profitable</p>
                <p className="text-xs sm:text-sm font-medium" style={{ color: textColor }}>Trading Session</p>
              </div>
            </div>
            <div className="space-y-1 sm:space-y-2">
              <Badge className={`text-sm sm:text-base px-2 sm:px-3 py-0.5 sm:py-1 ${getSessionColor(mostProfitable.name)}`} data-testid="badge-most-profitable-session">
                {mostProfitable.name}
              </Badge>
              <p className={`text-xl sm:text-2xl font-bold ${mostProfitable.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`} data-testid="text-most-profitable-pnl">
                {formatCurrency(mostProfitable.pnl)}
              </p>
              <p className="text-xs" style={{ color: `${textColor}99` }}>
                Total session P&L
              </p>
            </div>
          </div>

          {/* Longest Holding Session */}
          <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 rounded-lg border transition-all duration-300" style={{
            backgroundColor: `${textColor}05`,
            borderColor: `${textColor}30`
          }}>
            <div className="flex items-center gap-2">
              <div className="p-1.5 sm:p-2 rounded-lg" style={{ backgroundColor: `${textColor}20` }}>
                <Clock className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: textColor }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: `${textColor}99` }}>Longest Holding</p>
                <p className="text-xs sm:text-sm font-medium" style={{ color: textColor }}>Trading Session</p>
              </div>
            </div>
            <div className="space-y-1 sm:space-y-2">
              <Badge className={`text-sm sm:text-base px-2 sm:px-3 py-0.5 sm:py-1 ${getSessionColor(longestHolding.name)}`} data-testid="badge-longest-holding-session">
                {longestHolding.name}
              </Badge>
              <p className="text-xl sm:text-2xl font-bold" style={{ color: textColor }} data-testid="text-longest-holding-time">
                {formatHoldingTime(longestHolding.avgHoldingTime)}
              </p>
              <p className="text-xs" style={{ color: `${textColor}99` }}>
                Average trade duration
              </p>
            </div>
          </div>
        </div>

        {/* Session Performance Bars */}
        <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
          <p className="text-xs sm:text-sm font-medium" style={{ color: textColor }}>Session Performance Overview</p>
          {sessions
            .filter(s => s.name !== "Unknown")
            .sort((a, b) => b.pnl - a.pnl)
            .map((session) => {
              const maxPnL = Math.max(...sessions.map(s => Math.abs(s.pnl)));
              const percentage = maxPnL > 0 ? (Math.abs(session.pnl) / maxPnL) * 100 : 0;
              
              return (
                <div key={session.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <Badge className={`text-xs ${getSessionColor(session.name)}`}>
                      {session.name}
                    </Badge>
                    <span className={`font-medium ${session.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(session.pnl)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${textColor}20` }}>
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
