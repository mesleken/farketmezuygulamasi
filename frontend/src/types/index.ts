export type EnergyLevel = 'calm' | 'balanced' | 'active';
export type SocialLevel = 'introvert' | 'balanced' | 'extrovert';
export type AdventureLevel = 'traditional' | 'open' | 'adventurous';
export type BudgetLevel = 1 | 2 | 3 | 4;
export type ItemType = 'food' | 'activity' | 'place';

export interface CorePersonalityVector {
  explorationTendency: 'novelty_seeker' | 'familiarity_preferred';
  spontaneity: 'spontaneous' | 'planner';
  socialEnergy: 'energetic_social' | 'calm_peaceful';
  budgetFlexibility: 'flexible' | 'strict_budget';
}

export type RejectReasonTag =
  | 'already_visited'
  | 'too_expensive'
  | 'not_in_mood'
  | 'too_far';

export interface RecommendationFeedback {
  id: string;
  userId: string;
  venueId: string;
  category: string;
  result: 'accepted' | 'rejected';
  reasonTag?: RejectReasonTag;
  persistenceScope?: string;
  timestamp: string;
}

export interface UserPreferences {
  energyLevel: EnergyLevel;
  socialLevel: SocialLevel;
  adventureLevel: AdventureLevel;
  budgetPreference: BudgetLevel;
  foodPreferences: string[];
  dietaryRestrictions: string[];
  activityPreferences: string[];
}

export interface DailyContext {
  userId: string;
  date: string;
  mood?: string;
  temporaryExcludedCategories: string[];
  sessionExcludedDistricts?: string[];
  sessionMaxBudget?: BudgetLevel;
  preferredVibe?: 'chill' | 'energetic' | 'romantic' | 'cozy' | 'trendy' | 'adventurous';
  customBudget?: BudgetLevel;
  weather?: {
    condition: 'sunny' | 'rainy' | 'cold' | 'cloudy' | 'snowy';
    temperature?: number;
  };
  userLocation?: {
    lat: number;
    lng: number;
    district?: string;
  };
  transportMode?: 'walking' | 'transit' | 'driving';
  previousVenuesVisitedToday?: Array<{
    venueId: string;
    category: string;
    type: ItemType;
    timestamp: string;
  }>;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  avatar: string;
  age?: number;
  location: {
    city: string;
    district: string;
    lat?: number;
    lng?: number;
  };
  corePersonality: CorePersonalityVector;
  preferences: UserPreferences;
  preferenceWeights: Record<string, number>;
  vibeWeights?: Record<string, number>;
  districtWeights?: Record<string, number>;
  tagWeights?: Record<string, number>;
  feedbackCount?: number;
  lastFeedbackDate?: string;
  cooldownOverrides?: Record<string, number>;
  partnerId?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  venueId?: string;
  title: string;
  category: string;
  type: ItemType;
  location: string;
  date: string;
  rating?: number;
  feedback?: 'liked' | 'neutral' | 'disliked';
  notes?: string;
  priceLevel?: BudgetLevel;
  isCouple?: boolean;
  groupId?: string;
  cooldownDays: number;
}

export interface VenueCandidate {
  id: string;
  title: string;
  category: string;
  categoryNameTr: string;
  type: ItemType;
  description: string;
  address: string;
  district: string;
  city: string;
  lat: number;
  lng: number;
  priceLevel: BudgetLevel;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  tags: string[];
  isVegetarianFriendly: boolean;
  isVeganFriendly: boolean;
  isGlutenFreeFriendly: boolean;
  isRomantic: boolean;
  vibe: 'chill' | 'energetic' | 'romantic' | 'cozy' | 'trendy' | 'adventurous';
  suitableFor: ('solo' | 'couple' | 'group')[];
  defaultCooldownDays: number;
  phoneNumber?: string;
  openingHours?: string;
  isIndoor?: boolean;
  hasTerrace?: boolean;
  isCozy?: boolean;
  busynessLevel?: 'quiet' | 'moderate' | 'busy';
}

export interface ScoredRecommendation {
  venue: VenueCandidate;
  totalScore: number;
  breakdown: {
    personalityMatch: number;
    learnedTasteMatch: number;
    budgetMatch: number;
    moodMatch: number;
    weatherMatch?: number;
    distanceKm?: number;
    travelTimeMinutes?: number;
    collaborativeBonus?: number;
    cooldownStatus: {
      isAvailable: boolean;
      daysRemaining: number;
      lastVisitedDate?: string;
    };
    groupMemberScores?: {
      userId: string;
      userName: string;
      score: number;
      fairnessWeightApplied?: number;
    }[];
    minimumSatisfaction?: number;
    fairnessNote?: string;
    specialDayActive?: boolean;
    fromWishlist?: boolean;
    manualOverrideApplied?: string;
  };
  matchReasons: string[];
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

export interface GroupMemberSession {
  userId: string;
  name: string;
  avatar: string;
  joinedAt: string;
  vote?: 'yes' | 'no' | 'neutral';
  recentFairnessScore?: number;
}

export interface GroupSession {
  id: string;
  code: string;
  creatorId: string;
  name: string;
  itemType: ItemType | 'all';
  targetBudget?: BudgetLevel;
  status: 'lobby' | 'calculating' | 'decided' | 'voting';
  members: GroupMemberSession[];
  candidateVenues?: VenueCandidate[];
  votes?: Record<string, { approvedVenueIds: string[]; vetoedVenueIds: string[] }>;
  recommendation?: ScoredRecommendation;
  finalDecision?: VenueCandidate | null;
  fairnessExplanation?: string;
  rejectStreakCount: number;
  createdAt: string;
}

// Multi-Stop Sequential Itinerary Types
export interface ItineraryStop {
  step: number;
  phase: 'dinner' | 'coffee_dessert' | 'nightlife_activity';
  phaseTitleTr: string;
  venue: VenueCandidate;
  transitionTip: string;
  distanceFromPrevKm?: number;
}

export interface ItineraryPlan {
  id: string;
  title: string;
  theme: string;
  stops: ItineraryStop[];
  totalEstimatedDurationHours: number;
  totalEstimatedBudget: number;
  summaryExplanation: string;
}

// Quick Onboarding / Tinder-style Swipe Types
export interface OnboardingSwipeCard {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  vibe: 'chill' | 'energetic' | 'romantic' | 'cozy' | 'trendy' | 'adventurous';
  tags: string[];
  imageUrl: string;
  description: string;
}

// --- COUPLE MODE TYPES ---
export interface SpecialDay {
  id: string;
  coupleId: string;
  name: string;
  date: string;
  type: 'anniversary' | 'first_date' | 'birthday' | 'custom';
  isRecurring: boolean;
}

export interface SharedWishlistItem {
  id: string;
  coupleId: string;
  venueId?: string;
  title: string;
  category: string;
  addedByUserId: string;
  addedByName: string;
  addedDate: string;
  isVisited: boolean;
}

export interface SurpriseRequest {
  id: string;
  coupleId: string;
  plannerUserId: string;
  receiverUserId: string;
  targetDateTime: string;
  budgetLevel?: BudgetLevel;
  stylePreference?: 'romantic' | 'active_adventurous' | 'cozy_dinner';
  venueId: string;
  venue: VenueCandidate;
  receiverTeaser: string;
  status: 'planning' | 'ready' | 'completed';
  plannerFeedback?: 'liked' | 'neutral' | 'disliked';
  receiverFeedback?: 'liked' | 'neutral' | 'disliked';
  createdAt: string;
}

export interface CoupleMemory {
  id: string;
  title: string;
  date: string;
  venueName: string;
  photoUrl?: string;
  note?: string;
}

export interface CoupleProfile {
  id: string;
  user1Id: string;
  user2Id: string;
  user1Name: string;
  user2Name: string;
  pairingCode: string;
  relationshipStartDate?: string;
  specialDates: SpecialDay[];
  sharedWishlist: SharedWishlistItem[];
  activeSurprises: SurpriseRequest[];
  sharedMemories: CoupleMemory[];
  surpriseAffinities?: Record<string, number>;
  routineWarnings: string[];
  createdAt: string;
}
