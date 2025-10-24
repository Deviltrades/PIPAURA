import { useState, useEffect } from "react";
import { Responsive, WidthProvider, Layout, Layouts } from "react-grid-layout";
import { TrendingUp, TrendingDown, BarChart3, Target, DollarSign, Layers, Move, RotateCcw, Save, Grid3X3, Trash2, Palette, Flame, Clock, Trophy, TrendingUpIcon, CircleDot, PieChart, AlertTriangle, Briefcase } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, BarChart, Bar, ReferenceLine, Cell } from "recharts";
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
  const [, setLocation] = useLocation();
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
  
  // Fetch account data to get balance for risk calculation
  const { data: accountData } = useQuery({
    queryKey: ["account", selectedAccount],
    queryFn: async () => {
      if (!selectedAccount || selectedAccount === 'all') return null;
      const response = await fetch(`/api/accounts/${selectedAccount}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!selectedAccount && selectedAccount !== 'all',
    retry: false,
  });
  
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
      { i: "holdtime", x: 3, y: 22, w: 3, h: 4 },
      { i: "mostprofitable", x: 6, y: 22, w: 3, h: 3 },
      { i: "monthlyprogress", x: 9, y: 22, w: 3, h: 3 },
      { i: "firstlast", x: 0, y: 27, w: 6, h: 5 },
      { i: "riskdeviation", x: 0, y: 34, w: 3, h: 5 },
      { i: "exposure", x: 3, y: 34, w: 3, h: 5 },
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
      { i: "holdtime", x: 3, y: 30, w: 3, h: 4 },
      { i: "mostprofitable", x: 0, y: 35, w: 3, h: 3 },
      { i: "monthlyprogress", x: 3, y: 35, w: 3, h: 3 },
      { i: "firstlast", x: 0, y: 40, w: 6, h: 5 },
      { i: "riskdeviation", x: 0, y: 55, w: 3, h: 5 },
      { i: "exposure", x: 3, y: 55, w: 3, h: 5 },
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
      { i: "holdtime", x: 2, y: 36, w: 2, h: 4 },
      { i: "mostprofitable", x: 0, y: 41, w: 2, h: 3 },
      { i: "monthlyprogress", x: 2, y: 41, w: 2, h: 3 },
      { i: "firstlast", x: 0, y: 46, w: 4, h: 5 },
      { i: "riskdeviation", x: 0, y: 61, w: 2, h: 5 },
      { i: "exposure", x: 2, y: 61, w: 2, h: 5 },
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
      { i: "holdtime", x: 0, y: 47, w: 2, h: 4 },
      { i: "mostprofitable", x: 0, y: 53, w: 2, h: 3 },
      { i: "monthlyprogress", x: 0, y: 58, w: 2, h: 3 },
      { i: "firstlast", x: 0, y: 63, w: 2, h: 5 },
      { i: "riskdeviation", x: 0, y: 78, w: 2, h: 5 },
      { i: "exposure", x: 0, y: 83, w: 2, h: 5 },
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
      { i: "holdtime", x: 0, y: 47, w: 2, h: 4 },
      { i: "mostprofitable", x: 0, y: 53, w: 2, h: 3 },
      { i: "monthlyprogress", x: 0, y: 58, w: 2, h: 3 },
      { i: "firstlast", x: 0, y: 63, w: 2, h: 5 },
      { i: "riskdeviation", x: 0, y: 78, w: 2, h: 5 },
      { i: "exposure", x: 0, y: 83, w: 2, h: 5 },
    ]
  };

  const [layouts, setLayouts] = useState(defaultLayouts);

  // Fetch user profile to get theme preference and layouts
  const { data: userProfile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: getUserProfile,
    retry: false,
  });

  // Helper function to merge saved layouts with new default widgets
  const mergeLayouts = (savedLayouts: any, defaults: any) => {
    const merged: any = {};
    
    const breakpoints = ['lg', 'md', 'sm', 'xs', 'xxs'];
    
    breakpoints.forEach(breakpoint => {
      const savedLayout = savedLayouts[breakpoint] || [];
      const defaultLayout = defaults[breakpoint] || [];
      
      // Create a map of existing widget IDs in saved layout
      const savedWidgetIds = new Set(savedLayout.map((item: any) => item.i));
      
      // Start with saved layout
      merged[breakpoint] = [...savedLayout];
      
      // Add any new widgets from defaults that aren't in saved layout
      defaultLayout.forEach((defaultItem: any) => {
        if (!savedWidgetIds.has(defaultItem.i)) {
          merged[breakpoint].push(defaultItem);
        }
      });
    });
    
    return merged;
  };

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
      // Merge saved layouts with new defaults to include any newly added widgets
      const mergedLayouts = mergeLayouts(userProfile.preferences.dashboardLayouts, defaultLayouts);
      setLayouts(mergedLayouts);
      
      // Persist merged layouts back to profile so new widgets are saved
      if (JSON.stringify(mergedLayouts) !== JSON.stringify(userProfile.preferences.dashboardLayouts)) {
        updateUserProfile({
          preferences: { 
            ...userProfile.preferences, 
            dashboardLayouts: mergedLayouts 
          }
        });
      }
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
    if (dayTrades.length > 1) {
      // Only count days with multiple trades to avoid double-counting
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

  // 6. Setup Type Breakdown with advanced metrics
  const [setupSortBy, setSetupSortBy] = useState<'pnl' | 'winRate' | 'avgR' | 'expectancy'>('pnl');
  
  const setupMetrics: Record<string, { 
    count: number; 
    pnl: number; 
    wins: number; 
    totalRisk: number;
    avgWin: number;
    avgLoss: number;
  }> = {};
  
  (trades || []).forEach(trade => {
    const setup = trade.setup_type || trade.setup || 'Unknown';
    if (!setupMetrics[setup]) {
      setupMetrics[setup] = { count: 0, pnl: 0, wins: 0, totalRisk: 0, avgWin: 0, avgLoss: 0 };
    }
    
    const pnl = Number(trade.pnl) || 0;
    const risk = Math.abs(Number(trade.risk_amount) || 1); // Use risk_amount if available, default to 1
    
    setupMetrics[setup].count++;
    setupMetrics[setup].pnl += pnl;
    setupMetrics[setup].totalRisk += risk;
    
    if (pnl > 0) {
      setupMetrics[setup].wins++;
      setupMetrics[setup].avgWin += pnl;
    } else if (pnl < 0) {
      setupMetrics[setup].avgLoss += Math.abs(pnl);
    }
  });
  
  const allSetups = Object.entries(setupMetrics)
    .map(([setup, data]) => {
      const winRate = data.count > 0 ? (data.wins / data.count) * 100 : 0;
      const losses = data.count - data.wins;
      const avgWin = data.wins > 0 ? data.avgWin / data.wins : 0;
      const avgLoss = losses > 0 ? data.avgLoss / losses : 0;
      const avgR = data.totalRisk > 0 ? data.pnl / data.totalRisk : 0;
      const expectancy = data.count > 0 
        ? ((winRate / 100) * avgWin) - ((1 - winRate / 100) * avgLoss)
        : 0;
      
      return {
        setup,
        count: data.count,
        pnl: data.pnl,
        wins: data.wins,
        winRate,
        avgR,
        expectancy,
        avgWin,
        avgLoss
      };
    })
    .sort((a, b) => {
      if (setupSortBy === 'pnl') return b.pnl - a.pnl;
      if (setupSortBy === 'winRate') return b.winRate - a.winRate;
      if (setupSortBy === 'avgR') return b.avgR - a.avgR;
      if (setupSortBy === 'expectancy') return b.expectancy - a.expectancy;
      return 0;
    });
  
  const topSetups = allSetups.slice(0, 5);
  
  // Colors for donut chart
  const setupColors = ['#22d3ee', '#06b6d4', '#0891b2', '#0e7490', '#155e75'];

  // 7. Risk per Trade Deviation - Enhanced with histogram data
  // Get account balance for risk percentage calculation
  const accountBalance = accountData?.starting_balance || accountData?.current_balance || 10000;
  
  // Calculate risk from stop_loss distance and position_size
  const riskPercentages = (trades || [])
    .filter(t => {
      // Need stop_loss, entry_price, and position_size to calculate risk
      return t.stop_loss && t.entry_price && t.position_size && 
             Number(t.stop_loss) > 0 && Number(t.entry_price) > 0 && Number(t.position_size) > 0;
    })
    .map(t => {
      const stopLoss = Number(t.stop_loss);
      const entryPrice = Number(t.entry_price);
      const positionSize = Number(t.position_size);
      
      // Calculate pips/points at risk
      const priceDistance = Math.abs(entryPrice - stopLoss);
      
      // For forex: pip value depends on pair and lot size
      // Standard lot = 100,000 units, $10 per pip for USD pairs
      // Mini lot = 10,000 units, $1 per pip
      // Micro lot = 1,000 units, $0.10 per pip
      
      // Simplified calculation: assume position_size is in standard lots
      // Risk in dollars = price distance * pip value * position size
      const pipValue = 10; // $10 per pip for 1 standard lot on USD pairs
      const riskInDollars = priceDistance * pipValue * positionSize;
      
      // Calculate risk as percentage of account balance
      const riskPercent = (riskInDollars / accountBalance) * 100;
      
      return Math.abs(riskPercent); // Ensure positive value
    });
  
  const avgRiskPercent = riskPercentages.length > 0 
    ? riskPercentages.reduce((sum, r) => sum + r, 0) / riskPercentages.length 
    : 0;
  
  const variance = riskPercentages.length > 0
    ? riskPercentages.reduce((sum, r) => sum + Math.pow(r - avgRiskPercent, 2), 0) / riskPercentages.length
    : 0;
  
  const stdDevRisk = Math.sqrt(variance);
  
  // Target risk and deviation band
  const targetRisk = 1.0; // 1% target risk
  const deviationBand = 0.25; // ±0.25% acceptable deviation
  const lowerBound = targetRisk - deviationBand;
  const upperBound = targetRisk + deviationBand;
  
  // Calculate trades outside the acceptable band
  const tradesOutsideBand = riskPercentages.filter(r => r < lowerBound || r > upperBound).length;
  const percentOutsideBand = riskPercentages.length > 0 
    ? (tradesOutsideBand / riskPercentages.length) * 100 
    : 0;
  
  // Create histogram bins (0.25% increments)
  const createHistogramData = () => {
    if (riskPercentages.length === 0) return [];
    
    const minRisk = Math.min(...riskPercentages);
    const maxRisk = Math.max(...riskPercentages);
    const binSize = 0.25;
    const binStart = Math.floor(minRisk / binSize) * binSize;
    const binEnd = Math.ceil(maxRisk / binSize) * binSize;
    
    const bins: { range: string; count: number; riskPercent: number }[] = [];
    
    for (let i = binStart; i <= binEnd; i += binSize) {
      const rangeStart = i;
      const rangeEnd = i + binSize;
      const count = riskPercentages.filter(r => r >= rangeStart && r < rangeEnd).length;
      
      bins.push({
        range: `${rangeStart.toFixed(2)}`,
        count: count,
        riskPercent: rangeStart + binSize / 2
      });
    }
    
    return bins;
  };
  
  const riskHistogramData = createHistogramData();

  // 8. Asset Exposure - Advanced calculation using lot size × duration
  const [exposureView, setExposureView] = useState<'symbol' | 'class'>('class');
  
  const calculateExposure = () => {
    const exposureMap: Record<string, { exposure: number; count: number; pnl: number }> = {};
    
    (trades || []).forEach(trade => {
      const key = exposureView === 'class' 
        ? (trade.instrument_type || 'FOREX')
        : (trade.symbol || 'Unknown');
      
      // Calculate exposure: lot size × hold time (in hours)
      const lotSize = Number(trade.position_size) || 1;
      const openTime = trade.open_time ? new Date(trade.open_time) : null;
      const closeTime = trade.close_time ? new Date(trade.close_time) : null;
      
      let holdTimeHours = 1; // Default to 1 hour if times not available
      if (openTime && closeTime) {
        holdTimeHours = Math.abs(closeTime.getTime() - openTime.getTime()) / (1000 * 60 * 60);
      }
      
      const exposureValue = lotSize * holdTimeHours;
      
      if (!exposureMap[key]) {
        exposureMap[key] = { exposure: 0, count: 0, pnl: 0 };
      }
      
      exposureMap[key].exposure += exposureValue;
      exposureMap[key].count++;
      exposureMap[key].pnl += Number(trade.pnl) || 0;
    });
    
    const totalExposure = Object.values(exposureMap).reduce((sum, item) => sum + item.exposure, 0);
    
    return Object.entries(exposureMap)
      .map(([name, data]) => ({
        name,
        exposure: data.exposure,
        count: data.count,
        pnl: data.pnl,
        percentage: totalExposure > 0 ? (data.exposure / totalExposure) * 100 : 0
      }))
      .sort((a, b) => b.exposure - a.exposure);
  };
  
  const exposureData = calculateExposure();
  const topExposure = exposureData.length > 0 ? exposureData[0] : null;
  const highExposureWarning = topExposure && topExposure.percentage > 50;
  
  // Chart colors for pie chart
  const exposureColors = ['#22d3ee', '#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63'];

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
          rowHeight={80}
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
              <div className="grid grid-cols-2 gap-2 h-full">
                <div className="bg-slate-800/20 rounded-lg p-2 border border-green-500/30">
                  <div className="flex items-center gap-1 mb-1">
                    <Flame className="h-3 w-3 text-green-500" />
                    <div className="text-xs text-gray-400">Win Streak</div>
                  </div>
                  <div className="text-2xl font-bold text-green-500">{maxWinStreak}</div>
                  <div className="text-xs text-gray-400">trades</div>
                </div>
                <div className="bg-slate-800/20 rounded-lg p-2 border border-red-500/30">
                  <div className="flex items-center gap-1 mb-1">
                    <Flame className="h-3 w-3 text-red-500" />
                    <div className="text-xs text-gray-400">Loss Streak</div>
                  </div>
                  <div className="text-2xl font-bold text-red-500">{maxLoseStreak}</div>
                  <div className="text-xs text-gray-400">trades</div>
                </div>
              </div>
            </DraggableWidget>
          </div>

          {/* 2. Average Hold Time Widget */}
          <div key="holdtime">
            <DraggableWidget title="Hold Time" themeColor={themeColor} textColor={textColor}>
              <div className="space-y-2 h-full">
                <div className="bg-slate-800/20 rounded-lg p-2 border border-cyan-700/30">
                  <div className="flex items-center gap-1 mb-1">
                    <Clock className="h-3 w-3 text-cyan-500" />
                    <div className="text-xs text-gray-400">Average</div>
                  </div>
                  <div className="text-xl font-bold" style={{ color: textColor }}>{avgHoldTimeDisplay}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-800/20 rounded-lg p-2 border border-green-500/30">
                    <div className="text-xs text-gray-400">Wins</div>
                    <div className="text-sm font-bold text-green-500">{avgWinHoldDisplay}</div>
                  </div>
                  <div className="bg-slate-800/20 rounded-lg p-2 border border-red-500/30">
                    <div className="text-xs text-gray-400">Losses</div>
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
                <Trophy className="h-6 w-6 text-yellow-500 mb-2" />
                <div className="text-lg font-bold text-center mb-1" style={{ color: textColor }}>
                  {mostProfitableInstrument}
                </div>
                <div className={`text-xl font-bold ${mostProfitablePnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {mostProfitablePnL >= 0 ? '+' : ''}${mostProfitablePnL.toFixed(2)}
                </div>
              </div>
            </DraggableWidget>
          </div>

          {/* 4. Monthly Progress Bar Widget */}
          <div key="monthlyprogress">
            <DraggableWidget title="Monthly Target" themeColor={themeColor} textColor={textColor}>
              <div className="flex flex-col justify-center h-full space-y-2">
                <div className="flex justify-between text-xs">
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
              <div className="grid grid-cols-2 gap-2 h-full">
                <div className="bg-slate-800/20 rounded-lg p-2 border border-cyan-700/30">
                  <div className="text-center mb-2">
                    <div className="text-gray-400 text-xs">First Trade</div>
                  </div>
                  <div className="relative w-16 h-16 mx-auto mb-2">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle cx="32" cy="32" r="24" stroke="rgb(30 41 59)" strokeWidth="5" fill="none" />
                      <circle
                        cx="32" cy="32" r="24" stroke="rgb(34 197 94)" strokeWidth="5" fill="none"
                        strokeDasharray={`${firstTradeWinRate * 1.5} 150`} className="transition-all duration-300"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white font-bold text-sm">{firstTradeWinRate.toFixed(0)}%</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`font-bold text-base ${firstTradePnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {firstTradePnL >= 0 ? '+' : ''}${firstTradePnL.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/20 rounded-lg p-2 border border-cyan-700/30">
                  <div className="text-center mb-2">
                    <div className="text-gray-400 text-xs">Last Trade</div>
                  </div>
                  <div className="relative w-16 h-16 mx-auto mb-2">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle cx="32" cy="32" r="24" stroke="rgb(30 41 59)" strokeWidth="5" fill="none" />
                      <circle
                        cx="32" cy="32" r="24" stroke="rgb(239 68 68)" strokeWidth="5" fill="none"
                        strokeDasharray={`${lastTradeWinRate * 1.5} 150`} className="transition-all duration-300"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white font-bold text-sm">{lastTradeWinRate.toFixed(0)}%</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`font-bold text-base ${lastTradePnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {lastTradePnL >= 0 ? '+' : ''}${lastTradePnL.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </DraggableWidget>
          </div>

          {/* 6. Risk Deviation Widget */}
          <div key="riskdeviation">
            <DraggableWidget 
              title="Risk Deviation" 
              themeColor={themeColor} 
              textColor={textColor}
              infoContent={
                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-bold text-cyan-400 mb-2">What This Shows</h4>
                    <p className="text-gray-300">
                      This widget measures how consistent your risk sizing is across all trades. It displays a histogram showing the distribution of risk percentage per trade.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-cyan-400 mb-2">How It Works</h4>
                    <p className="text-gray-300">
                      Risk is calculated from your stop loss distance and position size:
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      Risk % = (Entry - Stop Loss) × Position Size ÷ Account Balance × 100
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-cyan-400 mb-2">Understanding the Colors</h4>
                    <ul className="text-gray-300 space-y-1 text-xs">
                      <li>🟦 <span className="text-cyan-400">Cyan bars</span>: Trades within acceptable risk band (0.75%-1.25%)</li>
                      <li>🟥 <span className="text-red-400">Red bars</span>: Trades outside acceptable risk band</li>
                      <li>🟩 <span className="text-green-400">Green dashed line</span>: Target risk (1%)</li>
                      <li>🟨 <span className="text-yellow-400">Yellow dashed lines</span>: Deviation bands (±0.25%)</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-cyan-400 mb-2">The Alert</h4>
                    <p className="text-gray-300">
                      If more than 20% of your trades fall outside the acceptable band, you'll see a warning to tighten your lot sizing discipline.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-cyan-400 mb-2">How to Use This</h4>
                    <p className="text-gray-300">
                      Consistent risk sizing is crucial for long-term success. Aim to keep all your trades within the target band. If you see many red bars, review your position sizing calculations before entering trades.
                    </p>
                  </div>
                </div>
              }
            >
              <div className="flex flex-col h-full">
                {/* Alert banner if > 20% trades outside band */}
                {percentOutsideBand > 20 && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-2 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <div className="text-xs text-red-300">
                      Risk inconsistency detected: tighten lot sizing discipline.
                    </div>
                  </div>
                )}
                
                {/* Histogram Chart */}
                <div className="flex-1 min-h-0">
                  {riskHistogramData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={riskHistogramData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 30 }}
                      >
                        <XAxis 
                          dataKey="range" 
                          stroke={textColor}
                          style={{ fontSize: '10px', fill: textColor }}
                          tick={{ fill: textColor, opacity: 0.7 }}
                          label={{ value: 'Risk %', position: 'bottom', fill: textColor, fontSize: 10, offset: 0 }}
                        />
                        <YAxis 
                          stroke={textColor}
                          style={{ fontSize: '10px', fill: textColor }}
                          tick={{ fill: textColor, opacity: 0.7 }}
                          label={{ value: 'Trade Count', angle: -90, position: 'insideLeft', fill: textColor, fontSize: 10 }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                            border: '1px solid rgba(59, 130, 246, 0.5)',
                            borderRadius: '8px',
                            color: textColor
                          }}
                          formatter={(value: any) => [`${value} trades`, 'Count']}
                          labelStyle={{ color: textColor }}
                        />
                        
                        {/* Target risk center line */}
                        <ReferenceLine 
                          x={targetRisk.toFixed(2)} 
                          stroke="rgb(34 197 94)" 
                          strokeWidth={2}
                          strokeDasharray="3 3"
                          label={{ value: 'Target', position: 'top', fill: 'rgb(34 197 94)', fontSize: 10 }}
                        />
                        
                        {/* Deviation band shading */}
                        <ReferenceLine 
                          x={lowerBound.toFixed(2)} 
                          stroke="rgb(251 191 36)" 
                          strokeWidth={1}
                          strokeDasharray="2 2"
                        />
                        <ReferenceLine 
                          x={upperBound.toFixed(2)} 
                          stroke="rgb(251 191 36)" 
                          strokeWidth={1}
                          strokeDasharray="2 2"
                        />
                        
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {riskHistogramData.map((entry, index) => {
                            const riskVal = parseFloat(entry.range);
                            const isInBand = riskVal >= lowerBound && riskVal <= upperBound;
                            return (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={isInBand ? 'rgb(34 211 238)' : 'rgb(239 68 68)'} 
                              />
                            );
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                      No risk data available
                    </div>
                  )}
                </div>
                
                {/* Numeric Summary */}
                <div className="mt-2 pt-2 border-t border-cyan-700/30 flex justify-around text-xs">
                  <div className="text-center">
                    <div className="text-gray-400">Avg Risk</div>
                    <div className="font-bold text-cyan-400">{avgRiskPercent.toFixed(2)}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400">StdDev</div>
                    <div className="font-bold text-cyan-400">{stdDevRisk.toFixed(2)}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400">Out of Band</div>
                    <div className={`font-bold ${percentOutsideBand > 20 ? 'text-red-500' : 'text-green-500'}`}>
                      {percentOutsideBand.toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>
            </DraggableWidget>
          </div>

          {/* 8. Asset Exposure Widget */}
          <div key="exposure">
            <DraggableWidget 
              title="Asset Exposure" 
              themeColor={themeColor} 
              textColor={textColor}
              infoContent={
                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-bold text-cyan-400 mb-2">What This Shows</h4>
                    <p className="text-gray-300">
                      This widget visualizes your trading exposure across different assets, showing where you're concentrating your trading activity.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-cyan-400 mb-2">Exposure Calculation</h4>
                    <p className="text-gray-300">
                      Exposure is calculated using:
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      Lot Size × Hold Time (hours)
                    </p>
                    <p className="text-gray-300 text-xs mt-1">
                      This gives a more accurate picture than just trade count, as it accounts for both position size and time in market.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-cyan-400 mb-2">View Options</h4>
                    <ul className="text-gray-300 space-y-1 text-xs">
                      <li>📊 <span className="text-cyan-400">By Asset Class</span>: See exposure across FOREX, INDICES, CRYPTO, etc.</li>
                      <li>🎯 <span className="text-cyan-400">By Symbol</span>: See exposure for specific trading pairs</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-cyan-400 mb-2">High Exposure Warning</h4>
                    <p className="text-gray-300">
                      If more than 50% of your exposure is in a single asset, you'll see a balance warning. This suggests you may want to diversify to reduce concentration risk.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-cyan-400 mb-2">Top 3 Highlights</h4>
                    <p className="text-gray-300">
                      The top 3 most exposed assets are highlighted with badges, making it easy to spot your dominant trading areas.
                    </p>
                  </div>
                </div>
              }
            >
              <div className="flex flex-col h-full">
                {/* Toggle between Symbol and Asset Class */}
                <div className="flex gap-2 mb-3">
                  <Button
                    variant={exposureView === 'class' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setExposureView('class')}
                    className={exposureView === 'class' 
                      ? 'bg-cyan-500 hover:bg-cyan-600 text-white' 
                      : 'bg-slate-800/40 border-cyan-700/50 text-gray-300 hover:bg-slate-700/50'
                    }
                    data-testid="button-exposure-class"
                  >
                    By Asset Class
                  </Button>
                  <Button
                    variant={exposureView === 'symbol' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setExposureView('symbol')}
                    className={exposureView === 'symbol' 
                      ? 'bg-cyan-500 hover:bg-cyan-600 text-white' 
                      : 'bg-slate-800/40 border-cyan-700/50 text-gray-300 hover:bg-slate-700/50'
                    }
                    data-testid="button-exposure-symbol"
                  >
                    By Symbol
                  </Button>
                </div>
                
                {/* High Exposure Warning */}
                {highExposureWarning && topExposure && (
                  <div className="bg-amber-500/20 border border-amber-500/50 rounded-lg p-2 mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0" />
                    <p className="text-amber-200 text-xs">
                      High exposure to <span className="font-bold">{topExposure.name}</span> ({topExposure.percentage.toFixed(0)}%) – consider diversifying to reduce risk.
                    </p>
                  </div>
                )}
                
                {/* List View */}
                <div className="space-y-2 flex-1 overflow-y-auto">
                  {exposureData.length > 0 ? (
                    exposureData.map((item, idx) => {
                      const isTop3 = idx < 3;
                      const badgeColors = ['bg-yellow-500', 'bg-gray-400', 'bg-orange-600'];
                      
                      return (
                        <div 
                          key={idx} 
                          className={`bg-slate-800/20 rounded-lg p-3 border ${
                            isTop3 ? 'border-cyan-500/50' : 'border-cyan-700/30'
                          } relative`}
                          data-testid={`exposure-item-${idx}`}
                        >
                          {/* Top 3 Badge */}
                          {isTop3 && (
                            <div className={`absolute -top-2 -right-2 ${badgeColors[idx]} text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg`}>
                              #{idx + 1}
                            </div>
                          )}
                          
                          <div className="flex justify-between items-center mb-2">
                            <div className="font-medium" style={{ color: textColor }}>{item.name}</div>
                            <div className="text-lg font-bold text-cyan-400">{item.percentage.toFixed(0)}%</div>
                          </div>
                          
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>{item.count} trades</span>
                            <span className={item.pnl >= 0 ? 'text-green-500' : 'text-red-500'}>
                              {item.pnl >= 0 ? '+' : ''}${item.pnl.toFixed(2)}
                            </span>
                          </div>
                          
                          {/* Exposure Bar */}
                          <div className="mt-2 bg-slate-700/30 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 rounded-full transition-all duration-300"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-gray-400 py-8">No exposure data</div>
                  )}
                </div>
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
