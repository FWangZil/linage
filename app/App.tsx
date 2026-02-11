
import React, { useState, useEffect } from 'react';
import SilkPath from './components/SilkPath';
import GardenWindow from './components/GardenWindow';
import InkSealButton from './components/InkSealButton';
import TraditionalSeal from './components/TraditionalSeal';
import ZenLoader from './components/ZenLoader';
import SupportTicket from './components/SupportTicket';
import EmbroideryDetail from './components/EmbroideryDetail';
import TeaDetail, { TEA_REGIONS } from './components/TeaDetail';
import JourneyPage from './components/JourneyPage';
import ExperiencePage, { EXPERIENCE_DATA } from './components/ExperiencePage';
import type { PaymentAssetOption } from './components/PaymentAssetSelector';
import { HeritageItem, ActivePage } from './types';
import { useLinageChain } from './hooks/useLinageChain';
import { SUI_COIN_TYPE } from './chain/runtimeConfig';

const HERITAGE_DATA: HeritageItem[] = [
  {
    id: '1',
    title: 'The Silk Archive',
    subtitle: 'The Soul of Silk',
    description: 'A thousand threads of silk, weaving the ephemeral beauty of the Jiangnan mist into a permanent testament of patience and grace.',
    imageUrl: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=2000',
    shape: 'haitang'
  },
  {
    id: '2',
    title: 'The Leaf Archive',
    subtitle: 'Mountain Mist Brew',
    description: 'Harvested at dawn on the misty peaks of Dongshan, these leaves carry the mineral whispers of lake stones and the floral spirit of spring.',
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=1974&auto=format&fit=crop',
    shape: 'octagon'
  },
  {
    id: '3',
    title: 'Guzheng Resonance',
    subtitle: 'Vibrations of History',
    description: 'The strings resonate not just with sound, but with the gravitational pull of five thousand years of poetic heritage.',
    imageUrl: 'https://images.unsplash.com/photo-1543789506-69622d7a2216?q=80&w=1974&auto=format&fit=crop',
    shape: 'moon'
  }
];

const TEA_LISTING_ID = import.meta.env.VITE_LINAGE_TEA_LISTING_ID;
const EMBROIDERY_LISTING_ID = import.meta.env.VITE_LINAGE_EMBROIDERY_LISTING_ID;
const USDC_COIN_TYPE = import.meta.env.VITE_LINAGE_USDC_COIN_TYPE;
const DEFAULT_PAYMENT_AMOUNT = import.meta.env.VITE_LINAGE_DEFAULT_PAYMENT_AMOUNT || '0.1';
const DEFAULT_INPUT_COIN_TYPE = import.meta.env.VITE_LINAGE_DEFAULT_INPUT_COIN_TYPE || SUI_COIN_TYPE;

const App: React.FC = () => {
  const { isConnected, address, connect, disconnect, mintTeaCollectibleUsdc, buyListingUsdc, formatError } = useLinageChain();
  const [currentPage, setCurrentPage] = useState<ActivePage>('Home');
  const [isLoading, setIsLoading] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState("");
  const [savedExperienceIds, setSavedExperienceIds] = useState<string[]>([]);
  const [collectedTeaIds, setCollectedTeaIds] = useState<string[]>([]);
  const paymentAssets: PaymentAssetOption[] = [
    { label: 'SUI', coinType: SUI_COIN_TYPE, decimals: 9 },
    ...(USDC_COIN_TYPE
      ? [{ label: 'USDC', coinType: USDC_COIN_TYPE, decimals: 6 } as PaymentAssetOption]
      : []),
  ];

  useEffect(() => {
    const savedExp = localStorage.getItem('linage_saved_experiences');
    if (savedExp) {
      try {
        setSavedExperienceIds(JSON.parse(savedExp));
      } catch (e) {
        console.error("Failed to load saved experiences", e);
      }
    }

    const savedTea = localStorage.getItem('linage_tea_passport');
    if (savedTea) {
      try {
        setCollectedTeaIds(JSON.parse(savedTea));
      } catch (e) {
        console.error("Failed to load tea collection", e);
      }
    }
  }, []);

  const navigateTo = (page: ActivePage) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentPage(page);
  };

  const handleConnect = async () => {
    setLoaderMessage(isConnected ? "ROLLING BACK SEAL..." : "SUMMONING WALLET...");
    setIsLoading(true);
    try {
      if (isConnected) {
        await disconnect();
        navigateTo('Home');
      } else {
        await connect();
      }
    } catch (error) {
      window.alert(`Wallet action failed: ${formatError(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSaveExperience = (id: string) => {
    const updated = savedExperienceIds.includes(id) 
      ? savedExperienceIds.filter(idx => idx !== id) 
      : [...savedExperienceIds, id];
    setSavedExperienceIds(updated);
    localStorage.setItem('linage_saved_experiences', JSON.stringify(updated));
  };

  const updateTeaCollection = (ids: string[]) => {
    setCollectedTeaIds(ids);
    localStorage.setItem('linage_tea_passport', JSON.stringify(ids));
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'Embroidery':
        return (
          <EmbroideryDetail
            paymentAssets={paymentAssets}
            defaultInputCoinType={DEFAULT_INPUT_COIN_TYPE}
            defaultInputAmount={DEFAULT_PAYMENT_AMOUNT}
            onBuyEmbroidery={
              EMBROIDERY_LISTING_ID
                ? async ({ inputCoinType, inputAmount }) => {
                    await buyListingUsdc({
                      listingId: EMBROIDERY_LISTING_ID,
                      inputCoinType,
                      inputAmount,
                    });
                  }
                : undefined
            }
          />
        );
      case 'Tea':
        return (
          <TeaDetail 
            collectedTeaIds={collectedTeaIds} 
            onUpdateCollection={updateTeaCollection} 
            paymentAssets={paymentAssets}
            defaultInputCoinType={DEFAULT_INPUT_COIN_TYPE}
            defaultInputAmount={DEFAULT_PAYMENT_AMOUNT}
            onMintTea={async ({ regionId, tributeMessage, inputCoinType, inputAmount }) => {
              await mintTeaCollectibleUsdc({
                itemCode: regionId,
                tribute: tributeMessage,
                inputCoinType,
                inputAmount,
              });
            }}
            onBuyTea={
              TEA_LISTING_ID
                ? async ({ inputCoinType, inputAmount }) => {
                    await buyListingUsdc({
                      listingId: TEA_LISTING_ID,
                      inputCoinType,
                      inputAmount,
                    });
                  }
                : undefined
            }
          />
        );
      case 'Experience':
        return (
          <ExperiencePage 
            onBack={() => navigateTo('Journey')} 
            savedIds={savedExperienceIds}
            onToggleSave={toggleSaveExperience}
          />
        );
      case 'Profile':
        return (
          <div className="pt-48 px-8 max-w-5xl mx-auto min-h-screen animate-fade-in pb-32">
            <header className="mb-24 flex items-end justify-between border-b border-[#2D2A26]/5 pb-12">
              <div className="space-y-4">
                <span className="text-[10px] tracking-[0.5em] text-[#D4AF37] uppercase">User Profile / 个人主页</span>
                <h2 className="text-5xl serif-font italic">{address.slice(0, 10)}...</h2>
              </div>
              <div className="text-right">
                <p className="text-[9px] tracking-[0.3em] opacity-30 uppercase mb-2">Total Collections</p>
                <p className="text-4xl serif-font">{savedExperienceIds.length + collectedTeaIds.length}</p>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-20">
              <div className="lg:col-span-2 space-y-32">
                
                <section className="space-y-12">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-[11px] tracking-[0.5em] uppercase opacity-40 border-l-2 border-[#A62C2B] pl-4">Tea Collection / 茗赏</h3>
                    <button onClick={() => navigateTo('Tea')} className="text-[9px] tracking-[0.4em] uppercase opacity-40 hover:opacity-100 hover:text-[#A62C2B] transition-all">Explore Regions →</button>
                  </div>
                  {collectedTeaIds.length === 0 ? (
                    <div className="py-12 px-8 border border-dashed border-[#2D2A26]/10 text-center opacity-30">
                      <p className="text-[10px] tracking-[0.4em] uppercase">No tea mists gathered.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-6">
                      {collectedTeaIds.map(id => {
                        const tea = TEA_REGIONS.find(t => t.id === id);
                        if (!tea) return null;
                        return (
                          <div 
                            key={id} 
                            className="group flex flex-col items-center space-y-4 cursor-pointer"
                            onClick={() => navigateTo('Tea')}
                          >
                            <div className="w-full aspect-square relative bg-[#2D2A26]/5 overflow-hidden">
                               <GardenWindow shape="haitang" imageUrl={tea.img} className="w-full h-full scale-90 group-hover:scale-100 transition-transform duration-700" />
                            </div>
                            <div className="text-center">
                              <p className="serif-font text-xs italic">{tea.name}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                <section className="space-y-12">
                  <h3 className="text-[11px] tracking-[0.5em] uppercase opacity-40 border-l-2 border-[#A62C2B] pl-4">Saved Experiences / 游迹收藏</h3>
                  {savedExperienceIds.length === 0 ? (
                    <div className="py-12 px-8 border border-dashed border-[#2D2A26]/10 text-center opacity-30">
                      <p className="text-[10px] tracking-[0.4em] uppercase">No paths discovered yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-12">
                      {savedExperienceIds.map(id => {
                        const exp = EXPERIENCE_DATA.find(e => e.id === id);
                        if (!exp) return null;
                        return (
                          <div 
                            key={id} 
                            className="group flex flex-col md:flex-row items-center gap-8 bg-[#2D2A26]/[0.02] p-6 border border-transparent hover:border-[#2D2A26]/10 transition-all cursor-pointer"
                            onClick={() => navigateTo('Experience')}
                          >
                            <div className="w-full md:w-32 aspect-[4/5] overflow-hidden">
                              <img src={exp.imageUrl} className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
                            </div>
                            <div className="flex-grow space-y-2">
                              <p className="text-[9px] tracking-[0.4em] text-[#D4AF37] uppercase">{exp.location}</p>
                              <h4 className="serif-font text-xl italic">{exp.title}</h4>
                              <p className="text-[10px] opacity-40 line-clamp-2 italic leading-relaxed">{exp.description}</p>
                            </div>
                            <div 
                              onClick={(e) => { e.stopPropagation(); toggleSaveExperience(exp.id); }}
                              className="text-[10px] tracking-[0.2em] uppercase opacity-30 hover:opacity-100 hover:text-[#A62C2B] transition-all p-2"
                            >
                              Remove
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                <section className="space-y-12">
                  <h3 className="text-[11px] tracking-[0.5em] uppercase opacity-40 border-l-2 border-[#A62C2B] pl-4">Active Stamps / 匠心印</h3>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="aspect-square border border-[#2D2A26]/10 flex flex-col items-center justify-center p-4 bg-[#B22222]/[0.02] group hover:bg-[#B22222]/5 transition-all">
                        <div className="w-10 h-10 border border-[#B22222]/20 flex items-center justify-center mb-3">
                           <span className="text-[#B22222] text-[10px] font-bold">印</span>
                        </div>
                        <p className="text-[8px] tracking-widest opacity-40 uppercase text-center">Master Cert #{1024 + i}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <aside className="space-y-16">
                <div className="bg-[#FAF9F6] border border-[#2D2A26]/10 p-8 space-y-10 shadow-sm">
                  <h4 className="text-[10px] tracking-[0.5em] uppercase text-[#A62C2B] font-bold">Active Entitlements</h4>
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <p className="text-[10px] tracking-[0.2em] uppercase opacity-40">Preservation Priority</p>
                      <p className="serif-font text-lg italic">Early access to Pre-Qingming Bi Luo Chun</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] tracking-[0.2em] uppercase opacity-40">Studio Access</p>
                      <p className="serif-font text-lg italic">Lifetime workshop pass in Suzhou Old Town</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] tracking-[0.2em] uppercase opacity-40">Legacy Allocation</p>
                      <p className="serif-font text-lg italic">Annual quota for custom silk works</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-8 border border-[#2D2A26]/10 space-y-6">
                  <h4 className="text-[10px] tracking-[0.4em] uppercase opacity-40">Artifact Status</h4>
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] tracking-widest uppercase opacity-60">Synchronized on Chain</span>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        );
      case 'Origin':
        return (
          <div className="pt-48 px-8 max-w-4xl mx-auto space-y-32 min-h-screen animate-fade-in pb-48">
            <header className="text-center space-y-12">
              <h2 className="text-7xl md:text-8xl serif-font italic font-light tracking-tight text-[#2D2A26]">The Philosophy</h2>
              <div className="w-32 h-[1px] bg-[#D4AF37]/40 mx-auto" />
            </header>
            
            <div className="max-w-2xl mx-auto text-center space-y-24">
              <div className="space-y-10">
                <p className="serif-font text-3xl md:text-4xl leading-tight italic opacity-95">
                  I’m not interested in landmarks.
                </p>
                <p className="serif-font text-3xl md:text-4xl leading-tight italic opacity-95">
                  I’m interested in what people are about to lose.
                </p>
              </div>

              <div className="space-y-10">
                <p className="text-base md:text-lg tracking-[0.1em] opacity-60 leading-relaxed font-light italic">
                  Many forms of everyday culture don’t disappear loudly. <br />
                  They fade — quietly, gradually, without announcement.
                </p>
                <p className="text-base md:text-lg tracking-[0.1em] opacity-60 leading-relaxed font-light italic">
                  I believe they are still worth seeing. <br />
                  And worth appreciating, before they’re gone.
                </p>
              </div>

              <div className="pt-16 flex flex-col items-center">
                 <div className="w-16 h-[1px] bg-[#2D2A26]/10 mb-16" />
                 <TraditionalSeal 
                    text="Enter the Lineage" 
                    onClick={() => navigateTo('Curated')} 
                 />
              </div>
            </div>
          </div>
        );
      case 'Curated':
        return (
          <div className="pt-48 px-8 max-w-6xl mx-auto min-h-screen pb-64">
            <header className="text-center mb-40 space-y-6">
              <h2 className="text-6xl serif-font font-light tracking-tight text-[#2D2A26]">Curated Archive</h2>
              <p className="text-[10px] tracking-[0.4em] uppercase opacity-40">Verifying the soul of objects</p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-24 gap-y-32 px-4 md:px-0">
              {HERITAGE_DATA.slice(0, 2).map(item => {
                const link = item.id === '1' ? 'Embroidery' : 'Tea';
                return (
                  <div key={item.id} className="flex flex-col items-center w-full">
                    <GardenWindow shape={item.shape} imageUrl={item.imageUrl} title={item.title} subtitle={item.subtitle} className="w-full max-w-md" />
                    <button 
                      onClick={() => navigateTo(link as ActivePage)}
                      className="mt-12 group relative text-[9px] tracking-[0.5em] uppercase pb-2 transition-all"
                    >
                      <span className="relative z-10">Trace Provenance / 溯源</span>
                      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[#2D2A26]/10" />
                      <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#A62C2B] group-hover:w-full transition-all duration-700" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      case 'Journey':
        return <JourneyPage onDiscover={() => navigateTo('Experience')} />;
      default:
        return (
          <>
            <section className="h-screen flex items-center justify-center relative px-8 overflow-hidden pt-32">
              <div className="max-w-4xl text-center z-40 relative">
                <span className="serif-font italic text-[#D4AF37] text-xl block mb-10 opacity-90 animate-fade-in drop-shadow-sm">
                  "Every Thread a Pulse, Every Object a Legacy."
                </span>
                <h2 className="text-6xl md:text-9xl serif-font leading-[1.1] mb-12 tracking-tight text-[#2D2A26]">
                  A Living <br />
                  <span className="italic font-light opacity-90">Heritage</span>
                </h2>
                <p className="max-w-xl mx-auto text-[11px] font-medium leading-loose tracking-[0.4em] opacity-40 uppercase">
                  Linage bridges the tactile beauty of intangible cultural heritage with the immutable provenance of the blockchain.
                </p>
              </div>
              
              <div className="absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85vw] h-[65vh] z-10 opacity-[0.04] pointer-events-none">
                <GardenWindow 
                  isHero={true} 
                  shape="moon" 
                  imageUrl="https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=2000" 
                />
              </div>
            </section>

            <section className="px-8 md:px-24 py-32 space-y-[45vh]">
              {HERITAGE_DATA.slice(0, 2).map((item, index) => {
                const isEven = index % 2 === 0;
                const link = item.id === '1' ? 'Embroidery' : 'Tea';
                return (
                  <div 
                    key={item.id} 
                    className={`flex flex-col md:flex-row items-center gap-16 md:gap-32 ${!isEven ? 'md:flex-row-reverse' : ''}`}
                  >
                    <div className="w-full md:w-1/2">
                      <GardenWindow shape={item.shape} imageUrl={item.imageUrl} title={item.title} subtitle={item.subtitle} />
                    </div>
                    <div className={`w-full md:w-1/2 space-y-10 z-20 flex flex-col ${!isEven ? 'items-start text-left' : 'items-end text-right'}`}>
                      <p className="text-sm leading-[2.4] tracking-[0.1em] text-[#666] max-w-md font-light italic opacity-80">
                        {item.description}
                      </p>
                      <div className="pt-8 w-full flex">
                        <button 
                          onClick={() => navigateTo(link as ActivePage)}
                          className={`group relative text-[9px] tracking-[0.5em] uppercase pb-2 transition-all ml-0 ${isEven ? 'ml-auto' : 'mr-auto'}`}
                        >
                          <span className="relative z-10">Trace Provenance / 溯源</span>
                          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[#2D2A26]/10" />
                          <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#A62C2B] group-hover:w-full transition-all duration-700" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>

            <section 
              data-footer="true"
              className="h-screen flex flex-col items-center justify-center bg-[#121212] relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(45,34,20,0.4)_0%,_transparent_70%)] m-0"
            >
              <div className="absolute inset-0 opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/handmade-paper.png')] pointer-events-none" />
              
              <div className="relative z-10 text-center space-y-12 px-8">
                <h2 className="text-6xl md:text-9xl serif-font italic font-light tracking-tight text-[#FAF4E6] opacity-95">
                  Join the Scroll
                </h2>
                
                <div className="max-w-3xl mx-auto text-[#FAF4E6]/80 serif-font italic tracking-wide space-y-6 md:space-y-8">
                  <p className="text-base md:text-lg leading-tight flex flex-wrap justify-center items-baseline">
                    Every interaction is a pulse of 
                    <span className="text-xl md:text-2xl ml-3 font-bold text-[#FAF4E6] drop-shadow-md">ink</span>
                  </p>
                  <p className="text-base md:text-lg leading-tight flex flex-wrap justify-center items-baseline">
                    on the eternal canvas of the 
                    <span className="text-xl md:text-2xl ml-3 font-bold text-[#FAF4E6] drop-shadow-md">blockchain.</span>
                  </p>
                </div>

                <div className="flex justify-center pt-10">
                  <InkSealButton 
                    onConnect={handleConnect} 
                    isConnected={isConnected} 
                    address={address} 
                    onProfileClick={() => navigateTo('Profile')} 
                  />
                </div>
              </div>

              <footer className="absolute bottom-12 w-full px-12 flex flex-col md:flex-row justify-between items-center text-[8px] tracking-[0.5em] uppercase opacity-40 text-[#FAF4E6] gap-8">
                <span>&copy; 2024 LINAGE. CURATED BY TRADITION.</span>
                <div className="flex gap-12 font-light">
                  <a href="#" className="hover:opacity-100 transition-opacity">Archive</a>
                  <a href="#" className="hover:opacity-100 transition-opacity">Legacy</a>
                </div>
              </footer>
            </section>
          </>
        );
    }
  };

  return (
    <div className="relative min-h-screen bg-[#FAF9F6] flex flex-col m-0 p-0">
      <ZenLoader isLoading={isLoading} message={loaderMessage} />
      {['Home', 'Journey', 'Experience'].indexOf(currentPage) !== -1 && <SilkPath />}
      <SupportTicket />

      <nav className="fixed top-0 left-0 w-full h-36 flex justify-between items-center px-12 z-[100] bg-[#FAF9F6]/20 backdrop-blur-xl border-b border-[#2D2A26]/5 transition-all duration-500 overflow-visible">
        <div className="flex flex-col cursor-pointer" onClick={() => navigateTo('Home')}>
          <h1 className="text-2xl md:text-3xl tracking-[0.4em] font-light serif-font">LINAGE</h1>
          <span className="text-[9px] tracking-[0.4em] opacity-40 uppercase mt-0.5">Heritage on Chain</span>
        </div>
        
        <div className="hidden md:flex gap-16 text-[9px] tracking-[0.4em] uppercase">
          <button onClick={() => navigateTo('Origin')} className={`hover:text-[#A62C2B] transition-colors group flex items-center gap-2 ${currentPage === 'Origin' ? 'text-[#A62C2B]' : ''}`}>
            The Philosophy <span className="text-sm serif-font text-[#2D2A26]/40 group-hover:text-[#A62C2B]/60 transition-colors">/ 始</span>
          </button>
          <button onClick={() => navigateTo('Curated')} className={`hover:text-[#A62C2B] transition-colors group flex items-center gap-2 ${currentPage === 'Curated' ? 'text-[#A62C2B]' : ''}`}>
            The Curated <span className="text-sm serif-font text-[#2D2A26]/40 group-hover:text-[#A62C2B]/60 transition-colors">/ 物</span>
          </button>
          <button onClick={() => navigateTo('Journey')} className={`hover:text-[#A62C2B] transition-colors group flex items-center gap-2 ${currentPage === 'Journey' ? 'text-[#A62C2B]' : ''}`}>
            The Journey <span className="text-sm serif-font text-[#2D2A26]/40 group-hover:text-[#A62C2B]/60 transition-colors">/ 迹</span>
          </button>
        </div>

        <div className="flex items-center w-[160px] justify-end overflow-visible">
          <InkSealButton 
            onConnect={handleConnect} 
            onProfileClick={() => navigateTo('Profile')}
            isConnected={isConnected} 
            address={address} 
          />
        </div>
      </nav>

      <div className="relative z-10 flex-grow">
        {renderContent()}
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
        }
        body, html {
          margin: 0;
          padding: 0;
          height: 100%;
        }
      `}</style>
    </div>
  );
};

export default App;
