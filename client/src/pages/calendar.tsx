import { TradingCalendar } from "@/components/TradingCalendar";

export default function Calendar() {
  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Trading Calendar</h1>
        <p className="text-muted-foreground">Daily P&L overview and trading activity</p>
      </div>

      <TradingCalendar className="w-full" />
    </div>
  );
}