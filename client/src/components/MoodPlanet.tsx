import { motion } from 'framer-motion';
import { useState } from 'react';

interface MoodData {
  mood: number;
  date: string;
  pnl?: number;
}

interface MoodPlanetProps {
  moodLogs: MoodData[];
}

export function MoodPlanet({ moodLogs }: MoodPlanetProps) {
  const [hoveredRegion, setHoveredRegion] = useState<number | null>(null);

  // Divide mood logs into regions (max 20 regions for the planet)
  const regions = Array.from({ length: 20 }, (_, i) => {
    const log = moodLogs[i % moodLogs.length];
    return log || { mood: 5, date: 'No data', pnl: 0 };
  });

  // Get color and glow based on mood score
  const getMoodColor = (mood: number) => {
    if (mood >= 8) return { fill: '#06b6d4', glow: '#22d3ee', intensity: 'high' }; // Cyan (good)
    if (mood >= 5) return { fill: '#fb923c', glow: '#f97316', intensity: 'medium' }; // Orange (neutral)
    return { fill: '#ec4899', glow: '#f43f5e', intensity: 'low' }; // Magenta/Red (bad)
  };

  // Planet SVG dimensions
  const size = 400;
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = 180;

  // Generate irregular regions (Voronoi-like patterns)
  const generateRegionPath = (index: number, total: number) => {
    const angle = (index / total) * Math.PI * 2;
    const nextAngle = ((index + 1) / total) * Math.PI * 2;
    
    // Create irregular shapes by varying the radius
    const radiusVariation = 0.7 + Math.random() * 0.3;
    const r1 = radius * radiusVariation;
    const r2 = radius * (0.7 + Math.random() * 0.3);
    const innerRadius = radius * 0.3;
    
    const x1 = centerX + Math.cos(angle) * r1;
    const y1 = centerY + Math.sin(angle) * r1;
    const x2 = centerX + Math.cos(nextAngle) * r2;
    const y2 = centerY + Math.sin(nextAngle) * r2;
    const ix1 = centerX + Math.cos(angle) * innerRadius;
    const iy1 = centerY + Math.sin(angle) * innerRadius;
    const ix2 = centerX + Math.cos(nextAngle) * innerRadius;
    const iy2 = centerY + Math.sin(nextAngle) * innerRadius;
    
    return `M ${x1},${y1} A ${r1},${r1} 0 0,1 ${x2},${y2} L ${ix2},${iy2} A ${innerRadius},${innerRadius} 0 0,0 ${ix1},${iy1} Z`;
  };

  // Generate marker positions (dots on the planet)
  const markers = regions.slice(0, 12).map((region, i) => {
    const angle = (i / 12) * Math.PI * 2 + Math.PI / 6;
    const markerRadius = radius * (0.5 + Math.random() * 0.4);
    return {
      x: centerX + Math.cos(angle) * markerRadius,
      y: centerY + Math.sin(angle) * markerRadius,
      mood: region.mood,
      date: region.date
    };
  });

  return (
    <div className="relative flex flex-col items-center justify-center p-4 bg-slate-950/50 rounded-lg border border-cyan-500/30">
      <h3 className="text-lg font-bold text-cyan-400 mb-2" data-testid="title-mood-planet">Mood Planet</h3>
      <p className="text-xs text-gray-400 mb-4 text-center">Geographic view of your emotional trading landscape</p>
      
      <svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`}
        className="max-w-full h-auto"
      >
        {/* Gradient definitions */}
        <defs>
          <radialGradient id="planetGradient">
            <stop offset="0%" stopColor="#1e1b4b" />
            <stop offset="50%" stopColor="#312e81" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>
          
          {/* Glow filters for each mood type */}
          <filter id="glowHigh">
            <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          <filter id="glowMedium">
            <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          <filter id="glowLow">
            <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Grid pattern overlay */}
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#475569" strokeWidth="0.3" opacity="0.3"/>
          </pattern>
        </defs>

        {/* Planet base circle with gradient */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="url(#planetGradient)"
          stroke="#06b6d4"
          strokeWidth="2"
          strokeOpacity="0.4"
        />

        {/* Grid overlay on planet */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="url(#grid)"
          opacity="0.3"
        />

        {/* Mood regions */}
        {regions.map((region, index) => {
          const { fill, glow, intensity } = getMoodColor(region.mood);
          const isHovered = hoveredRegion === index;
          
          return (
            <motion.path
              key={`region-${index}`}
              d={generateRegionPath(index, regions.length)}
              fill={fill}
              fillOpacity={isHovered ? 0.8 : 0.4}
              stroke={glow}
              strokeWidth={isHovered ? 2 : 1}
              strokeOpacity={0.6}
              filter={`url(#glow${intensity === 'high' ? 'High' : intensity === 'medium' ? 'Medium' : 'Low'})`}
              onMouseEnter={() => setHoveredRegion(index)}
              onMouseLeave={() => setHoveredRegion(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.05, duration: 0.5 }}
              className="cursor-pointer transition-all"
              data-testid={`region-${index}`}
            >
              <title>{`Mood: ${region.mood}/10 - ${region.date}`}</title>
            </motion.path>
          );
        })}

        {/* Border lines between regions */}
        {regions.map((_, index) => {
          const angle = (index / regions.length) * Math.PI * 2;
          const nextAngle = ((index + 1) / regions.length) * Math.PI * 2;
          const r = radius * 0.95;
          
          return (
            <line
              key={`border-${index}`}
              x1={centerX + Math.cos(angle) * radius * 0.3}
              y1={centerY + Math.sin(angle) * radius * 0.3}
              x2={centerX + Math.cos(angle) * r}
              y2={centerY + Math.sin(angle) * r}
              stroke="#f97316"
              strokeWidth="0.5"
              strokeOpacity="0.4"
            />
          );
        })}

        {/* Markers (dots) on regions */}
        {markers.map((marker, index) => {
          const { glow } = getMoodColor(marker.mood);
          
          return (
            <g key={`marker-${index}`}>
              {/* Outer glow circle */}
              <circle
                cx={marker.x}
                cy={marker.y}
                r="8"
                fill={glow}
                opacity="0.3"
                filter="url(#glowHigh)"
              />
              {/* Inner dot */}
              <motion.circle
                cx={marker.x}
                cy={marker.y}
                r="4"
                fill={glow}
                stroke="#0f172a"
                strokeWidth="1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1, type: "spring" }}
                data-testid={`marker-${index}`}
              >
                <title>{`${marker.date}: Mood ${marker.mood}/10`}</title>
              </motion.circle>
            </g>
          );
        })}

        {/* Center glow effect */}
        <circle
          cx={centerX}
          cy={centerY}
          r="40"
          fill="#06b6d4"
          opacity="0.1"
          filter="url(#glowHigh)"
        />
      </svg>

      {/* Legend */}
      <div className="mt-4 flex gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-cyan-400" style={{ boxShadow: '0 0 8px #22d3ee' }}></div>
          <span className="text-gray-400">Good Mood (8-10)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-400" style={{ boxShadow: '0 0 6px #f97316' }}></div>
          <span className="text-gray-400">Neutral (5-7)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-pink-500" style={{ boxShadow: '0 0 5px #f43f5e' }}></div>
          <span className="text-gray-400">Low Mood (1-4)</span>
        </div>
      </div>

      {/* Hover info */}
      {hoveredRegion !== null && (
        <motion.div 
          className="absolute top-4 right-4 bg-slate-900/90 border border-cyan-500/50 rounded-lg p-3 text-xs"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          data-testid="hover-info"
        >
          <div className="text-cyan-400 font-semibold">Region {hoveredRegion + 1}</div>
          <div className="text-gray-300">Mood: {regions[hoveredRegion].mood}/10</div>
          <div className="text-gray-400 text-[10px]">{regions[hoveredRegion].date}</div>
        </motion.div>
      )}
    </div>
  );
}
