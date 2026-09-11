import {
  User,
  VenueCandidate,
  ScoredRecommendation,
  SingleRecommendationResponse,
  GroupSession,
  CoupleProfile,
  ActivityLog,
  ItemType,
  BudgetLevel,
  RejectReasonTag,
  SurpriseRequest,
  ItineraryPlan,
  OnboardingSwipeCard
} from '../types/index.js';

const API_BASE = '/api';

async function fetchWithError(url: string, options?: RequestInit, retries = 2, delay = 500): Promise<any> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      let errorMsg = 'Bilinmeyen bir hata oluştu';
      try {
        const data = await res.json();
        errorMsg = data.error || data.message || errorMsg;
      } catch (e) {}
      
      // Don't retry 4xx errors (client errors) except 429 Too Many Requests
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        throw new Error(errorMsg);
      }
      
      // Throw to trigger the catch block for retry on 5xx or 429
      throw new Error(errorMsg);
    }
    return res.json();
  } catch (error: any) {
    if (retries > 0) {
      console.warn(`[API] Fetch failed for ${url}. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithError(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
}


export async function fetchUsers(): Promise<User[]> {
  return fetchWithError(`${API_BASE}/users`);
}

export async function fetchUser(userId: string): Promise<User> {
  return fetchWithError(`${API_BASE}/users/${userId}`);
}

export async function createUser(data: Partial<User>): Promise<User> {
  return fetchWithError(`${API_BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export async function updateUserPersonality(userId: string, data: any): Promise<User> {
  return fetchWithError(`${API_BASE}/users/${userId}/personality`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export async function updateUserCooldowns(userId: string, cooldowns: Record<string, number>): Promise<User> {
  return fetchWithError(`${API_BASE}/users/${userId}/cooldowns`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cooldownOverrides: cooldowns })
  });
}

// Single Recommendation Endpoint
export async function getSingleRecommendation(params: {
  userId: string;
  type?: ItemType | 'all';
  budget?: BudgetLevel;
  streak?: number;
  broadFilter?: string;
  exploreMode?: boolean;
  userLat?: number;
  userLng?: number;
  transportMode?: 'walking' | 'transit' | 'driving';
  weatherCondition?: string;
  temperature?: number;
}): Promise<SingleRecommendationResponse> {
  const query = new URLSearchParams();
  query.append('userId', params.userId);
  if (params.type) query.append('type', params.type);
  if (params.budget) query.append('budget', params.budget.toString());
  if (params.streak !== undefined) query.append('streak', params.streak.toString());
  if (params.broadFilter) query.append('broadFilter', params.broadFilter);
  if (params.exploreMode) query.append('exploreMode', 'true');
  if (params.userLat) query.append('userLat', params.userLat.toString());
  if (params.userLng) query.append('userLng', params.userLng.toString());
  if (params.transportMode) query.append('transportMode', params.transportMode);
  if (params.weatherCondition) query.append('weatherCondition', params.weatherCondition);
  if (params.temperature !== undefined) query.append('temperature', params.temperature.toString());

  return fetchWithError(`${API_BASE}/recommendations/single?${query.toString()}`);
}

// Multi-Stop Itinerary Generator
export async function fetchItinerary(params: {
  userId: string;
  theme?: string;
  userLocation?: { lat: number; lng: number };
  weather?: { condition: string; temperature: number };
}): Promise<ItineraryPlan> {
  return fetchWithError(`${API_BASE}/recommendations/itinerary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
}

// Reject Recommendation with Reason Tag
export async function rejectRecommendation(data: {
  userId: string;
  venueId: string;
  reasonTag: RejectReasonTag;
  streak: number;
}): Promise<SingleRecommendationResponse> {
  return fetchWithError(`${API_BASE}/recommendations/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

// Activities & Cooldowns
export async function fetchActivities(userId: string): Promise<{
  logs: ActivityLog[];
  activeCooldowns: { category: string; daysRemaining: number; lastDate: string }[];
}> {
  return fetchWithError(`${API_BASE}/activities?userId=${userId}`);
}

export async function createActivityLog(data: Partial<ActivityLog>): Promise<ActivityLog> {
  return fetchWithError(`${API_BASE}/activities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export async function submitActivityFeedback(logId: string, feedback: 'liked' | 'neutral' | 'disliked', rating?: number): Promise<ActivityLog> {
  return fetchWithError(`${API_BASE}/activities/${logId}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ feedback, rating })
  });
}

// Group Sessions
export async function createGroupSession(data: {
  creatorId: string;
  name: string;
  itemType?: ItemType | 'all';
  targetBudget?: BudgetLevel;
}): Promise<GroupSession> {
  return fetchWithError(`${API_BASE}/groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export async function fetchGroupSession(codeOrId: string): Promise<GroupSession> {
  return fetchWithError(`${API_BASE}/groups/${codeOrId}`);
}

export async function joinGroupSession(codeOrId: string, userId: string): Promise<GroupSession> {
  return fetchWithError(`${API_BASE}/groups/${codeOrId}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  });
}

export async function calculateGroupMatch(codeOrId: string): Promise<GroupSession> {
  return fetchWithError(`${API_BASE}/groups/${codeOrId}/calculate`, {
    method: 'POST'
  });
}

export async function voteGroupSession(codeOrId: string, userId: string, vote: 'yes' | 'no' | 'neutral'): Promise<GroupSession> {
  return fetchWithError(`${API_BASE}/groups/${codeOrId}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, vote })
  });
}

export async function finalizeGroupDecision(codeOrId: string): Promise<GroupSession> {
  return fetchWithError(`${API_BASE}/groups/${codeOrId}/finalize`, {
    method: 'POST'
  });
}

// Couple Mode
export async function fetchCoupleProfile(userId: string): Promise<CoupleProfile | null> {
  return fetchWithError(`${API_BASE}/couples/user/${userId}`);
}

export async function pairPartner(userId: string, partnerCode: string): Promise<CoupleProfile> {
  return fetchWithError(`${API_BASE}/couples/pair`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, partnerCode })
  });
}

export async function recommendCoupleDecision(coupleId: string, params: {
  requesterUserId: string;
  isSpecialDayMode?: boolean;
  manualOverrideTarget?: 'partner' | 'self' | 'none';
}): Promise<ScoredRecommendation> {
  return fetchWithError(`${API_BASE}/couples/${coupleId}/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
}

export async function createSurprisePlan(coupleId: string, data: {
  plannerUserId: string;
  targetDateTime: string;
  stylePreference?: string;
  budgetLevel?: BudgetLevel;
}): Promise<SurpriseRequest> {
  return fetchWithError(`${API_BASE}/couples/${coupleId}/surprise`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export async function submitSurpriseFeedback(surpriseId: string, data: {
  userId: string;
  feedback: 'liked' | 'neutral' | 'disliked';
}): Promise<any> {
  return fetchWithError(`${API_BASE}/couples/surprise/${surpriseId}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export async function addSharedWishlist(coupleId: string, data: {
  title: string;
  category: string;
  venueId?: string;
  addedByUserId: string;
}): Promise<CoupleProfile> {
  return fetchWithError(`${API_BASE}/couples/${coupleId}/wishlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export async function fetchCoupleSuggestions(coupleId: string): Promise<{
  routineBreakers: ScoredRecommendation[];
  romanticDates: ScoredRecommendation[];
  anniversaryAlert?: string;
}> {
  return fetchWithError(`${API_BASE}/couples/${coupleId}/suggestions`);
}

export async function addCoupleMemory(coupleId: string, data: { title: string; venueName: string; note?: string }): Promise<CoupleProfile> {
  return fetchWithError(`${API_BASE}/couples/${coupleId}/memories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export async function fetchVenues(params?: any): Promise<VenueCandidate[]> {
  const query = new URLSearchParams(params || {});
  return fetchWithError(`${API_BASE}/venues?${query.toString()}`);
}

// Group Voting Mode APIs
export async function startGroupVoting(idOrCode: string): Promise<GroupSession> {
  return fetchWithError(`${API_BASE}/groups/${idOrCode}/start-voting`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function submitGroupVote(idOrCode: string, data: {
  userId: string;
  approvedVenueIds: string[];
  vetoedVenueIds: string[];
}): Promise<GroupSession> {
  return fetchWithError(`${API_BASE}/groups/${idOrCode}/submit-vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export async function finalizeGroupVote(idOrCode: string): Promise<GroupSession> {
  return fetchWithError(`${API_BASE}/groups/${idOrCode}/finalize-vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
}

// Onboarding Quick Swipe APIs
export async function fetchOnboardingCards(): Promise<OnboardingSwipeCard[]> {
  return fetchWithError(`${API_BASE}/profile/onboarding-cards`);
}

export async function submitQuickSwipe(data: {
  userId: string;
  cardId: string;
  action: 'like' | 'dislike';
}): Promise<{ success: boolean; user: User }> {
  return fetchWithError(`${API_BASE}/profile/quick-swipe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}
