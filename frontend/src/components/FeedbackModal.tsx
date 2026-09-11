import React, { useState } from 'react';
import { Star, ThumbsUp, Meh, ThumbsDown, X, Sparkles } from 'lucide-react';
import { submitActivityFeedback } from '../services/api.js';

interface FeedbackModalProps {
  logId: string;
  venueTitle: string;
  category: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  logId,
  venueTitle,
  category,
  onClose,
  onSuccess
}) => {
  const [rating, setRating] = useState<number>(5);
  const [feedback, setFeedback] = useState<'liked' | 'neutral' | 'disliked'>('liked');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await submitActivityFeedback(logId, feedback, rating);
      onSuccess();
      onClose();
    } catch (e) {
      console.error('Feedback submission error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-slate-900">Nasıl Geçti?</h3>
          <p className="text-xs text-slate-500 font-medium">
            <strong>{venueTitle}</strong> deneyimin nasıldı?
          </p>
        </div>

        {/* Feedback Options */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setFeedback('liked')}
            className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
              feedback === 'liked'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold scale-105 shadow-sm'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ThumbsUp className={`w-5 h-5 ${feedback === 'liked' ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span className="text-[11px]">Çok İyiydi</span>
          </button>

          <button
            type="button"
            onClick={() => setFeedback('neutral')}
            className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
              feedback === 'neutral'
                ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold scale-105 shadow-sm'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Meh className={`w-5 h-5 ${feedback === 'neutral' ? 'text-amber-600' : 'text-slate-400'}`} />
            <span className="text-[11px]">Farketmez</span>
          </button>

          <button
            type="button"
            onClick={() => setFeedback('disliked')}
            className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
              feedback === 'disliked'
                ? 'border-rose-500 bg-rose-50 text-rose-900 font-bold scale-105 shadow-sm'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ThumbsDown className={`w-5 h-5 ${feedback === 'disliked' ? 'text-rose-600' : 'text-slate-400'}`} />
            <span className="text-[11px]">Beğenmedim</span>
          </button>
        </div>

        {/* Star Rating */}
        <div className="flex flex-col items-center gap-2 pt-2">
          <span className="text-xs text-slate-500 font-medium">Puanın:</span>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="p-1 transition-transform hover:scale-110 active:scale-95"
              >
                <Star
                  className={`w-7 h-7 ${
                    star <= rating
                      ? 'fill-amber-400 text-amber-400'
                      : 'fill-slate-100 text-slate-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="text-[11px] text-slate-400 text-center leading-relaxed">
          💡 Bu puan, Farketmez algoritmasının gelecekte sana daha isabetli öneriler yapmasını sağlar.
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98]"
        >
          {loading ? 'Kaydediliyor...' : 'Geri Bildirimi Kaydet'}
        </button>
      </div>
    </div>
  );
};
