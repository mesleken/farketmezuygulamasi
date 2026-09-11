import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import {
  Clock,
  Sparkles,
  Plus,
  Star,
  ThumbsUp,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Tag
} from 'lucide-react';
import { fetchActivities, createActivityLog } from '../services/api.js';
import { ActivityLog } from '../types/index.js';
import { CooldownBadge } from '../components/CooldownBadge.js';
import { FeedbackModal } from '../components/FeedbackModal.js';

export const ActivityHistory: React.FC = () => {
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [cooldowns, setCooldowns] = useState<{ category: string; daysRemaining: number; lastDate: string }[]>([]);
  const [loading, setLoading] = useState(false);

  // Manual Check-in Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('burger');
  const [newLocation, setNewLocation] = useState('Kadıköy');
  const [newRating, setNewRating] = useState(5);
  const [newNotes, setNewNotes] = useState('');

  // Feedback modal
  const [feedbackLog, setFeedbackLog] = useState<{ id: string; title: string; category: string } | null>(null);

  const loadData = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const res = await fetchActivities(currentUser.id);
      setLogs(res.logs);
      setCooldowns(res.activeCooldowns);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleManualAdd = async () => {
    if (!currentUser || !newTitle.trim()) return;
    try {
      await createActivityLog({
        userId: currentUser.id,
        title: newTitle.trim(),
        category: newCategory,
        location: newLocation,
        rating: newRating,
        feedback: newRating >= 4 ? 'liked' : 'neutral',
        notes: newNotes,
        cooldownDays: 3
      });

      setShowAddModal(false);
      setNewTitle('');
      setNewNotes('');
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const categories = [
    { id: 'burger', label: '🍔 Burger & Sokak Lezzeti' },
    { id: 'italyan', label: '🍕 İtalyan & Pizza' },
    { id: 'kebap', label: '🥩 Kebap & Ocakbaşı' },
    { id: 'uzakdogu', label: '🍜 Uzak Doğu & Ramen' },
    { id: 'ev_yemekleri', label: '🍲 Ev Yemekleri' },
    { id: 'kahve_tatli', label: '☕ Kahve & Tatlı' },
    { id: 'vejetaryen', label: '🥗 Vegan / Sağlıklı' },
    { id: 'eglence_oyun', label: '🎳 Bowling & Oyun' },
    { id: 'sinema_tiyatro', label: '🎭 Tiyatro & Stand-up' },
    { id: 'kultur_sanat', label: '🎨 Sanat & Seramik' },
    { id: 'spor_outdoor', label: '🚲 Bisiklet & Açık Hava' }
  ];

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-5">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-700 via-emerald-800 to-slate-900 p-5 text-white shadow-xl shadow-teal-900/20">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-teal-200 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5" />
              <span>Aktivite Geçmişi & Soğuma Süreleri</span>
            </div>
            <h2 className="text-xl font-black tracking-tight">Geçmiş Deneyimler</h2>
            <p className="text-xs text-teal-100/90">
              Yakın zamanda yaptığın seçimler ve soğuma süreleri takip ediliyor.
            </p>
          </div>
        </div>
      </div>

      {/* Active Cooldowns Section */}
      <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Aktif Soğuma Süreleri (Cooldown)</span>
          </h3>
          <span className="text-[11px] font-bold text-slate-400">{cooldowns.length} kategori</span>
        </div>

        {cooldowns.length === 0 ? (
          <div className="text-xs text-slate-500 py-2 text-center bg-emerald-50 rounded-2xl border border-emerald-100 font-semibold text-emerald-800">
            ✨ Tüm kategoriler taze! Herhangi bir soğuma kısıtlaması yok.
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {cooldowns.map((c, i) => (
              <CooldownBadge
                key={i}
                category={c.category}
                daysRemaining={c.daysRemaining}
                isAvailable={false}
              />
            ))}
          </div>
        )}
      </div>

      {/* Activities Timeline */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Geçmiş Aktiviteler ({logs.length})</span>
          </h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manuel Ekle</span>
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Yükleniyor...</div>
        ) : logs.length === 0 ? (
          <div className="p-6 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-500">
            Henüz kaydedilmiş bir aktiviten yok.
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map(log => {
              const formattedDate = new Date(log.date).toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={log.id}
                  className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 leading-tight">
                        {log.title}
                      </h4>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {log.location}
                        </span>
                        <span>•</span>
                        <span>{formattedDate}</span>
                      </div>
                    </div>

                    {/* Star Rating */}
                    {log.rating && (
                      <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-bold">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{log.rating}</span>
                      </div>
                    )}
                  </div>

                  {log.notes && (
                    <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-xl border border-slate-100">
                      "{log.notes}"
                    </p>
                  )}

                  <div className="pt-1 flex items-center justify-between border-t border-slate-100 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-500">Kategori: {log.category}</span>
                      {log.isCouple && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
                          ❤️ Çift Modu
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() =>
                        setFeedbackLog({
                          id: log.id,
                          title: log.title,
                          category: log.category
                        })
                      }
                      className="font-bold text-emerald-600 hover:text-emerald-700"
                    >
                      Puanı Güncelle
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      {feedbackLog && (
        <FeedbackModal
          logId={feedbackLog.id}
          venueTitle={feedbackLog.title}
          category={feedbackLog.category}
          onClose={() => setFeedbackLog(null)}
          onSuccess={() => {
            setFeedbackLog(null);
            loadData();
          }}
        />
      )}

      {/* Manual Checkin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-3 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-extrabold text-slate-900">Geçmiş Aktiviteyi Kaydet</h3>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Mekan / Aktivite Adı</label>
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Örn: Burger Lab veya Kadıköy Sinema"
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Kategori</label>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Konum / İlçe</label>
              <input
                type="text"
                value={newLocation}
                onChange={e => setNewLocation(e.target.value)}
                placeholder="Örn: Kadıköy"
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Puanın</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setNewRating(s)}
                    className="p-1"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        s <= newRating ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Notun (Opsiyonel)</label>
              <textarea
                value={newNotes}
                onChange={e => setNewNotes(e.target.value)}
                placeholder="Örn: Trüflü patatesi çok iyiydi..."
                rows={2}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs"
              >
                İptal
              </button>
              <button
                onClick={handleManualAdd}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
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
