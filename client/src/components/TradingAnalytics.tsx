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
  strategy?: string | null;
  setup_type?: string | null;
  custom_tags?: string[] | null;
  entry_price?: string | number | null;
  stop_loss?: string | number | null;
  position_size?: number | null;
}

interface TradingAnalyticsProps {
  selectedAccount: string;
  trades?: Trade[];
}

export default function TradingAnalytics({ selectedAccount, trades: propTrades }: TradingAnalyticsProps) {
  const { data: analytics } = useQuery<AnalyticsData>({
    queryKey: ["analytics", selectedAccount],
    queryFn: () => getAnalytics(selectedAccount),
    retry: false,
  });

  const { data: fetchedTrades } = useQuery<Trade[]>({
    queryKey: ["trades", selectedAccount],
    queryFn: () => getTrades(selectedAccount),
    retry: false,
    enabled: !propTrades,
  });

  const trades = propTrades || fetchedTrades || [];

  return <DashboardGrid analytics={analytics} trades={trades} selectedAccount={selectedAccount} />;
}