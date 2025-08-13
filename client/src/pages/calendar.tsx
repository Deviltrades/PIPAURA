import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const { data: trades = [], isLoading } = useQuery({
    queryKey: ["/api/trades"],
    retry: false,
  });

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getDailyPnL = (date: Date) => {
    const dayTrades = trades.filter((trade: any) => {
      const tradeDate = new Date(trade.createdAt);
      return tradeDate.toDateString() === date.toDateString() && trade.status === 'CLOSED';
    });
    
    return dayTrades.reduce((total: number, trade: any) => total + (trade.pnl || 0), 0);
  };

  const getTradingActivity = (date: Date) => {
    const dayTrades = trades.filter((trade: any) => {
      const tradeDate = new Date(trade.createdAt);
      return tradeDate.toDateString() === date.toDateString();
    });
    return dayTrades.length;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="mb-8">
          <div className="h-8 bg-muted animate-pulse rounded w-48 mb-2"></div>
          <div className="h-4 bg-muted animate-pulse rounded w-64"></div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="h-96 bg-muted animate-pulse rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Trading Calendar</h1>
        <p className="text-muted-foreground">Daily P&L overview and trading activity</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{monthName}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for days before the first day of the month */}
            {Array.from({ length: firstDay }, (_, i) => (
              <div key={`empty-${i}`} className="h-24 p-1"></div>
            ))}
            
            {/* Days of the month */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const currentDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              const dayPnL = getDailyPnL(currentDay);
              const activityCount = getTradingActivity(currentDay);
              const isToday = currentDay.toDateString() === new Date().toDateString();
              
              return (
                <div
                  key={day}
                  className={`h-24 p-1 border rounded-lg ${
                    isToday ? 'border-primary bg-primary/10' : 'border-border'
                  } ${activityCount > 0 ? 'bg-muted/50' : ''}`}
                >
                  <div className="flex flex-col h-full">
                    <div className={`text-sm font-medium ${isToday ? 'text-primary' : ''}`}>
                      {day}
                    </div>
                    
                    {activityCount > 0 && (
                      <div className="flex-1 flex flex-col justify-center items-center text-xs">
                        <Badge variant="outline" className="text-xs px-1 py-0 mb-1">
                          {activityCount}
                        </Badge>
                        {dayPnL !== 0 && (
                          <span className={`font-medium ${
                            dayPnL > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {dayPnL > 0 ? '+' : ''}{formatCurrency(dayPnL)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(
                  trades
                    .filter((trade: any) => {
                      const tradeDate = new Date(trade.createdAt);
                      return tradeDate.getMonth() === currentDate.getMonth() && 
                             tradeDate.getFullYear() === currentDate.getFullYear() &&
                             trade.status === 'CLOSED' && 
                             (trade.pnl || 0) > 0;
                    })
                    .reduce((total: number, trade: any) => total + (trade.pnl || 0), 0)
                )}
              </div>
              <p className="text-sm text-muted-foreground">Monthly Profits</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(
                  trades
                    .filter((trade: any) => {
                      const tradeDate = new Date(trade.createdAt);
                      return tradeDate.getMonth() === currentDate.getMonth() && 
                             tradeDate.getFullYear() === currentDate.getFullYear() &&
                             trade.status === 'CLOSED' && 
                             (trade.pnl || 0) < 0;
                    })
                    .reduce((total: number, trade: any) => total + (trade.pnl || 0), 0)
                )}
              </div>
              <p className="text-sm text-muted-foreground">Monthly Losses</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {trades.filter((trade: any) => {
                  const tradeDate = new Date(trade.createdAt);
                  return tradeDate.getMonth() === currentDate.getMonth() && 
                         tradeDate.getFullYear() === currentDate.getFullYear();
                }).length}
              </div>
              <p className="text-sm text-muted-foreground">Total Trades</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}