
import React, { useEffect, useRef } from 'react';

interface InkRippleProps {
  x: number;
  y: number;
}

const InkRipple: React.FC<InkRippleProps> = ({ x, y }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particles: {
      x: number;
      y: number;
      radius: number;
      vx: number;
      vy: number;
      alpha: number;
      life: number;
    }[] = [];

    const createParticle = () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      return {
        x: x,
        y: y,
        radius: Math.random() * 30 + 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 0.6,
        life: 1.0
      };
    };

    // Initial burst
    for (let i = 0; i < 60; i++) {
      particles.push(createParticle());
    }

    let animationFrame: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.radius += 1.2;
        p.life -= 0.015;
        p.alpha = p.life * 0.4;

        if (p.life > 0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(166, 44, 43, ${p.alpha})`;
          ctx.fill();
        }
      });

      if (particles.some(p => p.life > 0)) {
        animationFrame = requestAnimationFrame(render);
      }
    };

    render();
    return () => cancelAnimationFrame(animationFrame);
  }, [x, y]);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-[200] filter blur-xl opacity-60"
    />
  );
};

export default InkRipple;
