import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface MoodData {
  mood: number;
  date: string;
  pnl?: number;
}

interface MoodPlanetProps {
  moodLogs: MoodData[];
}

interface Continent {
  points: { x: number; y: number }[];
}

export function MoodPlanet({ moodLogs }: MoodPlanetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [continents, setContinents] = useState<Continent[]>([]);
  const [rotation, setRotation] = useState(0);
  const animationFrameRef = useRef<number>();

  const size = 500;
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = 200;

  // Calculate average mood from all logs
  const averageMood = moodLogs.length > 0
    ? moodLogs.reduce((sum, log) => sum + log.mood, 0) / moodLogs.length
    : 5;

  // Get planet colors based on average mood
  const getPlanetColors = (avgMood: number) => {
    if (avgMood >= 8) {
      // Excellent mood - Green/Cyan planet (more green)
      return {
        base: '#065f46',
        glow: '#10b981',
        lightning: '#34d399',
        atmosphere: '#10b981',
        name: 'Excellent'
      };
    } else if (avgMood >= 5) {
      // Neutral mood - Cyan planet
      return {
        base: '#0d4d56',
        glow: '#06b6d4',
        lightning: '#22d3ee',
        atmosphere: '#06b6d4',
        name: 'Neutral'
      };
    } else if (avgMood >= 3) {
      // Stressed mood - Orange planet
      return {
        base: '#6b3410',
        glow: '#f97316',
        lightning: '#fb923c',
        atmosphere: '#f97316',
        name: 'Stressed'
      };
    } else {
      // Super stressed - Red planet
      return {
        base: '#7f1d1d',
        glow: '#ef4444',
        lightning: '#f87171',
        atmosphere: '#ef4444',
        name: 'Super Stressed'
      };
    }
  };

  const colors = getPlanetColors(averageMood);

  // Generate fixed continents once
  useEffect(() => {
    const generateFixedContinents = (): Continent[] => {
      const newContinents: Continent[] = [];
      const numContinents = 6; // Reduced from 8 for better performance
      
      for (let i = 0; i < numContinents; i++) {
        const baseAngle = (i / numContinents) * Math.PI * 2;
        const baseRadius = radius * (0.65 + (i % 3) * 0.15);
        
        const points: { x: number; y: number }[] = [];
        
        // Reduced points for better performance
        const numPoints = 15 + Math.floor(Math.random() * 8);
        
        for (let j = 0; j < numPoints; j++) {
          const angle = baseAngle + (j / numPoints) * (Math.PI / 1.5) + Math.random() * 0.4;
          const r = baseRadius * (0.8 + Math.random() * 0.5);
          
          const x = centerX + Math.cos(angle) * r;
          const y = centerY + Math.sin(angle) * r;
          
          const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
          if (dist < radius - 5) {
            points.push({ x, y });
          }
        }
        
        if (points.length >= 3) {
          newContinents.push({ points });
        }
      }
      
      return newContinents;
    };

    setContinents(generateFixedContinents());
  }, []); // Only generate once on mount

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || continents.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationTime = 0;

    const animate = () => {
      animationTime++;
      
      // Clear canvas
      ctx.fillStyle = '#0a0e1a';
      ctx.fillRect(0, 0, size, size);

      // Draw planet base with mood-based gradient
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      gradient.addColorStop(0, '#1e1b4b');
      gradient.addColorStop(0.5, colors.base);
      gradient.addColorStop(1, '#0f172a');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw atmospheric glow (mood-based color)
      ctx.shadowBlur = 40;
      ctx.shadowColor = colors.atmosphere;
      ctx.strokeStyle = colors.atmosphere;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      // Slow rotation
      setRotation(prev => prev + 0.001);

      // Draw fixed continents with lightning borders
      continents.forEach((continent, continentIndex) => {
        if (continent.points.length < 3) return;
        
        // Rotate points
        const rotatedPoints = continent.points.map(point => {
          const dx = point.x - centerX;
          const dy = point.y - centerY;
          return {
            x: centerX + dx * Math.cos(rotation) - dy * Math.sin(rotation),
            y: centerY + dx * Math.sin(rotation) + dy * Math.cos(rotation)
          };
        });
        
        // Draw continent fill (darker)
        ctx.fillStyle = colors.base;
        ctx.globalAlpha = 0.7;
        
        ctx.beginPath();
        ctx.moveTo(rotatedPoints[0].x, rotatedPoints[0].y);
        for (let i = 1; i < rotatedPoints.length; i++) {
          ctx.lineTo(rotatedPoints[i].x, rotatedPoints[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;

        // Draw lightning-like borders with flowing electricity
        for (let i = 0; i < rotatedPoints.length; i++) {
          const p1 = rotatedPoints[i];
          const p2 = rotatedPoints[(i + 1) % rotatedPoints.length];
          
          // Calculate flow position (travels along the edge)
          const flowSpeed = 0.05;
          const flowPosition = (animationTime * flowSpeed + i * 0.5) % 1;
          
          // Pulsing effect that travels
          const pulseOffset = (continentIndex * 30 + i * 10);
          const pulse = Math.sin((animationTime + pulseOffset) * 0.1) * 0.5 + 0.5;
          
          // Draw main lightning line with base glow
          ctx.strokeStyle = colors.lightning;
          ctx.lineWidth = 1.5;
          ctx.shadowBlur = 8;
          ctx.shadowColor = colors.lightning;
          ctx.globalAlpha = 0.4;
          
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          
          // Create jagged lightning effect
          const segments = 5; // Reduced from 8 for better performance
          const dx = (p2.x - p1.x) / segments;
          const dy = (p2.y - p1.y) / segments;
          
          for (let j = 1; j < segments; j++) {
            const jitter = (Math.sin((animationTime + i * 20 + j * 10) * 0.2) * 3);
            const perpX = -dy * 0.08 * jitter;
            const perpY = dx * 0.08 * jitter;
            
            ctx.lineTo(
              p1.x + dx * j + perpX,
              p1.y + dy * j + perpY
            );
          }
          
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
          
          // Draw flowing electricity pulse
          const segmentLength = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
          const pulseX = p1.x + (p2.x - p1.x) * flowPosition;
          const pulseY = p1.y + (p2.y - p1.y) * flowPosition;
          
          // Draw bright flowing pulse
          ctx.shadowBlur = 25;
          ctx.fillStyle = colors.lightning;
          ctx.globalAlpha = 0.9;
          ctx.beginPath();
          ctx.arc(pulseX, pulseY, 4, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw trailing glow
          const trailLength = 0.15;
          for (let k = 0; k < 2; k++) { // Reduced from 3 for better performance
            const trailPos = (flowPosition - k * trailLength / 2 + 1) % 1;
            const trailX = p1.x + (p2.x - p1.x) * trailPos;
            const trailY = p1.y + (p2.y - p1.y) * trailPos;
            const trailAlpha = (1 - k / 2) * 0.5;
            
            ctx.globalAlpha = trailAlpha;
            ctx.beginPath();
            ctx.arc(trailX, trailY, 3 - k, 0, Math.PI * 2);
            ctx.fill();
          }
          
          // Draw glow points at vertices with pulse
          if (pulse > 0.6) {
            ctx.fillStyle = colors.lightning;
            ctx.shadowBlur = 20;
            ctx.globalAlpha = pulse * 0.8;
            ctx.beginPath();
            ctx.arc(p1.x, p1.y, 2 + pulse * 2, 0, Math.PI * 2);
            ctx.fill();
          }
          
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        }
      });

      // Add grid lines across planet
      const gridLines = 12;
      ctx.strokeStyle = colors.lightning;
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = 0.2;
      ctx.setLineDash([5, 5]);
      
      // Horizontal lines
      for (let i = 1; i < gridLines; i++) {
        const y = (i / gridLines) * (radius * 2) + centerY - radius;
        const lineRadius = Math.sqrt(radius * radius - Math.pow(y - centerY, 2));
        
        if (!isNaN(lineRadius)) {
          ctx.beginPath();
          ctx.moveTo(centerX - lineRadius, y);
          ctx.lineTo(centerX + lineRadius, y);
          ctx.stroke();
        }
      }
      
      // Vertical lines
      for (let i = 0; i < gridLines; i++) {
        const angle = (i / gridLines) * Math.PI * 2 + rotation;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + Math.cos(angle) * radius,
          centerY + Math.sin(angle) * radius
        );
        ctx.stroke();
      }
      
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      // Add pulsing core glow
      const coreGlow = Math.sin(animationTime * 0.05) * 0.3 + 0.7;
      ctx.fillStyle = colors.glow;
      ctx.globalAlpha = 0.1 * coreGlow;
      ctx.shadowBlur = 50;
      ctx.shadowColor = colors.glow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 60, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [continents, colors, rotation]);

  return (
    <div className="relative flex flex-col items-center justify-center p-4 bg-slate-950/50 rounded-lg border border-cyan-500/30">
      <h3 className="text-lg font-bold text-cyan-400 mb-2" data-testid="title-mood-planet">Mood Planet</h3>
      <p className="text-xs text-gray-400 mb-4 text-center">
        Your emotional world • Lightning flows along the continents
      </p>
      
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="max-w-full h-auto rounded-lg"
          data-testid="canvas-mood-planet"
        />
      </div>

      {/* Mood Status */}
      <div className="mt-4 text-center">
        <div className="text-sm font-semibold" style={{ color: colors.glow }}>
          Current Emotional State: {colors.name}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          Average Mood: {averageMood.toFixed(1)}/10
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-green-400" style={{ boxShadow: '0 0 8px #10b981' }}></div>
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-400 animate-ping" style={{ opacity: 0.4 }}></div>
          </div>
          <span className="text-gray-400">Excellent (8-10)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-cyan-400" style={{ boxShadow: '0 0 8px #22d3ee' }}></div>
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-cyan-400 animate-ping" style={{ opacity: 0.4 }}></div>
          </div>
          <span className="text-gray-400">Neutral (5-7)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-orange-400" style={{ boxShadow: '0 0 6px #f97316' }}></div>
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-orange-400 animate-ping" style={{ opacity: 0.4 }}></div>
          </div>
          <span className="text-gray-400">Stressed (3-5)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-red-500" style={{ boxShadow: '0 0 5px #ef4444' }}></div>
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-red-500 animate-ping" style={{ opacity: 0.4 }}></div>
          </div>
          <span className="text-gray-400">Super Stressed (1-2)</span>
        </div>
      </div>

      <div className="mt-3 text-center">
        <p className="text-[10px] text-gray-500 italic">
          The planet's color reflects your overall emotional state • Lightning pulses along continent borders
        </p>
      </div>
    </div>
  );
}
