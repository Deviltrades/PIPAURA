import { useQuery } from "@tanstack/react-query";
import TradingAnalytics from "@/components/TradingAnalytics";
import { AccountSelector } from "@/components/AccountSelector";
import { SessionInsights } from "@/components/SessionInsights";
import { useSelectedAccount } from "@/hooks/use-selected-account";
import { getTrades } from "@/lib/supabase-service";

export default function Dashboard() {
  const [selectedAccount, setSelectedAccount] = useSelectedAccount();
  
  const { data: trades = [] } = useQuery({
    queryKey: ["trades", selectedAccount],
    queryFn: () => getTrades(selectedAccount),
    retry: false,
  });
  
  return (
    <div className="p-3 sm:p-4 lg:p-8 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-300 mb-3">Your trading overview and performance metrics</p>
        <AccountSelector value={selectedAccount} onValueChange={setSelectedAccount} />
      </div>
      
      {/* Session Insights Section */}
      <div className="mb-4 sm:mb-6">
        <SessionInsights trades={trades} />
      </div>
      
      <TradingAnalytics selectedAccount={selectedAccount} />
    </div>
  );
}