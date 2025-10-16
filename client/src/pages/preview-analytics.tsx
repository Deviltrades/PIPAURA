import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info, BarChart3, Heart, Smile, Zap } from "lucide-react";
import { SessionInsights } from "@/components/SessionInsights";
import { 
  LineChart, 
  Line, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { demoTrades, demoAnalytics, demoAccounts, demoEmotionalLogs } from "@/lib/demo-data";

interface PreviewDNACoreProps {
  metrics: {
    winRate: number;
    riskReward: number;
    riskConsistency: number;
    emotionalControl: number;
    discipline: number;
    sessionFocus: number;
    edgeIntegrity: number;
  };
  onInfoClick: () => void;
}

function PreviewDNACore({ metrics, onInfoClick }: PreviewDNACoreProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [rotationPhase, setRotationPhase] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const prefersReducedMotion = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || isPaused) return;

    let animationFrameId: number;
    let lastTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      setRotationPhase((prev) => (prev + (deltaTime / 14000) * 360) % 360);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused, prefersReducedMotion]);

  const ZONE_COLORS = {
    win: '#00E5FF',
    rr: '#4DA3FF',
    risk: '#8E6BFF',
    emotion: '#FF3DF0',
    discipline: '#FFB000',
    session: '#2AD6C6',
  };

  const dnaZones = [
    { name: 'Win Rate', key: 'win', value: metrics.winRate, color: ZONE_COLORS.win, yPosition: -266 },
    { name: 'Risk:Reward', key: 'rr', value: metrics.riskReward, color: ZONE_COLORS.rr, yPosition: -160 },
    { name: 'Risk Consistency', key: 'risk', value: metrics.riskConsistency, color: ZONE_COLORS.risk, yPosition: -53 },
    { name: 'Emotional Control', key: 'emotion', value: metrics.emotionalControl, color: ZONE_COLORS.emotion, yPosition: 53 },
    { name: 'Discipline', key: 'discipline', value: metrics.discipline, color: ZONE_COLORS.discipline, yPosition: 160 },
    { name: 'Session Focus', key: 'session', value: metrics.sessionFocus, color: ZONE_COLORS.session, yPosition: 266 },
  ];

  const DNA_TOP = -320;
  const DNA_BOTTOM = 320;
  const DNA_HEIGHT = DNA_BOTTOM - DNA_TOP;

  const getZoneColorAtY = (y: number) => {
    const normalizedY = (y - DNA_TOP) / DNA_HEIGHT;
    const zoneIndex = Math.floor(normalizedY * 6);
    const clampedIndex = Math.max(0, Math.min(5, zoneIndex));
    return dnaZones[clampedIndex].color;
  };

  const generateDNAPoints = (strandOffset: number, radius: number) => {
    const points = [];
    const numPoints = 80;
    for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1);
      const y = (t - 0.5) * 640;
      const angle = ((t * 720) + rotationPhase + strandOffset) * Math.PI / 180;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      points.push({ x, y, z });
    }
    return points;
  };

  const strand1Outer = generateDNAPoints(0, 110);
  const strand1Inner = generateDNAPoints(0, 85);
  const strand2Outer = generateDNAPoints(180, 110);
  const strand2Inner = generateDNAPoints(180, 85);

  const createSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length - 2; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      path += ` Q ${points[i].x} ${points[i].y} ${xc} ${yc}`;
    }
    
    const lastPoint = points[points.length - 1];
    const secondLastPoint = points[points.length - 2];
    path += ` Q ${secondLastPoint.x} ${secondLastPoint.y} ${lastPoint.x} ${lastPoint.y}`;
    
    return path;
  };

  return (
    <div className="w-full h-[520px] md:h-screen relative overflow-hidden bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 rounded-lg">
      <svg
        className="w-full h-full"
        viewBox="0 0 800 700"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="dnaFlowGradient" x1="0" y1="-320" x2="0" y2="320" gradientUnits="userSpaceOnUse">
            {dnaZones.map((zone, i) => {
              const zoneStart = (i / 6) * 100;
              const zoneEnd = ((i + 1) / 6) * 100;
              const fillPercent = zone.value / 100;
              const colorStart = zoneStart + (1 - fillPercent) * (zoneEnd - zoneStart);
              
              return [
                <stop key={`${zone.key}-unfilled`} offset={`${zoneStart}%`} stopColor="rgba(220,230,240,0.7)" />,
                <stop key={`${zone.key}-transition`} offset={`${colorStart}%`} stopColor="rgba(220,230,240,0.7)" />,
                <stop key={`${zone.key}-filled`} offset={`${colorStart}%`} stopColor={zone.color} />,
                <stop key={`${zone.key}-end`} offset={`${zoneEnd}%`} stopColor={zone.color} />
              ];
            }).flat()}
          </linearGradient>

          <filter id="strongGlow">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g 
          transform="translate(400, 300)"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <motion.g
            animate={{
              scale: [1, 1.02, 1],
              opacity: [0.95, 1, 0.95]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <path
              d={createSmoothPath(strand1Outer)}
              stroke="url(#dnaFlowGradient)"
              strokeWidth="5"
              fill="none"
              opacity={0.95}
              filter="url(#strongGlow)"
              strokeLinecap="round"
            />
            <path
              d={createSmoothPath(strand1Inner)}
              stroke="url(#dnaFlowGradient)"
              strokeWidth="5"
              fill="none"
              opacity={0.95}
              filter="url(#strongGlow)"
              strokeLinecap="round"
            />
            <path
              d={createSmoothPath(strand2Outer)}
              stroke="url(#dnaFlowGradient)"
              strokeWidth="5"
              fill="none"
              opacity={0.95}
              filter="url(#strongGlow)"
              strokeLinecap="round"
            />
            <path
              d={createSmoothPath(strand2Inner)}
              stroke="url(#dnaFlowGradient)"
              strokeWidth="5"
              fill="none"
              opacity={0.95}
              filter="url(#strongGlow)"
              strokeLinecap="round"
            />
          </motion.g>

          {Array.from({ length: 18 }).map((_, i) => {
            const yPosition = (i / 17 - 0.5) * 450;
            
            const point1 = strand1Inner.reduce((closest, point) => 
              Math.abs(point.y - yPosition) < Math.abs(closest.y - yPosition) ? point : closest
            , strand1Inner[0]);
            
            const point2 = strand2Inner.reduce((closest, point) => 
              Math.abs(point.y - yPosition) < Math.abs(closest.y - yPosition) ? point : closest
            , strand2Inner[0]);
            
            const zoneColor = getZoneColorAtY(yPosition);

            return (
              <line
                key={`rung-${i}`}
                x1={point1.x}
                y1={point1.y}
                x2={point2.x}
                y2={point2.y}
                stroke={zoneColor}
                strokeWidth={6}
                opacity={1}
                strokeLinecap="round"
              />
            );
          })}
        </g>
      </svg>

      <motion.div
        className="absolute top-2 left-2 right-2 md:top-8 md:left-8 md:right-auto bg-slate-900/80 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-2 md:p-3"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 md:space-y-1.5 md:flex md:flex-col">
          {dnaZones.map((metric, index) => (
            <motion.div
              key={metric.key}
              className="flex items-center gap-1 md:gap-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
            >
              <div
                className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: metric.color, boxShadow: `0 0 4px ${metric.color}` }}
              />
              <div className="flex items-baseline gap-1 md:gap-2 min-w-0 md:min-w-[140px]">
                <span className="text-white text-[9px] md:text-xs font-semibold flex-1 truncate">
                  {metric.name}
                </span>
                <span
                  className="text-[10px] md:text-sm font-bold"
                  style={{ color: metric.color }}
                >
                  {metric.value.toFixed(0)}%
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        className="absolute top-[90px] left-2 md:top-[260px] md:left-8 bg-slate-950/90 backdrop-blur-sm border border-cyan-500/30 rounded-lg px-2 py-1.5 md:px-4 md:py-2 text-center max-h-[60px] md:max-h-[80px] max-w-[100px] md:max-w-none"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.5 }}
      >
        <button 
          onClick={onInfoClick}
          className="absolute top-1 right-1 text-cyan-400/60 hover:text-cyan-400 transition-colors"
        >
          <Info className="w-3 h-3 md:w-3.5 md:h-3.5" />
        </button>

        <div className="text-[9px] md:text-xs font-semibold text-cyan-400 mb-0.5 leading-none mt-3 md:mt-4">
          EDGE INTEGRITY SCORE
        </div>
        <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent leading-none">
          {metrics.edgeIntegrity.toFixed(1)}%
        </div>
      </motion.div>

      <div className="absolute top-1/2 left-1/2">
        {dnaZones.map((metric, index) => {
          const compressedYPosition = metric.yPosition * 0.85;
          const mobileCompressedPosition = metric.yPosition * 0.47;
          const topPosition = isMobile ? mobileCompressedPosition - 35 : compressedYPosition - 35;
          
          return (
            <motion.div
              key={`right-${metric.key}`}
              className="absolute bg-slate-950/90 backdrop-blur-sm border border-cyan-500/30 rounded-lg px-2 py-1 md:px-3 md:py-1.5 text-center"
              style={{
                top: `${topPosition}px`,
                left: isMobile ? '90px' : '160px',
                transform: 'translateY(-50%)'
              }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
            >
              <div
                className="text-[10px] md:text-sm font-bold whitespace-nowrap"
                style={{ color: metric.color }}
              >
                {metric.value.toFixed(0)}%
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-950/80 backdrop-blur-sm border border-cyan-500/20 rounded-lg px-3 py-1.5 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 2 }}
      >
        <p className="text-[9px] md:text-xs text-cyan-400/70 whitespace-nowrap">
          {isMobile ? 'Tap to pause' : 'Hover to pause'}
        </p>
      </motion.div>
    </div>
  );
}

export default function PreviewAnalytics() {
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(null);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const selectedAccount = demoAccounts[0].id;

  const stats = {
    totalPnL: demoAnalytics.totalPnL,
    winRate: demoAnalytics.winRate,
    profitFactor: demoAnalytics.profitFactor,
    maxDrawdown: demoAnalytics.maxDrawdown,
    equityCurve: [
      { date: "Jan 15", balance: 11750 },
      { date: "Jan 16", balance: 12450 },
      { date: "Jan 17", balance: 12085 },
      { date: "Jan 18", balance: 14185 },
      { date: "Jan 19", balance: 14835 },
      { date: "Jan 20", balance: 14835 }
    ],
    monthlyPerformance: [
      { month: "Jan 2025", pnl: 4835, trades: 6 }
    ],
    averageMonthlyReturn: 4835,
    bestMonth: 4835,
    bestMonthName: 'Jan 2025'
  };

  // Calculate DNA Core metrics from demo data
  const dnaMetrics = useMemo(() => {
    const winRate = demoAnalytics.winRate;
    const profitFactor = demoAnalytics.profitFactor;
    const riskReward = Math.min((profitFactor / 2) * 100, 100);
    const riskConsistency = Math.max(0, 100 - (demoAnalytics.maxDrawdownPercent || 0));
    
    // Calculate emotional control from emotional logs
    const avgMood = demoEmotionalLogs.reduce((sum, log) => sum + log.mood, 0) / demoEmotionalLogs.length;
    const moodVariance = demoEmotionalLogs.reduce((sum, log) => sum + Math.pow(log.mood - avgMood, 2), 0) / demoEmotionalLogs.length;
    const moodVolatility = Math.sqrt(moodVariance);
    const emotionalControl = Math.max(0, 100 - (moodVolatility * 15));
    
    const discipline = Math.max(1, 100 - (demoAnalytics.maxDrawdownPercent || 0));
    
    // Calculate session focus
    const sessionStats: { [key: string]: { pnl: number; count: number } } = {};
    demoTrades.forEach(trade => {
      const session = trade.session_tag || 'Unknown';
      if (!sessionStats[session]) {
        sessionStats[session] = { pnl: 0, count: 0 };
      }
      sessionStats[session].pnl += trade.pnl;
      sessionStats[session].count++;
    });
    
    const totalPnL = Math.abs(demoAnalytics.totalPnL);
    const bestSessionPnL = Math.max(...Object.values(sessionStats).map(s => Math.abs(s.pnl)));
    const sessionFocus = (bestSessionPnL / totalPnL) * 100;
    
    const edgeIntegrity = (winRate + riskReward + riskConsistency + emotionalControl + discipline + sessionFocus) / 6;
    
    return {
      winRate,
      riskReward,
      riskConsistency,
      emotionalControl,
      discipline,
      sessionFocus,
      edgeIntegrity
    };
  }, []);

  const radarData = [
    { metric: 'Win Rate', value: dnaMetrics.winRate, fullMark: 100 },
    { metric: 'Risk/Reward', value: dnaMetrics.riskReward, fullMark: 100 },
    { metric: 'Consistency', value: dnaMetrics.riskConsistency, fullMark: 100 },
    { metric: 'Emotional', value: dnaMetrics.emotionalControl, fullMark: 100 },
    { metric: 'Discipline', value: dnaMetrics.discipline, fullMark: 100 },
    { metric: 'Focus', value: dnaMetrics.sessionFocus, fullMark: 100 },
  ];

  // Prepare emotional analytics data
  const emotionalChartData = demoEmotionalLogs.map(log => {
    // Find trades on this date
    const tradesOnDate = demoTrades.filter(t => 
      new Date(t.entry_date).toISOString().split('T')[0] === log.log_date
    );
    const pnl = tradesOnDate.reduce((sum, t) => sum + t.pnl, 0);
    
    return {
      date: log.log_date,
      mood: log.mood,
      energy: log.energy,
      pnl: pnl,
      result: pnl >= 0 ? 'Win' : 'Loss'
    };
  });

  const avgMonthlyReturnPercent = (stats.averageMonthlyReturn / 10000) * 100;

  const monthlyOrbitData = stats.monthlyPerformance.map(m => ({
    month: m.month.split(' ')[0],
    value: Math.abs(m.pnl),
    pnl: m.pnl,
    fullMonth: m.month
  }));

  const currentMonth = "Jan";

  return (
    <div className="p-4 lg:p-8 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Advanced Analytics</h1>
            <p className="text-gray-300">Deep dive into your trading performance</p>
          </div>
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-4 py-2">
            <p className="text-sm text-cyan-400">📊 Preview Mode - Demo Data</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="dna" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="dna" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Trader DNA Core
          </TabsTrigger>
          <TabsTrigger value="session" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Session Insights
          </TabsTrigger>
          <TabsTrigger value="emotional" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Emotional Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dna" className="space-y-6">
          {/* Trader DNA Core - Full Height Helix */}
          <PreviewDNACore metrics={dnaMetrics} onInfoClick={() => setIsInfoDialogOpen(true)} />

          {/* Equity Curve */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Equity Curve</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.equityCurve}>
                  <Line 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="hsl(188, 94%, 60%)" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(188, 94%, 60%)", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-sm text-slate-400">Total P&L</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-500">{formatCurrency(stats.totalPnL)}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-sm text-slate-400">Win Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">{stats.winRate.toFixed(1)}%</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-sm text-slate-400">Profit Factor</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">{stats.profitFactor.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-sm text-slate-400">Max Drawdown</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-500">{formatCurrency(stats.maxDrawdown)}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="session">
          <SessionInsights trades={demoTrades} />
        </TabsContent>

        <TabsContent value="emotional" className="space-y-6">
          {/* Emotional Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                  <Smile className="w-4 h-4" />
                  Average Mood
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-cyan-400">
                  {(demoEmotionalLogs.reduce((sum, log) => sum + log.mood, 0) / demoEmotionalLogs.length).toFixed(1)}/10
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Average Energy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-cyan-400">
                  {(demoEmotionalLogs.reduce((sum, log) => sum + log.energy, 0) / demoEmotionalLogs.length).toFixed(1)}/10
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Total Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">{demoEmotionalLogs.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Mood vs Performance Chart */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Mood & Energy Correlation</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="mood" 
                    name="Mood" 
                    stroke="#64748b"
                    tick={{ fill: '#64748b' }}
                    label={{ value: 'Mood', position: 'bottom', fill: '#64748b' }}
                  />
                  <YAxis 
                    dataKey="energy" 
                    name="Energy" 
                    stroke="#64748b"
                    tick={{ fill: '#64748b' }}
                    label={{ value: 'Energy', angle: -90, position: 'left', fill: '#64748b' }}
                  />
                  <ZAxis dataKey="pnl" range={[50, 400]} />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value: any, name: string) => {
                      if (name === 'P&L') return formatCurrency(value);
                      return value;
                    }}
                  />
                  <Scatter 
                    data={emotionalChartData} 
                    fill="hsl(188, 94%, 60%)"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Mood Trend */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Mood & Energy Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={emotionalChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#64748b"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="mood" 
                    stroke="hsl(188, 94%, 60%)" 
                    strokeWidth={2}
                    name="Mood"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="energy" 
                    stroke="hsl(280, 94%, 60%)" 
                    strokeWidth={2}
                    name="Energy"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Emotional Logs List */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Emotional Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {demoEmotionalLogs.map((log) => (
                  <div key={log.id} className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-4">
                        <div>
                          <p className="text-xs text-slate-500">Mood</p>
                          <p className="text-lg font-bold text-cyan-400">{log.mood}/10</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Energy</p>
                          <p className="text-lg font-bold text-purple-400">{log.energy}/10</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-400">{log.log_date}</p>
                    </div>
                    <div className="flex gap-2 mb-2">
                      {log.tags.map((tag, idx) => (
                        <span key={idx} className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                    {log.notes && (
                      <p className="text-sm text-slate-300 italic">"{log.notes}"</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Info Dialog */}
      <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trader DNA Core Metrics</DialogTitle>
            <DialogDescription>
              Understanding your trading DNA
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-1">Edge Integrity</h4>
              <p className="text-slate-400">Overall measure of your trading edge</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Emotional Control</h4>
              <p className="text-slate-400">How well you manage emotions while trading</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Session Focus</h4>
              <p className="text-slate-400">Consistency in your best trading sessions</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
