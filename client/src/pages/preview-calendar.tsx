import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { demoTrades, demoAccounts } from "@/lib/demo-data";
import { formatCurrency } from "@/lib/utils";

export default function PreviewCalendar() {
  const [currentDate] = useState(new Date("2025-01-20"));
  
  // Calculate daily P&L from demo trades
  const dailyPnL = demoTrades.reduce((acc, trade) => {
    const date = new Date(trade.entry_date).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = { pnl: 0, trades: 0 };
    }
    acc[date].pnl += trade.pnl;
    acc[date].trades += 1;
    return acc;
  }, {} as Record<string, { pnl: number; trades: number }>);

  // Generate calendar days for January 2025
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const days = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const getDayData = (day: number | null) => {
    if (!day) return null;
    const dateStr = `2025-01-${day.toString().padStart(2, '0')}`;
    return dailyPnL[dateStr];
  };

  return (
    <div className="p-4 lg:p-8 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Trading Calendar</h1>
            <p className="text-gray-300 mb-3">Daily P&L overview and trading activity</p>
          </div>
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-4 py-2">
            <p className="text-sm text-cyan-400">📊 Preview Mode - Demo Data</p>
          </div>
        </div>
      </div>

      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-xl">{monthName}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-slate-600 text-slate-400">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" className="border-slate-600 text-slate-400">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Header */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center py-2 text-sm font-semibold text-slate-400">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, index) => {
              const dayData = getDayData(day);
              const isTradeDay = dayData && dayData.trades > 0;
              const isProfitable = dayData && dayData.pnl > 0;
              
              return (
                <div
                  key={index}
                  className={`
                    aspect-square p-2 rounded-lg border transition-all
                    ${!day ? 'border-transparent' : ''}
                    ${day && !isTradeDay ? 'border-slate-700 bg-slate-800/30' : ''}
                    ${isTradeDay && isProfitable ? 'border-green-500/50 bg-green-500/10 hover:bg-green-500/20' : ''}
                    ${isTradeDay && !isProfitable ? 'border-red-500/50 bg-red-500/10 hover:bg-red-500/20' : ''}
                  `}
                  data-testid={day ? `calendar-day-${day}` : undefined}
                >
                  {day && (
                    <div className="h-full flex flex-col">
                      <div className="text-sm font-medium text-slate-300 mb-1">{day}</div>
                      {isTradeDay && dayData && (
                        <div className="flex-1 flex flex-col justify-center">
                          <div className={`text-xs font-semibold ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
                            {formatCurrency(dayData.pnl)}
                          </div>
                          <div className="text-xs text-slate-500">
                            {dayData.trades} trade{dayData.trades > 1 ? 's' : ''}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary Stats */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">{demoTrades.length}</div>
                <div className="text-sm text-slate-400">Total Trades</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {demoTrades.filter(t => t.pnl > 0).length}
                </div>
                <div className="text-sm text-slate-400">Winning Days</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {formatCurrency(demoTrades.reduce((sum, t) => sum + t.pnl, 0))}
                </div>
                <div className="text-sm text-slate-400">Month P&L</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="mt-6 flex justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border border-green-500/50 bg-green-500/10"></div>
          <span className="text-sm text-slate-400">Profitable Day</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border border-red-500/50 bg-red-500/10"></div>
          <span className="text-sm text-slate-400">Losing Day</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border border-slate-700 bg-slate-800/30"></div>
          <span className="text-sm text-slate-400">No Trades</span>
        </div>
      </div>
    </div>
  );
}
