import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTrades } from "@/lib/supabase-service";

interface CalendarWidgetProps {
  textColor?: string;
}

export default function CalendarWidget({ textColor = "#ffffff" }: CalendarWidgetProps) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const currentYear = currentDate.getFullYear();

  const monthNames = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
  ];

  // Fetch trades
  const { data: trades = [] } = useQuery({
    queryKey: ["trades"],
    queryFn: getTrades,
  });

  // Calculate daily P&L for the selected month
  const dailyPnL = useMemo(() => {
    const pnlByDay: { [key: string]: number } = {};
    
    trades.forEach((trade: any) => {
      // Use entry_date if available, fall back to created_at
      const tradeDateStr = trade.entry_date || trade.created_at;
      if (!tradeDateStr) return;
      
      const tradeDate = new Date(tradeDateStr);
      if (tradeDate.getMonth() === selectedMonth && tradeDate.getFullYear() === currentYear) {
        const day = tradeDate.getDate();
        const profit = parseFloat(trade.pnl || 0);
        pnlByDay[day] = (pnlByDay[day] || 0) + profit;
      }
    });
    
    return pnlByDay;
  }, [trades, selectedMonth, currentYear]);

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

  const getDayStyle = (day: number | null) => {
    if (!day) return { backgroundColor: "transparent", color: textColor };
    const profit = dailyPnL[day];
    
    // Only color days that have trading data
    if (profit === undefined || profit === 0) {
      return { backgroundColor: "transparent", color: textColor };
    }
    
    // Profitable day - green background
    if (profit > 0) {
      return { backgroundColor: "#10b981", color: "#ffffff" };
    }
    
    // Loss day - red background  
    if (profit < 0) {
      return { backgroundColor: "#ef4444", color: "#ffffff" };
    }
    
    return { backgroundColor: "transparent", color: textColor };
  };

  return (
    <div className="h-full flex flex-col" style={{ color: textColor }}>
      {/* Month Selector Dots */}
      <div className="flex items-center justify-center gap-1.5 mb-4">
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
            {selectedMonth === index && monthNames[index]}
          </button>
        ))}
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 gap-2 mb-3">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-xs font-medium opacity-70" style={{ color: textColor }}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className="flex items-center justify-center text-sm font-medium w-9 h-9 rounded transition-all"
            style={getDayStyle(day)}
            data-testid={day ? `calendar-day-${day}` : undefined}
          >
            {day || ""}
          </div>
        ))}
      </div>

      {/* Top 4 Profitable Days */}
      <div className="flex items-center justify-around pt-4 border-t border-gray-700/50 mt-auto">
        {topProfitableDays.map((item, index) => (
          <div key={index} className="flex flex-col items-center gap-1">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold"
              style={{
                background: `linear-gradient(135deg, #8b5cf6, #ec4899)`,
                color: "#ffffff"
              }}
              data-testid={`top-day-${item.day}`}
            >
              {item.day}
            </div>
            <div className="text-[8px] uppercase opacity-50 text-center leading-tight" style={{ color: textColor }}>
              ${item.profit.toFixed(0)}<br/>PROFIT
            </div>
          </div>
        ))}
        {topProfitableDays.length < 4 && Array.from({ length: 4 - topProfitableDays.length }).map((_, index) => (
          <div key={`empty-${index}`} className="flex flex-col items-center gap-1">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold opacity-30"
              style={{
                background: `linear-gradient(135deg, #8b5cf6, #ec4899)`,
                color: "#ffffff"
              }}
            >
              -
            </div>
            <div className="text-[8px] uppercase opacity-30 text-center leading-tight" style={{ color: textColor }}>
              N/A
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
