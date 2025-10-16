import TradingAnalytics from "@/components/TradingAnalytics";
import { SessionInsights } from "@/components/SessionInsights";
import { demoTrades, demoAccounts } from "@/lib/demo-data";

export default function PreviewDashboard() {
  const selectedAccount = demoAccounts[0].id;
  
  return (
    <div className="p-4 lg:p-8 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-300 mb-3">Your trading overview and performance metrics</p>
          </div>
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-4 py-2">
            <p className="text-sm text-cyan-400">📊 Preview Mode - Demo Data</p>
          </div>
        </div>
      </div>
      
      {/* Session Insights Section */}
      <div className="mb-6">
        <SessionInsights trades={demoTrades} />
      </div>
      
      <TradingAnalytics selectedAccount={selectedAccount} />
    </div>
  );
}
