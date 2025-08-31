import { useQuery } from "@tanstack/react-query";
import DashboardGrid from "./DashboardGrid";

interface AnalyticsData {
  totalPnL: number;
  totalTrades: number;
  closedTrades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitableTrades: number;
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
    queryKey: ["/api/analytics/stats"],
    retry: false,
  });

  const { data: trades } = useQuery<Trade[]>({
    queryKey: ["/api/trades"],
    retry: false,
  });

  return <DashboardGrid analytics={analytics} trades={trades || []} />;
}