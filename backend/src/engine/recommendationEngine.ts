import { db } from '../db/store.js';
import {
  User,
  VenueCandidate,
  ScoredRecommendation,
  ItemType,
  BudgetLevel,
  RejectReasonTag,
  DailyContext,
  ActivityLog,
  ItineraryPlan,
  ItineraryStop
} from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';
import { LearningEngine } from './learningEngine.js';

export interface RecommendOptions {
  userId: string;
  type?: ItemType | 'all';
  budget?: BudgetLevel;
  preferredDistrict?: string;
  ignoreCooldown?: boolean;
  rejectStreakCount?: number;
  broadFilter?: string;
  exploreMode?: boolean;
  currentTime?: Date;
  userLocation?: { lat: number; lng: number };
  transportMode?: 'walking' | 'transit' | 'driving';
  weather?: {
    condition: 'sunny' | 'rainy' | 'cold' | 'cloudy' | 'snowy';
    temperature?: number;
  };
}

export interface SingleRecommendationResponse {
  recommendation: ScoredRecommendation | null;
  triggerCircuitBreaker: boolean;
  circuitBreakerQuestion?: {
    id: string;
    question: string;
    options: { id: string; label: string; filter: string }[];
  };
  totalCandidatesAvailable: number;
}

export class RecommendationEngine {
  /**
   * Helper: Haversine Distance in Kilometers
   */
  public static calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
  }

  /**
   * Helper: Distance & Travel Time Fit
   */
  public static calculateDistanceFit(
    venue: VenueCandidate,
    userLocation?: { lat: number; lng: number },
    transportMode: 'walking' | 'transit' | 'driving' = 'walking'
  ): { distanceKm?: number; travelTimeMinutes?: number; scoreMultiplier: number; reason?: string } {
    if (!userLocation || !venue.lat || !venue.lng) {
      return { scoreMultiplier: 1.0 };
    }

    const distKm = this.calculateDistanceKm(userLocation.lat, userLocation.lng, venue.lat, venue.lng);

    if (transportMode === 'walking') {
      const travelTimeMinutes = Math.max(1, Math.round((distKm / 4.5) * 60));
      if (distKm <= 1.2) {
        return {
          distanceKm: distKm,
          travelTimeMinutes,
          scoreMultiplier: 1.18,
          reason: `📍 Yürüme mesafesinde (~${travelTimeMinutes} dk / ${Math.round(distKm * 1000)}m)`
        };
      } else if (distKm <= 2.5) {
        return {
          distanceKm: distKm,
          travelTimeMinutes,
          scoreMultiplier: 1.0,
          reason: `📍 Orta mesafe yürüyüş rotası (~${travelTimeMinutes} dk)`
        };
      } else {
        const penalty = Math.max(0.45, 1 - (distKm - 2.5) * 0.15);
        return {
          distanceKm: distKm,
          travelTimeMinutes,
          scoreMultiplier: penalty,
          reason: `⚠️ Yürüyerek biraz mesafeli (${distKm} km)`
        };
      }
    } else if (transportMode === 'driving') {
      const travelTimeMinutes = Math.max(3, Math.round((distKm / 25) * 60 + 5));
      if (distKm <= 8.0) {
        return {
          distanceKm: distKm,
          travelTimeMinutes,
          scoreMultiplier: 1.05,
          reason: `🚗 Araçla hızlı ulaşım (~${travelTimeMinutes} dk / ${distKm} km)`
        };
      } else {
        const penalty = Math.max(0.6, 1 - (distKm - 8.0) * 0.05);
        return {
          distanceKm: distKm,
          travelTimeMinutes,
          scoreMultiplier: penalty,
          reason: `🚗 Araçla biraz mesafeli (~${travelTimeMinutes} dk)`
        };
      }
    } else {
      const travelTimeMinutes = Math.max(5, Math.round((distKm / 18) * 60 + 8));
      return {
        distanceKm: distKm,
        travelTimeMinutes,
        scoreMultiplier: distKm <= 5 ? 1.05 : 0.85,
        reason: `🚇 Toplu taşımayla pratik erişim (~${travelTimeMinutes} dk)`
      };
    }
  }

  /**
   * Helper: Real-time Weather Fit & Adaptation
   */
  public static calculateWeatherFit(
    venue: VenueCandidate,
    weather?: { condition: 'sunny' | 'rainy' | 'cold' | 'cloudy' | 'snowy'; temperature?: number }
  ): { weatherScore: number; scoreMultiplier: number; reason?: string } {
    if (!weather) {
      return { weatherScore: 100, scoreMultiplier: 1.0 };
    }

    const { condition, temperature = 20 } = weather;

    if (condition === 'rainy' || condition === 'snowy' || temperature <= 12) {
      if (venue.isIndoor && venue.isCozy) {
        return {
          weatherScore: 100,
          scoreMultiplier: 1.25,
          reason: '☔ Yağmurlu/soğuk havaya karşı sıcacık, korunaklı ve samimi iç mekan'
        };
      } else if (venue.isIndoor) {
        return {
          weatherScore: 90,
          scoreMultiplier: 1.10,
          reason: '🌧️ Yağıştan korunaklı kapalı iç mekan konforu'
        };
      } else {
        return {
          weatherScore: 25,
          scoreMultiplier: 0.35,
          reason: '⚠️ Yağmurlu ve soğuk havada açık hava mekanı uygun olmayabilir'
        };
      }
    } else if (condition === 'sunny' && temperature >= 18) {
      if (venue.hasTerrace || !venue.isIndoor) {
        return {
          weatherScore: 100,
          scoreMultiplier: 1.20,
          reason: '☀️ Güneşli havanın tadını çıkarabileceğin harika açık alan / teras'
        };
      }
    }

    return { weatherScore: 90, scoreMultiplier: 1.0 };
  }
  /**
   * Helper: Check if venue is open at a given time
   */
  public static isVenueOpenNow(venue: VenueCandidate, date: Date = new Date()): { isOpen: boolean; hoursText: string } {
    const hours = venue.openingHours || '24 Saat Açık';
    if (hours.includes('24 Saat')) {
      return { isOpen: true, hoursText: '24 Saat Açık' };
    }

    const parts = hours.split('-').map(s => s.trim());
    if (parts.length !== 2) {
      return { isOpen: true, hoursText: hours };
    }

    const parseMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    const currentMinutes = date.getHours() * 60 + date.getMinutes();
    const startMinutes = parseMinutes(parts[0]);
    const endMinutes = parseMinutes(parts[1]);

    let isOpen = false;
    if (endMinutes < startMinutes) {
      // Overnight (e.g. 18:00 - 02:00)
      isOpen = currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    } else {
      isOpen = currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    }

    return { isOpen, hoursText: hours };
  }

  /**
   * Helper: Time of Day and Day of Week Bonus/Penalty
   */
  public static getTimeOfDayFactor(venue: VenueCandidate, date: Date = new Date()): { factor: number; bonus: number; reason?: string } {
    const hour = date.getHours();
    const day = date.getDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday
    let bonus = 0;
    let reason: string | undefined;

    // Morning / Early lunch (06:00 - 11:30)
    if (hour >= 6 && hour < 11.5) {
      if (venue.category === 'kahve_tatli' || venue.tags.includes('Kahvaltı') || venue.tags.includes('Kruvasan')) {
        bonus += 18;
        reason = '☀️ Sabah saatlerine uygun taze kahve & kahvaltı atmosferi';
      } else if (venue.category === 'gece_hayati') {
        bonus -= 35;
      }
    }
    // Lunch time (11:30 - 15:00)
    else if (hour >= 11.5 && hour < 15) {
      if (venue.type === 'food' && ['burger', 'kebap', 'ev_yemekleri', 'vejetaryen', 'sokak_lezzetleri'].includes(venue.category)) {
        bonus += 14;
        reason = '🍽️ Öğle arası lezzetli ve pratik yemek molası';
      }
    }
    // Afternoon tea/coffee & casual activities (15:00 - 18:00)
    else if (hour >= 15 && hour < 18) {
      if (['kahve_tatli', 'kultur_sanat', 'kafe_sohbet'].includes(venue.category)) {
        bonus += 15;
        reason = '☕ Öğleden sonra sohbeti ve keyifli mola için ideal';
      }
    }
    // Evening dinner & prime entertainment (18:00 - 22:30)
    else if (hour >= 18 && hour < 22.5) {
      if (['italyan', 'balik', 'kebap', 'uzakdogu', 'sinema_tiyatro', 'eglence_oyun'].includes(venue.category)) {
        bonus += 16;
        reason = '🌆 Akşam yemeği ve akşam programı için mükemmel zamanlama';
      }
    }
    // Late night (22:30 - 05:00)
    else {
      if (['gece_hayati', 'sokak_lezzetleri'].includes(venue.category)) {
        bonus += 18;
        reason = '🌙 Gece saatlerine uygun canlı atmosfer ve geç saat lezzeti';
      } else if (venue.category === 'ev_yemekleri' || venue.category === 'kultur_sanat') {
        bonus -= 30;
      }
    }

    // Weekend vibe boost (Friday evening or Saturday)
    if ((day === 5 && hour >= 17) || day === 6) {
      if (venue.vibe === 'energetic' || venue.vibe === 'trendy' || venue.category === 'gece_hayati') {
        bonus += 8;
        if (!reason) reason = '🎉 Hafta sonunun hareketli ve canlı ritmine uygun';
      }
    } else if (day === 0) {
      // Sunday chill
      if (venue.vibe === 'chill' || venue.vibe === 'cozy' || venue.category === 'kahve_tatli') {
        bonus += 8;
        if (!reason) reason = '🌿 Pazar gününün dinlendirici ve sakin huzuruna uygun';
      }
    }

    return { factor: 1.0, bonus, reason };
  }

  /**
   * Helper: Real Mood & Vibe Match Calculation
   */
  public static calculateMoodMatch(venue: VenueCandidate, user: User, dailyContext: DailyContext): { moodScore: number; reason?: string } {
    const userPreferredVibe = dailyContext.preferredVibe;

    if (userPreferredVibe) {
      if (venue.vibe === userPreferredVibe) {
        return { moodScore: 100, reason: `Bugünkü mod tercihinle (${userPreferredVibe}) %100 örtüşüyor` };
      }
      // Compatible pairs
      const compatiblePairs: Record<string, string[]> = {
        chill: ['cozy'],
        cozy: ['chill', 'romantic'],
        energetic: ['adventurous', 'trendy'],
        adventurous: ['energetic'],
        romantic: ['cozy', 'chill'],
        trendy: ['energetic']
      };

      if (compatiblePairs[userPreferredVibe]?.includes(venue.vibe)) {
        return { moodScore: 85, reason: `Bugünkü mod beklentinle uyumlu atmosfer (${venue.vibe})` };
      }

      return { moodScore: 40, reason: `Bugünkü mod tercihin (${userPreferredVibe}) yerine ${venue.vibe} ortamı sunuyor` };
    }

    // Fallback: derive mood from user's learned vibe weights or social energy
    const learnedVibeWeight = user.vibeWeights?.[venue.vibe] ?? 1.0;
    let baseScore = Math.round(learnedVibeWeight * 80);

    const socialEnergy = user.corePersonality?.socialEnergy;
    if (socialEnergy === 'energetic_social' && (venue.vibe === 'energetic' || venue.vibe === 'trendy')) {
      baseScore += 12;
    } else if (socialEnergy === 'calm_peaceful' && (venue.vibe === 'chill' || venue.vibe === 'cozy')) {
      baseScore += 12;
    }

    const moodScore = Math.min(100, Math.max(35, baseScore));
    return { moodScore };
  }

  /**
   * Helper: Spontaneity Dimension Calculation
   */
  public static calculateSpontaneityFit(venue: VenueCandidate, user: User, logs: ActivityLog[]): { scoreDelta: number; reason?: string } {
    const spontaneity = user.corePersonality?.spontaneity ?? 'spontaneous';
    const hasVisitedVenue = logs.some(l => l.venueId === venue.id);
    const hasVisitedCategory = logs.some(l => l.category === venue.category);

    if (spontaneity === 'spontaneous') {
      if (!hasVisitedVenue && !hasVisitedCategory) {
        return {
          scoreDelta: 15,
          reason: 'Spontane keşif tarzına uygun, daha önce deneyimlemediğin taze bir seçenek'
        };
      }
      if (!hasVisitedVenue) {
        return {
          scoreDelta: 8,
          reason: 'Spontane ruha hitap eden yeni bir mekan keşfi'
        };
      }
      return { scoreDelta: 0 };
    } else {
      // Planner: prefers highly-rated, familiar, guaranteed satisfaction
      const categoryWeight = user.preferenceWeights[venue.category] ?? 1.0;
      if (venue.rating >= 4.8 || categoryWeight > 1.2) {
        return {
          scoreDelta: 12,
          reason: 'Planlı ve garanti deneyim tarzına uygun, yüksek memnuniyetli güvenilir adres'
        };
      }
      return { scoreDelta: 0 };
    }
  }

  /**
   * Helper: Two-Tier Cooldown with Gradual Penalty
   */
  public static calculateTwoTierCooldown(
    venue: VenueCandidate,
    user: User,
    logs: ActivityLog[],
    options: RecommendOptions
  ): {
    isAvailable: boolean;
    daysRemaining: number;
    penaltyMultiplier: number;
    reason?: string;
    lastVisitedDate?: string;
  } {
    const exactLogs = logs.filter(l => l.venueId === venue.id);
    const categoryLogs = logs.filter(l => l.category === venue.category);

    const baseCooldownDays = user.cooldownOverrides?.[venue.category] ?? venue.defaultCooldownDays;

    // Check exact venue first (Tier 1)
    if (exactLogs.length > 0) {
      const mostRecent = exactLogs[0];
      const hoursSince = (Date.now() - new Date(mostRecent.date).getTime()) / (1000 * 60 * 60);
      const daysSince = hoursSince / 24;

      // Rating adjustments: rating 5 reduces cooldown by 25%, rating <= 2 doubles cooldown
      let adjustedCooldown = baseCooldownDays;
      if (mostRecent.rating && mostRecent.rating >= 5) {
        adjustedCooldown = Math.max(1, baseCooldownDays * 0.75);
      } else if (mostRecent.rating && mostRecent.rating <= 2) {
        adjustedCooldown = baseCooldownDays * 2;
      }

      if (daysSince < adjustedCooldown) {
        const daysRemaining = Math.max(1, Math.ceil(adjustedCooldown - daysSince));
        // Gradual decay penalty: closer to visit = higher penalty
        const remainingRatio = daysRemaining / adjustedCooldown;
        const penalty = 0.35 + 0.45 * remainingRatio; // 0.35 to 0.80 penalty
        const penaltyMultiplier = options.ignoreCooldown ? 1.0 : Math.max(0.15, 1 - penalty);

        return {
          isAvailable: false,
          daysRemaining,
          penaltyMultiplier,
          reason: `⚠️ Bu mekana yakın zamanda gittiniz (${daysRemaining} gün soğuma süresi kaldı)`,
          lastVisitedDate: mostRecent.date
        };
      }
    }

    // Check category level (Tier 2 - Softer gradual penalty)
    if (categoryLogs.length > 0) {
      const mostRecent = categoryLogs[0];
      const hoursSince = (Date.now() - new Date(mostRecent.date).getTime()) / (1000 * 60 * 60);
      const daysSince = hoursSince / 24;

      if (daysSince < baseCooldownDays) {
        const daysRemaining = Math.max(1, Math.ceil(baseCooldownDays - daysSince));
        const remainingRatio = daysRemaining / baseCooldownDays;
        // Mild gradual penalty for same category, different venue
        const penalty = 0.15 + 0.25 * remainingRatio; // 0.15 to 0.40 penalty
        const penaltyMultiplier = options.ignoreCooldown ? 1.0 : Math.max(0.35, 1 - penalty);

        return {
          isAvailable: false,
          daysRemaining,
          penaltyMultiplier,
          reason: `ℹ️ Bu kategoriyi (${venue.categoryNameTr}) yakın zamanda denediniz (${daysRemaining} gün kaldı, ama farklı mekan)`,
          lastVisitedDate: mostRecent.date
        };
      }
    }

    return {
      isAvailable: true,
      daysRemaining: 0,
      penaltyMultiplier: 1.0,
      reason: '✅ Soğuma süresi temiz (Tekrara düşmeyen taze öneri)'
    };
  }

  /**
   * Main Recommendation Algorithm
   */
  public static recommendSingle(options: RecommendOptions): SingleRecommendationResponse {
    const user = db.getUser(options.userId);
    if (!user) {
      throw new Error(`User not found: ${options.userId}`);
    }

    const streak = options.rejectStreakCount || 0;
    const allVenues = db.getAllVenues();
    const userLogs = db.getUserLogs(user.id);
    const dailyContext = db.getDailyContext(user.id);
    const currentTime = options.currentTime || new Date();

    // Check Circuit Breaker (streak >= 2) with Context-Aware Questions
    if (streak >= 2 && !options.broadFilter) {
      // Analyze recent rejection feedbacks to ask intelligent adaptive question
      const recentFeedbacks = db.getUserFeedbacks(user.id).slice(0, 5) || [];

      const reasonCounts: Record<string, number> = {};
      for (const fb of recentFeedbacks) {
        if (fb.reasonTag) {
          reasonCounts[fb.reasonTag] = (reasonCounts[fb.reasonTag] || 0) + 1;
        }
      }

      let circuitBreakerQuestion;

      if ((reasonCounts['too_expensive'] || 0) >= 1) {
        circuitBreakerQuestion = {
          id: 'circuit-budget',
          question: 'Bütçe hedefini netleştirelim! Karar vermeni kolaylaştırmak için bugün hangi bütçe aralığı olsun? 💰',
          options: [
            { id: 'budget_1', label: '₺ - Çok Uygun / Öğrenci Dostu', filter: 'budget_1' },
            { id: 'budget_2', label: '₺₺ - Standart / Dengeli', filter: 'budget_2' },
            { id: 'budget_any', label: '₺₺₺+ Farketmez, Harika Olsun', filter: 'budget_any' }
          ]
        };
      } else if ((reasonCounts['too_far'] || 0) >= 1) {
        circuitBreakerQuestion = {
          id: 'circuit-district',
          question: 'Mesafe yormasın! Bugün hangi semt/bölge çevresinde kalmak istersin? 📍',
          options: [
            { id: 'district_kadikoy', label: 'Kadıköy & Moda Çevresi', filter: 'district_kadikoy' },
            { id: 'district_besiktas', label: 'Beşiktaş & Akaretler', filter: 'district_besiktas' },
            { id: 'district_beyoglu', label: 'Beyoğlu & Karaköy', filter: 'district_beyoglu' },
            { id: 'district_any', label: 'Farketmez, Yeter ki Değsin', filter: 'district_any' }
          ]
        };
      } else if ((reasonCounts['already_visited'] || 0) >= 1) {
        circuitBreakerQuestion = {
          id: 'circuit-novelty',
          question: 'Daha önce gitmediğin yepyeni bir deneyim mi arıyorsun? 🗺️',
          options: [
            { id: 'novelty_only', label: '✨ Tamamen Yeni & Keşfedilmemiş Yerler', filter: 'novelty_only' },
            { id: 'top_rated', label: '⭐ Şehrin En Yüksek Puanlı Popüler Favorileri', filter: 'top_rated' },
            { id: 'any', label: 'Farketmez', filter: 'any' }
          ]
        };
      } else {
        circuitBreakerQuestion = {
          id: 'circuit-vibe',
          question: 'Karar yorgunluğunu önleyelim! Bugün canın tam olarak nasıl bir ortam istiyor? 🧘‍♂️',
          options: [
            { id: 'outdoor_energetic', label: '🏃‍♂️ Dışarıda & Yüksek Enerji', filter: 'outdoor_energetic' },
            { id: 'indoor_calm', label: '🛋️ İçeride & Sakin / Huzurlu', filter: 'indoor_calm' },
            { id: 'food_only', label: '🍔 Sadece Lezzetli Bir Yemek', filter: 'food_only' },
            { id: 'activity_only', label: '🎳 Eğlenceli Bir Aktivite / Oyun', filter: 'activity_only' }
          ]
        };
      }

      return {
        recommendation: null,
        triggerCircuitBreaker: true,
        circuitBreakerQuestion,
        totalCandidatesAvailable: 0
      };
    }

    // --- LAYER 1: CANDIDATE GENERATION ---
    const candidates = allVenues.filter(venue => {
      // 1. Filter by Item Type
      if (options.type && options.type !== 'all' && venue.type !== options.type) {
        return false;
      }

      // 2. Broad Filter (from Circuit Breaker)
      if (options.broadFilter === 'food_only' && venue.type !== 'food') return false;
      if (options.broadFilter === 'activity_only' && venue.type !== 'activity') return false;
      if (options.broadFilter === 'outdoor_energetic' && venue.vibe !== 'energetic' && venue.vibe !== 'adventurous') return false;
      if (options.broadFilter === 'indoor_calm' && venue.vibe !== 'chill' && venue.vibe !== 'cozy') return false;
      if (options.broadFilter === 'budget_1' && venue.priceLevel > 1) return false;
      if (options.broadFilter === 'budget_2' && venue.priceLevel > 2) return false;
      if (options.broadFilter === 'district_kadikoy' && venue.district !== 'Kadıköy') return false;
      if (options.broadFilter === 'district_besiktas' && venue.district !== 'Beşiktaş') return false;
      if (options.broadFilter === 'district_beyoglu' && venue.district !== 'Beyoğlu') return false;
      if (options.broadFilter === 'novelty_only') {
        const visited = userLogs.some(l => l.venueId === venue.id || l.category === venue.category);
        if (visited) return false;
      }
      if (options.broadFilter === 'top_rated' && venue.rating < 4.8) return false;

      // 3. Filter by Daily Context Temporary Exclusions
      if (dailyContext.temporaryExcludedCategories?.includes(venue.category)) {
        return false;
      }

      // 4. Session Budget Ceiling (from rejected 'too_expensive')
      if (dailyContext.sessionMaxBudget && venue.priceLevel > dailyContext.sessionMaxBudget) {
        return false;
      }

      // 5. Session Excluded Districts (from rejected 'too_far')
      if (dailyContext.sessionExcludedDistricts && dailyContext.sessionExcludedDistricts.includes(venue.district)) {
        return false;
      }

      // 6. Hard filter: Dietary restrictions
      if (user.preferences.dietaryRestrictions.includes('vegan') && !venue.isVeganFriendly) {
        return false;
      }
      if (user.preferences.dietaryRestrictions.includes('vejetaryen') && !venue.isVegetarianFriendly) {
        return false;
      }
      if (user.preferences.dietaryRestrictions.includes('glutensiz') && !venue.isGlutenFreeFriendly) {
        return false;
      }

      return true;
    });

    // --- LAYER 2 & 3: SCORING & COOLDOWN ---
    const scoredList: ScoredRecommendation[] = candidates.map(venue => {
      return this.scoreVenueForUser(user, venue, userLogs, dailyContext, options, currentTime);
    });

    // Sort descending by totalScore
    scoredList.sort((a, b) => b.totalScore - a.totalScore);

    // --- EXPLORE VS EXPLOIT (Epsilon-Greedy Exploration) ---
    let winner: ScoredRecommendation | null = scoredList[0] || null;

    const shouldExplore = options.exploreMode || (streak === 0 && Math.random() < 0.12 && scoredList.length > 2);
    if (shouldExplore && scoredList.length > 2) {
      const unvisitedCandidates = scoredList.slice(0, 5).filter(c => {
        return !userLogs.some(l => l.venueId === c.venue.id) && c.totalScore >= 55;
      });

      if (unvisitedCandidates.length > 0) {
        const explored = unvisitedCandidates[Math.floor(Math.random() * unvisitedCandidates.length)];
        explored.matchReasons.unshift('🎲 Keşif Modu: Algoritma bugün seni yeni bir tat ve mekan keşfetmeye davet ediyor!');
        winner = explored;
      }
    }

    return {
      recommendation: winner,
      triggerCircuitBreaker: false,
      totalCandidatesAvailable: scoredList.length
    };
  }

  /**
   * Handle Reject with Low-Friction Reason Tag & Session Persistence
   */
  public static handleRejection(
    userId: string,
    venueId: string,
    reasonTag: RejectReasonTag,
    currentStreak: number
  ): SingleRecommendationResponse {
    const venue = db.getVenueById(venueId);
    if (!venue) {
      throw new Error('Venue not found');
    }

    const today = new Date().toISOString().split('T')[0];
    const dailyContext = db.getDailyContext(userId, today);

    // 1. Process Reason Tag persistence
    switch (reasonTag) {
      case 'already_visited':
        // Cooldown & diversity tracking
        db.addActivityLog({
          id: `log-auto-${uuidv4().slice(0, 8)}`,
          userId,
          userName: db.getUser(userId)?.name || 'Kullanıcı',
          venueId: venue.id,
          title: venue.title,
          category: venue.category,
          type: venue.type,
          location: venue.district,
          date: new Date().toISOString(),
          rating: 4,
          cooldownDays: venue.defaultCooldownDays
        });
        db.addFeedback({
          id: `fb-${uuidv4().slice(0, 8)}`,
          userId,
          venueId,
          category: venue.category,
          result: 'rejected',
          reasonTag: 'already_visited',
          persistenceScope: 'persistent_profile',
          timestamp: new Date().toISOString()
        });
        break;

      case 'too_expensive':
        // Enforce Session Budget Ceiling: next recommendations in this session cannot exceed (venue.priceLevel - 1)
        dailyContext.sessionMaxBudget = Math.max(1, venue.priceLevel - 1) as BudgetLevel;
        db.updateDailyContext(dailyContext);

        db.addFeedback({
          id: `fb-${uuidv4().slice(0, 8)}`,
          userId,
          venueId,
          category: venue.category,
          result: 'rejected',
          reasonTag: 'too_expensive',
          persistenceScope: 'session_context',
          timestamp: new Date().toISOString()
        });
        break;

      case 'not_in_mood':
        // Exclude category for today
        if (!dailyContext.temporaryExcludedCategories.includes(venue.category)) {
          dailyContext.temporaryExcludedCategories.push(venue.category);
          db.updateDailyContext(dailyContext);
        }
        db.addFeedback({
          id: `fb-${uuidv4().slice(0, 8)}`,
          userId,
          venueId,
          category: venue.category,
          result: 'rejected',
          reasonTag: 'not_in_mood',
          persistenceScope: 'daily_context',
          timestamp: new Date().toISOString()
        });
        break;

      case 'too_far':
        // Exclude this district for the remainder of the session
        dailyContext.sessionExcludedDistricts = dailyContext.sessionExcludedDistricts || [];
        if (!dailyContext.sessionExcludedDistricts.includes(venue.district)) {
          dailyContext.sessionExcludedDistricts.push(venue.district);
          db.updateDailyContext(dailyContext);
        }

        db.addFeedback({
          id: `fb-${uuidv4().slice(0, 8)}`,
          userId,
          venueId,
          category: venue.category,
          result: 'rejected',
          reasonTag: 'too_far',
          persistenceScope: 'session_context',
          timestamp: new Date().toISOString()
        });
        break;
    }

    // Generate next single recommendation with incremented streak count
    return this.recommendSingle({
      userId,
      rejectStreakCount: currentStreak + 1
    });
  }

  /**
   * Core Scoring Algorithm (Multi-Dimensional, Non-Linear & Temporal)
   */
  public static scoreVenueForUser(
    user: User,
    venue: VenueCandidate,
    logs: ReturnType<typeof db.getUserLogs>,
    dailyContext: DailyContext,
    options: RecommendOptions,
    currentTime: Date = new Date()
  ): ScoredRecommendation {
    const reasons: string[] = [];

    // 1. Core Personality Vector Alignment (0-100)
    let personalityScore = 70;
    const { explorationTendency, socialEnergy, budgetFlexibility } = user.corePersonality || {
      explorationTendency: 'novelty_seeker',
      spontaneity: 'spontaneous',
      socialEnergy: 'energetic_social',
      budgetFlexibility: 'flexible'
    };

    // Social & Energy alignment
    if (socialEnergy === 'energetic_social' && (venue.vibe === 'energetic' || venue.vibe === 'adventurous' || venue.vibe === 'trendy')) {
      personalityScore += 14;
      reasons.push('Enerjik ve hareketli atmosfer arayışına birebir');
    } else if (socialEnergy === 'calm_peaceful' && (venue.vibe === 'chill' || venue.vibe === 'cozy')) {
      personalityScore += 14;
      reasons.push('Sakin ve huzurlu ortam beklentinle tam örtüşüyor');
    }

    // Exploration alignment
    if (explorationTendency === 'novelty_seeker' && (venue.category === 'uzakdogu' || venue.tags.includes('Gizem') || venue.tags.includes('Yaratıcı'))) {
      personalityScore += 12;
      reasons.push('Yeni ve özgün deneyim keşfetme tarzına uygun');
    }

    // Spontaneity alignment
    const spontaneityRes = this.calculateSpontaneityFit(venue, user, logs);
    personalityScore += spontaneityRes.scoreDelta;
    if (spontaneityRes.reason) {
      reasons.push(spontaneityRes.reason);
    }

    personalityScore = Math.min(100, Math.max(25, personalityScore));

    // 2. Learned Taste Weight (0-100) & Cold Start Seeding
    const weight = user.preferenceWeights[venue.category] ?? 1.0;
    let learnedTasteMatch = Math.min(100, Math.max(30, Math.round(weight * 70)));
    if (weight > 1.2) {
      reasons.push('Geçmiş tercihlerinden öğrenilen favori kategorilerinden');
    }

    // Popularity prior bonus for users with low feedback count (Cold start mitigation)
    const feedbackCount = user.feedbackCount || 0;
    if (feedbackCount < 5) {
      const coldStartBonus = (venue.rating / 5.0) * 10 * (1 - feedbackCount / 5);
      learnedTasteMatch = Math.min(100, learnedTasteMatch + Math.round(coldStartBonus));
    }

    // 3. Budget Match (0-100) with Veto Sensitivity
    const targetBudget = options.budget || dailyContext.customBudget || user.preferences.budgetPreference;
    let budgetMatch = 100;
    const diff = venue.priceLevel - targetBudget;
    if (diff > 0) {
      const penalty = budgetFlexibility === 'strict_budget' ? 40 : 22;
      budgetMatch = Math.max(10, 100 - diff * penalty);
    } else {
      reasons.push('Bütçe hedefinle birebir uyumlu');
    }

    // 4. Real Mood & Vibe Match (0-100)
    const moodRes = this.calculateMoodMatch(venue, user, dailyContext);
    const moodMatch = moodRes.moodScore;
    if (moodRes.reason) {
      reasons.push(moodRes.reason);
    }

    // 5. Environmental Context: Weather Fit
    const weatherRes = this.calculateWeatherFit(venue, options.weather || dailyContext.weather);
    if (weatherRes.reason) {
      reasons.push(weatherRes.reason);
    }

    // 6. Geolocation & Transportation Mode Fit
    const distRes = this.calculateDistanceFit(
      venue,
      options.userLocation || dailyContext.userLocation,
      options.transportMode || dailyContext.transportMode || 'walking'
    );
    if (distRes.reason) {
      reasons.push(distRes.reason);
    }

    // 7. Collaborative Filtering Signal (Users who liked X also liked Y)
    const collabRes = LearningEngine.getCollaborativeSignal(user, venue);
    if (collabRes.reason) {
      reasons.push(collabRes.reason);
    }

    // 8. Live Busyness Alignment
    if (socialEnergy === 'calm_peaceful' && venue.busynessLevel === 'quiet') {
      personalityScore = Math.min(100, personalityScore + 8);
      reasons.push('Sakin saatlerinde gürültüden uzak huzurlu ortam');
    } else if (socialEnergy === 'calm_peaceful' && venue.busynessLevel === 'busy') {
      personalityScore = Math.max(25, personalityScore - 8);
    }

    // 9. Temporal Factors (Opening hours & Time of day)
    const openCheck = this.isVenueOpenNow(venue, currentTime);
    let openPenalty = 1.0;
    if (!openCheck.isOpen) {
      openPenalty = 0.55;
      reasons.push(`⚠️ Şu an çalışma saatleri dışında olabilir (${openCheck.hoursText})`);
    }

    const timeFactor = this.getTimeOfDayFactor(venue, currentTime);
    if (timeFactor.reason) {
      reasons.push(timeFactor.reason);
    }

    // 10. Two-Tier Cooldown Check
    const cooldownRes = this.calculateTwoTierCooldown(venue, user, logs, options);
    if (cooldownRes.reason) {
      reasons.unshift(cooldownRes.reason);
    }

    // 11. Non-Linear Interaction Scoring (Geometric/Harmonic Veto Model)
    let wPersonality = 0.25;
    let wTaste = 0.25;
    let wBudget = 0.25;
    let wMood = 0.25;

    // Strict budget increases budget weight
    if (budgetFlexibility === 'strict_budget') {
      wBudget = 0.35;
      wTaste = 0.20;
    }

    // Weighted Geometric Combination
    let combined =
      Math.pow(personalityScore, wPersonality) *
      Math.pow(learnedTasteMatch, wTaste) *
      Math.pow(budgetMatch, wBudget) *
      Math.pow(moodMatch, wMood);

    // Apply Veto Multipliers if severe mismatch
    if (budgetMatch < 25 && budgetFlexibility === 'strict_budget') {
      combined *= 0.5; // Strong budget veto
    }
    if (moodMatch < 45) {
      combined *= 0.7; // Mood veto
    }

    // Add temporal & collaborative bonus, apply cooldown, weather & distance multipliers
    let rawScore =
      (combined + timeFactor.bonus + collabRes.scoreBonus) *
      cooldownRes.penaltyMultiplier *
      openPenalty *
      weatherRes.scoreMultiplier *
      distRes.scoreMultiplier;

    const totalScore = Math.round(Math.min(100, Math.max(10, rawScore)));

    return {
      venue,
      totalScore,
      breakdown: {
        personalityMatch: Math.round(personalityScore),
        learnedTasteMatch: Math.round(learnedTasteMatch),
        budgetMatch: Math.round(budgetMatch),
        moodMatch: Math.round(moodMatch),
        weatherMatch: weatherRes.weatherScore,
        distanceKm: distRes.distanceKm,
        travelTimeMinutes: distRes.travelTimeMinutes,
        collaborativeBonus: collabRes.scoreBonus,
        cooldownStatus: {
          isAvailable: cooldownRes.isAvailable,
          daysRemaining: cooldownRes.daysRemaining,
          lastVisitedDate: cooldownRes.lastVisitedDate
        }
      },
      matchReasons: reasons.slice(0, 4)
    };
  }

  /**
   * Multi-Stop Sequential Itinerary Builder (Dinner -> Coffee -> Activity/Nightlife)
   */
  public static buildItinerary(options: {
    userId: string;
    theme?: 'date_night' | 'friends_fun' | 'chill_evening';
    userLocation?: { lat: number; lng: number };
    weather?: { condition: 'sunny' | 'rainy' | 'cold' | 'cloudy' | 'snowy'; temperature?: number };
  }): ItineraryPlan {
    const user = db.getUser(options.userId);
    if (!user) throw new Error(`User not found: ${options.userId}`);

    const allVenues = db.getAllVenues();
    const logs = db.getUserLogs(user.id);
    const context = db.getDailyContext(user.id);
    const weather = options.weather || context.weather || { condition: 'sunny', temperature: 22 };
    const baseLoc = options.userLocation || (user.location?.lat && user.location?.lng ? { lat: user.location.lat, lng: user.location.lng } : { lat: 40.9875, lng: 29.0289 });

    // Step 1: Dinner / Food Stop (Excluding purely coffee/dessert)
    const foodCandidates = allVenues.filter(v => v.type === 'food' && v.category !== 'kahve_tatli');
    const scoredFood = foodCandidates
      .map(v => this.scoreVenueForUser(user, v, logs, context, { userId: user.id, userLocation: baseLoc, weather }))
      .sort((a, b) => b.totalScore - a.totalScore);

    const stop1Venue = scoredFood[0]?.venue || allVenues[0];

    // Step 2: Coffee / Dessert Stop (Within walking distance ~2.2 km from Stop 1)
    const coffeeCandidates = allVenues.filter(v => 
      v.category === 'kahve_tatli' &&
      v.id !== stop1Venue.id &&
      this.calculateDistanceKm(stop1Venue.lat, stop1Venue.lng, v.lat, v.lng) <= 2.5
    );
    const scoredCoffee = (coffeeCandidates.length > 0 ? coffeeCandidates : allVenues.filter(v => v.category === 'kahve_tatli'))
      .map(v => this.scoreVenueForUser(user, v, logs, context, { userId: user.id, userLocation: { lat: stop1Venue.lat, lng: stop1Venue.lng }, weather }))
      .sort((a, b) => b.totalScore - a.totalScore);

    const stop2Venue = scoredCoffee[0]?.venue || allVenues.find(v => v.category === 'kahve_tatli') || allVenues[1];

    // Step 3: Activity or Chill Nightlife (Within ~3.5 km of Stop 2)
    const activityCandidates = allVenues.filter(v =>
      (v.type === 'activity' || v.category === 'gece_hayati') &&
      v.id !== stop1Venue.id &&
      v.id !== stop2Venue.id &&
      this.calculateDistanceKm(stop2Venue.lat, stop2Venue.lng, v.lat, v.lng) <= 3.5
    );
    const scoredActivity = (activityCandidates.length > 0 ? activityCandidates : allVenues.filter(v => v.type === 'activity'))
      .map(v => this.scoreVenueForUser(user, v, logs, context, { userId: user.id, userLocation: { lat: stop2Venue.lat, lng: stop2Venue.lng }, weather }))
      .sort((a, b) => b.totalScore - a.totalScore);

    const stop3Venue = scoredActivity[0]?.venue || allVenues.find(v => v.type === 'activity') || allVenues[2];

    const dist1to2 = this.calculateDistanceKm(stop1Venue.lat, stop1Venue.lng, stop2Venue.lat, stop2Venue.lng);
    const dist2to3 = this.calculateDistanceKm(stop2Venue.lat, stop2Venue.lng, stop3Venue.lat, stop3Venue.lng);

    const stops: ItineraryStop[] = [
      {
        step: 1,
        phase: 'dinner',
        phaseTitleTr: '1. Durak: Akşam Yemeği',
        venue: stop1Venue,
        transitionTip: 'Akşama zevkine uygun mükemmel bir lezzet deneyimiyle başla.'
      },
      {
        step: 2,
        phase: 'coffee_dessert',
        phaseTitleTr: '2. Durak: Kahve & Tatlı Molası',
        venue: stop2Venue,
        distanceFromPrevKm: dist1to2,
        transitionTip: `Yemek sonrası ~${Math.round((dist1to2 / 4.5) * 60)} dakikalık keyifli bir yürüyüşle (${Math.round(dist1to2 * 1000)}m) tatlı sohbeti.`
      },
      {
        step: 3,
        phase: 'nightlife_activity',
        phaseTitleTr: '3. Durak: Gece Kapanışı & Deneyim',
        venue: stop3Venue,
        distanceFromPrevKm: dist2to3,
        transitionTip: `Günün kapanışında ~${Math.round((dist2to3 / 4.5) * 60)} dakikalık mesafede rahatlatıcı bir aktivite veya loş müzik.`
      }
    ];

    const totalEstimatedBudget = (stop1Venue.priceLevel + stop2Venue.priceLevel + stop3Venue.priceLevel) * 220;

    let title = 'Eksiksiz Şehir Akşamı Rotası';
    if (options.theme === 'date_night') title = 'Romantik & Zarif Akşam Rotası';
    else if (options.theme === 'friends_fun') title = 'Dinamik & Eğlenceli Arkadaş Rotası';

    return {
      id: `itin-${uuidv4().slice(0, 8)}`,
      title,
      theme: options.theme || 'chill_evening',
      stops,
      totalEstimatedDurationHours: 4.5,
      totalEstimatedBudget,
      summaryExplanation: `${stop1Venue.district} ve çevresinde birbirine yürüme mesafesinde kurgulanmış 3 duraklı kusursuz rota.`
    };
  }
}
