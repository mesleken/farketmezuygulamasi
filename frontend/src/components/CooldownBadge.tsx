import React from 'react';
import { Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

interface CooldownBadgeProps {
  category: string;
  daysRemaining: number;
  isAvailable: boolean;
}

const categoryNamesTr: Record<string, string> = {
  burger: 'Burger & Sokak Lezzeti',
  italyan: 'İtalyan & Pizza',
  kebap: 'Kebap & Ocakbaşı',
  uzakdogu: 'Uzak Doğu & Sushi',
  ev_yemekleri: 'Ev Yemekleri',
  kahve_tatli: 'Kahve & Tatlı',
  sokak_lezzetleri: 'Sokak Lezzetleri',
  vejetaryen: 'Vegan / Vejetaryen',
  balik: 'Balık & Ege Mutfağı',
  eglence_oyun: 'Kaçış & Arcade Oyunları',
  sinema_tiyatro: 'Tiyatro & Sinema',
  kultur_sanat: 'Seramik & Sanat Atölyesi',
  spor_outdoor: 'Spor & Açık Hava',
  kafe_sohbet: 'Kutu Oyunları & Kafe',
  gece_hayati: 'Canlı Müzik & Kokteyl'
};

export const CooldownBadge: React.FC<CooldownBadgeProps> = ({
  category,
  daysRemaining,
  isAvailable
}) => {
  const label = categoryNamesTr[category] || category;

  if (isAvailable || daysRemaining <= 0) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>{label}: Soğuma süresi uygun (Taze)</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
      <span>
        {label}: <strong className="font-extrabold">{daysRemaining} gün</strong> soğuma süresi kaldı
      </span>
    </div>
  );
};
