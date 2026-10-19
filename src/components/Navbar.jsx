import React from 'react';
import { Globe, HelpCircle } from 'lucide-react';
import { BrandIcon } from './BrandIcon';

export const Navbar = ({ lang, onToggleLang, onOpenInfo }) => {
  const isUrdu = lang === 'ur';

  return (
    <header className="sticky top-0 z-40 bg-stone-900/95 text-stone-100 backdrop-blur-md border-b border-stone-800/80 shadow-md">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Emblem & Name */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <BrandIcon size="md" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-black text-xl sm:text-2xl tracking-tight text-white font-sans-main">
                Decode<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">AI</span>
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-stone-400 font-urdu truncate hidden xs:block sm:block leading-tight">
              {isUrdu ? 'کسی بھی دستاویز کو آسان اردو اور انگریزی میں سمجھیں' : 'Decode any document with AI explanations & voice'}
            </p>
          </div>
        </div>

        {/* Right side controls: Language switcher & Guide button */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Interface Language Switcher (Urdu / English) */}
          <div className="flex items-center rounded-xl bg-stone-800/90 p-1 border border-stone-700/80 shadow-xs">
            <button
              onClick={() => onToggleLang('ur')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 min-h-[32px] ${
                isUrdu
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="اردو زبان منتخب کریں"
            >
              <Globe className="w-3 h-3 shrink-0" />
              <span>اردو</span>
            </button>
            <button
              onClick={() => onToggleLang('en')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all min-h-[32px] ${
                !isUrdu
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Select English"
            >
              English
            </button>
          </div>

          {/* User Guide Modal Button */}
          <button
            onClick={onOpenInfo}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-stone-800/90 hover:bg-stone-700 border border-stone-700/80 text-xs text-stone-300 hover:text-white transition-colors flex items-center gap-1.5 min-h-[32px]"
            title={isUrdu ? 'رہنمائی اور معلومات' : 'Guide & Info'}
            aria-label="User Guide"
          >
            <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="hidden sm:inline font-urdu">{isUrdu ? 'رہنمائی' : 'Guide'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
