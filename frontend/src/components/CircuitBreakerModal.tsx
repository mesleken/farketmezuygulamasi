import React from 'react';
import { HelpCircle, Sparkles, Compass } from 'lucide-react';

interface CircuitBreakerModalProps {
  question: string;
  options: { id: string; label: string; filter: string }[];
  onSelectOption: (filter: string) => void;
}

export const CircuitBreakerModal: React.FC<CircuitBreakerModalProps> = ({
  question,
  options,
  onSelectOption
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200 text-center">
        <div className="w-14 h-14 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center shadow-lg shadow-orange-200">
          <Compass className="w-7 h-7 animate-spin-slow" />
        </div>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 uppercase tracking-wider bg-amber-50 px-2.5 py-0.5 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Karar Döngüsünü Kıralım</span>
          </div>
          <h3 className="text-base font-black text-slate-900 leading-snug">
            {question}
          </h3>
          <p className="text-xs text-slate-500">
            Sonsuz red döngüsüne girmemek için yönü belirleyelim:
          </p>
        </div>

        <div className="space-y-2 pt-2">
          {options.map(opt => (
            <button
              key={opt.id}
              onClick={() => onSelectOption(opt.filter)}
              className="w-full p-3.5 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-200/80 hover:border-emerald-300 text-slate-800 hover:text-emerald-900 font-bold text-xs transition-all active:scale-[0.98] shadow-sm flex items-center justify-center"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
