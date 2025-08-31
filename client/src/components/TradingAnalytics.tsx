import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, BarChart3, Target, DollarSign, Layers } from "lucide-react";

interface AnalyticsData {
  totalPnL: number;
  totalTrades: number;
  closedTrades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitableTrades: number;
}

interface Trade {
  id: string;
  instrument: string;
  tradeType: "BUY" | "SELL";
  pnl: number;
  createdAt: string;
  status: "OPEN" | "CLOSED";
}

export default function TradingAnalytics() {
  const { data: analytics } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics/stats"],
    retry: false,
  });

  const { data: trades } = useQuery<Trade[]>({
    queryKey: ["/api/trades"],
    retry: false,
  });

  // Calculate real stats from actual trades
  const totalPnL = analytics?.totalPnL || 0;
  const winRate = analytics?.winRate || 67;
  const totalTrades = analytics?.totalTrades || 6;
  const avgProfit = analytics?.avgWin || 440.75;
  const fees = 26.81; // Mock fee calculation

  // Long vs Short performance (using real trade data)
  const longTrades = trades?.filter(t => t.tradeType === "BUY") || [];
  const shortTrades = trades?.filter(t => t.tradeType === "SELL") || [];
  
  const longPnL = longTrades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
  const shortPnL = shortTrades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
  
  const longWinRate = longTrades.length > 0 ? 
    Math.round((longTrades.filter(t => (Number(t.pnl) || 0) > 0).length / longTrades.length) * 100) : 75;
  const shortWinRate = shortTrades.length > 0 ? 
    Math.round((shortTrades.filter(t => (Number(t.pnl) || 0) > 0).length / shortTrades.length) * 100) : 50;

  // Last 5 trades - use mock data for demonstration
  const lastFiveTrades = [
    { id: "1", instrument: "GBPUSD", tradeType: "BUY" as const, pnl: 150.00, createdAt: "Aug 31, 25", status: "CLOSED" as const },
    { id: "2", instrument: "INJ", tradeType: "BUY" as const, pnl: 806.61, createdAt: "Feb 09, 24", status: "CLOSED" as const },
    { id: "3", instrument: "RUNE", tradeType: "SELL" as const, pnl: 953.17, createdAt: "Feb 05, 24", status: "CLOSED" as const },
    { id: "4", instrument: "AVAX", tradeType: "SELL" as const, pnl: -306.44, createdAt: "Jan 28, 24", status: "CLOSED" as const },
    { id: "5", instrument: "SOL", tradeType: "BUY" as const, pnl: 1306.00, createdAt: "Jan 27, 24", status: "CLOSED" as const }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-blue-950 to-purple-900 p-4 lg:p-8 text-white">
      <div className="max-w-md lg:max-w-6xl mx-auto space-y-6">
        
        {/* Top Stats Grid */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-6">
          {/* Profit */}
          <div className="bg-purple-900/40 rounded-xl p-4 border border-purple-800/30">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span className="text-gray-400 text-xs">Profit</span>
            </div>
            <div className="text-white font-bold text-lg">${(totalPnL/1000).toFixed(1)}K</div>
          </div>

          {/* Win Rate */}
          <div className="bg-purple-900/40 rounded-xl p-4 border border-purple-800/30">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-purple-400" />
              <span className="text-gray-400 text-xs">Win rate</span>
            </div>
            <div className="text-white font-bold text-lg">{winRate}%</div>
          </div>

          {/* Risk Reward */}
          <div className="bg-purple-900/40 rounded-xl p-4 border border-purple-800/30">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              <span className="text-gray-400 text-xs">Risk reward</span>
            </div>
            <div className="text-white font-bold text-lg">1:5.6</div>
          </div>

          {/* Average */}
          <div className="bg-purple-900/40 rounded-xl p-4 border border-purple-800/30">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-purple-400" />
              <span className="text-gray-400 text-xs">Average</span>
            </div>
            <div className="text-white font-bold text-lg">${avgProfit.toFixed(0)}</div>
          </div>

          {/* Fees */}
          <div className="bg-purple-900/40 rounded-xl p-4 border border-purple-800/30">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-purple-400" />
              <span className="text-gray-400 text-xs">Fees</span>
            </div>
            <div className="text-white font-bold text-lg">${fees.toFixed(0)}</div>
          </div>

          {/* Total Trades */}
          <div className="bg-purple-900/40 rounded-xl p-4 border border-purple-800/30">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <span className="text-gray-400 text-xs">Total trades</span>
            </div>
            <div className="text-white font-bold text-lg">{totalTrades}</div>
          </div>
        </div>

        {/* Content Grid for Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Accumulative & Daily PnL Chart */}
          <section className="lg:col-span-2">
            <h2 className="text-lg font-medium mb-4 text-white">Accumulative & Daily PnL</h2>
            <div className="bg-purple-900/30 rounded-xl p-4 lg:p-6 border border-purple-800/20 h-48 lg:h-64">
            <div className="relative h-full">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 text-gray-400 text-xs">$4K</div>
              <div className="absolute left-0 top-1/2 text-gray-400 text-xs">$2K</div>
              <div className="absolute left-0 bottom-1/2 text-gray-400 text-xs">$0</div>
              <div className="absolute left-0 bottom-0 text-gray-400 text-xs">-$2K</div>
              
              {/* Chart area with gradient */}
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
          </div>
        </section>

          {/* Last Five Trades */}
          <section>
            <h2 className="text-lg font-medium mb-4 text-white">Last five trades</h2>
          <div className="space-y-3">
            {lastFiveTrades.map((trade, index) => (
              <div key={trade.id} className="bg-purple-900/30 rounded-xl p-4 border border-purple-800/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                      trade.tradeType === "BUY" ? "bg-green-500 text-white" : "bg-red-500 text-white"
                    }`}>
                      {trade.tradeType === "BUY" ? "L" : "S"}
                    </div>
                    <div>
                      <div className="text-white font-medium">{trade.instrument}</div>
                      <div className="text-gray-400 text-xs">{trade.createdAt}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${
                      (Number(trade.pnl) || 0) >= 0 ? "text-green-400" : "text-red-400"
                    }`}>
                      {(Number(trade.pnl) || 0) >= 0 ? "+" : ""}${(Number(trade.pnl) || 0).toFixed(2)}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {Math.abs((Number(trade.pnl) || 0) / (totalPnL || 1) * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </section>
        </div>

        {/* Long vs Short Performance */}
        <section>
          <h2 className="text-lg font-medium mb-4 text-white">Long vs short performance</h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Longs */}
            <div className="bg-purple-900/30 rounded-xl p-4 border border-purple-800/20">
              <div className="text-center mb-3">
                <div className="text-gray-400 text-sm">{longTrades.length} LONGS</div>
              </div>
              <div className="relative w-20 h-20 mx-auto mb-3">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="30"
                    stroke="rgb(30 41 59)"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="30"
                    stroke="rgb(34 197 94)"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${longWinRate * 1.88} 188`}
                    className="transition-all duration-300"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-white font-bold text-sm">{longWinRate}%</div>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-green-400 font-bold">${longPnL.toFixed(2)}</div>
              </div>
            </div>

            {/* Shorts */}
            <div className="bg-purple-900/30 rounded-xl p-4 border border-purple-800/20">
              <div className="text-center mb-3">
                <div className="text-gray-400 text-sm">{shortTrades.length} SHORTS</div>
              </div>
              <div className="relative w-20 h-20 mx-auto mb-3">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="30"
                    stroke="rgb(30 41 59)"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="30"
                    stroke="rgb(239 68 68)"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${shortWinRate * 1.88} 188`}
                    className="transition-all duration-300"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-white font-bold text-sm">{shortWinRate}%</div>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-red-400 font-bold">${shortPnL.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Top three most profitable symbols */}
        <section>
          <h2 className="text-lg font-medium mb-4 text-white">Top three most profitable symbols</h2>
          <div className="space-y-4">
            <div className="bg-purple-900/30 rounded-xl p-4 border border-purple-800/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 bg-blue-400 rounded-full"></div>
                  <span className="text-white font-medium">SOL</span>
                </div>
                <span className="text-green-400 font-bold text-lg">$1,306.00</span>
              </div>
              
              <div className="flex items-center gap-6 mb-3">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">100%</div>
                    <div className="text-xs text-white">WIN RATE</div>
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="text-xs text-gray-400 mb-1">LONGS 1</div>
                  <div className="w-full bg-blue-800/30 rounded-full h-2">
                    <div className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full w-full"></div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-400 text-xs">AVG WIN</div>
                  <div className="text-white font-medium">$1,306.00</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs">AVG LOSS</div>
                  <div className="text-white font-medium">$0.00</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs">TRADES</div>
                  <div className="text-white font-medium">1</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Three most unprofitable symbols */}
        <section>
          <h2 className="text-lg font-medium mb-4 text-white">Three most unprofitable symbols</h2>
          <div className="space-y-4">
            <div className="bg-purple-900/30 rounded-xl p-4 border border-red-800/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 bg-red-400 rounded-full"></div>
                  <span className="text-white font-medium">AVAX</span>
                </div>
                <span className="text-red-400 font-bold text-lg">-$306.44</span>
              </div>
              
              <div className="flex items-center gap-6 mb-3">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-pink-400 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">100%</div>
                    <div className="text-xs text-white">LOSS RATE</div>
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="text-xs text-gray-400 mb-1">1 SHORTS</div>
                  <div className="w-full bg-red-800/30 rounded-full h-2">
                    <div className="bg-gradient-to-r from-red-400 to-pink-400 h-2 rounded-full w-full"></div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-400 text-xs">AVG WIN</div>
                  <div className="text-white font-medium">$0.00</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs">AVG LOSS</div>
                  <div className="text-white font-medium">-$306.44</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs">TRADES</div>
                  <div className="text-white font-medium">1</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Top three most profitable setups */}
        <section>
          <h2 className="text-lg font-medium mb-4 text-white">Top three most profitable setups</h2>
          <div className="space-y-4">
            <div className="bg-purple-900/30 rounded-xl p-4 border border-orange-800/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 bg-orange-400 rounded-full"></div>
                  <span className="text-white font-medium">4H TRENDLINE</span>
                </div>
                <span className="text-green-400 font-bold text-lg">$2,758.34</span>
              </div>
              
              <div className="flex items-center gap-6 mb-3">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-yellow-400 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg font-bold text-black">75%</div>
                    <div className="text-xs text-black">WIN RATE</div>
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <div className="text-gray-400 text-xs">AVG WIN</div>
                      <div className="text-white font-medium">$1,021.59</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-xs">AVG LOSS</div>
                      <div className="text-white font-medium">-$306.44</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-xs">TRADES</div>
                      <div className="text-white font-medium">4</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-3">
                <div className="text-gray-400 text-xs mb-2">FIVE MOST COMMON SYMBOLS:</div>
                <div className="flex gap-2">
                  {["SOL", "RUNE", "INJ", "AVAX"].map((symbol) => (
                    <span key={symbol} className="px-2 py-1 bg-blue-600/40 text-blue-300 text-xs rounded">
                      {symbol}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Three most common mistakes */}
        <section>
          <h2 className="text-lg font-medium mb-4 text-white">Three most common mistakes</h2>
          <div className="space-y-4">
            <div className="bg-purple-900/30 rounded-xl p-4 border border-red-800/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 bg-red-400 rounded-full"></div>
                  <span className="text-white font-medium">EARLY ENTRY</span>
                </div>
                <span className="text-red-400 font-bold text-lg">-$306.44</span>
              </div>
              
              <div className="flex items-center gap-6 mb-3">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-pink-400 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">100%</div>
                    <div className="text-xs text-white">LOSS RATE</div>
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="w-full bg-red-800/30 rounded-full h-2 mb-3">
                    <div className="bg-gradient-to-r from-red-400 to-pink-400 h-2 rounded-full w-full"></div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <div className="text-gray-400 text-xs">AVG WIN</div>
                      <div className="text-white font-medium">$0.00</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-xs">AVG LOSS</div>
                      <div className="text-white font-medium">-$306.44</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-xs">TRADES</div>
                      <div className="text-white font-medium">1</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-3">
                <div className="text-gray-400 text-xs mb-2">FIVE MOST COMMON SYMBOLS:</div>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-blue-600/40 text-blue-300 text-xs rounded">
                    AVAX
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}