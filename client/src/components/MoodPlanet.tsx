import { useEffect, useRef, useState } from 'react';

interface MoodPlanetProps {
  averageMood: number;
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

export function MoodPlanet({ averageMood }: MoodPlanetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [continents, setContinents] = useState<Continent[]>([]);
  const rotationRef = useRef(0);
  const animationRef = useRef<number>();
  const lastFrameTimeRef = useRef(0);
  const staticCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const prefersReducedMotion = useRef(
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  const size = 300;
  const radius = size / 2 - 20;
  const centerX = size / 2;
  const centerY = size / 2;

  const colors = getPlanetColors(averageMood);

  // Generate fixed continents once
  useEffect(() => {
    const generateFixedContinents = (): Continent[] => {
      const newContinents: Continent[] = [];
      const numContinents = 5; // Reduced to 5 for better performance
      
      for (let i = 0; i < numContinents; i++) {
        const baseAngle = (i / numContinents) * Math.PI * 2;
        const baseRadius = radius * (0.65 + (i % 3) * 0.15);
        
        const points: { x: number; y: number }[] = [];
        const numPoints = 12 + Math.floor(Math.random() * 6); // Further reduced
        
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
  }, []);

  // Pre-render static elements to offscreen canvas
  useEffect(() => {
    if (continents.length === 0) return;

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = size;
    offscreenCanvas.height = size;
    const ctx = offscreenCanvas.getContext('2d');
    if (!ctx) return;

    // Draw static grid lines
    ctx.strokeStyle = colors.lightning;
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.15;
    ctx.setLineDash([5, 5]);
    
    const gridLines = 8; // Reduced from 12
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
    
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    staticCanvasRef.current = offscreenCanvas;
  }, [continents, colors.lightning]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || continents.length === 0) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const targetFPS = prefersReducedMotion.current ? 20 : 30; // Throttled to 30fps (or 20 for reduced motion)
    const frameInterval = 1000 / targetFPS;

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastFrameTimeRef.current;

      // Throttle to target FPS
      if (deltaTime < frameInterval) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      lastFrameTimeRef.current = currentTime - (deltaTime % frameInterval);

      // Update rotation using ref (no React re-render)
      rotationRef.current += prefersReducedMotion.current ? 0.0003 : 0.0008;

      // Clear canvas
      ctx.clearRect(0, 0, size, size);

      // Draw planet base circle
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw static grid from offscreen canvas
      if (staticCanvasRef.current) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(rotationRef.current);
        ctx.translate(-centerX, -centerY);
        ctx.drawImage(staticCanvasRef.current, 0, 0);
        ctx.restore();
      }

      // Draw continents with rotation
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

        // Simplified border - only every other edge for performance
        for (let i = 0; i < rotatedPoints.length; i += 2) { // Skip every other edge
          const p1 = rotatedPoints[i];
          const p2 = rotatedPoints[(i + 1) % rotatedPoints.length];
          
          // Simple line without jagged effect
          ctx.strokeStyle = colors.lightning;
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.3;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();

          // Only show pulse on reduced set of edges
          if (i % 4 === 0 && !prefersReducedMotion.current) {
            const flowSpeed = 0.03;
            const flowPosition = (currentTime * flowSpeed * 0.001 + i * 0.5) % 1;
            const pulseX = p1.x + (p2.x - p1.x) * flowPosition;
            const pulseY = p1.y + (p2.y - p1.y) * flowPosition;
            
            // Single pulse glow without trail
            ctx.fillStyle = colors.lightning;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(pulseX, pulseY, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        
        ctx.globalAlpha = 1;
      });

      // Outer glow ring
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
  }, [continents, colors, prefersReducedMotion.current]);

  return (
    <div className="flex justify-center items-center">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="rounded-full"
        style={{ 
          filter: prefersReducedMotion.current ? 'none' : 'drop-shadow(0 0 20px rgba(6, 182, 212, 0.3))'
        }}
      />
    </div>
  );
}
