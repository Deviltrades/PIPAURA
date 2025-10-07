import { TradingCalendar } from "@/components/TradingCalendar";

export default function Calendar() {
  return (
    <div className="p-3 sm:p-4 lg:p-8">
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Trading Calendar</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Daily P&L overview and trading activity</p>
      </div>

      <TradingCalendar className="w-full" />
    </div>
  );
}