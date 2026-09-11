import React from 'react';
import { useTheme } from '../context/ThemeContext.js';

export const MobileFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isMobileView, theme } = useTheme();

  if (!isMobileView) {
    return (
      <div className={`min-h-screen ${theme === 'couple' ? 'bg-rose-50/40' : 'bg-slate-50'}`}>
        {children}
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-0 sm:p-4 md:p-6 ${theme === 'couple' ? 'bg-gradient-to-br from-rose-100 via-pink-100 to-amber-50' : 'bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950'}`}>
      {/* Smartphone Outer Shell */}
      <div className="w-full max-w-[430px] h-[100dvh] sm:h-[880px] bg-slate-900 sm:rounded-[48px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] sm:border-[8px] sm:border-slate-800 flex flex-col relative overflow-hidden ring-1 ring-white/10">
        
        {/* Dynamic Island / Speaker notch on top (desktop view only) */}
        <div className="hidden sm:flex absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-black rounded-full z-50 items-center justify-end px-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500/80 animate-pulse"></div>
        </div>

        {/* Screen Content */}
        <div className={`flex-1 overflow-y-auto overflow-x-hidden flex flex-col relative ${theme === 'couple' ? 'bg-rose-50/50' : 'bg-slate-50'}`}>
          {children}
        </div>

        {/* Bottom Home Indicator Bar (desktop view only) */}
        <div className="hidden sm:block absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-400/40 rounded-full z-40"></div>
      </div>
    </div>
  );
};
