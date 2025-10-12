import TradingAnalytics from "@/components/TradingAnalytics";
import { AccountSelector } from "@/components/AccountSelector";
import { useState } from "react";

export default function Dashboard() {
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mb-3">Your trading overview and performance metrics</p>
        <AccountSelector value={selectedAccount} onValueChange={setSelectedAccount} />
      </div>
      <TradingAnalytics selectedAccount={selectedAccount} />
    </div>
  );
}