import React from 'react';
import { ItineraryPlan } from '../types/index.js';
import {
  MapPin,
  Clock,
  Navigation,
  Utensils,
  Coffee,
  Sparkles,
  DollarSign,
  ArrowDown
} from 'lucide-react';

interface ItineraryCardProps {
  itinerary: ItineraryPlan;
  onSelectStop?: (venueId: string) => void;
}

export const ItineraryCard: React.FC<ItineraryCardProps> = ({ itinerary }) => {
  return (
    <div className="space-y-4">
      {/* Itinerary Header */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-800 text-white shadow-xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-extrabold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{itinerary.theme === 'date_night' ? 'Romantik Rota' : 'Şehir Akşamı Rotası'}</span>
          </span>
          <div className="flex items-center gap-3 text-xs text-slate-300 font-semibold">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              ~{itinerary.totalEstimatedDurationHours} saat
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              ~₺{itinerary.totalEstimatedBudget}
            </span>
          </div>
        </div>

        <h3 className="text-lg font-black">{itinerary.title}</h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          {itinerary.summaryExplanation}
        </p>
      </div>

      {/* Stops Timeline */}
      <div className="space-y-3 relative before:absolute before:left-6 before:top-6 before:bottom-6 before:w-0.5 before:bg-indigo-100">
        {itinerary.stops.map((stop, idx) => {
          const isFirst = idx === 0;
          return (
            <div key={stop.step} className="relative flex items-start gap-3.5">
              {/* Timeline Indicator */}
              <div className="relative z-10 w-8 h-8 rounded-full bg-white border-2 border-indigo-600 text-indigo-600 flex items-center justify-center text-xs font-black shadow-sm shrink-0 mt-2">
                {stop.step}
              </div>

              {/* Stop Card */}
              <div className="flex-1 bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-wide">
                    {stop.phaseTitleTr}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {'₺'.repeat(stop.venue.priceLevel)} • ★ {stop.venue.rating}
                  </span>
                </div>

                <div className="flex gap-3 items-center">
                  <img
                    src={stop.venue.imageUrl}
                    alt={stop.venue.title}
                    className="w-14 h-14 rounded-xl object-cover shrink-0 shadow-sm"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {stop.venue.title}
                    </h4>
                    <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {stop.venue.district} • {stop.venue.categoryNameTr}
                    </p>
                  </div>
                </div>

                {/* Transition / Travel Tip */}
                <div className="text-[11px] bg-indigo-50/70 text-indigo-900 p-2 rounded-xl flex items-start gap-1.5 leading-snug">
                  <Navigation className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                  <span>{stop.transitionTip}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
