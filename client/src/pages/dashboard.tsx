import TradingAnalytics from "@/components/TradingAnalytics";
import { AccountSelector } from "@/components/AccountSelector";
import { useSelectedAccount } from "@/hooks/use-selected-account";

export default function Dashboard() {
  const [selectedAccount, setSelectedAccount] = useSelectedAccount();
  
  return (
    <div className="p-4 lg:p-8 min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-300 mb-3">Your trading overview and performance metrics</p>
        <AccountSelector value={selectedAccount} onValueChange={setSelectedAccount} />
      </div>
      <TradingAnalytics selectedAccount={selectedAccount} />
    </div>
  );
}