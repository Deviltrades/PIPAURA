import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const tradesByDate = trades.reduce((acc, trade) => {
    if (trade.entryDate) {
      // Handle different date formats
      let entryDate: Date;
      if (typeof trade.entryDate === 'string') {
        // Try parsing ISO string first, then fallback to Date constructor
        entryDate = trade.entryDate.includes('T') ? parseISO(trade.entryDate) : new Date(trade.entryDate);
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

            
            // Get calendar settings with proper typing
            const calendarSettings = (user?.calendarSettings as any) || {
              backgroundColor: "#1a1a1a",
              borderColor: "#374151",
              dayBackgroundColor: "#2d2d2d",
              dayBorderColor: "#4b5563"
            };

            return (
              <div
                key={day.toISOString()}
                className={`
                  h-20 border-2 transition-all duration-200 hover:border-primary/50
                  ${isSelected ? 'border-primary bg-primary/10' : ''}
                  ${isCurrentDay ? 'ring-2 ring-blue-400' : ''}
                  ${!isCurrentMonth ? 'opacity-40' : ''}
                  relative group cursor-pointer flex flex-col
                `}
                style={{
                  backgroundColor: isSelected ? undefined : calendarSettings.dayBackgroundColor,
                  borderColor: isSelected ? undefined : calendarSettings.dayBorderColor
                }}
                onClick={() => setSelectedDate(day)}
              >
                {/* Date - Top Left */}
                <div className="absolute top-1 left-1">
                  <span className={`text-sm font-medium ${
                    isSelected ? 'text-primary' : 
                    isCurrentDay ? 'text-white font-semibold' : 
                    isCurrentMonth ? 'text-gray-200' : 'text-gray-500'
                  }`}>
                    {format(day, 'd')}
                  </span>
                </div>
                
                {/* Add Trade Button - Top Right */}
                {isCurrentMonth && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddTradeDate(day);
                      setIsAddTradeModalOpen(true);
                    }}
                    className="absolute top-1 right-1 opacity-60 group-hover:opacity-100 transition-opacity duration-200 w-5 h-5 bg-primary hover:bg-primary/80 rounded-sm flex items-center justify-center"
                    title="Add trade for this date"
                  >
                    <PlusIcon className="h-3 w-3 text-primary-foreground" />
                  </button>
                )}
                
                {/* P&L Display - Center/Bottom */}
                {dayTrades.length > 0 && dailyPnL !== 0 && (
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                    <div className={`text-sm font-bold px-2 py-1 rounded ${
                      dailyPnL > 0 ? "text-green-400" : "text-red-400"
                    }`}>
                      {dailyPnL > 0 ? '+' : ''}${dailyPnL.toFixed(0)}
                    </div>
                  </div>
                )}
                
                {/* Trade Count Indicator - Bottom Left */}
                {dayTrades.length > 0 && (
                  <div className="absolute bottom-1 left-1">
                    <div className={`w-2 h-2 rounded-full ${
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