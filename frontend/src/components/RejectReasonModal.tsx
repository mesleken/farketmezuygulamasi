import React from 'react';
import { RejectReasonTag } from '../types/index.js';
import { X, RotateCcw, DollarSign, CloudOff, Navigation, Sparkles } from 'lucide-react';

interface RejectReasonModalProps {
  venueTitle: string;
  onSelectReason: (reason: RejectReasonTag) => void;
  onClose: () => void;
  loading?: boolean;
}

export const RejectReasonModal: React.FC<RejectReasonModalProps> = ({
  venueTitle,
  onSelectReason,
  onClose,
  loading = false
}) => {
  const reasons: { id: RejectReasonTag; label: string; sub: string; icon: React.ReactNode; color: string }[] = [
    {
      id: 'already_visited',
      label: 'Daha önce denedim / gittim',
      sub: 'Soğuma süresine alınır, bir süre tekrar önerilmez',
      icon: <RotateCcw className="w-4 h-4 text-purple-600" />,
      color: 'hover:border-purple-300 hover:bg-purple-50/50'
    },
    {
      id: 'too_expensive',
      label: 'Bütçeme uygun değil',
      sub: 'Bu oturum için daha ekonomik seçenekler aranır',
      icon: <DollarSign className="w-4 h-4 text-emerald-600" />,
      color: 'hover:border-emerald-300 hover:bg-emerald-50/50'
    },
    {
      id: 'not_in_mood',
      label: 'Şu an canım bu tarz istemiyor',
      sub: 'Sadece bugüne özel bu kategori elenir',
      icon: <CloudOff className="w-4 h-4 text-amber-600" />,
      color: 'hover:border-amber-300 hover:bg-amber-50/50'
    },
    {
      id: 'too_far',
      label: 'Uzak / zaman uymuyor',
      sub: 'Daha yakın veya hızlı ulaşılabilir yerler taranır',
      icon: <Navigation className="w-4 h-4 text-blue-600" />,
      color: 'hover:border-blue-300 hover:bg-blue-50/50'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 space-y-4 animate-in slide-in-from-bottom duration-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Akıllı Reddetme Akışı</span>
          </div>
          <h3 className="text-base font-black text-slate-900">
            Neden Uygun Değil?
          </h3>
          <p className="text-xs text-slate-500">
            Tek tıkla bir sebep seç; algoritma anında sıradaki en uygun tek öneriyi getirsin.
          </p>
        </div>

        {/* Reason Buttons */}
        <div className="space-y-2 pt-1">
          {reasons.map(r => (
            <button
              key={r.id}
              disabled={loading}
              onClick={() => onSelectReason(r.id)}
              className={`w-full p-3 rounded-2xl border border-slate-200/80 flex items-start gap-3 text-left transition-all ${r.color} active:scale-[0.98] group`}
            >
              <div className="p-2 rounded-xl bg-slate-50 group-hover:bg-white border border-slate-100 shrink-0 mt-0.5">
                {r.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-800 group-hover:text-slate-900">
                  {r.label}
                </div>
                <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                  {r.sub}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
