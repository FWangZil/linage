
import React, { useEffect, useRef } from 'react';

interface ZenLoaderProps {
  isLoading: boolean;
  message?: string;
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  alpha: number;
  life: number;
}

const ZenLoader: React.FC<ZenLoaderProps> = ({ isLoading, message = "INITIATING LINEAGE..." }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isLoading) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = [];
    let animationFrame: number;

    const createParticle = () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 0.5 + 0.1;
      return {
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: Math.random() * 20 + 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: Math.random() * 0.3 + 0.1,
        life: 1.0
      };
    };

    const render = () => {
      // Create a slight trail effect
      ctx.fillStyle = 'rgba(250, 249, 246, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (particles.length < 50) {
        particles.push(createParticle());
      }

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.radius += 0.2;
        p.life -= 0.005;
        p.alpha = p.life * 0.2;

        if (p.life <= 0) {
          particles[i] = createParticle();
        }

        ctx.beginPath();
        // Use an irregular drawing to simulate ink bloom
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(166, 44, 43, ${p.alpha})`; // Ink red
        ctx.fill();
        
        // Add core darkness
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(45, 42, 38, ${p.alpha * 0.5})`; // Ink black
        ctx.fill();
      });

      animationFrame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrame);
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#FAF9F6]/95 flex flex-col items-center justify-center backdrop-blur-md">
      <div className="relative">
        <canvas 
          ref={canvasRef} 
          width={400} 
          height={400} 
          className="w-full max-w-sm aspect-square filter blur-xl opacity-80" 
        />
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <p className="serif-font text-[#2D2A26] tracking-[0.6em] text-xs animate-pulse text-center">
            {message}
          </p>
          <div className="mt-4 w-32 h-[1px] bg-[#A62C2B] scale-x-0 animate-[scale-x_2s_ease-in-out_infinite]" />
        </div>
      </div>
      <style>{`
        @keyframes scale-x {
          0% { transform: scaleX(0); opacity: 0; }
          50% { transform: scaleX(1); opacity: 1; }
          100% { transform: scaleX(0); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default ZenLoader;
