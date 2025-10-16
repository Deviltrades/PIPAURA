import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Upload, Scan, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { demoTrades, demoAccounts } from "@/lib/demo-data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PreviewTrades() {
  const [sessionFilter, setSessionFilter] = useState<string>("all");
  
  // Filter trades by session
  const filteredTrades = sessionFilter === "all" 
    ? demoTrades 
    : demoTrades.filter((trade) => trade.session_tag?.toLowerCase() === sessionFilter.toLowerCase());

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

  const formatTradeDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-4 lg:p-8 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Trade Journal</h1>
          <p className="text-gray-300 mb-3">Manage and track all your trading positions</p>
          <div className="flex gap-3 items-center">
            <div className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-white">
              📊 {demoAccounts[0].account_name}
            </div>
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
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-4 py-2 flex items-center">
            <p className="text-sm text-cyan-400">📊 Preview Mode</p>
          </div>
          <Button 
            variant="outline"
            className="border-cyan-500/50 text-white hover:bg-cyan-600/20"
            data-testid="button-upload-screenshot"
          >
            <Scan className="h-4 w-4 mr-2" />
            Upload Trade Screenshot (AI-Read)
          </Button>
          <Button 
            variant="outline"
            className="border-cyan-500/50 text-white hover:bg-cyan-600/20"
            data-testid="button-upload-trades"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload CSV | HTML | EXCEL
          </Button>
          <Button 
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
          [...filteredTrades].reverse().map((trade) => (
            <Card 
              key={trade.id} 
              className="bg-[#0f1f3a] border-[#1a2f4a] hover:border-cyan-500/50 transition-all"
              data-testid={`trade-card-${trade.id}`}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <Badge 
                        variant={trade.trade_type === 'BUY' ? 'default' : 'secondary'} 
                        className={
                          trade.trade_type === 'BUY' 
                            ? 'bg-green-600 text-white hover:bg-green-700' 
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }
                        data-testid={`badge-trade-type-${trade.id}`}
                      >
                        {trade.trade_type}
                      </Badge>
                      <h3 className="text-lg font-semibold text-white">{trade.instrument}</h3>
                      <Badge 
                        variant="secondary"
                        className="bg-cyan-600 text-white"
                        data-testid={`badge-status-${trade.id}`}
                      >
                        {trade.status}
                      </Badge>
                      {trade.session_tag && (
                        <Badge 
                          className={getSessionBadgeColor(trade.session_tag)} 
                          data-testid={`badge-session-${trade.id}`}
                        >
                          {trade.session_tag}
                        </Badge>
                      )}
                      {trade.holding_time_minutes && (
                        <Badge 
                          variant="outline" 
                          className="border-cyan-500/30 text-cyan-400 bg-transparent flex items-center gap-1" 
                          data-testid={`badge-holding-time-${trade.id}`}
                        >
                          <Clock className="h-3 w-3" />
                          {formatHoldingTime(trade.holding_time_minutes)}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Position Size</p>
                        <p className="font-medium text-white">{trade.position_size}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Entry Price</p>
                        <p className="font-medium text-white">{trade.entry_price}</p>
                      </div>
                      {trade.exit_price && (
                        <div>
                          <p className="text-gray-400">Exit Price</p>
                          <p className="font-medium text-white">{trade.exit_price}</p>
                        </div>
                      )}
                      {trade.stop_loss && (
                        <div>
                          <p className="text-gray-400">Stop Loss</p>
                          <p className="font-medium text-orange-400">{trade.stop_loss}</p>
                        </div>
                      )}
                      {trade.take_profit && (
                        <div>
                          <p className="text-gray-400">Take Profit</p>
                          <p className="font-medium text-cyan-400">{trade.take_profit}</p>
                        </div>
                      )}
                      {trade.pnl !== null && (
                        <div>
                          <p className="text-gray-400">P&L</p>
                          <p className={`font-medium ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatCurrency(trade.pnl)}
                          </p>
                        </div>
                      )}
                      {trade.profit_per_lot !== null && trade.profit_per_lot !== undefined && (
                        <div>
                          <p className="text-gray-400">P&L per Lot</p>
                          <p 
                            className={`font-medium ${trade.profit_per_lot >= 0 ? 'text-green-400' : 'text-red-400'}`} 
                            data-testid={`text-profit-per-lot-${trade.id}`}
                          >
                            {formatCurrency(trade.profit_per_lot)}
                          </p>
                        </div>
                      )}
                    </div>

                    {trade.notes && (
                      <div className="mt-4">
                        <p className="text-gray-400 text-sm mb-1">Notes</p>
                        <p className="text-sm text-gray-300">{trade.notes}</p>
                      </div>
                    )}

                    <div className="mt-4 space-y-1">
                      {trade.entry_date && (
                        <p className="text-xs text-gray-500" data-testid={`text-entry-${trade.id}`}>
                          Entry: {formatTradeDateTime(trade.entry_date)}
                        </p>
                      )}
                      {trade.exit_date && (
                        <p className="text-xs text-gray-500" data-testid={`text-exit-${trade.id}`}>
                          Exit: {formatTradeDateTime(trade.exit_date)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-800/50"
                      data-testid={`button-edit-${trade.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-500/30 text-red-300 hover:bg-red-800/50"
                      data-testid={`button-delete-${trade.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-[#0f1f3a] border-[#1a2f4a]">
            <CardContent className="p-12 text-center">
              <h3 className="text-lg font-medium mb-2 text-white">
                No {sessionFilter} session trades
              </h3>
              <p className="text-gray-400 mb-4">
                Try selecting a different session filter
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Info Card */}
      <div className="mt-8 bg-gradient-to-br from-cyan-600/10 to-blue-600/10 border border-cyan-500/20 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-2">
          💡 Trade Management Features
        </h3>
        <p className="text-slate-400 text-sm">
          This preview shows {demoTrades.length} demo trades with session filtering. 
          In the real app, you can add trades manually, upload CSV/Excel/HTML files, or use AI-powered screenshot upload to automatically extract trade data. 
          Filter by session (London/New York/Asia) to analyze session-specific performance.
        </p>
      </div>
    </div>
  );
}
