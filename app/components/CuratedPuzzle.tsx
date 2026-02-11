import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useSpring } from 'framer-motion';

type CraftId = 'suzhou' | 'shu' | 'qiang';

type CuratedPuzzleProps = {
  onMintSuccess?: () => void;
  initialCraftIds?: CraftId[];
  onOpenEmbroidery?: () => void;
  onOpenTea?: () => void;
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
      'https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=1800&q=80',
    detailImage:
      'https://images.unsplash.com/photo-1528458965990-428de2f4d2a0?auto=format&fit=crop&w=1600&q=80',
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
const STAMP_ANIMATION_MS = 1600;

const SPRING_SOFT = { type: 'spring', stiffness: 170, damping: 24, mass: 0.9 } as const;
const SPRING_DAMPED = { type: 'spring', stiffness: 220, damping: 28, mass: 0.9 } as const;

const FRAGMENT_SHAPES = [
  'polygon(6% 8%, 95% 6%, 94% 92%, 8% 94%)',
  'polygon(4% 3%, 97% 8%, 92% 95%, 5% 89%)',
  'polygon(7% 5%, 93% 4%, 95% 90%, 11% 96%)',
  'polygon(5% 10%, 97% 7%, 90% 92%, 4% 88%)',
  'polygon(9% 5%, 94% 9%, 96% 93%, 8% 96%)',
  'polygon(3% 7%, 95% 4%, 92% 94%, 9% 91%)',
  'polygon(8% 9%, 96% 6%, 90% 96%, 6% 89%)',
  'polygon(5% 5%, 95% 8%, 97% 95%, 7% 90%)',
  'polygon(10% 6%, 92% 4%, 95% 94%, 6% 95%)',
];

const SHARED_THEME_FRAGMENT_IMAGE =
  'https://images.unsplash.com/photo-1556228578-dd6f3c7c9ed8?auto=format&fit=crop&w=1800&q=80';

const CRAFT_TINT: Record<CraftId, string> = {
  suzhou: 'rgba(164, 112, 82, 0.32)',
  shu: 'rgba(128, 65, 52, 0.36)',
  qiang: 'rgba(90, 70, 56, 0.36)',
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
}) => {
  const [fragmentCraftIds, setFragmentCraftIds] = useState<CraftId[]>(
    initialCraftIds ?? buildInitialCraftGrid(),
  );
  const [minting, setMinting] = useState(false);
  const [minted, setMinted] = useState(false);
  const [showStamp, setShowStamp] = useState(false);
  const [selectedPhysical, setSelectedPhysical] = useState<'studio' | 'museum' | 'collector'>('studio');
  const timersRef = useRef<number[]>([]);
  const unlockedRef = useRef(false);

  const [lensPoint, setLensPoint] = useState({ x: 160, y: 120 });
  const [lensActive, setLensActive] = useState(false);
  const lensX = useSpring(160, { stiffness: 210, damping: 30, mass: 0.8 });
  const lensY = useSpring(120, { stiffness: 210, damping: 30, mass: 0.8 });

  const unifiedCraftId = useMemo(() => getUnifiedCraft(fragmentCraftIds), [fragmentCraftIds]);
  const unifiedCraft = unifiedCraftId ? CRAFTS[unifiedCraftId] : null;

  useEffect(() => {
    lensX.set(lensPoint.x);
    lensY.set(lensPoint.y);
  }, [lensPoint, lensX, lensY]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const updateFragment = (index: number) => {
    if (unifiedCraftId) return;
    setFragmentCraftIds((current) => {
      const next = [...current];
      next[index] = nextCraft(next[index]);
      return next;
    });
  };

  const handleMint = () => {
    if (!unifiedCraft || minting) return;
    setMinting(true);
    setShowStamp(true);
    window.dispatchEvent(new Event('linage-mint-start'));

    const mintEndTimer = window.setTimeout(() => {
      setMinting(false);
      setMinted(true);
      window.dispatchEvent(new Event('linage-mint-end'));
      if (!unlockedRef.current) {
        unlockedRef.current = true;
        onMintSuccess?.();
      }
    }, STAMP_ANIMATION_MS);

    const stampHideTimer = window.setTimeout(() => {
      setShowStamp(false);
    }, STAMP_ANIMATION_MS + 400);

    timersRef.current.push(mintEndTimer, stampHideTimer);
  };

  return (
    <div className="pt-44 px-6 md:px-8 max-w-6xl mx-auto min-h-screen pb-48">
      <header className="text-center space-y-6 mb-16 md:mb-20">
        <h2 className="text-5xl md:text-6xl serif-font font-light tracking-tight text-[#2D2A26]">
          绣脉拼图
        </h2>
        <p className="text-[10px] tracking-[0.42em] uppercase opacity-45">
          Stitch Lineage Puzzle · 同题异绣合卷
        </p>
      </header>

      <section className="mb-8 flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4">
        <button
          type="button"
          onClick={onOpenEmbroidery}
          className="min-w-[260px] border border-[#2D2A26]/20 bg-[#FAF9F6] px-6 py-3 text-[10px] tracking-[0.35em] uppercase hover:border-[#A62C2B]/50 hover:text-[#A62C2B] transition-colors"
        >
          EMBROIDERY TRADE / 绣品交易
        </button>
        <button
          type="button"
          onClick={onOpenTea}
          className="min-w-[260px] border border-[#2D2A26]/20 bg-[#FAF9F6] px-6 py-3 text-[10px] tracking-[0.35em] uppercase hover:border-[#A62C2B]/50 hover:text-[#A62C2B] transition-colors"
        >
          TEA SWAP / 茶礼兑换
        </button>
      </section>

      <div className="relative border border-[#2D2A26]/12 bg-[#FAF9F6] p-4 md:p-6 shadow-[0_12px_40px_rgba(45,42,38,0.06)]">
        <div className="absolute inset-0 opacity-[0.04] bg-[url('https://www.transparenttextures.com/patterns/rice-paper-3.png')]" />
        <div className="relative grid grid-cols-3 gap-3 md:gap-4" data-testid="puzzle-canvas">
          {fragmentCraftIds.map((craftId, idx) => {
            const craft = CRAFTS[craftId];
            return (
              <motion.button
                key={`${idx}-${craftId}`}
                type="button"
                data-testid={`puzzle-fragment-${idx}`}
                aria-label={`Fragment ${idx + 1}: ${craft.subtitle}`}
                onClick={() => updateFragment(idx)}
                whileTap={{ scale: unifiedCraftId ? 1 : 0.97 }}
                transition={SPRING_DAMPED}
                className="relative aspect-square border border-[#2D2A26]/20 overflow-hidden text-left"
                style={{
                  clipPath: FRAGMENT_SHAPES[idx],
                  backgroundImage: `linear-gradient(135deg, ${CRAFT_TINT[craftId]}, rgba(0,0,0,0.2)), url(${SHARED_THEME_FRAGMENT_IMAGE})`,
                  backgroundSize: '220%',
                  backgroundPosition: `${(idx % 3) * 45 + 20}% ${Math.floor(idx / 3) * 45 + 20}%`,
                }}
              >
                <motion.div
                  layout
                  transition={SPRING_SOFT}
                  className="absolute inset-0 border border-[#FAF9F6]/30"
                />
                <div className="absolute left-2 bottom-2 text-[#FAF9F6] drop-shadow-lg">
                  <p className="text-[9px] tracking-[0.22em] uppercase opacity-90">{craft.subtitle}</p>
                  <p className="serif-font text-sm tracking-[0.08em]">{craft.name}</p>
                </div>
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence>
          {showStamp && (
            <motion.div
              data-testid="mint-stamp-overlay"
              className="absolute right-8 bottom-8 z-20 pointer-events-none"
              initial={{ scale: 2.1, rotate: -16, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 190, damping: 19, mass: 0.85 }}
            >
              <div className="w-28 h-28 rounded-full border-[1.5px] border-[#8F1717] bg-[#B22222]/85 text-[#FAF4E6] flex items-center justify-center shadow-[0_12px_32px_rgba(178,34,34,0.35)]">
                <span className="serif-font text-sm tracking-[0.22em] uppercase">Seal</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <section className="mt-8 md:mt-10 text-center">
        {!unifiedCraft ? (
          <p className="text-[10px] tracking-[0.38em] uppercase opacity-45">
            点击碎片切换工艺 · unify all 9 fragments to reveal the complete embroidery
          </p>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING_SOFT}
            className="space-y-3"
          >
            <p className="text-[10px] tracking-[0.38em] uppercase text-[#A62C2B]">
              Composition Complete · 绣品合成完成
            </p>
            <p className="serif-font text-2xl md:text-3xl font-light tracking-tight">
              {unifiedCraft.name} · Whole Motif Activated
            </p>
          </motion.div>
        )}
      </section>

      <AnimatePresence>
        {unifiedCraft && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING_SOFT}
            className="mt-10 space-y-10"
          >
            <div className="border border-[#2D2A26]/12 p-5 md:p-6 bg-[#FAF9F6]">
              <div className="w-full aspect-[4/3] md:aspect-[16/7] relative overflow-hidden border border-[#2D2A26]/15">
                <motion.div
                  className="absolute inset-0"
                  initial={{ scale: 1.05, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={SPRING_SOFT}
                  style={{
                    backgroundImage: `linear-gradient(125deg, rgba(250,249,246,0.18), rgba(0,0,0,0.12)), url(${unifiedCraft.fullImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              <section className="border border-[#2D2A26]/12 p-5 md:p-6 space-y-5">
                <h3 className="text-[11px] tracking-[0.36em] uppercase opacity-55">工艺细节 (Details)</h3>
                <div
                  className="relative border border-[#2D2A26]/15 overflow-hidden aspect-[4/3]"
                  onMouseEnter={() => setLensActive(true)}
                  onMouseLeave={() => setLensActive(false)}
                  onMouseMove={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect();
                    setLensPoint({
                      x: event.clientX - rect.left,
                      y: event.clientY - rect.top,
                    });
                  }}
                  style={{
                    backgroundImage: `url(${unifiedCraft.detailImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <AnimatePresence>
                    {lensActive && (
                      <motion.div
                        className="absolute pointer-events-none border border-[#FAF4E6]/75 rounded-full shadow-[0_10px_20px_rgba(0,0,0,0.25)]"
                        style={{
                          width: 120,
                          height: 120,
                          x: lensX,
                          y: lensY,
                          translateX: '-50%',
                          translateY: '-50%',
                          backgroundImage: `url(${unifiedCraft.detailImage})`,
                          backgroundSize: '230%',
                          backgroundPosition: `${(lensPoint.x / 320) * 100}% ${(lensPoint.y / 240) * 100}%`,
                        }}
                        initial={{ opacity: 0, scale: 0.88 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={SPRING_SOFT}
                      />
                    )}
                  </AnimatePresence>
                </div>
                <p className="text-sm leading-relaxed opacity-75 serif-font italic">{unifiedCraft.archive}</p>
              </section>

              <section className="border border-[#2D2A26]/12 p-5 md:p-6 space-y-6">
                <h3 className="text-[11px] tracking-[0.36em] uppercase opacity-55">Mint &amp; Purchase</h3>
                <button
                  type="button"
                  onClick={handleMint}
                  disabled={minting}
                  className="w-full border border-[#A62C2B]/40 py-4 text-xs tracking-[0.34em] uppercase text-[#A62C2B] hover:bg-[#A62C2B] hover:text-[#FAF9F6] transition-colors disabled:opacity-40"
                >
                  {minting ? 'MINTING...' : 'MINT NFT'}
                </button>

                <div className="space-y-3">
                  <p className="text-[10px] tracking-[0.28em] uppercase opacity-45">ORDER PHYSICAL</p>
                  <div className="space-y-2">
                    {[
                      { id: 'studio', label: 'Studio Framed Edition' },
                      { id: 'museum', label: 'Museum Mount Scroll' },
                      { id: 'collector', label: 'Collector Gift Box' },
                    ].map((option) => (
                      <label
                        key={option.id}
                        className="flex items-center justify-between border border-[#2D2A26]/12 px-3 py-2 text-sm"
                      >
                        <span className="serif-font">{option.label}</span>
                        <input
                          type="radio"
                          name="physical-order"
                          checked={selectedPhysical === option.id}
                          onChange={() => setSelectedPhysical(option.id as 'studio' | 'museum' | 'collector')}
                          className="accent-[#A62C2B]"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {minted && (
                  <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={SPRING_SOFT}
                    className="text-[10px] tracking-[0.22em] uppercase text-[#A62C2B]"
                  >
                    Mint confirmed. Journey record has been updated.
                  </motion.p>
                )}
              </section>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CuratedPuzzle;
