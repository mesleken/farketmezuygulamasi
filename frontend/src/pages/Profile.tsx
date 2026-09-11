import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import {
  User,
  Sparkles,
  Zap,
  Coffee,
  Heart,
  ShieldCheck,
  RotateCcw,
  Clock,
  Sliders,
  CheckCircle2,
  Compass,
  Wallet,
  Flame,
  Layers
} from 'lucide-react';
import { updateUserCooldowns } from '../services/api.js';

interface ProfileProps {
  onRetakeQuiz: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ onRetakeQuiz }) => {
  const { currentUser, refreshUsers } = useAuth();
  const [editingCooldowns, setEditingCooldowns] = useState(false);
  const [cooldownOverrides, setCooldownOverrides] = useState<Record<string, number>>(
    currentUser?.cooldownOverrides || {}
  );
  const [saving, setSaving] = useState(false);

  if (!currentUser) return null;

  const { corePersonality, preferenceWeights } = currentUser;

  const handleSaveCooldowns = async () => {
    try {
      setSaving(true);
      await updateUserCooldowns(currentUser.id, cooldownOverrides);
      await refreshUsers();
      setEditingCooldowns(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const categoryLabels: Record<string, string> = {
    burger: '🍔 Burger & Sokak Lezzeti',
    italyan: '🍕 İtalyan & Pizza',
    kebap: '🥩 Geleneksel Kebap',
    uzakdogu: '🍜 Uzak Doğu & Ramen',
    ev_yemekleri: '🍲 Ev Yemekleri',
    kahve_tatli: '☕ Kahve & Tatlı',
    vejetaryen: '🥗 Vegan & Kase',
    eglence_oyun: '🎳 Oyun & Bowling',
    kultur_sanat: '🎨 Seramik & Sanat',
    spor_outdoor: '🚲 Spor & Açık Hava',
    sinema_tiyatro: '🎭 Tiyatro & Stand-up',
    gece_hayati: '🎷 Canlı Caz & Bar'
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-5">
      {/* Profile Card Banner */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
        <img
          src={currentUser.avatar}
          alt={currentUser.name}
          className="w-16 h-16 rounded-3xl object-cover ring-2 ring-emerald-500/20 shadow-md"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-900 truncate">{currentUser.name}</h2>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              {currentUser.age || 25} Yaş
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentUser.location.district}, {currentUser.location.city}
          </p>
          <div className="text-[10px] text-slate-400 mt-1">
            İki Katmanlı Profil Modeli Aktif
          </div>
        </div>
      </div>

      {/* Core Personality Vector Card */}
      <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-emerald-600" />
            <span>Çekirdek Kişilik Eksenleri</span>
          </h3>
          <button
            onClick={onRetakeQuiz}
            className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Anketi Yenile</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[10px] text-slate-400 font-semibold">Keşif Eğilimi</div>
            <div className="font-bold text-slate-800 mt-0.5">
              {corePersonality?.explorationTendency === 'novelty_seeker' ? '🚀 Yenilikçi/Maceracı' : '🏛️ Bildiğim Yerler'}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[10px] text-slate-400 font-semibold">Spontanlık</div>
            <div className="font-bold text-slate-800 mt-0.5">
              {corePersonality?.spontaneity === 'spontaneous' ? '⚡ Anlık & Spontan' : '📋 Planlı & Organize'}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[10px] text-slate-400 font-semibold">Sosyallik / Enerji</div>
            <div className="font-bold text-slate-800 mt-0.5">
              {corePersonality?.socialEnergy === 'energetic_social' ? '🎉 Sosyal & Hareketli' : '🌿 Sakin & Dingin'}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[10px] text-slate-400 font-semibold">Bütçe Esnekliği</div>
            <div className="font-bold text-slate-800 mt-0.5">
              {corePersonality?.budgetFlexibility === 'flexible' ? '💳 Genelde Esnek' : '🏷️ Kısıtlı / Hesaplı'}
            </div>
          </div>
        </div>
      </div>

      {/* Implicit Learned Taste Matrix (Dynamic weights) */}
      <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Zımni Öğrenilen Tercih Ağırlıkları</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Kabul/red geri bildirimlerinden zamanla çıkarılan kalıcı zevkler
            </p>
          </div>
        </div>

        <div className="space-y-2.5 pt-1">
          {Object.entries(preferenceWeights || {}).map(([cat, weight]) => {
            const percentage = Math.min(100, Math.round((weight / 1.5) * 100));
            const label = categoryLabels[cat] || cat;

            return (
              <div key={cat} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700">{label}</span>
                  <span className="font-bold text-emerald-600">{weight}x katsayı</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cooldown Settings Editor */}
      <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-700" />
              <span>Kategori Soğuma Süresi Ayarları</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Aynı türün kaç gün sonra tekrar önerileceğini özelleştir
            </p>
          </div>
          <button
            onClick={() => setEditingCooldowns(!editingCooldowns)}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
          >
            {editingCooldowns ? 'Vazgeç' : 'Düzenle'}
          </button>
        </div>

        <div className="space-y-2 pt-1 text-xs">
          {[
            { id: 'burger', label: '🍔 Burger & Sokak Lezzeti', defaultDays: 3 },
            { id: 'italyan', label: '🍕 İtalyan & Pizza', defaultDays: 4 },
            { id: 'kebap', label: '🥩 Kebap & Ocakbaşı', defaultDays: 4 },
            { id: 'uzakdogu', label: '🍜 Uzak Doğu & Ramen', defaultDays: 5 },
            { id: 'kahve_tatli', label: '☕ Kahve & Tatlı', defaultDays: 1 },
            { id: 'eglence_oyun', label: '🎳 Kaçış & Bowling', defaultDays: 7 }
          ].map(c => {
            const currentVal = cooldownOverrides[c.id] ?? c.defaultDays;

            return (
              <div key={c.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-700">{c.label}</span>
                {editingCooldowns ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={currentVal}
                      onChange={e =>
                        setCooldownOverrides({
                          ...cooldownOverrides,
                          [c.id]: parseInt(e.target.value) || c.defaultDays
                        })
                      }
                      className="w-12 p-1 text-center bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    />
                    <span className="text-[11px] text-slate-400">gün</span>
                  </div>
                ) : (
                  <span className="font-bold text-slate-800">{currentVal} gün soğuma</span>
                )}
              </div>
            );
          })}
        </div>

        {editingCooldowns && (
          <button
            onClick={handleSaveCooldowns}
            disabled={saving}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
          >
            {saving ? 'Kaydediliyor...' : 'Soğuma Ayarlarını Kaydet'}
          </button>
        )}
      </div>
    </div>
  );
};
