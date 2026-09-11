import { db } from '../db/store.js';
import {
  CoupleProfile,
  VenueCandidate,
  ScoredRecommendation,
  SurpriseRequest,
  BudgetLevel
} from '../types/index.js';
import { RecommendationEngine } from './recommendationEngine.js';
import { v4 as uuidv4 } from 'uuid';

export interface CoupleRecommendOptions {
  coupleId: string;
  requesterUserId: string;
  isSpecialDayMode?: boolean;
  manualOverrideTarget?: 'partner' | 'self' | 'none'; // "Bu sefer sen seç" / "Bu sefer ben seçeyim"
  prioritizeWishlist?: boolean;
}

export class CoupleEngine {
  /**
   * Main Couple Recommendation Engine with Turn-Taking, Proportional Wishlist & Dedicated Special Day Mode
   */
  public static recommendForCouple(options: CoupleRecommendOptions): ScoredRecommendation | null {
    const couple = db.getAllCoupleProfiles().find(
      c => c.id === options.coupleId || c.user1Id === options.coupleId || c.user2Id === options.coupleId
    );

    if (!couple) {
      throw new Error('Couple profile not found');
    }

    const user1 = db.getUser(couple.user1Id);
    const user2 = db.getUser(couple.user2Id);
    const allVenues = db.getAllVenues();

    if (!user1 || !user2) {
      throw new Error('Both partners must be active users in the couple');
    }

    const l1 = db.getUserLogs(user1.id);
    const l2 = db.getUserLogs(user2.id);
    const ctx1 = db.getDailyContext(user1.id);
    const ctx2 = db.getDailyContext(user2.id);

    // 1. Check Special Day Status
    const isSpecialDay = options.isSpecialDayMode || this.isNearSpecialDay(couple);

    // 2. Compute Fairness Weights or Manual Override
    let weight1 = 1.0;
    let weight2 = 1.0;
    let overrideNote: string | undefined;

    if (options.manualOverrideTarget === 'partner') {
      // "Bu sefer sen seç" -> 100% partner weight
      if (options.requesterUserId === user1.id) {
        weight1 = 0.0;
        weight2 = 2.0;
        overrideNote = `💖 ${user1.name} seçimi ${user2.name}'e bıraktı`;
      } else {
        weight1 = 2.0;
        weight2 = 0.0;
        overrideNote = `💖 ${user2.name} seçimi ${user1.name}'e bıraktı`;
      }
    } else if (options.manualOverrideTarget === 'self') {
      // "Bu sefer ben seçeyim"
      if (options.requesterUserId === user1.id) {
        weight1 = 2.0;
        weight2 = 0.0;
        overrideNote = `🎯 ${user1.name} inisiyatif alarak seçti`;
      } else {
        weight1 = 0.0;
        weight2 = 2.0;
        overrideNote = `🎯 ${user2.name} inisiyatif alarak seçti`;
      }
    } else {
      // Auto Balance based on windowed satisfaction (excluding overrides)
      const u1Score = db.getCoupleUserAverageSatisfaction(couple.id, user1.id);
      const u2Score = db.getCoupleUserAverageSatisfaction(couple.id, user2.id);

      weight1 = 1.0 + Math.max(0, (0.75 - u1Score) * 1.5);
      weight2 = 1.0 + Math.max(0, (0.75 - u2Score) * 1.5);
    }

    // Filter candidate pool if Special Day mode is active
    let candidateVenues = allVenues;
    if (isSpecialDay) {
      const romanticPool = allVenues.filter(v => v.isRomantic || v.vibe === 'romantic' || v.priceLevel >= 3);
      if (romanticPool.length > 0) {
        candidateVenues = romanticPool;
      }
    }

    // 3. Score every candidate
    const scoredList: ScoredRecommendation[] = candidateVenues.map(venue => {
      // Score for user1 and user2
      const s1 = RecommendationEngine.scoreVenueForUser(
        user1,
        venue,
        l1,
        ctx1,
        { userId: user1.id, ignoreCooldown: isSpecialDay }
      );
      const s2 = RecommendationEngine.scoreVenueForUser(
        user2,
        venue,
        l2,
        ctx2,
        { userId: user2.id, ignoreCooldown: isSpecialDay }
      );

      const weightedAvg = Math.round((s1.totalScore * weight1 + s2.totalScore * weight2) / (weight1 + weight2 || 1));
      let finalScore = weightedAvg;
      const reasons: string[] = [];

      // Wishlist Priority Check with Proportional Bonus
      const inWishlist = couple.sharedWishlist?.some(
        w => !w.isVisited && (w.venueId === venue.id || w.title.toLowerCase() === venue.title.toLowerCase())
      );
      if (inWishlist) {
        const wishlistBonus = Math.max(12, Math.round(weightedAvg * 0.25));
        finalScore += wishlistBonus;
        reasons.push(`⭐ Ortak Denenecekler Listenizden seçildi! (+%${wishlistBonus} Uyum Bonusu)`);
      }

      // Special Day Boost
      if (isSpecialDay) {
        if (venue.isRomantic || venue.priceLevel >= 3) {
          finalScore += 15;
          reasons.push('🌹 Özel Gün Modu: Baş başa romantizm ve özenle seçilmiş atmosfer');
        }
      }

      if (overrideNote) {
        reasons.push(overrideNote);
      } else {
        reasons.push(`💑 Otomatik Karar Dengesi (${user1.name} %${s1.totalScore} - ${user2.name} %${s2.totalScore})`);
      }

      finalScore = Math.min(100, Math.max(10, finalScore));

      return {
        venue,
        totalScore: finalScore,
        breakdown: {
          personalityMatch: weightedAvg,
          learnedTasteMatch: weightedAvg,
          budgetMatch: isSpecialDay ? 95 : 85,
          moodMatch: isSpecialDay ? 100 : 90,
          cooldownStatus: {
            isAvailable: isSpecialDay ? true : s1.breakdown.cooldownStatus.isAvailable && s2.breakdown.cooldownStatus.isAvailable,
            daysRemaining: Math.max(s1.breakdown.cooldownStatus.daysRemaining, s2.breakdown.cooldownStatus.daysRemaining)
          },
          groupMemberScores: [
            { userId: user1.id, userName: user1.name, score: s1.totalScore, fairnessWeightApplied: weight1 },
            { userId: user2.id, userName: user2.name, score: s2.totalScore, fairnessWeightApplied: weight2 }
          ],
          specialDayActive: isSpecialDay,
          fromWishlist: inWishlist,
          manualOverrideApplied: overrideNote
        },
        matchReasons: reasons
      };
    });

    scoredList.sort((a, b) => b.totalScore - a.totalScore);
    return scoredList.length > 0 ? scoredList[0] : null;
  }

  /**
   * Check if today is near an anniversary or special date (within 5 days)
   */
  public static isNearSpecialDay(couple: CoupleProfile): boolean {
    if (!couple.specialDates || couple.specialDates.length === 0) return false;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    return couple.specialDates.some(sp => {
      const spDate = new Date(sp.date);
      const isSameMonth = spDate.getMonth() === currentMonth;
      const diffDays = Math.abs(spDate.getDate() - currentDay);
      return isSameMonth && diffDays <= 4;
    });
  }

  /**
   * Plan a Surprise for partner with Receiver Profile Integration & Novelty Bonus
   */
  public static createSurprisePlan(
    coupleId: string,
    plannerUserId: string,
    targetDateTime: string,
    stylePreference?: 'romantic' | 'active_adventurous' | 'cozy_dinner',
    budgetLevel?: BudgetLevel
  ): SurpriseRequest {
    const couple = db.getCoupleProfileById(coupleId);

    if (!couple) {
      throw new Error('Couple profile not found');
    }

    const receiverUserId = couple.user1Id === plannerUserId ? couple.user2Id : couple.user1Id;
    const receiverUser = db.getUser(receiverUserId);
    const allVenues = db.getAllVenues();

    if (!receiverUser) {
      throw new Error('Receiver user not found');
    }

    const receiverLogs = db.getUserLogs(receiverUserId);
    const receiverCtx = db.getDailyContext(receiverUserId);
    const surpriseAffinities = couple.surpriseAffinities || {};

    // 1. Filter candidates by style, budget, and negative receiver filter
    const candidates = allVenues.filter(v => {
      if (stylePreference === 'romantic' && !v.isRomantic) return false;
      if (stylePreference === 'active_adventurous' && v.vibe !== 'adventurous' && v.vibe !== 'energetic') return false;
      if (stylePreference === 'cozy_dinner' && v.type !== 'food') return false;
      if (budgetLevel && v.priceLevel > budgetLevel) return false;

      // Negative filter: Exclude categories receiver strongly dislikes (< 0.6)
      const receiverWeight = receiverUser.preferenceWeights[v.category] ?? 1.0;
      if (receiverWeight < 0.6) return false;

      // Dietary restrictions of receiver
      if (receiverUser.preferences.dietaryRestrictions.includes('vegan') && !v.isVeganFriendly) return false;
      if (receiverUser.preferences.dietaryRestrictions.includes('vejetaryen') && !v.isVegetarianFriendly) return false;

      return true;
    });

    // 2. Score candidates using Receiver Fit, Surprise Affinity, and Novelty Bonus
    const scoredCandidates = candidates.map(venue => {
      const receiverFit = RecommendationEngine.scoreVenueForUser(
        receiverUser,
        venue,
        receiverLogs,
        receiverCtx,
        { userId: receiverUserId }
      ).totalScore;

      const affinity = surpriseAffinities[venue.category] || 1.0;
      const ratingNormalized = (venue.rating / 5.0) * 100;

      // Novelty Bonus: real surprise includes undiscovered places
      const hasReceiverVisited = receiverLogs.some(l => l.venueId === venue.id || l.category === venue.category);
      const noveltyBonus = hasReceiverVisited ? 0 : 20;

      const compositeScore = Math.round(
        receiverFit * 0.35 +
        (affinity * 50) * 0.25 +
        ratingNormalized * 0.20 +
        noveltyBonus * 0.20
      );

      return { venue, score: compositeScore };
    });

    scoredCandidates.sort((a, b) => b.score - a.score);

    const chosen = (scoredCandidates[0]?.venue) || allVenues[0];
    const teaser = `${targetDateTime} için hazır ol! Seni gizemli bir sürpriz bekliyor 🤫`;

    const surprise: SurpriseRequest = {
      id: `surp-${uuidv4().slice(0, 8)}`,
      coupleId: couple.id,
      plannerUserId,
      receiverUserId,
      targetDateTime,
      budgetLevel,
      stylePreference,
      venueId: chosen.id,
      venue: chosen,
      receiverTeaser: teaser,
      status: 'ready',
      createdAt: new Date().toISOString()
    };

    if (!couple.activeSurprises) couple.activeSurprises = [];
    couple.activeSurprises.unshift(surprise);
    db.saveCoupleProfile(couple);

    return surprise;
  }

  /**
   * Submit Surprise Feedback (Updates SurpriseAffinity independently)
   */
  public static recordSurpriseFeedback(
    surpriseId: string,
    userId: string,
    feedback: 'liked' | 'neutral' | 'disliked'
  ): void {
    const allCouples = db.getAllCoupleProfiles();
    for (const couple of allCouples) {
      const surprise = couple.activeSurprises?.find(s => s.id === surpriseId);
      if (surprise) {
        if (userId === surprise.plannerUserId) {
          surprise.plannerFeedback = feedback;
        } else {
          surprise.receiverFeedback = feedback;
        }

        // Update SurpriseAffinity
        if (!couple.surpriseAffinities) couple.surpriseAffinities = {};
        const cat = surprise.venue.category;
        const currentAff = couple.surpriseAffinities[cat] || 1.0;
        let delta = feedback === 'liked' ? 0.2 : feedback === 'disliked' ? -0.2 : 0;
        couple.surpriseAffinities[cat] = Number(Math.max(0.4, Math.min(2.0, currentAff + delta)).toFixed(2));

        surprise.status = 'completed';
        db.saveCoupleProfile(couple);
        break;
      }
    }
  }

  /**
   * Routine Breaker, Dynamic Entropy Detection & Romantic Date Picks
   */
  public static getCoupleSuggestions(coupleId: string): {
    routineBreakers: ScoredRecommendation[];
    romanticDates: ScoredRecommendation[];
    anniversaryAlert?: string;
  } {
    const couple = db.getAllCoupleProfiles().find(
      c => c.id === coupleId || c.user1Id === coupleId || c.user2Id === coupleId
    );

    if (!couple) {
      throw new Error('Couple profile not found');
    }

    const user1 = db.getUser(couple.user1Id);
    const user2 = db.getUser(couple.user2Id);
    const allVenues = db.getAllVenues();

    const allLogs = [
      ...(user1 ? db.getUserLogs(user1.id) : []),
      ...(user2 ? db.getUserLogs(user2.id) : [])
    ];

    const categoryCounts: Record<string, number> = {};
    const venueCounts: Record<string, { count: number; title: string }> = {};
    const oneMonthAgo = Date.now() - 1000 * 60 * 60 * 24 * 30;

    for (const log of allLogs) {
      if (new Date(log.date).getTime() > oneMonthAgo) {
        categoryCounts[log.category] = (categoryCounts[log.category] || 0) + 1;
        if (log.venueId) {
          if (!venueCounts[log.venueId]) {
            venueCounts[log.venueId] = { count: 0, title: log.title };
          }
          venueCounts[log.venueId].count += 1;
        }
      }
    }

    // Dynamic Threshold: proportional to couple activity frequency
    const dynamicThreshold = Math.max(3, Math.ceil(allLogs.length * 0.25));

    const overusedCategories = Object.entries(categoryCounts)
      .filter(([_, count]) => count >= dynamicThreshold)
      .map(([cat]) => cat);

    // Check Venue-Level Routine Warnings
    const warnings: string[] = [];
    for (const [_, vData] of Object.entries(venueCounts)) {
      if (vData.count >= 3) {
        warnings.push(`Son 1 ayda ${vData.count} kez "${vData.title}" mekanına gittiniz! Bu akşam farklı bir deneyimle rutini kırmaya ne dersiniz?`);
      }
    }
    if (warnings.length > 0) {
      couple.routineWarnings = warnings;
      db.saveCoupleProfile(couple);
    }

    const routineBreakers = allVenues
      .filter(v => !overusedCategories.includes(v.category))
      .map(v => {
        let u1Score = 80;
        let u2Score = 80;
        if (user1) {
          const l1 = db.getUserLogs(user1.id);
          const ctx1 = db.getDailyContext(user1.id);
          u1Score = RecommendationEngine.scoreVenueForUser(user1, v, l1, ctx1, { userId: user1.id }).totalScore;
        }
        if (user2) {
          const l2 = db.getUserLogs(user2.id);
          const ctx2 = db.getDailyContext(user2.id);
          u2Score = RecommendationEngine.scoreVenueForUser(user2, v, l2, ctx2, { userId: user2.id }).totalScore;
        }

        const avg = Math.round((u1Score + u2Score) / 2);
        return {
          venue: v,
          totalScore: avg,
          breakdown: {
            personalityMatch: avg,
            learnedTasteMatch: avg,
            budgetMatch: 90,
            moodMatch: 95,
            cooldownStatus: { isAvailable: true, daysRemaining: 0 }
          },
          matchReasons: [
            '✨ Rutin Kırıcı: Uzun süredir denemediğiniz taze bir deneyim',
            '❤️ İki tarafın da profiline hitap eden ortak zevk'
          ]
        } as ScoredRecommendation;
      })
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 4);

    const romanticDates = allVenues
      .filter(v => v.isRomantic || v.vibe === 'romantic' || v.category === 'kultur_sanat')
      .map(v => ({
        venue: v,
        totalScore: 95,
        breakdown: {
          personalityMatch: 95,
          learnedTasteMatch: 90,
          budgetMatch: 85,
          moodMatch: 100,
          cooldownStatus: { isAvailable: true, daysRemaining: 0 }
        },
        matchReasons: [
          '🌹 Romantik & Baş Başa Atmosfer',
          '🕯️ Özel sohbetler ve unutulmaz anılar için özenle seçildi'
        ]
      } as ScoredRecommendation))
      .slice(0, 4);

    return {
      routineBreakers,
      romanticDates,
      anniversaryAlert: couple.specialDates?.length > 0
        ? `Yaklaşan Özel Gün: ${couple.specialDates[0].name} (${couple.specialDates[0].date})`
        : undefined
    };
  }
}
