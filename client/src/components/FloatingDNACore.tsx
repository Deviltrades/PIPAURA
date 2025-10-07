import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getTrades, getAnalytics } from "@/lib/supabase-service";
import { useQuery } from "@tanstack/react-query";

interface TraderMetrics {
  winRate: number;
  avgRiskReward: number;
  riskConsistency: number;
  emotionalControl: number;
  discipline: number;
  sessionFocus: number;
  edgeIntegrity: number;
}

interface OrbitingMetric {
  name: string;
  value: number;
  angle: number;
  color: string;
}

export function FloatingDNACore() {
  const [metrics, setMetrics] = useState<TraderMetrics>({
    winRate: 0,
    avgRiskReward: 0,
    riskConsistency: 0,
    emotionalControl: 0,
    discipline: 0,
    sessionFocus: 0,
    edgeIntegrity: 0,
  });

  // Fetch trades and analytics data
  const { data: trades } = useQuery({
    queryKey: ['/api/trades'],
    queryFn: getTrades,
    refetchInterval: 5000, // Real-time updates every 5 seconds
  });

  const { data: analytics } = useQuery({
    queryKey: ['/api/analytics'],
    queryFn: getAnalytics,
  });

  useEffect(() => {
    if (trades && analytics) {
      calculateMetrics(trades, analytics);
    }
  }, [trades, analytics]);

  const calculateMetrics = (tradesData: any[], analyticsData: any) => {
    const closedTrades = tradesData.filter(t => t.status === 'CLOSED' && t.pnl !== null);
    
    if (closedTrades.length === 0) {
      setMetrics({
        winRate: 0,
        avgRiskReward: 0,
        riskConsistency: 0,
        emotionalControl: 0,
        discipline: 0,
        sessionFocus: 0,
        edgeIntegrity: 0,
      });
      return;
    }

    // Win Rate (0-100%)
    const winningTrades = closedTrades.filter(t => parseFloat(t.pnl) > 0);
    const winRate = (winningTrades.length / closedTrades.length) * 100;

    // Average Risk:Reward
    let totalRR = 0;
    let rrCount = 0;
    closedTrades.forEach(trade => {
      const entry = parseFloat(trade.entry_price);
      const exit = parseFloat(trade.exit_price || 0);
      const sl = parseFloat(trade.stop_loss || 0);
      const tp = parseFloat(trade.take_profit || 0);
      
      if (entry && sl && tp) {
        const risk = Math.abs(entry - sl);
        const reward = Math.abs(tp - entry);
        if (risk > 0) {
          totalRR += reward / risk;
          rrCount++;
        }
      }
    });
    const avgRiskReward = rrCount > 0 ? Math.min((totalRR / rrCount) * 20, 100) : 0; // Scale to 0-100

    // Risk Consistency (based on position size variance)
    const positionSizes = closedTrades.map(t => parseFloat(t.position_size));
    const avgSize = positionSizes.reduce((a, b) => a + b, 0) / positionSizes.length;
    const variance = positionSizes.reduce((sum, size) => sum + Math.pow(size - avgSize, 2), 0) / positionSizes.length;
    const stdDev = Math.sqrt(variance);
    const riskConsistency = avgSize > 0 ? Math.max(0, 100 - (stdDev / avgSize) * 100) : 0;

    // Emotional Control (based on adherence to stop loss and take profit)
    let adheredToStopLoss = 0;
    closedTrades.forEach(trade => {
      const pnl = parseFloat(trade.pnl);
      const entry = parseFloat(trade.entry_price);
      const exit = parseFloat(trade.exit_price || 0);
      const sl = parseFloat(trade.stop_loss || 0);
      
      if (pnl < 0 && sl && entry && exit) {
        // Check if exit was near stop loss (within 10%)
        const expectedLoss = Math.abs(entry - sl);
        const actualLoss = Math.abs(entry - exit);
        if (Math.abs(actualLoss - expectedLoss) / expectedLoss < 0.1) {
          adheredToStopLoss++;
        }
      } else if (pnl < 0) {
        // No stop loss but took loss - not good
      } else {
        // Winning trade - good emotional control
        adheredToStopLoss += 0.5;
      }
    });
    const emotionalControl = (adheredToStopLoss / closedTrades.length) * 100;

    // Discipline (trades with notes and proper setup)
    const tradesWithNotes = closedTrades.filter(t => t.notes && t.notes.length > 20);
    const discipline = (tradesWithNotes.length / closedTrades.length) * 100;

    // Session Focus (based on trading during specific sessions)
    // For now, using a placeholder calculation
    const sessionFocus = Math.min(100, closedTrades.length * 5);

    // Edge Integrity (composite score: weighted average)
    const edgeIntegrity = (
      winRate * 0.25 +
      avgRiskReward * 0.20 +
      riskConsistency * 0.15 +
      emotionalControl * 0.20 +
      discipline * 0.15 +
      sessionFocus * 0.05
    );

    setMetrics({
      winRate,
      avgRiskReward,
      riskConsistency,
      emotionalControl,
      discipline,
      sessionFocus,
      edgeIntegrity,
    });
  };

  // Orbiting metrics configuration
  const orbitingMetrics: OrbitingMetric[] = [
    { name: "Win Rate", value: metrics.winRate, angle: 0, color: "#10b981" },
    { name: "Avg R:R", value: metrics.avgRiskReward, angle: 60, color: "#3b82f6" },
    { name: "Risk Consistency", value: metrics.riskConsistency, angle: 120, color: "#8b5cf6" },
    { name: "Emotional Control", value: metrics.emotionalControl, angle: 180, color: "#ec4899" },
    { name: "Discipline", value: metrics.discipline, angle: 240, color: "#f59e0b" },
    { name: "Session Focus", value: metrics.sessionFocus, angle: 300, color: "#06b6d4" },
  ];

  // DNA helix color - blue/cyan with intensity based on Edge Integrity
  const getHelixColor = (integrity: number) => {
    // Brighter cyan/blue when integrity is higher
    const intensity = 0.5 + (integrity / 100) * 0.5; // 0.5 to 1.0
    const cyan = Math.round(220 * intensity);
    const blue = Math.round(255 * intensity);
    return `rgb(0, ${cyan}, ${blue})`;
  };

  const helixColor = getHelixColor(metrics.edgeIntegrity);

  return (
    <div className="relative w-full h-[600px] flex items-center justify-center bg-gradient-to-b from-background via-background/95 to-background overflow-hidden rounded-lg border border-border/50">
      {/* DNA Core Container */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 800 600"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Enhanced glow filters for cyan/blue DNA */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="strongGlow">
            <feGaussianBlur stdDeviation="8" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* DNA Double Helix */}
        <g transform="translate(400, 300)">
          {/* Draw helix strands */}
          {Array.from({ length: 12 }).map((_, i) => {
            const y = (i - 5.5) * 40;
            const phase1 = (i * 30) % 360;
            const phase2 = (phase1 + 180) % 360;
            const x1 = Math.sin((phase1 * Math.PI) / 180) * 60;
            const x2 = Math.sin((phase2 * Math.PI) / 180) * 60;
            
            return (
              <g key={i}>
                {/* Connecting rung */}
                <motion.line
                  x1={x1}
                  y1={y}
                  x2={x2}
                  y2={y}
                  stroke={helixColor}
                  strokeWidth="2"
                  opacity={0.7}
                  filter="url(#glow)"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.7 }}
                  transition={{ duration: 1, delay: i * 0.1 }}
                />
                
                {/* Left strand node */}
                <motion.circle
                  cx={x1}
                  cy={y}
                  r="6"
                  fill={helixColor}
                  filter="url(#strongGlow)"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                />
                
                {/* Right strand node */}
                <motion.circle
                  cx={x2}
                  cy={y}
                  r="6"
                  fill={helixColor}
                  filter="url(#strongGlow)"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                />
              </g>
            );
          })}

          {/* Helix connecting curves */}
          <motion.path
            d={`M ${Math.sin(0) * 60} -220 Q ${Math.sin(45 * Math.PI / 180) * 60} -180, ${Math.sin(90 * Math.PI / 180) * 60} -140 T ${Math.sin(180 * Math.PI / 180) * 60} -60 T ${Math.sin(270 * Math.PI / 180) * 60} 20 T ${Math.sin(360 * Math.PI / 180) * 60} 100 T ${Math.sin(450 * Math.PI / 180) * 60} 180 T ${Math.sin(540 * Math.PI / 180) * 60} 260`}
            stroke={helixColor}
            strokeWidth="4"
            fill="none"
            opacity={0.9}
            filter="url(#strongGlow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
          
          <motion.path
            d={`M ${Math.sin(180 * Math.PI / 180) * 60} -220 Q ${Math.sin(225 * Math.PI / 180) * 60} -180, ${Math.sin(270 * Math.PI / 180) * 60} -140 T ${Math.sin(360 * Math.PI / 180) * 60} -60 T ${Math.sin(450 * Math.PI / 180) * 60} 20 T ${Math.sin(540 * Math.PI / 180) * 60} 100 T ${Math.sin(630 * Math.PI / 180) * 60} 180 T ${Math.sin(720 * Math.PI / 180) * 60} 260`}
            stroke={helixColor}
            strokeWidth="4"
            fill="none"
            opacity={0.9}
            filter="url(#strongGlow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeInOut", delay: 0.2 }}
          />
        </g>

        {/* Orbiting Metrics */}
        {orbitingMetrics.map((metric, index) => {
          const orbitRadius = 250;
          const angle = metric.angle + (Date.now() / 50) % 360; // Slow rotation
          const x = 400 + Math.cos((angle * Math.PI) / 180) * orbitRadius;
          const y = 300 + Math.sin((angle * Math.PI) / 180) * orbitRadius;
          
          // Connection point on helix
          const helixIndex = index * 2;
          const helixY = (helixIndex - 5.5) * 40;
          const helixPhase = (helixIndex * 30) % 360;
          const helixX = 400 + Math.sin((helixPhase * Math.PI) / 180) * 60;
          const helixYAbs = 300 + helixY;
          
          const dotSize = 8 + (metric.value / 100) * 12; // 8-20px
          const beamOpacity = 0.2 + (metric.value / 100) * 0.4; // 0.2-0.6

          return (
            <g key={metric.name}>
              {/* Connecting beam */}
              <motion.line
                x1={helixX}
                y1={helixYAbs}
                x2={x}
                y2={y}
                stroke={metric.color}
                strokeWidth="1.5"
                opacity={beamOpacity}
                filter="url(#glow)"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, delay: index * 0.2 }}
              />

              {/* Orbiting dot */}
              <motion.g
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  opacity: 1,
                  x: [0, Math.cos((angle * Math.PI) / 180) * 10, 0],
                  y: [0, Math.sin((angle * Math.PI) / 180) * 10, 0],
                }}
                transition={{ 
                  scale: { duration: 0.5, delay: index * 0.1 },
                  opacity: { duration: 0.5, delay: index * 0.1 },
                  x: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                  y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                }}
              >
                <circle
                  cx={x}
                  cy={y}
                  r={dotSize}
                  fill={metric.color}
                  filter="url(#strongGlow)"
                />
                
                {/* Metric label */}
                <text
                  x={x}
                  y={y - dotSize - 10}
                  textAnchor="middle"
                  fill={metric.color}
                  fontSize="12"
                  fontWeight="600"
                  filter="url(#glow)"
                >
                  {metric.name}
                </text>
                <text
                  x={x}
                  y={y - dotSize - 22}
                  textAnchor="middle"
                  fill="white"
                  fontSize="14"
                  fontWeight="700"
                >
                  {metric.value.toFixed(0)}%
                </text>
              </motion.g>
            </g>
          );
        })}
      </svg>

      {/* Edge Integrity Score Display */}
      <motion.div
        className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1 }}
      >
        <div className="text-sm font-medium text-muted-foreground mb-1">
          Edge Integrity
        </div>
        <div 
          className="text-5xl font-bold"
          style={{ 
            color: helixColor,
            textShadow: `0 0 20px ${helixColor}`,
          }}
        >
          {metrics.edgeIntegrity.toFixed(1)}%
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Trader Genome Score
        </div>
      </motion.div>

      {/* Loading state */}
      {(!trades || trades.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-muted-foreground mb-2">Analyzing trade data...</div>
            <div className="text-sm text-muted-foreground/60">Add trades to see your DNA Core</div>
          </div>
        </div>
      )}
    </div>
  );
}
