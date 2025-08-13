import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
import { format, startOfMonth, endOfMonth, isSameDay, parseISO } from "date-fns";
import type { Trade } from "@shared/schema";

interface TradingCalendarProps {
  className?: string;
}

export function TradingCalendar({ className }: TradingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
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

  // Custom day renderer to show trade indicators
  const renderDay = (day: Date) => {
    const dateKey = format(day, "yyyy-MM-dd");
    const dayTrades = tradesByDate[dateKey] || [];
    const dailyPnL = getDailyPnL(day);
    
    if (dayTrades.length === 0) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          {format(day, "d")}
        </div>
      );
    }

    return (
      <div className="w-full h-full flex flex-col items-center justify-center relative">
        <span className="text-sm">{format(day, "d")}</span>
        <div className="flex gap-1 mt-1">
          {dayTrades.length > 0 && (
            <div className={`w-2 h-2 rounded-full ${
              dailyPnL > 0 ? "bg-green-500" : 
              dailyPnL < 0 ? "bg-red-500" : "bg-gray-400"
            }`} />
          )}
          {dayTrades.length > 1 && (
            <span className="text-xs bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
              {dayTrades.length}
            </span>
          )}
        </div>
      </div>
    );
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newMonth = new Date(viewMonth);
    if (direction === "prev") {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setViewMonth(newMonth);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Trading Calendar</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth("prev")}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {format(viewMonth, "MMMM yyyy")}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth("next")}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground mb-2">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>
        
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && setSelectedDate(date)}
          month={viewMonth}
          onMonthChange={setViewMonth}
          className="w-full"
          components={{
            Day: ({ date }) => (
              <button
                className={`
                  w-8 h-8 text-sm rounded-md hover:bg-accent hover:text-accent-foreground
                  ${isSameDay(date, selectedDate) ? "bg-primary text-primary-foreground" : ""}
                  ${isSameDay(date, new Date()) ? "bg-accent text-accent-foreground font-semibold" : ""}
                `}
                onClick={() => setSelectedDate(date)}
              >
                {renderDay(date)}
              </button>
            ),
          }}
        />

        {selectedDate && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">
              {format(selectedDate, "MMMM d, yyyy")}
            </h4>
            
            {selectedDateTrades.length > 0 ? (
              <div className="space-y-2">
                {selectedDateTrades.map((trade) => (
                  <div
                    key={trade.id}
                    className="flex items-center justify-between p-2 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {trade.instrument}
                      </Badge>
                      <span className="text-sm font-medium">
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
                      <span className={`text-sm font-medium flex items-center gap-1 ${
                        (typeof trade.pnl === 'string' ? parseFloat(trade.pnl) : (trade.pnl || 0)) >= 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        {(typeof trade.pnl === 'string' ? parseFloat(trade.pnl) : (trade.pnl || 0)) >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        ${(typeof trade.pnl === 'string' ? parseFloat(trade.pnl) : (trade.pnl || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
                
                <div className="mt-3 pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Daily P&L:</span>
                    <span className={`font-semibold ${
                      getDailyPnL(selectedDate) >= 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      ${getDailyPnL(selectedDate).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No trades recorded for this date.
              </p>
            )}
          </div>
        )}
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>Profit</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span>Loss</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
            <span>Breakeven</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}