import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Calendar as CalendarIcon, ChevronDown, ChevronRight, MoreVertical } from "lucide-react";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { getTrades } from "@/lib/supabase-service";
import type { Trade } from "@shared/schema";
import { cn } from "@/lib/utils";

interface ReportsProps {
  accountId: string;
}

interface TradeFilters {
  instrument?: string;
  intradayMultiday?: "intraday" | "multiday" | "both";
  openClosed?: "open" | "closed" | "both";
  reviewed?: "reviewed" | "unreviewed" | "both";
  side?: "BUY" | "SELL" | "both";
  symbol?: string;
  status?: string;
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export function Reports({ accountId }: ReportsProps) {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  
  const [filters, setFilters] = useState<TradeFilters>({
    openClosed: "closed",
  });
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(["general", "tags"]);
  
  // Fetch trades
  const { data: allTrades = [], isLoading } = useQuery({
    queryKey: ['/api/trades', accountId],
    queryFn: () => getTrades(),
  });
  
  // Filter trades based on date range and filters
  const filteredTrades = useMemo(() => {
    return allTrades.filter(trade => {
      // Date range filter
      if (dateRange.from && dateRange.to) {
        const tradeDate = parseISO(trade.entry_time);
        if (tradeDate < dateRange.from || tradeDate > dateRange.to) {
          return false;
        }
      }
      
      // Account filter
      if (accountId !== 'all' && trade.account_id !== accountId) {
        return false;
      }
      
      // Open/Closed filter
      if (filters.openClosed === "open" && trade.status !== "OPEN") return false;
      if (filters.openClosed === "closed" && trade.status !== "CLOSED") return false;
      
      // Side filter
      if (filters.side && filters.side !== "both" && trade.direction !== filters.side) return false;
      
      return true;
    });
  }, [allTrades, dateRange, accountId, filters]);
  
  // Calculate comprehensive statistics
  const stats = useMemo(() => {
    const closedTrades = filteredTrades.filter(t => t.status === "CLOSED");
    
    if (closedTrades.length === 0) {
      return {
        totalPnL: 0,
        avgDailyVolume: 0,
        avgWinningTrade: 0,
        avgLosingTrade: 0,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        breakEvenTrades: 0,
        maxConsecutiveWins: 0,
        maxConsecutiveLosses: 0,
        totalCommissions: 0,
        totalFees: 0,
        totalSwap: 0,
        largestProfit: 0,
        largestLoss: 0,
        openTrades: 0,
        totalTradingDays: 0,
        winningDays: 0,
        losingDays: 0,
        breakEvenDays: 0,
        loggedDays: 0,
        maxConsecutiveWinDays: 0,
        maxConsecutiveLossDays: 0,
        avgDailyPnL: 0,
        avgWinningDayPnL: 0,
        avgLosingDayPnL: 0,
        largestProfitDay: 0,
        largestLossDay: 0,
        avgPlannedR: 0,
        bestMonth: { month: "", pnl: 0 },
        lowestMonth: { month: "", pnl: 0 },
        avgMonthlyPnL: 0,
      };
    }
    
    const wins = closedTrades.filter(t => parseFloat(t.pnl || "0") > 0);
    const losses = closedTrades.filter(t => parseFloat(t.pnl || "0") < 0);
    const breakEvens = closedTrades.filter(t => parseFloat(t.pnl || "0") === 0);
    
    const totalPnL = closedTrades.reduce((sum, t) => sum + parseFloat(t.pnl || "0"), 0);
    const totalCommissions = closedTrades.reduce((sum, t) => sum + Math.abs(parseFloat(t.commission || "0")), 0);
    const totalFees = 0; // Not tracked in current schema
    const totalSwap = closedTrades.reduce((sum, t) => sum + parseFloat(t.swap || "0"), 0);
    
    const avgWinningTrade = wins.length > 0 
      ? wins.reduce((sum, t) => sum + parseFloat(t.pnl || "0"), 0) / wins.length 
      : 0;
    
    const avgLosingTrade = losses.length > 0 
      ? losses.reduce((sum, t) => sum + parseFloat(t.pnl || "0"), 0) / losses.length 
      : 0;
    
    const largestProfit = wins.length > 0 
      ? Math.max(...wins.map(t => parseFloat(t.pnl || "0"))) 
      : 0;
    
    const largestLoss = losses.length > 0 
      ? Math.min(...losses.map(t => parseFloat(t.pnl || "0"))) 
      : 0;
    
    // Calculate consecutive wins/losses
    let maxConsecutiveWins = 0;
    let maxConsecutiveLosses = 0;
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    
    closedTrades.forEach(trade => {
      const pnl = parseFloat(trade.pnl || "0");
      if (pnl > 0) {
        currentWinStreak++;
        currentLossStreak = 0;
        maxConsecutiveWins = Math.max(maxConsecutiveWins, currentWinStreak);
      } else if (pnl < 0) {
        currentLossStreak++;
        currentWinStreak = 0;
        maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentLossStreak);
      } else {
        currentWinStreak = 0;
        currentLossStreak = 0;
      }
    });
    
    // Group by day for daily stats
    const tradesByDay: Record<string, Trade[]> = {};
    closedTrades.forEach(trade => {
      const day = trade.entry_time.split('T')[0];
      if (!tradesByDay[day]) tradesByDay[day] = [];
      tradesByDay[day].push(trade);
    });
    
    const dailyPnLs = Object.entries(tradesByDay).map(([day, trades]) => {
      const dayPnL = trades.reduce((sum, t) => sum + parseFloat(String(t.pnl || "0")), 0);
      return { day, pnl: dayPnL };
    });
    
    const winningDays = dailyPnLs.filter(d => d.pnl > 0).length;
    const losingDays = dailyPnLs.filter(d => d.pnl < 0).length;
    const breakEvenDays = dailyPnLs.filter(d => d.pnl === 0).length;
    
    const avgDailyPnL = dailyPnLs.length > 0 
      ? dailyPnLs.reduce((sum, d) => sum + d.pnl, 0) / dailyPnLs.length 
      : 0;
    
    const avgWinningDayPnL = winningDays > 0
      ? dailyPnLs.filter(d => d.pnl > 0).reduce((sum, d) => sum + d.pnl, 0) / winningDays
      : 0;
    
    const avgLosingDayPnL = losingDays > 0
      ? dailyPnLs.filter(d => d.pnl < 0).reduce((sum, d) => sum + d.pnl, 0) / losingDays
      : 0;
    
    const largestProfitDay = dailyPnLs.length > 0 
      ? Math.max(...dailyPnLs.map(d => d.pnl)) 
      : 0;
    
    const largestLossDay = dailyPnLs.length > 0 
      ? Math.min(...dailyPnLs.map(d => d.pnl)) 
      : 0;
    
    // Max consecutive win/loss days
    let maxConsecutiveWinDays = 0;
    let maxConsecutiveLossDays = 0;
    let currentWinDayStreak = 0;
    let currentLossDayStreak = 0;
    
    dailyPnLs.forEach(({ pnl }) => {
      if (pnl > 0) {
        currentWinDayStreak++;
        currentLossDayStreak = 0;
        maxConsecutiveWinDays = Math.max(maxConsecutiveWinDays, currentWinDayStreak);
      } else if (pnl < 0) {
        currentLossDayStreak++;
        currentWinDayStreak = 0;
        maxConsecutiveLossDays = Math.max(maxConsecutiveLossDays, currentLossDayStreak);
      } else {
        currentWinDayStreak = 0;
        currentLossDayStreak = 0;
      }
    });
    
    // Group by month for monthly stats
    const tradesByMonth: Record<string, Trade[]> = {};
    closedTrades.forEach(trade => {
      const month = trade.entry_time.substring(0, 7); // YYYY-MM
      if (!tradesByMonth[month]) tradesByMonth[month] = [];
      tradesByMonth[month].push(trade);
    });
    
    const monthlyPnLs = Object.entries(tradesByMonth).map(([month, trades]) => {
      const monthPnL = trades.reduce((sum, t) => sum + parseFloat(String(t.pnl || "0")), 0);
      return { month, pnl: monthPnL };
    });
    
    const bestMonth = monthlyPnLs.length > 0
      ? monthlyPnLs.reduce((best, current) => current.pnl > best.pnl ? current : best)
      : { month: "", pnl: 0 };
    
    const lowestMonth = monthlyPnLs.length > 0
      ? monthlyPnLs.reduce((worst, current) => current.pnl < worst.pnl ? current : worst)
      : { month: "", pnl: 0 };
    
    const avgMonthlyPnL = monthlyPnLs.length > 0
      ? monthlyPnLs.reduce((sum, m) => sum + m.pnl, 0) / monthlyPnLs.length
      : 0;
    
    // Calculate average planned R-Multiple
    const tradesWithRisk = closedTrades.filter(t => t.risk_amount && parseFloat(t.risk_amount) > 0);
    const avgPlannedR = tradesWithRisk.length > 0
      ? tradesWithRisk.reduce((sum, t) => sum + (parseFloat(t.pnl || "0") / parseFloat(t.risk_amount || "1")), 0) / tradesWithRisk.length
      : 0;
    
    // Calculate average daily volume (lots)
    const avgDailyVolume = dailyPnLs.length > 0
      ? closedTrades.reduce((sum, t) => sum + parseFloat(t.volume || "0"), 0) / dailyPnLs.length
      : 0;
    
    return {
      totalPnL,
      avgDailyVolume,
      avgWinningTrade,
      avgLosingTrade,
      totalTrades: closedTrades.length,
      winningTrades: wins.length,
      losingTrades: losses.length,
      breakEvenTrades: breakEvens.length,
      maxConsecutiveWins,
      maxConsecutiveLosses,
      totalCommissions,
      totalFees,
      totalSwap,
      largestProfit,
      largestLoss,
      openTrades: filteredTrades.filter(t => t.status === "OPEN").length,
      totalTradingDays: dailyPnLs.length,
      winningDays,
      losingDays,
      breakEvenDays,
      loggedDays: 0, // Not tracked
      maxConsecutiveWinDays,
      maxConsecutiveLossDays,
      avgDailyPnL,
      avgWinningDayPnL,
      avgLosingDayPnL,
      largestProfitDay,
      largestLossDay,
      avgPlannedR,
      bestMonth,
      lowestMonth,
      avgMonthlyPnL,
    };
  }, [filteredTrades]);
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };
  
  const resetFilters = () => {
    setFilters({ openClosed: "closed" });
    setDateRange({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    });
  };
  
  const applyFilters = () => {
    setIsFilterOpen(false);
  };
  
  return (
    <div className="space-y-4">
      {/* Header with Filters */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 flex-1">
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                className="bg-slate-800 border-slate-700 hover:bg-slate-700"
                data-testid="button-filters"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 bg-slate-900 border-slate-800 overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="text-white">Filter Reports</SheetTitle>
                <SheetDescription className="text-gray-400">
                  Customize your report filters
                </SheetDescription>
              </SheetHeader>
              
              <div className="mt-6 space-y-4">
                {/* General Section */}
                <Collapsible 
                  open={expandedSections.includes("general")}
                  onOpenChange={() => toggleSection("general")}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-purple-400 text-xl">⚙️</span>
                      <span className="text-white font-medium">General</span>
                    </div>
                    {expandedSections.includes("general") ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-3 pl-4">
                    {/* Filters will be added here */}
                  </CollapsibleContent>
                </Collapsible>
                
                {/* Tags Section */}
                <Collapsible 
                  open={expandedSections.includes("tags")}
                  onOpenChange={() => toggleSection("tags")}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-purple-400 text-xl">🏷️</span>
                      <span className="text-white font-medium">Tags</span>
                    </div>
                    {expandedSections.includes("tags") ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-3 pl-4">
                    {/* Open/Closed */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id="open-closed"
                          checked={true}
                          className="border-slate-600"
                        />
                        <Label htmlFor="open-closed" className="text-sm text-gray-300">
                          Open/Closed
                        </Label>
                      </div>
                      <Select 
                        value={filters.openClosed || "both"}
                        onValueChange={(value) => setFilters({ ...filters, openClosed: value as any })}
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="closed">Closed</SelectItem>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="both">Both</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Side */}
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="side"
                        checked={filters.side !== undefined}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFilters({ ...filters, side: "both" });
                          } else {
                            const { side, ...rest } = filters;
                            setFilters(rest);
                          }
                        }}
                        className="border-slate-600"
                      />
                      <Label htmlFor="side" className="text-sm text-gray-300">
                        Side
                      </Label>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
                
                {/* Day & Time Section */}
                <Collapsible 
                  open={expandedSections.includes("datetime")}
                  onOpenChange={() => toggleSection("datetime")}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-purple-400 text-xl">📅</span>
                      <span className="text-white font-medium">Day & Time</span>
                    </div>
                    {expandedSections.includes("datetime") ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </CollapsibleTrigger>
                </Collapsible>
                
                {/* Playbook Section */}
                <Collapsible 
                  open={expandedSections.includes("playbook")}
                  onOpenChange={() => toggleSection("playbook")}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-purple-400 text-xl">📚</span>
                      <span className="text-white font-medium">Playbook</span>
                    </div>
                    {expandedSections.includes("playbook") ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </CollapsibleTrigger>
                </Collapsible>
              </div>
              
              <SheetFooter className="mt-6 flex-col sm:flex-col gap-2">
                <Button 
                  variant="outline" 
                  onClick={resetFilters}
                  className="w-full bg-slate-800 border-slate-700 hover:bg-slate-700 text-white"
                  data-testid="button-reset-filters"
                >
                  Reset all
                </Button>
                <div className="flex gap-2 w-full">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsFilterOpen(false)}
                    className="flex-1 bg-slate-800 border-slate-700 hover:bg-slate-700 text-white"
                    data-testid="button-cancel-filters"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={applyFilters}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                    data-testid="button-apply-filters"
                  >
                    Apply filters
                  </Button>
                </div>
              </SheetFooter>
            </SheetContent>
          </Sheet>
          
          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "bg-slate-800 border-slate-700 hover:bg-slate-700 justify-start text-left font-normal",
                  !dateRange.from && !dateRange.to && "text-muted-foreground"
                )}
                data-testid="button-date-range"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from && dateRange.to ? (
                  <>
                    {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
                  </>
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                numberOfMonths={2}
                className="bg-slate-800 text-white"
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>
      
      {/* YOUR STATS Header */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                YOUR STATS
                <span className="text-xs text-gray-400 font-normal">ℹ️</span>
              </CardTitle>
              <p className="text-sm text-gray-400 mt-1">
                (FROM {dateRange.from ? format(dateRange.from, "MMM d, yyyy").toUpperCase() : "..."} TO {dateRange.to ? format(dateRange.to, "MMM d, yyyy").toUpperCase() : "..."})
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-400 mb-1">Best month</p>
              <p className={cn("text-2xl font-bold", stats.bestMonth.pnl >= 0 ? "text-green-500" : "text-red-500")}>
                {stats.bestMonth.pnl >= 0 ? "-" : ""}${Math.abs(stats.bestMonth.pnl).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.bestMonth.month ? `in ${format(parseISO(String(stats.bestMonth.month) + "-01"), "MMM yyyy")}` : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Lowest month</p>
              <p className={cn("text-2xl font-bold", stats.lowestMonth.pnl >= 0 ? "text-green-500" : "text-red-500")}>
                {stats.lowestMonth.pnl >= 0 ? "" : "-"}${Math.abs(stats.lowestMonth.pnl).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.lowestMonth.month ? `in ${format(parseISO(String(stats.lowestMonth.month) + "-01"), "MMM yyyy")}` : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Average</p>
              <p className={cn("text-2xl font-bold", stats.avgMonthlyPnL >= 0 ? "text-green-500" : "text-red-500")}>
                {stats.avgMonthlyPnL >= 0 ? "" : "-"}${Math.abs(stats.avgMonthlyPnL).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">per Month</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Statistics Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <div className="space-y-4">
              <StatRow label="Total P&L" value={`${stats.totalPnL >= 0 ? "" : "-"}$${Math.abs(stats.totalPnL).toFixed(2)}`} isNegative={stats.totalPnL < 0} />
              <StatRow label="Average daily volume" value={stats.avgDailyVolume.toFixed(2)} />
              <StatRow label="Average winning trade" value={`$${stats.avgWinningTrade.toFixed(2)}`} />
              <StatRow label="Average losing trade" value={`${stats.avgLosingTrade >= 0 ? "" : "-"}$${Math.abs(stats.avgLosingTrade).toFixed(2)}`} isNegative={stats.avgLosingTrade < 0} />
              <StatRow label="Total number of trades" value={stats.totalTrades.toString()} />
              <StatRow label="Number of winning trades" value={stats.winningTrades.toString()} />
              <StatRow label="Number of losing trades" value={stats.losingTrades.toString()} />
              <StatRow label="Number of break even trades" value={stats.breakEvenTrades.toString()} />
              <StatRow label="Max consecutive wins" value={stats.maxConsecutiveWins.toString()} />
              <StatRow label="Max consecutive losses" value={stats.maxConsecutiveLosses.toString()} />
              <StatRow label="Total commissions" value={`$${stats.totalCommissions.toFixed(2)}`} />
              <StatRow label="Total fees" value={`$${stats.totalFees.toFixed(2)}`} />
              <StatRow label="Total swap" value={`${stats.totalSwap >= 0 ? "" : "-"}$${Math.abs(stats.totalSwap).toFixed(2)}`} isNegative={stats.totalSwap < 0} />
              <StatRow label="Largest profit" value={`$${stats.largestProfit.toFixed(2)}`} />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <div className="space-y-4">
              <StatRow label="Open trades" value={stats.openTrades.toString()} />
              <StatRow label="Total trading days" value={stats.totalTradingDays.toString()} />
              <StatRow label="Winning days" value={stats.winningDays.toString()} />
              <StatRow label="Losing days" value={stats.losingDays.toString()} />
              <StatRow label="Breakeven days" value={stats.breakEvenDays.toString()} />
              <StatRow label="Logged days" value={stats.loggedDays.toString()} />
              <StatRow label="Max consecutive winning days" value={stats.maxConsecutiveWinDays.toString()} />
              <StatRow label="Max consecutive losing days" value={stats.maxConsecutiveLossDays.toString()} />
              <StatRow label="Average daily P&L" value={`${stats.avgDailyPnL >= 0 ? "" : "-"}$${Math.abs(stats.avgDailyPnL).toFixed(2)}`} isNegative={stats.avgDailyPnL < 0} />
              <StatRow label="Average winning day P&L" value={`$${stats.avgWinningDayPnL.toFixed(2)}`} />
              <StatRow label="Average losing day P&L" value={`${stats.avgLosingDayPnL >= 0 ? "" : "-"}$${Math.abs(stats.avgLosingDayPnL).toFixed(2)}`} isNegative={stats.avgLosingDayPnL < 0} />
              <StatRow label="Largest profitable day (Profits)" value={`$${stats.largestProfitDay.toFixed(2)}`} />
              <StatRow label="Largest losing day (Losses)" value={`${stats.largestLossDay >= 0 ? "" : "-"}$${Math.abs(stats.largestLossDay).toFixed(2)}`} isNegative={stats.largestLossDay < 0} />
              <StatRow label="Average planned R-Multiple" value={`${stats.avgPlannedR.toFixed(2)}R`} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface StatRowProps {
  label: string;
  value: string;
  isNegative?: boolean;
}

function StatRow({ label, value, isNegative }: StatRowProps) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-gray-400">{label}</span>
      <span className={cn("text-sm font-medium", isNegative ? "text-red-400" : "text-gray-200")}>
        {value}
      </span>
    </div>
  );
}
