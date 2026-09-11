import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { createUser } from '../services/api.js';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Compass,
  Zap,
  Coffee,
  Wallet,
  Clock,
  ShieldCheck,
  Flame,
  UserCheck
} from 'lucide-react';
import { CorePersonalityVector } from '../types/index.js';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { setCurrentUser, refreshUsers } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Core Form State (5 High-Information Dimensions)
  const [name, setName] = useState('');
  const [age, setAge] = useState<number>(25);
  const [district, setDistrict] = useState('Kadıköy');

  const [explorationTendency, setExplorationTendency] = useState<CorePersonalityVector['explorationTendency']>('novelty_seeker');
  const [spontaneity, setSpontaneity] = useState<CorePersonalityVector['spontaneity']>('spontaneous');
  const [socialEnergy, setSocialEnergy] = useState<CorePersonalityVector['socialEnergy']>('energetic_social');
  const [budgetFlexibility, setBudgetFlexibility] = useState<CorePersonalityVector['budgetFlexibility']>('flexible');

  const handleFinish = async () => {
    try {
      setLoading(true);
      const newUser = await createUser({
        name: name.trim() || 'Yeni Kullanıcı',
        age: Number(age) || 25,
        location: { city: 'İstanbul', district },
        corePersonality: {
          explorationTendency,
          spontaneity,
          socialEnergy,
          budgetFlexibility
        }
      });

      localStorage.setItem('farketmez_user_id', newUser.id);
      setCurrentUser(newUser);
      await refreshUsers();
      onComplete();
    } catch (e) {
      console.error('Error creating profile:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto p-4 sm:p-6 flex flex-col justify-between max-w-md mx-auto">
      {/* Top Header & Progress */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-slate-900">Kısa Başlangıç Anketi</span>
          </div>
          <span className="text-xs font-bold text-slate-400">Adım {step} / 3</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Step Content */}
      <div className="py-6 flex-1 space-y-6">
        {/* STEP 1: Demographics */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Seni Tanıyalım! 👋
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Farketmez, seni uzun anketlerle yormaz; sadece kilit eksenleri öğrenir.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Adın veya Takma Adın
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Örn: Deniz"
                  className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Yaşın</label>
                  <input
                    type="number"
                    value={age}
                    onChange={e => setAge(parseInt(e.target.value) || 25)}
                    className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">İlçe / Bölge</label>
                  <select
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                    className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold focus:outline-none focus:bg-white"
                  >
                    <option value="Kadıköy">Kadıköy</option>
                    <option value="Beşiktaş">Beşiktaş</option>
                    <option value="Beyoğlu">Beyoğlu</option>
                    <option value="Şişli">Şişli</option>
                    <option value="Üsküdar">Üsküdar</option>
                    <option value="Sarıyer">Sarıyer</option>
                    <option value="Çankaya">Çankaya</option>
                    <option value="Alsancak">Alsancak</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Exploration & Spontaneity */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Keşif & Spontanlık Tarzın 🚀
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Karar alırken nasıl bir yaklaşım seversin?
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-2">Keşif Eğilimi:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExplorationTendency('novelty_seeker')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      explorationTendency === 'novelty_seeker'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/20 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-extrabold flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>Yenilikçi & Maceracı</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Sürekli yeni yerler, farklı mutfaklar ve deneyimler denemeyi severim.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExplorationTendency('familiarity_preferred')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      explorationTendency === 'familiarity_preferred'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/20 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-extrabold flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-emerald-600" />
                      <span>Güvenli & Bildiğim Yerler</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Bildiğim, sevdiğim ve kalitesinden emin olduğum yerlere gitmeyi tercih ederim.
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-700 block mb-2">Spontanlık:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSpontaneity('spontaneous')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      spontaneity === 'spontaneous'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/20 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-extrabold flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span>Anlık & Spontan</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      "Hadi çıkalım" deyip anında karar vermeyi severim.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSpontaneity('planner')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      spontaneity === 'planner'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/20 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-extrabold flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      <span>Planlı & Organize</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Önceden bilmek ve planlı hareket etmek isterim.
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Social Energy & Budget Flexibility */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Enerji & Bütçe Esnekliği ⚡
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Son iki temel eksen ile çekirdek profilin hazır.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-2">Sosyallik / Enerji:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSocialEnergy('energetic_social')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      socialEnergy === 'energetic_social'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/20 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-extrabold flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span>Sosyal & Hareketli</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Canlı, hareketli, enerjik ve kalabalık atmosferleri severim.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSocialEnergy('calm_peaceful')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      socialEnergy === 'calm_peaceful'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/20 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-extrabold flex items-center gap-1.5">
                      <Coffee className="w-4 h-4 text-teal-600" />
                      <span>Sakin & Dingin</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Kafamı dinleyebileceğim, huzurlu ve samimi ortamları tercih ederim.
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-700 block mb-2">Bütçe Esnekliği:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBudgetFlexibility('flexible')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      budgetFlexibility === 'flexible'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/20 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-extrabold flex items-center gap-1.5">
                      <Wallet className="w-4 h-4 text-emerald-600" />
                      <span>Genelde Esnek</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      İyi bir deneyim veya özel anlar için bütçemi esnetebilirim.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBudgetFlexibility('strict_budget')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      budgetFlexibility === 'strict_budget'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/20 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-extrabold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-slate-600" />
                      <span>Kısıtlı / Hesaplı</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Belirli bir bütçe sınırında kalmayı ve ekonomik olmayı önemserim.
                    </div>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-[11px] text-emerald-900 flex items-start gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Zımni Öğrenme:</strong> Mutfak türleri ve özel aktiviteleri sormadık; uygulamayı kullandıkça verdiğin kararlardan zevklerini kendiliğinden öğreneceğiz.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
        {step > 1 ? (
          <button
            onClick={() => setStep(step - 1)}
            className="px-4 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Geri</span>
          </button>
        ) : (
          <div></div>
        )}

        {step < 3 ? (
          <button
            onClick={() => setStep(step + 1)}
            className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all ml-auto"
          >
            <span>Devam Et</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleFinish}
            disabled={loading}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all ml-auto"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Profil Oluşturuluyor...' : 'Profilimi Başlat'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
