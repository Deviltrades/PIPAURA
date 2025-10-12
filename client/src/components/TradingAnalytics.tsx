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

interface TradingAnalyticsProps {
  selectedAccount: string;
}

export default function TradingAnalytics({ selectedAccount }: TradingAnalyticsProps) {
  const { data: analytics } = useQuery<AnalyticsData>({
    queryKey: ["analytics", selectedAccount],
    queryFn: () => getAnalytics(selectedAccount),
    retry: false,
  });

  const { data: trades } = useQuery<Trade[]>({
    queryKey: ["trades", selectedAccount],
    queryFn: () => getTrades(selectedAccount),
    retry: false,
  });

  return <DashboardGrid analytics={analytics} trades={trades || []} />;
}