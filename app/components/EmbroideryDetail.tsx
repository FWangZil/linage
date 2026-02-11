
import React, { useState, useRef } from 'react';
import ZenLoader from './ZenLoader';
import PaymentAssetSelector, { type PaymentAssetOption } from './PaymentAssetSelector';
import { parseDisplayAmountToMinorUnits } from '../chain/paymentAmount';

type EmbroideryDetailProps = {
  paymentAssets: PaymentAssetOption[];
  defaultInputCoinType?: string;
  defaultInputAmount?: string;
  onBuyEmbroidery?: (params: { inputCoinType: string; inputAmount: bigint }) => Promise<void>;
};

const EmbroideryDetail: React.FC<EmbroideryDetailProps> = ({
  paymentAssets,
  defaultInputCoinType,
  defaultInputAmount = '0.1',
  onBuyEmbroidery,
}) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [selectedInputCoinType, setSelectedInputCoinType] = useState(
    defaultInputCoinType ?? paymentAssets[0]?.coinType ?? '',
  );
  const [inputAmount, setInputAmount] = useState(defaultInputAmount);
  const [isBuying, setIsBuying] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const highResImage = "https://images.unsplash.com/photo-1610444583731-9e151d0407d9?q=100&w=3000&auto=format&fit=crop";

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  const handleBuy = async () => {
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
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setBuyError(message);
    } finally {
      setIsBuying(false);
      window.dispatchEvent(new CustomEvent('linage-buy-end'));
    }
  };

  return (
    <div className="pt-24 min-h-screen bg-[#FAF9F6] animate-fade-in">
      <ZenLoader isLoading={isBuying} message="SETTLING EMBROIDERY LISTING ON CHAIN..." />
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setShowMagnifier(true)}
        onMouseLeave={() => setShowMagnifier(false)}
        className="relative w-full h-[85vh] overflow-hidden cursor-none"
      >
        <img 
          src={highResImage} 
          className="w-full h-full object-cover grayscale-[0.2]"
          alt="Suzhou Embroidery Macro"
        />
        
        {/* Magnifier Glass */}
        {showMagnifier && (
          <div 
            className="fixed pointer-events-none w-64 h-64 rounded-full border-2 border-[#D4AF37] shadow-2xl z-50 overflow-hidden bg-white"
            style={{ 
              left: `${mousePos.x}%`, 
              top: `${mousePos.y}%`,
              transform: 'translate(-50%, -50%)',
              backgroundImage: `url(${highResImage})`,
              backgroundPosition: `${mousePos.x}% ${mousePos.y}%`,
              backgroundSize: '800%' // Intense zoom for split-silk detail
            }}
          />
        )}

        {/* Art Gallery Labels */}
        <div className="absolute top-12 left-12 space-y-2 pointer-events-none">
          <p className="text-[10px] tracking-[0.5em] text-[#A62C2B] uppercase">Artifact Provenance</p>
          <p className="font-mono text-[9px] opacity-40">HASH: 0x82f1...3e92</p>
        </div>

        <div className="absolute bottom-12 right-12 text-right space-y-4 max-w-sm pointer-events-none">
          <h2 className="serif-font text-5xl italic font-light">The Split-Silk Technique</h2>
          <p className="text-xs leading-relaxed opacity-60 font-light italic">
            A single silk thread is split into 48 filaments, each thinner than a human hair, capturing the refraction of light on a kingfisher's wing.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-32 px-12 grid grid-cols-1 md:grid-cols-3 gap-24">
        <div className="space-y-6">
          <h4 className="text-[11px] tracking-[0.6em] uppercase text-[#D4AF37]">Artistry</h4>
          <p className="serif-font text-2xl">Patience of Centuries</p>
          <p className="text-sm opacity-50 leading-loose">The technique requires absolute stillness. A single misplaced stitch can disrupt the flow of the entire visual plane.</p>
        </div>
        <div className="space-y-6">
          <h4 className="text-[11px] tracking-[0.6em] uppercase text-[#D4AF37]">Texture</h4>
          <p className="serif-font text-2xl">Liquid Light</p>
          <p className="text-sm opacity-50 leading-loose">Silk reflects light directionally. By alternating stitch angles, the artist paints with luminosity rather than just pigment.</p>
        </div>
        <div className="space-y-6">
          <h4 className="text-[11px] tracking-[0.6em] uppercase text-[#D4AF37]">Legacy</h4>
          <p className="serif-font text-2xl">Eternal Proof</p>
          <p className="text-sm opacity-50 leading-loose">Linage anchors this mastery to the Sui network, ensuring the artist's signature is as immortal as the tradition itself.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto pb-24 px-12 space-y-4">
        {buyError && (
          <p className="text-[11px] tracking-[0.15em] text-[#A62C2B] uppercase">
            Purchase failed: {buyError}
          </p>
        )}
        <PaymentAssetSelector
          assets={paymentAssets}
          selectedCoinType={selectedInputCoinType}
          amount={inputAmount}
          onCoinTypeChange={setSelectedInputCoinType}
          onAmountChange={setInputAmount}
          disabled={isBuying}
        />
        <button
          data-testid="embroidery-buy-button"
          onClick={handleBuy}
          disabled={isBuying || !onBuyEmbroidery}
          className="w-full bg-[#B22222] text-[#FAF9F6] text-[10px] tracking-[0.45em] px-6 py-4 uppercase shadow-md hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ clipPath: 'polygon(2% 4%, 98% 2%, 97% 96%, 3% 98%)' }}
        >
          购绣品 / Buy Listing
        </button>
      </div>
    </div>
  );
};

export default EmbroideryDetail;
