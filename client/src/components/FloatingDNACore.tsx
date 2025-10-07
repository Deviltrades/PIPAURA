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

  // Enhanced metrics for orbiting display with positions along DNA
  const orbitingMetrics = [
    { name: 'Win Rate', value: metrics.winRate, color: '#00DCFF', angle: 0, yPosition: -200 },
    { name: 'Risk:Reward', value: metrics.riskReward, color: '#00B8D4', angle: 60, yPosition: -120 },
    { name: 'Risk Consistency', value: metrics.riskConsistency, color: '#7B68EE', angle: 120, yPosition: -40 },
    { name: 'Emotional Control', value: metrics.emotionalControl, color: '#9370DB', angle: 180, yPosition: 40 },
    { name: 'Discipline', value: metrics.discipline, color: '#BA55D3', angle: 240, yPosition: 120 },
    { name: 'Session Focus', value: metrics.sessionFocus, color: '#DA70D6', angle: 300, yPosition: 200 },
  ];

  // Get color based on vertical position (y) for gradient effect - smooth professional gradient
  const getColorForPosition = (y: number) => {
    // Map y from -250 to 250 to 0 to 1
    const normalizedY = (y + 250) / 500;
    
    // Professional gradient: Cyan → Cyan-Blue → Green → Purple → Magenta
    if (normalizedY < 0.25) {
      // Top: Bright cyan
      const t = normalizedY / 0.25;
      return `hsl(${190 - t * 10}, 100%, ${60 - t * 5}%)`; // Cyan #00D4FF
    } else if (normalizedY < 0.5) {
      // Upper-middle: Cyan to Green transition
      const t = (normalizedY - 0.25) / 0.25;
      return `hsl(${180 - t * 60}, 100%, ${55 - t * 5}%)`; // Cyan to Green
    } else if (normalizedY < 0.75) {
      // Lower-middle: Green to Purple transition
      const t = (normalizedY - 0.5) / 0.25;
      return `hsl(${120 + t * 150}, ${100 - t * 10}%, ${50 + t * 5}%)`; // Green to Purple
    } else {
      // Bottom: Purple to Bright Magenta
      const t = (normalizedY - 0.75) / 0.25;
      return `hsl(${270 + t * 30}, ${90 + t * 10}%, ${55 + t * 10}%)`; // Magenta #FF00FF
    }
  };

  // Generate DNA points for smooth curves - now with inner and outer edges
  const generateDNAPoints = (strandOffset: number, radius: number) => {
    const points = [];
    const numPoints = 60; // More points for smoother curve
    for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1);
      const y = (t - 0.5) * 500; // Vertical position
      const angle = ((t * 720) + rotationPhase + strandOffset) * Math.PI / 180; // 2 full rotations
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius; // For depth calculation
      const color = getColorForPosition(y);
      points.push({ x, y, z, color });
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

  // Create segments for color-coded strands
  const createColoredSegments = (points: { x: number; y: number; color: string }[]) => {
    const segments = [];
    const segmentSize = 5; // Points per segment
    
    for (let i = 0; i < points.length - segmentSize; i += segmentSize) {
      const segmentPoints = points.slice(i, i + segmentSize + 1);
      const path = createSmoothPath(segmentPoints);
      const color = points[i].color;
      segments.push({ path, color });
    }
    
    return segments;
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
          {/* DNA gradient: Cyan → Green → Purple → Magenta */}
          <linearGradient id="dnaGradient" gradientUnits="userSpaceOnUse" x1="0" y1="-250" x2="0" y2="250">
            <stop offset="0%" stopColor="#00D4FF" />      {/* Bright Cyan */}
            <stop offset="35%" stopColor="#00E5CC" />     {/* Cyan-Green */}
            <stop offset="50%" stopColor="#00FF88" />     {/* Green */}
            <stop offset="70%" stopColor="#9370DB" />     {/* Purple */}
            <stop offset="100%" stopColor="#FF00FF" />    {/* Bright Magenta */}
          </linearGradient>

          {/* Enhanced glow filters with expanded regions */}
          <filter id="softGlow" filterUnits="userSpaceOnUse" x="-200" y="-300" width="600" height="700">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="strongGlow" filterUnits="userSpaceOnUse" x="-200" y="-300" width="600" height="700">
            <feGaussianBlur stdDeviation="6" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="ultraGlow" filterUnits="userSpaceOnUse" x="-200" y="-300" width="600" height="700">
            <feGaussianBlur stdDeviation="10" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* DNA Double Helix */}
        <g 
          transform="translate(400, 300)"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Breathing pulse effect with glow filter applied to group */}
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
            filter="url(#strongGlow)"
          >
            {/* Strand 1 Outer Edge - Continuous path with gradient */}
            <path
              d={createSmoothPath(strand1Outer)}
              stroke="url(#dnaGradient)"
              strokeWidth="4"
              fill="none"
              opacity={0.95}
              strokeLinecap="round"
            />

            {/* Strand 1 Inner Edge - Continuous path with gradient */}
            <path
              d={createSmoothPath(strand1Inner)}
              stroke="url(#dnaGradient)"
              strokeWidth="4"
              fill="none"
              opacity={0.95}
              strokeLinecap="round"
            />

            {/* Strand 2 Outer Edge - Continuous path with gradient */}
            <path
              d={createSmoothPath(strand2Outer)}
              stroke="url(#dnaGradient)"
              strokeWidth="4"
              fill="none"
              opacity={0.95}
              strokeLinecap="round"
            />

            {/* Strand 2 Inner Edge - Continuous path with gradient */}
            <path
              d={createSmoothPath(strand2Inner)}
              stroke="url(#dnaGradient)"
              strokeWidth="4"
              fill="none"
              opacity={0.95}
              strokeLinecap="round"
            />
          </motion.g>

          {/* Enhanced glow layers underneath - also continuous */}
          <motion.g
            animate={{
              scale: [1, 1.02, 1],
              opacity: [0.3, 0.4, 0.3]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            filter="url(#ultraGlow)"
          >
            <path
              d={createSmoothPath(strand1Outer)}
              stroke="url(#dnaGradient)"
              strokeWidth="8"
              fill="none"
              opacity={0.3}
              strokeLinecap="round"
            />
            <path
              d={createSmoothPath(strand2Outer)}
              stroke="url(#dnaGradient)"
              strokeWidth="8"
              fill="none"
              opacity={0.3}
              strokeLinecap="round"
            />
            <path
              d={createSmoothPath(strand1Inner)}
              stroke="url(#dnaGradient)"
              strokeWidth="8"
              fill="none"
              opacity={0.3}
              strokeLinecap="round"
            />
            <path
              d={createSmoothPath(strand2Inner)}
              stroke="url(#dnaGradient)"
              strokeWidth="8"
              fill="none"
              opacity={0.3}
              strokeLinecap="round"
            />
          </motion.g>

          {/* Base pair rungs - MANY CRISP HORIZONTAL ladder bars connecting INNER strands */}
          <g>
            {Array.from({ length: 25 }).map((_, i) => {
              // Create evenly spaced rungs from top to bottom
              const yPosition = (i / 24 - 0.5) * 480; // -240 to 240
              
              // Find closest points on INNER strands at this Y position
              const point1 = strand1Inner.reduce((closest, point) => 
                Math.abs(point.y - yPosition) < Math.abs(closest.y - yPosition) ? point : closest
              , strand1Inner[0]);
              
              const point2 = strand2Inner.reduce((closest, point) => 
                Math.abs(point.y - yPosition) < Math.abs(closest.y - yPosition) ? point : closest
              , strand2Inner[0]);
              
              // Calculate depth for this rung
              const avgZ = (point1.z + point2.z) / 2;
              const depthFactor = (avgZ + 60) / 120;
              const opacity = 0.85 + depthFactor * 0.15;
              const strokeWidth = 3 + depthFactor * 1;
              
              // Get color from gradient based on Y position
              const rungColor = getColorForPosition(yPosition);

              return (
                <g key={`rung-${i}`}>
                  {/* Soft glow underneath */}
                  <motion.line
                    x1={point1.x}
                    y1={point1.y}
                    x2={point2.x}
                    y2={point2.y}
                    stroke={rungColor}
                    strokeWidth={strokeWidth + 2}
                    opacity={0.4}
                    filter="url(#softGlow)"
                    strokeLinecap="round"
                    initial={{ opacity: 0, pathLength: 0 }}
                    animate={{ opacity: 0.4, pathLength: 1 }}
                    transition={{ duration: 0.6, delay: i * 0.02 }}
                  />
                  {/* Crisp solid rung */}
                  <motion.line
                    x1={point1.x}
                    y1={point1.y}
                    x2={point2.x}
                    y2={point2.y}
                    stroke={rungColor}
                    strokeWidth={strokeWidth}
                    opacity={opacity}
                    strokeLinecap="round"
                    initial={{ opacity: 0, pathLength: 0 }}
                    animate={{ opacity, pathLength: 1 }}
                    transition={{ duration: 0.6, delay: i * 0.02 }}
                  />
                </g>
              );
            })}
          </g>

          {/* Subtle floating particles around DNA */}
          <g>
            {Array.from({ length: 12 }).map((_, i) => {
              const t = i / 12;
              const y = (t - 0.5) * 480;
              const radius = 90 + Math.random() * 30;
              const angle = (Math.random() * 360 + rotationPhase * 0.5) * Math.PI / 180;
              const x = Math.cos(angle) * radius;
              const particleZ = Math.sin(angle) * radius;
              const particleDepth = (particleZ + 120) / 240;
              const particleColor = getColorForPosition(y);

              return (
                <motion.circle
                  key={`particle-${i}`}
                  cx={x}
                  cy={y}
                  r={1.5}
                  fill={particleColor}
                  opacity={0.25 + particleDepth * 0.25}
                  filter="url(#softGlow)"
                  animate={{
                    opacity: [0.15, 0.4, 0.15],
                    scale: [0.9, 1.1, 0.9],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              );
            })}
          </g>
        </g>

        {/* Orbiting Metrics */}
        {orbitingMetrics.map((metric, index) => {
          const orbitRadius = 250;
          const angle = metric.angle + (Date.now() / 50) % 360;
          const x = 400 + Math.cos((angle * Math.PI) / 180) * orbitRadius;
          const y = 300 + Math.sin((angle * Math.PI) / 180) * orbitRadius;
          
          // Connection point on helix - find point closest to metric's yPosition
          const targetY = metric.yPosition;
          const closestPoint = strand1Outer.reduce((closest, point) => {
            return Math.abs(point.y - targetY) < Math.abs(closest.y - targetY) ? point : closest;
          }, strand1Outer[0]);
          
          const helixX = 400 + closestPoint.x;
          const helixY = 300 + closestPoint.y;
          
          const dotSize = 8 + (metric.value / 100) * 12;
          const beamOpacity = 0.2 + (metric.value / 100) * 0.4;

          return (
            <g key={metric.name}>
              {/* Connecting beam */}
              <motion.line
                x1={helixX}
                y1={helixY}
                x2={x}
                y2={y}
                stroke={metric.color}
                strokeWidth="1.5"
                opacity={beamOpacity}
                filter="url(#softGlow)"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, delay: index * 0.2 }}
              />
              
              {/* Metric orb */}
              <motion.circle
                cx={x}
                cy={y}
                r={dotSize}
                fill={metric.color}
                filter="url(#strongGlow)"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                data-testid={`metric-orb-${metric.name.toLowerCase().replace(/[: ]/g, '-')}`}
              />
              
              {/* Metric label */}
              <motion.text
                x={x}
                y={y - dotSize - 10}
                textAnchor="middle"
                fill={metric.color}
                fontSize="12"
                fontWeight="600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.9 }}
                transition={{ duration: 0.5, delay: index * 0.2 + 0.5 }}
                data-testid={`metric-label-${metric.name.toLowerCase().replace(/[: ]/g, '-')}`}
              >
                {metric.name}
              </motion.text>
              
              {/* Metric value */}
              <motion.text
                x={x}
                y={y + dotSize + 18}
                textAnchor="middle"
                fill="#fff"
                fontSize="14"
                fontWeight="700"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: index * 0.2 + 0.7 }}
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
