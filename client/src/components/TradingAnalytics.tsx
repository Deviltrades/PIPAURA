import { useQuery } from "@tanstack/react-query";
import { getTrades, getAnalytics } from "@/lib/supabase-service";
import DashboardGrid from "./DashboardGrid";

interface AnalyticsData {
  totalEntries: number;
  totalTrades: number;
  totalPnL: number;
  winRate: number;
  averageTrade: number;
  profitableTrades: number;
  losingTrades: number;
}

interface Trade {
  id: string;
  instrument: string;
  tradeType: "BUY" | "SELL";
  pnl: number;
  createdAt: string;
  status: "OPEN" | "CLOSED";
}

export default function TradingAnalytics() {
  const { data: analytics } = useQuery<AnalyticsData>({
    queryKey: ["analytics"],
    queryFn: getAnalytics,
    retry: false,
  });

  const { data: trades } = useQuery<Trade[]>({
    queryKey: ["trades"],
    queryFn: getTrades,
    retry: false,
  });

  return <DashboardGrid analytics={analytics} trades={trades || []} />;
}