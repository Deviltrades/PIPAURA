import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Settings, TrendingUp, TrendingDown } from "lucide-react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth,
  isToday,
  getDay
} from "date-fns";
import { demoTrades, demoAccounts } from "@/lib/demo-data";
import { formatCurrency } from "@/lib/utils";

export default function PreviewCalendar() {
  const [viewMonth, setViewMonth] = useState(new Date("2025-01-20"));
  const [selectedSymbol, setSelectedSymbol] = useState("all");
  const [selectedStrategy, setSelectedStrategy] = useState("all");
  const [selectedDirection, setSelectedDirection] = useState("all");
  const [displayMode, setDisplayMode] = useState<"percentage" | "dollar">("percentage");
  const [showWeekends, setShowWeekends] = useState(true); // Mobile-friendly default
  const [showWeeklyTotals, setShowWeeklyTotals] = useState(false);
  const [showMonthlySummary, setShowMonthlySummary] = useState(false);
  const [showConsistencyTracker, setShowConsistencyTracker] = useState(false);
  const [clearView, setClearView] = useState(false);
  const [monthlyStatsConfig, setMonthlyStatsConfig] = useState({
    riskReward: true,
    totalPnL: true,
    daysTraded: true,
    totalTrades: false,
    winRate: false
  });
  
  // Filter trades
  const filteredTrades = demoTrades.filter(trade => {
    if (selectedSymbol !== "all") {
      if (selectedSymbol === "forex" && trade.instrument_type !== "FOREX") return false;
      if (selectedSymbol === "indices" && trade.instrument_type !== "INDICES") return false;
      if (selectedSymbol === "crypto" && trade.instrument_type !== "CRYPTO") return false;
    }
    if (selectedDirection !== "all") {
      if (selectedDirection === "buy" && trade.trade_type !== "BUY") return false;
      if (selectedDirection === "sell" && trade.trade_type !== "SELL") return false;
    }
    return true;
  });

  // Group trades by date
  const tradesByDate = filteredTrades.reduce((acc, trade) => {
    const dateStr = new Date(trade.entry_date).toISOString().split('T')[0];
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(trade);
    return acc;
  }, {} as Record<string, typeof demoTrades>);

  // Generate calendar days
  const generateCalendarDays = () => {
    const start = startOfWeek(startOfMonth(viewMonth));
    const end = endOfWeek(endOfMonth(viewMonth));
    const allDays = eachDayOfInterval({ start, end });
    
    if (showWeekends) {
      return allDays;
    } else {
      return allDays.filter(day => {
        const dayOfWeek = getDay(day);
        return dayOfWeek >= 1 && dayOfWeek <= 5;
      });
    }
  };

  const calendarDays = generateCalendarDays();
  const layout = showWeekends ? {
    cols: 7,
    dayLabels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  } : {
    cols: 5,
    dayLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  };

  const getDailyPnL = (day: Date) => {
    const dateKey = format(day, "yyyy-MM-dd");
    const dayTrades = tradesByDate[dateKey] || [];
    return dayTrades.reduce((sum, trade) => sum + trade.pnl, 0);
  };

  // Calculate monthly stats
  const getMonthlySummary = () => {
    const totalPnL = filteredTrades.reduce((sum, t) => sum + t.pnl, 0);
    const daysTraded = Object.keys(tradesByDate).length;
    const totalWins = filteredTrades.filter(t => t.pnl > 0).length;
    const winRate = filteredTrades.length > 0 ? (totalWins / filteredTrades.length) * 100 : 0;
    const avgWin = totalWins > 0 ? filteredTrades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0) / totalWins : 0;
    const totalLosses = filteredTrades.filter(t => t.pnl < 0).length;
    const avgLoss = totalLosses > 0 ? Math.abs(filteredTrades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0) / totalLosses) : 0;
    const riskRewardRatio = avgLoss > 0 ? avgWin / avgLoss : 0;
    
    return {
      totalPnL,
      daysTraded,
      riskRewardRatio,
      totalTrades: filteredTrades.length,
      winRate
    };
  };

  // Calculate consistency score
  const getConsistencyScore = () => {
    const daysTraded = Object.keys(tradesByDate).length;
    const totalTrades = filteredTrades.length;
    const avgTradesPerDay = daysTraded > 0 ? totalTrades / daysTraded : 0;
    const winRate = filteredTrades.length > 0 ? (filteredTrades.filter(t => t.pnl > 0).length / filteredTrades.length) * 100 : 0;
    
    const frequencyScore = Math.min((daysTraded / 20) * 100, 100);
    const sizeScore = Math.min((avgTradesPerDay / 3) * 100, 100);
    const performanceScore = winRate;
    
    const score = Math.round((frequencyScore * 0.3 + sizeScore * 0.3 + performanceScore * 0.4));
    const rating = score < 30 ? 'Poor' : score < 60 ? 'Fair' : score < 80 ? 'Good' : 'Excellent';
    
    return { score, rating };
  };

  // Calculate weekly totals
  const getWeeklyTotals = () => {
    const weeks: { weekStart: Date; pnl: number; trades: number }[] = [];
    let currentWeek: Date | null = null;
    let weekPnL = 0;
    let weekTrades = 0;

    calendarDays.forEach((day) => {
      const weekStart = startOfWeek(day);
      
      if (!currentWeek || format(currentWeek, 'yyyy-MM-dd') !== format(weekStart, 'yyyy-MM-dd')) {
        if (currentWeek) {
          weeks.push({ weekStart: currentWeek, pnl: weekPnL, trades: weekTrades });
        }
        currentWeek = weekStart;
        weekPnL = 0;
        weekTrades = 0;
      }
      
      const dateKey = format(day, "yyyy-MM-dd");
      const dayTrades = tradesByDate[dateKey] || [];
      weekPnL += dayTrades.reduce((sum, t) => sum + t.pnl, 0);
      weekTrades += dayTrades.length;
    });
    
    if (currentWeek) {
      weeks.push({ weekStart: currentWeek, pnl: weekPnL, trades: weekTrades });
    }
    
    return weeks;
  };

  const monthlyStats = getMonthlySummary();
  const consistencyData = getConsistencyScore();
  const weeklyTotals = getWeeklyTotals();

  return (
    <div className="p-3 sm:p-4 lg:p-8 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Trading Calendar</h1>
            <p className="text-xs sm:text-sm text-gray-300">Daily P&L overview and trading activity</p>
          </div>
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 w-full sm:w-auto">
            <p className="text-xs sm:text-sm text-cyan-400">📊 Preview Mode - Demo Data</p>
          </div>
        </div>
      </div>

      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">
              {format(viewMonth, "MMMM yyyy")}
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
                className="border-slate-600 text-slate-400"
                data-testid="button-prev-month"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
                className="border-slate-600 text-slate-400"
                data-testid="button-next-month"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {!clearView && (
            <div className="flex flex-wrap gap-2 items-center">
              {/* Filters */}
              <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                <SelectTrigger className="w-[140px] bg-slate-800 border-slate-600" data-testid="select-symbol">
                  <SelectValue placeholder="Symbol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Symbols</SelectItem>
                  <SelectItem value="forex">Forex</SelectItem>
                  <SelectItem value="indices">Indices</SelectItem>
                  <SelectItem value="crypto">Crypto</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                <SelectTrigger className="w-[140px] bg-slate-800 border-slate-600" data-testid="select-strategy">
                  <SelectValue placeholder="Strategy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Strategies</SelectItem>
                  <SelectItem value="scalping">Scalping</SelectItem>
                  <SelectItem value="swing">Swing</SelectItem>
                  <SelectItem value="breakout">Breakout</SelectItem>
                  <SelectItem value="reversal">Reversal</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedDirection} onValueChange={setSelectedDirection}>
                <SelectTrigger className="w-[130px] bg-slate-800 border-slate-600" data-testid="select-direction">
                  <SelectValue placeholder="Direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="buy">Buy</SelectItem>
                  <SelectItem value="sell">Sell</SelectItem>
                </SelectContent>
              </Select>

              {/* Display Mode */}
              <Select value={displayMode} onValueChange={(v: "percentage" | "dollar") => setDisplayMode(v)}>
                <SelectTrigger className="w-[120px] bg-slate-800 border-slate-600" data-testid="select-display-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="dollar">Dollar</SelectItem>
                </SelectContent>
              </Select>

              {/* Optionals Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-slate-800 border-slate-600" data-testid="button-optionals">
                    <Settings className="w-4 h-4 mr-2" />
                    Optionals
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 bg-slate-800 border-slate-600">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-white">Display Options</h4>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="weekends" className="text-slate-300">Weekends</Label>
                      <Checkbox
                        id="weekends"
                        checked={showWeekends}
                        onCheckedChange={(checked) => setShowWeekends(!!checked)}
                        data-testid="checkbox-weekends"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="weekly" className="text-slate-300">Weekly Totals</Label>
                      <Checkbox
                        id="weekly"
                        checked={showWeeklyTotals}
                        onCheckedChange={(checked) => setShowWeeklyTotals(!!checked)}
                        data-testid="checkbox-weekly-totals"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="monthly" className="text-slate-300">Monthly Stats</Label>
                      <Checkbox
                        id="monthly"
                        checked={showMonthlySummary}
                        onCheckedChange={(checked) => setShowMonthlySummary(!!checked)}
                        data-testid="checkbox-monthly-summary"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="consistency" className="text-slate-300">Consistency Tracker</Label>
                      <Checkbox
                        id="consistency"
                        checked={showConsistencyTracker}
                        onCheckedChange={(checked) => setShowConsistencyTracker(!!checked)}
                        data-testid="checkbox-consistency-tracker"
                      />
                    </div>

                    {showMonthlySummary && (
                      <>
                        <div className="pt-2 border-t border-slate-600">
                          <p className="text-xs text-slate-400 mb-2">Monthly Stats to Show:</p>
                          {Object.entries(monthlyStatsConfig).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between mb-2">
                              <Label htmlFor={key} className="text-xs text-slate-300 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </Label>
                              <Checkbox
                                id={key}
                                checked={value}
                                onCheckedChange={(checked) => setMonthlyStatsConfig(prev => ({ ...prev, [key]: !!checked }))}
                              />
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Clear View Toggle */}
              <div className="flex items-center gap-2">
                <Switch
                  id="clear-view"
                  checked={clearView}
                  onCheckedChange={setClearView}
                  data-testid="switch-clear-view"
                />
                <Label htmlFor="clear-view" className="text-sm text-slate-300">Clear View</Label>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {/* Monthly Summary Bar */}
          {showMonthlySummary && (
            <div className="mb-6 bg-slate-800 rounded-lg px-4 py-3 flex items-center justify-between overflow-x-auto border-2 border-cyan-500/60">
              <div className="flex items-center gap-4 min-w-0">
                <span className="text-white text-sm font-medium">Monthly:</span>
                <div className="flex items-center gap-4 text-white">
                  {monthlyStatsConfig.totalPnL && (
                    <div className={`px-3 py-2 rounded-md text-sm font-semibold ${
                      monthlyStats.totalPnL >= 0 ? 'bg-green-600' : 'bg-red-600'
                    }`}>
                      {monthlyStats.totalPnL >= 0 ? '+' : ''}${Math.abs(monthlyStats.totalPnL) >= 1000 
                        ? `${(monthlyStats.totalPnL / 1000).toFixed(1)}k` 
                        : monthlyStats.totalPnL.toFixed(0)}
                    </div>
                  )}
                  {monthlyStatsConfig.daysTraded && (
                    <div className="text-sm">
                      <span className="font-semibold">{monthlyStats.daysTraded}</span> days
                    </div>
                  )}
                  {monthlyStatsConfig.riskReward && (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-xs">R</span>
                      </div>
                      <span className="text-sm">{monthlyStats.riskRewardRatio.toFixed(2)}</span>
                    </div>
                  )}
                  {monthlyStatsConfig.totalTrades && (
                    <div className="text-sm">
                      <span className="font-semibold">{monthlyStats.totalTrades}</span> trades
                    </div>
                  )}
                  {monthlyStatsConfig.winRate && (
                    <div className="text-sm">
                      <span className="font-semibold">{monthlyStats.winRate.toFixed(1)}%</span> WR
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Consistency Tracker Bar */}
          {showConsistencyTracker && (
            <div className="mb-6 bg-slate-800 rounded-lg px-4 py-3 border-2 border-cyan-500/60">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-white text-sm font-medium">Consistency:</span>
                  <div className="relative flex-1">
                    <div className="relative w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${consistencyData.score}%`, 
                          backgroundColor: consistencyData.score < 30 ? '#ef4444' : consistencyData.score < 60 ? '#f97316' : '#22c55e' 
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-center gap-4 mt-2 text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span>0-30%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span>30-60%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>60-100%</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-semibold">{consistencyData.score}%</span>
                  <span className={`text-xs font-medium ${
                    consistencyData.score < 30 ? 'text-red-400' : consistencyData.score < 60 ? 'text-orange-400' : 'text-green-400'
                  }`}>
                    {consistencyData.rating}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Calendar Container - Horizontal scroll on mobile */}
          <div className={`flex ${showWeeklyTotals ? 'gap-4' : ''} overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0`}>
            {/* Main Calendar */}
            <div className="flex-1 min-w-max">
              {/* Days of Week Header */}
              <div className={`grid grid-cols-${layout.cols} gap-0.5 sm:gap-1 mb-2`}>
                {layout.dayLabels.map((day) => (
                  <div key={day} className="h-8 sm:h-10 flex items-center justify-center min-w-[80px] sm:min-w-0">
                    <span className="text-xs sm:text-sm font-medium text-slate-400">{day}</span>
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className={`grid grid-cols-${layout.cols} gap-0.5 sm:gap-1`}>
                {calendarDays.map((day) => {
                  const dateKey = format(day, "yyyy-MM-dd");
                  const dayTrades = tradesByDate[dateKey] || [];
                  const dailyPnL = getDailyPnL(day);
                  const isCurrentMonth = isSameMonth(day, viewMonth);
                  const isCurrentDay = isToday(day);

                  const getDayStyles = () => {
                    if (dayTrades.length === 0) {
                      return {
                        bg: 'bg-slate-800/30',
                        border: 'border-slate-700',
                        shadow: 'none'
                      };
                    }
                    if (dailyPnL > 0) {
                      return {
                        bg: 'bg-green-500/10',
                        border: 'border-green-500/50',
                        shadow: 'shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                      };
                    }
                    return {
                      bg: 'bg-red-500/10',
                      border: 'border-red-500/50',
                      shadow: 'shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                    };
                  };

                  const styles = getDayStyles();

                  return (
                    <div
                      key={format(day, "yyyy-MM-dd")}
                      className={`
                        min-w-[80px] sm:min-w-0 h-32 sm:h-28 lg:h-32 p-2 sm:p-2.5 rounded-lg border transition-all cursor-pointer
                        ${styles.bg} ${styles.border} ${styles.shadow}
                        ${isCurrentDay ? 'ring-2 ring-cyan-500' : ''}
                        ${!isCurrentMonth ? 'opacity-40' : ''}
                        hover:brightness-110
                      `}
                      data-testid={`calendar-day-${format(day, "d")}`}
                    >
                      <div className="h-full flex flex-col">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs sm:text-sm font-medium ${isCurrentDay ? 'text-cyan-400' : 'text-white'}`}>
                            {format(day, "d")}
                          </span>
                          {dayTrades.length > 0 && (
                            <Badge variant="secondary" className="text-[10px] px-1 py-0">
                              {dayTrades.length}
                            </Badge>
                          )}
                        </div>
                        
                        {dayTrades.length > 0 && (
                          <div className="flex-1 flex flex-col justify-center">
                            <div className={`text-xs sm:text-sm font-bold mb-1 ${dailyPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {displayMode === "dollar" ? formatCurrency(dailyPnL) : `${dailyPnL > 0 ? '+' : ''}${((dailyPnL / 10000) * 100).toFixed(1)}%`}
                            </div>
                            <div className="flex gap-1">
                              {dayTrades.slice(0, 2).map((trade, i) => (
                                <div key={i} className="flex items-center gap-0.5">
                                  {trade.pnl >= 0 ? (
                                    <TrendingUp className="w-3 h-3 text-green-400" />
                                  ) : (
                                    <TrendingDown className="w-3 h-3 text-red-400" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Weekly Totals Sidebar */}
            {showWeeklyTotals && (
              <div className="w-24">
                <div className="h-10 flex items-center justify-center mb-2">
                  <span className="text-sm font-medium text-slate-400">Week</span>
                </div>
                <div className="space-y-0.5">
                  {weeklyTotals.map((week, index) => (
                    <div 
                      key={index} 
                      className="h-28 bg-slate-800/50 border border-slate-600 rounded-lg p-2 flex flex-col items-center justify-center"
                      data-testid={`weekly-total-${index}`}
                    >
                      <div className={`text-sm font-bold ${week.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(week.pnl)}
                      </div>
                      <div className="text-xs text-slate-500">{week.trades} trades</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
