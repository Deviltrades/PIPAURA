import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface CalendarWidgetProps {
  textColor?: string;
}

export default function CalendarWidget({ textColor = "#ffffff" }: CalendarWidgetProps) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const currentYear = currentDate.getFullYear();

  // Fetch journal entries for the year
  const { data: journalEntries = [] } = useQuery({
    queryKey: ["journal-entries", currentYear],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      const startDate = `${currentYear}-01-01`;
      const endDate = `${currentYear}-12-31`;

      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", userData.user.id)
        .gte("trade_date", startDate)
        .lte("trade_date", endDate);

      if (error) throw error;
      return data || [];
    },
  });

  // Calculate daily P&L for the selected month
  const dailyPnL = useMemo(() => {
    const pnlByDay: { [key: string]: number } = {};
    
    journalEntries.forEach((entry: any) => {
      const entryDate = new Date(entry.trade_date);
      if (entryDate.getMonth() === selectedMonth && entryDate.getFullYear() === currentYear) {
        const day = entryDate.getDate();
        const profit = parseFloat(entry.profit_loss || 0);
        pnlByDay[day] = (pnlByDay[day] || 0) + profit;
      }
    });
    
    return pnlByDay;
  }, [journalEntries, selectedMonth, currentYear]);

  // Get top 4 profitable days
  const topProfitableDays = useMemo(() => {
    return Object.entries(dailyPnL)
      .map(([day, profit]) => ({ day: parseInt(day), profit }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 4);
  }, [dailyPnL]);

  // Get calendar data for selected month
  const { daysInMonth, firstDayOfMonth } = useMemo(() => {
    const date = new Date(currentYear, selectedMonth, 1);
    const daysInMonth = new Date(currentYear, selectedMonth + 1, 0).getDate();
    const firstDayOfMonth = date.getDay();
    return { daysInMonth, firstDayOfMonth };
  }, [selectedMonth, currentYear]);

  const monthNames = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
  ];

  const dayNames = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

  // Generate calendar grid
  const calendarDays = [];
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  
  for (let i = 0; i < adjustedFirstDay; i++) {
    calendarDays.push(null);
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const getDayColor = (day: number | null) => {
    if (!day) return "transparent";
    const profit = dailyPnL[day];
    if (profit === undefined) return textColor;
    return profit > 0 ? "#10b981" : profit < 0 ? "#ef4444" : textColor;
  };

  return (
    <div className="h-full flex flex-col" style={{ color: textColor }}>
      {/* Month Selector Dots */}
      <div className="flex items-center justify-center gap-2 mb-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <button
            key={index}
            onClick={() => setSelectedMonth(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              selectedMonth === index 
                ? "w-20 h-6 rounded-full flex items-center justify-center text-xs font-medium"
                : ""
            }`}
            style={{
              backgroundColor: selectedMonth === index ? "#8b5cf6" : textColor,
              opacity: selectedMonth === index ? 1 : 0.5,
              color: selectedMonth === index ? "#ffffff" : "transparent"
            }}
            data-testid={`button-month-${index}`}
          >
            {selectedMonth === index && monthNames[index].slice(0, 3)}
          </button>
        ))}
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-xs opacity-60" style={{ color: textColor }}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4 flex-1">
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className="flex items-center justify-center text-sm font-medium aspect-square"
            style={{ color: getDayColor(day) }}
            data-testid={day ? `calendar-day-${day}` : undefined}
          >
            {day || ""}
          </div>
        ))}
      </div>

      {/* Top 4 Profitable Days */}
      <div className="flex items-center justify-around pt-3 border-t border-gray-700/50">
        {topProfitableDays.map((item, index) => (
          <div key={index} className="flex flex-col items-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mb-1"
              style={{
                background: `linear-gradient(135deg, #8b5cf6, #ec4899)`,
                color: "#ffffff"
              }}
              data-testid={`top-day-${item.day}`}
            >
              {item.day}
            </div>
            <div className="text-xs opacity-60 text-center" style={{ color: textColor }}>
              ${item.profit.toFixed(0)}
            </div>
          </div>
        ))}
        {topProfitableDays.length < 4 && Array.from({ length: 4 - topProfitableDays.length }).map((_, index) => (
          <div key={`empty-${index}`} className="flex flex-col items-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mb-1 opacity-30"
              style={{
                background: `linear-gradient(135deg, #8b5cf6, #ec4899)`,
                color: "#ffffff"
              }}
            >
              -
            </div>
            <div className="text-xs opacity-30" style={{ color: textColor }}>
              N/A
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
