import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Info } from "lucide-react";
import { AccountSelector } from "@/components/AccountSelector";
import { 
  LineChart, 
  Line, 
  ResponsiveContainer,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  RadarChart
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { getAnalytics } from "@/lib/supabase-service";
import { FloatingDNACore } from "@/components/FloatingDNACore";

export default function Analytics() {
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(null);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: getAnalytics,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a1628] p-4 lg:p-8">
        <div className="mb-8">
          <div className="h-8 bg-muted animate-pulse rounded w-48 mb-2"></div>
          <div className="h-4 bg-muted animate-pulse rounded w-64"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-96 bg-muted animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = {
    totalPnL: analytics?.totalPnL || 0,
    winRate: analytics?.winRate || 0,
    profitFactor: analytics?.profitFactor || 0,
    maxDrawdown: analytics?.maxDrawdown || 0,
    equityCurve: analytics?.equityCurve || [],
    monthlyPerformance: analytics?.monthlyPerformance || [],
    averageMonthlyReturn: analytics?.averageMonthlyReturn || 0,
    bestMonth: analytics?.bestMonth || 0,
    bestMonthName: 'N/A'
  };

  // Calculate average monthly return as percentage
  const avgMonthlyReturnPercent = stats.totalPnL > 0 && stats.monthlyPerformance.length > 0
    ? (stats.averageMonthlyReturn / (stats.totalPnL / stats.monthlyPerformance.length)) * 100
    : 0;

  // Find best month name
  if (stats.monthlyPerformance.length > 0) {
    const bestMonthData = stats.monthlyPerformance.reduce((max, current) => 
      current.pnl > max.pnl ? current : max
    );
    stats.bestMonthName = bestMonthData.month;
  }

  // Prepare monthly orbit data (last 12 months)
  const monthlyOrbitData = stats.monthlyPerformance.slice(-12).map(m => ({
    month: m.month.split(' ')[0],
    value: Math.abs(m.pnl),
    pnl: m.pnl,
    fullMonth: m.month
  }));

  // Get current month for highlighting
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'short' });

  return (
    <div className="min-h-screen bg-[#0a1628] p-4 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">Trading Analytics</h1>
        <p className="text-gray-400 text-sm lg:text-base mb-3">Detailed performance analysis and metrics</p>
        <AccountSelector value={selectedAccount} onValueChange={setSelectedAccount} />
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
        {/* Total P&L */}
        <Card className="bg-[#0f1f3a] border-[#1a2f4a]" data-testid="card-total-pnl">
          <CardContent className="p-4 lg:p-6">
            <div className="text-gray-400 text-sm mb-2">Total P&L</div>
            <div className={`text-2xl lg:text-3xl font-bold ${stats.totalPnL >= 0 ? 'text-cyan-400' : 'text-red-500'}`} data-testid="text-total-pnl">
              {formatCurrency(stats.totalPnL)}
            </div>
          </CardContent>
        </Card>

        {/* Win Rate */}
        <Card className="bg-[#0f1f3a] border-[#1a2f4a]" data-testid="card-win-rate">
          <CardContent className="p-4 lg:p-6">
            <div className="text-gray-400 text-sm mb-2">Win Rate</div>
            <div className="text-2xl lg:text-3xl font-bold text-white" data-testid="text-win-rate">
              {stats.winRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        {/* Profit Factor */}
        <Card className="bg-[#0f1f3a] border-[#1a2f4a]" data-testid="card-profit-factor">
          <CardContent className="p-4 lg:p-6">
            <div className="text-gray-400 text-sm mb-2">Profit Factor</div>
            <div className="text-2xl lg:text-3xl font-bold text-white" data-testid="text-profit-factor">
              {stats.profitFactor >= 999 ? '∞' : stats.profitFactor.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        {/* Max Drawdown */}
        <Card className="bg-[#0f1f3a] border-[#1a2f4a]" data-testid="card-max-drawdown">
          <CardContent className="p-4 lg:p-6">
            <div className="text-gray-400 text-sm mb-2">Max Drawdown</div>
            <div className="text-2xl lg:text-3xl font-bold text-red-500" data-testid="text-max-drawdown">
              +{stats.maxDrawdown.toFixed(2)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DNA Core Intelligence Visualization */}
      <div className="mb-6">
        <Card className="bg-[#0f1f3a] border-[#1a2f4a]" data-testid="card-dna-core">
          <CardHeader>
            <CardTitle className="text-xl text-white">Trader DNA Core</CardTitle>
            <p className="text-sm text-gray-400">Real-time intelligence core showing your trading genome</p>
          </CardHeader>
          <CardContent className="p-6">
            <FloatingDNACore />
          </CardContent>
        </Card>
      </div>

      {/* Bottom Visualizations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Flow Curve */}
        <Card className="bg-[#0f1f3a] border-[#1a2f4a]" data-testid="card-flow-curve">
          <CardHeader>
            <CardTitle className="text-xl text-white">Flow Curve</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {stats.equityCurve.length > 0 ? (
              <div className="relative">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.equityCurve} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <defs>
                      <linearGradient id="flowGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#0891b2" stopOpacity={0.3} />
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <Line 
                      type="monotone" 
                      dataKey="equity" 
                      stroke="url(#flowGradient)"
                      strokeWidth={4}
                      dot={false}
                      filter="url(#glow)"
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-6 text-center">
                  <span className="text-gray-400 text-sm lg:text-base">Avg Monthly Return: </span>
                  <span className="text-cyan-400 font-bold text-base lg:text-lg">
                    {avgMonthlyReturnPercent > 0 ? '+' : ''}{avgMonthlyReturnPercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <p>No flow data available</p>
                  <p className="text-sm mt-1">Add trades to see equity flow</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Orbit Rings */}
        <Card className="bg-[#0f1f3a] border-[#1a2f4a]" data-testid="card-monthly-orbit">
          <CardHeader>
            <CardTitle className="text-xl text-white flex items-center gap-2">
              Monthly Orbit Rings
              <button 
                onClick={() => setIsInfoDialogOpen(true)}
                className="inline-flex items-center justify-center w-5 h-5 rounded-full hover:bg-cyan-400/20 transition-colors"
                data-testid="button-info-orbit"
              >
                <Info className="w-4 h-4 text-cyan-400" />
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {monthlyOrbitData.length > 0 ? (
              <div className="relative">
                {/* Custom Circular Orbit Visualization */}
                <div className="w-full h-[300px] flex items-center justify-center">
                  <svg viewBox="0 0 400 400" className="w-full h-full max-w-[400px]">
                    <defs>
                      <radialGradient id="centerGlow" cx="50%" cy="50%">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                        <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.1" />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                      </radialGradient>
                    </defs>
                    
                    {/* Background glow */}
                    <circle cx="200" cy="200" r="150" fill="url(#centerGlow)" />
                    
                    {/* Concentric circles (orbits) - one per month with data */}
                    {monthlyOrbitData.map((data, i) => {
                      // Space rings from radius 140 (outer) to 75 (inner), with even spacing
                      const totalSpan = 65; // from 140 to 75
                      const spacing = totalSpan / (monthlyOrbitData.length > 1 ? monthlyOrbitData.length - 1 : 1);
                      const radius = 140 - (i * spacing);
                      const isProfitable = data.pnl >= 0;
                      const isHovered = hoveredMonthIndex === i;
                      const baseColor = isProfitable ? "#06b6d4" : "#ef4444";
                      
                      return (
                        <g key={`orbit-${i}`}>
                          {/* Glow effect when hovered */}
                          {isHovered && (
                            <circle 
                              cx="200" 
                              cy="200" 
                              r={radius} 
                              fill="none" 
                              stroke={baseColor} 
                              strokeWidth="12" 
                              opacity="0.3" 
                              filter="blur(8px)"
                            />
                          )}
                          {/* Main ring */}
                          <circle 
                            cx="200" 
                            cy="200" 
                            r={radius} 
                            fill="none" 
                            stroke={baseColor} 
                            strokeWidth={isHovered ? "5" : "3"} 
                            opacity={isHovered ? "1" : "0.8"} 
                            style={{ 
                              transition: 'all 0.3s ease',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={() => setHoveredMonthIndex(i)}
                            onMouseLeave={() => setHoveredMonthIndex(null)}
                            onClick={() => setHoveredMonthIndex(hoveredMonthIndex === i ? null : i)}
                          />
                        </g>
                      );
                    })}
                    
                    {/* Radial lines */}
                    {Array.from({ length: 12 }, (_, i) => {
                      const angle = (i * 30 - 90) * (Math.PI / 180);
                      const x1 = 200 + 60 * Math.cos(angle);
                      const y1 = 200 + 60 * Math.sin(angle);
                      const x2 = 200 + 140 * Math.cos(angle);
                      const y2 = 200 + 140 * Math.sin(angle);
                      return (
                        <line
                          key={`line-${i}`}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="#1a2f4a"
                          strokeWidth="1"
                          opacity="0.3"
                        />
                      );
                    })}
                    
                    {/* Month labels around the perimeter */}
                    {monthlyOrbitData.slice(0, 12).map((data, i) => {
                      const angle = (i * 30 - 90) * (Math.PI / 180);
                      const radius = 160;
                      const x = 200 + radius * Math.cos(angle);
                      const y = 200 + radius * Math.sin(angle);
                      const isHovered = hoveredMonthIndex === i;
                      const isProfitable = data.pnl >= 0;
                      
                      return (
                        <g key={`month-${i}`}>
                          {/* Interactive background for better click/hover area */}
                          <circle
                            cx={x}
                            cy={y}
                            r="20"
                            fill="transparent"
                            style={{ cursor: 'pointer' }}
                            onMouseEnter={() => setHoveredMonthIndex(i)}
                            onMouseLeave={() => setHoveredMonthIndex(null)}
                            onClick={() => setHoveredMonthIndex(hoveredMonthIndex === i ? null : i)}
                          />
                          {/* Month label */}
                          <text
                            x={x}
                            y={y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className={`text-[13px] font-bold transition-all ${
                              isHovered 
                                ? (isProfitable ? 'fill-cyan-400' : 'fill-red-400')
                                : 'fill-gray-500'
                            }`}
                            fontFamily="system-ui, -apple-system, sans-serif"
                            style={{ 
                              cursor: 'pointer',
                              pointerEvents: 'none'
                            }}
                          >
                            {data.month.toUpperCase()}
                          </text>
                        </g>
                      );
                    })}
                    
                    {/* Center circle - Best month */}
                    <circle cx="200" cy="200" r="65" fill="none" stroke="#06b6d4" strokeWidth="2" opacity="0.8" />
                    <circle cx="200" cy="200" r="50" fill="none" stroke="#06b6d4" strokeWidth="2" opacity="0.6" />
                    
                    {/* Center text - shows hovered month info or best month */}
                    {hoveredMonthIndex !== null ? (
                      <>
                        <text
                          x="200"
                          y="180"
                          textAnchor="middle"
                          className="text-[16px] fill-white font-normal"
                          fontFamily="system-ui, -apple-system, sans-serif"
                        >
                          {monthlyOrbitData[hoveredMonthIndex].fullMonth}
                        </text>
                        <text
                          x="200"
                          y="205"
                          textAnchor="middle"
                          className={`text-[22px] font-bold ${
                            monthlyOrbitData[hoveredMonthIndex].pnl >= 0 ? 'fill-cyan-400' : 'fill-red-400'
                          }`}
                          fontFamily="system-ui, -apple-system, sans-serif"
                        >
                          {monthlyOrbitData[hoveredMonthIndex].pnl > 0 ? '+' : ''}{((monthlyOrbitData[hoveredMonthIndex].pnl / (stats.totalPnL || 1)) * 100).toFixed(1)}%
                        </text>
                        <text
                          x="200"
                          y="225"
                          textAnchor="middle"
                          className="text-[14px] fill-gray-400"
                          fontFamily="system-ui, -apple-system, sans-serif"
                        >
                          {formatCurrency(monthlyOrbitData[hoveredMonthIndex].pnl)}
                        </text>
                      </>
                    ) : (
                      <>
                        <text
                          x="200"
                          y="190"
                          textAnchor="middle"
                          className="text-[18px] fill-white font-normal"
                          fontFamily="system-ui, -apple-system, sans-serif"
                        >
                          {stats.bestMonthName.split(' ')[0]}
                        </text>
                        <text
                          x="200"
                          y="215"
                          textAnchor="middle"
                          className="text-[20px] fill-cyan-400 font-bold"
                          fontFamily="system-ui, -apple-system, sans-serif"
                        >
                          {stats.bestMonth > 0 ? '+' : ''}{((stats.bestMonth / (stats.totalPnL || 1)) * 100).toFixed(1)}%
                        </text>
                      </>
                    )}
                  </svg>
                </div>
                
                <div className="mt-6 text-center space-y-2">
                  <div>
                    <span className="text-gray-400 text-sm lg:text-base">Best Month: </span>
                    <span className="text-white font-bold text-base lg:text-lg">
                      {formatCurrency(stats.bestMonth)} ({stats.bestMonthName})
                    </span>
                  </div>
                  <div className="text-gray-500 text-xs">
                    Showing {monthlyOrbitData.length} month{monthlyOrbitData.length !== 1 ? 's' : ''} with trade data
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <p>No monthly data available</p>
                  <p className="text-sm mt-1">Add trades to see monthly orbit</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Dialog */}
      <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
        <DialogContent className="bg-[#0f1f3a] border-[#1a2f4a] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-cyan-400 mb-2">Monthly Orbit Rings</DialogTitle>
            <DialogDescription className="text-gray-300 text-base">
              Visualize your monthly trading performance at a glance.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 text-gray-300">
            <div>
              <p className="leading-relaxed">
                Each orbit ring represents one month of trading activity — the closer to the center, the more recent the month.
              </p>
            </div>
            
            <div>
              <p className="leading-relaxed">
                Hover over any month to highlight its ring and reveal that month's profit percentage.
              </p>
            </div>
            
            <div>
              <p className="leading-relaxed">
                The center value shows your current month's performance (updated live).
              </p>
            </div>
            
            <div>
              <p className="leading-relaxed">
                The best-performing month is displayed below for quick reference.
              </p>
            </div>
            
            <div className="pt-4 border-t border-gray-700">
              <h3 className="text-lg font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                💡 Why it helps
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-white mb-1">Spot momentum:</p>
                  <p className="text-sm leading-relaxed">
                    See instantly whether your performance is improving month-to-month. Expanding inner rings show growing returns; contracting or red rings warn of slowdown.
                  </p>
                </div>
                
                <div>
                  <p className="font-semibold text-white mb-1">Pattern recognition:</p>
                  <p className="text-sm leading-relaxed">
                    Notice seasonal or session-based trends in your consistency.
                  </p>
                </div>
                
                <div>
                  <p className="font-semibold text-white mb-1">Goal tracking:</p>
                  <p className="text-sm leading-relaxed">
                    Use the central ring as your "target orbit." Each new month aims to move further outward with higher percentage growth.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-700">
              <h3 className="text-lg font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                🧭 Quick tips
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-white mb-1">Hover a ring:</p>
                  <p className="text-sm leading-relaxed">
                    Highlights the month and shows its % gain/loss.
                  </p>
                </div>
                
                <div>
                  <p className="font-semibold text-white mb-1">Compare ring thickness:</p>
                  <p className="text-sm leading-relaxed">
                    Thicker, brighter rings = stronger consistency.
                  </p>
                </div>
                
                <div>
                  <p className="font-semibold text-white mb-1">Use it with your DNA Score:</p>
                  <p className="text-sm leading-relaxed">
                    Rising orbit performance usually aligns with higher Edge Integrity — both metrics feed each other.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
