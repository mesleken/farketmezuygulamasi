import { db } from '../db/store.js';
import { User, VenueCandidate, OnboardingSwipeCard } from '../types/index.js';

export const ONBOARDING_SWIPE_CARDS: OnboardingSwipeCard[] = [
  {
    id: 'card-1',
    title: 'Moda Sahili & Nitelikli Kahve',
    subtitle: 'Huzurlu, 3. dalga kahve & kruvasan',
    category: 'kahve_tatli',
    vibe: 'chill',
    tags: ['Flat White', 'San Sebastian', 'Kitap/Sohbet'],
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80',
    description: 'Sessiz müzik, bol yeşillik ve sakin kahve molası.'
  },
  {
    id: 'card-2',
    title: 'Akaretler Gurme Smash Burger',
    subtitle: 'Çıtır patates, sokak lezzetleri ve dinamik ortam',
    category: 'burger',
    vibe: 'energetic',
    tags: ['Gurme Burger', 'Truffle Fries', 'Craft İçecekler'],
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    description: 'Arkadaşlarla hızlı, lezzetli ve hareketli bir akşam başlangıcı.'
  },
  {
    id: 'card-3',
    title: 'Cihangir Seramik & Sanat Atölyesi',
    subtitle: 'Yaratıcı çömlek tornası ve huzurlu deneyim',
    category: 'kultur_sanat',
    vibe: 'cozy',
    tags: ['Çömlek Tornası', 'Seramik Boyama', 'Yaratıcı'],
    imageUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=600&q=80',
    description: 'Ellerinizi çamura bulayıp kendi kupanızı tasarlayacağınız dingin bir etkinlik.'
  },
  {
    id: 'card-4',
    title: 'Karaköy Loş Caz & Artisan Kokteyl',
    subtitle: 'Canlı trompet, mum ışığı ve imza kokteyller',
    category: 'gece_hayati',
    vibe: 'romantic',
    tags: ['Canlı Caz', 'İmza Kokteyller', 'Loş Atmosfer'],
    imageUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=600&q=80',
    description: 'Şehrin ritmini loş ve samimi bir caz atmosferinde hissetmek.'
  },
  {
    id: 'card-5',
    title: 'Kadıköy Board Game & Rekabet Arenası',
    subtitle: '300+ Kutu oyunu, kahkaha ve grup mücadelesi',
    category: 'kafe_sohbet',
    vibe: 'energetic',
    tags: ['Catan', 'Kutu Oyunu', 'Grup Sohbeti'],
    imageUrl: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=600&q=80',
    description: 'Catan ve strateji oyunlarıyla saatlerin nasıl geçtiğini unutturan arkadaş buluşması.'
  },
  {
    id: 'card-6',
    title: 'Bağdat Caddesi Taş Fırın İtalyan',
    subtitle: 'Otantik Napoliten pizza ve taze ev makarnası',
    category: 'italyan',
    vibe: 'romantic',
    tags: ['Napoliten Pizza', 'Taze Makarna', 'Şarap Seçkisi'],
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
    description: 'Özel bir akşam yemeği için lezzet ve şıklığı bir araya getiren İtalyan lezzetleri.'
  }
];

export class LearningEngine {
  /**
   * Vector Cosine Similarity Helper
   */
  public static calculateCosineSimilarity(
    vecA: Record<string, number>,
    vecB: Record<string, number>
  ): number {
    const keys = Array.from(new Set([...Object.keys(vecA), ...Object.keys(vecB)]));
    if (keys.length === 0) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (const key of keys) {
      const valA = vecA[key] ?? 1.0;
      const valB = vecB[key] ?? 1.0;
      dotProduct += valA * valB;
      normA += valA * valA;
      normB += valB * valB;
    }

    if (normA === 0 || normB === 0) return 0;
    return Number((dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))).toFixed(3));
  }

  /**
   * User-User Similarity (Cosine of category + vibe weights + personality alignment)
   */
  public static calculateUserSimilarity(u1: User, u2: User): number {
    if (u1.id === u2.id) return 1.0;

    const catSim = this.calculateCosineSimilarity(u1.preferenceWeights || {}, u2.preferenceWeights || {});
    const vibeSim = this.calculateCosineSimilarity(u1.vibeWeights || {}, u2.vibeWeights || {});

    let personalityMatch = 0.5;
    if (u1.corePersonality && u2.corePersonality) {
      let matchCount = 0;
      if (u1.corePersonality.explorationTendency === u2.corePersonality.explorationTendency) matchCount++;
      if (u1.corePersonality.socialEnergy === u2.corePersonality.socialEnergy) matchCount++;
      if (u1.corePersonality.budgetFlexibility === u2.corePersonality.budgetFlexibility) matchCount++;
      if (u1.corePersonality.spontaneity === u2.corePersonality.spontaneity) matchCount++;
      personalityMatch = matchCount / 4;
    }

    const totalSim = 0.5 * catSim + 0.3 * vibeSim + 0.2 * personalityMatch;
    return Number(totalSim.toFixed(3));
  }

  /**
   * Collaborative Filtering Signal: Checks what similar users liked
   */
  public static getCollaborativeSignal(
    targetUser: User,
    venue: VenueCandidate
  ): { scoreBonus: number; reason?: string; endorserCount: number } {
    const allUsers = db.getAllUsers().filter(u => u.id !== targetUser.id);
    const similarUsers: { user: User; similarity: number }[] = [];

    for (const other of allUsers) {
      const sim = this.calculateUserSimilarity(targetUser, other);
      if (sim >= 0.60) {
        similarUsers.push({ user: other, similarity: sim });
      }
    }

    if (similarUsers.length === 0) {
      return { scoreBonus: 0, endorserCount: 0 };
    }

    let endorserCount = 0;
    for (const { user } of similarUsers) {
      const logs = db.getUserLogs(user.id);
      const hasLiked = logs.some(l => l.venueId === venue.id && (l.feedback === 'liked' || (l.rating && l.rating >= 4)));
      const hasCategoryLove = (user.preferenceWeights[venue.category] ?? 1.0) >= 1.25;

      if (hasLiked || hasCategoryLove) {
        endorserCount++;
      }
    }

    if (endorserCount > 0) {
      const scoreBonus = Math.min(18, endorserCount * 8);
      return {
        scoreBonus,
        endorserCount,
        reason: `👥 Senin zevkine benzer ${endorserCount} Farketmez kullanıcısının yüksek puan verdiği mekan`
      };
    }

    return { scoreBonus: 0, endorserCount: 0 };
  }

  /**
   * Fast Onboarding / Tinder-style Calibration
   */
  public static processQuickSwipe(userId: string, cardId: string, action: 'like' | 'dislike'): User | undefined {
    const user = db.getUser(userId);
    if (!user) return undefined;

    const card = ONBOARDING_SWIPE_CARDS.find(c => c.id === cardId);
    if (!card) return user;

    const delta = action === 'like' ? 0.25 : -0.20;

    user.preferenceWeights = user.preferenceWeights || {};
    user.vibeWeights = user.vibeWeights || {};
    user.tagWeights = user.tagWeights || {};

    const currCat = user.preferenceWeights[card.category] ?? 1.0;
    user.preferenceWeights[card.category] = Number(Math.min(2.0, Math.max(0.4, currCat + delta)).toFixed(2));

    const currVibe = user.vibeWeights[card.vibe] ?? 1.0;
    user.vibeWeights[card.vibe] = Number(Math.min(2.0, Math.max(0.4, currVibe + delta * 0.8)).toFixed(2));

    for (const tag of card.tags) {
      const currTag = user.tagWeights[tag] ?? 1.0;
      user.tagWeights[tag] = Number(Math.min(2.0, Math.max(0.4, currTag + delta * 0.6)).toFixed(2));
    }

    user.feedbackCount = (user.feedbackCount || 0) + 1;
    user.lastFeedbackDate = new Date().toISOString();

    db.saveUser(user);
    return user;
  }

  /**
   * Implicit & Explicit Feedback Learner with Multi-Dimensional & Decaying Learning
   */
  public static recordFeedback(
    userId: string,
    category: string,
    feedback: 'liked' | 'neutral' | 'disliked',
    rating?: number,
    venueId?: string
  ) {
    const user = db.getUser(userId);
    if (!user) return;

    if (!user.preferenceWeights) {
      user.preferenceWeights = {};
    }
    user.vibeWeights = user.vibeWeights || {};
    user.districtWeights = user.districtWeights || {};
    user.tagWeights = user.tagWeights || {};

    // 1. Time Decay Regression towards 1.0 if it's been long since last feedback
    if (user.lastFeedbackDate) {
      const daysPassed = (Date.now() - new Date(user.lastFeedbackDate).getTime()) / (1000 * 60 * 60 * 24);
      if (daysPassed > 14) {
        const decayMultiplier = Math.exp(-0.005 * daysPassed);
        for (const cat of Object.keys(user.preferenceWeights)) {
          user.preferenceWeights[cat] = Number(
            (1.0 + (user.preferenceWeights[cat] - 1.0) * decayMultiplier).toFixed(2)
          );
        }
      }
    }
    user.lastFeedbackDate = new Date().toISOString();

    // 2. Decaying Delta (Marginal return decreases with experience)
    user.feedbackCount = (user.feedbackCount || 0) + 1;
    const decayFactor = 1 / (1 + 0.15 * Math.sqrt(user.feedbackCount));

    let baseDelta = 0;
    if (feedback === 'liked') {
      baseDelta += 0.20;
    } else if (feedback === 'disliked') {
      baseDelta -= 0.20;
    }

    if (rating) {
      if (rating >= 4) baseDelta += 0.10;
      else if (rating <= 2) baseDelta -= 0.15;
    }

    const effectiveDelta = baseDelta * decayFactor;

    // 3. Update Category Preference Weight
    const currentWeight = user.preferenceWeights[category] ?? 1.0;
    user.preferenceWeights[category] = Number(
      Math.min(2.0, Math.max(0.3, currentWeight + effectiveDelta)).toFixed(2)
    );

    // 4. Multi-Dimensional Learning (Vibe, District, Tags) if venue is known
    const venue = venueId ? db.getVenueById(venueId) : db.getAllVenues().find(v => v.category === category);
    if (venue) {
      // Vibe weight
      const currVibeW = user.vibeWeights[venue.vibe] ?? 1.0;
      user.vibeWeights[venue.vibe] = Number(
        Math.min(2.0, Math.max(0.4, currVibeW + effectiveDelta * 0.7)).toFixed(2)
      );

      // District weight
      const currDistW = user.districtWeights[venue.district] ?? 1.0;
      user.districtWeights[venue.district] = Number(
        Math.min(2.0, Math.max(0.4, currDistW + effectiveDelta * 0.5)).toFixed(2)
      );

      // Tag weights
      if (venue.tags && venue.tags.length > 0) {
        for (const tag of venue.tags.slice(0, 3)) {
          const currTagW = user.tagWeights[tag] ?? 1.0;
          user.tagWeights[tag] = Number(
            Math.min(2.0, Math.max(0.5, currTagW + effectiveDelta * 0.4)).toFixed(2)
          );
        }
      }
    }

    db.saveUser(user);
    return user;
  }
}
