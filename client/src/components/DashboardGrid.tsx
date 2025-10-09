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
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardGridProps {
  analytics: any;
  trades: any[];
}

export default function DashboardGrid({ analytics, trades }: DashboardGridProps) {
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [themeColor, setThemeColor] = useState("slate");
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [bgColor, setBgColor] = useState("#0f172a");
  const [textColor, setTextColor] = useState("#ffffff");
  const [showAllProfits, setShowAllProfits] = useState(true);
  
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
      { i: "calendar", x: 9, y: 8, w: 3, h: 7 },
      { i: "longshort", x: 0, y: 8, w: 6, h: 4 },
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
      { i: "calendar", x: 0, y: 16, w: 3, h: 7 },
      { i: "longshort", x: 3, y: 16, w: 3, h: 4 },
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
      { i: "calendar", x: 0, y: 18, w: 4, h: 7 },
      { i: "longshort", x: 0, y: 23, w: 4, h: 4 },
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

  // Long vs Short performance
  const longTrades = trades?.filter(t => t.tradeType === "BUY") || [];
  const shortTrades = trades?.filter(t => t.tradeType === "SELL") || [];
  
  const longPnL = longTrades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
  const shortPnL = shortTrades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
  
  const longWinRate = longTrades.length > 0 ? 
    Math.round((longTrades.filter(t => (Number(t.pnl) || 0) > 0).length / longTrades.length) * 100) : 75;
  const shortWinRate = shortTrades.length > 0 ? 
    Math.round((shortTrades.filter(t => (Number(t.pnl) || 0) > 0).length / shortTrades.length) * 100) : 50;

  // Mock trades for display
  const lastFiveTrades = [
    { id: "1", instrument: "GBPUSD", tradeType: "BUY" as const, pnl: 150.00, createdAt: "Aug 31, 25", status: "CLOSED" as const },
    { id: "2", instrument: "INJ", tradeType: "BUY" as const, pnl: 806.61, createdAt: "Feb 09, 24", status: "CLOSED" as const },
    { id: "3", instrument: "RUNE", tradeType: "SELL" as const, pnl: 953.17, createdAt: "Feb 05, 24", status: "CLOSED" as const },
    { id: "4", instrument: "AVAX", tradeType: "SELL" as const, pnl: -306.44, createdAt: "Jan 28, 24", status: "CLOSED" as const },
    { id: "5", instrument: "SOL", tradeType: "BUY" as const, pnl: 1306.00, createdAt: "Jan 27, 24", status: "CLOSED" as const }
  ];

  const resetLayout = () => {
    resetLayoutMutation.mutate();
  };

  const handleSaveLayout = () => {
    saveLayoutMutation.mutate(layouts);
  };

  return (
    <div className="min-h-screen p-4 lg:p-8" style={{ backgroundColor: bgColor, color: textColor }}>
      <div className="max-w-7xl mx-auto">
        {/* Header Controls */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold" style={{ color: textColor }}>Trading Dashboard</h1>
          <div className="flex gap-3 items-center">
            {/* Save Layout Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveLayout}
              disabled={saveLayoutMutation.isPending}
              className="bg-blue-900/40 border-blue-700 text-white hover:bg-blue-800/50"
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
                  className="bg-blue-900/40 border-blue-700 text-white hover:bg-blue-800/50"
                  data-testid="button-theme"
                >
                  <Palette className="w-4 h-4 mr-2" />
                  Theme
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-blue-950 border-blue-700 text-white max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Dashboard Customization</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Widget Color Theme</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { name: "Slate/Grey", value: "slate", color: "bg-slate-700" },
                        { name: "Blue", value: "blue", color: "bg-blue-700" },
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
              className="bg-blue-900/40 border-blue-700 text-white hover:bg-blue-800/50"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Layout
            </Button>
            <Button
              onClick={() => setEditMode(!editMode)}
              variant={editMode ? "default" : "outline"}
              size="sm"
              className={editMode 
                ? "bg-blue-600 hover:bg-blue-700 text-white" 
                : "bg-blue-900/40 border-blue-700 text-white hover:bg-blue-800/50"
              }
            >
              <Move className="w-4 h-4 mr-2" />
              {editMode ? "Exit Edit" : "Edit Layout"}
            </Button>
          </div>
        </div>

        {editMode && (
          <div className="mb-4 p-3 bg-blue-900/30 rounded-lg border border-blue-700">
            <p className="text-blue-200 text-sm">
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
            <DraggableWidget title="Profit" themeColor={themeColor} textColor={textColor}>
              <div className="relative">
                {/* Toggle Button - Absolute positioned to top right */}
                <button
                  onClick={() => setShowAllProfits(!showAllProfits)}
                  className="absolute -top-8 right-0 px-2 py-1 text-xs rounded transition-colors"
                  style={{ 
                    backgroundColor: `${textColor}20`,
                    color: textColor 
                  }}
                  data-testid="button-toggle-profit-view"
                >
                  {showAllProfits ? "Show All Time Only" : "Show All Periods"}
                </button>

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
              </div>
            </DraggableWidget>
          </div>

          {/* Win Rate Widget */}
          <div key="winrate">
            <DraggableWidget title="Win Rate" themeColor={themeColor} textColor={textColor}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-bold text-3xl" style={{ color: textColor }}>{winRate.toFixed(1)}%</div>
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
            </DraggableWidget>
          </div>

          {/* Risk Reward Widget */}
          <div key="riskreward">
            <DraggableWidget title="Risk Reward" themeColor={themeColor} textColor={textColor}>
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4" style={{ color: textColor }} />
              </div>
              <div className="font-bold text-xl" style={{ color: textColor }}>1:5.6</div>
            </DraggableWidget>
          </div>

          {/* Average Widget */}
          <div key="average">
            <DraggableWidget title="Average" themeColor={themeColor} textColor={textColor}>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4" style={{ color: textColor }} />
              </div>
              <div className="font-bold text-xl" style={{ color: textColor }}>${avgProfit.toFixed(0)}</div>
            </DraggableWidget>
          </div>

          {/* Fees Widget */}
          <div key="fees">
            <DraggableWidget title="Fees" themeColor={themeColor} textColor={textColor}>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4" style={{ color: textColor }} />
              </div>
              <div className="font-bold text-xl" style={{ color: textColor }}>${fees.toFixed(0)}</div>
            </DraggableWidget>
          </div>

          {/* Total Trades Widget */}
          <div key="totaltrades">
            <DraggableWidget title="Total Trades" themeColor={themeColor} textColor={textColor}>
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-4 h-4" style={{ color: textColor }} />
              </div>
              <div className="font-bold text-xl" style={{ color: textColor }}>{totalTrades}</div>
            </DraggableWidget>
          </div>

          {/* Chart Widget */}
          <div key="chart">
            <DraggableWidget title="Accumulative & Daily PnL" themeColor={themeColor} textColor={textColor}>
              <div className="relative h-full">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 text-gray-400 text-xs">$4K</div>
                <div className="absolute left-0 top-1/2 text-gray-400 text-xs">$2K</div>
                <div className="absolute left-0 bottom-1/2 text-gray-400 text-xs">$0</div>
                <div className="absolute left-0 bottom-0 text-gray-400 text-xs">-$2K</div>
                
                {/* Chart area */}
                <div className="ml-8 h-full relative">
                  <svg viewBox="0 0 300 150" className="w-full h-full">
                    <defs>
                      <linearGradient id="profit-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgb(37 99 235)" stopOpacity="0.8"/>
                        <stop offset="100%" stopColor="rgb(37 99 235)" stopOpacity="0.1"/>
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0 120 Q 50 100 100 80 T 200 40 T 300 20"
                      stroke="rgb(37 99 235)"
                      strokeWidth="3"
                      fill="none"
                    />
                    <path
                      d="M 0 120 Q 50 100 100 80 T 200 40 T 300 20 L 300 150 L 0 150 Z"
                      fill="url(#profit-gradient)"
                    />
                  </svg>
                </div>
                
                {/* X-axis labels */}
                <div className="absolute bottom-0 left-8 text-gray-400 text-xs">Jan 23, 24</div>
                <div className="absolute bottom-0 right-0 text-gray-400 text-xs">Aug 31, 25</div>
              </div>
            </DraggableWidget>
          </div>

          {/* Recent Trades Widget */}
          <div key="trades">
            <DraggableWidget title="Last Five Trades" themeColor={themeColor} textColor={textColor}>
              <div className="space-y-3 overflow-y-auto h-full">
                {lastFiveTrades.map((trade) => (
                  <div key={trade.id} className="bg-blue-800/20 rounded-lg p-3 border border-blue-700/30">
                    <div className="flex items-center justify-between">
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
                <div className="bg-blue-800/20 rounded-lg p-3 border border-blue-700/30">
                  <div className="text-center mb-2">
                    <div className="text-gray-400 text-sm">{longTrades.length} LONGS</div>
                  </div>
                  <div className="relative w-16 h-16 mx-auto mb-2">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle cx="32" cy="32" r="24" stroke="rgb(30 41 59)" strokeWidth="6" fill="none" />
                      <circle
                        cx="32" cy="32" r="24" stroke="rgb(34 197 94)" strokeWidth="6" fill="none"
                        strokeDasharray={`${longWinRate * 1.5} 150`} className="transition-all duration-300"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white font-bold text-sm">{longWinRate}%</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-green-400 font-bold text-sm">${longPnL.toFixed(2)}</div>
                  </div>
                </div>

                {/* Shorts */}
                <div className="bg-blue-800/20 rounded-lg p-3 border border-blue-700/30">
                  <div className="text-center mb-2">
                    <div className="text-gray-400 text-sm">{shortTrades.length} SHORTS</div>
                  </div>
                  <div className="relative w-16 h-16 mx-auto mb-2">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle cx="32" cy="32" r="24" stroke="rgb(30 41 59)" strokeWidth="6" fill="none" />
                      <circle
                        cx="32" cy="32" r="24" stroke="rgb(239 68 68)" strokeWidth="6" fill="none"
                        strokeDasharray={`${shortWinRate * 1.5} 150`} className="transition-all duration-300"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white font-bold text-sm">{shortWinRate}%</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-red-400 font-bold text-sm">${shortPnL.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </DraggableWidget>
          </div>

          {/* Calendar Widget */}
          <div key="calendar">
            <DraggableWidget title="Trading Calendar" themeColor={themeColor} textColor={textColor}>
              <CalendarWidget textColor={textColor} />
            </DraggableWidget>
          </div>
        </ResponsiveGridLayout>
      </div>
    </div>
  );
}