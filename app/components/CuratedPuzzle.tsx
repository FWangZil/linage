import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import PaymentAssetSelector, { type PaymentAssetOption } from './PaymentAssetSelector';
import { parseDisplayAmountToMinorUnits } from '../chain/paymentAmount';

type CraftId = 'suzhou' | 'shu' | 'qiang';

type CuratedPuzzleProps = {
  onMintSuccess?: () => void;
  initialCraftIds?: CraftId[];
  onOpenEmbroidery?: () => void;
  onOpenTea?: () => void;
  paymentAssets?: PaymentAssetOption[];
  defaultInputCoinType?: string;
  defaultInputAmount?: string;
  onBuyEmbroidery?: (params: { inputCoinType: string; inputAmount: bigint }) => Promise<void>;
};

type CraftMeta = {
  id: CraftId;
  name: string;
  subtitle: string;
  fullImage: string;
  detailImage: string;
  archive: string;
};

const CRAFT_ORDER: CraftId[] = ['suzhou', 'shu', 'qiang'];

const CRAFTS: Record<CraftId, CraftMeta> = {
  suzhou: {
    id: 'suzhou',
    name: '苏绣',
    subtitle: 'SUZHOU EMBROIDERY',
    fullImage:
      '/assets/suzhou_full.png',
    detailImage:
      '/assets/suzhou_macro_detail.png',
    archive:
      '双面异色与劈丝细针并用，形成近乎雾面渐层的丝光。针脚遵循山水留白逻辑，以极细线束叠加气韵。',
  },
  shu: {
    id: 'shu',
    name: '蜀绣',
    subtitle: 'SHU EMBROIDERY',
    fullImage:
      'https://images.unsplash.com/photo-1594642264762-d0a3b8bf3700?auto=format&fit=crop&w=1800&q=80',
    detailImage:
      'https://images.unsplash.com/photo-1525429983537-2f4c6d91463d?auto=format&fit=crop&w=1600&q=80',
    archive:
      '蜀绣强调纹样节律与色阶过渡，针法多变而讲究落针方向。图案常以富丽构图承托细节质感，形成层层起伏。',
  },
  qiang: {
    id: 'qiang',
    name: '羌绣',
    subtitle: 'QIANG EMBROIDERY',
    fullImage:
      'https://images.unsplash.com/photo-1601803211192-0e7d2fefe52b?auto=format&fit=crop&w=1800&q=80',
    detailImage:
      'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1600&q=80',
    archive:
      '羌绣以几何构成与象征性纹样见长，色彩对比强烈。线迹在重复与呼应中建立护佑寓意，富有礼制与部族记忆。',
  },
};

const FRAGMENT_COUNT = 9;
const STAMP_ANIMATION_MS = 2500;

const SPRING_DAMPED = { type: 'spring', stiffness: 220, damping: 28, mass: 0.9 } as const;

// Polygon shapes for the puzzle fragments to create an "assembled" feel
const FRAGMENT_SHAPES = [
  'polygon(0% 0%, 100% 0%, 95% 90%, 5% 95%)',
  'polygon(5% 0%, 95% 5%, 100% 95%, 0% 100%)',
  'polygon(2% 5%, 98% 0%, 95% 95%, 5% 100%)',
  'polygon(5% 5%, 95% 2%, 92% 98%, 8% 95%)',
  'polygon(0% 2%, 100% 0%, 100% 100%, 0% 98%)',
  'polygon(5% 0%, 95% 5%, 90% 100%, 10% 95%)',
  'polygon(0% 5%, 100% 0%, 95% 95%, 5% 100%)',
  'polygon(5% 2%, 95% 0%, 100% 98%, 0% 100%)',
  'polygon(2% 0%, 98% 5%, 95% 100%, 5% 95%)',
];

const CRAFT_TINT: Record<CraftId, string> = {
  suzhou: 'rgba(164, 112, 82, 0.25)',
  shu: 'rgba(128, 65, 52, 0.25)',
  qiang: 'rgba(90, 70, 56, 0.25)',
};

function nextCraft(current: CraftId): CraftId {
  const currentIndex = CRAFT_ORDER.indexOf(current);
  return CRAFT_ORDER[(currentIndex + 1) % CRAFT_ORDER.length];
}

function getUnifiedCraft(ids: CraftId[]): CraftId | null {
  if (!ids.length) return null;
  return ids.every((craft) => craft === ids[0]) ? ids[0] : null;
}

export function buildInitialCraftGrid(size = FRAGMENT_COUNT, random: () => number = Math.random): CraftId[] {
  const base = Array.from({ length: size }, (_, idx) => CRAFT_ORDER[idx % CRAFT_ORDER.length]);
  const shuffled = [...base];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const randomIdx = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[randomIdx]] = [shuffled[randomIdx], shuffled[i]];
  }
  // Ensure it's not already solved
  if (new Set(shuffled).size === 1 && shuffled.length > 1) {
    shuffled[shuffled.length - 1] = nextCraft(shuffled[0]);
  }
  return shuffled;
}

const CuratedPuzzle: React.FC<CuratedPuzzleProps> = ({
  onMintSuccess,
  initialCraftIds,
  onOpenEmbroidery,
  onOpenTea,
  paymentAssets = [],
  defaultInputCoinType,
  defaultInputAmount = '0.1',
  onBuyEmbroidery,
}) => {
  const [fragmentCraftIds, setFragmentCraftIds] = useState<CraftId[]>(
    initialCraftIds ?? buildInitialCraftGrid(),
  );

  const [gameState, setGameState] = useState<'PLAYING' | 'WON' | 'MINTING' | 'MINTED' | 'ORDER_PHYSICAL'>('PLAYING');

  const [selectedPhysical, setSelectedPhysical] = useState<'studio' | 'museum' | 'collector'>('studio');
  const [selectedInputCoinType, setSelectedInputCoinType] = useState(
    defaultInputCoinType ?? paymentAssets[0]?.coinType ?? '',
  );
  const [inputAmount, setInputAmount] = useState(defaultInputAmount);
  const [isBuying, setIsBuying] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);

  const unifiedCraftId = useMemo(() => getUnifiedCraft(fragmentCraftIds), [fragmentCraftIds]);
  const unifiedCraft = unifiedCraftId ? CRAFTS[unifiedCraftId] : null;

  useEffect(() => {
    if (paymentAssets.length === 0) return;
    const hasSelectedAsset = paymentAssets.some((asset) => asset.coinType === selectedInputCoinType);
    if (!hasSelectedAsset) {
      setSelectedInputCoinType(paymentAssets[0].coinType);
    }
  }, [paymentAssets, selectedInputCoinType]);

  useEffect(() => {
    if (unifiedCraft && gameState === 'PLAYING') {
      setGameState('WON');
    }
  }, [unifiedCraft, gameState]);

  const toggleFragment = (index: number) => {
    if (gameState !== 'PLAYING') return;
    setFragmentCraftIds((current) => {
      const next = [...current];
      next[index] = nextCraft(next[index]);
      return next;
    });
  };

  const handleMint = () => {
    if (gameState !== 'WON') return;

    setGameState('MINTING');

    // Dispatch start event for Header seal sync
    window.dispatchEvent(new Event('linage-mint-start'));

    setTimeout(() => {
      setGameState('MINTED');
      window.dispatchEvent(new Event('linage-mint-end'));
      onMintSuccess?.();
    }, STAMP_ANIMATION_MS);
  };

  const handleCheckout = async () => {
    setBuyError(null);
    setIsBuying(true);
    window.dispatchEvent(new CustomEvent('linage-buy-start'));
    try {
      if (!onBuyEmbroidery) {
        throw new Error('Embroidery listing is not configured yet.');
      }
      const selectedAsset = paymentAssets.find((asset) => asset.coinType === selectedInputCoinType);
      if (!selectedAsset) {
        throw new Error('Selected payment asset is not available.');
      }
      const parsedAmount = parseDisplayAmountToMinorUnits(inputAmount, selectedAsset.decimals);
      await onBuyEmbroidery({
        inputCoinType: selectedAsset.coinType,
        inputAmount: parsedAmount,
      });
      setGameState('MINTED');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setBuyError(message);
    } finally {
      setIsBuying(false);
      window.dispatchEvent(new CustomEvent('linage-buy-end'));
    }
  };

  return (
    <div className="pt-44 px-6 md:px-8 max-w-6xl mx-auto min-h-screen pb-48 relative">
       {/* SVG Filters for Authentic Seal Effect - Reused from InkSealButton */}
       <svg className="absolute w-0 h-0" aria-hidden="true">
        <filter id="cinnabar-roughness-puzzle">
          <feTurbulence type="fractalNoise" baseFrequency="0.15" numOctaves="4" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="ink-bleed-puzzle">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.4" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -8" result="bleed" />
          <feComposite in="SourceGraphic" in2="bleed" operator="over" />
        </filter>
      </svg>

      <header className="text-center space-y-6 mb-16 md:mb-20">
        <h2 className="text-5xl md:text-6xl serif-font font-light tracking-tight text-[#2D2A26]">
          绣脉拼图
        </h2>
        <p className="text-[10px] tracking-[0.42em] uppercase opacity-45">
          Stitch Lineage Puzzle · 同题异绣合卷
        </p>
      </header>

      {/* Navigation for context */}
      <section className="mb-8 flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 opacity-60 hover:opacity-100 transition-opacity">
        <button type="button" onClick={onOpenEmbroidery} className="text-[10px] tracking-[0.3em] uppercase hover:text-[#A62C2B] transition-colors pb-1 border-b border-transparent hover:border-[#A62C2B]/30">
          Embroidery Trade
        </button>
        <span className="text-[#2D2A26]/20">/</span>
        <button type="button" onClick={onOpenTea} className="text-[10px] tracking-[0.3em] uppercase hover:text-[#A62C2B] transition-colors pb-1 border-b border-transparent hover:border-[#A62C2B]/30">
          Tea Swap
        </button>
      </section>

      <div className="relative border border-[#2D2A26]/12 bg-[#FAF9F6] p-4 md:p-8 shadow-[0_20px_60px_rgba(45,42,38,0.05)] max-w-4xl mx-auto">
        {/* Canvas Texture */}
        <div className="absolute inset-0 opacity-[0.06] bg-[url('https://www.transparenttextures.com/patterns/rice-paper-3.png')]" />

        {/* Puzzle Grid */}
        <div className="relative grid grid-cols-3 gap-2 md:gap-3" data-testid="puzzle-canvas">
          {fragmentCraftIds.map((craftId, idx) => {
            const craft = CRAFTS[craftId];
            return (
              <motion.button
                key={`${idx}-${craftId}`} // Key based on craft to trigger animation on change
                type="button"
                onClick={() => toggleFragment(idx)}
                whileHover={{ scale: gameState === 'PLAYING' ? 1.02 : 1 }}
                whileTap={{ scale: gameState === 'PLAYING' ? 0.98 : 1 }}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={SPRING_DAMPED}
                className={`relative aspect-square overflow-hidden cursor-${gameState === 'PLAYING' ? 'pointer' : 'default'} shadow-sm`}
                style={{
                  clipPath: FRAGMENT_SHAPES[idx],
                }}
              >
                {/* Image Layer */}
                <div
                  className="absolute inset-0 transition-transform duration-700 ease-out hover:scale-110"
                  style={{
                     backgroundImage: `url(${craft.fullImage})`,
                     backgroundSize: '300%',
                     backgroundPosition: `${(idx % 3) * 50}% ${Math.floor(idx / 3) * 50}%` // Approximate positioning
                  }}
                />

                {/* Tint Overlay */}
                <div
                   className="absolute inset-0 transition-opacity duration-500"
                   style={{ backgroundColor: CRAFT_TINT[craftId], mixBlendMode: 'multiply' }}
                />

                {/* Text Label */}
                <div className="absolute bottom-2 left-3 z-10">
                   <p className="text-[8px] tracking-[0.2em] text-[#FAF9F6] drop-shadow-md uppercase opacity-80">{craft.name}</p>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Seal Animation Overlay */}
        <AnimatePresence>
          {(gameState === 'MINTING' || gameState === 'MINTED') && (
            <motion.div
              className="absolute bottom-[-20px] right-[-20px] md:bottom-[-40px] md:right-[-40px] z-50 pointer-events-none"
              initial={{ scale: 3, opacity: 0, rotate: 15 }}
              animate={{ scale: 1, opacity: 1, rotate: -5 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20, mass: 1.2 }}
            >
              <div className="relative w-40 h-40 md:w-48 md:h-48 flex items-center justify-center">
                 {/* Seal Body */}
                 <div
                    className="absolute inset-0 bg-[#B22222] opacity-90 shadow-2xl"
                    style={{
                      filter: 'url(#cinnabar-roughness-puzzle)',
                      clipPath: 'polygon(10% 5%, 95% 0%, 100% 90%, 5% 95%)'
                    }}
                 />
                 {/* Seal Inner Border */}
                 <div
                    className="absolute inset-3 border-[2px] border-[#FAF9F6]/40"
                    style={{ filter: 'url(#cinnabar-roughness-puzzle)' }}
                 />
                 {/* Seal Text */}
                 <div className="relative z-10 text-[#FAF4E6] flex flex-col items-center justify-center space-y-1" style={{ filter: 'url(#ink-bleed-puzzle)' }}>
                     <span className="serif-font text-[10px] tracking-[0.2em] uppercase font-bold text-center leading-tight">INSCRIBED<br/>LEGACY</span>
                     <div className="w-8 h-[1px] bg-[#FAF4E6]/40 my-1" />
                     <span className="serif-font text-3xl font-bold tracking-widest">迹</span>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Post-Game Interface */}
      <AnimatePresence>
        {gameState !== 'PLAYING' && unifiedCraft && (
          <motion.div
             initial={{ opacity: 0, y: 40 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8, ease: "easeOut" }}
             className="mt-16 space-y-12"
          >
            {/* 1. Craft Details */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
               <div className="space-y-6">
                 <div className="flex items-center gap-4 text-[#A62C2B]">
                    <div className="w-12 h-[1px] bg-[#A62C2B]" />
                    <span className="text-[10px] tracking-[0.4em] uppercase">Masterpiece Revealed</span>
                 </div>
                 <h3 className="text-4xl serif-font italic text-[#2D2A26]">{unifiedCraft.name}</h3>
                 <p className="text-sm leading-8 tracking-wide opacity-70 font-light serif-font text-justify">
                    {unifiedCraft.archive}
                 </p>
               </div>
               <div className="aspect-[4/3] overflow-hidden relative border border-[#2D2A26]/10 shadow-lg group">
                  <img
                    src={unifiedCraft.detailImage}
                    alt="Detail"
                    className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110"
                  />
                  <div className="absolute bottom-4 right-4 bg-[#FAF9F6]/90 px-4 py-2 text-[9px] tracking-[0.2em] uppercase backdrop-blur-sm">
                    Macro Detail
                  </div>
               </div>
            </section>

            {/* 2. Action Area */}
            <section className="border-t border-[#2D2A26]/10 pt-12 flex flex-col items-center space-y-8">

               {gameState === 'WON' && (
                 <button
                   onClick={handleMint}
                   className="group relative px-12 py-5 bg-[#2D2A26] text-[#FAF9F6] overflow-hidden transition-all hover:bg-[#A62C2B] shadow-xl hover:shadow-[0_10px_30px_rgba(166,44,43,0.3)]"
                 >
                   <span className="relative z-10 text-xs tracking-[0.4em] uppercase group-hover:tracking-[0.5em] transition-all duration-500">
                     Mint Your Legacy
                   </span>
                 </button>
               )}

               {gameState === 'MINTING' && (
                 <p className="text-[10px] tracking-[0.4em] uppercase animate-pulse text-[#A62C2B]">
                   Inscribing on Chain...
                 </p>
               )}

               {gameState === 'MINTED' && (
                 <motion.div
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   className="w-full max-w-xl border border-[#2D2A26]/10 bg-white p-12 shadow-[0_20px_40px_rgba(0,0,0,0.02)] space-y-8 text-center"
                 >
                    <div className="space-y-4">
                       <h4 className="serif-font text-3xl italic text-[#2D2A26]">Legacy Guardian Confirmed</h4>
                       <div className="w-16 h-[1px] bg-[#D4AF37] mx-auto opacity-50" />
                       <p className="text-sm text-[#2D2A26]/60 leading-relaxed font-light italic">
                          Your ownership is now permanent on the chain. <br/>
                          Would you like to request the hand-crafted physical masterpiece?
                       </p>
                    </div>

                    <div className="pt-4">
                       <button
                          onClick={() => setGameState('ORDER_PHYSICAL')}
                          className="w-full py-4 bg-[#2D2A26] text-[#FAF9F6] text-[10px] tracking-[0.4em] uppercase hover:bg-[#A62C2B] transition-colors"
                       >
                          Request Physical / 实物 申领
                       </button>
                    </div>

                    <button className="text-[9px] tracking-[0.2em] uppercase opacity-30 hover:opacity-100 transition-opacity flex items-center justify-center gap-2 mx-auto">
                       <span className="w-2 h-2 rounded-full bg-[#A62C2B] animate-pulse" />
                       Inquiry / 问
                    </button>
                 </motion.div>
               )}

               {gameState === 'ORDER_PHYSICAL' && (
                 <motion.div
                   initial={{ opacity: 0, scale: 0.98 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="w-full max-w-xl bg-[#FAF9F6] border border-[#2D2A26]/10 p-8 space-y-6 shadow-inner text-left"
                 >
                    <div className="flex justify-between items-center border-b border-[#A62C2B]/20 pb-4 mb-6">
                        <p className="text-[9px] tracking-[0.3em] uppercase text-[#A62C2B]">
                            Select Edition / 版本选择
                        </p>
                        <button onClick={() => setGameState('MINTED')} className="text-[14px] opacity-40 hover:opacity-100">✕</button>
                    </div>

                    <div className="space-y-4">
                    {[
                        { id: 'studio', label: 'Studio Framed Edition', price: 'Free for Guardians' },
                        { id: 'museum', label: 'Museum Mount Scroll', price: '+ 200 SUI' },
                        { id: 'collector', label: 'Collector Gift Box', price: '+ 500 SUI' },
                    ].map((option) => (
                        <label
                            key={option.id}
                            className={`flex items-center justify-between p-4 border transition-all cursor-pointer ${selectedPhysical === option.id ? 'border-[#A62C2B] bg-[#A62C2B]/[0.02]' : 'border-[#2D2A26]/10 hover:border-[#2D2A26]/30'}`}
                        >
                            <div className="flex items-center gap-4">
                            <input
                                type="radio"
                                name="physical"
                                checked={selectedPhysical === option.id}
                                onChange={() => setSelectedPhysical(option.id as any)}
                                className="accent-[#A62C2B]"
                            />
                            <span className={`serif-font text-sm ${selectedPhysical === option.id ? 'text-[#A62C2B]' : 'text-[#2D2A26]'}`}>{option.label}</span>
                            </div>
                            <span className="text-[9px] tracking-wider opacity-60 uppercase">{option.price}</span>
                        </label>
                    ))}
                    </div>

                    <PaymentAssetSelector
                      assets={paymentAssets}
                      selectedCoinType={selectedInputCoinType}
                      amount={inputAmount}
                      onCoinTypeChange={setSelectedInputCoinType}
                      onAmountChange={setInputAmount}
                      disabled={isBuying}
                    />

                    {buyError && (
                      <p className="text-[10px] tracking-[0.12em] uppercase text-[#A62C2B]">
                        Checkout failed: {buyError}
                      </p>
                    )}

                    <button
                      data-testid="curated-checkout-button"
                      onClick={handleCheckout}
                      disabled={isBuying || !onBuyEmbroidery}
                      className="w-full mt-4 py-4 bg-[#2D2A26] text-[#FAF9F6] text-[10px] tracking-[0.3em] uppercase hover:bg-[#A62C2B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isBuying ? 'Processing Cetus Swap...' : 'Proceed to Checkout (Cetus Swap)'}
                    </button>
                 </motion.div>
               )}

            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CuratedPuzzle;
