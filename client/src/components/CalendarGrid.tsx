import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarGridProps {
  dailyPnL: Record<string, number>;
}

export function CalendarGrid({ dailyPnL }: CalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getDayPnL = (day: number) => {
    const date = new Date(year, month, day).toISOString().split('T')[0];
    return dailyPnL[date] || 0;
  };

  const formatPnL = (pnl: number) => {
    if (pnl === 0) return null;
    return pnl > 0 ? `+$${pnl.toFixed(0)}` : `-$${Math.abs(pnl).toFixed(0)}`;
  };

  const getPnLClass = (pnl: number) => {
    if (pnl > 0) return "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400";
    if (pnl < 0) return "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400";
    return "";
  };

  // Create calendar days array
  const calendarDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    const prevMonthDay = new Date(year, month, -startingDayOfWeek + i + 1).getDate();
    calendarDays.push(
      <div key={`prev-${i}`} className="h-20 border border-gray-200 dark:border-gray-700 p-1">
        <div className="text-xs text-gray-400">{prevMonthDay}</div>
      </div>
    );
  }

  // Add days of the current month
  for (let day = 1; day <= daysInMonth; day++) {
    const pnl = getDayPnL(day);
    const pnlText = formatPnL(pnl);
    const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
    
    calendarDays.push(
      <div
        key={day}
        className={cn(
          "h-20 border border-gray-200 dark:border-gray-700 p-1",
          getPnLClass(pnl),
          isToday && "ring-2 ring-primary"
        )}
      >
        <div className={cn(
          "text-xs font-medium",
          isToday ? "text-primary font-bold" : "text-gray-900 dark:text-white"
        )}>
          {day}
        </div>
        {pnlText && (
          <div className="text-xs font-medium mt-1">
            {pnlText}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{monthNames[month]} {year}</CardTitle>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {dayNames.map((day) => (
            <div key={day} className="text-center py-2 text-sm font-medium text-gray-500 dark:text-gray-400">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {calendarDays}
        </div>
      </CardContent>
    </Card>
  );
}
