import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.js';
import {
  Sparkles,
  Utensils,
  Gamepad2,
  Compass,
  Flame,
  ThumbsUp,
  XCircle,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  CloudRain,
  Sun,
  Footprints,
  Car,
  Dices,
  Layers,
  Zap,
  MapPin,
  X
} from 'lucide-react';
import {
  getSingleRecommendation,
  rejectRecommendation,
  createActivityLog,
  fetchItinerary
} from '../services/api.js';
import {
  ScoredRecommendation,
  ItemType,
  RejectReasonTag,
  ItineraryPlan,
  User
} from '../types/index.js';
import { VenueCard } from '../components/VenueCard.js';
import { DecisionWheel } from '../components/DecisionWheel.js';
import { FeedbackModal } from '../components/FeedbackModal.js';
import { RejectReasonModal } from '../components/RejectReasonModal.js';
import { CircuitBreakerModal } from '../components/CircuitBreakerModal.js';
import { QuickSwipeModal } from '../components/QuickSwipeModal.js';
import { ItineraryCard } from '../components/ItineraryCard.js';

export const Home: React.FC = () => {
  const { currentUser, setCurrentUser } = useAuth();

  const [selectedType, setSelectedType] = useState<ItemType | 'all'>('all');
  const [currentRec, setCurrentRec] = useState<ScoredRecommendation | null>(null);
  const [rejectStreak, setRejectStreak] = useState(0);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Request sequencing guard against race conditions
  const activeRequestIdRef = useRef(0);

  // Environmental & Mode Settings
  const [viewMode, setViewMode] = useState<'single' | 'itinerary'>('single');
  const [weatherCondition, setWeatherCondition] = useState<'sunny' | 'rainy'>('sunny');
  const [transportMode, setTransportMode] = useState<'walking' | 'driving'>('walking');
  const [exploreMode, setExploreMode] = useState(false);
  const [itinerary, setItinerary] = useState<ItineraryPlan | null>(null);

  // Modals
  const [showWheel, setShowWheel] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showQuickSwipe, setShowQuickSwipe] = useState(false);
  const [circuitBreakerQuestion, setCircuitBreakerQuestion] = useState<{
    id: string;
    question: string;
    options: { id: string; label: string; filter: string }[];
  } | null>(null);
  const [feedbackLog, setFeedbackLog] = useState<{ id: string; title: string; category: string } | null>(null);

  const loadSingleRecommendation = async (broadFilter?: string, forcedExplore?: boolean) => {
    if (!currentUser) return;
    const reqId = ++activeRequestIdRef.current;
    try {
      setLoading(true);
      setApiError(null);
      const isExplore = forcedExplore !== undefined ? forcedExplore : exploreMode;
      const res = await getSingleRecommendation({
        userId: currentUser.id,
        type: selectedType,
        streak: rejectStreak,
        broadFilter,
        exploreMode: isExplore,
        weatherCondition,
        temperature: weatherCondition === 'rainy' ? 12 : 24,
        transportMode,
        userLat: currentUser.location?.lat || 40.9875,
        userLng: currentUser.location?.lng || 29.0289
      });

      // Ignore if a newer request was dispatched
      if (reqId !== activeRequestIdRef.current) return;

      if (res.triggerCircuitBreaker && res.circuitBreakerQuestion) {
        setCircuitBreakerQuestion(res.circuitBreakerQuestion);
      } else {
        setCurrentRec(res.recommendation);
      }
    } catch (e: any) {
      if (reqId === activeRequestIdRef.current) {
        setApiError(e.message || 'Öneri yüklenirken bir bağlantı hatası oluştu');
      }
    } finally {
      if (reqId === activeRequestIdRef.current) {
        setLoading(false);
      }
    }
  };

  const loadItineraryPlan = async () => {
    if (!currentUser) return;
    const reqId = ++activeRequestIdRef.current;
    try {
      setLoading(true);
      setApiError(null);
      const res = await fetchItinerary({
        userId: currentUser.id,
        theme: 'chill_evening',
        userLocation: {
          lat: currentUser.location?.lat || 40.9875,
          lng: currentUser.location?.lng || 29.0289
        },
        weather: {
          condition: weatherCondition,
          temperature: weatherCondition === 'rainy' ? 12 : 24
        }
      });

      if (reqId !== activeRequestIdRef.current) return;
      setItinerary(res);
    } catch (e: any) {
      if (reqId === activeRequestIdRef.current) {
        setApiError(e.message || 'Rota planı oluşturulurken bir hata oluştu');
      }
    } finally {
      if (reqId === activeRequestIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    setRejectStreak(0);
    if (viewMode === 'single') {
      loadSingleRecommendation();
    } else {
      loadItineraryPlan();
    }
  }, [currentUser, selectedType, weatherCondition, transportMode, exploreMode, viewMode]);

  const handleAccept = async (rec: ScoredRecommendation) => {
    if (!currentUser) return;
    try {
      const created = await createActivityLog({
        userId: currentUser.id,
        venueId: rec.venue.id,
        title: rec.venue.title,
        category: rec.venue.category,
        type: rec.venue.type,
        location: rec.venue.district,
        priceLevel: rec.venue.priceLevel,
        cooldownDays: rec.venue.defaultCooldownDays
      });

      setFeedbackLog({
        id: created.id,
        title: created.title,
        category: created.category
      });

      setRejectStreak(0);
      loadSingleRecommendation();
    } catch (e) {
      console.error('Error accepting:', e);
    }
  };

  const handleSelectRejectReason = async (reasonTag: RejectReasonTag) => {
    if (!currentUser || !currentRec) return;
    try {
      setLoading(true);
      setShowRejectModal(false);

      const nextRes = await rejectRecommendation({
        userId: currentUser.id,
        venueId: currentRec.venue.id,
        reasonTag,
        streak: rejectStreak
      });

      if (nextRes.triggerCircuitBreaker && nextRes.circuitBreakerQuestion) {
        setCircuitBreakerQuestion(nextRes.circuitBreakerQuestion);
      } else {
        setCurrentRec(nextRes.recommendation);
        setRejectStreak(prev => prev + 1);
      }
    } catch (e) {
      console.error('Reject flow error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerCircuitBreaker = (filter: string) => {
    setCircuitBreakerQuestion(null);
    setRejectStreak(0);
    loadSingleRecommendation(filter);
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-4">
      {/* Visual Error Banner */}
      {apiError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{apiError}</span>
          </div>
          <button
            onClick={() => setApiError(null)}
            className="p-1 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Hero Welcome Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 p-5 text-white shadow-xl shadow-emerald-900/20">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tek Net Karar Asistanı</span>
            </div>

            <button
              onClick={() => setShowQuickSwipe(true)}
              className="px-2.5 py-1 rounded-full bg-rose-500/80 hover:bg-rose-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm transition-all active:scale-95"
            >
              <Zap className="w-3 h-3 fill-white" />
              <span>Zevkini Eğit</span>
            </button>
          </div>

          <h2 className="text-xl font-extrabold tracking-tight leading-tight">
            Merhaba, {currentUser?.name || 'Gezgin'}! 👋
          </h2>
          <p className="text-xs text-emerald-100/90 leading-relaxed">
            Karar yorgunluğu yok. Konumun, hava durumu ve zevk ikizlerinin deneyimleriyle o anki <strong>en ideal seçim</strong> karşında.
          </p>

          {/* Magic Action Button */}
          {viewMode === 'single' && (
            <div className="pt-2">
              <button
                onClick={() => {
                  if (currentRec) setShowWheel(true);
                }}
                disabled={loading || !currentRec}
                className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-emerald-50 text-slate-900 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-[0.98] transition-all group"
              >
                <Flame className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform" />
                <span>Bana Farketmez! (Sihirli Seçim)</span>
                <Sparkles className="w-4 h-4 text-emerald-600" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Live Context & Environment Bar */}
      <div className="p-2.5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between gap-1 text-xs">
        {/* Weather Toggle */}
        <button
          onClick={() => setWeatherCondition(prev => (prev === 'sunny' ? 'rainy' : 'sunny'))}
          className={`flex-1 py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 font-bold transition-all ${
            weatherCondition === 'sunny'
              ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
              : 'bg-blue-50 text-blue-700 border border-blue-200/60'
          }`}
          title="Hava durumunu değiştir ve mekan uyumunu izle"
        >
          {weatherCondition === 'sunny' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>Güneşli 24°C</span>
            </>
          ) : (
            <>
              <CloudRain className="w-3.5 h-3.5 text-blue-500" />
              <span>Yağmurlu 12°C</span>
            </>
          )}
        </button>

        {/* Transport Mode Toggle */}
        <button
          onClick={() => setTransportMode(prev => (prev === 'walking' ? 'driving' : 'walking'))}
          className={`flex-1 py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 font-bold transition-all ${
            transportMode === 'walking'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
              : 'bg-slate-100 text-slate-700 border border-slate-200'
          }`}
          title="Ulaşım türünü değiştir"
        >
          {transportMode === 'walking' ? (
            <>
              <Footprints className="w-3.5 h-3.5 text-emerald-600" />
              <span>Yürüme</span>
            </>
          ) : (
            <>
              <Car className="w-3.5 h-3.5 text-slate-700" />
              <span>Araçla</span>
            </>
          )}
        </button>

        {/* Explore Mode Toggle */}
        <button
          onClick={() => setExploreMode(prev => !prev)}
          className={`py-1.5 px-2.5 rounded-xl flex items-center justify-center gap-1 font-bold transition-all ${
            exploreMode
              ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/30'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
          title="Beni Şaşırt (Keşif Modu)"
        >
          <Dices className="w-3.5 h-3.5" />
          <span>Keşif</span>
        </button>
      </div>

      {/* Mode Switcher Tabs: Tek Karar vs Akşam Rotası */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-slate-200/80 rounded-2xl">
        <button
          onClick={() => setViewMode('single')}
          className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            viewMode === 'single'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Compass className="w-3.5 h-3.5 text-emerald-600" />
          <span>Tek Net Seçim</span>
        </button>
        <button
          onClick={() => setViewMode('itinerary')}
          className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            viewMode === 'itinerary'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-indigo-600" />
          <span>Akşam Rotası (3 Durak)</span>
        </button>
      </div>

      {/* Secondary Type Filter (Only for Single mode) */}
      {viewMode === 'single' && (
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/50 rounded-2xl">
          <button
            onClick={() => setSelectedType('all')}
            className={`py-1.5 text-xs font-bold rounded-xl transition-all ${
              selectedType === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tümü
          </button>
          <button
            onClick={() => setSelectedType('food')}
            className={`py-1.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-all ${
              selectedType === 'food'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Utensils className="w-3 h-3" />
            <span>Ne Yesem?</span>
          </button>
          <button
            onClick={() => setSelectedType('activity')}
            className={`py-1.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-all ${
              selectedType === 'activity'
                ? 'bg-white text-teal-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Gamepad2 className="w-3 h-3" />
            <span>Ne Yapsak?</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {viewMode === 'itinerary' ? (
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3 py-16 text-center bg-white rounded-3xl border border-slate-200">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-slate-500 font-medium">
                Yemekten tatlıya ve gece kapanışına birbirine yakın 3 duraklı rota kurgulanıyor...
              </p>
            </div>
          ) : itinerary ? (
            <ItineraryCard itinerary={itinerary} />
          ) : null}
        </div>
      ) : (
        /* Single Clear Recommendation */
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-emerald-600" />
              <span>Farketmez'in Senin İçin Seçimi</span>
            </h3>
            {rejectStreak > 0 && (
              <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                {rejectStreak}. Deneme
              </span>
            )}
          </div>

          {loading ? (
            <div className="space-y-3 py-16 text-center bg-white rounded-3xl border border-slate-200">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-slate-500 font-medium">
                Kişiliğin, hava durumu, lokasyon ve zevk ikizlerine göre tek karar üretiliyor...
              </p>
            </div>
          ) : !currentRec ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">
                Şu anki kriterlere uygun aday kalmadı.
              </p>
              <p className="text-xs text-slate-500">
                Bugünlük kategori veya mesafe engellerini sıfırlayarak tekrar deneyebilirsin.
              </p>
              <button
                onClick={() => {
                  setRejectStreak(0);
                  loadSingleRecommendation();
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
              >
                Filtreleri Sıfırla
              </button>
            </div>
          ) : (
            <div className="space-y-3 animate-in fade-in duration-200">
              <VenueCard recommendation={currentRec} isPrimary={true} />

              {/* Clear Primary Choice Actions (Accept / Reject) */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => handleAccept(currentRec)}
                  className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>Kabul Et & Git</span>
                </button>

                <button
                  onClick={() => setShowRejectModal(true)}
                  className="py-3.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all border border-slate-200"
                >
                  <XCircle className="w-4 h-4 text-slate-400" />
                  <span>Farklı Bir Şey (Reddet)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Decision Wheel Modal */}
      {showWheel && currentRec && (
        <DecisionWheel
          winner={currentRec}
          onFinished={() => setShowWheel(false)}
        />
      )}

      {/* Low-Friction Reject Reason Modal */}
      {showRejectModal && currentRec && (
        <RejectReasonModal
          venueTitle={currentRec.venue.title}
          onSelectReason={handleSelectRejectReason}
          onClose={() => setShowRejectModal(false)}
          loading={loading}
        />
      )}

      {/* Circuit Breaker Broad Question Modal */}
      {circuitBreakerQuestion && (
        <CircuitBreakerModal
          question={circuitBreakerQuestion.question}
          options={circuitBreakerQuestion.options}
          onSelectOption={handleAnswerCircuitBreaker}
        />
      )}

      {/* Post-Accept Feedback Modal */}
      {feedbackLog && (
        <FeedbackModal
          logId={feedbackLog.id}
          venueTitle={feedbackLog.title}
          category={feedbackLog.category}
          onClose={() => setFeedbackLog(null)}
          onSuccess={() => {
            setFeedbackLog(null);
            loadSingleRecommendation();
          }}
        />
      )}

      {/* Tinder-style Quick Swipe Modal */}
      {currentUser && (
        <QuickSwipeModal
          userId={currentUser.id}
          isOpen={showQuickSwipe}
          onClose={(updatedUser) => {
            setShowQuickSwipe(false);
            if (updatedUser) {
              setCurrentUser(updatedUser);
              loadSingleRecommendation();
            }
          }}
        />
      )}
    </div>
  );
};
