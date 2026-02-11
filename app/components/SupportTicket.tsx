
import React, { useState } from 'react';

const SupportTicket: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setIsOpen(false);
    }, 2000);
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      {isOpen ? (
        <div className="bg-[#FAF9F6] border border-[#2D2A26]/10 p-8 w-80 shadow-2xl animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#A62C2B]/20" />
          
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 text-[#2D2A26]/40 hover:text-[#A62C2B] transition-colors"
          >
            ✕
          </button>

          <h4 className="serif-font text-xl mb-6 tracking-widest">SUBMIT SCROLL</h4>
          
          {submitted ? (
            <div className="py-12 text-center animate-pulse">
              <p className="text-[10px] tracking-[0.4em] uppercase opacity-60">The ink has dried.</p>
              <p className="text-[10px] tracking-[0.4em] uppercase opacity-60 mt-2">We shall respond soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[8px] tracking-[0.4em] uppercase opacity-40">Your Message</label>
                <textarea 
                  required
                  rows={4}
                  className="w-full bg-[#2D2A26]/5 border-none p-4 text-xs focus:ring-1 focus:ring-[#A62C2B]/30 outline-none transition-all"
                  placeholder="Describe your inquiry..."
                />
              </div>
              <button 
                type="submit"
                className="w-full py-3 bg-[#2D2A26] text-[#FAF9F6] text-[10px] tracking-[0.4em] uppercase hover:bg-[#A62C2B] transition-colors"
              >
                Inscribe
              </button>
            </form>
          )}
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-4 bg-[#FAF9F6] border border-[#2D2A26]/10 px-6 py-4 hover:border-[#A62C2B]/40 transition-all duration-500 shadow-sm"
        >
          <div className="w-2 h-2 bg-[#A62C2B] animate-pulse rounded-full" />
          <span className="text-[9px] tracking-[0.4em] uppercase opacity-60 group-hover:opacity-100 group-hover:text-[#A62C2B] transition-all">
            Inquiry / 问
          </span>
        </button>
      )}
    </div>
  );
};

export default SupportTicket;
