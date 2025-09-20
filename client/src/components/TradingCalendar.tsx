import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Plus, Edit3 } from "lucide-react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  parseISO,
  addMonths,
  subMonths,
  isToday
} from "date-fns";
import { AddTradeModal } from "./AddTradeModal";
import { EditTradeModal } from "./EditTradeModal";
import type { Trade, User } from "@shared/schema";
import { Settings, Plus as PlusIcon } from "lucide-react";
import { Link } from "wouter";

interface TradingCalendarProps {
  className?: string;
}

export function TradingCalendar({ className }: TradingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMonth, setViewMonth] = useState<Date>(new Date());
  const [isAddTradeModalOpen, setIsAddTradeModalOpen] = useState(false);
  const [addTradeDate, setAddTradeDate] = useState<Date | null>(null);
  const [isEditTradeModalOpen, setIsEditTradeModalOpen] = useState(false);
  const [editTrade, setEditTrade] = useState<Trade | null>(null);
  
  // Filter states
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [selectedSymbol, setSelectedSymbol] = useState<string>("all");
  const [selectedStrategy, setSelectedStrategy] = useState<string>("all");
  const [selectedDirection, setSelectedDirection] = useState<string>("all");

  // Fetch all trades
  const { data: trades = [], isLoading } = useQuery<Trade[]>({
    queryKey: ["/api/trades"],
  });

  // Fetch user data for calendar settings
  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    staleTime: 0, // Always refetch to get latest calendar settings
  });

  // Group trades by date
  const tradesByDate = trades ? trades.reduce((acc, trade) => {
    if (trade.entryDate) {
      // Handle different date formats
      let entryDate: Date;
      if (typeof trade.entryDate === 'string') {
        // Try parsing ISO string first, then fallback to Date constructor
        const dateString = trade.entryDate as string;
        entryDate = dateString.indexOf('T') !== -1 ? parseISO(dateString) : new Date(dateString);
      } else {
        entryDate = new Date(trade.entryDate);
      }
      
      const dateKey = format(entryDate, "yyyy-MM-dd");
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(trade);
    }
    return acc;
  }, {} as Record<string, Trade[]>) : {};

  // Get trades for selected date
  const selectedDateTrades = selectedDate 
    ? tradesByDate[format(selectedDate, "yyyy-MM-dd")] || []
    : [];

  // Calculate daily P&L for a date
  const getDailyPnL = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    const dayTrades = tradesByDate[dateKey] || [];
    return dayTrades.reduce((total, trade) => {
      const pnl = typeof trade.pnl === 'string' ? parseFloat(trade.pnl) : (trade.pnl || 0);
      return total + pnl;
    }, 0);
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const start = startOfWeek(startOfMonth(viewMonth));
    const end = endOfWeek(endOfMonth(viewMonth));
    return eachDayOfInterval({ start, end });
  };

  const calendarDays = generateCalendarDays();

  const navigateMonth = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setViewMonth(subMonths(viewMonth, 1));
    } else {
      setViewMonth(addMonths(viewMonth, 1));
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
            <div className="h-80 bg-gray-200 dark:bg-gray-800 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} bg-background border`}>
      <CardContent className="p-3 sm:p-6">
        {/* Header with Month Navigation */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">
            {format(viewMonth, "MMMM yyyy")}
          </h2>
          <div className="flex items-center gap-2">
            <Link href="/calendar-settings">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-muted"
                title="Calendar Settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth("prev")}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth("next")}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 sm:mb-6">
          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
            <SelectTrigger className="h-9 text-xs sm:text-sm">
              <SelectValue placeholder="All Accounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              <SelectItem value="main">Main Account</SelectItem>
              <SelectItem value="demo">Demo Account</SelectItem>
              <SelectItem value="prop">Prop Firm</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
            <SelectTrigger className="h-9 text-xs sm:text-sm">
              <SelectValue placeholder="All Symbols" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Symbols</SelectItem>
              <SelectItem value="forex">Forex</SelectItem>
              <SelectItem value="indices">Indices</SelectItem>
              <SelectItem value="crypto">Crypto</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
            <SelectTrigger className="h-9 text-xs sm:text-sm">
              <SelectValue placeholder="All Strategies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Strategies</SelectItem>
              <SelectItem value="scalping">Scalping</SelectItem>
              <SelectItem value="swing">Swing Trading</SelectItem>
              <SelectItem value="breakout">Breakout</SelectItem>
              <SelectItem value="reversal">Reversal</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedDirection} onValueChange={setSelectedDirection}>
            <SelectTrigger className="h-9 text-xs sm:text-sm">
              <SelectValue placeholder="All Directions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Directions</SelectItem>
              <SelectItem value="buy">Buy Only</SelectItem>
              <SelectItem value="sell">Sell Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="h-8 sm:h-10 flex items-center justify-center">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">{day}</span>
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
          {calendarDays.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayTrades = tradesByDate[dateKey] || [];
            const dailyPnL = getDailyPnL(day);
            const isCurrentMonth = isSameMonth(day, viewMonth);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentDay = isToday(day);

            
            // Get calendar settings with proper typing
            const calendarSettings = (user?.calendarSettings as any) || {
              backgroundColor: "#1a1a1a",
              borderColor: "#374151",
              dayBackgroundColor: "#2d2d2d",
              dayBorderColor: "#4b5563"
            };

            // Determine background color based on P&L
            const getPnLBackgroundColor = () => {
              if (isSelected) return undefined; // Use default selected color
              if (dailyPnL > 0) return '#166534'; // Solid dark green background for profits
              if (dailyPnL < 0) return '#991b1b'; // Solid dark red background for losses
              return calendarSettings.dayBackgroundColor; // Default background
            };

            const getPnLBorderColor = () => {
              if (isSelected) return undefined; // Use default selected border
              if (dailyPnL > 0) return '#22c55e'; // Bright green border for profits
              if (dailyPnL < 0) return '#ef4444'; // Bright red border for losses
              return calendarSettings.dayBorderColor; // Default border
            };

            return (
              <div
                key={day.toISOString()}
                className={`
                  h-16 sm:h-20 border-2 rounded-lg transition-all duration-200 hover:border-primary/50
                  ${isSelected ? 'border-primary bg-primary/10' : ''}
                  ${isCurrentDay ? 'ring-1 sm:ring-2 ring-blue-400' : ''}
                  ${!isCurrentMonth ? 'opacity-40' : ''}
                  ${dailyPnL > 0 && !isSelected ? 'hover:bg-green-500/20' : ''}
                  ${dailyPnL < 0 && !isSelected ? 'hover:bg-red-500/20' : ''}
                  relative group cursor-pointer flex flex-col
                `}
                style={{
                  backgroundColor: getPnLBackgroundColor(),
                  borderColor: getPnLBorderColor()
                }}
                onClick={() => setSelectedDate(day)}
              >
                {/* Date - Top Left */}
                <div className="absolute top-0.5 sm:top-1 left-0.5 sm:left-1">
                  <span className={`text-xs sm:text-sm font-medium ${
                    isSelected ? 'text-primary' : 
                    isCurrentDay ? 'text-white font-semibold' : 
                    isCurrentMonth ? 'text-gray-200' : 'text-gray-500'
                  }`}>
                    {format(day, 'd')}
                  </span>
                </div>
                
                {/* Add Trade Button - Top Right - Always show for current month days */}
                {isCurrentMonth && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddTradeDate(day);
                      setIsAddTradeModalOpen(true);
                    }}
                    className="absolute top-0.5 sm:top-1 right-0.5 sm:right-1 opacity-60 group-hover:opacity-100 transition-opacity duration-200 w-4 h-4 sm:w-5 sm:h-5 bg-primary hover:bg-primary/80 rounded-sm flex items-center justify-center z-10"
                    title="Add trade for this date"
                  >
                    <PlusIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary-foreground" />
                  </button>
                )}
                
                {/* P&L Display - Center/Bottom */}
                {dayTrades.length > 0 && dailyPnL !== 0 && (
                  <div className="absolute bottom-1 sm:bottom-2 left-1/2 transform -translate-x-1/2">
                    <div className={`text-xs sm:text-sm font-bold px-1 sm:px-2 py-0.5 sm:py-1 rounded shadow-sm ${
                      dailyPnL > 0 ? "text-white bg-black/40" : "text-white bg-black/40"
                    }`}>
                      {dailyPnL > 0 ? '+' : ''}${dailyPnL.toFixed(0)}
                    </div>
                  </div>
                )}

                {/* TJ (TBH) Display for days without trades */}
                {dayTrades.length === 0 && isCurrentMonth && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="text-xs sm:text-sm text-muted-foreground/60 font-medium">
                      TJ (TBH)
                    </div>
                  </div>
                )}
                
                {/* Trade Count Indicator - Bottom Left */}
                {dayTrades.length > 0 && (
                  <div className="absolute bottom-0.5 sm:bottom-1 left-0.5 sm:left-1">
                    <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                      dailyPnL > 0 ? "bg-green-500" : 
                      dailyPnL < 0 ? "bg-red-500" : 
                      dayTrades.some(t => t.status === "OPEN") ? "bg-blue-500" : "bg-yellow-500"
                    }`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Date Details */}
        {selectedDate && (
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t">
            <h4 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </h4>
            
            {selectedDateTrades.length > 0 ? (
              <div className="space-y-3">
                {selectedDateTrades.map((trade) => (
                  <div
                    key={trade.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        {trade.instrumentType}
                      </Badge>
                      <span className="font-medium">
                        {trade.instrument}
                      </span>
                      <Badge 
                        variant={trade.tradeType === "BUY" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {trade.tradeType}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold flex items-center gap-1 ${
                        (typeof trade.pnl === 'string' ? parseFloat(trade.pnl) : (trade.pnl || 0)) >= 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        {(typeof trade.pnl === 'string' ? parseFloat(trade.pnl) : (trade.pnl || 0)) >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        ${(typeof trade.pnl === 'string' ? parseFloat(trade.pnl) : (trade.pnl || 0)).toFixed(2)}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditTrade(trade);
                          setIsEditTradeModalOpen(true);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <div className="mt-4 pt-3 border-t flex justify-between items-center">
                  <span className="font-medium">Daily P&L:</span>
                  <span className={`text-lg font-bold ${
                    getDailyPnL(selectedDate) >= 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    ${getDailyPnL(selectedDate).toFixed(2)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No trades recorded for this date.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Add Trade Modal */}
        {addTradeDate && (
          <AddTradeModal
            isOpen={isAddTradeModalOpen}
            onClose={() => {
              setIsAddTradeModalOpen(false);
              setAddTradeDate(null);
            }}
            selectedDate={addTradeDate}
          />
        )}

        {/* Edit Trade Modal */}
        {editTrade && (
          <EditTradeModal
            isOpen={isEditTradeModalOpen}
            onClose={() => {
              setIsEditTradeModalOpen(false);
              setEditTrade(null);
            }}
            trade={editTrade}
          />
        )}
      </CardContent>
    </Card>
  );
}