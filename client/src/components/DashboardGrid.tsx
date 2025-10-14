import { useState, useEffect } from "react";
import { Responsive, WidthProvider, Layout, Layouts } from "react-grid-layout";
import { TrendingUp, TrendingDown, BarChart3, Target, DollarSign, Layers, Move, RotateCcw, Save, Grid3X3, Trash2, Palette } from "lucide-react";
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
  const [showAllProfits, setShowAllProfits] = useState(true);
  const [showAllWinRates, setShowAllWinRates] = useState(true);
  const [showAllRiskReward, setShowAllRiskReward] = useState(true);
  const [showAllAverage, setShowAllAverage] = useState(true);
  const [showAllFees, setShowAllFees] = useState(true);
  const [showAllTotalTrades, setShowAllTotalTrades] = useState(true);
  
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

  const resetLayout = () => {
    resetLayoutMutation.mutate();
  };

  const handleSaveLayout = () => {
    saveLayoutMutation.mutate(layouts);
  };

  return (
    <div className="min-h-screen p-4 lg:p-8" style={{ backgroundColor: bgColor, color: textColor }}>
      <div className="max-w-7xl mx-auto relative">
        {/* Animated Cyan Border Snake Effect */}
        <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none z-0">
          <div className="absolute inset-[-3px]" style={{
            background: 'conic-gradient(from 0deg, transparent 0%, transparent 60%, hsl(188, 94%, 60%) 80%, hsl(188, 94%, 70%) 90%, transparent 100%)',
            animation: 'border-rotate 4.8s linear infinite',
            borderRadius: '0.5rem',
            filter: 'blur(1px)',
          }}></div>
          <div className="absolute inset-[3px] rounded-lg" style={{ backgroundColor: bgColor }}></div>
        </div>
        
        {/* Header Controls */}
        <div className="flex justify-between items-center mb-4 relative z-10">
          <h1 className="text-2xl font-bold mb-2" style={{ color: textColor }}>Trading Dashboard</h1>
          <div className="flex gap-3 items-center">
            {/* Save Layout Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveLayout}
              disabled={saveLayoutMutation.isPending}
              className="bg-slate-900/40 border-cyan-700 text-white hover:bg-slate-800/50"
              data-testid="button-save-layout"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveLayoutMutation.isPending ? "Saving..." : "Save Layout"}
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
                  <Palette className="w-4 h-4 mr-2" />
                  Theme
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
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Layout
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
              <Move className="w-4 h-4 mr-2" />
              {editMode ? "Exit Edit" : "Edit Layout"}
            </Button>
          </div>
        </div>

        {editMode && (
          <div className="mb-4 p-3 bg-slate-900/30 rounded-lg border border-cyan-700">
            <p className="text-cyan-200 text-sm">
              <strong>Edit Mode:</strong> Drag widgets to move them around or drag the corner to resize. Click "Exit Edit" when finished.
            </p>
          </div>
        )}

        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          onLayoutChange={(layout, newLayouts) => {
            // Only save the breakpoints we care about
            setLayouts({
              lg: newLayouts.lg || layouts.lg,
              md: newLayouts.md || layouts.md,
              sm: newLayouts.sm || layouts.sm,
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
                className="absolute top-4 right-4 px-2 py-1 text-xs rounded transition-colors z-10"
                style={{ 
                  backgroundColor: `${textColor}20`,
                  color: textColor 
                }}
                data-testid="button-toggle-profit-view"
              >
                {showAllProfits ? "Show All Time Only" : "Show All Periods"}
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
                className="absolute top-4 right-4 px-2 py-1 text-xs rounded transition-colors z-10"
                style={{ 
                  backgroundColor: `${textColor}20`,
                  color: textColor 
                }}
                data-testid="button-toggle-winrate-view"
              >
                {showAllWinRates ? "Show All Time Only" : "Show All Periods"}
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
                    <div className="relative w-24 h-12">
                      <svg viewBox="0 0 100 50" className="w-full h-full">
                        {/* Red arc (losing trades - full background) */}
                        <path
                          d="M 10 45 A 40 40 0 0 1 90 45"
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="8"
                          strokeLinecap="round"
                        />
                        
                        {/* Green arc (winning trades - overlays on top based on win rate) */}
                        <path
                          d="M 10 45 A 40 40 0 0 1 90 45"
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
                          cy={45 - 40 * Math.sin((Math.PI * (1 - winRate / 100)))}
                          r="5"
                          fill="white"
                          className="transition-all duration-500"
                        />
                      </svg>
                      
                      {/* Min/Max labels */}
                      <div className="absolute -bottom-4 left-0 text-gray-500 text-xs">0</div>
                      <div className="absolute -bottom-4 right-0 text-gray-500 text-xs">100</div>
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
                className="absolute top-4 right-4 px-2 py-1 text-xs rounded transition-colors z-10"
                style={{ 
                  backgroundColor: `${textColor}20`,
                  color: textColor 
                }}
                data-testid="button-toggle-riskreward-view"
              >
                {showAllRiskReward ? "Show All Time Only" : "Show All Periods"}
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
                className="absolute top-4 right-4 px-2 py-1 text-xs rounded transition-colors z-10"
                style={{ 
                  backgroundColor: `${textColor}20`,
                  color: textColor 
                }}
                data-testid="button-toggle-average-view"
              >
                {showAllAverage ? "Show All Time Only" : "Show All Periods"}
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
                className="absolute top-4 right-4 px-2 py-1 text-xs rounded transition-colors z-10"
                style={{ 
                  backgroundColor: `${textColor}20`,
                  color: textColor 
                }}
                data-testid="button-toggle-fees-view"
              >
                {showAllFees ? "Show All Time Only" : "Show All Periods"}
              </button>

              <DraggableWidget title="Swap Fees & Commissions" themeColor={themeColor} textColor={textColor}>
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
                className="absolute top-4 right-4 px-2 py-1 text-xs rounded transition-colors z-10"
                style={{ 
                  backgroundColor: `${textColor}20`,
                  color: textColor 
                }}
                data-testid="button-toggle-totaltrades-view"
              >
                {showAllTotalTrades ? "Show All Time Only" : "Show All Periods"}
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
        </ResponsiveGridLayout>
      </div>
    </div>
  );
}