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

  // Get color based on vertical position (y) for gradient effect
  const getColorForPosition = (y: number) => {
    // Map y from -250 to 250 to 0 to 1
    const normalizedY = (y + 250) / 500;
    
    // Define color stops: cyan -> blue -> purple -> magenta
    if (normalizedY < 0.25) {
      // Top section: cyan
      return '#00DCFF';
    } else if (normalizedY < 0.5) {
      // Upper-middle: blue to purple transition
      const t = (normalizedY - 0.25) / 0.25;
      return `hsl(${190 + t * 80}, 100%, 50%)`; // Cyan to purple hue
    } else if (normalizedY < 0.75) {
      // Lower-middle: purple
      return '#9370DB';
    } else {
      // Bottom section: magenta/pink
      return '#DA70D6';
    }
  };

  // Generate DNA points for smooth curves
  const generateDNAPoints = (strandOffset: number) => {
    const points = [];
    const numPoints = 60; // More points for smoother curve
    for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1);
      const y = (t - 0.5) * 500; // Vertical position
      const angle = ((t * 720) + rotationPhase + strandOffset) * Math.PI / 180; // 2 full rotations
      const x = Math.sin(angle) * 70;
      const z = Math.cos(angle) * 70; // For depth calculation
      const color = getColorForPosition(y);
      points.push({ x, y, z, color });
    }
    return points;
  };

  const strand1Points = generateDNAPoints(0);
  const strand2Points = generateDNAPoints(180);

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
          {/* Radial gradient for glowing effect */}
          <radialGradient id="glowGradient">
            <stop offset="0%" stopColor="#00DCFF" stopOpacity="1" />
            <stop offset="50%" stopColor="#00B8D4" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0097A7" stopOpacity="0.3" />
          </radialGradient>

          {/* Enhanced glow filters */}
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="strongGlow">
            <feGaussianBlur stdDeviation="6" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="ultraGlow">
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
          {/* Breathing pulse effect */}
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
            {/* Strand 1 - Color-coded segments */}
            {createColoredSegments(strand1Points).map((segment, i) => (
              <path
                key={`strand1-seg-${i}`}
                d={segment.path}
                stroke={segment.color}
                strokeWidth="3"
                fill="none"
                opacity={0.9}
                filter="url(#strongGlow)"
                strokeLinecap="round"
              />
            ))}

            {/* Strand 2 - Color-coded segments */}
            {createColoredSegments(strand2Points).map((segment, i) => (
              <path
                key={`strand2-seg-${i}`}
                d={segment.path}
                stroke={segment.color}
                strokeWidth="3"
                fill="none"
                opacity={0.9}
                filter="url(#strongGlow)"
                strokeLinecap="round"
              />
            ))}

            {/* Enhanced glow layers for depth */}
            {createColoredSegments(strand1Points).map((segment, i) => (
              <path
                key={`strand1-glow-${i}`}
                d={segment.path}
                stroke={segment.color}
                strokeWidth="1"
                fill="none"
                opacity={0.4}
                filter="url(#ultraGlow)"
                strokeLinecap="round"
              />
            ))}

            {createColoredSegments(strand2Points).map((segment, i) => (
              <path
                key={`strand2-glow-${i}`}
                d={segment.path}
                stroke={segment.color}
                strokeWidth="1"
                fill="none"
                opacity={0.4}
                filter="url(#ultraGlow)"
                strokeLinecap="round"
              />
            ))}

            {/* Base pair rungs - ladder bars connecting sides */}
            {strand1Points.filter((_, i) => i % 3 === 0).map((point1, i) => {
              const index = i * 3;
              const point2 = strand2Points[index];
              
              // Calculate depth-based opacity and width
              const avgZ = (point1.z + point2.z) / 2;
              const depthFactor = (avgZ + 70) / 140; // 0 to 1
              const opacity = 0.5 + depthFactor * 0.4; // More opaque
              const strokeWidth = 2 + depthFactor * 1.5; // Thicker bars

              return (
                <motion.line
                  key={`rung-${i}`}
                  x1={point1.x}
                  y1={point1.y}
                  x2={point2.x}
                  y2={point2.y}
                  stroke={point1.color}
                  strokeWidth={strokeWidth}
                  opacity={opacity}
                  filter="url(#softGlow)"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, delay: i * 0.03 }}
                />
              );
            })}

            {/* Glowing nodes along strands */}
            {strand1Points.filter((_, i) => i % 4 === 0).map((point, i) => {
              const depthFactor = (point.z + 70) / 140;
              const size = 3 + depthFactor * 4;
              const opacity = 0.6 + depthFactor * 0.4;

              return (
                <motion.circle
                  key={`node1-${i}`}
                  cx={point.x}
                  cy={point.y}
                  r={size}
                  fill={point.color}
                  opacity={opacity}
                  filter="url(#strongGlow)"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                />
              );
            })}

            {strand2Points.filter((_, i) => i % 4 === 0).map((point, i) => {
              const depthFactor = (point.z + 70) / 140;
              const size = 3 + depthFactor * 4;
              const opacity = 0.6 + depthFactor * 0.4;

              return (
                <motion.circle
                  key={`node2-${i}`}
                  cx={point.x}
                  cy={point.y}
                  r={size}
                  fill={point.color}
                  opacity={opacity}
                  filter="url(#strongGlow)"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                />
              );
            })}

            {/* Floating particles around DNA */}
            {Array.from({ length: 30 }).map((_, i) => {
              const t = i / 30;
              const y = (t - 0.5) * 480;
              const radius = 80 + Math.random() * 40;
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
                  r={1 + Math.random() * 2}
                  fill={particleColor}
                  opacity={0.3 + particleDepth * 0.4}
                  filter="url(#softGlow)"
                  animate={{
                    opacity: [0.2, 0.6, 0.2],
                    scale: [0.8, 1.2, 0.8],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              );
            })}
          </motion.g>
        </g>

        {/* Orbiting Metrics */}
        {orbitingMetrics.map((metric, index) => {
          const orbitRadius = 250;
          const angle = metric.angle + (Date.now() / 50) % 360;
          const x = 400 + Math.cos((angle * Math.PI) / 180) * orbitRadius;
          const y = 300 + Math.sin((angle * Math.PI) / 180) * orbitRadius;
          
          // Connection point on helix - find point closest to metric's yPosition
          const targetY = metric.yPosition;
          const closestPoint = strand1Points.reduce((closest, point) => {
            return Math.abs(point.y - targetY) < Math.abs(closest.y - targetY) ? point : closest;
          }, strand1Points[0]);
          
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
