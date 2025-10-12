import { TradingCalendar } from "@/components/TradingCalendar";
import { AccountSelector } from "@/components/AccountSelector";
import { useState } from "react";

export default function Calendar() {
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  
  return (
    <div className="p-4 lg:p-8 min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Trading Calendar</h1>
        <p className="text-gray-300 mb-3">Daily P&L overview and trading activity</p>
        <AccountSelector value={selectedAccount} onValueChange={setSelectedAccount} />
      </div>

      <TradingCalendar className="w-full" selectedAccount={selectedAccount} />
    </div>
  );
}