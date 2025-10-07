import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { getTrades, getAnalytics } from '@/lib/supabase-service';
import { Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function FloatingDNACore() {
  const [metrics, setMetrics] = useState({
    winRate: 0,
    riskReward: 0,
    riskConsistency: 0,
    emotionalControl: 0,
    discipline: 0,
    sessionFocus: 0,
    edgeIntegrity: 0,
  });

  const [isPaused, setIsPaused] = useState(false);
  const [rotationPhase, setRotationPhase] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Animate rotation phase for helix spinning
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

  // Fetch analytics data which contains all the metrics we need
  const { data: analytics } = useQuery({
    queryKey: ['analytics'],
    queryFn: getAnalytics,
  });

  useEffect(() => {
    if (analytics) {
      // Calculate metrics from analytics data
      const winRate = analytics.winRate || 0;
      const profitFactor = analytics.profitFactor || 0;
      const riskReward = Math.min((profitFactor / 2) * 100, 100); // Convert profit factor to 0-100 scale
      
      // Use analytics data to derive trader performance metrics
      const riskConsistency = Math.max(0, 100 - (analytics.maxDrawdown || 0)); // Lower drawdown = higher consistency
      const emotionalControl = winRate > 50 ? Math.min(winRate * 1.2, 100) : winRate * 0.8; // Bonus for winning
      const discipline = analytics.totalTrades > 10 ? Math.min((analytics.totalTrades / 100) * 50 + 50, 100) : 50;
      const sessionFocus = analytics.monthlyPerformance?.length > 0 ? Math.min(analytics.monthlyPerformance.length * 20, 100) : 0;
      
      // Edge Integrity is the composite score
      const edgeIntegrity = (winRate + riskReward + riskConsistency + emotionalControl + discipline + sessionFocus) / 6;

      setMetrics({
        winRate,
        riskReward,
        riskConsistency,
        emotionalControl,
        discipline,
        sessionFocus,
        edgeIntegrity,
      });
    }
  }, [analytics]);

  // DNA Zone colors - each metric gets its own color zone
  const ZONE_COLORS = {
    win: '#00E5FF',        // Cyan
    rr: '#4DA3FF',         // Blue
    risk: '#8E6BFF',       // Violet
    emotion: '#FF3DF0',    // Magenta
    discipline: '#FFB000', // Amber
    session: '#2AD6C6',    // Aqua
  };

  // 6 zones from top to bottom - EXTENDED VERTICALLY
  const dnaZones = [
    { name: 'Win Rate', key: 'win', value: metrics.winRate, color: ZONE_COLORS.win, yPosition: -266 },
    { name: 'Risk:Reward', key: 'rr', value: metrics.riskReward, color: ZONE_COLORS.rr, yPosition: -160 },
    { name: 'Risk Consistency', key: 'risk', value: metrics.riskConsistency, color: ZONE_COLORS.risk, yPosition: -53 },
    { name: 'Emotional Control', key: 'emotion', value: metrics.emotionalControl, color: ZONE_COLORS.emotion, yPosition: 53 },
    { name: 'Discipline', key: 'discipline', value: metrics.discipline, color: ZONE_COLORS.discipline, yPosition: 160 },
    { name: 'Session Focus', key: 'session', value: metrics.sessionFocus, color: ZONE_COLORS.session, yPosition: 266 },
  ];

  // DNA zone dimensions - EXTENDED VERTICALLY
  const DNA_TOP = -320;
  const DNA_BOTTOM = 320;
  const DNA_HEIGHT = DNA_BOTTOM - DNA_TOP; // 640
  const ZONE_HEIGHT = DNA_HEIGHT / 6; // ~107 each

  // Get smooth flowing color based on Y position (for gradient with fill logic)
  const getFlowingColorAtY = (y: number) => {
    // Normalize Y from -320 to 320 into 0 to 1
    const normalizedY = (y - DNA_TOP) / DNA_HEIGHT;
    
    // Determine which zone and position within zone
    const zoneIndex = Math.floor(normalizedY * 6);
    const clampedIndex = Math.max(0, Math.min(5, zoneIndex));
    const zone = dnaZones[clampedIndex];
    
    // Position within this zone (0 to 1)
    const yInZone = (normalizedY * 6) - clampedIndex;
    
    // Check if this position should be filled
    const fillThreshold = 1 - (zone.value / 100);
    
    if (yInZone >= fillThreshold) {
      // Filled - return the zone color
      return zone.color;
    } else {
      // Unfilled - return white/neutral
      return 'rgba(220,230,240,0.7)';
    }
  };

  // Get zone color based on Y position (always returns zone color, ignores fill)
  const getZoneColorAtY = (y: number) => {
    const normalizedY = (y - DNA_TOP) / DNA_HEIGHT;
    const zoneIndex = Math.floor(normalizedY * 6);
    const clampedIndex = Math.max(0, Math.min(5, zoneIndex));
    return dnaZones[clampedIndex].color;
  };

  // Generate DNA points for smooth curves - EXTENDED HEIGHT
  const generateDNAPoints = (strandOffset: number, radius: number) => {
    const points = [];
    const numPoints = 80; // More points for longer helix
    for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1);
      const y = (t - 0.5) * 640; // -320 to 320 (extended)
      const angle = ((t * 720) + rotationPhase + strandOffset) * Math.PI / 180;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      points.push({ x, y, z });
    }
    return points;
  };

  // Create 4 strands: outer and inner edges for each side - ENLARGED
  const strand1Outer = generateDNAPoints(0, 110);
  const strand1Inner = generateDNAPoints(0, 85);
  const strand2Outer = generateDNAPoints(180, 110);
  const strand2Inner = generateDNAPoints(180, 85);

  // Create smooth path from points
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
    <div className="w-full h-[520px] md:h-screen relative overflow-hidden bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950">

      <svg
        className="w-full h-full"
        viewBox="0 0 800 700"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Create gradient stops for each zone based on fill percentage - EXTENDED */}
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

          {/* Glow filters */}
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="strongGlow">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* DNA Double Helix with Flowing Gradient */}
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
            {/* Strand 1 Outer - continuous with gradient */}
            <path
              d={createSmoothPath(strand1Outer)}
              stroke="url(#dnaFlowGradient)"
              strokeWidth="5"
              fill="none"
              opacity={0.95}
              filter="url(#strongGlow)"
              strokeLinecap="round"
            />

            {/* Strand 1 Inner - continuous with gradient */}
            <path
              d={createSmoothPath(strand1Inner)}
              stroke="url(#dnaFlowGradient)"
              strokeWidth="5"
              fill="none"
              opacity={0.95}
              filter="url(#strongGlow)"
              strokeLinecap="round"
            />

            {/* Strand 2 Outer - continuous with gradient */}
            <path
              d={createSmoothPath(strand2Outer)}
              stroke="url(#dnaFlowGradient)"
              strokeWidth="5"
              fill="none"
              opacity={0.95}
              filter="url(#strongGlow)"
              strokeLinecap="round"
            />

            {/* Strand 2 Inner - continuous with gradient */}
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

          {/* Horizontal ladder rungs - RENDERED ON TOP - COLOR CODED by zone */}
          {Array.from({ length: 18 }).map((_, i) => {
            const yPosition = (i / 17 - 0.5) * 450;
            
            // Find closest points on inner strands
            const point1 = strand1Inner.reduce((closest, point) => 
              Math.abs(point.y - yPosition) < Math.abs(closest.y - yPosition) ? point : closest
            , strand1Inner[0]);
            
            const point2 = strand2Inner.reduce((closest, point) => 
              Math.abs(point.y - yPosition) < Math.abs(closest.y - yPosition) ? point : closest
            , strand2Inner[0]);
            
            // Get vibrant zone color
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

      {/* Metrics Box - Top Left on Desktop, Horizontal Top on Mobile */}
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
              {/* Colored dot */}
              <div
                className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: metric.color, boxShadow: `0 0 4px ${metric.color}` }}
                data-testid={`metric-dot-${metric.name.toLowerCase().replace(/[: ]/g, '-')}`}
              />
              {/* Metric name and value */}
              <div className="flex items-baseline gap-1 md:gap-2 min-w-0 md:min-w-[140px]">
                <span 
                  className="text-white text-[9px] md:text-xs font-semibold flex-1 truncate"
                  data-testid={`metric-label-${metric.name.toLowerCase().replace(/[: ]/g, '-')}`}
                >
                  {metric.name}
                </span>
                <span
                  className="text-[10px] md:text-sm font-bold"
                  style={{ color: metric.color }}
                  data-testid={`metric-value-${metric.name.toLowerCase().replace(/[: ]/g, '-')}`}
                >
                  {metric.value.toFixed(0)}%
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Edge Integrity Score Display - Below Metrics Box - Mobile Responsive */}
      <motion.div
        className="absolute top-[90px] left-2 md:top-[220px] md:left-8 bg-slate-950/90 backdrop-blur-sm border border-cyan-500/30 rounded-lg px-2 py-1.5 md:px-4 md:py-2 text-center max-h-[60px] md:max-h-[80px] max-w-[100px] md:max-w-none"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.5 }}
      >
        {/* Info Icon in Top Right Corner */}
        <Dialog>
          <DialogTrigger asChild>
            <button 
              className="absolute top-1 right-1 text-cyan-400/60 hover:text-cyan-400 transition-colors"
              data-testid="button-info-dna"
            >
              <Info className="w-3 h-3 md:w-3.5 md:h-3.5" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] md:max-w-2xl max-h-[80vh] overflow-y-auto bg-slate-950/95 border-cyan-500/30 text-white p-4 md:p-6">
            <DialogHeader>
              <DialogTitle className="text-cyan-400 text-base md:text-xl">How to Read & Use Trader DNA</DialogTitle>
              <DialogDescription className="text-slate-400 text-xs md:text-sm">
                Learn how to interpret your Trader DNA visualization and improve your trading edge.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 md:space-y-6 text-xs md:text-sm">
              {/* How to read section */}
              <div>
                <h3 className="text-cyan-400 font-semibold mb-3">How to read Trader DNA</h3>
                <div className="space-y-2 text-slate-300">
                  <p>
                    The helix is split into 6 color bands (top→bottom):
                  </p>
                  <p className="pl-4">
                    <span className="text-cyan-400">Cyan</span> Win Rate • <span className="text-blue-400">Blue</span> Risk:Reward • <span className="text-violet-400">Violet</span> Risk Consistency • <span className="text-magenta-400">Magenta</span> Emotional Control • <span className="text-amber-400">Amber</span> Discipline • <span className="text-cyan-400">Aqua</span> Session Focus
                  </p>
                  <p className="mt-3">
                    Band fill = your score. e.g., Discipline 56% → the amber band is ~56% lit.
                  </p>
                  <p className="mt-3">
                    The big % up top is your Edge Integrity (a weighted blend of all six). A brighter/greener strand = a healthier edge.
                  </p>
                  <p className="mt-3">
                    Hover the DNA to pause. Hover a dot/band to see the value, 30-day trend, and what's driving it.
                  </p>
                  <p className="mt-3">
                    Risk:Reward shows as x.x× in labels; for the band it's normalized 0–100.
                  </p>
                </div>
              </div>

              {/* How to use section */}
              <div>
                <h3 className="text-cyan-400 font-semibold mb-3">How to use it</h3>
                <div className="space-y-2 text-slate-300">
                  <p>
                    Fix the lowest band first. Aim to keep every band ≥70%.
                  </p>
                  <p className="mt-3">
                    If Discipline is low → cap risk per trade and trade only your best session.
                  </p>
                  <p className="mt-2">
                    If Risk Consistency dips → standardize position size/SL.
                  </p>
                  <p className="mt-2">
                    If Session Focus is low → restrict entries to the hours where you win most.
                  </p>
                  <p className="mt-2">
                    If Emotional Control drops → log each trade; avoid back-to-back entries.
                  </p>
                  <p className="mt-3 font-semibold">
                    Goal: a strand where all bands are evenly filled and Edge Integrity stays 80%+.
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="text-[9px] md:text-xs font-semibold text-cyan-400 mb-0.5 leading-none mt-3 md:mt-4" data-testid="label-edge-integrity">
          EDGE INTEGRITY SCORE
        </div>
        <div 
          className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent leading-none"
          data-testid="value-edge-integrity"
        >
          {metrics.edgeIntegrity.toFixed(1)}%
        </div>
      </motion.div>

      {/* Right side percentage displays - next to DNA helix aligned with zones - Mobile Responsive */}
      <div className="absolute top-1/2 left-1/2">
        {dnaZones.map((metric, index) => {
          // Compress vertical spacing by 15%
          const compressedYPosition = metric.yPosition * 0.85;
          // Mobile needs more compression to align with DNA zones
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
                data-testid={`right-value-${metric.name.toLowerCase().replace(/[: ]/g, '-')}`}
              >
                {metric.value.toFixed(0)}%
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Controls hint - Mobile Responsive */}
      <motion.div
        className="absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 text-cyan-400/60 text-xs md:text-sm text-center px-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2 }}
        data-testid="text-controls-hint"
      >
        <span className="hidden md:inline">Hover over DNA to pause rotation</span>
        <button 
          className="md:hidden cursor-pointer hover:text-cyan-400/80 transition-colors"
          onClick={() => setIsPaused(!isPaused)}
        >
          {isPaused ? "Tap here to resume DNA" : "Tap here to pause DNA"}
        </button>
      </motion.div>
    </div>
  );
}
