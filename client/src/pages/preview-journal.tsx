import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { demoTrades } from "@/lib/demo-data";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Calendar, Clock, Target, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function PreviewJournal() {
  return (
    <div className="p-4 lg:p-8 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Trade Journal</h1>
            <p className="text-gray-300 mb-3">Detailed view of all your trades</p>
          </div>
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-4 py-2">
            <p className="text-sm text-cyan-400">📊 Preview Mode - Demo Data</p>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">Total Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{demoTrades.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">Winners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {demoTrades.filter(t => t.pnl > 0).length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">Losers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
              {demoTrades.filter(t => t.pnl < 0).length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">Net P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {formatCurrency(demoTrades.reduce((sum, t) => sum + t.pnl, 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trade Cards */}
      <div className="space-y-4">
        {[...demoTrades].reverse().map((trade) => (
          <Card 
            key={trade.id} 
            className="bg-slate-900/50 border-slate-700 hover:border-cyan-500/50 transition-all"
            data-testid={`trade-card-${trade.id}`}
          >
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Section - Main Info */}
                <div className="lg:col-span-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{trade.instrument}</h3>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={`${
                            trade.trade_type === "BUY" 
                              ? "border-green-500/50 text-green-400" 
                              : "border-red-500/50 text-red-400"
                          }`}
                        >
                          {trade.trade_type === "BUY" ? (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          ) : (
                            <TrendingDown className="w-3 h-3 mr-1" />
                          )}
                          {trade.trade_type}
                        </Badge>
                        <Badge variant="outline" className="border-slate-600 text-slate-400">
                          {trade.instrument_type}
                        </Badge>
                      </div>
                    </div>
                    <div className={`text-2xl font-bold ${
                      trade.pnl >= 0 ? "text-green-400" : "text-red-400"
                    }`}>
                      {formatCurrency(trade.pnl)}
                    </div>
                  </div>
                  
                  {trade.notes && (
                    <p className="text-sm text-slate-400 italic">"{trade.notes}"</p>
                  )}
                </div>

                {/* Middle Section - Trade Details */}
                <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Position Size</div>
                    <div className="text-sm text-white font-medium">{trade.position_size} lots</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Session</div>
                    <div className="text-sm text-white font-medium">{trade.session_tag}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Entry Price</div>
                    <div className="text-sm text-white font-medium">{trade.entry_price}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Exit Price</div>
                    <div className="text-sm text-white font-medium">{trade.exit_price}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Stop Loss</div>
                    <div className="text-sm text-slate-400">{trade.stop_loss}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Take Profit</div>
                    <div className="text-sm text-slate-400">{trade.take_profit}</div>
                  </div>
                </div>

                {/* Right Section - Metrics */}
                <div className="lg:col-span-3 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-400">
                      {new Date(trade.entry_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-400">
                      {trade.holding_time_minutes} min hold
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-400">
                      {formatCurrency(trade.profit_per_lot)}/lot
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-400">
                      Fees: {formatCurrency(trade.commission + (trade.swap || 0))}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
