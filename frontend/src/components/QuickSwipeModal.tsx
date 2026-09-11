import React, { useState, useEffect } from 'react';
import { OnboardingSwipeCard, User } from '../types/index.js';
import { fetchOnboardingCards, submitQuickSwipe } from '../services/api.js';
import { Heart, X, Sparkles, Check, Flame } from 'lucide-react';

interface QuickSwipeModalProps {
  userId: string;
  isOpen: boolean;
  onClose: (updatedUser?: User) => void;
}

export const QuickSwipeModal: React.FC<QuickSwipeModalProps> = ({
  userId,
  isOpen,
  onClose
}) => {
  const [cards, setCards] = useState<OnboardingSwipeCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [lastUser, setLastUser] = useState<User | undefined>(undefined);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchOnboardingCards()
        .then(data => {
          setCards(data);
          setCurrentIndex(0);
          setCompleted(false);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAction = async (action: 'like' | 'dislike') => {
    if (currentIndex >= cards.length) return;
    const card = cards[currentIndex];

    try {
      const res = await submitQuickSwipe({
        userId,
        cardId: card.id,
        action
      });
      if (res.user) {
        setLastUser(res.user);
      }
    } catch (e) {
      console.error('Quick swipe error:', e);
    }

    if (currentIndex + 1 >= cards.length) {
      setCompleted(true);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const currentCard = cards[currentIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-white overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 pb-2 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-xl">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">Hızlı Zevk Kalibrasyonu</h3>
              <p className="text-[11px] text-slate-500 font-medium">10 saniyede yapay zekayı kendine göre eğit</p>
            </div>
          </div>
          <button
            onClick={() => onClose(lastUser)}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex-1 overflow-y-auto flex flex-col justify-center items-center">
          {loading ? (
            <div className="py-16 text-center space-y-2">
              <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-slate-500">Kartlar yükleniyor...</p>
            </div>
          ) : completed ? (
            <div className="py-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-extrabold text-slate-900">Harika! Zevkin Öğrenildi 🎉</h4>
                <p className="text-xs text-slate-500 px-4">
                  Tercih ağırlıkların ve ortam zevklerin güncellendi. Artık sana çok daha nokta atışı öneriler yapılacak!
                </p>
              </div>
              <button
                onClick={() => onClose(lastUser)}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg active:scale-95 transition-all"
              >
                Tamamla ve Önerileri Gör
              </button>
            </div>
          ) : currentCard ? (
            <div className="w-full space-y-4">
              {/* Progress counter */}
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold px-1">
                <span>Adım {currentIndex + 1} / {cards.length}</span>
                <span className="text-rose-500 font-semibold">{currentCard.vibe.toUpperCase()}</span>
              </div>

              {/* Card visual */}
              <div className="relative rounded-2xl overflow-hidden shadow-lg aspect-[4/3] bg-slate-100 group">
                <img
                  src={currentCard.imageUrl}
                  alt={currentCard.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h4 className="text-base font-extrabold leading-tight">{currentCard.title}</h4>
                  <p className="text-xs text-slate-200 mt-0.5">{currentCard.subtitle}</p>
                </div>
              </div>

              {/* Description & Tags */}
              <div className="space-y-2">
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {currentCard.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {currentCard.tags.map((t, idx) => (
                    <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-4 pt-2">
                <button
                  onClick={() => handleAction('dislike')}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <X className="w-4 h-4 text-slate-500" />
                  <span>Bana Göre Değil</span>
                </button>
                <button
                  onClick={() => handleAction('like')}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-rose-500/25 active:scale-95 transition-all"
                >
                  <Heart className="w-4 h-4 fill-white" />
                  <span>Tam Benim Tarzım</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
