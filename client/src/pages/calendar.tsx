import { TradingCalendar } from "@/components/TradingCalendar";
import { AccountSelector } from "@/components/AccountSelector";
import { useState } from "react";

export default function Calendar() {
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  
  return (
    <div className="p-3 sm:p-4 lg:p-8">
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Trading Calendar</h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-3">Daily P&L overview and trading activity</p>
        <AccountSelector value={selectedAccount} onValueChange={setSelectedAccount} />
      </div>

      <TradingCalendar className="w-full" selectedAccount={selectedAccount} />
    </div>
  );
}