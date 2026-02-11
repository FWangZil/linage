
import React from 'react';
import { motion } from 'framer-motion';
import { ExperienceItem } from '../types';
import GardenWindow from './GardenWindow';

export const EXPERIENCE_DATA: ExperienceItem[] = [
  {
    id: '1',
    title: 'Moonlight Tea Rites',
    chineseTitle: '月下茶礼',
    location: 'Suzhou, Lion Grove Garden',
    description: 'A silent communion with the spirit of the leaf. Under the amber glow of the midnight moon, we witness the tea master perform rites that date back to the Tang Dynasty. Each movement is a verse, each sip a lifetime. You will learn to hear the water boil and see the leaves dance in the dark.',
    imageUrl: 'https://images.unsplash.com/photo-1545167622-3a6ac756aff4?auto=format&fit=crop&w=1500'
  },
  {
    id: '2',
    title: 'The Ink Silence',
    chineseTitle: '墨意之寂',
    location: 'Hangzhou, West Lake Studio',
    description: 'The friction of stone against soot creates more than just ink—it creates a space for meditation. In this experience, you spend four hours splitting a single silk thread, learning that patience is not just a virtue, but the core of existence. The world outside vanishes, leaving only the sound of breathing and the scent of pine soot.',
    imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1500'
  },
  {
    id: '3',
    title: 'Echoes of the Gourd',
    chineseTitle: '古琴之响',
    location: 'Beijing, Forbidden Studio',
    description: 'Listening to the resonance of a 300-year-old Guqin. The vibrations are felt in the marrow of the bone, bridging the gap between the modern pulse and the ancient rhythm of the mountains. A master will guide you through the "silk strings" notation, a language of music that predates the Western staff by millennia.',
    imageUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1500'
  },
  {
    id: '4',
    title: 'The Vanishing Loom',
    chineseTitle: '锦绣之梭',
    location: 'Nanjing, Brocade Museum',
    description: 'Step into the rhythm of the Cloud Brocade loom. This colossal wooden machine requires two masters working in perfect synchronization—one above to pull the threads of the pattern, one below to throw the shuttle. It is a living clockwork of silk, gold, and peacock feathers, weaving fabrics that were once reserved only for the Emperor.',
    imageUrl: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=1500'
  }
];

interface ExperiencePageProps {
  onBack?: () => void;
  savedIds?: string[];
  onToggleSave?: (id: string) => void;
}

const ExperiencePage: React.FC<ExperiencePageProps> = ({ onBack, savedIds = [], onToggleSave }) => {
  return (
    <div className="pt-48 min-h-screen bg-[#FAF9F6] animate-fade-in relative pb-64">
      {/* Subtle Texture Layer */}
      <div className="absolute inset-0 opacity-[0.03] xuan-texture pointer-events-none" />

      <div className="max-w-6xl mx-auto px-8">
        <header className="mb-48 flex flex-col md:flex-row justify-between items-end border-b border-[#2D2A26]/5 pb-16 gap-12">
          <div className="space-y-6">
            <span className="text-[11px] tracking-[0.6em] text-[#D4AF37] uppercase font-medium">The Experience / 探幽路径</span>
            <h2 className="text-6xl md:text-8xl serif-font italic font-light tracking-tighter text-[#2D2A26]">Discovery Path</h2>
          </div>
          <button 
            onClick={onBack}
            className="text-[10px] tracking-[0.5em] uppercase opacity-40 hover:opacity-100 transition-all flex items-center gap-6 group pb-2"
          >
            <span className="group-hover:-translate-x-3 transition-transform duration-500">←</span> Return to Journey
          </button>
        </header>

        <div className="space-y-80">
          {EXPERIENCE_DATA.map((item, index) => (
            <motion.section 
              key={item.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true, margin: "-100px" }}
              className="flex flex-col lg:flex-row items-center gap-24 lg:gap-40"
            >
              {/* Left Side: Image (Always) */}
              <div className="w-full lg:w-1/2">
                <div className="relative aspect-[4/5] group cursor-default">
                   <GardenWindow 
                    shape={index % 2 === 0 ? 'haitang' : 'octagon'} 
                    imageUrl={item.imageUrl} 
                    className="w-full h-full shadow-2xl transition-transform duration-1000 group-hover:scale-[1.02]"
                  />
                  {/* Floating index */}
                  <div className="absolute -top-12 -left-4 text-[120px] serif-font italic opacity-[0.03] pointer-events-none select-none">
                    0{index + 1}
                  </div>
                </div>
              </div>
              
              {/* Right Side: Text (Always) */}
              <div className="w-full lg:w-1/2 space-y-12">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-[1px] bg-[#D4AF37]/40" />
                    <p className="text-[11px] tracking-[0.5em] text-[#D4AF37] uppercase font-medium">{item.location}</p>
                  </div>
                  <h3 className="serif-font text-5xl md:text-7xl italic font-light tracking-tight text-[#2D2A26]">
                    {item.title}
                    <span className="block text-2xl md:text-3xl not-italic opacity-30 mt-4 serif-font font-normal">{item.chineseTitle}</span>
                  </h3>
                </div>
                
                <p className="text-base md:text-xl leading-relaxed opacity-60 font-light italic text-[#2D2A26]/80">
                  {item.description}
                </p>

                <div className="pt-12 flex items-center gap-8">
                  <button className="group relative text-[11px] tracking-[0.7em] uppercase pb-3 transition-all">
                    <span className="relative z-10 font-medium">Request Invitation / 邀约</span>
                    <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[#2D2A26]/10" />
                    <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#A62C2B] group-hover:w-full transition-all duration-700" />
                  </button>
                  
                  <button 
                    onClick={() => onToggleSave?.(item.id)}
                    className="group flex items-center gap-3 text-[10px] tracking-[0.4em] uppercase opacity-40 hover:opacity-100 transition-all"
                  >
                    <div className={`w-8 h-8 rounded-full border border-[#2D2A26]/20 flex items-center justify-center transition-colors ${savedIds.includes(item.id) ? 'bg-[#A62C2B] border-[#A62C2B]' : 'group-hover:bg-[#2D2A26]/5'}`}>
                      <svg 
                        viewBox="0 0 24 24" 
                        className={`w-3 h-3 ${savedIds.includes(item.id) ? 'fill-[#FAF9F6]' : 'fill-transparent stroke-[#2D2A26] stroke-2'}`}
                      >
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <span>{savedIds.includes(item.id) ? 'Saved' : 'Save'} / 藏</span>
                  </button>
                </div>
              </div>
            </motion.section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExperiencePage;
