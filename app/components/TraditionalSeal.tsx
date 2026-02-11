
import React from 'react';

interface TraditionalSealProps {
  text: string;
  onClick?: () => void;
  className?: string;
}

const TraditionalSeal: React.FC<TraditionalSealProps> = ({ text, onClick, className = "" }) => {
  return (
    <div className={`relative group cursor-pointer ${className}`} onClick={onClick}>
      {/* SVG Filters for the Seal Effect */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          <filter id="seal-roughness">
            <feTurbulence type="fractalNoise" baseFrequency="0.15" numOctaves="5" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="seal-ink-bleed">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.6" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="bleed" />
            <feComposite in="SourceGraphic" in2="bleed" operator="over" />
          </filter>
        </defs>
      </svg>

      {/* The Seal Container */}
      <div 
        className="relative w-48 h-48 flex items-center justify-center transition-all duration-700 transform group-hover:scale-110 group-active:scale-95"
        style={{
          filter: 'drop-shadow(0 10px 20px rgba(178,34,34,0.2))'
        }}
      >
        {/* Seal Stone Base */}
        <div 
          className="absolute inset-0 bg-[#B22222] shadow-inner"
          style={{
            filter: 'url(#seal-roughness)',
            backgroundImage: `url('https://www.transparenttextures.com/patterns/natural-paper.png')`,
            backgroundBlendMode: 'soft-light',
            clipPath: 'polygon(2% 5%, 95% 2%, 98% 94%, 5% 98%, 3% 50%)'
          }}
        />

        {/* Inner Border Frame */}
        <div 
          className="absolute inset-3 border-[3px] border-[#FAF9F6] opacity-40"
          style={{
            filter: 'url(#seal-roughness)',
            clipPath: 'polygon(1% 1%, 99% 2%, 98% 98%, 2% 99%)'
          }}
        />

        {/* Seal Content */}
        <div 
          className="relative z-10 flex flex-col items-center justify-center text-[#FAF4E6] text-center px-4"
          style={{ 
            filter: 'url(#seal-ink-bleed)',
          }}
        >
          <span className="serif-font font-[900] text-xl tracking-[0.1em] leading-tight uppercase mb-1">
            {text.split(' ').slice(0, 2).join(' ')}
          </span>
          <div className="w-12 h-[1px] bg-[#FAF4E6] opacity-30 my-2" />
          <span className="serif-font font-[900] text-xl tracking-[0.1em] leading-tight uppercase">
            {text.split(' ').slice(2).join(' ')}
          </span>
          
          {/* Decorative Chinese Character for 'Legacy/Lineage' */}
          <span className="text-3xl mt-2 opacity-90 font-light" style={{ fontFamily: '"Noto Serif SC", serif' }}>
            迹
          </span>
        </div>
      </div>

      {/* Hover Pulse Effect */}
      <div className="absolute inset-0 bg-[#B22222]/20 blur-2xl rounded-full scale-0 group-hover:scale-100 transition-transform duration-1000 opacity-0 group-hover:opacity-40 pointer-events-none" />
    </div>
  );
};

export default TraditionalSeal;
