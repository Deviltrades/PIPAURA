import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Plus, Edit3, Check, X, Settings } from "lucide-react";
import logoImage from "@assets/btrustedprops_1758388648347.jpg";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  parseISO,
  addMonths,
  subMonths,
  isToday,
  addDays
} from "date-fns";
import { AddTradeModal } from "./AddTradeModal";
import { EditTradeModal } from "./EditTradeModal";
import { SignedImageDisplay } from "./SignedImageDisplay";
import { ImageViewerModal } from "./ImageViewerModal";
import { PlanGate } from "./PlanGate";
import type { Trade, User } from "@shared/schema";
import { Plus as PlusIcon } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getTrades, updateTrade, uploadFile } from "@/lib/supabase-service";

interface TradingCalendarProps {
  className?: string;
}

export function TradingCalendar({ className }: TradingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMonth, setViewMonth] = useState<Date>(new Date());
  const [isAddTradeModalOpen, setIsAddTradeModalOpen] = useState(false);
  const [addTradeDate, setAddTradeDate] = useState<Date | null>(null);
  const [isEditTradeModalOpen, setIsEditTradeModalOpen] = useState(false);
  const [editTrade, setEditTrade] = useState<Trade | null>(null);
  
  // Image viewer state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  
  // Inline edit state
  const [editingTrade, setEditingTrade] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation for updating trade fields
  const updateTradeMutation = useMutation({
    mutationFn: async ({ tradeId, updates }: { tradeId: string; updates: Partial<Trade> }) => {
      return await updateTrade(tradeId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      toast({
        title: "Trade updated",
        description: "Your changes have been saved successfully.",
      });
      setEditingTrade(null);
      setEditingField(null);
      setEditValue('');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update trade. Please try again.",
        variant: "destructive",
      });
      console.error("Error updating trade:", error);
    },
  });

  // Helper functions for inline editing
  const startEdit = (tradeId: string, field: string, currentValue: string) => {
    setEditingTrade(tradeId);
    setEditingField(field);
    setEditValue(currentValue || '');
  };

  const cancelEdit = () => {
    setEditingTrade(null);
    setEditingField(null);
    setEditValue('');
  };

  const saveEdit = () => {
    if (!editingTrade || !editingField) return;
    
    const updates: Record<string, any> = {
      [editingField]: editValue
    };
    
    updateTradeMutation.mutate({ tradeId: editingTrade, updates });
  };

  const isEditing = (tradeId: string, field: string) => {
    return editingTrade === tradeId && editingField === field;
  };

  // Image upload handler
  const handleImageUpload = async (tradeId: string, files: File[]) => {
    try {
      const uploadedUrls: string[] = [];

      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Invalid file type",
            description: "Please upload only image files (JPG, PNG, GIF, etc.)",
            variant: "destructive",
          });
          continue;
        }

        // Upload directly to Supabase storage
        const fileUrl = await uploadFile(file);
        uploadedUrls.push(fileUrl);
      }

      if (uploadedUrls.length > 0) {
        // Get current trade data
        const allTrades = Object.values(tradesByDate).flat();
        const currentTrade = allTrades.find((t: Trade) => t.id === tradeId);
        if (!currentTrade) return;

        // Update trade with new attachments
        const updatedAttachments = [...(currentTrade.attachments || []), ...uploadedUrls];
        
        updateTradeMutation.mutate({
          tradeId,
          updates: { attachments: updatedAttachments }
        });

        toast({
          title: "Images uploaded",
          description: `Successfully added ${uploadedUrls.length} image(s) to the trade.`,
        });
      }

    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload images. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Filter states
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [selectedSymbol, setSelectedSymbol] = useState<string>("all");
  const [selectedStrategy, setSelectedStrategy] = useState<string>("all");
  const [selectedDirection, setSelectedDirection] = useState<string>("all");
  
  // Display mode state
  const [displayMode, setDisplayMode] = useState<"percentage" | "dollar">("percentage");
  
  // Weekend toggle state
  const [showWeekends, setShowWeekends] = useState(false);
  
  // Weekly totals toggle state
  const [showWeeklyTotals, setShowWeeklyTotals] = useState(false);
  
  // Monthly summary toggle state
  const [showMonthlySummary, setShowMonthlySummary] = useState(false);
  
  // Monthly stats visibility settings
  const [monthlyStatsConfig, setMonthlyStatsConfig] = useState({
    riskReward: true,
    totalPnL: true,
    daysTraded: true,
    totalTrades: false,
    winRate: false
  });
  
  // Consistency tracker toggle state
  const [showConsistencyTracker, setShowConsistencyTracker] = useState(false);
  
  // Clear view toggle state - hides filters and toggles for clean calendar view
  const [clearView, setClearView] = useState(false);

  // Fetch all trades
  const { data: trades = [], isLoading } = useQuery<Trade[]>({
    queryKey: ["trades"],
    queryFn: getTrades,
    retry: false,
  });

  // Fetch user data for calendar settings
  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    staleTime: 0, // Always refetch to get latest calendar settings
  });

  // Apply filters to trades
  const filteredTrades = trades ? trades.filter(trade => {
    // Account filter
    if (selectedAccount !== "all") {
      // For now, we'll use a simple mapping since we don't have account field in trades
      // This can be enhanced when account field is added to the trade schema
      const accountMap: Record<string, boolean> = {
        "main": true,
        "demo": false,
        "prop": trade.instrument?.includes("USD") || false
      };
      if (selectedAccount === "main" && !accountMap.main) return false;
      if (selectedAccount === "demo" && !accountMap.demo) return false;
      if (selectedAccount === "prop" && !accountMap.prop) return false;
    }

    // Symbol filter
    if (selectedSymbol !== "all") {
      if (selectedSymbol === "forex" && trade.instrument_type !== "FOREX") return false;
      if (selectedSymbol === "indices" && trade.instrument_type !== "INDICES") return false;
      if (selectedSymbol === "crypto" && trade.instrument_type !== "CRYPTO") return false;
    }

    // Strategy filter - for now using simple heuristics based on trade data
    if (selectedStrategy !== "all") {
      // This is a placeholder implementation - can be enhanced with actual strategy field
      const pnl = typeof trade.pnl === 'string' ? parseFloat(trade.pnl) : (trade.pnl || 0);
      const entryPrice = typeof trade.entry_price === 'string' ? parseFloat(trade.entry_price) : trade.entry_price;
      const stopLoss = typeof trade.stop_loss === 'string' ? parseFloat(trade.stop_loss) : trade.stop_loss;
      
      if (selectedStrategy === "scalping") {
        // Small profit targets, quick trades
        if (Math.abs(pnl) > 500) return false;
      }
      if (selectedStrategy === "swing") {
        // Larger position, bigger P&L
        if (Math.abs(pnl) < 200) return false;
      }
      if (selectedStrategy === "breakout") {
        // Assume breakout if entry is far from stop loss
        if (stopLoss && Math.abs(entryPrice - stopLoss) < 50) return false;
      }
      if (selectedStrategy === "reversal") {
        // Opposite logic of breakout
        if (stopLoss && Math.abs(entryPrice - stopLoss) > 100) return false;
      }
    }

    // Direction filter
    if (selectedDirection !== "all") {
      if (selectedDirection === "buy" && trade.trade_type !== "BUY") return false;
      if (selectedDirection === "sell" && trade.trade_type !== "SELL") return false;
    }

    return true;
  }) : [];


  // Group filtered trades by date
  const tradesByDate = filteredTrades ? filteredTrades.reduce((acc, trade) => {
    if (trade.entry_date) {
      // Handle different date formats
      let entryDate: Date;
      if (typeof trade.entry_date === 'string') {
        // Try parsing ISO string first, then fallback to Date constructor
        const dateString = trade.entry_date as string;
        entryDate = dateString.indexOf('T') !== -1 ? parseISO(dateString) : new Date(dateString);
      } else {
        entryDate = new Date(trade.entry_date);
      }
      
      const dateKey = format(entryDate, "yyyy-MM-dd");
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(trade);
    }
    return acc;
  }, {} as Record<string, Trade[]>) : {};

  // Get filtered trades for selected date
  const selectedDateTrades = selectedDate 
    ? tradesByDate[format(selectedDate, "yyyy-MM-dd")] || []
    : [];

  // Calculate daily P&L for a date
  const getDailyPnL = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    const dayTrades = tradesByDate[dateKey] || [];
    return dayTrades.reduce((total, trade) => {
      const pnl = typeof trade.pnl === 'string' ? parseFloat(trade.pnl) : (trade.pnl || 0);
      return total + pnl;
    }, 0);
  };

  // Calculate weekly totals for the month
  // Get monthly statistics for the current month
  const getMonthlySummary = () => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    
    // Get trades for the current month
    const monthTrades = filteredTrades.filter(trade => {
      if (!trade.entry_date) return false;
      
      let entryDate: Date;
      if (typeof trade.entry_date === 'string') {
        const dateString = trade.entry_date as string;
        entryDate = dateString.indexOf('T') !== -1 ? parseISO(dateString) : new Date(dateString);
      } else {
        entryDate = new Date(trade.entry_date);
      }
      
      return entryDate >= monthStart && entryDate <= monthEnd;
    });
    
    // Calculate total P&L
    const totalPnL = monthTrades.reduce((sum, trade) => {
      const pnl = typeof trade.pnl === 'string' ? parseFloat(trade.pnl) : (trade.pnl || 0);
      return sum + pnl;
    }, 0);
    
    // Calculate total days traded (unique dates)
    const uniqueDates = new Set();
    monthTrades.forEach(trade => {
      if (trade.entry_date) {
        let entryDate: Date;
        if (typeof trade.entry_date === 'string') {
          const dateString = trade.entry_date as string;
          entryDate = dateString.indexOf('T') !== -1 ? parseISO(dateString) : new Date(dateString);
        } else {
          entryDate = new Date(trade.entry_date);
        }
        uniqueDates.add(format(entryDate, "yyyy-MM-dd"));
      }
    });
    
    // Calculate risk/reward ratio
    const winningTrades = monthTrades.filter(trade => {
      const pnl = typeof trade.pnl === 'string' ? parseFloat(trade.pnl) : (trade.pnl || 0);
      return pnl > 0;
    });
    
    const losingTrades = monthTrades.filter(trade => {
      const pnl = typeof trade.pnl === 'string' ? parseFloat(trade.pnl) : (trade.pnl || 0);
      return pnl < 0;
    });
    
    const avgWin = winningTrades.length > 0 
      ? winningTrades.reduce((sum, trade) => {
          const pnl = typeof trade.pnl === 'string' ? parseFloat(trade.pnl) : (trade.pnl || 0);
          return sum + pnl;
        }, 0) / winningTrades.length 
      : 0;
      
    const avgLoss = losingTrades.length > 0 
      ? Math.abs(losingTrades.reduce((sum, trade) => {
          const pnl = typeof trade.pnl === 'string' ? parseFloat(trade.pnl) : (trade.pnl || 0);
          return sum + pnl;
        }, 0)) / losingTrades.length 
      : 0;
    
    const riskRewardRatio = avgLoss > 0 ? (avgWin / avgLoss) : 0;
    
    // Calculate win rate
    const winRate = monthTrades.length > 0 ? (winningTrades.length / monthTrades.length) * 100 : 0;
    
    return {
      totalPnL,
      daysTraded: uniqueDates.size,
      riskRewardRatio,
      totalTrades: monthTrades.length,
      winRate
    };
  };

  // Get consistency score for the current month
  const getConsistencyScore = () => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    
    // Get trades for the current month
    const monthTrades = filteredTrades.filter(trade => {
      if (!trade.entry_date) return false;
      
      let entryDate: Date;
      if (typeof trade.entry_date === 'string') {
        const dateString = trade.entry_date as string;
        entryDate = dateString.indexOf('T') !== -1 ? parseISO(dateString) : new Date(dateString);
      } else {
        entryDate = new Date(trade.entry_date);
      }
      
      return entryDate >= monthStart && entryDate <= monthEnd;
    });
    
    if (monthTrades.length === 0) return { score: 0, rating: "No Data" };
    
    // Calculate trading frequency consistency (0-40 points)
    const totalDaysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd }).length;
    const tradingDays = new Set();
    monthTrades.forEach(trade => {
      if (trade.entry_date) {
        let entryDate: Date;
        if (typeof trade.entry_date === 'string') {
          const dateString = trade.entry_date as string;
          entryDate = dateString.indexOf('T') !== -1 ? parseISO(dateString) : new Date(dateString);
        } else {
          entryDate = new Date(trade.entry_date);
        }
        tradingDays.add(format(entryDate, "yyyy-MM-dd"));
      }
    });
    
    const tradingFrequency = (tradingDays.size / totalDaysInMonth) * 40;
    
    // Calculate trade size consistency (0-30 points)
    const tradeSizes = monthTrades.map(trade => {
      const pnl = Math.abs(typeof trade.pnl === 'string' ? parseFloat(trade.pnl) : (trade.pnl || 0));
      return pnl;
    }).filter(size => size > 0);
    
    let sizeConsistency = 0;
    if (tradeSizes.length > 1) {
      const avgSize = tradeSizes.reduce((sum, size) => sum + size, 0) / tradeSizes.length;
      const variance = tradeSizes.reduce((sum, size) => sum + Math.pow(size - avgSize, 2), 0) / tradeSizes.length;
      const standardDeviation = Math.sqrt(variance);
      const coefficientOfVariation = avgSize > 0 ? standardDeviation / avgSize : 1;
      sizeConsistency = Math.max(0, 30 * (1 - coefficientOfVariation));
    } else if (tradeSizes.length === 1) {
      sizeConsistency = 30; // Perfect consistency with one trade
    }
    
    // Calculate win rate consistency (0-30 points)
    const winningTrades = monthTrades.filter(trade => {
      const pnl = typeof trade.pnl === 'string' ? parseFloat(trade.pnl) : (trade.pnl || 0);
      return pnl > 0;
    });
    
    const winRate = winningTrades.length / monthTrades.length;
    let winRateConsistency = 0;
    
    // Award points based on win rate - higher is better
    if (winRate >= 0.7) winRateConsistency = 30;
    else if (winRate >= 0.5) winRateConsistency = 25;
    else if (winRate >= 0.4) winRateConsistency = 20;
    else if (winRate >= 0.3) winRateConsistency = 15;
    else winRateConsistency = 10;
    
    const totalScore = Math.min(100, Math.round(tradingFrequency + sizeConsistency + winRateConsistency));
    
    let rating = "Poor";
    if (totalScore >= 80) rating = "Excellent";
    else if (totalScore >= 60) rating = "Good";
    else if (totalScore >= 40) rating = "Fair";
    
    return { score: totalScore, rating };
  };

  const getWeeklyTotals = () => {
    const start = startOfWeek(startOfMonth(viewMonth));
    const end = endOfWeek(endOfMonth(viewMonth));
    const allDays = eachDayOfInterval({ start, end });
    
    const weeks: { pnl: number; tradeCount: number; weekNumber: number }[] = [];
    let currentWeek = { pnl: 0, tradeCount: 0, weekNumber: 1 };
    
    allDays.forEach((day, index) => {
      const dateKey = format(day, "yyyy-MM-dd");
      const dayTrades = tradesByDate[dateKey] || [];
      
      // Add to current week totals
      dayTrades.forEach(trade => {
        const pnl = typeof trade.pnl === 'string' ? parseFloat(trade.pnl) : (trade.pnl || 0);
        currentWeek.pnl += pnl;
        currentWeek.tradeCount += 1;
      });
      
      // Check if we've reached the end of a week (Saturday) or end of days
      const isLastDay = index === allDays.length - 1;
      const isSaturday = day.getDay() === 6;
      
      if (isSaturday || isLastDay) {
        weeks.push({ ...currentWeek });
        currentWeek = { 
          pnl: 0, 
          tradeCount: 0, 
          weekNumber: currentWeek.weekNumber + 1 
        };
      }
    });
    
    return weeks;
  };

  // Layout configuration based on weekend toggle
  const layout = showWeekends ? {
    cols: 7,
    dayLabels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    cellClass: 'h-20 sm:h-24',
    cellStyle: {}
  } : {
    cols: 5,
    dayLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    cellClass: 'h-20 sm:h-24',
    cellStyle: {}
  };

  // Generate calendar days based on weekend toggle
  const generateCalendarDays = () => {
    const start = startOfWeek(startOfMonth(viewMonth));
    const end = endOfWeek(endOfMonth(viewMonth));
    
    if (showWeekends) {
      // Show full weeks
      return eachDayOfInterval({ start, end });
    } else {
      // Show only weekdays (Monday-Friday)
      const allDays = eachDayOfInterval({ start, end });
      return allDays.filter(day => {
        const dayOfWeek = day.getDay();
        return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday (1) to Friday (5)
      });
    }
  };

  const calendarDays = generateCalendarDays();

  const navigateMonth = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setViewMonth(subMonths(viewMonth, 1));
    } else {
      setViewMonth(addMonths(viewMonth, 1));
    }
  };

  const handleMonthChange = (value: string) => {
    const newMonth = parseInt(value);
    setViewMonth(new Date(viewMonth.getFullYear(), newMonth, 1));
  };

  const handleYearChange = (value: string) => {
    const newYear = parseInt(value);
    setViewMonth(new Date(newYear, viewMonth.getMonth(), 1));
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
            <div className="h-80 bg-gray-200 dark:bg-gray-800 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} bg-background border`}>
      <CardContent className="p-3 sm:p-6">
        {/* Header with Month Navigation and Display Mode Toggle */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-4">
            {/* Clear View Toggle */}
            <Button
              variant={clearView ? "default" : "outline"}
              size="sm"
              onClick={() => setClearView(!clearView)}
              className="text-xs"
              data-testid="button-clear-view"
            >
              Clear View
            </Button>
            
            <div className="flex items-center gap-2">
              <Select 
                value={viewMonth.getMonth().toString()} 
                onValueChange={handleMonthChange}
              >
                <SelectTrigger className="w-[120px] h-9" data-testid="select-month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((name, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select 
                value={viewMonth.getFullYear().toString()} 
                onValueChange={handleYearChange}
              >
                <SelectTrigger className="w-[90px] h-9" data-testid="select-year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!clearView && (
              <>
                <Select value={displayMode} onValueChange={(value: "percentage" | "dollar") => setDisplayMode(value)}>
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">%</SelectItem>
                    <SelectItem value="dollar">$</SelectItem>
                  </SelectContent>
                </Select>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9" data-testid="button-optionals">
                      Optionals
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56" align="start">
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm mb-3">Display Options</h4>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="weekends-check"
                          checked={showWeekends} 
                          onCheckedChange={(checked) => setShowWeekends(checked === true)}
                          data-testid="checkbox-weekends"
                        />
                        <Label htmlFor="weekends-check" className="text-sm font-normal cursor-pointer">
                          Weekends
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="weekly-totals-check"
                          checked={showWeeklyTotals} 
                          onCheckedChange={(checked) => setShowWeeklyTotals(checked === true)}
                          data-testid="checkbox-weekly-totals"
                        />
                        <Label htmlFor="weekly-totals-check" className="text-sm font-normal cursor-pointer">
                          Weekly Totals
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="monthly-stats-check"
                          checked={showMonthlySummary} 
                          onCheckedChange={(checked) => setShowMonthlySummary(checked === true)}
                          data-testid="checkbox-monthly-stats"
                        />
                        <Label htmlFor="monthly-stats-check" className="text-sm font-normal cursor-pointer">
                          Monthly Stats
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="consistency-check"
                          checked={showConsistencyTracker} 
                          onCheckedChange={(checked) => setShowConsistencyTracker(checked === true)}
                          data-testid="checkbox-consistency"
                        />
                        <Label htmlFor="consistency-check" className="text-sm font-normal cursor-pointer">
                          Consistency
                        </Label>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link href="/calendar-settings">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-muted"
                title="Calendar Settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth("prev")}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth("next")}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filter Controls */}
        {!clearView && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 sm:mb-6">
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger className="h-9 text-xs sm:text-sm">
                <SelectValue placeholder="All Accounts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                <SelectItem value="main">Main Account</SelectItem>
                <SelectItem value="demo">Demo Account</SelectItem>
                <SelectItem value="prop">Prop Firm</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
              <SelectTrigger className="h-9 text-xs sm:text-sm">
                <SelectValue placeholder="All Symbols" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Symbols</SelectItem>
                <SelectItem value="forex">Forex</SelectItem>
                <SelectItem value="indices">Indices</SelectItem>
                <SelectItem value="crypto">Crypto</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
              <SelectTrigger className="h-9 text-xs sm:text-sm">
                <SelectValue placeholder="All Strategies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Strategies</SelectItem>
                <SelectItem value="scalping">Scalping</SelectItem>
                <SelectItem value="swing">Swing Trading</SelectItem>
                <SelectItem value="breakout">Breakout</SelectItem>
                <SelectItem value="reversal">Reversal</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedDirection} onValueChange={setSelectedDirection}>
              <SelectTrigger className="h-9 text-xs sm:text-sm">
                <SelectValue placeholder="All Directions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Directions</SelectItem>
                <SelectItem value="buy">Buy Only</SelectItem>
                <SelectItem value="sell">Sell Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Monthly Summary Bar */}
        {showMonthlySummary && (
          <div className="mb-4 sm:mb-6 bg-slate-800 rounded-lg px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-white text-sm font-medium">Monthly stats:</span>
              </div>
              
              {(() => {
                const monthlyStats = getMonthlySummary();
                return (
                  <div className="flex items-center gap-4 text-white">
                    {/* Total Net P&L */}
                    {monthlyStatsConfig.totalPnL && (
                      <div className={`px-3 py-2 rounded-md text-sm font-semibold ${
                        monthlyStats.totalPnL >= 0 ? 'bg-green-600' : 'bg-red-600'
                      }`}>
                        {monthlyStats.totalPnL >= 0 ? '+' : ''}${monthlyStats.totalPnL.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </div>
                    )}
                    
                    {/* Total Days Traded */}
                    {monthlyStatsConfig.daysTraded && (
                      <div className="text-sm">
                        <span className="font-semibold">{monthlyStats.daysTraded}</span> days
                      </div>
                    )}
                    
                    {/* Risk/Reward Ratio */}
                    {monthlyStatsConfig.riskReward && (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                          <span className="text-xs">R</span>
                        </div>
                        <span className="text-sm">
                          {monthlyStats.riskRewardRatio > 0 ? monthlyStats.riskRewardRatio.toFixed(2) : '0.00'}
                        </span>
                      </div>
                    )}

                    {/* Total Trades */}
                    {monthlyStatsConfig.totalTrades && (
                      <div className="text-sm">
                        <span className="font-semibold">{monthlyStats.totalTrades}</span> trades
                      </div>
                    )}

                    {/* Win Rate */}
                    {monthlyStatsConfig.winRate && (
                      <div className="text-sm">
                        <span className="font-semibold">{monthlyStats.winRate.toFixed(1)}%</span> win rate
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Settings Cog */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-white hover:bg-slate-700"
                  data-testid="button-monthly-stats-settings"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 bg-slate-900 border-slate-700">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-white mb-3">Select which stats to display</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="pnl-stat"
                        checked={monthlyStatsConfig.totalPnL}
                        onCheckedChange={(checked) => 
                          setMonthlyStatsConfig(prev => ({ ...prev, totalPnL: checked as boolean }))
                        }
                        data-testid="checkbox-total-pnl"
                      />
                      <Label htmlFor="pnl-stat" className="text-sm text-white">
                        Daily P/L
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="days-stat"
                        checked={monthlyStatsConfig.daysTraded}
                        onCheckedChange={(checked) => 
                          setMonthlyStatsConfig(prev => ({ ...prev, daysTraded: checked as boolean }))
                        }
                        data-testid="checkbox-days-traded"
                      />
                      <Label htmlFor="days-stat" className="text-sm text-white">
                        Days Traded
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="risk-reward-stat"
                        checked={monthlyStatsConfig.riskReward}
                        onCheckedChange={(checked) => 
                          setMonthlyStatsConfig(prev => ({ ...prev, riskReward: checked as boolean }))
                        }
                        data-testid="checkbox-risk-reward"
                      />
                      <Label htmlFor="risk-reward-stat" className="text-sm text-white">
                        R Multiple
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="total-trades-stat"
                        checked={monthlyStatsConfig.totalTrades}
                        onCheckedChange={(checked) => 
                          setMonthlyStatsConfig(prev => ({ ...prev, totalTrades: checked as boolean }))
                        }
                        data-testid="checkbox-total-trades"
                      />
                      <Label htmlFor="total-trades-stat" className="text-sm text-white">
                        Number of trades
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="win-rate-stat"
                        checked={monthlyStatsConfig.winRate}
                        onCheckedChange={(checked) => 
                          setMonthlyStatsConfig(prev => ({ ...prev, winRate: checked as boolean }))
                        }
                        data-testid="checkbox-win-rate"
                      />
                      <Label htmlFor="win-rate-stat" className="text-sm text-white">
                        Day Winrate
                      </Label>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* Consistency Tracker Bar */}
        {showConsistencyTracker && (() => {
          const { score, rating } = getConsistencyScore();
          const barColor = score < 30 ? '#ef4444' : score < 60 ? '#f97316' : '#22c55e';
          const ratingColor = score < 30 ? 'text-red-400' : score < 60 ? 'text-orange-400' : 'text-green-400';
          
          return (
            <div className="mb-4 sm:mb-6 bg-slate-800 rounded-lg px-4 py-3">
              {/* Main Bar Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-white text-sm font-medium">Consistency:</span>
                  <div className="relative">
                    <div className="relative w-40 sm:w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="absolute left-0 top-0 h-full rounded-full transition-all duration-500 ease-out" 
                        style={{ width: `${score}%`, backgroundColor: barColor }}
                        data-testid="consistency-progress-bar"
                      />
                    </div>
                    {/* Scale Legend - Centered below the progress bar */}
                    <div className="flex items-center justify-center gap-4 mt-2 text-xs text-gray-300">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span>0 - 30%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span>30 - 60%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>60 - 100%</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-semibold">{score}%</span>
                  <span className={`text-xs font-medium ${ratingColor}`}>{rating}</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Calendar Container */}
        <div className={`flex ${showWeeklyTotals ? 'gap-4' : ''}`}>
          {/* Main Calendar */}
          <div className="flex-1">
            {/* Days of Week Header */}
            <div className={`grid ${showWeekends ? 'grid-cols-7' : 'grid-cols-5'} gap-0 sm:gap-0.5 mb-2`} data-testid="grid-calendar">
              {layout.dayLabels.map((day) => (
                <div key={day} className="h-8 sm:h-10 flex items-center justify-center" data-testid={`header-day-${day.toLowerCase()}`}>
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground">{day}</span>
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className={`grid ${showWeekends ? 'grid-cols-7' : 'grid-cols-5'} gap-0 sm:gap-0.5`}>
          {calendarDays.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayTrades = tradesByDate[dateKey] || [];
            const dailyPnL = getDailyPnL(day);
            const isCurrentMonth = isSameMonth(day, viewMonth);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentDay = isToday(day);

            
            // Get calendar settings with proper typing
            const calendar_settings = (user?.calendar_settings as any) || {
              backgroundColor: "#1a1a1a",
              borderColor: "#374151",
              dayBackgroundColor: "#2d2d2d",
              dayBorderColor: "#4b5563"
            };

            // Calculate daily percentage return
            const calculateDailyReturn = () => {
              if (dayTrades.length === 0) return null;
              // Simple percentage calculation - could be enhanced with actual account balance
              const totalPnL = dailyPnL;
              const percentage = Math.abs(totalPnL / 1000 * 100); // Assuming base of $1000 for percentage
              return percentage;
            };

            const dailyReturn = calculateDailyReturn();

            // Get styling based on P&L
            const getDayStyles = () => {
              if (dayTrades.length === 0) {
                return {
                  backgroundColor: '#1a1a1a',
                  borderColor: '#374151',
                  textColor: 'text-white',
                  boxShadow: 'none'
                };
              }
              if (dailyPnL > 0) {
                return {
                  backgroundColor: '#00cc66', // Toned down bright green (20% less bright)
                  borderColor: '#00cc66',
                  textColor: 'text-black',
                  boxShadow: '0 0 12px #00cc66' // Slightly reduced glow
                };
              }
              return {
                backgroundColor: '#e55555', // Toned down bright red (20% less bright)
                borderColor: '#e55555',
                textColor: 'text-black',
                boxShadow: 'none'
              };
            };

            const dayStyles = getDayStyles();

            return (
              <div
                key={day.toISOString()}
                className={`
                  ${layout.cellClass} border-2 rounded-xl transition-all duration-200
                  ${isSelected ? 'ring-2 ring-blue-400' : ''}
                  ${isCurrentDay ? 'ring-1 ring-blue-300' : ''}
                  ${!isCurrentMonth ? 'opacity-40' : ''}
                  ${dayTrades.length > 0 ? 'brightness-125 saturate-150' : ''}
                  relative group cursor-pointer overflow-hidden
                `}
                style={{
                  ...layout.cellStyle,
                  backgroundColor: dayStyles.backgroundColor,
                  borderColor: dayStyles.borderColor,
                  boxShadow: dayStyles.boxShadow
                }}
                data-testid={`cell-day-${format(day, 'yyyy-MM-dd')}`}
                onClick={() => setSelectedDate(day)}
              >
                {/* Dark Blue Triangle - Top Right - Only show on trading days */}
                {dayTrades.length > 0 && (
                  <div 
                    className="absolute top-0 right-0"
                    style={{
                      width: 0,
                      height: 0,
                      borderStyle: 'solid',
                      borderWidth: '0 34px 34px 0',
                      borderColor: 'transparent #1e3a8a transparent transparent'
                    }}
                  />
                )}
                
                {/* Success/Failure Icon - Inside Triangle */}
                {dayTrades.length > 0 && (
                  <div className="absolute top-1 right-1">
                    {dailyPnL > 0 ? (
                      <Check className="h-4 w-4 text-white" />
                    ) : (
                      <X className="h-4 w-4 text-white" />
                    )}
                  </div>
                )}
                
                {/* Date - Top Left */}
                <div className="absolute top-1 left-1.5">
                  <span className={`text-sm font-semibold ${
                    dayTrades.length > 0 ? 'text-black' : 'text-white'
                  }`}>
                    {format(day, 'd')}
                  </span>
                </div>
                
                {/* Add Trade Button - Only show on hover for empty days */}
                {dayTrades.length === 0 && isCurrentMonth && (
                  <PlanGate 
                    action="add-trade" 
                    buttonId="add-trade"
                    showUpgrade={false}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAddTradeDate(day);
                        setIsAddTradeModalOpen(true);
                      }}
                      className="absolute top-1 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-4 h-4 bg-gray-600 hover:bg-gray-700 rounded-full flex items-center justify-center z-10"
                      title="Add trade for this date"
                      data-testid="button-add-trade"
                    >
                      <PlusIcon className="h-2.5 w-2.5 text-white" />
                    </button>
                  </PlanGate>
                )}
                
                {/* Trading Day Content */}
                {dayTrades.length > 0 ? (
                  <div className="absolute inset-x-2 top-8 bottom-2 flex flex-col justify-center">
                    {/* Display Value - Percentage or Dollar */}
                    <div className="text-center">
                      <div className="text-base font-bold text-black">
                        {displayMode === "percentage" 
                          ? `${dailyPnL > 0 ? '+' : ''}${dailyReturn?.toFixed(2)}%`
                          : `${dailyPnL > 0 ? '+' : ''}$${dailyPnL.toFixed(2)}`
                        }
                      </div>
                      <div className="text-xs text-black/80 font-medium">
                        {displayMode === "percentage" ? "%" : "USD"}
                      </div>
                    </div>
                    {/* Trade Count */}
                    <div className="text-xs text-black/90 text-center mt-1">
                      Trades: {dayTrades.length}
                    </div>
                  </div>
                ) : (
                  /* Empty Day Content - Background Logo */
                  isCurrentMonth && (
                    <>
                      {/* Background Logo */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <img 
                          src={logoImage} 
                          alt="TJ Logo" 
                          className="w-full h-full object-cover opacity-10"
                        />
                      </div>
                      {/* Zero Trades Text */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-[10px] text-white/60 font-bold text-center">
                          Zero Trades
                        </div>
                      </div>
                    </>
                  )
                )}
              </div>
            );
          })}
            </div>
          </div>

          {/* Weekly Totals Section */}
          {showWeeklyTotals && (
            <div className="w-20 flex-shrink-0">
              {/* Header */}
              <div className="h-8 sm:h-10 flex items-center justify-center mb-2">
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">Total</span>
              </div>
              
              {/* Weekly Summary Boxes */}
              <div className="space-y-1">
                {getWeeklyTotals().map((week, index) => (
                  <div 
                    key={index}
                    className="bg-gray-600 rounded-lg p-3 text-white"
                    style={{ height: showWeekends ? '94px' : '94px' }}
                  >
                    <div className="text-xs font-medium mb-1">Week {week.weekNumber}</div>
                    <div className={`text-sm font-bold ${
                      week.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {week.pnl >= 0 ? '+' : ''}${Math.abs(week.pnl) >= 1000 
                        ? `${(week.pnl / 1000).toFixed(1)}k` 
                        : week.pnl.toFixed(0)
                      }
                    </div>
                    <div className="text-xs text-gray-300 mt-1">
                      {week.tradeCount} trades
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Selected Date Details */}
        {selectedDate && (
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t">
            <h4 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </h4>
            
            {selectedDateTrades.length > 0 ? (
              <div className="space-y-4">
                {selectedDateTrades.map((trade) => (
                  <div
                    key={trade.id}
                    className="bg-muted/50 rounded-lg border overflow-hidden"
                  >
                    {/* Trade Header */}
                    <div className="flex items-center justify-between p-3 border-b bg-muted/30">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">
                          {trade.instrument_type}
                        </Badge>
                        <span className="font-medium">
                          {trade.instrument}
                        </span>
                        <Badge 
                          variant={trade.trade_type === "BUY" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {trade.trade_type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold flex items-center gap-1 ${
                          (typeof trade.pnl === 'string' ? parseFloat(trade.pnl) : (trade.pnl || 0)) >= 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          {(typeof trade.pnl === 'string' ? parseFloat(trade.pnl) : (trade.pnl || 0)) >= 0 ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          ${(typeof trade.pnl === 'string' ? parseFloat(trade.pnl) : (trade.pnl || 0)).toFixed(2)}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditTrade(trade);
                            setIsEditTradeModalOpen(true);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Trade Details */}
                    <div className="p-4 space-y-4">
                      {/* Complete Trade Info Grid - Editable */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                        {/* Position Size */}
                        <div className="space-y-1">
                          <span className="text-muted-foreground text-xs">Position Size:</span>
                          {isEditing(trade.id, 'positionSize') ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="h-7 text-sm"
                                type="number"
                                step="0.01"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') saveEdit();
                                  if (e.key === 'Escape') cancelEdit();
                                }}
                                autoFocus
                              />
                              <Button size="sm" variant="ghost" onClick={saveEdit} className="h-7 w-7 p-0">
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-7 w-7 p-0">
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div 
                              className="font-medium cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded"
                              onClick={() => startEdit(trade.id, 'position_size', String(trade.position_size || ''))}
                            >
                              {trade.position_size}
                            </div>
                          )}
                        </div>

                        {/* Entry Price */}
                        <div className="space-y-1">
                          <span className="text-muted-foreground text-xs">Entry Price:</span>
                          {isEditing(trade.id, 'entry_price') ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="h-7 text-sm"
                                type="number"
                                step="0.00001"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') saveEdit();
                                  if (e.key === 'Escape') cancelEdit();
                                }}
                                autoFocus
                              />
                              <Button size="sm" variant="ghost" onClick={saveEdit} className="h-7 w-7 p-0">
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-7 w-7 p-0">
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div 
                              className="font-medium cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded"
                              onClick={() => startEdit(trade.id, 'entry_price', String(trade.entry_price || ''))}
                            >
                              ${trade.entry_price}
                            </div>
                          )}
                        </div>

                        {/* Stop Loss */}
                        <div className="space-y-1">
                          <span className="text-muted-foreground text-xs">Stop Loss:</span>
                          {isEditing(trade.id, 'stop_loss') ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="h-7 text-sm"
                                type="number"
                                step="0.00001"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') saveEdit();
                                  if (e.key === 'Escape') cancelEdit();
                                }}
                                autoFocus
                              />
                              <Button size="sm" variant="ghost" onClick={saveEdit} className="h-7 w-7 p-0">
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-7 w-7 p-0">
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div 
                              className="font-medium cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded"
                              onClick={() => startEdit(trade.id, 'stop_loss', String(trade.stop_loss || ''))}
                            >
                              {trade.stop_loss ? `$${trade.stop_loss}` : 'Click to set'}
                            </div>
                          )}
                        </div>

                        {/* Take Profit */}
                        <div className="space-y-1">
                          <span className="text-muted-foreground text-xs">Take Profit:</span>
                          {isEditing(trade.id, 'take_profit') ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="h-7 text-sm"
                                type="number"
                                step="0.00001"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') saveEdit();
                                  if (e.key === 'Escape') cancelEdit();
                                }}
                                autoFocus
                              />
                              <Button size="sm" variant="ghost" onClick={saveEdit} className="h-7 w-7 p-0">
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-7 w-7 p-0">
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div 
                              className="font-medium cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded"
                              onClick={() => startEdit(trade.id, 'take_profit', String(trade.take_profit || ''))}
                            >
                              {trade.take_profit ? `$${trade.take_profit}` : 'Click to set'}
                            </div>
                          )}
                        </div>

                        {/* Exit Price */}
                        <div className="space-y-1">
                          <span className="text-muted-foreground text-xs">Exit Price:</span>
                          {isEditing(trade.id, 'exit_price') ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="h-7 text-sm"
                                type="number"
                                step="0.00001"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') saveEdit();
                                  if (e.key === 'Escape') cancelEdit();
                                }}
                                autoFocus
                              />
                              <Button size="sm" variant="ghost" onClick={saveEdit} className="h-7 w-7 p-0">
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-7 w-7 p-0">
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div 
                              className="font-medium cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded"
                              onClick={() => startEdit(trade.id, 'exit_price', String(trade.exit_price || ''))}
                            >
                              {trade.exit_price ? `$${trade.exit_price}` : 'Click to set'}
                            </div>
                          )}
                        </div>

                        {/* Entry Date */}
                        <div className="space-y-1">
                          <span className="text-muted-foreground text-xs">Entry Date:</span>
                          <div className="font-medium">
                            {trade.entry_date ? format(
                              typeof trade.entry_date === 'string' ? parseISO(trade.entry_date) : trade.entry_date, 
                              'MMM dd, yyyy'
                            ) : 'Not set'}
                          </div>
                        </div>

                        {/* Exit Date */}
                        {(trade.exit_date || isEditing(trade.id, 'exit_date')) && (
                          <div className="space-y-1">
                            <span className="text-muted-foreground text-xs">Exit Date:</span>
                            <div className="font-medium">
                              {trade.exit_date ? format(
                                typeof trade.exit_date === 'string' ? parseISO(trade.exit_date) : trade.exit_date, 
                                'MMM dd, yyyy'
                              ) : 'Not set'}
                            </div>
                          </div>
                        )}

                        {/* Status */}
                        <div className="space-y-1">
                          <span className="text-muted-foreground text-xs">Status:</span>
                          <div className="font-medium">
                            <Badge variant={trade.status === "CLOSED" ? "default" : "secondary"} className="text-xs">
                              {trade.status}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Trade Notes - Editable */}
                      <div>
                        <h5 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-2">
                          Trade Notes:
                          {!isEditing(trade.id, 'notes') && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEdit(trade.id, 'notes', trade.notes || '')}
                              className="h-6 w-6 p-0"
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                          )}
                        </h5>
                        {isEditing(trade.id, 'notes') ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              placeholder="Add your trade notes here..."
                              className="min-h-20 text-sm resize-none"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && e.ctrlKey) saveEdit();
                                if (e.key === 'Escape') cancelEdit();
                              }}
                              autoFocus
                            />
                            <div className="flex items-center gap-2">
                              <Button size="sm" onClick={saveEdit} disabled={updateTradeMutation.isPending}>
                                <Check className="h-3 w-3 mr-1" />
                                Save
                              </Button>
                              <Button size="sm" variant="ghost" onClick={cancelEdit}>
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                              <span className="text-xs text-muted-foreground">Ctrl+Enter to save</span>
                            </div>
                          </div>
                        ) : (
                          <div 
                            className="bg-background/50 rounded p-3 text-sm border-l-2 border-primary/20 cursor-pointer hover:bg-muted/50 border-2 border-dashed border-muted-foreground/20 hover:border-muted-foreground/40"
                            onClick={() => startEdit(trade.id, 'notes', trade.notes || '')}
                          >
                            {trade.notes ? (
                              <p className="whitespace-pre-wrap">{trade.notes}</p>
                            ) : (
                              <p className="text-muted-foreground">Click to add notes...</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Attached Images - With Upload */}
                      <div>
                        <h5 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-2">
                          Attached Images {trade.attachments && trade.attachments.length > 0 && `(${trade.attachments.length})`}:
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              // Trigger file input
                              const fileInput = document.createElement('input');
                              fileInput.type = 'file';
                              fileInput.accept = 'image/*';
                              fileInput.multiple = true;
                              fileInput.onchange = (e) => {
                                const target = e.target as HTMLInputElement;
                                const files = target.files;
                                if (files && files.length > 0) {
                                  handleImageUpload(trade.id, Array.from(files));
                                }
                              };
                              fileInput.click();
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </h5>
                        
                        {trade.attachments && trade.attachments.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {trade.attachments.map((imageUrl, index) => (
                              <div key={index} className="relative group">
                                <div
                                  className="w-full h-24 bg-gray-100 rounded border cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center"
                                  onClick={() => {
                                    setSelectedImage(imageUrl);
                                    setIsImageViewerOpen(true);
                                  }}
                                >
                                  <SignedImageDisplay
                                    imageUrl={imageUrl}
                                    alt={`Trade attachment ${index + 1}`}
                                    className="max-w-full max-h-full object-cover rounded"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div 
                            className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/40 hover:bg-muted/20"
                            onClick={() => {
                              // Trigger file input
                              const fileInput = document.createElement('input');
                              fileInput.type = 'file';
                              fileInput.accept = 'image/*';
                              fileInput.multiple = true;
                              fileInput.onchange = (e) => {
                                const target = e.target as HTMLInputElement;
                                const files = target.files;
                                if (files && files.length > 0) {
                                  handleImageUpload(trade.id, Array.from(files));
                                }
                              };
                              fileInput.click();
                            }}
                          >
                            <Plus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Click to add images...</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="mt-4 pt-3 border-t flex justify-between items-center">
                  <span className="font-medium">Daily P&L:</span>
                  <span className={`text-lg font-bold ${
                    getDailyPnL(selectedDate) >= 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    ${getDailyPnL(selectedDate).toFixed(2)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No trades recorded for this date.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Add Trade Modal */}
        {addTradeDate && (
          <AddTradeModal
            isOpen={isAddTradeModalOpen}
            onClose={() => {
              setIsAddTradeModalOpen(false);
              setAddTradeDate(null);
            }}
            selectedDate={addTradeDate}
          />
        )}

        {/* Edit Trade Modal */}
        {editTrade && (
          <EditTradeModal
            isOpen={isEditTradeModalOpen}
            onClose={() => {
              setIsEditTradeModalOpen(false);
              setEditTrade(null);
            }}
            trade={editTrade}
          />
        )}

        {/* Image Viewer Modal */}
        {isImageViewerOpen && selectedImage && (
          <ImageViewerModal
            isOpen={isImageViewerOpen}
            onClose={() => {
              setIsImageViewerOpen(false);
              setSelectedImage(null);
            }}
            imageUrl={selectedImage}
          />
        )}
      </CardContent>
    </Card>
  );
}