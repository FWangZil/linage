
import React, { useState, useRef } from 'react';
import GardenWindow from './GardenWindow';
import ZenLoader from './ZenLoader';

export interface TeaRegion {
  id: string;
  name: string;
  chineseName: string;
  x: number; // SVG coordinates
  y: number;
  img: string;
  description: string;
}

export const TEA_REGIONS: TeaRegion[] = [
  { id: 'bi-luo-chun', name: 'Bi Luo Chun', chineseName: '碧螺春', x: 310, y: 190, img: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=500', description: 'Jiangsu - Floral fragrance absorbed from fruit trees.' },
  { id: 'long-jing', name: 'West Lake Longjing', chineseName: '西湖龙井', x: 305, y: 210, img: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=500', description: 'Zhejiang - The "King of Green Tea" with four virtues.' },
  { id: 'pu-erh', name: 'Yunnan Pu-erh', chineseName: '普洱茶', x: 160, y: 255, img: 'https://images.unsplash.com/photo-1594631252845-29fc45865157?auto=format&fit=crop&w=500', description: 'Yunnan - Ancient trees and fermented wisdom.' },
  { id: 'tie-guan-yin', name: 'Anxi Tieguanyin', chineseName: '安溪铁观音', x: 300, y: 245, img: 'https://images.unsplash.com/photo-1563911191333-dc1899094c32?auto=format&fit=crop&w=500', description: 'Fujian - Dragonfly head and frog legs, orchids in a cup.' },
  { id: 'da-hong-pao', name: 'Wuyi Da Hong Pao', chineseName: '武夷大红袍', x: 285, y: 235, img: 'https://images.unsplash.com/photo-1515696955266-4f67e13219e8?auto=format&fit=crop&w=500', description: 'Fujian - Rock tea with a bone-deep mineral soul.' }
];

interface TeaDetailProps {
  collectedTeaIds: string[];
  onUpdateCollection: (ids: string[]) => void;
}

const TeaDetail: React.FC<TeaDetailProps> = ({ collectedTeaIds, onUpdateCollection }) => {
  const [activeRegion, setActiveRegion] = useState<TeaRegion | null>(null);
  const [isMinting, setIsMinting] = useState(false);
  const [showInquiryModal, setShowInquiryModal] = useState<TeaRegion | null>(null);
  const [showTributeModal, setShowTributeModal] = useState<TeaRegion | null>(null);
  const [tributeMessage, setTributeMessage] = useState("");
  const [showPassport, setShowPassport] = useState(false);
  const [pullRatio, setPullRatio] = useState(0); 
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMint = async (region: TeaRegion) => {
    setShowTributeModal(null);
    setShowInquiryModal(null);
    setIsMinting(true);
    // Simulate Blockchain Minting
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const newCollection = [...collectedTeaIds, region.id];
    onUpdateCollection(newCollection);
    
    setIsMinting(false);
    setTributeMessage("");
    setActiveRegion(null);
  };

  const handleCardMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const y = (e.clientY - rect.top) / rect.height;
    setPullRatio(Math.max(0, Math.min(y, 1)));
  };

  const openInquiry = (region: TeaRegion) => {
    setShowInquiryModal(region);
  };

  const acceptTribute = () => {
    setShowTributeModal(showInquiryModal);
    setShowInquiryModal(null);
  };

  const skipTribute = () => {
    if (showInquiryModal) {
      handleMint(showInquiryModal);
    }
  };

  return (
    <div className="pt-40 min-h-screen bg-[#FAF9F6] px-8 md:px-12 flex flex-col items-center animate-fade-in relative overflow-hidden m-0 p-0">
      <ZenLoader isLoading={isMinting} message="INSCRIBING HERITAGE ON CHAIN..." />

      <header className="text-center mb-16 space-y-4">
        <p className="text-[11px] tracking-[0.5em] text-[#D4AF37] uppercase">The Geography of Taste / 茶域图谱</p>
        <h2 className="serif-font text-5xl md:text-6xl italic">The Scent of the Earth</h2>
        <div className="w-24 h-[1px] bg-[#A62C2B]/30 mx-auto" />
      </header>

      <div className="relative w-full max-w-5xl aspect-[1.4/1] flex items-center justify-center mb-12">
        <svg viewBox="0 0 450 350" className="w-full h-full drop-shadow-sm">
          <path 
            d="M366.6,187.3c-2.4-0.8-4.8-1.7-7.3-2.5c-4.3-1.4-8.7-2.7-13.1-3.9c-4.4-1.2-8.8-2.3-13.3-3.1c-6.1-1.1-12.3-1.8-18.5-2.2c-5.7-0.3-11.3-0.5-17,0.1c-5.1,0.5-10.1,1.5-15.2,2.3c-4.5,0.7-9.1,1.3-13.6,1.4c-4.7,0.1-9.5,0-14.2-0.6c-4.4-0.6-8.8-1.5-13.2-2.1c-6.2-0.9-12.3-1.2-18.6-0.7c-6.2,0.5-12.4,1.8-18.4,3.8c-4.4,1.4-8.7,3.1-12.8,5.4c-5.5,3.2-10.4,7.4-15.4,11.5c-4.3,3.6-8.6,7.2-13.1,10.5c-5.6,4.1-11.4,7.8-17.6,11c-10.5,5.3-21.3,9.7-32.3,13.6c-10.6,3.8-21.4,7.1-32.4,9.6c-10.3,2.4-20.7,4.3-31.2,5.6c-11.6,1.4-23.2,1.8-34.9,1.3c-5.7-0.2-11.5-0.7-17.2-1.7c-4.7-0.8-9.4-2-13.9-4.2c-4.3-2.1-8.1-5-11.5-8.5c-4.7-4.8-8.5-10.4-11-16.7c-2.5-6.3-4-12.8-4.8-19.5c-0.8-6.7,0.3-13.5,2.4-19.9c2.3-7,5.5-13.7,9.6-19.9c3.9-5.9,8.5-11.4,13.8-16.3c3.4-3.1,7.2-5.9,11.2-8.3c8.5-5.2,17.7-9.1,27.1-12.3c8.9-3,18.1-5.3,27.4-7c10.4-1.9,20.9-3.2,31.4-4c13.7-1.1,27.4-1.4,41.1-1c9.4,0.3,18.7,1.1,28,2.7c9.3,1.6,18.3,4.2,27,8.1c5.9,2.7,11.5,5.9,16.7,10c4.7,3.6,8.8,7.9,12.5,12.6c3.2,4.1,5.8,8.6,7.9,13.3c2,4.4,3.4,9.1,4.3,13.8c0.8,4.3,1.1,8.7,0.9,13c-0.1,4.4-0.8,8.8-1.9,13.1c-1.1,4.4-2.6,8.7-4.4,12.8"
            fill="#2D2A26" 
            fillOpacity="0.04" 
            stroke="#2D2A26" 
            strokeWidth="0.8" 
            opacity="0.2"
            className="cursor-default"
            onClick={() => setActiveRegion(null)}
          />

          {TEA_REGIONS.map(r => (
            <g 
              key={r.id} 
              onClick={(e) => { e.stopPropagation(); setActiveRegion(r); }}
              className="cursor-pointer group"
            >
              <circle cx={r.x} cy={r.y} r="15" fill="transparent" />
              <circle cx={r.x} cy={r.y} r="8" className={`fill-[#A62C2B]/10 transition-all duration-700 ${activeRegion?.id === r.id ? 'opacity-100 scale-125' : 'opacity-0 group-hover:opacity-100'}`} />
              <circle 
                cx={r.x} 
                cy={r.y} 
                r={collectedTeaIds.includes(r.id) ? "4" : "3"} 
                fill={collectedTeaIds.includes(r.id) ? "#A62C2B" : (activeRegion?.id === r.id ? '#A62C2B' : '#D4AF37')} 
                className="transition-all duration-500" 
              />
              {collectedTeaIds.includes(r.id) && (
                <circle cx={r.x} cy={r.y} r="6" fill="none" stroke="#A62C2B" strokeWidth="0.5" className="animate-ping opacity-20" />
              )}
            </g>
          ))}
        </svg>

        {activeRegion && (
          <div 
            className="absolute z-50 pointer-events-auto animate-fade-in"
            style={{ 
              left: `${(activeRegion.x / 450) * 100}%`, 
              top: `${(activeRegion.y / 350) * 100}%`,
              transform: 'translate(-50%, -115%)'
            }}
          >
            <div 
              ref={cardRef}
              onMouseMove={handleCardMouseMove}
              className="bg-[#FAF9F6] p-0 shadow-2xl border border-[#2D2A26]/10 min-w-[280px] overflow-hidden group"
              style={{ clipPath: 'polygon(1% 2%, 99% 1%, 98% 98%, 2% 97%)' }}
            >
               <div className="relative h-48 w-full overflow-hidden transition-all duration-700 ease-out">
                 <img 
                   src={activeRegion.img} 
                   className="w-full h-full object-cover transition-transform duration-500"
                   style={{ transform: `scale(1.2) translateY(${pullRatio * 30}px)` }}
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-[#FAF9F6] via-transparent to-transparent opacity-60" />
                 
                 <button 
                  onClick={(e) => { e.stopPropagation(); setActiveRegion(null); }}
                  className="absolute top-4 right-4 text-xs opacity-20 hover:opacity-100 p-2 z-20"
                 >✕</button>
               </div>

               <div className="px-8 pb-10 -mt-6 relative z-10 space-y-4">
                  <div 
                    className="transition-transform duration-500"
                    style={{ transform: `translateY(${(pullRatio - 0.5) * 10}px)` }}
                  >
                    <h3 className="serif-font text-2xl">{activeRegion.name}</h3>
                    <p className="text-[10px] tracking-[0.4em] text-[#A62C2B] uppercase">{activeRegion.chineseName}</p>
                  </div>

                  <p 
                    className="text-[10px] leading-relaxed opacity-60 italic transition-all duration-500"
                    style={{ 
                      transform: `translateY(${(pullRatio - 0.5) * 15}px)`,
                      opacity: 0.4 + (1 - pullRatio) * 0.4 
                    }}
                  >
                    {activeRegion.description}
                  </p>
                  
                  {collectedTeaIds.includes(activeRegion.id) ? (
                    <div className="text-[9px] tracking-[0.3em] text-[#A62C2B]/60 uppercase border border-[#A62C2B]/20 px-4 py-2 text-center">
                      Verified Heritage
                    </div>
                  ) : (
                    <button 
                      onClick={() => openInquiry(activeRegion)}
                      className="bg-[#B22222] text-[#FAF9F6] text-[10px] tracking-[0.5em] px-6 py-4 uppercase shadow-md hover:brightness-110 active:scale-95 transition-all w-full"
                      style={{ clipPath: 'polygon(2% 4%, 98% 2%, 97% 96%, 3% 98%)' }}
                    >
                      藏茶印 / Mint
                    </button>
                  )}
               </div>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-12 left-12 z-[80]">
        <button 
          onClick={() => setShowPassport(true)}
          className="group flex flex-col items-center gap-3 bg-[#FAF9F6] border border-[#2D2A26]/10 p-5 hover:border-[#A62C2B]/40 transition-all shadow-lg hover:-translate-y-1"
        >
          <div className="w-12 h-16 border border-[#2D2A26]/20 bg-[#FAF9F6] relative overflow-hidden group-hover:scale-110 transition-transform flex items-center justify-center">
             <div className="absolute top-1 left-1 right-1 bottom-1 border border-[#2D2A26]/5" />
             <span className="vertical-text text-[9px] tracking-[0.4em] opacity-40 uppercase">PASSPORT</span>
             {collectedTeaIds.length > 0 && (
               <div className="absolute top-0 right-0 bg-[#A62C2B] text-white text-[9px] px-1.5 py-0.5 font-bold">
                 {collectedTeaIds.length}
               </div>
             )}
          </div>
          <span className="text-[9px] tracking-[0.5em] uppercase opacity-40 group-hover:opacity-100 group-hover:text-[#A62C2B] transition-all">Heritage Pass</span>
        </button>
      </div>

      {showInquiryModal && (
        <div className="fixed inset-0 z-[130] bg-[#FAF9F6]/90 backdrop-blur-sm flex items-center justify-center p-8">
          <div 
            className="max-w-md w-full bg-[#FAF9F6] p-12 shadow-2xl border border-[#2D2A26]/10 relative text-center space-y-8"
            style={{ clipPath: 'polygon(1% 1%, 99% 0%, 100% 99%, 0% 100%)' }}
          >
            <button 
              onClick={() => setShowInquiryModal(null)}
              className="absolute top-6 right-6 text-xl opacity-20 hover:opacity-100 transition-opacity"
            >✕</button>
            <header className="space-y-4">
               <span className="text-[10px] tracking-[0.6em] text-[#D4AF37] uppercase">The First Bow / 首礼</span>
               <h3 className="serif-font text-3xl italic">Pay Respects?</h3>
               <p className="text-[11px] leading-relaxed opacity-60 max-w-xs mx-auto italic">
                 Would you like to inscribe a tribute to the master craftsman who birthed this artifact?
               </p>
            </header>
            <div className="flex flex-col gap-4">
              <button 
                onClick={acceptTribute}
                className="w-full py-4 bg-[#B22222] text-[#FAF9F6] text-[10px] tracking-[0.5em] uppercase hover:brightness-110 transition-all"
                style={{ clipPath: 'polygon(1% 3%, 99% 2%, 98% 97%, 2% 98%)' }}
              >
                Yes, Pay Respects / 敬礼
              </button>
              <button 
                onClick={skipTribute}
                className="w-full py-4 border border-[#2D2A26]/10 text-[#2D2A26] text-[10px] tracking-[0.5em] uppercase hover:bg-[#2D2A26]/5 transition-all"
                style={{ clipPath: 'polygon(2% 1%, 98% 2%, 97% 99%, 3% 97%)' }}
              >
                Direct Mint / 直接铸造
              </button>
            </div>
          </div>
        </div>
      )}

      {showTributeModal && (
        <div className="fixed inset-0 z-[110] bg-[#FAF9F6]/80 backdrop-blur-md flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-[#FAF9F6] p-12 shadow-2xl border border-[#2D2A26]/10 relative">
            <button 
              onClick={() => setShowTributeModal(null)}
              className="absolute top-6 right-6 text-2xl opacity-20 hover:opacity-100 transition-opacity"
            >✕</button>
            <header className="text-center space-y-4 mb-10">
              <span className="text-[10px] tracking-[0.5em] text-[#D4AF37] uppercase">敬匠人 / Pay Respects</span>
              <h3 className="serif-font text-3xl italic">Tribute to the Master</h3>
              <p className="text-[10px] opacity-40 uppercase tracking-widest leading-relaxed">
                Your words will be bound to this artifact's history on the immutable chain.
              </p>
            </header>
            <textarea 
              value={tributeMessage}
              onChange={(e) => setTributeMessage(e.target.value)}
              placeholder="Inscribe your thoughts here..."
              className="w-full bg-[#2D2A26]/5 border-none p-6 text-sm italic focus:ring-1 focus:ring-[#A62C2B]/30 outline-none transition-all mb-8"
              rows={4}
            />
            <button 
              onClick={() => handleMint(showTributeModal)}
              className="w-full py-4 bg-[#B22222] text-[#FAF9F6] text-[10px] tracking-[0.5em] uppercase hover:brightness-110 transition-all"
              style={{ clipPath: 'polygon(1% 2%, 99% 1%, 98% 98%, 2% 97%)' }}
            >
              Confirm Inscription / 藏茶印
            </button>
          </div>
        </div>
      )}

      {showPassport && (
        <div className="fixed inset-0 z-[120] bg-[#121212]/95 flex items-center justify-center p-8 md:p-24 animate-fade-in">
          <div className="max-w-6xl w-full h-full bg-[#FAF9F6] overflow-y-auto p-12 md:p-20 relative shadow-2xl">
            <button 
              onClick={() => setShowPassport(false)}
              className="absolute top-6 right-6 md:top-10 md:right-10 text-2xl md:text-3xl opacity-30 hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 z-[130] text-[#2D2A26] flex items-center justify-center w-10 h-10 hover:bg-[#2D2A26]/5 rounded-full"
            >✕</button>
            <header className="mb-20 space-y-4 border-b border-[#2D2A26]/5 pb-12">
              <h2 className="serif-font text-5xl italic">Tea Passport</h2>
              <p className="text-[10px] tracking-[0.6em] uppercase opacity-40">Your Curated Collection of Jiangnan Mists</p>
            </header>
            {collectedTeaIds.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center opacity-30 space-y-4">
                <div className="w-12 h-12 border border-dashed border-[#2D2A26] rounded-full animate-spin" />
                <p className="text-[10px] tracking-[0.4em] uppercase">The scroll is yet blank.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
                {collectedTeaIds.map(id => {
                  const region = TEA_REGIONS.find(r => r.id === id);
                  return region ? (
                    <div key={id} className="group space-y-6">
                      <GardenWindow shape="haitang" imageUrl={region.img} className="w-full aspect-square" />
                      <div className="text-center">
                        <h4 className="serif-font text-xl">{region.name}</h4>
                        <p className="text-[9px] tracking-[0.3em] text-[#A62C2B] uppercase mt-1">Provenance Verified</p>
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .vertical-text {
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
      `}</style>
    </div>
  );
};

export default TeaDetail;
