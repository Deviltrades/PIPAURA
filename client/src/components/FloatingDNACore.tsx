import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { getTrades, getAnalytics } from '@/lib/supabase-service';

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
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  // 6 zones from top to bottom
  const dnaZones = [
    { name: 'Win Rate', key: 'win', value: metrics.winRate, color: ZONE_COLORS.win, yPosition: -200 },
    { name: 'Risk:Reward', key: 'rr', value: metrics.riskReward, color: ZONE_COLORS.rr, yPosition: -120 },
    { name: 'Risk Consistency', key: 'risk', value: metrics.riskConsistency, color: ZONE_COLORS.risk, yPosition: -40 },
    { name: 'Emotional Control', key: 'emotion', value: metrics.emotionalControl, color: ZONE_COLORS.emotion, yPosition: 40 },
    { name: 'Discipline', key: 'discipline', value: metrics.discipline, color: ZONE_COLORS.discipline, yPosition: 120 },
    { name: 'Session Focus', key: 'session', value: metrics.sessionFocus, color: ZONE_COLORS.session, yPosition: 200 },
  ];

  // DNA zone dimensions
  const DNA_TOP = -240;
  const DNA_BOTTOM = 240;
  const DNA_HEIGHT = DNA_BOTTOM - DNA_TOP; // 480
  const ZONE_HEIGHT = DNA_HEIGHT / 6; // 80 each

  // Get smooth flowing color based on Y position (for gradient with fill logic)
  const getFlowingColorAtY = (y: number) => {
    // Normalize Y from -240 to 240 into 0 to 1
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

  // Generate DNA points for smooth curves
  const generateDNAPoints = (strandOffset: number, radius: number) => {
    const points = [];
    const numPoints = 60;
    for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1);
      const y = (t - 0.5) * 480; // -240 to 240
      const angle = ((t * 720) + rotationPhase + strandOffset) * Math.PI / 180;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      points.push({ x, y, z });
    }
    return points;
  };

  // Create 4 strands: outer and inner edges for each side
  const strand1Outer = generateDNAPoints(0, 80);
  const strand1Inner = generateDNAPoints(0, 60);
  const strand2Outer = generateDNAPoints(180, 80);
  const strand2Inner = generateDNAPoints(180, 60);

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
    <div className="w-full h-screen relative overflow-hidden bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950">

      <svg
        className="w-full h-full"
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Create gradient stops for each zone based on fill percentage */}
          <linearGradient id="dnaFlowGradient" x1="0" y1="-240" x2="0" y2="240" gradientUnits="userSpaceOnUse">
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

            {/* Ladder rungs - COLOR CODED by zone */}
            {Array.from({ length: 25 }).map((_, i) => {
              const yPosition = (i / 24 - 0.5) * 480;
              
              const point1 = strand1Inner.reduce((closest, point) => 
                Math.abs(point.y - yPosition) < Math.abs(closest.y - yPosition) ? point : closest
              , strand1Inner[0]);
              
              const point2 = strand2Inner.reduce((closest, point) => 
                Math.abs(point.y - yPosition) < Math.abs(closest.y - yPosition) ? point : closest
              , strand2Inner[0]);
              
              const avgZ = (point1.z + point2.z) / 2;
              const depthFactor = (avgZ + 60) / 120;
              const strokeWidth = 5 + depthFactor * 2;
              const rungColor = getZoneColorAtY(yPosition); // Always use zone color

              return (
                <g key={`rung-${i}`}>
                  {/* Dark underlay for depth */}
                  <motion.line
                    x1={point1.x}
                    y1={point1.y}
                    x2={point2.x}
                    y2={point2.y}
                    stroke="rgba(0,0,0,0.6)"
                    strokeWidth={strokeWidth + 1}
                    strokeLinecap="round"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: i * 0.02 }}
                  />
                  {/* Vibrant color-coded rung */}
                  <motion.line
                    x1={point1.x}
                    y1={point1.y}
                    x2={point2.x}
                    y2={point2.y}
                    stroke={rungColor}
                    strokeWidth={strokeWidth}
                    opacity={1}
                    filter="url(#strongGlow)"
                    strokeLinecap="round"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: i * 0.02 }}
                  />
                </g>
              );
            })}
          </motion.g>
        </g>

        {/* Metrics attached to DNA strands - moving with rotation */}
        {dnaZones.map((metric, index) => {
          // Find point on DNA strand at this metric's Y position
          const targetY = metric.yPosition;
          const closestPoint = strand1Outer.reduce((closest, point) => {
            return Math.abs(point.y - targetY) < Math.abs(closest.y - targetY) ? point : closest;
          }, strand1Outer[0]);
          
          // Position relative to DNA center
          const helixX = closestPoint.x;
          const helixY = closestPoint.y;
          
          // Determine if we're on left or right based on rotation
          const isLeft = closestPoint.z < 0; // Negative Z means in front on left side
          
          // Position text to the side of the DNA strand
          const textOffset = 120; // Distance from DNA center
          const textX = 400 + (isLeft ? -(textOffset) : textOffset);
          const textY = 300 + helixY;
          
          const textAnchor = isLeft ? "end" : "start";
          
          // Dot position - place OUTSIDE the text area
          // For left-aligned text (right side): dot goes to the left of text
          // For right-aligned text (left side): dot goes to the right of text
          const dotX = isLeft ? textX + 15 : textX - 15;

          return (
            <g key={metric.name}>
              {/* Dot on DNA helix */}
              <motion.circle
                cx={400 + helixX}
                cy={300 + helixY}
                r={6}
                fill={metric.color}
                filter="url(#strongGlow)"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                data-testid={`metric-dot-helix-${metric.name.toLowerCase().replace(/[: ]/g, '-')}`}
              />
              
              {/* Dot next to text label - positioned BEFORE text rendering */}
              <motion.circle
                cx={dotX}
                cy={textY + 3}
                r={5}
                fill={metric.color}
                filter="url(#softGlow)"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.9 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                data-testid={`metric-dot-label-${metric.name.toLowerCase().replace(/[: ]/g, '-')}`}
              />
              
              {/* Metric label and value - positioned on side */}
              <motion.text
                x={textX}
                y={textY - 5}
                textAnchor={textAnchor}
                fill="white"
                fontSize="14"
                fontWeight="600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.95 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                data-testid={`metric-label-${metric.name.toLowerCase().replace(/[: ]/g, '-')}`}
              >
                {metric.name}
              </motion.text>
              
              {/* Metric value below label */}
              <motion.text
                x={textX}
                y={textY + 12}
                textAnchor={textAnchor}
                fill={metric.color}
                fontSize="16"
                fontWeight="700"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                data-testid={`metric-value-${metric.name.toLowerCase().replace(/[: ]/g, '-')}`}
              >
                {metric.value.toFixed(0)}%
              </motion.text>
            </g>
          );
        })}
      </svg>

      {/* Edge Integrity Score Display */}
      <motion.div
        className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.5 }}
      >
        <div className="text-sm font-semibold text-cyan-400 mb-1" data-testid="label-edge-integrity">
          EDGE INTEGRITY SCORE
        </div>
        <div 
          className="text-6xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"
          data-testid="value-edge-integrity"
        >
          {metrics.edgeIntegrity.toFixed(1)}%
        </div>
      </motion.div>

      {/* Controls hint */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-cyan-400/60 text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2 }}
        data-testid="text-controls-hint"
      >
        Hover over DNA to pause rotation
      </motion.div>
    </div>
  );
}
