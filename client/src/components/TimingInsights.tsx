import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Clock, TrendingUp, TrendingDown } from "lucide-react";

interface Trade {
  id: string;
  entry_date?: string;
  pnl?: number;
  [key: string]: any;
}

interface TimingInsightsProps {
  trades: Trade[];
  textColor?: string;
}

interface HourlyData {
  hour: number;
  totalTrades: number;
  totalPnL: number;
  avgPnL: number;
  winRate: number;
  wins: number;
  displayHour: string;
}

export default function TimingInsights({ trades, textColor = "#ffffff" }: TimingInsightsProps) {
  const hourlyAnalysis = useMemo(() => {
    // Initialize hourly data for 24 hours
    const hourlyMap: Record<number, { trades: Trade[]; pnls: number[] }> = {};
    for (let i = 0; i < 24; i++) {
      hourlyMap[i] = { trades: [], pnls: [] };
    }

    // Group trades by hour
    trades?.forEach(trade => {
      if (!trade.entry_date) return;
      
      const date = new Date(trade.entry_date);
      const hour = date.getHours();
      const pnl = Number(trade.pnl) || 0;
      
      hourlyMap[hour].trades.push(trade);
      hourlyMap[hour].pnls.push(pnl);
    });

    // Calculate metrics for each hour
    const hourlyData: HourlyData[] = [];
    let bestHour: HourlyData | null = null;
    let worstHour: HourlyData | null = null;

    for (let hour = 0; hour < 24; hour++) {
      const { trades: hourTrades, pnls } = hourlyMap[hour];
      const totalTrades = hourTrades.length;
      const totalPnL = pnls.reduce((sum, pnl) => sum + pnl, 0);
      const avgPnL = totalTrades > 0 ? totalPnL / totalTrades : 0;
      const wins = pnls.filter(pnl => pnl > 0).length;
      const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

      const hourData: HourlyData = {
        hour,
        totalTrades,
        totalPnL,
        avgPnL,
        winRate,
        wins,
        displayHour: `${hour.toString().padStart(2, '0')}:00`
      };

      if (totalTrades > 0) {
        hourlyData.push(hourData);
        
        if (!bestHour || avgPnL > bestHour.avgPnL) {
          bestHour = hourData;
        }
        if (!worstHour || avgPnL < worstHour.avgPnL) {
          worstHour = hourData;
        }
      }
    }

    return { hourlyData, bestHour, worstHour };
  }, [trades]);

  const { hourlyData, bestHour, worstHour } = hourlyAnalysis;

  // Generate all 24 hours for chart (including empty ones) - MUST be before any early returns
  const chartData = useMemo(() => {
    const data = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourData = hourlyData?.find(d => d.hour === hour);
      data.push({
        hour,
        displayHour: `${hour.toString().padStart(2, '0')}:00`,
        avgPnL: hourData?.avgPnL || 0,
        totalTrades: hourData?.totalTrades || 0,
        winRate: hourData?.winRate || 0
      });
    }
    return data;
  }, [hourlyData]);

  // If no trade data with valid timestamps, show message
  if (!hourlyData || hourlyData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-400">
          <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No timing data available yet.</p>
          <p className="text-sm mt-1">Trade data will appear once trades have timestamps.</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      if (data.totalTrades === 0) return null;
      
      return (
        <div className="bg-[#0f172a] border border-blue-500/30 rounded-lg p-3 shadow-lg">
          <p className="text-white font-bold mb-1">{data.displayHour}</p>
          <p className={`font-semibold ${data.avgPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(data.avgPnL)} avg
          </p>
          <p className="text-gray-400 text-sm">{data.totalTrades} trades</p>
          <p className="text-gray-400 text-sm">{data.winRate.toFixed(0)}% win rate</p>
        </div>
      );
    }
    return null;
  };

  const getInsight = () => {
    if (!bestHour || !worstHour) return null;
    
    const worstAbsPnL = Math.abs(worstHour.avgPnL);
    
    // Handle edge case where worst hour is break-even or nearly zero
    if (worstAbsPnL < 0.01) {
      return `Best results at ${bestHour.displayHour}. Most hours show consistent performance.`;
    }
    
    const performanceRatio = bestHour.avgPnL / worstAbsPnL;
    if (performanceRatio > 3) {
      return `You perform ${performanceRatio.toFixed(1)}× better at ${bestHour.displayHour}. Avoid trading at ${worstHour.displayHour}.`;
    } else if (performanceRatio > 2) {
      return `Peak performance at ${bestHour.displayHour}. Consider reducing activity at ${worstHour.displayHour}.`;
    }
    return `Best results at ${bestHour.displayHour}. Watch performance at ${worstHour.displayHour}.`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Summary Cards */}
      {bestHour && worstHour && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Best Hour */}
          <div className="bg-gradient-to-br from-green-500/10 to-cyan-500/10 rounded-lg p-3 border border-green-500/30">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-xs font-semibold">Best Hour</span>
            </div>
            <div className="text-white font-bold text-lg mb-1">{bestHour.displayHour}</div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-400 font-semibold">{formatCurrency(bestHour.avgPnL)} avg</span>
              <span className="text-gray-400">{bestHour.winRate.toFixed(0)}% win</span>
            </div>
          </div>

          {/* Worst Hour */}
          <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-lg p-3 border border-red-500/30">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-red-400 text-xs font-semibold">Worst Hour</span>
            </div>
            <div className="text-white font-bold text-lg mb-1">{worstHour.displayHour}</div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-red-400 font-semibold">{formatCurrency(worstHour.avgPnL)} avg</span>
              <span className="text-gray-400">{worstHour.winRate.toFixed(0)}% win</span>
            </div>
          </div>
        </div>
      )}

      {/* Hourly Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
            <XAxis 
              dataKey="displayHour" 
              stroke={textColor}
              style={{ fontSize: '10px' }}
              tick={{ fill: textColor, opacity: 0.7 }}
              interval={2}
            />
            <YAxis 
              stroke={textColor}
              style={{ fontSize: '10px' }}
              tick={{ fill: textColor, opacity: 0.7 }}
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="avgPnL" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={entry.avgPnL >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'}
                  opacity={entry.totalTrades === 0 ? 0.2 : 0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Insight */}
      {getInsight() && (
        <div className="mt-3 text-center">
          <div className="flex items-center justify-center gap-2 text-cyan-400 text-sm">
            <Clock className="w-4 h-4" />
            <span>{getInsight()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
