import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Upload, Scan, Clock } from "lucide-react";
import { AddTradeModal } from "@/components/AddTradeModal";
import { UploadTradesModal } from "@/components/UploadTradesModal";
import { OCRUploadModal } from "@/components/OCRUploadModal";
import { AccountSelector } from "@/components/AccountSelector";
import { formatCurrency } from "@/lib/utils";
import { getTrades, deleteTrade } from "@/lib/supabase-service";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useSelectedAccount } from "@/hooks/use-selected-account";
import { formatTradeDateTime } from "@/lib/date-utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Trades() {
  const [selectedAccount, setSelectedAccount] = useSelectedAccount();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isOCRModalOpen, setIsOCRModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const [sessionFilter, setSessionFilter] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();

  // Auto-open Add Trade modal when navigated from calendar
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('add') === 'true') {
      setIsFormOpen(true);
      // Clean up URL without the parameter
      window.history.replaceState({}, '', '/trades');
    }
  }, []);

  const { data: trades = [], isLoading } = useQuery({
    queryKey: ["trades", selectedAccount],
    queryFn: () => getTrades(selectedAccount),
    retry: false,
  }) as { data: any[], isLoading: boolean };

  const deleteMutation = useMutation({
    mutationFn: deleteTrade,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      toast({
        title: "Trade deleted successfully",
      });
    },
  });

  const handleEdit = (trade: any) => {
    setEditingTrade(trade);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this trade?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingTrade(null);
  };

  // Filter trades by session
  const filteredTrades = sessionFilter === "all" 
    ? trades 
    : trades.filter((trade: any) => trade.session_tag?.toLowerCase() === sessionFilter.toLowerCase());

  // Helper function to get session badge color
  const getSessionBadgeColor = (session: string | null) => {
    if (!session) return "bg-gray-600 text-white";
    switch (session.toLowerCase()) {
      case "london":
        return "bg-blue-600 text-white";
      case "new york":
        return "bg-purple-600 text-white";
      case "asia":
        return "bg-orange-600 text-white";
      case "overlap":
        return "bg-pink-600 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };

  // Helper function to format holding time
  const formatHoldingTime = (minutes: number | null) => {
    if (!minutes) return "N/A";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="h-8 bg-muted animate-pulse rounded w-48 mb-2"></div>
            <div className="h-4 bg-muted animate-pulse rounded w-64"></div>
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-24 bg-muted animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Trade Journal</h1>
          <p className="text-gray-300 mb-3">Manage and track all your trading positions</p>
          <div className="flex gap-3 items-center">
            <AccountSelector value={selectedAccount} onValueChange={setSelectedAccount} />
            <Select value={sessionFilter} onValueChange={setSessionFilter}>
              <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white" data-testid="select-session-filter">
                <SelectValue placeholder="Filter by session" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                <SelectItem value="london">London</SelectItem>
                <SelectItem value="new york">New York</SelectItem>
                <SelectItem value="asia">Asia</SelectItem>
                <SelectItem value="overlap">Overlap</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsOCRModalOpen(true)}
            variant="outline"
            className="border-cyan-500/50 text-white hover:bg-cyan-600/20"
            data-testid="button-upload-screenshot"
          >
            <Scan className="h-4 w-4 mr-2" />
            Upload Trade Screenshot (AI-Read)
          </Button>
          <Button 
            onClick={() => setIsUploadModalOpen(true)}
            variant="outline"
            className="border-cyan-500/50 text-white hover:bg-cyan-600/20"
            data-testid="button-upload-trades"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload CSV | HTML | EXCEL
          </Button>
          <Button 
            onClick={() => setIsFormOpen(true)}
            className="bg-cyan-600 hover:bg-cyan-700 text-white border-0"
            data-testid="button-add-trade"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Trade
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredTrades.length > 0 ? (
          filteredTrades.map((trade: any) => (
            <Card key={trade.id} className="bg-[#0f1f3a] border-[#1a2f4a]">
              <CardContent className="p-4 sm:p-6">
                {/* Mobile/Tablet Layout: Single column with grouped sections */}
                <div className="lg:hidden space-y-4">
                  {/* Header: Instrument, P&L, Badges */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-2 flex-1">
                      <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{trade.instrument}</h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={trade.trade_type === 'BUY' ? 'default' : 'secondary'} className={
                          trade.trade_type === 'BUY' 
                            ? 'bg-green-600/20 text-green-400 border border-green-600 hover:bg-green-600/30' 
                            : 'bg-red-600/20 text-red-400 border border-red-600 hover:bg-red-600/30'
                        } data-testid={`badge-type-${trade.id}`}>
                          {trade.trade_type}
                        </Badge>
                        <Badge variant="outline" className="border-cyan-500/50 text-cyan-400 bg-cyan-600/10" data-testid={`badge-instrument-${trade.id}`}>
                          {trade.instrument_type}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className={`text-3xl sm:text-4xl font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`} data-testid={`text-pnl-${trade.id}`}>
                        {formatCurrency(trade.pnl || 0)}
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(trade)} className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-800/50" data-testid={`button-edit-${trade.id}`}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(trade.id)} disabled={deleteMutation.isPending} className="border-red-500/30 text-red-300 hover:bg-red-800/50" data-testid={`button-delete-${trade.id}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Trade Stats: 2 columns on mobile, 3 on sm */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-gray-400 text-xs">Position Size</p>
                      <p className="font-medium text-white">{trade.position_size} lots</p>
                    </div>
                    {trade.session_tag && (
                      <div>
                        <p className="text-gray-400 text-xs">Session</p>
                        <p className="font-medium text-white">{trade.session_tag}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-400 text-xs">Entry Price</p>
                      <p className="font-medium text-white">{trade.entry_price}</p>
                    </div>
                    {trade.exit_price && (
                      <div>
                        <p className="text-gray-400 text-xs">Exit Price</p>
                        <p className="font-medium text-white">{trade.exit_price}</p>
                      </div>
                    )}
                    {trade.stop_loss && (
                      <div>
                        <p className="text-gray-400 text-xs">Stop Loss</p>
                        <p className="font-medium text-orange-400">{trade.stop_loss}</p>
                      </div>
                    )}
                    {trade.take_profit && (
                      <div>
                        <p className="text-gray-400 text-xs">Take Profit</p>
                        <p className="font-medium text-cyan-400">{trade.take_profit}</p>
                      </div>
                    )}
                  </div>

                  {/* Metadata row */}
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs sm:text-sm text-gray-400">
                    {trade.entry_date && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-500">📅</span>
                        <span>{new Date(trade.entry_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {trade.holding_time_minutes && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-gray-500" />
                        <span data-testid={`text-holding-time-${trade.id}`}>{formatHoldingTime(trade.holding_time_minutes)} hold</span>
                      </div>
                    )}
                    {trade.profit_per_lot !== null && trade.profit_per_lot !== undefined && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-500">💰</span>
                        <span className={parseFloat(trade.profit_per_lot) >= 0 ? 'text-green-400' : 'text-red-400'} data-testid={`text-profit-per-lot-${trade.id}`}>
                          {formatCurrency(parseFloat(trade.profit_per_lot))}/lot
                        </span>
                      </div>
                    )}
                    {trade.commission && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-500">💵</span>
                        <span>Fees: {formatCurrency(parseFloat(trade.commission))}</span>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {trade.notes && (
                    <p className="text-sm text-gray-400 italic">"{trade.notes}"</p>
                  )}

                  {/* Timestamps & Upload Source */}
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500 pt-2 border-t border-gray-700">
                    {trade.entry_date && (
                      <p data-testid={`text-entry-${trade.id}`}>
                        Entry: {formatTradeDateTime(trade.entry_date)}
                      </p>
                    )}
                    {trade.exit_date && (
                      <p data-testid={`text-exit-${trade.id}`}>
                        Exit: {formatTradeDateTime(trade.exit_date)}
                      </p>
                    )}
                    {trade.upload_source && (
                      <p className="flex items-center gap-1" data-testid={`text-upload-source-${trade.id}`}>
                        <span>Uploaded by</span>
                        <Badge variant="outline" className="border-gray-600 text-gray-400 bg-transparent px-1.5 py-0 text-xs">
                          {trade.upload_source}
                        </Badge>
                      </p>
                    )}
                  </div>
                </div>

                {/* Desktop Layout: Multi-column grid */}
                <div className="hidden lg:block">
                  <div className="grid grid-cols-[240px_180px_1fr_280px_auto] gap-4 xl:gap-6 items-center">
                    {/* Left: Instrument & Badges */}
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-white tracking-tight">{trade.instrument}</h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={trade.trade_type === 'BUY' ? 'default' : 'secondary'} className={
                          trade.trade_type === 'BUY' 
                            ? 'bg-green-600/20 text-green-400 border border-green-600 hover:bg-green-600/30' 
                            : 'bg-red-600/20 text-red-400 border border-red-600 hover:bg-red-600/30'
                        } data-testid={`badge-type-${trade.id}`}>
                          {trade.trade_type}
                        </Badge>
                        <Badge variant="outline" className="border-cyan-500/50 text-cyan-400 bg-cyan-600/10" data-testid={`badge-instrument-${trade.id}`}>
                          {trade.instrument_type}
                        </Badge>
                      </div>
                      {trade.notes && (
                        <p className="text-sm text-gray-400 italic mt-2">"{trade.notes}"</p>
                      )}
                    </div>

                    {/* Center: Large P&L */}
                    <div className="text-left">
                      <p className={`text-4xl font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`} data-testid={`text-pnl-${trade.id}`}>
                        {formatCurrency(trade.pnl || 0)}
                      </p>
                    </div>

                    {/* Middle: Two-column data grid */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                      <div>
                        <p className="text-gray-400 text-xs">Position Size</p>
                        <p className="font-medium text-white">{trade.position_size} lots</p>
                      </div>
                      {trade.session_tag && (
                        <div>
                          <p className="text-gray-400 text-xs">Session</p>
                          <p className="font-medium text-white">{trade.session_tag}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-gray-400 text-xs">Entry Price</p>
                        <p className="font-medium text-white">{trade.entry_price}</p>
                      </div>
                      {trade.exit_price && (
                        <div>
                          <p className="text-gray-400 text-xs">Exit Price</p>
                          <p className="font-medium text-white">{trade.exit_price}</p>
                        </div>
                      )}
                      {trade.stop_loss && (
                        <div>
                          <p className="text-gray-400 text-xs">Stop Loss</p>
                          <p className="font-medium text-orange-400">{trade.stop_loss}</p>
                        </div>
                      )}
                      {trade.take_profit && (
                        <div>
                          <p className="text-gray-400 text-xs">Take Profit</p>
                          <p className="font-medium text-cyan-400">{trade.take_profit}</p>
                        </div>
                      )}
                    </div>

                    {/* Right: Metadata */}
                    <div className="space-y-2 text-sm text-gray-400">
                      {trade.entry_date && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">📅</span>
                          <span>{new Date(trade.entry_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      {trade.holding_time_minutes && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span data-testid={`text-holding-time-${trade.id}`}>{formatHoldingTime(trade.holding_time_minutes)} hold</span>
                        </div>
                      )}
                      {trade.profit_per_lot !== null && trade.profit_per_lot !== undefined && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">💰</span>
                          <span className={parseFloat(trade.profit_per_lot) >= 0 ? 'text-green-400' : 'text-red-400'} data-testid={`text-profit-per-lot-${trade.id}`}>
                            {formatCurrency(parseFloat(trade.profit_per_lot))}/lot
                          </span>
                        </div>
                      )}
                      {trade.commission && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">💵</span>
                          <span>Fees: {formatCurrency(parseFloat(trade.commission))}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(trade)} className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-800/50" data-testid={`button-edit-${trade.id}`}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(trade.id)} disabled={deleteMutation.isPending} className="border-red-500/30 text-red-300 hover:bg-red-800/50" data-testid={`button-delete-${trade.id}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Bottom: Entry/Exit Timestamps & Upload Source */}
                  <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
                    {trade.entry_date && (
                      <p data-testid={`text-entry-${trade.id}`}>
                        Entry: {formatTradeDateTime(trade.entry_date)}
                      </p>
                    )}
                    {trade.exit_date && (
                      <p data-testid={`text-exit-${trade.id}`}>
                        Exit: {formatTradeDateTime(trade.exit_date)}
                      </p>
                    )}
                    {trade.upload_source && (
                      <p className="flex items-center gap-1" data-testid={`text-upload-source-${trade.id}`}>
                        <span>Uploaded by</span>
                        <Badge variant="outline" className="border-gray-600 text-gray-400 bg-transparent px-1.5 py-0 text-xs">
                          {trade.upload_source}
                        </Badge>
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-[#0f1f3a] border-[#1a2f4a]">
            <CardContent className="p-12 text-center">
              <h3 className="text-lg font-medium mb-2 text-white">
                {sessionFilter === "all" ? "No trades yet" : `No ${sessionFilter} session trades`}
              </h3>
              <p className="text-gray-400 mb-4">
                {sessionFilter === "all" 
                  ? "Start building your trading journal by adding your first trade"
                  : `Try selecting a different session filter or add new trades`
                }
              </p>
              {sessionFilter === "all" && (
                <Button onClick={() => setIsFormOpen(true)} className="bg-cyan-600 hover:bg-cyan-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Trade
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <AddTradeModal
        isOpen={isFormOpen}
        onClose={handleFormClose}
        trade={editingTrade}
      />

      <OCRUploadModal
        isOpen={isOCRModalOpen}
        onClose={() => setIsOCRModalOpen(false)}
      />

      <UploadTradesModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
}