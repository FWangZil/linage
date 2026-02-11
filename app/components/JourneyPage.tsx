
import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const NODES = [
  {
    id: 'discovery',
    title: 'Discovery',
    chineseTitle: '发现',
    subtitle: 'UNEARTHING THE HIDDEN GEMS',
    description: 'Our journey begins where the concrete ends. We venture into the narrow alleys of Suzhou and the misty peaks of Huangshan, seeking master craftsmen whose hands carry the wisdom of thirty generations. It is here that the lineage is first found—in the quiet focus of a studio at dawn.',
    hasAction: true
  },
  {
    id: 'verification',
    title: 'Verification',
    chineseTitle: '鉴证',
    subtitle: 'AN IMMUTABLE PROVENANCE',
    description: 'Tradition is fragile, but proof is eternal. Through our proprietary verification layer, every thread, every leaf, and every stroke of ink is bound to the blockchain. We document the provenance not just as data, but as a digital soul that survives the passage of time.',
    hasAction: false
  },
  {
    id: 'legacy',
    title: 'Legacy',
    chineseTitle: '承袭',
    subtitle: 'THE SCROLL CONTINUES',
    description: 'Heritage is not a museum piece; it is a living river. By participating in the Linage ecosystem, you are not merely a collector, but a guardian. Your ownership funds the masterclasses and apprentice programs that ensure the loom never stops and the kiln never cools.',
    hasAction: false
  }
];

const JourneyNode: React.FC<{ node: typeof NODES[0]; index: number; onAction?: () => void }> = ({ node, index, onAction }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.5, delay: index * 0.2 }}
      viewport={{ once: true, margin: "-100px" }}
      className="relative z-10 flex flex-col items-center text-center max-w-2xl py-32"
    >
      {/* Circle Node */}
      <div className="relative mb-12">
        <div className="w-14 h-14 rounded-full border border-[#D4AF37]/30 flex items-center justify-center bg-[#FAF9F6] shadow-sm">
           <div className="w-2 h-2 bg-[#A62C2B] rounded-full" />
        </div>
        {/* Subtle glow */}
        <div className="absolute inset-0 bg-[#A62C2B]/5 blur-2xl rounded-full animate-pulse" />
      </div>

      <div className="space-y-6">
        <span className="text-[10px] tracking-[0.6em] text-[#A62C2B] font-mono uppercase font-medium">{node.subtitle}</span>
        <h3 className="serif-font text-5xl md:text-7xl italic font-light tracking-tight text-[#2D2A26]">
          {node.title} <span className="text-2xl not-italic opacity-30 ml-3 font-normal">/ {node.chineseTitle}</span>
        </h3>
      </div>

      <p className="mt-10 text-base md:text-lg leading-relaxed opacity-60 font-light italic px-10 max-w-xl mx-auto">
        {node.description}
      </p>

      {node.hasAction && (
        <button 
          onClick={onAction}
          className="mt-12 group relative text-[10px] tracking-[0.5em] uppercase pb-2 transition-all opacity-70 hover:opacity-100 hover:text-[#A62C2B]"
        >
          <span className="relative z-10">Discover the Hidden Path / 探幽</span>
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[#2D2A26]/10" />
          <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#A62C2B] group-hover:w-full transition-all duration-700" />
        </button>
      )}
    </motion.div>
  );
};

interface JourneyPageProps {
  onDiscover?: () => void;
}

const JourneyPage: React.FC<JourneyPageProps> = ({ onDiscover }) => {
  const { scrollYProgress } = useScroll();
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <div className="relative pt-48 min-h-screen bg-[#FAF9F6] flex flex-col items-center overflow-x-hidden pb-96">
      {/* Background Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] xuan-texture pointer-events-none" />

      <header className="text-center space-y-12 mb-40 z-20">
        <h2 className="text-7xl md:text-9xl serif-font italic font-light tracking-tighter text-[#2D2A26]">The Journey</h2>
        <div className="w-40 h-[1px] bg-[#D4AF37]/40 mx-auto" />
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 0.5 }}
          className="max-w-xl mx-auto px-8"
        >
          <p className="text-sm md:text-base tracking-[0.15em] opacity-40 leading-loose font-light italic">
            "We do not inherit the earth from our ancestors; <br className="hidden md:block"/> we borrow it from our children."
          </p>
        </motion.div>
      </header>

      {/* Vertical Container for Timeline */}
      <div className="relative w-full max-w-4xl flex flex-col items-center px-8">
        
        {/* The Extremely Thin Gold Silk Line */}
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-[#D4AF37]/10 z-0">
          <motion.div 
            style={{ height: lineHeight }}
            className="w-full bg-[#D4AF37]/60 shadow-[0_0_15px_rgba(212,175,55,0.3)]"
          />
        </div>

        {/* Nodes Grid */}
        <div className="space-y-24">
          {NODES.map((node, idx) => (
            <JourneyNode 
              key={node.id} 
              node={node} 
              index={idx} 
              onAction={node.id === 'discovery' ? onDiscover : undefined} 
            />
          ))}
        </div>
      </div>

      {/* Decorative End Node */}
      <motion.div 
        initial={{ scale: 0, rotate: 0 }}
        whileInView={{ scale: 1, rotate: 45 }}
        transition={{ duration: 1, ease: "backOut" }}
        className="mt-32 w-3 h-3 border border-[#A62C2B] bg-[#FAF9F6] z-10"
      />

      <div className="mt-48 text-center px-8">
        <p className="text-[10px] tracking-[0.8em] uppercase opacity-20">The chain remains unbroken</p>
      </div>
    </div>
  );
};

export default JourneyPage;
