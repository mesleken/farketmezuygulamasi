import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';
import {
  Heart,
  Sparkles,
  Calendar,
  AlertCircle,
  Plus,
  Flame,
  Camera,
  MapPin,
  Clock,
  Gift,
  Lock,
  ThumbsUp,
  Meh,
  ThumbsDown,
  ListPlus,
  CheckCircle2,
  Bookmark,
  ShieldCheck,
  Scale
} from 'lucide-react';
import {
  fetchCoupleProfile,
  pairPartner,
  fetchCoupleSuggestions,
  recommendCoupleDecision,
  createSurprisePlan,
  submitSurpriseFeedback,
  addSharedWishlist,
  addCoupleMemory
} from '../services/api.js';
import { CoupleProfile, ScoredRecommendation, SurpriseRequest } from '../types/index.js';
import { VenueCard } from '../components/VenueCard.js';

export const CoupleMode: React.FC = () => {
  const { currentUser } = useAuth();
  const { theme, setTheme } = useTheme();

  const [couple, setCouple] = useState<CoupleProfile | null>(null);
  const [partnerCodeInput, setPartnerCodeInput] = useState('');
  const [activeDecision, setActiveDecision] = useState<ScoredRecommendation | null>(null);
  const [suggestions, setSuggestions] = useState<{
    routineBreakers: ScoredRecommendation[];
    romanticDates: ScoredRecommendation[];
    anniversaryAlert?: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [overrideMode, setOverrideMode] = useState<'none' | 'partner' | 'self'>('none');
  const [specialDayFilter, setSpecialDayFilter] = useState(false);

  // Modals
  const [showSurpriseModal, setShowSurpriseModal] = useState(false);
  const [surpriseTime, setSurpriseTime] = useState('Cuma 19:30');
  const [surpriseStyle, setSurpriseStyle] = useState<'romantic' | 'active_adventurous' | 'cozy_dinner'>('romantic');

  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const [wishlistTitle, setWishlistTitle] = useState('');
  const [wishlistCategory, setWishlistCategory] = useState('kultur_sanat');

  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [memoryTitle, setMemoryTitle] = useState('');
  const [memoryVenue, setMemoryVenue] = useState('');
  const [memoryNote, setMemoryNote] = useState('');

  const [feedbackSurprise, setFeedbackSurprise] = useState<SurpriseRequest | null>(null);

  useEffect(() => {
    setTheme('couple');
    return () => setTheme('standard');
  }, [setTheme]);

  const loadCoupleData = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const data = await fetchCoupleProfile(currentUser.id);
      setCouple(data);

      if (data) {
        const sug = await fetchCoupleSuggestions(data.id);
        setSuggestions(sug);

        // Fetch single couple recommendation
        const dec = await recommendCoupleDecision(data.id, {
          requesterUserId: currentUser.id,
          isSpecialDayMode: specialDayFilter,
          manualOverrideTarget: overrideMode
        });
        setActiveDecision(dec);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupleData();
  }, [currentUser, overrideMode, specialDayFilter]);

  const handlePair = async () => {
    if (!currentUser || !partnerCodeInput.trim()) return;
    try {
      setLoading(true);
      const res = await pairPartner(currentUser.id, partnerCodeInput.trim());
      setCouple(res);
      loadCoupleData();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSurprise = async () => {
    if (!couple || !currentUser) return;
    try {
      setLoading(true);
      await createSurprisePlan(couple.id, {
        plannerUserId: currentUser.id,
        targetDateTime: surpriseTime,
        stylePreference: surpriseStyle
      });
      setShowSurpriseModal(false);
      loadCoupleData();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSurpriseFeedback = async (feedback: 'liked' | 'neutral' | 'disliked') => {
    if (!feedbackSurprise || !currentUser) return;
    try {
      await submitSurpriseFeedback(feedbackSurprise.id, {
        userId: currentUser.id,
        feedback
      });
      setFeedbackSurprise(null);
      loadCoupleData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddWishlist = async () => {
    if (!couple || !currentUser || !wishlistTitle.trim()) return;
    try {
      await addSharedWishlist(couple.id, {
        title: wishlistTitle.trim(),
        category: wishlistCategory,
        addedByUserId: currentUser.id
      });
      setShowWishlistModal(false);
      setWishlistTitle('');
      loadCoupleData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddMemory = async () => {
    if (!couple || !memoryTitle.trim()) return;
    try {
      const updated = await addCoupleMemory(couple.id, {
        title: memoryTitle,
        venueName: memoryVenue,
        note: memoryNote
      });
      setCouple(updated);
      setShowMemoryModal(false);
      setMemoryTitle('');
      setMemoryVenue('');
      setMemoryNote('');
    } catch (e) {
      console.error(e);
    }
  };

  const daysTogether = couple?.relationshipStartDate
    ? Math.floor((Date.now() - new Date(couple.relationshipStartDate).getTime()) / (1000 * 60 * 60 * 24))
    : 380;

  const isPlanner = (s: SurpriseRequest) => s.plannerUserId === currentUser?.id;

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-5">
      {/* Couple Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 via-pink-600 to-rose-900 p-5 text-white shadow-xl shadow-rose-900/20">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-rose-100 text-xs font-semibold">
            <Heart className="w-3.5 h-3.5 fill-rose-300 text-rose-300" />
            <span>İzole Çift Alanı & Sürpriz Modu</span>
          </div>
          <h2 className="text-xl font-black tracking-tight">
            {couple ? `${couple.user1Name} ❤️ ${couple.user2Name}` : 'Sevgili / Partner Alanı'}
          </h2>
          <p className="text-xs text-rose-100/90 leading-relaxed">
            Veri mahremiyeti garantili; çift aktiviteleriniz arkadaş gruplarına sızmaz.
          </p>
        </div>
      </div>

      {!couple ? (
        <div className="p-5 bg-white rounded-3xl border border-rose-200 shadow-md space-y-3 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
            <Heart className="w-6 h-6 fill-rose-500" />
          </div>
          <h3 className="text-base font-extrabold text-slate-800">Partnerinle Eşleş</h3>
          <p className="text-xs text-slate-500">
            Partnerinin kodunu gir (Örn: <strong>LOVE24</strong>) veya yeni bir kod oluştur.
          </p>

          <div className="space-y-2 pt-2">
            <input
              type="text"
              value={partnerCodeInput}
              onChange={e => setPartnerCodeInput(e.target.value.toUpperCase())}
              placeholder="Örn: LOVE24"
              className="w-full p-3 rounded-2xl bg-rose-50/50 border border-rose-200 text-center font-black uppercase text-sm tracking-wider focus:outline-none focus:bg-white"
            />
            <button
              onClick={handlePair}
              disabled={loading || !partnerCodeInput.trim()}
              className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md active:scale-[0.98] transition-all"
            >
              {loading ? 'Eşleşiliyor...' : 'Partneri Eşle & Çift Modunu Aç'}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Couple Stats & Counter */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-white rounded-3xl border border-rose-100 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
              </div>
              <div>
                <div className="text-lg font-black text-slate-900 leading-tight">
                  {daysTogether}. Gün
                </div>
                <div className="text-[10px] text-slate-400 font-semibold">Birlikte Geçen Zaman</div>
              </div>
            </div>

            <div className="p-4 bg-white rounded-3xl border border-rose-100 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold">
                <Calendar className="w-5 h-5 text-pink-500" />
              </div>
              <div>
                <div className="text-lg font-black text-slate-900 leading-tight">
                  {couple.specialDates?.length || 1} Özel Gün
                </div>
                <div className="text-[10px] text-slate-400 font-semibold">Yıldönümü & Kutlama</div>
              </div>
            </div>
          </div>

          {/* Special Day Filter / Announcement */}
          <div className="p-4 rounded-3xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 flex items-center justify-between">
            <div>
              <div className="text-xs font-black text-rose-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                <span>Özel Gün & Romantizm Filtresi</span>
              </div>
              <div className="text-[10px] text-rose-700 mt-0.5">
                Cooldown kuralları gevşetilir, romantik mekanlar öne çıkar.
              </div>
            </div>
            <button
              onClick={() => setSpecialDayFilter(!specialDayFilter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                specialDayFilter
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              {specialDayFilter ? 'Aktif 🌹' : 'Aç'}
            </button>
          </div>

          {/* Decision Balance & Manual Override Toggles */}
          <div className="p-4 bg-white rounded-3xl border border-rose-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-rose-600" />
                <span>Karar Dengesi & Seçim Önceliği</span>
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
              <button
                onClick={() => setOverrideMode('none')}
                className={`py-2 px-1 rounded-xl text-center transition-all ${
                  overrideMode === 'none'
                    ? 'bg-rose-100 text-rose-900 border border-rose-300'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                ⚖️ Ortak Denge
              </button>
              <button
                onClick={() => setOverrideMode('partner')}
                className={`py-2 px-1 rounded-xl text-center transition-all ${
                  overrideMode === 'partner'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                💖 Bu Sefer Sen Seç
              </button>
              <button
                onClick={() => setOverrideMode('self')}
                className={`py-2 px-1 rounded-xl text-center transition-all ${
                  overrideMode === 'self'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                🎯 Ben Seçeyim
              </button>
            </div>
          </div>

          {/* Single Clear Recommendation for Couple */}
          {activeDecision && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-rose-600" />
                  <span>İkiniz İçin Tek Net Öneri</span>
                </h3>
              </div>
              <VenueCard recommendation={activeDecision} isPrimary={true} />
            </div>
          )}

          {/* Surprise Mode Section */}
          <div className="p-5 bg-white rounded-3xl border border-rose-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Sürpriz Modu
                  </h3>
                  <p className="text-[10px] text-slate-400">Gizli plan & SurpriseAffinity kanalı</p>
                </div>
              </div>

              <button
                onClick={() => setShowSurpriseModal(true)}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm"
              >
                + Sürpriz Planla
              </button>
            </div>

            {/* Active Surprise Cards */}
            {couple.activeSurprises && couple.activeSurprises.length > 0 && (
              <div className="space-y-2 pt-1">
                {couple.activeSurprises.map(s => {
                  const userIsPlanner = isPlanner(s);
                  return (
                    <div
                      key={s.id}
                      className="p-3.5 rounded-2xl bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-rose-950 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-rose-600" />
                          <span>{s.targetDateTime} Sürprizi</span>
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-200 text-rose-800">
                          {s.status === 'completed' ? 'Gerçekleşti' : 'Hazır'}
                        </span>
                      </div>

                      {userIsPlanner ? (
                        <div className="text-xs text-slate-700">
                          <strong>Planlanan Mekan:</strong> {s.venue.title} ({s.venue.district})
                          <div className="text-[11px] text-slate-500 italic mt-0.5">
                            Partnerine gönderilen ipucu: "{s.receiverTeaser}"
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-rose-900 font-semibold bg-white/80 p-2.5 rounded-xl border border-rose-100">
                          🎉 {s.receiverTeaser}
                        </div>
                      )}

                      {/* Feedback trigger button for surprise */}
                      {s.status !== 'completed' && (
                        <button
                          onClick={() => setFeedbackSurprise(s)}
                          className="w-full py-1.5 text-center text-[11px] font-bold text-rose-600 bg-white rounded-xl border border-rose-200"
                        >
                          Sürpriz Tamamlandı: Değerlendir ✨
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Shared Wishlist (Ortak Denenecekler) */}
          <div className="p-5 bg-white rounded-3xl border border-rose-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Bookmark className="w-4 h-4 text-rose-600" />
                <span>Ortak Denenecekler ({couple.sharedWishlist?.length || 0})</span>
              </h3>
              <button
                onClick={() => setShowWishlistModal(true)}
                className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Mekan Ekle</span>
              </button>
            </div>

            <div className="space-y-2">
              {couple.sharedWishlist && couple.sharedWishlist.length > 0 ? (
                couple.sharedWishlist.map(w => (
                  <div
                    key={w.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-extrabold text-slate-800">{w.title}</div>
                      <div className="text-[10px] text-slate-400">
                        {w.addedByName} tarafından eklendi
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      İstek Listesinde
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 text-center py-2">
                  Henüz ortak istek listenizde mekan yok.
                </div>
              )}
            </div>
          </div>

          {/* Routine Breaker Alert */}
          {couple.routineWarnings && couple.routineWarnings.length > 0 && (
            <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1.5 shadow-sm">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase tracking-wider">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Rutin Kırıcı Uyarısı 💡</span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed font-medium">
                {couple.routineWarnings[0]}
              </p>
            </div>
          )}

          {/* Shared Memories Timeline */}
          <div className="p-5 bg-white rounded-3xl border border-rose-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-rose-600" />
                <span>Ortak Anılarımız ({couple.sharedMemories?.length || 0})</span>
              </h3>
              <button
                onClick={() => setShowMemoryModal(true)}
                className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Anı Ekle</span>
              </button>
            </div>

            <div className="space-y-3">
              {couple.sharedMemories?.map(m => (
                <div
                  key={m.id}
                  className="p-3.5 rounded-2xl bg-rose-50/40 border border-rose-100 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-slate-800">{m.title}</h4>
                    <span className="text-[10px] text-rose-500 font-semibold">{m.date}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-rose-400" />
                    <span>{m.venueName}</span>
                  </div>
                  {m.note && (
                    <p className="text-xs text-slate-600 italic pt-1 border-t border-rose-100/60 mt-1">
                      "{m.note}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Plan Surprise Modal */}
      {showSurpriseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-3 shadow-2xl border border-pink-200">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-rose-600" />
              <span>Partnerine Gizli Sürpriz Planla</span>
            </h3>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Buluşma Zamanı</label>
              <input
                type="text"
                value={surpriseTime}
                onChange={e => setSurpriseTime(e.target.value)}
                placeholder="Örn: Cuma 19:30 veya Pazar 14:00"
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Sürpriz Tarzı</label>
              <select
                value={surpriseStyle}
                onChange={e => setSurpriseStyle(e.target.value as any)}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none"
              >
                <option value="romantic">🌹 Romantik & Loş Atmosfer</option>
                <option value="active_adventurous">🚀 Yaratıcı / Macera & Aktivite</option>
                <option value="cozy_dinner">🍷 Samimi Akşam Yemeği</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowSurpriseModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs"
              >
                İptal
              </button>
              <button
                onClick={handleCreateSurprise}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md"
              >
                Sürprizi Oluştur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Surprise Feedback Modal */}
      {feedbackSurprise && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-center">
            <h3 className="text-sm font-black text-slate-900">Sürpriz Deneyimi Nasıldı?</h3>
            <p className="text-xs text-slate-500">
              Bu geri bildirim, sürpriz tercihlerini normal tercihlerinden ayrı olan <strong>SurpriseAffinity</strong> modelinde öğrenir.
            </p>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleSurpriseFeedback('liked')}
                className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-xs flex flex-col items-center gap-1"
              >
                <ThumbsUp className="w-5 h-5 text-emerald-600" />
                <span>Harikaydı</span>
              </button>
              <button
                onClick={() => handleSurpriseFeedback('neutral')}
                className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 font-bold text-xs flex flex-col items-center gap-1"
              >
                <Meh className="w-5 h-5 text-amber-600" />
                <span>Farketmez</span>
              </button>
              <button
                onClick={() => handleSurpriseFeedback('disliked')}
                className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 font-bold text-xs flex flex-col items-center gap-1"
              >
                <ThumbsDown className="w-5 h-5 text-rose-600" />
                <span>Pek Değil</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Wishlist Modal */}
      {showWishlistModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-3 shadow-2xl border border-rose-100">
            <h3 className="text-sm font-extrabold text-slate-900">Ortak İstek Listesine Ekle</h3>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Mekan / Aktivite Adı</label>
              <input
                type="text"
                value={wishlistTitle}
                onChange={e => setWishlistTitle(e.target.value)}
                placeholder="Örn: Sanat Atölyesi veya Caz Bar"
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowWishlistModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs"
              >
                İptal
              </button>
              <button
                onClick={handleAddWishlist}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md"
              >
                Listeye Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Memory Modal */}
      {showMemoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-3 shadow-2xl border border-rose-100">
            <h3 className="text-sm font-extrabold text-slate-900">Yeni Bir Anı Kaydet</h3>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Başlık</label>
              <input
                type="text"
                value={memoryTitle}
                onChange={e => setMemoryTitle(e.target.value)}
                placeholder="Örn: İlk Pizza Akşamımız"
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Mekan / Yer</label>
              <input
                type="text"
                value={memoryVenue}
                onChange={e => setMemoryVenue(e.target.value)}
                placeholder="Örn: Trattoria Bella Napoli"
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Not / Hatıra</label>
              <textarea
                value={memoryNote}
                onChange={e => setMemoryNote(e.target.value)}
                placeholder="Bu buluşmayla ilgili unutmak istemediğiniz bir detay..."
                rows={2}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowMemoryModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs"
              >
                İptal
              </button>
              <button
                onClick={handleAddMemory}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
