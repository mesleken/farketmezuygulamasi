import React, { useState } from 'react';
import { ScoredRecommendation } from '../types/index.js';
import {
  Star,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Phone,
  Navigation,
  ThumbsUp,
  RefreshCw
} from 'lucide-react';

interface VenueCardProps {
  recommendation: ScoredRecommendation;
  onAccept?: (rec: ScoredRecommendation) => void;
  onReject?: (rec: ScoredRecommendation) => void;
  isPrimary?: boolean;
}

export const VenueCard: React.FC<VenueCardProps> = ({
  recommendation,
  onAccept,
  onReject,
  isPrimary = false
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const { venue, totalScore, breakdown, matchReasons } = recommendation;

  const priceSymbols = '₺'.repeat(venue.priceLevel);

  return (
    <div
      className={`rounded-3xl bg-white overflow-hidden transition-all duration-300 border ${
        isPrimary
          ? 'border-emerald-300 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500/20'
          : 'border-slate-200/80 shadow-md hover:shadow-lg'
      }`}
    >
      {/* Image Banner */}
      <div className="relative h-44 sm:h-48 w-full overflow-hidden group">
        <img
          src={venue.imageUrl}
          alt={venue.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold">
              {venue.categoryNameTr}
            </span>
            <span className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-md text-amber-300 text-xs font-bold">
              {priceSymbols}
            </span>
            {breakdown.distanceKm !== undefined && (
              <span className="px-2 py-1 rounded-full bg-blue-600/80 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1">
                <Navigation className="w-3 h-3" />
                <span>{breakdown.distanceKm <= 1.2 ? `${Math.round(breakdown.distanceKm * 1000)}m` : `${breakdown.distanceKm}km`}</span>
              </span>
            )}
            {breakdown.collaborativeBonus !== undefined && breakdown.collaborativeBonus > 0 && (
              <span className="px-2 py-1 rounded-full bg-purple-600/80 backdrop-blur-md text-white text-[10px] font-bold">
                👥 Zevk İkizi
              </span>
            )}
          </div>

          {/* Compatibility Score */}
          <div className="px-3 py-1 rounded-full bg-emerald-500/90 backdrop-blur-md text-white text-xs font-extrabold flex items-center gap-1 shadow-lg shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
            <span>%{totalScore} Uyum</span>
          </div>
        </div>

        {/* Bottom Banner Title */}
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <h3 className="text-lg sm:text-xl font-extrabold leading-tight tracking-tight drop-shadow-sm">
            {venue.title}
          </h3>
          <div className="flex items-center gap-3 text-xs text-slate-200 mt-1">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              {venue.district}, {venue.city}
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {venue.rating} ({venue.reviewCount})
            </span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-3">
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
          {venue.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {venue.tags.map((tag, idx) => (
            <span
              key={idx}
              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Why this recommendation? (Match reasons) */}
        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-1.5">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span>Neden bu öneri seçildi?</span>
          </div>
          {matchReasons.map((reason, idx) => (
            <div
              key={idx}
              className="text-xs text-slate-700 flex items-start gap-1.5 leading-snug font-medium"
            >
              {reason.includes('⚠️') ? (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <span>{reason.replace('✅ ', '').replace('⚠️ ', '')}</span>
            </div>
          ))}
        </div>

        {/* Score Breakdown toggle */}
        <div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 py-1"
          >
            <span>{showDetails ? 'Detayları Gizle' : 'Puan ve Algoritma Analizi'}</span>
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showDetails && (
            <div className="mt-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs text-slate-600 animate-in fade-in duration-200">
              <div className="flex justify-between items-center">
                <span>Kişilik & Enerji Uyumu:</span>
                <span className="font-bold text-slate-800">%{breakdown.personalityMatch}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Öğrenilen Damak/İlgi Skoru:</span>
                <span className="font-bold text-slate-800">%{breakdown.learnedTasteMatch}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Bütçe Uyumu:</span>
                <span className="font-bold text-slate-800">%{breakdown.budgetMatch}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Ruh Hali / Mod Uyumu:</span>
                <span className="font-bold text-slate-800">%{breakdown.moodMatch}</span>
              </div>
              {breakdown.weatherMatch !== undefined && (
                <div className="flex justify-between items-center">
                  <span>Hava Durumu & Ortam Uyumu:</span>
                  <span className="font-bold text-blue-600">%{breakdown.weatherMatch}</span>
                </div>
              )}
              {breakdown.distanceKm !== undefined && (
                <div className="flex justify-between items-center">
                  <span>Mesafe & Ulaşım Süresi:</span>
                  <span className="font-bold text-slate-800">{breakdown.distanceKm} km (~{breakdown.travelTimeMinutes} dk)</span>
                </div>
              )}
              {breakdown.collaborativeBonus !== undefined && breakdown.collaborativeBonus > 0 && (
                <div className="flex justify-between items-center">
                  <span>Benzer Kullanıcılar (Topluluk):</span>
                  <span className="font-bold text-purple-600">+{breakdown.collaborativeBonus} Puan</span>
                </div>
              )}
              {breakdown.groupMemberScores && (
                <div className="pt-2 border-t border-slate-200 space-y-1">
                  <div className="font-bold text-slate-700 text-[11px]">Grup Üyeleri Memnuniyeti:</div>
                  {breakdown.groupMemberScores.map(m => (
                    <div key={m.userId} className="flex justify-between text-[11px]">
                      <span>{m.userName}:</span>
                      <span className="font-semibold text-emerald-600">%{m.score}</span>
                    </div>
                  ))}
                </div>
              )}

              {venue.openingHours && (
                <div className="pt-2 border-t border-slate-200 flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Çalışma Saatleri: {venue.openingHours}</span>
                </div>
              )}
              {venue.phoneNumber && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{venue.phoneNumber}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center gap-2">
          {onAccept && (
            <button
              onClick={() => onAccept(recommendation)}
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>Kararı Kabul Et & Git</span>
            </button>
          )}

          {onReject && (
            <button
              onClick={() => onReject(recommendation)}
              title="Başka Bir Seçenek Öner"
              className="py-3 px-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1 active:scale-[0.98] transition-all"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Başka Öner</span>
            </button>
          )}

          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.title + ' ' + venue.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Haritada Yol Tarifi Al"
            className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all"
          >
            <Navigation className="w-4 h-4 text-slate-600" />
          </a>
        </div>
      </div>
    </div>
  );
};
