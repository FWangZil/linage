
import React, { useState, useRef, useEffect } from 'react';
import { WINDOW_MASKS } from '../constants';
import { WindowShape } from '../types';

interface GardenWindowProps {
  shape: WindowShape;
  imageUrl: string;
  className?: string;
  title?: string;
  subtitle?: string;
  isHero?: boolean;
}

const GardenWindow: React.FC<GardenWindowProps> = ({ 
  shape, 
  imageUrl, 
  className = "", 
  title, 
  subtitle,
  isHero = false 
}) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isActivated, setIsActivated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.9) {
        setIsActivated(true);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMouseEnter = () => {
    window.dispatchEvent(new CustomEvent('silk-wiggle-start'));
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
    window.dispatchEvent(new CustomEvent('silk-wiggle-end'));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current || isHero) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const uniqueId = Math.random().toString(36).substr(2, 9);
  const maskId = `mask-${shape}-${uniqueId}`;
  const patternId = `pattern-${shape}-${uniqueId}`;

  if (isHero) {
    return (
      <div 
        ref={containerRef}
        className={`relative overflow-visible ${className}`}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <pattern id={patternId} patternUnits="userSpaceOnUse" width="100" height="100">
              <image 
                href={imageUrl} 
                x="0" y="0" 
                width="100" height="100" 
                preserveAspectRatio="xMidYMid slice" 
              />
            </pattern>
          </defs>
          <path 
            d={WINDOW_MASKS[shape]} 
            fill={`url(#${patternId})`} 
            className="transition-all duration-1000"
            style={{ 
              filter: isActivated ? 'blur(0px) opacity(1)' : 'blur(20px) opacity(0.5)',
            }}
          />
          <path 
            d={WINDOW_MASKS[shape]} 
            fill="none" 
            stroke="#2D2A26" 
            strokeWidth="0.4" 
            className="opacity-30" 
          />
        </svg>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative group overflow-visible transition-all duration-1000 ${className}`}
      style={{ perspective: '1200px' }}
    >
      <svg width="0" height="0" className="absolute">
        <defs>
          <clipPath id={maskId} clipPathUnits="objectBoundingBox">
            <path d={WINDOW_MASKS[shape].replace(/[0-9.]+/g, (n) => (parseFloat(n) / 100).toString())} />
          </clipPath>
        </defs>
      </svg>

      {/* Unified Window Container */}
      <div 
        className="relative w-full aspect-square transition-all duration-1000 ease-out z-10"
        style={{ 
          transform: `rotateX(${mousePos.y * 8}deg) rotateY(${mousePos.x * 8}deg)`,
        }}
      >
        {/* Masked Content - Precisely centered and filling the space */}
        <div 
          className="absolute inset-0 overflow-hidden transition-all duration-1000"
          style={{ 
            clipPath: `url(#${maskId})`,
            filter: isActivated ? 'blur(0px) brightness(1)' : 'blur(15px) brightness(0.8)',
          }}
        >
          <img 
            src={imageUrl} 
            alt={title || "Heritage View"} 
            className="w-full h-full object-cover transition-transform duration-1000 ease-out scale-110"
            style={{ transform: `translate(${mousePos.x * 30}px, ${mousePos.y * 30}px)` }}
          />
          <div className="absolute inset-0 bg-black/5 mix-blend-multiply opacity-20" />
        </div>

        {/* Frame Border - Perfectly aligned with the mask edges */}
        <div className="absolute inset-0 z-20 pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path 
              d={WINDOW_MASKS[shape]} 
              fill="none" 
              stroke="#2D2A26" 
              strokeWidth="0.8" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="opacity-60"
            />
          </svg>
        </div>
      </div>

      {/* Text Content */}
      {(title || subtitle) && (
        <div className="mt-12 text-center space-y-3">
            {subtitle && (
              <span className="block text-[#666] text-[9px] tracking-[0.5em] uppercase opacity-60">
                {subtitle}
              </span>
            )}
            {title && (
              <h4 className={`serif-font text-2xl tracking-[0.2em] text-[#2D2A26] transition-all duration-1000 transform ${
                isActivated ? 'opacity-80 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                  {title}
              </h4>
            )}
        </div>
      )}
    </div>
  );
};

export default GardenWindow;
