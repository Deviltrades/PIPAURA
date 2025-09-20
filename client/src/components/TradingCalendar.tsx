import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Plus, Edit3, Check, X } from "lucide-react";
import logoImage from "@assets/btrustedprops_1758388648347.jpg";
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

            // Calculate daily percentage return
            const calculateDailyReturn = () => {
              if (dayTrades.length === 0) return null;
              // Simple percentage calculation - could be enhanced with actual account balance
              const totalPnL = dailyPnL;
              const percentage = Math.abs(totalPnL / 1000 * 100); // Assuming base of $1000 for percentage
              return percentage;
            };

            const dailyReturn = calculateDailyReturn();

            // Get styling based on P&L
            const getDayStyles = () => {
              if (dayTrades.length === 0) {
                return {
                  backgroundColor: '#1a1a1a',
                  borderColor: '#374151',
                  textColor: 'text-white',
                  boxShadow: 'none'
                };
              }
              if (dailyPnL > 0) {
                return {
                  backgroundColor: '#00cc66', // Toned down bright green (20% less bright)
                  borderColor: '#00cc66',
                  textColor: 'text-black',
                  boxShadow: '0 0 12px #00cc66' // Slightly reduced glow
                };
              }
              return {
                backgroundColor: '#e55555', // Toned down bright red (20% less bright)
                borderColor: '#e55555',
                textColor: 'text-black',
                boxShadow: 'none'
              };
            };

            const dayStyles = getDayStyles();

            return (
              <div
                key={day.toISOString()}
                className={`
                  h-20 sm:h-24 border-2 rounded-xl transition-all duration-200
                  ${isSelected ? 'ring-2 ring-blue-400' : ''}
                  ${isCurrentDay ? 'ring-1 ring-blue-300' : ''}
                  ${!isCurrentMonth ? 'opacity-40' : ''}
                  ${dayTrades.length > 0 ? 'brightness-125 saturate-150' : ''}
                  relative group cursor-pointer overflow-hidden
                `}
                style={{
                  backgroundColor: dayStyles.backgroundColor,
                  borderColor: dayStyles.borderColor,
                  boxShadow: dayStyles.boxShadow
                }}
                onClick={() => setSelectedDate(day)}
              >
                {/* Dark Blue Triangle - Top Right */}
                <div 
                  className="absolute top-0 right-0"
                  style={{
                    width: 0,
                    height: 0,
                    borderStyle: 'solid',
                    borderWidth: '0 34px 34px 0',
                    borderColor: 'transparent #1e3a8a transparent transparent'
                  }}
                />
                
                {/* Success/Failure Icon - Inside Triangle */}
                {dayTrades.length > 0 && (
                  <div className="absolute top-1 right-1">
                    {dailyPnL > 0 ? (
                      <Check className="h-4 w-4 text-white" />
                    ) : (
                      <X className="h-4 w-4 text-white" />
                    )}
                  </div>
                )}
                
                {/* Date - Top Left */}
                <div className="absolute top-1 left-1.5">
                  <span className={`text-sm font-semibold text-white`}>
                    {format(day, 'd')}
                  </span>
                </div>
                
                {/* Add Trade Button - Only show on hover for empty days */}
                {dayTrades.length === 0 && isCurrentMonth && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddTradeDate(day);
                      setIsAddTradeModalOpen(true);
                    }}
                    className="absolute top-1 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-4 h-4 bg-gray-600 hover:bg-gray-700 rounded-full flex items-center justify-center z-10"
                    title="Add trade for this date"
                  >
                    <PlusIcon className="h-2.5 w-2.5 text-white" />
                  </button>
                )}
                
                {/* Trading Day Content */}
                {dayTrades.length > 0 ? (
                  <div className="absolute inset-x-2 top-8 bottom-2 flex flex-col justify-center">
                    {/* Percentage Return */}
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">
                        {dailyPnL > 0 ? '+' : ''}{dailyReturn?.toFixed(2)}%
                      </div>
                      <div className="text-xs text-white/80 font-medium">
                        USD
                      </div>
                    </div>
                    {/* Trade Count */}
                    <div className="text-xs text-white/90 text-center mt-1">
                      Trades: {dayTrades.length}
                    </div>
                  </div>
                ) : (
                  /* Empty Day Content - Background Logo */
                  isCurrentMonth && (
                    <>
                      {/* Background Logo */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <img 
                          src={logoImage} 
                          alt="TJ Logo" 
                          className="w-full h-full object-cover opacity-10"
                        />
                      </div>
                      {/* Zero Trades Text */}
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                        <div className="text-[10px] text-white/60 font-bold text-center">
                          Zero Trades
                        </div>
                      </div>
                    </>
                  )
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