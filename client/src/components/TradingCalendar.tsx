import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Plus } from "lucide-react";
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
import type { Trade } from "@shared/schema";

interface TradingCalendarProps {
  className?: string;
  onAddTrade?: (date: Date) => void;
}

export function TradingCalendar({ className, onAddTrade }: TradingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMonth, setViewMonth] = useState<Date>(new Date());

  // Fetch all trades
  const { data: trades = [], isLoading } = useQuery<Trade[]>({
    queryKey: ["/api/trades"],
  });

  // Group trades by date
  const tradesByDate = trades.reduce((acc, trade) => {
    if (trade.entryDate) {
      const entryDate = typeof trade.entryDate === 'string' ? parseISO(trade.entryDate) : trade.entryDate;
      const dateKey = format(entryDate, "yyyy-MM-dd");
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(trade);
    }
    return acc;
  }, {} as Record<string, Trade[]>);

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
      <CardContent className="p-6">
        {/* Header with Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            {format(viewMonth, "MMMM yyyy")}
          </h2>
          <div className="flex items-center gap-2">
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

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="h-10 flex items-center justify-center">
              <span className="text-sm font-medium text-muted-foreground">{day}</span>
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayTrades = tradesByDate[dateKey] || [];
            const dailyPnL = getDailyPnL(day);
            const isCurrentMonth = isSameMonth(day, viewMonth);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentDay = isToday(day);
            
            return (
              <div
                key={day.toISOString()}
                className={`
                  h-12 rounded-lg border transition-all duration-200 hover:border-primary/50
                  ${isSelected ? 'border-primary bg-primary/10' : 'border-transparent'}
                  ${isCurrentDay ? 'bg-accent' : ''}
                  ${!isCurrentMonth ? 'opacity-40' : ''}
                  flex flex-col items-center justify-center relative group cursor-pointer
                `}
                onClick={() => setSelectedDate(day)}
              >
                <span className={`text-sm ${
                  isSelected ? 'font-semibold text-primary' : 
                  isCurrentDay ? 'font-semibold' : 
                  isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {format(day, 'd')}
                </span>
                
                {/* Add Trade Button */}
                {onAddTrade && isCurrentMonth && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddTrade(day);
                    }}
                    className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-4 h-4 bg-primary hover:bg-primary/80 rounded-full flex items-center justify-center"
                    title="Add trade for this date"
                  >
                    <Plus className="h-2.5 w-2.5 text-primary-foreground" />
                  </button>
                )}
                
                {/* Trade Indicators */}
                {dayTrades.length > 0 && (
                  <div className="absolute bottom-1 flex gap-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      dailyPnL > 0 ? "bg-green-500" : 
                      dailyPnL < 0 ? "bg-red-500" : "bg-yellow-500"
                    }`} />
                    {dayTrades.length > 1 && (
                      <span className="text-xs bg-blue-500 text-white rounded-full w-3 h-3 flex items-center justify-center leading-none">
                        {dayTrades.length}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Date Details */}
        {selectedDate && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-semibold text-lg mb-4">
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
      </CardContent>
    </Card>
  );
}