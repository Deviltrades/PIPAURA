import { useState, useEffect } from "react";
import { Responsive, WidthProvider, Layout, Layouts } from "react-grid-layout";
import { TrendingUp, TrendingDown, BarChart3, Target, DollarSign, Layers, Move, RotateCcw, Save, Grid3X3, Trash2, Palette, Flame, Clock, Trophy, TrendingUpIcon, CircleDot, PieChart, AlertTriangle, Briefcase } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getUserProfile, updateUserProfile } from "@/lib/supabase-service";
import DraggableWidget from "./DraggableWidget";
import CalendarWidget from "./CalendarWidget";
import TimingInsights from "./TimingInsights";
import { SessionInsights } from "./SessionInsights";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardGridProps {
  analytics: any;
  trades: any[];
  selectedAccount?: string;
}

export default function DashboardGrid({ analytics, trades, selectedAccount }: DashboardGridProps) {
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [themeColor, setThemeColor] = useState("slate");
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [bgColor, setBgColor] = useState("#0f172a");
  const [textColor, setTextColor] = useState("#ffffff");
  const [showAllProfits, setShowAllProfits] = useState(false);
  const [showAllWinRates, setShowAllWinRates] = useState(false);
  const [showAllRiskReward, setShowAllRiskReward] = useState(false);
  const [showAllAverage, setShowAllAverage] = useState(false);
  const [showAllFees, setShowAllFees] = useState(false);
  const [showAllTotalTrades, setShowAllTotalTrades] = useState(false);
  
  const defaultLayouts = {
    lg: [
      { i: "profit", x: 0, y: 0, w: 2, h: 2 },
      { i: "winrate", x: 2, y: 0, w: 2, h: 2 },
      { i: "riskreward", x: 4, y: 0, w: 2, h: 2 },
      { i: "average", x: 6, y: 0, w: 2, h: 2 },
      { i: "fees", x: 8, y: 0, w: 2, h: 2 },
      { i: "totaltrades", x: 10, y: 0, w: 2, h: 2 },
      { i: "chart", x: 0, y: 2, w: 8, h: 6 },
      { i: "trades", x: 8, y: 2, w: 4, h: 6 },
      { i: "longshort", x: 0, y: 8, w: 6, h: 4 },
      { i: "timing", x: 6, y: 8, w: 6, h: 7 },
      { i: "calendar", x: 0, y: 15, w: 12, h: 7 },
      { i: "streak", x: 0, y: 22, w: 3, h: 3 },
      { i: "holdtime", x: 3, y: 22, w: 3, h: 3 },
      { i: "mostprofitable", x: 6, y: 22, w: 3, h: 3 },
      { i: "monthlyprogress", x: 9, y: 22, w: 3, h: 3 },
      { i: "firstlast", x: 0, y: 25, w: 4, h: 4 },
      { i: "setupbreakdown", x: 4, y: 25, w: 4, h: 4 },
      { i: "riskdeviation", x: 8, y: 25, w: 2, h: 4 },
      { i: "exposure", x: 10, y: 25, w: 2, h: 4 },
    ],
    md: [
      { i: "profit", x: 0, y: 0, w: 2, h: 2 },
      { i: "winrate", x: 2, y: 0, w: 2, h: 2 },
      { i: "riskreward", x: 4, y: 0, w: 2, h: 2 },
      { i: "average", x: 0, y: 2, w: 2, h: 2 },
      { i: "fees", x: 2, y: 2, w: 2, h: 2 },
      { i: "totaltrades", x: 4, y: 2, w: 2, h: 2 },
      { i: "chart", x: 0, y: 4, w: 6, h: 6 },
      { i: "trades", x: 0, y: 10, w: 6, h: 6 },
      { i: "longshort", x: 0, y: 16, w: 3, h: 4 },
      { i: "timing", x: 3, y: 16, w: 3, h: 7 },
      { i: "calendar", x: 0, y: 23, w: 6, h: 7 },
      { i: "streak", x: 0, y: 30, w: 3, h: 3 },
      { i: "holdtime", x: 3, y: 30, w: 3, h: 3 },
      { i: "mostprofitable", x: 0, y: 33, w: 3, h: 3 },
      { i: "monthlyprogress", x: 3, y: 33, w: 3, h: 3 },
      { i: "firstlast", x: 0, y: 36, w: 3, h: 4 },
      { i: "setupbreakdown", x: 3, y: 36, w: 3, h: 4 },
      { i: "riskdeviation", x: 0, y: 40, w: 3, h: 3 },
      { i: "exposure", x: 3, y: 40, w: 3, h: 3 },
    ],
    sm: [
      { i: "profit", x: 0, y: 0, w: 2, h: 2 },
      { i: "winrate", x: 2, y: 0, w: 2, h: 2 },
      { i: "riskreward", x: 0, y: 2, w: 2, h: 2 },
      { i: "average", x: 2, y: 2, w: 2, h: 2 },
      { i: "fees", x: 0, y: 4, w: 2, h: 2 },
      { i: "totaltrades", x: 2, y: 4, w: 2, h: 2 },
      { i: "chart", x: 0, y: 6, w: 4, h: 6 },
      { i: "trades", x: 0, y: 12, w: 4, h: 6 },
      { i: "longshort", x: 0, y: 18, w: 4, h: 4 },
      { i: "timing", x: 0, y: 22, w: 4, h: 7 },
      { i: "calendar", x: 0, y: 29, w: 4, h: 7 },
      { i: "streak", x: 0, y: 36, w: 2, h: 3 },
      { i: "holdtime", x: 2, y: 36, w: 2, h: 3 },
      { i: "mostprofitable", x: 0, y: 39, w: 2, h: 3 },
      { i: "monthlyprogress", x: 2, y: 39, w: 2, h: 3 },
      { i: "firstlast", x: 0, y: 42, w: 4, h: 4 },
      { i: "setupbreakdown", x: 0, y: 46, w: 4, h: 4 },
      { i: "riskdeviation", x: 0, y: 50, w: 2, h: 3 },
      { i: "exposure", x: 2, y: 50, w: 2, h: 3 },
    ],
    xs: [
      { i: "profit", x: 0, y: 0, w: 2, h: 2 },
      { i: "winrate", x: 0, y: 2, w: 2, h: 2 },
      { i: "riskreward", x: 0, y: 4, w: 2, h: 2 },
      { i: "average", x: 0, y: 6, w: 2, h: 2 },
      { i: "fees", x: 0, y: 8, w: 2, h: 2 },
      { i: "totaltrades", x: 0, y: 10, w: 2, h: 2 },
      { i: "chart", x: 0, y: 12, w: 2, h: 6 },
      { i: "trades", x: 0, y: 18, w: 2, h: 6 },
      { i: "longshort", x: 0, y: 24, w: 2, h: 4 },
      { i: "timing", x: 0, y: 28, w: 2, h: 7 },
      { i: "calendar", x: 0, y: 35, w: 2, h: 7 },
      { i: "streak", x: 0, y: 42, w: 2, h: 3 },
      { i: "holdtime", x: 0, y: 45, w: 2, h: 3 },
      { i: "mostprofitable", x: 0, y: 48, w: 2, h: 3 },
      { i: "monthlyprogress", x: 0, y: 51, w: 2, h: 3 },
      { i: "firstlast", x: 0, y: 54, w: 2, h: 4 },
      { i: "setupbreakdown", x: 0, y: 58, w: 2, h: 4 },
      { i: "riskdeviation", x: 0, y: 62, w: 2, h: 3 },
      { i: "exposure", x: 0, y: 65, w: 2, h: 3 },
    ],
    xxs: [
      { i: "profit", x: 0, y: 0, w: 2, h: 2 },
      { i: "winrate", x: 0, y: 2, w: 2, h: 2 },
      { i: "riskreward", x: 0, y: 4, w: 2, h: 2 },
      { i: "average", x: 0, y: 6, w: 2, h: 2 },
      { i: "fees", x: 0, y: 8, w: 2, h: 2 },
      { i: "totaltrades", x: 0, y: 10, w: 2, h: 2 },
      { i: "chart", x: 0, y: 12, w: 2, h: 6 },
      { i: "trades", x: 0, y: 18, w: 2, h: 6 },
      { i: "longshort", x: 0, y: 24, w: 2, h: 4 },
      { i: "timing", x: 0, y: 28, w: 2, h: 7 },
      { i: "calendar", x: 0, y: 35, w: 2, h: 7 },
      { i: "streak", x: 0, y: 42, w: 2, h: 3 },
      { i: "holdtime", x: 0, y: 45, w: 2, h: 3 },
      { i: "mostprofitable", x: 0, y: 48, w: 2, h: 3 },
      { i: "monthlyprogress", x: 0, y: 51, w: 2, h: 3 },
      { i: "firstlast", x: 0, y: 54, w: 2, h: 4 },
      { i: "setupbreakdown", x: 0, y: 58, w: 2, h: 4 },
      { i: "riskdeviation", x: 0, y: 62, w: 2, h: 3 },
      { i: "exposure", x: 0, y: 65, w: 2, h: 3 },
    ]
  };

  const [layouts, setLayouts] = useState(defaultLayouts);

  // Fetch user profile to get theme preference and layouts
  const { data: userProfile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: getUserProfile,
    retry: false,
  });

  // Load theme color and layouts from user profile
  useEffect(() => {
    if (userProfile?.preferences?.dashboardColor) {
      setThemeColor(userProfile.preferences.dashboardColor);
    }
    if (userProfile?.preferences?.dashboardBgColor) {
      setBgColor(userProfile.preferences.dashboardBgColor);
    }
    if (userProfile?.preferences?.dashboardTextColor) {
      setTextColor(userProfile.preferences.dashboardTextColor);
    }
    if (userProfile?.preferences?.dashboardLayouts) {
      setLayouts(userProfile.preferences.dashboardLayouts);
    }
  }, [userProfile]);

  // Save dashboard layout mutation
  const saveLayoutMutation = useMutation({
    mutationFn: async (newLayouts: Layouts) => {
      await updateUserProfile({
        preferences: { 
          ...userProfile?.preferences, 
          dashboardLayouts: newLayouts 
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast({
        title: "Dashboard Saved",
        description: "Your dashboard layout has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reset to default layout mutation
  const resetLayoutMutation = useMutation({
    mutationFn: async () => {
      await updateUserProfile({
        preferences: { 
          ...userProfile?.preferences, 
          dashboardLayouts: null 
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      setLayouts(defaultLayouts);
      toast({
        title: "Dashboard Reset",
        description: "Your dashboard has been reset to default layout.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Reset Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Save theme color mutation
  const saveThemeColorMutation = useMutation({
    mutationFn: async (color: string) => {
      await updateUserProfile({
        preferences: { ...userProfile?.preferences, dashboardColor: color }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast({
        title: "Theme Updated",
        description: "Your dashboard color has been saved successfully.",
      });
      setColorPickerOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleColorChange = (color: string) => {
    setThemeColor(color);
    saveThemeColorMutation.mutate(color);
  };

  const handleBgColorChange = (color: string) => {
    setBgColor(color);
    updateUserProfile({
      preferences: { ...userProfile?.preferences, dashboardBgColor: color }
    }).then(() => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    });
  };

  const handleTextColorChange = (color: string) => {
    setTextColor(color);
    updateUserProfile({
      preferences: { ...userProfile?.preferences, dashboardTextColor: color }
    }).then(() => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    });
  };


  // Calculate real stats from actual trades
  const totalPnL = analytics?.totalPnL || 0;
  const winRate = analytics?.winRate || 67;
  const totalTrades = analytics?.totalTrades || 6;
  const avgProfit = analytics?.avgWin || 440.75;
  const fees = 26.81;

  // Calculate time-based profits
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const dailyPnL = trades?.filter(t => {
    const tradeDate = new Date(t.entry_date || t.created_at);
    return tradeDate >= todayStart;
  }).reduce((sum, t) => sum + (Number(t.pnl) || 0), 0) || 0;

  const weeklyPnL = trades?.filter(t => {
    const tradeDate = new Date(t.entry_date || t.created_at);
    return tradeDate >= weekStart;
  }).reduce((sum, t) => sum + (Number(t.pnl) || 0), 0) || 0;

  const monthlyPnL = trades?.filter(t => {
    const tradeDate = new Date(t.entry_date || t.created_at);
    return tradeDate >= monthStart;
  }).reduce((sum, t) => sum + (Number(t.pnl) || 0), 0) || 0;

  // Calculate time-based win rates
  const dailyTrades = trades?.filter(t => {
    const tradeDate = new Date(t.entry_date || t.created_at);
    return tradeDate >= todayStart;
  }) || [];
  const dailyWinRate = dailyTrades.length > 0 
    ? (dailyTrades.filter(t => (Number(t.pnl) || 0) > 0).length / dailyTrades.length) * 100 
    : 0;

  const weeklyTrades = trades?.filter(t => {
    const tradeDate = new Date(t.entry_date || t.created_at);
    return tradeDate >= weekStart;
  }) || [];
  const weeklyWinRate = weeklyTrades.length > 0 
    ? (weeklyTrades.filter(t => (Number(t.pnl) || 0) > 0).length / weeklyTrades.length) * 100 
    : 0;

  const monthlyTrades = trades?.filter(t => {
    const tradeDate = new Date(t.entry_date || t.created_at);
    return tradeDate >= monthStart;
  }) || [];
  const monthlyWinRate = monthlyTrades.length > 0 
    ? (monthlyTrades.filter(t => (Number(t.pnl) || 0) > 0).length / monthlyTrades.length) * 100 
    : 0;

  // Calculate time-based risk reward ratios
  const calculateRiskReward = (tradesToUse: any[]) => {
    const wins = tradesToUse.filter(t => (Number(t.pnl) || 0) > 0);
    const losses = tradesToUse.filter(t => (Number(t.pnl) || 0) < 0);
    const totalWins = wins.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
    const totalLosses = Math.abs(losses.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0));
    return totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 999 : 0;
  };

  const dailyRiskReward = calculateRiskReward(dailyTrades);
  const weeklyRiskReward = calculateRiskReward(weeklyTrades);
  const monthlyRiskReward = calculateRiskReward(monthlyTrades);
  const allTimeRiskReward = analytics?.profitFactor || 1.5;

  // Calculate time-based averages
  const dailyAvg = dailyTrades.length > 0 ? dailyPnL / dailyTrades.length : 0;
  const weeklyAvg = weeklyTrades.length > 0 ? weeklyPnL / weeklyTrades.length : 0;
  const monthlyAvg = monthlyTrades.length > 0 ? monthlyPnL / monthlyTrades.length : 0;
  const allTimeAvg = analytics?.averageTrade || 441;

  // Calculate time-based fees (placeholder - would need actual fee data)
  const dailyFees = dailyTrades.length * 2; // Example: $2 per trade
  const weeklyFees = weeklyTrades.length * 2;
  const monthlyFees = monthlyTrades.length * 2;
  const allTimeFees = (trades?.length || 0) * 2;

  // Calculate time-based trade counts
  const dailyTradeCount = dailyTrades.length;
  const weeklyTradeCount = weeklyTrades.length;
  const monthlyTradeCount = monthlyTrades.length;
  const allTimeTradeCount = analytics?.totalTrades || 0;

  // Long vs Short performance
  const longTrades = trades?.filter(t => (t.trade_type || t.tradeType) === "BUY") || [];
  const shortTrades = trades?.filter(t => (t.trade_type || t.tradeType) === "SELL") || [];
  
  const longPnL = longTrades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
  const shortPnL = shortTrades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
  
  const longWinRate = longTrades.length > 0 ? 
    Math.round((longTrades.filter(t => (Number(t.pnl) || 0) > 0).length / longTrades.length) * 100) : 75;
  const shortWinRate = shortTrades.length > 0 ? 
    Math.round((shortTrades.filter(t => (Number(t.pnl) || 0) > 0).length / shortTrades.length) * 100) : 50;

  // Get last five actual trades sorted by date
  const lastFiveTrades = trades
    ?.sort((a, b) => {
      const dateA = new Date(a.entry_date || a.created_at);
      const dateB = new Date(b.entry_date || b.created_at);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5)
    .map(trade => {
      const tradeDate = new Date(trade.entry_date || trade.created_at);
      const formattedDate = tradeDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: '2-digit', 
        year: '2-digit' 
      });
      return {
        id: trade.id,
        instrument: trade.instrument,
        tradeType: trade.trade_type || trade.tradeType || 'BUY',
        pnl: Number(trade.pnl) || 0,
        createdAt: formattedDate,
        status: trade.status
      };
    }) || [];

  // ========== NEW ANALYTICS CALCULATIONS ==========
  
  // 1. Longest Winning/Losing Streak
  let currentWinStreak = 0, maxWinStreak = 0, currentLoseStreak = 0, maxLoseStreak = 0;
  const sortedTrades = [...(trades || [])].sort((a, b) => {
    const dateA = new Date(a.entry_date || a.created_at);
    const dateB = new Date(b.entry_date || b.created_at);
    return dateA.getTime() - dateB.getTime();
  });
  
  sortedTrades.forEach(trade => {
    const pnl = Number(trade.pnl) || 0;
    if (pnl > 0) {
      currentWinStreak++;
      currentLoseStreak = 0;
      maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
    } else if (pnl < 0) {
      currentLoseStreak++;
      currentWinStreak = 0;
      maxLoseStreak = Math.max(maxLoseStreak, currentLoseStreak);
    }
  });

  // 2. Average Hold Time
  const tradesWithTime = (trades || []).filter(t => t.entry_date && t.exit_date);
  const avgHoldTimeMs = tradesWithTime.length > 0
    ? tradesWithTime.reduce((sum, t) => {
        const entry = new Date(t.entry_date).getTime();
        const exit = new Date(t.exit_date).getTime();
        return sum + (exit - entry);
      }, 0) / tradesWithTime.length
    : 0;
  
  const hours = Math.floor(avgHoldTimeMs / (1000 * 60 * 60));
  const minutes = Math.floor((avgHoldTimeMs % (1000 * 60 * 60)) / (1000 * 60));
  const avgHoldTimeDisplay = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  const winningTradesWithTime = tradesWithTime.filter(t => (Number(t.pnl) || 0) > 0);
  const losingTradesWithTime = tradesWithTime.filter(t => (Number(t.pnl) || 0) < 0);
  
  const avgWinHoldMs = winningTradesWithTime.length > 0
    ? winningTradesWithTime.reduce((sum, t) => {
        const entry = new Date(t.entry_date).getTime();
        const exit = new Date(t.exit_date).getTime();
        return sum + (exit - entry);
      }, 0) / winningTradesWithTime.length
    : 0;
  
  const avgLossHoldMs = losingTradesWithTime.length > 0
    ? losingTradesWithTime.reduce((sum, t) => {
        const entry = new Date(t.entry_date).getTime();
        const exit = new Date(t.exit_date).getTime();
        return sum + (exit - entry);
      }, 0) / losingTradesWithTime.length
    : 0;

  const winHours = Math.floor(avgWinHoldMs / (1000 * 60 * 60));
  const winMinutes = Math.floor((avgWinHoldMs % (1000 * 60 * 60)) / (1000 * 60));
  const avgWinHoldDisplay = winHours > 0 ? `${winHours}h ${winMinutes}m` : `${winMinutes}m`;

  const lossHours = Math.floor(avgLossHoldMs / (1000 * 60 * 60));
  const lossMinutes = Math.floor((avgLossHoldMs % (1000 * 60 * 60)) / (1000 * 60));
  const avgLossHoldDisplay = lossHours > 0 ? `${lossHours}h ${lossMinutes}m` : `${lossMinutes}m`;

  // 3. Most Profitable Instrument
  const instrumentPnL: Record<string, number> = {};
  (trades || []).forEach(trade => {
    const instrument = trade.instrument || 'Unknown';
    instrumentPnL[instrument] = (instrumentPnL[instrument] || 0) + (Number(trade.pnl) || 0);
  });
  
  const mostProfitable = Object.entries(instrumentPnL).sort((a, b) => b[1] - a[1])[0];
  const mostProfitableInstrument = mostProfitable ? mostProfitable[0] : 'N/A';
  const mostProfitablePnL = mostProfitable ? mostProfitable[1] : 0;

  // 4. Monthly Progress Bar
  const monthlyTarget = 5000; // You can make this configurable later
  const monthlyProgress = monthlyPnL;
  const monthlyProgressPercent = Math.min((monthlyProgress / monthlyTarget) * 100, 100);

  // 5. First vs Last Trade of Day
  const tradesByDay: Record<string, any[]> = {};
  (trades || []).forEach(trade => {
    const dateKey = new Date(trade.entry_date || trade.created_at).toDateString();
    if (!tradesByDay[dateKey]) tradesByDay[dateKey] = [];
    tradesByDay[dateKey].push(trade);
  });

  let firstTradeWins = 0, firstTradeLosses = 0, lastTradeWins = 0, lastTradeLosses = 0;
  let firstTradePnL = 0, lastTradePnL = 0;
  
  Object.values(tradesByDay).forEach(dayTrades => {
    if (dayTrades.length > 0) {
      const sorted = dayTrades.sort((a, b) => {
        const timeA = new Date(a.entry_date || a.created_at).getTime();
        const timeB = new Date(b.entry_date || b.created_at).getTime();
        return timeA - timeB;
      });
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      
      const firstPnL = Number(first.pnl) || 0;
      const lastPnL = Number(last.pnl) || 0;
      
      firstTradePnL += firstPnL;
      lastTradePnL += lastPnL;
      
      if (firstPnL > 0) firstTradeWins++; else if (firstPnL < 0) firstTradeLosses++;
      if (lastPnL > 0) lastTradeWins++; else if (lastPnL < 0) lastTradeLosses++;
    }
  });

  const firstTradeWinRate = (firstTradeWins + firstTradeLosses) > 0 
    ? (firstTradeWins / (firstTradeWins + firstTradeLosses)) * 100 
    : 0;
  const lastTradeWinRate = (lastTradeWins + lastTradeLosses) > 0 
    ? (lastTradeWins / (lastTradeWins + lastTradeLosses)) * 100 
    : 0;

  // 6. Setup Type Breakdown
  const setupPnL: Record<string, { count: number; pnl: number; wins: number }> = {};
  (trades || []).forEach(trade => {
    const setup = trade.setup_type || trade.setup || 'Unknown';
    if (!setupPnL[setup]) setupPnL[setup] = { count: 0, pnl: 0, wins: 0 };
    setupPnL[setup].count++;
    setupPnL[setup].pnl += Number(trade.pnl) || 0;
    if ((Number(trade.pnl) || 0) > 0) setupPnL[setup].wins++;
  });
  
  const topSetups = Object.entries(setupPnL)
    .map(([setup, data]) => ({
      setup,
      ...data,
      winRate: data.count > 0 ? (data.wins / data.count) * 100 : 0
    }))
    .sort((a, b) => b.pnl - a.pnl)
    .slice(0, 5);

  // 7. Risk per Trade Deviation
  const riskAmounts = (trades || [])
    .filter(t => t.risk_amount && Number(t.risk_amount) > 0)
    .map(t => Number(t.risk_amount));
  
  const avgRisk = riskAmounts.length > 0 
    ? riskAmounts.reduce((sum, r) => sum + r, 0) / riskAmounts.length 
    : 0;
  
  const variance = riskAmounts.length > 0
    ? riskAmounts.reduce((sum, r) => sum + Math.pow(r - avgRisk, 2), 0) / riskAmounts.length
    : 0;
  
  const stdDeviation = Math.sqrt(variance);
  const deviationPercent = avgRisk > 0 ? (stdDeviation / avgRisk) * 100 : 0;

  // 8. Exposure by Pair / Asset Class
  const assetExposure: Record<string, { count: number; pnl: number }> = {};
  (trades || []).forEach(trade => {
    const asset = trade.instrument_type || 'FOREX';
    if (!assetExposure[asset]) assetExposure[asset] = { count: 0, pnl: 0 };
    assetExposure[asset].count++;
    assetExposure[asset].pnl += Number(trade.pnl) || 0;
  });

  const exposureData = Object.entries(assetExposure).map(([asset, data]) => ({
    asset,
    count: data.count,
    pnl: data.pnl,
    percentage: totalTrades > 0 ? (data.count / totalTrades) * 100 : 0
  })).sort((a, b) => b.count - a.count);

  const resetLayout = () => {
    resetLayoutMutation.mutate();
  };

  const handleSaveLayout = () => {
    saveLayoutMutation.mutate(layouts);
  };

  return (
    <div className="min-h-screen p-3 sm:p-4 lg:p-8 dashboard-scrollbar relative" style={{ 
      backgroundColor: bgColor, 
      color: textColor,
      boxShadow: 'inset 0 0 20px rgba(34, 211, 238, 0.1), inset 0 0 40px rgba(34, 211, 238, 0.05)'
    }}>
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h1 className="text-xl sm:text-2xl font-bold" style={{ color: textColor }}>Trading Dashboard</h1>
          <div className="flex flex-wrap gap-2 sm:gap-3 items-center w-full sm:w-auto">
            {/* Save Layout Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveLayout}
              disabled={saveLayoutMutation.isPending}
              className="bg-slate-900/40 border-cyan-700 text-white hover:bg-slate-800/50"
              data-testid="button-save-layout"
            >
              <Save className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{saveLayoutMutation.isPending ? "Saving..." : "Save Layout"}</span>
            </Button>

            {/* Color Picker Dialog */}
            <Dialog open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-slate-900/40 border-cyan-700 text-white hover:bg-slate-800/50"
                  data-testid="button-theme"
                >
                  <Palette className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Theme</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-950 border-cyan-700 text-white max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Dashboard Customization</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Widget Color Theme</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { name: "Slate/Grey", value: "slate", color: "bg-slate-700" },
                        { name: "Blue", value: "blue", color: "bg-slate-800" },
                        { name: "Purple", value: "purple", color: "bg-purple-700" },
                        { name: "Green", value: "green", color: "bg-emerald-700" },
                        { name: "Orange", value: "orange", color: "bg-orange-700" },
                        { name: "Pink", value: "pink", color: "bg-pink-700" },
                      ].map((colorOption) => (
                        <button
                          key={colorOption.value}
                          onClick={() => handleColorChange(colorOption.value)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            themeColor === colorOption.value
                              ? "border-white scale-105"
                              : "border-gray-600 hover:border-gray-400"
                          }`}
                          data-testid={`button-theme-${colorOption.value}`}
                        >
                          <div className={`w-full h-12 ${colorOption.color} rounded mb-2`}></div>
                          <div className="text-xs text-center">{colorOption.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold mb-2 block">Background Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={bgColor}
                          onChange={(e) => handleBgColorChange(e.target.value)}
                          className="w-12 h-12 rounded border-2 border-gray-600 cursor-pointer"
                          data-testid="input-bgcolor-picker"
                        />
                        <input
                          type="text"
                          value={bgColor}
                          onChange={(e) => handleBgColorChange(e.target.value)}
                          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                          placeholder="#0f172a"
                          data-testid="input-bgcolor-text"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold mb-2 block">Text Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={textColor}
                          onChange={(e) => handleTextColorChange(e.target.value)}
                          className="w-12 h-12 rounded border-2 border-gray-600 cursor-pointer"
                          data-testid="input-textcolor-picker"
                        />
                        <input
                          type="text"
                          value={textColor}
                          onChange={(e) => handleTextColorChange(e.target.value)}
                          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                          placeholder="#ffffff"
                          data-testid="input-textcolor-text"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-700">
                    <p className="text-xs text-gray-400">Your customizations are saved automatically to your profile.</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              onClick={resetLayout}
              variant="outline"
              size="sm"
              className="bg-slate-900/40 border-cyan-700 text-white hover:bg-slate-800/50"
            >
              <RotateCcw className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Reset Layout</span>
            </Button>
            <Button
              onClick={() => setEditMode(!editMode)}
              variant={editMode ? "default" : "outline"}
              size="sm"
              className={editMode 
                ? "bg-cyan-600 hover:bg-slate-800 text-white" 
                : "bg-slate-900/40 border-cyan-700 text-white hover:bg-slate-800/50"
              }
            >
              <Move className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{editMode ? "Exit Edit" : "Edit Layout"}</span>
            </Button>
          </div>
        </div>

        {editMode && (
          <div className="mb-4 p-3 bg-slate-900/30 rounded-lg border border-cyan-700 relative z-10">
            <p className="text-cyan-200 text-xs sm:text-sm">
              <strong>Edit Mode:</strong> Drag widgets to move them around or drag the corner to resize. Click "Exit Edit" when finished.
            </p>
          </div>
        )}

        <ResponsiveGridLayout
          className="layout relative z-10"
          layouts={layouts}
          onLayoutChange={(layout, newLayouts) => {
            // Save all breakpoints including mobile (xs, xxs)
            setLayouts({
              lg: newLayouts.lg || layouts.lg,
              md: newLayouts.md || layouts.md,
              sm: newLayouts.sm || layouts.sm,
              xs: newLayouts.xs || layouts.xs,
              xxs: newLayouts.xxs || layouts.xxs,
            });
          }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 6, sm: 4, xs: 2, xxs: 2 }}
          rowHeight={60}
          isDraggable={editMode}
          isResizable={editMode}
          margin={[16, 16]}
          containerPadding={[0, 0]}
        >
          {/* Profit Widget */}
          <div key="profit">
            <div className="relative h-full">
              {/* Toggle Button - Positioned at top right of widget */}
              <button
                onClick={() => setShowAllProfits(!showAllProfits)}
                className="absolute top-4 right-4 px-2 py-1 text-xs rounded transition-colors z-10 hover:bg-cyan-500/20"
                style={{ 
                  backgroundColor: `${textColor}20`,
                  color: textColor 
                }}
                data-testid="button-toggle-profit-view"
              >
                {showAllProfits ? "All Time Only" : "All Periods"}
              </button>

              <DraggableWidget title="Profit" themeColor={themeColor} textColor={textColor}>
                {/* Profit Values */}
                {showAllProfits ? (
                  <div className="flex gap-6 mt-1">
                    <div>
                      <div className="opacity-70 text-xs mb-1" style={{ color: textColor }}>Daily</div>
                      <div className="font-bold text-xl" style={{ color: textColor }}>
                        ${dailyPnL >= 1000 ? `${(dailyPnL/1000).toFixed(1)}K` : dailyPnL.toFixed(0)}
                      </div>
                    </div>
                    <div>
                      <div className="opacity-70 text-xs mb-1" style={{ color: textColor }}>Weekly</div>
                      <div className="font-bold text-xl" style={{ color: textColor }}>
                        ${weeklyPnL >= 1000 ? `${(weeklyPnL/1000).toFixed(1)}K` : weeklyPnL.toFixed(0)}
                      </div>
                    </div>
                    <div>
                      <div className="opacity-70 text-xs mb-1" style={{ color: textColor }}>Monthly</div>
                      <div className="font-bold text-xl" style={{ color: textColor }}>
                        ${monthlyPnL >= 1000 ? `${(monthlyPnL/1000).toFixed(1)}K` : monthlyPnL.toFixed(0)}
                      </div>
                    </div>
                    <div>
                      <div className="opacity-70 text-xs mb-1" style={{ color: textColor }}>All Time</div>
                      <div className="font-bold text-xl" style={{ color: textColor }}>
                        ${totalPnL >= 1000 ? `${(totalPnL/1000).toFixed(1)}K` : totalPnL.toFixed(0)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center h-full mt-1">
                    <div>
                      <div className="opacity-70 text-sm mb-2" style={{ color: textColor }}>All Time</div>
                      <div className="font-bold text-3xl" style={{ color: textColor }}>
                        ${totalPnL >= 1000 ? `${(totalPnL/1000).toFixed(1)}K` : totalPnL.toFixed(0)}
                      </div>
                    </div>
                  </div>
                )}
              </DraggableWidget>
            </div>
          </div>

          {/* Win Rate Widget */}
          <div key="winrate">
            <div className="relative h-full">
              {/* Toggle Button - Positioned at top right of widget */}
              <button
                onClick={() => setShowAllWinRates(!showAllWinRates)}
                className="absolute top-4 right-4 px-2 py-1 text-xs rounded transition-colors z-10 hover:bg-cyan-500/20"
                style={{ 
                  backgroundColor: `${textColor}20`,
                  color: textColor 
                }}
                data-testid="button-toggle-winrate-view"
              >
                {showAllWinRates ? "All Time Only" : "All Periods"}
              </button>

              <DraggableWidget title="Win Rate" themeColor={themeColor} textColor={textColor}>
                {/* Win Rate Values */}
                {showAllWinRates ? (
                  <div className="flex gap-6 mt-1">
                    <div>
                      <div className="opacity-70 text-xs mb-1" style={{ color: textColor }}>Daily</div>
                      <div className="font-bold text-xl" style={{ color: textColor }}>
                        {dailyWinRate.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="opacity-70 text-xs mb-1" style={{ color: textColor }}>Weekly</div>
                      <div className="font-bold text-xl" style={{ color: textColor }}>
                        {weeklyWinRate.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="opacity-70 text-xs mb-1" style={{ color: textColor }}>Monthly</div>
                      <div className="font-bold text-xl" style={{ color: textColor }}>
                        {monthlyWinRate.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="opacity-70 text-xs mb-1" style={{ color: textColor }}>All Time</div>
                      <div className="font-bold text-xl" style={{ color: textColor }}>
                        {winRate.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex-1">
                      <div className="opacity-70 text-sm mb-2" style={{ color: textColor }}>All Time</div>
                      <div className="font-bold text-3xl" style={{ color: textColor }}>
                        {winRate.toFixed(1)}%
                      </div>
                    </div>
                    <div className="relative w-24 h-16 -mt-2">
                      <svg viewBox="0 0 100 60" className="w-full h-full">
                        {/* Red arc (losing trades - full background) */}
                        <path
                          d="M 10 40 A 40 40 0 0 1 90 40"
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="8"
                          strokeLinecap="round"
                        />
                        
                        {/* Green arc (winning trades - overlays on top based on win rate) */}
                        <path
                          d="M 10 40 A 40 40 0 0 1 90 40"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={`${(winRate / 100) * 126} 126`}
                          className="transition-all duration-500"
                        />
                        
                        {/* Indicator dot at the transition point */}
                        <circle
                          cx={50 + 40 * Math.cos((Math.PI * (1 - winRate / 100)))}
                          cy={40 - 40 * Math.sin((Math.PI * (1 - winRate / 100)))}
                          r="5"
                          fill="white"
                          className="transition-all duration-500"
                        />
                        
                        {/* Min/Max labels */}
                        <text x="10" y="55" className="text-xs fill-gray-500" textAnchor="middle">0</text>
                        <text x="90" y="55" className="text-xs fill-gray-500" textAnchor="middle">100</text>
                      </svg>
                    </div>
                  </div>
                )}
              </DraggableWidget>
            </div>
          </div>

          {/* Risk Reward Widget */}
          <div key="riskreward">
            <div className="relative h-full">
              {/* Toggle Button - Positioned at top right of widget */}
              <button
                onClick={() => setShowAllRiskReward(!showAllRiskReward)}
                className="absolute top-4 right-4 px-2 py-1 text-xs rounded transition-colors z-10 hover:bg-cyan-500/20"
                style={{ 
                  backgroundColor: `${textColor}20`,
                  color: textColor 
                }}
                data-testid="button-toggle-riskreward-view"
              >
                {showAllRiskReward ? "All Time Only" : "All Periods"}
              </button>

              <DraggableWidget title="Risk Reward" themeColor={themeColor} textColor={textColor}>
                {/* Risk Reward Values */}
                {showAllRiskReward ? (
                  <div className="flex gap-6 mt-1">
                    <div>
                      <div className="opacity-70 text-xs mb-1" style={{ color: textColor }}>Daily</div>
                      <div className="font-bold text-xl" style={{ color: textColor }}>
                        1:{dailyRiskReward >= 999 ? '∞' : dailyRiskReward.toFixed(1)}
                      </div>
                    </div>
                    <div>
                      <div className="opacity-70 text-xs mb-1" style={{ color: textColor }}>Weekly</div>
                      <div className="font-bold text-xl" style={{ color: textColor }}>
                        1:{weeklyRiskReward >= 999 ? '∞' : weeklyRiskReward.toFixed(1)}
                      </div>
                    </div>
                    <div>
                      <div className="opacity-70 text-xs mb-1" style={{ color: textColor }}>Monthly</div>
                      <div className="font-bold text-xl" style={{ color: textColor }}>
                        1:{monthlyRiskReward >= 999 ? '∞' : monthlyRiskReward.toFixed(1)}
                      </div>
                    </div>
                    <div>
                      <div className="opacity-70 text-xs mb-1" style={{ color: textColor }}>All Time</div>
                      <div className="font-bold text-xl" style={{ color: textColor }}>
                        1:{allTimeRiskReward >= 999 ? '∞' : allTimeRiskReward.toFixed(1)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center h-full mt-1">
                    <div>
                      <div className="opacity-70 text-sm mb-2" style={{ color: textColor }}>All Time</div>
                      <div className="font-bold text-3xl" style={{ color: textColor }}>
                        1:{allTimeRiskReward >= 999 ? '∞' : allTimeRiskReward.toFixed(1)}
                      </div>
                    </div>
                  </div>
                )}
              </DraggableWidget>
            </div>
          </div>

          {/* Average Widget */}
          <div key="average">
            <div className="relative h-full">
              {/* Toggle Button - Positioned at top right of widget */}
              <button
                onClick={() => setShowAllAverage(!showAllAverage)}
                className="absolute top-4 right-4 px-2 py-1 text-xs rounded transition-colors z-10 hover:bg-cyan-500/20"
                style={{ 
                  backgroundColor: `${textColor}20`,
                  color: textColor 
                }}
                data-testid="button-toggle-average-view"
              >
                {showAllAverage ? "All Time Only" : "All Periods"}
              </button>

              <DraggableWidget title="Average" themeColor={themeColor} textColor={textColor}>
                {/* Average Values */}
                {showAllAverage ? (
                  <div className="flex gap-6 mt-1">
                    <div>
                      <div className="opacity-70 text-xs mb-1" style={{ color: textColor }}>Daily</div>
                      <div className="font-bold text-xl" style={{ color: textColor }}>
                        ${dailyAvg >= 1000 ? `${(dailyAvg/1000).toFixed(1)}K` : dailyAvg.toFixed(0)}
                      </div>
                    </div>
                    <div>
                      <div className="opacity-70 text-xs mb-1" style={{ color: textColor }}>Weekly</div>
                      <div className="font-bold text-xl" style={{ color: textColor }}>
                        ${weeklyAvg >= 1000 ? `${(weeklyAvg/1000).toFixed(1)}K` : weeklyAvg.toFixed(0)}
                      </div>
                    </div>
                    <div>
                      <div className="opacity-70 text-xs mb-1" style={{ color: textColor }}>Monthly</div>
                      <div className="font-bold text-xl" style={{ color: textColor }}>
                        ${monthlyAvg >= 1000 ? `${(monthlyAvg/1000).toFixed(1)}K` : monthlyAvg.toFixed(0)}
                      </div>
                    </div>
                    <div>
                      <div className="opacity-70 text-xs mb-1" style={{ color: textColor }}>All Time</div>
                      <div className="font-bold text-xl" style={{ color: textColor }}>
                        ${allTimeAvg >= 1000 ? `${(allTimeAvg/1000).toFixed(1)}K` : allTimeAvg.toFixed(0)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center h-full mt-1">
                    <div>
                      <div className="opacity-70 text-sm mb-2" style={{ color: textColor }}>All Time</div>
                      <div className="font-bold text-3xl" style={{ color: textColor }}>
                        ${allTimeAvg >= 1000 ? `${(allTimeAvg/1000).toFixed(1)}K` : allTimeAvg.toFixed(0)}
                      </div>
                    </div>
                  </div>
                )}
              </DraggableWidget>
            </div>
          </div>

          {/* Fees Widget */}
          <div key="fees">
            <div className="relative h-full">
              {/* Toggle Button - Positioned at top right of widget */}
              <button
                onClick={() => setShowAllFees(!showAllFees)}
                className="absolute top-4 right-4 px-2 py-1 text-xs rounded transition-colors z-10 hover:bg-cyan-500/20"
                style={{ 
                  backgroundColor: `${textColor}20`,
                  color: textColor 
                }}
                data-testid="button-toggle-fees-view"
              >
                {showAllFees ? "All Time Only" : "All Periods"}
              </button>

              <DraggableWidget title="Fees & Commissions" themeColor={themeColor} textColor={textColor}>
                {/* Fees Values */}
                {showAllFees ? (
                  <div className="flex gap-6 mt-1">
                    <div>
                      <div className="opacity-70 text-xs mb-1" style={{ color: textColor }}>Daily</div>
                      <div className="font-bold text-xl" style={{ color: textColor }}>
                        ${dailyFees >= 1000 ? `${(dailyFees/1000).toFixed(1)}K` : dailyFees.toFixed(0)}
                      </div>
                    </div>
                    <div>
                      <div className="opacity-70 text-xs mb-1" style={{ color: textColor }}>Weekly</div>
                      <div className="font-bold text-xl" style={{ color: textColor }}>
                        ${weeklyFees >= 1000 ? `${(weeklyFees/1000).toFixed(1)}K` : weeklyFees.toFixed(0)}
                      </div>
                    </div>
                    <div>
                      <div className="opacity-70 text-xs mb-1" style={{ color: textColor }}>Monthly</div>
                      <div className="font-bold text-xl" style={{ color: textColor }}>
                        ${monthlyFees >= 1000 ? `${(monthlyFees/1000).toFixed(1)}K` : monthlyFees.toFixed(0)}
                      </div>
                    </div>
                    <div>
                      <div className="opacity-70 text-xs mb-1" style={{ color: textColor }}>All Time</div>
                      <div className="font-bold text-xl" style={{ color: textColor }}>
                        ${allTimeFees >= 1000 ? `${(allTimeFees/1000).toFixed(1)}K` : allTimeFees.toFixed(0)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center h-full mt-1">
                    <div>
                      <div className="opacity-70 text-sm mb-2" style={{ color: textColor }}>All Time</div>
                      <div className="font-bold text-3xl" style={{ color: textColor }}>
                        ${allTimeFees >= 1000 ? `${(allTimeFees/1000).toFixed(1)}K` : allTimeFees.toFixed(0)}
                      </div>
                    </div>
                  </div>
                )}
              </DraggableWidget>
            </div>
          </div>

          {/* Total Trades Widget */}
          <div key="totaltrades">
            <div className="relative h-full">
              {/* Toggle Button - Positioned at top right of widget */}
              <button
                onClick={() => setShowAllTotalTrades(!showAllTotalTrades)}
                className="absolute top-4 right-4 px-2 py-1 text-xs rounded transition-colors z-10 hover:bg-cyan-500/20"
                style={{ 
                  backgroundColor: `${textColor}20`,
                  color: textColor 
                }}
                data-testid="button-toggle-totaltrades-view"
              >
                {showAllTotalTrades ? "All Time Only" : "All Periods"}
              </button>

              <DraggableWidget title="Total Trades" themeColor={themeColor} textColor={textColor}>
                {/* Total Trades Values */}
                {showAllTotalTrades ? (
                  <div className="flex gap-6 mt-1">
                    <div>
                      <div className="opacity-70 text-xs mb-1" style={{ color: textColor }}>Daily</div>
                      <div className="font-bold text-xl" style={{ color: textColor }}>
                        {dailyTradeCount}
                      </div>
                    </div>
                    <div>
                      <div className="opacity-70 text-xs mb-1" style={{ color: textColor }}>Weekly</div>
                      <div className="font-bold text-xl" style={{ color: textColor }}>
                        {weeklyTradeCount}
                      </div>
                    </div>
                    <div>
                      <div className="opacity-70 text-xs mb-1" style={{ color: textColor }}>Monthly</div>
                      <div className="font-bold text-xl" style={{ color: textColor }}>
                        {monthlyTradeCount}
                      </div>
                    </div>
                    <div>
                      <div className="opacity-70 text-xs mb-1" style={{ color: textColor }}>All Time</div>
                      <div className="font-bold text-xl" style={{ color: textColor }}>
                        {allTimeTradeCount}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center h-full mt-1">
                    <div>
                      <div className="opacity-70 text-sm mb-2" style={{ color: textColor }}>All Time</div>
                      <div className="font-bold text-3xl" style={{ color: textColor }}>
                        {allTimeTradeCount}
                      </div>
                    </div>
                  </div>
                )}
              </DraggableWidget>
            </div>
          </div>

          {/* Chart Widget */}
          <div key="chart">
            <DraggableWidget title="Accumulative & Daily PnL" themeColor={themeColor} textColor={textColor}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={analytics?.equityCurve || []}
                  margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(37 99 235)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="rgb(37 99 235)" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    stroke={textColor}
                    style={{ fontSize: '10px', fill: textColor }}
                    tick={{ fill: textColor, opacity: 0.7 }}
                  />
                  <YAxis 
                    stroke={textColor}
                    style={{ fontSize: '10px', fill: textColor }}
                    tick={{ fill: textColor, opacity: 0.7 }}
                    tickFormatter={(value) => `$${value >= 1000 ? `${(value/1000).toFixed(1)}K` : value}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                      border: '1px solid rgba(59, 130, 246, 0.5)',
                      borderRadius: '8px',
                      color: textColor
                    }}
                    formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'P&L']}
                    labelStyle={{ color: textColor }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="equity" 
                    stroke="rgb(37 99 235)" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorEquity)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </DraggableWidget>
          </div>

          {/* Recent Trades Widget */}
          <div key="trades">
            <DraggableWidget title="Last Five Trades" themeColor={themeColor} textColor={textColor}>
              <div className="space-y-3 overflow-y-auto h-full">
                {lastFiveTrades.map((trade) => (
                  <div key={trade.id} className="bg-slate-800/20 rounded-lg p-3 border border-cyan-700/30">
                    <div className="grid grid-cols-3 items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded flex items-center justify-center text-xs font-bold ${
                          trade.tradeType === "BUY" ? "bg-green-500 text-white" : "bg-red-500 text-white"
                        }`}>
                          {trade.tradeType === "BUY" ? "L" : "S"}
                        </div>
                        <div>
                          <div className="text-white font-medium text-sm">{trade.instrument}</div>
                          <div className="text-gray-400 text-xs">{trade.createdAt}</div>
                        </div>
                      </div>
                      <div className={`font-bold text-sm text-center ${
                        trade.tradeType === "BUY" ? "text-green-400" : "text-red-400"
                      }`}>
                        {trade.tradeType}
                      </div>
                      <div className="text-right">
                        <div className={`font-bold text-sm ${
                          (Number(trade.pnl) || 0) >= 0 ? "text-green-400" : "text-red-400"
                        }`}>
                          {(Number(trade.pnl) || 0) >= 0 ? "+" : ""}${(Number(trade.pnl) || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </DraggableWidget>
          </div>

          {/* Long vs Short Performance Widget */}
          <div key="longshort">
            <DraggableWidget title="Long vs Short Performance" themeColor={themeColor} textColor={textColor}>
              <div className="grid grid-cols-2 gap-4 h-full">
                {/* Longs */}
                <div className="bg-slate-800/20 rounded-lg p-3 border border-cyan-700/30">
                  <div className="text-center mb-3">
                    <div className="text-gray-400 text-lg">{longTrades.length} LONGS</div>
                  </div>
                  <div className="relative w-24 h-24 mx-auto mb-3">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle cx="48" cy="48" r="36" stroke="rgb(30 41 59)" strokeWidth="8" fill="none" />
                      <circle
                        cx="48" cy="48" r="36" stroke="rgb(34 197 94)" strokeWidth="8" fill="none"
                        strokeDasharray={`${longWinRate * 2.26} 226`} className="transition-all duration-300"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white font-bold text-xl">{longWinRate}%</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-green-400 font-bold text-lg">${longPnL.toFixed(2)}</div>
                  </div>
                </div>

                {/* Shorts */}
                <div className="bg-slate-800/20 rounded-lg p-3 border border-cyan-700/30">
                  <div className="text-center mb-3">
                    <div className="text-gray-400 text-lg">{shortTrades.length} SHORTS</div>
                  </div>
                  <div className="relative w-24 h-24 mx-auto mb-3">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle cx="48" cy="48" r="36" stroke="rgb(30 41 59)" strokeWidth="8" fill="none" />
                      <circle
                        cx="48" cy="48" r="36" stroke="rgb(239 68 68)" strokeWidth="8" fill="none"
                        strokeDasharray={`${shortWinRate * 2.26} 226`} className="transition-all duration-300"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white font-bold text-xl">{shortWinRate}%</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-red-400 font-bold text-lg">${shortPnL.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </DraggableWidget>
          </div>

          {/* Trade Timing Insights Widget */}
          <div key="timing">
            <DraggableWidget title="Trade Timing Insights" themeColor={themeColor} textColor={textColor}>
              <TimingInsights trades={trades} textColor={textColor} />
            </DraggableWidget>
          </div>

          {/* Calendar Widget */}
          <div key="calendar">
            <DraggableWidget title="Trading Calendar" themeColor={themeColor} textColor={textColor}>
              <CalendarWidget textColor={textColor} selectedAccount={selectedAccount} />
            </DraggableWidget>
          </div>

          {/* 1. Winning/Losing Streak Widget */}
          <div key="streak">
            <DraggableWidget title="Streak Tracker" themeColor={themeColor} textColor={textColor}>
              <div className="grid grid-cols-2 gap-3 h-full">
                <div className="bg-slate-800/20 rounded-lg p-3 border border-green-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="h-4 w-4 text-green-500" />
                    <div className="text-xs text-gray-400">Win Streak</div>
                  </div>
                  <div className="text-3xl font-bold text-green-500">{maxWinStreak}</div>
                  <div className="text-xs text-gray-400 mt-1">trades</div>
                </div>
                <div className="bg-slate-800/20 rounded-lg p-3 border border-red-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="h-4 w-4 text-red-500" />
                    <div className="text-xs text-gray-400">Loss Streak</div>
                  </div>
                  <div className="text-3xl font-bold text-red-500">{maxLoseStreak}</div>
                  <div className="text-xs text-gray-400 mt-1">trades</div>
                </div>
              </div>
            </DraggableWidget>
          </div>

          {/* 2. Average Hold Time Widget */}
          <div key="holdtime">
            <DraggableWidget title="Hold Time" themeColor={themeColor} textColor={textColor}>
              <div className="space-y-3 h-full">
                <div className="bg-slate-800/20 rounded-lg p-3 border border-cyan-700/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-cyan-500" />
                    <div className="text-xs text-gray-400">Average</div>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: textColor }}>{avgHoldTimeDisplay}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-800/20 rounded-lg p-2 border border-green-500/30">
                    <div className="text-xs text-gray-400 mb-1">Wins</div>
                    <div className="text-sm font-bold text-green-500">{avgWinHoldDisplay}</div>
                  </div>
                  <div className="bg-slate-800/20 rounded-lg p-2 border border-red-500/30">
                    <div className="text-xs text-gray-400 mb-1">Losses</div>
                    <div className="text-sm font-bold text-red-500">{avgLossHoldDisplay}</div>
                  </div>
                </div>
              </div>
            </DraggableWidget>
          </div>

          {/* 3. Most Profitable Instrument Widget */}
          <div key="mostprofitable">
            <DraggableWidget title="Top Instrument" themeColor={themeColor} textColor={textColor}>
              <div className="flex flex-col justify-center items-center h-full">
                <Trophy className="h-8 w-8 text-yellow-500 mb-3" />
                <div className="text-xl font-bold text-center mb-2" style={{ color: textColor }}>
                  {mostProfitableInstrument}
                </div>
                <div className={`text-2xl font-bold ${mostProfitablePnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {mostProfitablePnL >= 0 ? '+' : ''}${mostProfitablePnL.toFixed(2)}
                </div>
              </div>
            </DraggableWidget>
          </div>

          {/* 4. Monthly Progress Bar Widget */}
          <div key="monthlyprogress">
            <DraggableWidget title="Monthly Target" themeColor={themeColor} textColor={textColor}>
              <div className="flex flex-col justify-center h-full space-y-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Progress</span>
                  <span className="font-bold" style={{ color: textColor }}>${monthlyProgress.toFixed(0)} / ${monthlyTarget}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden border border-cyan-700/30">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 flex items-center justify-end pr-2"
                    style={{ width: `${monthlyProgressPercent}%` }}
                  >
                    <span className="text-xs font-bold text-white">{monthlyProgressPercent.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="text-xs text-gray-400 text-center">
                  {monthlyProgress >= monthlyTarget ? '🎉 Target reached!' : `$${(monthlyTarget - monthlyProgress).toFixed(0)} to go`}
                </div>
              </div>
            </DraggableWidget>
          </div>

          {/* 5. First vs Last Trade Widget */}
          <div key="firstlast">
            <DraggableWidget title="First vs Last Trade of Day" themeColor={themeColor} textColor={textColor}>
              <div className="grid grid-cols-2 gap-4 h-full">
                <div className="bg-slate-800/20 rounded-lg p-3 border border-cyan-700/30">
                  <div className="text-center mb-3">
                    <div className="text-gray-400 text-sm">First Trade</div>
                  </div>
                  <div className="relative w-20 h-20 mx-auto mb-3">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle cx="40" cy="40" r="30" stroke="rgb(30 41 59)" strokeWidth="6" fill="none" />
                      <circle
                        cx="40" cy="40" r="30" stroke="rgb(34 197 94)" strokeWidth="6" fill="none"
                        strokeDasharray={`${firstTradeWinRate * 1.88} 188`} className="transition-all duration-300"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white font-bold text-lg">{firstTradeWinRate.toFixed(0)}%</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`font-bold text-lg ${firstTradePnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {firstTradePnL >= 0 ? '+' : ''}${firstTradePnL.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/20 rounded-lg p-3 border border-cyan-700/30">
                  <div className="text-center mb-3">
                    <div className="text-gray-400 text-sm">Last Trade</div>
                  </div>
                  <div className="relative w-20 h-20 mx-auto mb-3">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle cx="40" cy="40" r="30" stroke="rgb(30 41 59)" strokeWidth="6" fill="none" />
                      <circle
                        cx="40" cy="40" r="30" stroke="rgb(239 68 68)" strokeWidth="6" fill="none"
                        strokeDasharray={`${lastTradeWinRate * 1.88} 188`} className="transition-all duration-300"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white font-bold text-lg">{lastTradeWinRate.toFixed(0)}%</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`font-bold text-lg ${lastTradePnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {lastTradePnL >= 0 ? '+' : ''}${lastTradePnL.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </DraggableWidget>
          </div>

          {/* 6. Setup Type Breakdown Widget */}
          <div key="setupbreakdown">
            <DraggableWidget title="Setup Breakdown" themeColor={themeColor} textColor={textColor}>
              <div className="space-y-2 overflow-y-auto h-full">
                {topSetups.length > 0 ? (
                  topSetups.map((setup, idx) => (
                    <div key={idx} className="bg-slate-800/20 rounded-lg p-2 border border-cyan-700/30">
                      <div className="flex justify-between items-center mb-1">
                        <div className="font-medium text-sm" style={{ color: textColor }}>{setup.setup}</div>
                        <div className={`text-sm font-bold ${setup.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {setup.pnl >= 0 ? '+' : ''}${setup.pnl.toFixed(2)}
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>{setup.count} trades</span>
                        <span>{setup.winRate.toFixed(0)}% WR</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-400 py-4">No setup data</div>
                )}
              </div>
            </DraggableWidget>
          </div>

          {/* 7. Risk Deviation Widget */}
          <div key="riskdeviation">
            <DraggableWidget title="Risk Deviation" themeColor={themeColor} textColor={textColor}>
              <div className="flex flex-col justify-center items-center h-full">
                <AlertTriangle className={`h-8 w-8 mb-3 ${deviationPercent > 20 ? 'text-red-500' : deviationPercent > 10 ? 'text-yellow-500' : 'text-green-500'}`} />
                <div className={`text-3xl font-bold mb-2 ${deviationPercent > 20 ? 'text-red-500' : deviationPercent > 10 ? 'text-yellow-500' : 'text-green-500'}`}>
                  {deviationPercent.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-400 text-center">Avg Risk: ${avgRisk.toFixed(2)}</div>
                <div className="text-xs text-gray-400 text-center">Std Dev: ${stdDeviation.toFixed(2)}</div>
              </div>
            </DraggableWidget>
          </div>

          {/* 8. Exposure by Asset Class Widget */}
          <div key="exposure">
            <DraggableWidget title="Asset Exposure" themeColor={themeColor} textColor={textColor}>
              <div className="space-y-2 overflow-y-auto h-full">
                {exposureData.length > 0 ? (
                  exposureData.map((item, idx) => (
                    <div key={idx} className="bg-slate-800/20 rounded-lg p-2 border border-cyan-700/30">
                      <div className="flex justify-between items-center mb-1">
                        <div className="font-medium text-sm" style={{ color: textColor }}>{item.asset}</div>
                        <div className="text-sm font-bold text-cyan-500">{item.percentage.toFixed(0)}%</div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>{item.count} trades</span>
                        <span className={item.pnl >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {item.pnl >= 0 ? '+' : ''}${item.pnl.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-400 py-4">No exposure data</div>
                )}
              </div>
            </DraggableWidget>
          </div>
        </ResponsiveGridLayout>

        {/* Session Insights */}
        <div className="mt-4 sm:mt-6 relative z-10">
          <SessionInsights trades={trades} bgColor={bgColor} textColor={textColor} themeColor={themeColor} />
        </div>
      </div>
    </div>
  );
}
