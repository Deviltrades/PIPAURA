import { useEffect, useRef, useState } from 'react';

interface MoodPlanetProps {
  moodLogs: Array<{ mood: number; date: string; pnl: number }>;
}

interface Continent {
  points: { x: number; y: number }[];
}

const getPlanetColors = (mood: number) => {
  if (mood >= 8) {
    return {
      base: 'rgba(16, 185, 129, 0.3)',
      glow: 'rgba(16, 185, 129, 0.6)',
      lightning: 'rgba(16, 185, 129, 1)',
    };
  } else if (mood >= 5) {
    return {
      base: 'rgba(6, 182, 212, 0.3)',
      glow: 'rgba(6, 182, 212, 0.6)',
      lightning: 'rgba(6, 182, 212, 1)',
    };
  } else if (mood >= 3) {
    return {
      base: 'rgba(251, 146, 60, 0.3)',
      glow: 'rgba(251, 146, 60, 0.6)',
      lightning: 'rgba(251, 146, 60, 1)',
    };
  } else {
    return {
      base: 'rgba(239, 68, 68, 0.3)',
      glow: 'rgba(239, 68, 68, 0.6)',
      lightning: 'rgba(239, 68, 68, 1)',
    };
  }
};

export function MoodPlanet({ moodLogs }: MoodPlanetProps) {
  // Calculate average mood from logs
  const averageMood = moodLogs.length > 0
    ? moodLogs.reduce((sum, log) => sum + log.mood, 0) / moodLogs.length
    : 5; // Default to neutral
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [continents, setContinents] = useState<Continent[]>([]);
  const rotationRef = useRef(0);
  const animationRef = useRef<number>();
  const lastFrameTimeRef = useRef(0);
  const staticCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const size = 300;
  const radius = size / 2 - 20;
  const centerX = size / 2;
  const centerY = size / 2;

  const colors = getPlanetColors(averageMood);

  // Generate fixed continents once
  useEffect(() => {
    const generateFixedContinents = (): Continent[] => {
      const newContinents: Continent[] = [];
      const numContinents = 6;
      
      for (let i = 0; i < numContinents; i++) {
        const baseAngle = (i / numContinents) * Math.PI * 2;
        const baseRadius = radius * (0.6 + (i % 3) * 0.2);
        
        const points: { x: number; y: number }[] = [];
        const numPoints = 20 + Math.floor(Math.random() * 15); // More points for smoother curves
        
        for (let j = 0; j < numPoints; j++) {
          const angleProgress = j / numPoints;
          const angle = baseAngle + angleProgress * (Math.PI / 1.2);
          
          // Create organic variations using multiple sine waves
          const variation1 = Math.sin(angleProgress * Math.PI * 4 + i) * 0.3;
          const variation2 = Math.cos(angleProgress * Math.PI * 6 + i * 2) * 0.2;
          const radiusVariation = 0.7 + variation1 + variation2 + Math.random() * 0.4;
          
          const r = baseRadius * radiusVariation;
          
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
  }, []);

  // Pre-render static grid to offscreen canvas
  useEffect(() => {
    if (continents.length === 0) return;

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = size;
    offscreenCanvas.height = size;
    const ctx = offscreenCanvas.getContext('2d');
    if (!ctx) return;

    // Draw grid lines
    ctx.strokeStyle = colors.lightning;
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.2;
    ctx.setLineDash([5, 5]);
    
    const gridLines = 12;
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
    
    for (let i = 0; i < gridLines; i++) {
      const angle = (i / gridLines) * Math.PI * 2;
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

    staticCanvasRef.current = offscreenCanvas;
  }, [continents, colors.lightning]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || continents.length === 0) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const targetFPS = 30;
    const frameInterval = 1000 / targetFPS;

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastFrameTimeRef.current;

      if (deltaTime < frameInterval) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      lastFrameTimeRef.current = currentTime - (deltaTime % frameInterval);

      // Update rotation using ref (no React re-render)
      rotationRef.current += 0.0008;

      // Clear canvas
      ctx.clearRect(0, 0, size, size);

      // Draw planet base
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw rotated grid
      if (staticCanvasRef.current) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(rotationRef.current);
        ctx.translate(-centerX, -centerY);
        ctx.drawImage(staticCanvasRef.current, 0, 0);
        ctx.restore();
      }

      // Draw continents
      continents.forEach((continent, continentIndex) => {
        const rotatedPoints = continent.points.map(p => {
          const dx = p.x - centerX;
          const dy = p.y - centerY;
          const cos = Math.cos(rotationRef.current);
          const sin = Math.sin(rotationRef.current);
          
          return {
            x: centerX + dx * cos - dy * sin,
            y: centerY + dx * sin + dy * cos
          };
        });

        // Draw filled continent
        ctx.fillStyle = colors.base;
        ctx.beginPath();
        ctx.moveTo(rotatedPoints[0].x, rotatedPoints[0].y);
        rotatedPoints.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;

        // Draw lightning borders with flowing electricity
        for (let i = 0; i < rotatedPoints.length; i++) {
          const p1 = rotatedPoints[i];
          const p2 = rotatedPoints[(i + 1) % rotatedPoints.length];
          
          const flowSpeed = 0.05;
          const flowPosition = (currentTime * flowSpeed * 0.001 + i * 0.5) % 1;
          const pulseOffset = (continentIndex * 30 + i * 10);
          const pulse = Math.sin((currentTime * 0.001 + pulseOffset) * 0.1) * 0.5 + 0.5;
          
          // Draw main lightning line
          ctx.strokeStyle = colors.lightning;
          ctx.lineWidth = 1.5;
          ctx.shadowBlur = 8;
          ctx.shadowColor = colors.lightning;
          ctx.globalAlpha = 0.4;
          
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          
          // Simplified jagged effect (3 segments instead of 5)
          const segments = 3;
          const dx = (p2.x - p1.x) / segments;
          const dy = (p2.y - p1.y) / segments;
          
          for (let j = 1; j < segments; j++) {
            const jitter = (Math.sin((currentTime * 0.001 + i * 20 + j * 10) * 0.2) * 3);
            const perpX = -dy * 0.08 * jitter;
            const perpY = dx * 0.08 * jitter;
            
            ctx.lineTo(
              p1.x + dx * j + perpX,
              p1.y + dy * j + perpY
            );
          }
          
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
          
          // Draw flowing pulse
          const pulseX = p1.x + (p2.x - p1.x) * flowPosition;
          const pulseY = p1.y + (p2.y - p1.y) * flowPosition;
          
          ctx.shadowBlur = 15;
          ctx.fillStyle = colors.lightning;
          ctx.globalAlpha = 0.9;
          ctx.beginPath();
          ctx.arc(pulseX, pulseY, 2.5, 0, Math.PI * 2); // Reduced from 4 to 2.5
          ctx.fill();
          
          // Draw 1 trailing particle (reduced from 2)
          const trailPos = (flowPosition - 0.1 + 1) % 1;
          const trailX = p1.x + (p2.x - p1.x) * trailPos;
          const trailY = p1.y + (p2.y - p1.y) * trailPos;
          
          ctx.globalAlpha = 0.5;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(trailX, trailY, 1.5, 0, Math.PI * 2); // Reduced from 2 to 1.5
          ctx.fill();
          
          // Draw vertex glow
          if (pulse > 0.6) {
            ctx.fillStyle = colors.lightning;
            ctx.shadowBlur = 12;
            ctx.globalAlpha = pulse * 0.6;
            ctx.beginPath();
            ctx.arc(p1.x, p1.y, 1.5 + pulse * 1.5, 0, Math.PI * 2); // Reduced from 2-4 to 1.5-3
            ctx.fill();
          }
          
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        }
      });

      // Outer glow
      const gradient = ctx.createRadialGradient(centerX, centerY, radius - 10, centerX, centerY, radius + 5);
      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(1, colors.glow);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [continents, colors]);

  return (
    <div className="flex justify-center items-center">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="rounded-full"
        style={{ filter: 'drop-shadow(0 0 20px rgba(6, 182, 212, 0.3))' }}
      />
    </div>
  );
}
