import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, BarChart3, Target } from "lucide-react";

interface AnalyticsData {
  totalPnL: number;
  totalTrades: number;
  closedTrades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitableTrades: number;
}

interface SymbolStats {
  symbol: string;
  pnl: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  trades: number;
  isProfit: boolean;
}

interface SetupStats {
  name: string;
  pnl: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  trades: number;
  commonSymbols: string[];
}

interface MistakeStats {
  name: string;
  pnl: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  trades: number;
  commonSymbols: string[];
}

export default function TradingAnalytics() {
  const { data: analytics } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics/stats"],
    retry: false,
  });

  // Mock data for demonstration - replace with real API calls
  const profitableSymbols: SymbolStats[] = [
    { symbol: "SOL", pnl: 1306.00, winRate: 100, avgWin: 1306.00, avgLoss: 0, trades: 1, isProfit: true },
    { symbol: "EURUSD", pnl: 892.50, winRate: 85, avgWin: 425.30, avgLoss: -156.20, trades: 12, isProfit: true },
    { symbol: "GBPUSD", pnl: 654.30, winRate: 72, avgWin: 380.10, avgLoss: -189.40, trades: 8, isProfit: true }
  ];

  const unprofitableSymbols: SymbolStats[] = [
    { symbol: "AVAX", pnl: -306.44, winRate: 0, avgWin: 0, avgLoss: -306.44, trades: 1, isProfit: false },
    { symbol: "BTCUSD", pnl: -425.80, winRate: 25, avgWin: 180.20, avgLoss: -202.00, trades: 6, isProfit: false },
    { symbol: "XAUUSD", pnl: -189.60, winRate: 40, avgWin: 95.40, avgLoss: -142.50, trades: 5, isProfit: false }
  ];

  const profitableSetups: SetupStats[] = [
    { 
      name: "4H TRENDLINE", 
      pnl: 2758.34, 
      winRate: 75, 
      avgWin: 1021.59, 
      avgLoss: -306.44, 
      trades: 4,
      commonSymbols: ["SOL", "RUNE", "INJ", "AVAX"]
    }
  ];

  const commonMistakes: MistakeStats[] = [
    { 
      name: "EARLY ENTRY", 
      pnl: -306.44, 
      winRate: 0, 
      avgWin: 0, 
      avgLoss: -306.44, 
      trades: 1,
      commonSymbols: ["AVAX"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-blue-950 to-purple-900 p-6 text-white">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Top three most profitable symbols */}
        <section>
          <h2 className="text-lg font-medium mb-4 text-gray-200">Top three most profitable symbols</h2>
          <div className="space-y-4">
            {profitableSymbols.map((symbol, index) => (
              <div key={symbol.symbol} className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-4 border border-blue-800/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-8 bg-blue-400 rounded-full"></div>
                    <span className="text-white font-medium">{symbol.symbol}</span>
                  </div>
                  <span className="text-green-400 font-bold text-lg">${symbol.pnl.toFixed(2)}</span>
                </div>
                
                <div className="flex items-center gap-6 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-lg font-bold">{symbol.winRate}%</div>
                        <div className="text-xs">WIN RATE</div>
                      </div>
                    </div>
                  </div>
                  
                  {symbol.trades > 1 && (
                    <div className="flex-1">
                      <div className="text-xs text-gray-400 mb-1">LONGS {symbol.trades}</div>
                      <div className="w-full bg-blue-800/30 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full"
                          style={{ width: `${symbol.winRate}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400 text-xs">AVG WIN</div>
                    <div className="text-white font-medium">${symbol.avgWin.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">AVG LOSS</div>
                    <div className="text-white font-medium">${symbol.avgLoss.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">TRADES</div>
                    <div className="text-white font-medium">{symbol.trades}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Three most unprofitable symbols */}
        <section>
          <h2 className="text-lg font-medium mb-4 text-gray-200">Three most unprofitable symbols</h2>
          <div className="space-y-4">
            {unprofitableSymbols.map((symbol, index) => (
              <div key={symbol.symbol} className="bg-gradient-to-r from-red-900/30 to-pink-900/30 rounded-xl p-4 border border-red-800/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-8 bg-red-400 rounded-full"></div>
                    <span className="text-white font-medium">{symbol.symbol}</span>
                  </div>
                  <span className="text-red-400 font-bold text-lg">-${Math.abs(symbol.pnl).toFixed(2)}</span>
                </div>
                
                <div className="flex items-center gap-6 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-pink-400 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-lg font-bold">{symbol.winRate}%</div>
                        <div className="text-xs">LOSS RATE</div>
                      </div>
                    </div>
                  </div>
                  
                  {symbol.trades > 1 && (
                    <div className="flex-1">
                      <div className="text-xs text-gray-400 mb-1">{symbol.trades} SHORTS</div>
                      <div className="w-full bg-red-800/30 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-red-400 to-pink-400 h-2 rounded-full"
                          style={{ width: `${100 - symbol.winRate}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400 text-xs">AVG WIN</div>
                    <div className="text-white font-medium">${symbol.avgWin.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">AVG LOSS</div>
                    <div className="text-white font-medium">-${Math.abs(symbol.avgLoss).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">TRADES</div>
                    <div className="text-white font-medium">{symbol.trades}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Top three most profitable setups */}
        <section>
          <h2 className="text-lg font-medium mb-4 text-gray-200">Top three most profitable setups</h2>
          <div className="space-y-4">
            {profitableSetups.map((setup, index) => (
              <div key={setup.name} className="bg-gradient-to-r from-orange-900/30 to-yellow-900/30 rounded-xl p-4 border border-orange-800/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-8 bg-orange-400 rounded-full"></div>
                    <span className="text-white font-medium">{setup.name}</span>
                  </div>
                  <span className="text-green-400 font-bold text-lg">${setup.pnl.toFixed(2)}</span>
                </div>
                
                <div className="flex items-center gap-6 mb-3">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-yellow-400 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-lg font-bold text-black">{setup.winRate}%</div>
                      <div className="text-xs text-black">WIN RATE</div>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400 text-xs">AVG WIN</div>
                        <div className="text-white font-medium">${setup.avgWin.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs">AVG LOSS</div>
                        <div className="text-white font-medium">-${Math.abs(setup.avgLoss).toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs">TRADES</div>
                        <div className="text-white font-medium">{setup.trades}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3">
                  <div className="text-gray-400 text-xs mb-2">FIVE MOST COMMON SYMBOLS:</div>
                  <div className="flex gap-2">
                    {setup.commonSymbols.map((symbol) => (
                      <span key={symbol} className="px-2 py-1 bg-blue-600/40 text-blue-300 text-xs rounded">
                        {symbol}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Three most common mistakes */}
        <section>
          <h2 className="text-lg font-medium mb-4 text-gray-200">Three most common mistakes</h2>
          <div className="space-y-4">
            {commonMistakes.map((mistake, index) => (
              <div key={mistake.name} className="bg-gradient-to-r from-red-900/30 to-purple-900/30 rounded-xl p-4 border border-red-800/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-8 bg-red-400 rounded-full"></div>
                    <span className="text-white font-medium">{mistake.name}</span>
                  </div>
                  <span className="text-red-400 font-bold text-lg">-${Math.abs(mistake.pnl).toFixed(2)}</span>
                </div>
                
                <div className="flex items-center gap-6 mb-3">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-pink-400 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-lg font-bold">{100 - mistake.winRate}%</div>
                      <div className="text-xs">LOSS RATE</div>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="w-full bg-red-800/30 rounded-full h-2 mb-3">
                      <div 
                        className="bg-gradient-to-r from-red-400 to-pink-400 h-2 rounded-full"
                        style={{ width: `${100 - mistake.winRate}%` }}
                      ></div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400 text-xs">AVG WIN</div>
                        <div className="text-white font-medium">${mistake.avgWin.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs">AVG LOSS</div>
                        <div className="text-white font-medium">-${Math.abs(mistake.avgLoss).toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs">TRADES</div>
                        <div className="text-white font-medium">{mistake.trades}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3">
                  <div className="text-gray-400 text-xs mb-2">FIVE MOST COMMON SYMBOLS:</div>
                  <div className="flex gap-2">
                    {mistake.commonSymbols.map((symbol) => (
                      <span key={symbol} className="px-2 py-1 bg-blue-600/40 text-blue-300 text-xs rounded">
                        {symbol}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}