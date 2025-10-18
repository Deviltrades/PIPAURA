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

interface Lightning {
  x: number;
  y: number;
  intensity: number;
  color: string;
  angle: number;
  branches: { x: number; y: number; angle: number }[];
  lifetime: number;
  maxLifetime: number;
}

interface Continent {
  points: { x: number; y: number }[];
  color: string;
}

export function MoodPlanet({ moodLogs }: MoodPlanetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const [lightningStrikes, setLightningStrikes] = useState<Lightning[]>([]);
  const [hoveredStorm, setHoveredStorm] = useState<{ mood: number; date: string; x: number; y: number } | null>(null);
  const animationFrameRef = useRef<number>();

  const size = 500;
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = 200;

  // Get color based on mood score
  const getMoodColor = (mood: number) => {
    if (mood >= 8) return { 
      storm: '#06b6d4', 
      glow: '#22d3ee',
      land: '#0d4d56',
      name: 'Good' 
    }; // Cyan (good)
    if (mood >= 5) return { 
      storm: '#f97316', 
      glow: '#fb923c',
      land: '#6b3410',
      name: 'Neutral' 
    }; // Orange (neutral)
    return { 
      storm: '#ec4899', 
      glow: '#f43f5e',
      land: '#5e1a3a',
      name: 'Low' 
    }; // Magenta/Red (bad)
  };

  // Generate organic continent shapes using random walks
  const generateContinents = (numContinents: number): Continent[] => {
    const continents: Continent[] = [];
    
    for (let i = 0; i < numContinents; i++) {
      const mood = moodLogs[i % moodLogs.length]?.mood || 5;
      const colors = getMoodColor(mood);
      
      // Random starting position on circle
      const startAngle = (Math.random() * Math.PI * 2);
      const startRadius = radius * (0.4 + Math.random() * 0.5);
      const startX = centerX + Math.cos(startAngle + rotation) * startRadius;
      const startY = centerY + Math.sin(startAngle + rotation) * startRadius;
      
      const points: { x: number; y: number }[] = [{ x: startX, y: startY }];
      
      // Random walk to create organic shapes
      let currentX = startX;
      let currentY = startY;
      let currentAngle = Math.random() * Math.PI * 2;
      
      const numPoints = 15 + Math.floor(Math.random() * 10);
      
      for (let j = 0; j < numPoints; j++) {
        // Slight random turn
        currentAngle += (Math.random() - 0.5) * 1.5;
        const stepSize = 8 + Math.random() * 15;
        
        currentX += Math.cos(currentAngle) * stepSize;
        currentY += Math.sin(currentAngle) * stepSize;
        
        // Keep within planet bounds
        const distFromCenter = Math.sqrt(
          Math.pow(currentX - centerX, 2) + Math.pow(currentY - centerY, 2)
        );
        
        if (distFromCenter < radius - 10) {
          points.push({ x: currentX, y: currentY });
        }
      }
      
      continents.push({ points, color: colors.land });
    }
    
    return continents;
  };

  // Generate lightning bolt from a point
  const createLightning = (
    startX: number, 
    startY: number, 
    mood: number,
    angle: number
  ): Lightning => {
    const colors = getMoodColor(mood);
    const branches: { x: number; y: number; angle: number }[] = [];
    
    // Create 2-4 branches for the lightning
    const numBranches = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numBranches; i++) {
      const branchAngle = angle + (Math.random() - 0.5) * Math.PI / 2;
      const branchLength = 20 + Math.random() * 40;
      branches.push({
        x: startX + Math.cos(branchAngle) * branchLength,
        y: startY + Math.sin(branchAngle) * branchLength,
        angle: branchAngle
      });
    }
    
    return {
      x: startX,
      y: startY,
      intensity: 0.5 + Math.random() * 0.5,
      color: colors.storm,
      angle,
      branches,
      lifetime: 0,
      maxLifetime: 15 + Math.random() * 10
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let continents = generateContinents(Math.min(moodLogs.length, 8));
    let animationTime = 0;

    const animate = () => {
      animationTime++;
      
      // Clear canvas
      ctx.fillStyle = '#0a0e1a';
      ctx.fillRect(0, 0, size, size);

      // Draw planet base with gradient
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      gradient.addColorStop(0, '#1e1b4b');
      gradient.addColorStop(0.5, '#312e81');
      gradient.addColorStop(1, '#0f172a');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw atmospheric glow
      ctx.shadowBlur = 30;
      ctx.shadowColor = '#06b6d4';
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      // Slowly rotate the planet
      setRotation(prev => prev + 0.002);

      // Regenerate continents with rotation
      if (animationTime % 3 === 0) {
        continents = generateContinents(Math.min(moodLogs.length, 8));
      }

      // Draw continents
      continents.forEach(continent => {
        if (continent.points.length < 3) return;
        
        ctx.fillStyle = continent.color;
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.6;
        
        ctx.beginPath();
        ctx.moveTo(continent.points[0].x, continent.points[0].y);
        
        for (let i = 1; i < continent.points.length; i++) {
          ctx.lineTo(continent.points[i].x, continent.points[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

      // Spawn new lightning randomly
      if (Math.random() < 0.08 && moodLogs.length > 0) {
        const randomLog = moodLogs[Math.floor(Math.random() * moodLogs.length)];
        const randomAngle = Math.random() * Math.PI * 2;
        const randomRadius = radius * (0.3 + Math.random() * 0.6);
        const stormX = centerX + Math.cos(randomAngle + rotation) * randomRadius;
        const stormY = centerY + Math.sin(randomAngle + rotation) * randomRadius;
        
        // Check if within planet
        const distFromCenter = Math.sqrt(
          Math.pow(stormX - centerX, 2) + Math.pow(stormY - centerY, 2)
        );
        
        if (distFromCenter < radius - 20) {
          const lightning = createLightning(
            stormX,
            stormY,
            randomLog.mood,
            randomAngle
          );
          
          setLightningStrikes(prev => [...prev, lightning]);
        }
      }

      // Draw and update lightning strikes
      setLightningStrikes(prev => {
        const updated = prev.map(strike => ({
          ...strike,
          lifetime: strike.lifetime + 1
        })).filter(strike => strike.lifetime < strike.maxLifetime);

        updated.forEach(strike => {
          const alpha = 1 - (strike.lifetime / strike.maxLifetime);
          
          // Main lightning bolt
          ctx.strokeStyle = strike.color;
          ctx.lineWidth = 3 * strike.intensity;
          ctx.globalAlpha = alpha * strike.intensity;
          ctx.shadowBlur = 20;
          ctx.shadowColor = strike.color;
          
          // Draw main bolt
          ctx.beginPath();
          ctx.moveTo(strike.x, strike.y);
          
          // Jagged lightning path
          const boltLength = 30 + Math.random() * 30;
          let currentX = strike.x;
          let currentY = strike.y;
          
          for (let i = 0; i < 5; i++) {
            currentX += Math.cos(strike.angle + (Math.random() - 0.5) * 0.5) * (boltLength / 5);
            currentY += Math.sin(strike.angle + (Math.random() - 0.5) * 0.5) * (boltLength / 5);
            ctx.lineTo(currentX, currentY);
          }
          ctx.stroke();

          // Draw branches
          strike.branches.forEach(branch => {
            ctx.beginPath();
            ctx.moveTo(strike.x, strike.y);
            ctx.lineTo(branch.x, branch.y);
            ctx.stroke();
          });

          // Draw glow at strike point
          ctx.shadowBlur = 40;
          ctx.fillStyle = strike.color;
          ctx.globalAlpha = alpha * 0.8;
          ctx.beginPath();
          ctx.arc(strike.x, strike.y, 8 * strike.intensity, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        });

        return updated;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [moodLogs, rotation]);

  // Handle mouse move for interactivity
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Check if hovering over any lightning
    const hoveredLightning = lightningStrikes.find(strike => {
      const dist = Math.sqrt(
        Math.pow(mouseX - strike.x, 2) + Math.pow(mouseY - strike.y, 2)
      );
      return dist < 30;
    });

    if (hoveredLightning) {
      const log = moodLogs[Math.floor(Math.random() * moodLogs.length)];
      setHoveredStorm({
        mood: log.mood,
        date: log.date,
        x: mouseX,
        y: mouseY
      });
    } else {
      setHoveredStorm(null);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-4 bg-slate-950/50 rounded-lg border border-cyan-500/30">
      <h3 className="text-lg font-bold text-cyan-400 mb-2" data-testid="title-mood-planet">Mood Planet</h3>
      <p className="text-xs text-gray-400 mb-4 text-center">
        Watch lightning storms sweep across your emotional trading world
      </p>
      
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredStorm(null)}
          className="max-w-full h-auto cursor-pointer rounded-lg"
          data-testid="canvas-mood-planet"
        />

        {/* Hover tooltip */}
        {hoveredStorm && (
          <motion.div
            className="absolute bg-slate-900/95 border border-cyan-500/50 rounded-lg p-3 text-xs pointer-events-none z-10"
            style={{
              left: hoveredStorm.x + 10,
              top: hoveredStorm.y + 10
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            data-testid="tooltip-storm"
          >
            <div className="text-cyan-400 font-semibold">Storm Activity</div>
            <div className="text-gray-300">Mood: {hoveredStorm.mood}/10</div>
            <div className="text-gray-400 text-[10px]">{hoveredStorm.date}</div>
          </motion.div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-cyan-400" style={{ boxShadow: '0 0 8px #22d3ee' }}></div>
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-cyan-400 animate-ping" style={{ opacity: 0.4 }}></div>
          </div>
          <span className="text-gray-400">Good Mood Storms (8-10)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-orange-400" style={{ boxShadow: '0 0 6px #f97316' }}></div>
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-orange-400 animate-ping" style={{ opacity: 0.4 }}></div>
          </div>
          <span className="text-gray-400">Neutral Storms (5-7)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-pink-500" style={{ boxShadow: '0 0 5px #f43f5e' }}></div>
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-pink-500 animate-ping" style={{ opacity: 0.4 }}></div>
          </div>
          <span className="text-gray-400">Low Mood Storms (1-4)</span>
        </div>
      </div>

      <div className="mt-3 text-center">
        <p className="text-[10px] text-gray-500 italic">
          Continents shift as the planet rotates • Lightning intensity reflects your emotional state
        </p>
      </div>
    </div>
  );
}
