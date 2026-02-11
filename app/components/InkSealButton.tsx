
import React, { useState, useEffect } from 'react';

interface InkSealButtonProps {
  onConnect?: () => void;
  onProfileClick?: () => void;
  isConnected?: boolean;
  address?: string;
}

const InkSealButton: React.FC<InkSealButtonProps> = ({ onConnect, onProfileClick, isConnected, address }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPulsating, setIsPulsating] = useState(false);

  useEffect(() => {
    const handleMintStart = () => setIsPulsating(true);
    const handleMintEnd = () => setIsPulsating(false);

    window.addEventListener('linage-mint-start', handleMintStart);
    window.addEventListener('linage-mint-end', handleMintEnd);

    return () => {
      window.removeEventListener('linage-mint-start', handleMintStart);
      window.removeEventListener('linage-mint-end', handleMintEnd);
    };
  }, []);

  // Take first 4 characters for a compact seal look
  const displayAddress = address ? address.slice(0, 4).toUpperCase() : '';

  return (
    <div className="flex items-center justify-center h-20 w-32 md:w-40 relative group overflow-visible">
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <filter id="cinnabar-roughness">
          <feTurbulence type="fractalNoise" baseFrequency="0.15" numOctaves="4" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="ink-bleed">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.4" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -8" result="bleed" />
          <feComposite in="SourceGraphic" in2="bleed" operator="over" />
        </filter>
      </svg>

      <button
        onClick={isConnected ? onProfileClick : onConnect}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`relative flex items-center justify-center transition-all duration-500 transform hover:scale-105 active:scale-95 z-20 ${isPulsating ? 'animate-seal-pulse shadow-[0_0_30px_rgba(178,34,34,0.4)]' : ''}`}
        style={{
          width: '120px',
          height: '60px',
        }}
      >
        <div 
          className="absolute inset-0 bg-[#B22222] opacity-95 shadow-lg transition-all duration-700"
          style={{
            filter: 'url(#cinnabar-roughness)',
            backgroundImage: `url('https://www.transparenttextures.com/patterns/natural-paper.png')`,
            backgroundBlendMode: 'soft-light',
            clipPath: 'polygon(1% 4%, 98% 2%, 96% 97%, 3% 95%)'
          }}
        />

        <div 
          className="absolute inset-1.5 border-[1.5px] border-[#FAF9F6] opacity-30 pointer-events-none"
          style={{ filter: 'url(#cinnabar-roughness)' }}
        />

        <div 
          className="relative z-10 flex flex-col items-center justify-center text-[#FAF4E6] px-2 text-center"
          style={{ 
            filter: 'url(#ink-bleed)',
            letterSpacing: '-0.05em'
          }}
        >
          {isConnected ? (
            <div className="flex flex-col items-center">
              <span className="serif-font font-[800] text-[10px] tracking-[0.2em] opacity-80 leading-none mb-1 uppercase">
                User
              </span>
              <div className="w-10 h-[1px] bg-[#FAF4E6] opacity-20 my-1" />
              <span className="serif-font font-[900] text-lg leading-none uppercase">
                {displayAddress}
              </span>
            </div>
          ) : (
            <span className="serif-font font-[900] text-xs md:text-sm tracking-[-0.05em] leading-tight uppercase">
              SEAL YOUR <br /> MARK
            </span>
          )}
        </div>
      </button>

      {isConnected && isHovered && (
        <div 
          onClick={onConnect}
          className="absolute -bottom-6 cursor-pointer opacity-40 hover:opacity-100 transition-opacity z-30"
        >
           <div className="w-1 h-1 bg-[#A62C2B] rounded-full mx-auto" />
        </div>
      )}

      <style>{`
        .serif-font { 
            font-family: 'Playfair Display', 'Noto Serif SC', serif; 
        }
        @keyframes seal-pulse {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.1); filter: brightness(1.2); }
        }
        .animate-seal-pulse {
          animation: seal-pulse 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default InkSealButton;
