import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Dices, Award, CheckCircle } from 'lucide-react';
import { ScoredRecommendation } from '../types/index.js';

interface DecisionWheelProps {
  winner: ScoredRecommendation;
  onFinished: () => void;
}

const mockDecidingItems = [
  '🍔 Gurme Burger mi?',
  '🍕 Odun Ateşinde Napoliten Pizza?',
  '🍜 Buharı Üstünde Ramen & Sushi?',
  '🎳 Neon Işıklı Bowling & Arcade?',
  '☕ Specialty Coffee & Cheesecake?',
  '🧩 Gizemli Kaçış Odası?',
  '🌮 Çıtır Birria Taco & Quesadilla?',
  '🎨 Seramik & Sanat Atölyesi?',
  '🥩 Zırh Kebabı & Ocakbaşı?',
  '🚲 Sahilde Günbatımı & Bisiklet?'
];

export const DecisionWheel: React.FC<DecisionWheelProps> = ({ winner, onFinished }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeciding, setIsDeciding] = useState(true);

  useEffect(() => {
    let speed = 60;
    let iterations = 0;
    const maxIterations = 28;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % mockDecidingItems.length);
      iterations++;

      if (iterations >= maxIterations) {
        clearInterval(interval);
        setIsDeciding(false);

        // Fire Confetti!
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });

        // Small delay then trigger onFinished
        setTimeout(() => {
          onFinished();
        }, 1400);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [onFinished]);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
        
        {isDeciding ? (
          <div className="space-y-4 py-6">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-200 animate-bounce">
              <Dices className="w-10 h-10 animate-spin-slow" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Farketmez AI Karar Veriyor...
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Kişiliğin, geçmiş tercihlerin ve soğuma süreleri taranıyor
              </p>
            </div>

            <div className="h-16 flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-200 px-3">
              <span className="text-base font-bold text-emerald-600 transition-all scale-105">
                {mockDecidingItems[currentIndex]}
              </span>
            </div>

            <div className="flex justify-center gap-1.5 pt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
              <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4 animate-in zoom-in-90 duration-300">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white shadow-xl shadow-emerald-200">
              <Award className="w-10 h-10 text-amber-300" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>% {winner.totalScore} Uyumlu Karar</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {winner.venue.title}
              </h3>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                {winner.venue.categoryNameTr} • {winner.venue.district}
              </p>
            </div>

            <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-100 text-left space-y-1">
              {winner.matchReasons.slice(0, 2).map((r, i) => (
                <div key={i} className="text-[11px] font-medium text-emerald-900 flex items-start gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
