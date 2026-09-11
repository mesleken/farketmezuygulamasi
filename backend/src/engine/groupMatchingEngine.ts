import { db } from '../db/store.js';
import { User, VenueCandidate, ScoredRecommendation, ItemType, BudgetLevel, GroupSession } from '../types/index.js';
import { RecommendationEngine } from './recommendationEngine.js';

export interface GroupMatchOptions {
  userIds: string[];
  itemType?: ItemType | 'all';
  targetBudget?: BudgetLevel;
}

export class GroupMatchingEngine {
  /**
   * Group Consensus Algorithm with Adaptive Minimum Regret, Veto Thresholds, and Windowed Fairness
   */
  public static matchSingleForGroup(options: GroupMatchOptions): {
    recommendation: ScoredRecommendation | null;
    fairnessExplanation?: string;
  } {
    const users: User[] = options.userIds
      .map(id => db.getUser(id))
      .filter((u): u is User => !!u);

    if (users.length === 0) {
      throw new Error('No valid users in group');
    }

    const allVenues = db.getAllVenues();

    // 1. Hard Dietary Intersection
    const hasVegan = users.some(u => u.preferences.dietaryRestrictions.includes('vegan'));
    const hasVegetarian = users.some(u => u.preferences.dietaryRestrictions.includes('vejetaryen'));
    const hasGlutenFree = users.some(u => u.preferences.dietaryRestrictions.includes('glutensiz'));

    const filteredCandidates = allVenues.filter(venue => {
      if (options.itemType && options.itemType !== 'all' && venue.type !== options.itemType) {
        return false;
      }
      if (hasVegan && !venue.isVeganFriendly) return false;
      if (hasVegetarian && !venue.isVegetarianFriendly) return false;
      if (hasGlutenFree && !venue.isGlutenFreeFriendly) return false;
      return true;
    });

    // 2. Compute Fairness Weights for each user based on windowed satisfaction history (Max-Min fairness)
    const userFairnessWeights: Record<string, number> = {};
    let priorityUser: User | null = null;
    let lowestHistoricalScore = 1.0;

    for (const user of users) {
      const pastScore = db.getUserAverageFairness(user.id);
      // Fairness formula: lower past score gives higher weight (boost capped at 2.0 to avoid one person starving others)
      const boost = 1.0 + Math.min(1.0, Math.max(0, (0.75 - pastScore) * 1.5));
      userFairnessWeights[user.id] = Number(boost.toFixed(2));

      if (pastScore < lowestHistoricalScore) {
        lowestHistoricalScore = pastScore;
        priorityUser = user;
      }
    }

    let fairnessExplanation: string | undefined;
    if (priorityUser && lowestHistoricalScore < 0.65) {
      fairnessExplanation = `⚖️ Adalet Motoru: Bu öneri özellikle ${priorityUser.name}'in tercihlerine göre önceliklendirildi (son oturumlardaki memnuniyet ortalaması %${Math.round(lowestHistoricalScore * 100)} idi).`;
    }

    // 3. Adaptive Minimum Satisfaction Weight according to group size
    // Larger groups prioritize no-one-is-miserable (higher min-satisfaction weight)
    const minSatisfactionWeight = 0.35 + 0.08 * Math.min(users.length, 5); // 0.51 for 2 users, 0.67 for 4 users, 0.75 for 5+ users
    const weightedAvgWeight = 1 - minSatisfactionWeight;

    // 4. Score every candidate for each member
    const scoredGroupList: ScoredRecommendation[] = filteredCandidates.map(venue => {
      const memberScores: { userId: string; userName: string; score: number; fairnessWeightApplied?: number }[] = [];
      let weightedSum = 0;
      let totalWeight = 0;
      let minScore = 100;
      let minMemberName = '';
      const reasons: string[] = [];

      let anyMemberInCooldown = false;
      let cooldownMemberName = '';
      let daysLeftMax = 0;

      for (const user of users) {
        const userLogs = db.getUserLogs(user.id);
        const dailyContext = db.getDailyContext(user.id);
        const singleScore = RecommendationEngine.scoreVenueForUser(
          user,
          venue,
          userLogs,
          dailyContext,
          { userId: user.id, budget: options.targetBudget, type: options.itemType }
        );

        const weight = userFairnessWeights[user.id] || 1.0;

        memberScores.push({
          userId: user.id,
          userName: user.name,
          score: singleScore.totalScore,
          fairnessWeightApplied: weight
        });

        weightedSum += singleScore.totalScore * weight;
        totalWeight += weight;

        if (singleScore.totalScore < minScore) {
          minScore = singleScore.totalScore;
          minMemberName = user.name;
        }

        if (!singleScore.breakdown.cooldownStatus.isAvailable) {
          anyMemberInCooldown = true;
          cooldownMemberName = user.name;
          daysLeftMax = Math.max(daysLeftMax, singleScore.breakdown.cooldownStatus.daysRemaining);
        }
      }

      const weightedAvgScore = weightedSum / (totalWeight || 1);

      // Adaptive Minimum Regret Formula
      let groupScore = Math.round(weightedAvgScore * weightedAvgWeight + minScore * minSatisfactionWeight);

      // Veto Threshold: If any member's satisfaction is critically low (< 30)
      if (minScore < 30) {
        groupScore = Math.round(groupScore * 0.4);
        reasons.push(`⛔ Veto Uyarısı: ${minMemberName} için memnuniyet oranı kritik düzeyde düşük (%${minScore})`);
      }

      if (anyMemberInCooldown) {
        groupScore = Math.round(groupScore * 0.5);
        reasons.push(`⚠️ ${cooldownMemberName} yakın zamanda bu kategoriyi deneyimledi (${daysLeftMax} gün kaldı)`);
      } else {
        reasons.push('✅ Gruptaki herkesin geçmişi için taze ve tekrara düşmeyen deneyim');
      }

      if (hasVegetarian || hasVegan) {
        reasons.push('🥗 Gruptaki beslenme tercihlerine (vejetaryen/vegan) tam uyumlu');
      }

      if (fairnessExplanation) {
        reasons.push(fairnessExplanation);
      }

      reasons.push(`👥 Ortalama grup tatmini %${Math.round(weightedAvgScore)}, en düşük üye eşiği %${minScore}`);

      return {
        venue,
        totalScore: groupScore,
        breakdown: {
          personalityMatch: Math.round(weightedAvgScore),
          learnedTasteMatch: Math.round(weightedAvgScore),
          budgetMatch: 85,
          moodMatch: 85,
          cooldownStatus: {
            isAvailable: !anyMemberInCooldown,
            daysRemaining: daysLeftMax
          },
          groupMemberScores: memberScores,
          minimumSatisfaction: minScore,
          fairnessNote: fairnessExplanation
        },
        matchReasons: reasons
      };
    });

    // 5. Filter out vetoed candidates if viable alternatives exist
    const viableCandidates = scoredGroupList.filter(c => (c.breakdown.minimumSatisfaction || 0) >= 30);
    const candidatePool = viableCandidates.length > 0 ? viableCandidates : scoredGroupList;

    // Sort descending by totalScore
    candidatePool.sort((a, b) => b.totalScore - a.totalScore);

    return {
      recommendation: candidatePool[0] || null,
      fairnessExplanation
    };
  }

  /**
   * Generates a balanced trio (3 distinct candidate venues) for asynchronous group voting
   */
  public static generateCandidateTrioForGroup(options: GroupMatchOptions): VenueCandidate[] {
    const users: User[] = options.userIds
      .map(id => db.getUser(id))
      .filter((u): u is User => !!u);

    if (users.length === 0) return [];

    const allVenues = db.getAllVenues();

    // Dietary safety
    const hasVegan = users.some(u => u.preferences.dietaryRestrictions.includes('vegan'));
    const hasVegetarian = users.some(u => u.preferences.dietaryRestrictions.includes('vejetaryen'));
    const hasGlutenFree = users.some(u => u.preferences.dietaryRestrictions.includes('glutensiz'));

    const filtered = allVenues.filter(v => {
      if (options.itemType && options.itemType !== 'all' && v.type !== options.itemType) return false;
      if (hasVegan && !v.isVeganFriendly) return false;
      if (hasVegetarian && !v.isVegetarianFriendly) return false;
      if (hasGlutenFree && !v.isGlutenFreeFriendly) return false;
      return true;
    });

    // Score all candidates for group
    const matchRes = this.matchSingleForGroup(options);
    const topRecommendation = matchRes.recommendation?.venue;

    const trio: VenueCandidate[] = [];
    if (topRecommendation) {
      trio.push(topRecommendation);
    }

    // Pick 2 other diverse candidates with different categories/vibes
    for (const v of filtered) {
      if (trio.length >= 3) break;
      if (!trio.some(item => item.id === v.id || item.category === v.category)) {
        trio.push(v);
      }
    }

    // Fallback if needed
    for (const v of filtered) {
      if (trio.length >= 3) break;
      if (!trio.some(item => item.id === v.id)) {
        trio.push(v);
      }
    }

    return trio;
  }

  /**
   * Tallies approvals and vetoes from all members in a group session
   */
  public static tallyGroupVotes(session: GroupSession): {
    winner: VenueCandidate;
    consensusScore: number;
    explanation: string;
  } {
    const candidates = session.candidateVenues || [];
    if (candidates.length === 0) {
      throw new Error('No candidates in session to tally');
    }

    const votes = session.votes || {};
    const scores: Record<string, { approvalCount: number; vetoCount: number; netScore: number }> = {};

    for (const c of candidates) {
      scores[c.id] = { approvalCount: 0, vetoCount: 0, netScore: 0 };
    }

    for (const [, userVote] of Object.entries(votes) as [string, { approvedVenueIds: string[]; vetoedVenueIds: string[] }][]) {
      for (const appId of userVote.approvedVenueIds || []) {
        if (scores[appId]) {
          scores[appId].approvalCount += 1;
          scores[appId].netScore += 2;
        }
      }
      for (const vetoId of userVote.vetoedVenueIds || []) {
        if (scores[vetoId]) {
          scores[vetoId].vetoCount += 1;
          scores[vetoId].netScore -= 5; // Heavy veto penalty
        }
      }
    }

    // Sort by netScore descending, then by approvalCount descending
    const sorted = [...candidates].sort((a, b) => {
      const scoreA = scores[a.id]?.netScore ?? 0;
      const scoreB = scores[b.id]?.netScore ?? 0;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return (scores[b.id]?.approvalCount ?? 0) - (scores[a.id]?.approvalCount ?? 0);
    });

    const winner = sorted[0];
    const winStat = scores[winner.id] || { approvalCount: 0, vetoCount: 0, netScore: 0 };

    const explanation = `🎉 Konsensüs Sağlandı! ${winner.title}, ${winStat.approvalCount} onay ve ${winStat.vetoCount} veto ile grubun ortak kararı olarak belirlendi.`;

    return {
      winner,
      consensusScore: winStat.netScore,
      explanation
    };
  }
}
