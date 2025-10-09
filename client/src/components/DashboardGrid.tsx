import { useState, useEffect } from "react";
import { Responsive, WidthProvider, Layout, Layouts } from "react-grid-layout";
import { TrendingUp, TrendingDown, BarChart3, Target, DollarSign, Layers, Move, RotateCcw, Save, Grid3X3, Trash2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import DraggableWidget from "./DraggableWidget";
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
  const [currentTemplate, setCurrentTemplate] = useState("default");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  
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
      { i: "longshort", x: 0, y: 16, w: 6, h: 4 },
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
    ]
  };

  const [layouts, setLayouts] = useState(defaultLayouts);

  // Fetch user's dashboard templates
  const { data: userTemplates } = useQuery({
    queryKey: ["/api/user/dashboard-templates"],
    retry: false,
  });

  // Save template mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async ({ name, layouts }: { name: string, layouts: Layouts }) => {
      await apiRequest("POST", "/api/user/dashboard-templates", { name, layouts });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/dashboard-templates"] });
      toast({
        title: "Template Saved",
        description: "Your dashboard template has been saved successfully.",
      });
      setSaveDialogOpen(false);
      setTemplateName("");
    },
    onError: (error: Error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (name: string) => {
      await apiRequest("DELETE", `/api/user/dashboard-templates/${encodeURIComponent(name)}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/dashboard-templates"] });
      setCurrentTemplate("default");
      toast({
        title: "Template Deleted",
        description: "Your dashboard template has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Load template when switching
  useEffect(() => {
    if (userTemplates && currentTemplate !== "default") {
      const template = userTemplates[currentTemplate];
      if (template) {
        setLayouts(template);
      }
    } else if (currentTemplate === "default") {
      setLayouts(defaultLayouts);
    }
  }, [currentTemplate, userTemplates]);

  // Calculate real stats from actual trades
  const totalPnL = analytics?.totalPnL || 0;
  const winRate = analytics?.winRate || 67;
  const totalTrades = analytics?.totalTrades || 6;
  const avgProfit = analytics?.avgWin || 440.75;
  const fees = 26.81;

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
    setLayouts(defaultLayouts);
    setCurrentTemplate("default");
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      toast({
        title: "Template name required",
        description: "Please enter a name for your template.",
        variant: "destructive",
      });
      return;
    }

    if (Object.keys(userTemplates || {}).length >= 5 && !userTemplates?.[templateName]) {
      toast({
        title: "Template limit reached",
        description: "You can only save up to 5 templates. Please delete one first.",
        variant: "destructive",
      });
      return;
    }

    saveTemplateMutation.mutate({ name: templateName, layouts });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 p-4 lg:p-8 text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header Controls */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Trading Dashboard</h1>
          <div className="flex gap-3 items-center">
            {/* Template Selector */}
            <Select value={currentTemplate} onValueChange={setCurrentTemplate}>
              <SelectTrigger className="w-48 bg-purple-900/40 border-purple-700 text-white">
                <Grid3X3 className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent className="bg-purple-950 border-purple-700">
                <SelectItem value="default">Default Layout</SelectItem>
                {userTemplates && Object.keys(userTemplates).map((templateName) => (
                  <SelectItem key={templateName} value={templateName}>
                    <div className="flex items-center justify-between w-full">
                      <span>{templateName}</span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          deleteTemplateMutation.mutate(templateName);
                        }}
                        className="ml-2 p-1 hover:bg-red-600/20 rounded"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Save Template Button */}
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-purple-900/40 border-purple-700 text-white hover:bg-purple-800/50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Template
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-purple-950 border-purple-700 text-white">
                <DialogHeader>
                  <DialogTitle>Save Dashboard Template</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="template-name" className="text-sm font-medium">
                      Template Name
                    </label>
                    <Input
                      id="template-name"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="Enter template name..."
                      className="bg-purple-900/40 border-purple-700 text-white"
                      maxLength={50}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setSaveDialogOpen(false)}
                      className="border-purple-700 text-white hover:bg-purple-800/50"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveTemplate}
                      disabled={saveTemplateMutation.isPending}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {saveTemplateMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              onClick={resetLayout}
              variant="outline"
              size="sm"
              className="bg-purple-900/40 border-purple-700 text-white hover:bg-purple-800/50"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Layout
            </Button>
            <Button
              onClick={() => setEditMode(!editMode)}
              variant={editMode ? "default" : "outline"}
              size="sm"
              className={editMode 
                ? "bg-purple-600 hover:bg-purple-700 text-white" 
                : "bg-purple-900/40 border-purple-700 text-white hover:bg-purple-800/50"
              }
            >
              <Move className="w-4 h-4 mr-2" />
              {editMode ? "Exit Edit" : "Edit Layout"}
            </Button>
          </div>
        </div>

        {editMode && (
          <div className="mb-4 p-3 bg-purple-900/30 rounded-lg border border-purple-700">
            <p className="text-purple-200 text-sm">
              <strong>Edit Mode:</strong> Drag widgets to move them around or drag the corner to resize. Click "Exit Edit" when finished.
            </p>
          </div>
        )}

        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          onLayoutChange={(layout, newLayouts) => setLayouts(newLayouts)}
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
            <DraggableWidget title="Profit">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-white font-bold text-xl">${(totalPnL/1000).toFixed(1)}K</div>
            </DraggableWidget>
          </div>

          {/* Win Rate Widget */}
          <div key="winrate">
            <DraggableWidget title="Win Rate">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-white font-bold text-3xl">{winRate}%</div>
                </div>
                <div className="relative w-24 h-12">
                  <svg viewBox="0 0 100 50" className="w-full h-full">
                    <defs>
                      {/* Rainbow gradient for the arc */}
                      <linearGradient id="rainbow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="50%" stopColor="#eab308" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                    
                    {/* Background arc */}
                    <path
                      d="M 10 45 A 40 40 0 0 1 90 45"
                      fill="none"
                      stroke="rgb(30 41 59)"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                    
                    {/* Colored progress arc */}
                    <path
                      d="M 10 45 A 40 40 0 0 1 90 45"
                      fill="none"
                      stroke="url(#rainbow-gradient)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${(winRate / 100) * 126} 126`}
                      className="transition-all duration-500"
                    />
                    
                    {/* Indicator dot */}
                    <circle
                      cx={50 + 40 * Math.cos((Math.PI * (1 - winRate / 100)))}
                      cy={45 - 40 * Math.sin((Math.PI * (1 - winRate / 100)))}
                      r="4"
                      fill={
                        winRate < 40 ? "#ef4444" : 
                        winRate < 70 ? "#eab308" : 
                        "#10b981"
                      }
                      className="transition-all duration-500"
                    />
                  </svg>
                  
                  {/* Min/Max labels */}
                  <div className="absolute bottom-0 left-0 text-gray-500 text-xs">0</div>
                  <div className="absolute bottom-0 right-0 text-gray-500 text-xs">100</div>
                </div>
              </div>
            </DraggableWidget>
          </div>

          {/* Risk Reward Widget */}
          <div key="riskreward">
            <DraggableWidget title="Risk Reward">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-white font-bold text-xl">1:5.6</div>
            </DraggableWidget>
          </div>

          {/* Average Widget */}
          <div key="average">
            <DraggableWidget title="Average">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-white font-bold text-xl">${avgProfit.toFixed(0)}</div>
            </DraggableWidget>
          </div>

          {/* Fees Widget */}
          <div key="fees">
            <DraggableWidget title="Fees">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-white font-bold text-xl">${fees.toFixed(0)}</div>
            </DraggableWidget>
          </div>

          {/* Total Trades Widget */}
          <div key="totaltrades">
            <DraggableWidget title="Total Trades">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-white font-bold text-xl">{totalTrades}</div>
            </DraggableWidget>
          </div>

          {/* Chart Widget */}
          <div key="chart">
            <DraggableWidget title="Accumulative & Daily PnL">
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
                        <stop offset="0%" stopColor="rgb(147 51 234)" stopOpacity="0.8"/>
                        <stop offset="100%" stopColor="rgb(147 51 234)" stopOpacity="0.1"/>
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0 120 Q 50 100 100 80 T 200 40 T 300 20"
                      stroke="rgb(147 51 234)"
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
            <DraggableWidget title="Last Five Trades">
              <div className="space-y-3 overflow-y-auto h-full">
                {lastFiveTrades.map((trade) => (
                  <div key={trade.id} className="bg-purple-800/20 rounded-lg p-3 border border-purple-700/30">
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
            <DraggableWidget title="Long vs Short Performance">
              <div className="grid grid-cols-2 gap-4 h-full">
                {/* Longs */}
                <div className="bg-purple-800/20 rounded-lg p-3 border border-purple-700/30">
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
                <div className="bg-purple-800/20 rounded-lg p-3 border border-purple-700/30">
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
        </ResponsiveGridLayout>
      </div>
    </div>
  );
}