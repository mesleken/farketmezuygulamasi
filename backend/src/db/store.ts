import fs from 'fs';
import path from 'path';
import {
  User,
  ActivityLog,
  GroupSession,
  CoupleProfile,
  VenueCandidate,
  RecommendationFeedback,
  GroupFairnessScore,
  DailyContext,
  CoupleFairnessScore,
  SurpriseRequest,
  SharedWishlistItem,
  SpecialDay
} from '../types/index.js';
import { mockVenues } from './mockVenues.js';

export interface DatabaseData {
  users: Record<string, User>;
  activityLogs: ActivityLog[];
  groupSessions: Record<string, GroupSession>;
  coupleProfiles: Record<string, CoupleProfile>;
  venues: VenueCandidate[];
  feedbacks: RecommendationFeedback[];
  groupFairnessScores: GroupFairnessScore[];
  coupleFairnessScores: CoupleFairnessScore[];
  dailyContexts: Record<string, DailyContext>;
}

const DB_FILE = path.resolve(process.cwd(), 'data-store.json');
const todayStr = new Date().toISOString().split('T')[0];

const defaultUsers: Record<string, User> = {
  'user-1': {
    id: 'user-1',
    name: 'Can',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    age: 26,
    location: { city: 'İstanbul', district: 'Kadıköy', lat: 40.99, lng: 29.03 },
    corePersonality: {
      explorationTendency: 'novelty_seeker',
      spontaneity: 'spontaneous',
      socialEnergy: 'energetic_social',
      budgetFlexibility: 'flexible'
    },
    preferences: {
      energyLevel: 'active',
      socialLevel: 'extrovert',
      adventureLevel: 'adventurous',
      budgetPreference: 2,
      foodPreferences: ['burger', 'italyan', 'sokak_lezzetleri', 'uzakdogu'],
      dietaryRestrictions: [],
      activityPreferences: ['eglence_oyun', 'spor_outdoor', 'sinema_tiyatro']
    },
    preferenceWeights: {
      burger: 1.3,
      italyan: 1.1,
      kebap: 0.9,
      uzakdogu: 1.2,
      ev_yemekleri: 0.8,
      kahve_tatli: 1.0,
      eglence_oyun: 1.4,
      spor_outdoor: 1.2
    },
    cooldownOverrides: {},
    partnerId: 'user-2',
    createdAt: new Date().toISOString()
  },
  'user-2': {
    id: 'user-2',
    name: 'Zeynep',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    age: 25,
    location: { city: 'İstanbul', district: 'Kadıköy', lat: 40.99, lng: 29.03 },
    corePersonality: {
      explorationTendency: 'novelty_seeker',
      spontaneity: 'planner',
      socialEnergy: 'calm_peaceful',
      budgetFlexibility: 'flexible'
    },
    preferences: {
      energyLevel: 'balanced',
      socialLevel: 'balanced',
      adventureLevel: 'open',
      budgetPreference: 3,
      foodPreferences: ['italyan', 'kahve_tatli', 'uzakdogu', 'vejetaryen'],
      dietaryRestrictions: ['vejetaryen'],
      activityPreferences: ['kultur_sanat', 'kafe_sohbet', 'sinema_tiyatro']
    },
    preferenceWeights: {
      italyan: 1.4,
      kahve_tatli: 1.3,
      uzakdogu: 1.1,
      vejetaryen: 1.5,
      kultur_sanat: 1.4,
      burger: 0.8
    },
    cooldownOverrides: {},
    partnerId: 'user-1',
    createdAt: new Date().toISOString()
  },
  'user-3': {
    id: 'user-3',
    name: 'Mert',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
    age: 27,
    location: { city: 'İstanbul', district: 'Beşiktaş', lat: 41.04, lng: 29.00 },
    corePersonality: {
      explorationTendency: 'familiarity_preferred',
      spontaneity: 'spontaneous',
      socialEnergy: 'energetic_social',
      budgetFlexibility: 'strict_budget'
    },
    preferences: {
      energyLevel: 'active',
      socialLevel: 'extrovert',
      adventureLevel: 'traditional',
      budgetPreference: 2,
      foodPreferences: ['kebap', 'burger', 'sokak_lezzetleri'],
      dietaryRestrictions: [],
      activityPreferences: ['spor_outdoor', 'eglence_oyun', 'gece_hayati']
    },
    preferenceWeights: {
      kebap: 1.4,
      burger: 1.2,
      spor_outdoor: 1.3
    },
    cooldownOverrides: {},
    createdAt: new Date().toISOString()
  },
  'user-4': {
    id: 'user-4',
    name: 'Selin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    age: 24,
    location: { city: 'İstanbul', district: 'Beyoğlu', lat: 41.03, lng: 28.98 },
    corePersonality: {
      explorationTendency: 'novelty_seeker',
      spontaneity: 'planner',
      socialEnergy: 'calm_peaceful',
      budgetFlexibility: 'strict_budget'
    },
    preferences: {
      energyLevel: 'calm',
      socialLevel: 'introvert',
      adventureLevel: 'open',
      budgetPreference: 2,
      foodPreferences: ['ev_yemekleri', 'kahve_tatli', 'vejetaryen', 'uzakdogu'],
      dietaryRestrictions: [],
      activityPreferences: ['kultur_sanat', 'kafe_sohbet']
    },
    preferenceWeights: {
      ev_yemekleri: 1.4,
      kahve_tatli: 1.3,
      kultur_sanat: 1.4
    },
    cooldownOverrides: {},
    createdAt: new Date().toISOString()
  }
};

const defaultGroupFairnessScores: GroupFairnessScore[] = [
  { userId: 'user-1', groupId: 'past-1', satisfactionScore: 0.92, timestamp: '2026-09-01' },
  { userId: 'user-3', groupId: 'past-1', satisfactionScore: 0.88, timestamp: '2026-09-01' },
  { userId: 'user-4', groupId: 'past-1', satisfactionScore: 0.45, timestamp: '2026-09-01' },
  { userId: 'user-4', groupId: 'past-2', satisfactionScore: 0.50, timestamp: '2026-09-05' }
];

const defaultCoupleFairnessScores: CoupleFairnessScore[] = [
  { coupleId: 'couple-1', userId: 'user-1', satisfactionScore: 0.85, isManualOverride: false, timestamp: '2026-09-02' },
  { coupleId: 'couple-1', userId: 'user-2', satisfactionScore: 0.80, isManualOverride: false, timestamp: '2026-09-02' }
];

const defaultSpecialDays: SpecialDay[] = [
  { id: 'sp-1', coupleId: 'couple-1', name: 'Yıldönümü', date: '2026-04-15', type: 'anniversary', isRecurring: true },
  { id: 'sp-2', coupleId: 'couple-1', name: 'İlk Buluşma (Trattoria Bella)', date: '2026-03-20', type: 'first_date', isRecurring: true },
  { id: 'sp-3', coupleId: 'couple-1', name: 'Zeynep Doğum Günü', date: '2026-07-12', type: 'birthday', isRecurring: true }
];

const defaultWishlist: SharedWishlistItem[] = [
  {
    id: 'wish-1',
    coupleId: 'couple-1',
    venueId: 'act-4',
    title: 'Kil & Kahve Sanat Seramik Atölyesi',
    category: 'kultur_sanat',
    addedByUserId: 'user-2',
    addedByName: 'Zeynep',
    addedDate: '2026-09-02',
    isVisited: false
  },
  {
    id: 'wish-2',
    coupleId: 'couple-1',
    venueId: 'act-7',
    title: 'Jazz & Velvet Akustik Canlı Müzik Bar',
    category: 'gece_hayati',
    addedByUserId: 'user-1',
    addedByName: 'Can',
    addedDate: '2026-09-06',
    isVisited: false
  }
];

const defaultSurprises: SurpriseRequest[] = [
  {
    id: 'surp-1',
    coupleId: 'couple-1',
    plannerUserId: 'user-1',
    receiverUserId: 'user-2',
    targetDateTime: 'Cuma 19:30',
    venueId: 'act-4',
    venue: mockVenues.find(v => v.id === 'act-4')!,
    receiverTeaser: 'Cuma 19:30\'da hazır ol! Yaratıcı bir sürpriz seni bekliyor 🤫',
    status: 'ready',
    createdAt: new Date().toISOString()
  }
];

const defaultCoupleProfiles: Record<string, CoupleProfile> = {
  'couple-1': {
    id: 'couple-1',
    user1Id: 'user-1',
    user2Id: 'user-2',
    user1Name: 'Can',
    user2Name: 'Zeynep',
    pairingCode: 'LOVE24',
    relationshipStartDate: '2023-04-15',
    specialDates: defaultSpecialDays,
    sharedWishlist: defaultWishlist,
    activeSurprises: defaultSurprises,
    sharedMemories: [
      {
        id: 'mem-1',
        title: 'İlk Pizza Akşamımız',
        date: '2023-03-20',
        venueName: 'Trattoria Bella Napoli',
        note: 'Birlikte ilk kez gittiğimiz ve en sevdiğimiz pizza yeri!'
      }
    ],
    surpriseAffinities: {
      kultur_sanat: 1.4,
      gece_hayati: 1.3,
      spor_outdoor: 1.1
    },
    routineWarnings: [
      'Son 1 ayda 3 kez aynı İtalyan restoranına gittiniz! Bu akşam Seramik Atölyesi veya Canlı Caz Deneyimi ile rutini kırmaya ne dersiniz?'
    ],
    createdAt: new Date().toISOString()
  }
};

const defaultActivityLogs: ActivityLog[] = [
  {
    id: 'log-1',
    userId: 'user-1',
    userName: 'Can',
    venueId: 'venue-1',
    title: 'Smash & Craft Burger Lab',
    category: 'burger',
    type: 'food',
    location: 'Kadıköy',
    date: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    rating: 5,
    feedback: 'liked',
    priceLevel: 2,
    cooldownDays: 3,
    notes: 'Trüflü patates harikaydı.'
  },
  {
    id: 'log-2',
    userId: 'user-1',
    userName: 'Can',
    venueId: 'act-2',
    title: 'Neon Strike Bowling',
    category: 'eglence_oyun',
    type: 'activity',
    location: 'Üsküdar',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    rating: 4,
    feedback: 'liked',
    priceLevel: 2,
    cooldownDays: 5
  },
  {
    id: 'log-3',
    userId: 'user-2',
    userName: 'Zeynep',
    venueId: 'venue-2',
    title: 'Trattoria Bella Napoli',
    category: 'italyan',
    type: 'food',
    location: 'Kadıköy',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    rating: 5,
    feedback: 'liked',
    priceLevel: 3,
    cooldownDays: 4,
    isCouple: true
  }
];

export function seedUserPreferences(user: User): User {
  if (!user.preferenceWeights || Object.keys(user.preferenceWeights).length === 0) {
    user.preferenceWeights = {};
    const cp = user.corePersonality;
    if (cp) {
      if (cp.explorationTendency === 'novelty_seeker') {
        user.preferenceWeights['uzakdogu'] = 1.25;
        user.preferenceWeights['kultur_sanat'] = 1.20;
        user.preferenceWeights['eglence_oyun'] = 1.15;
      } else {
        user.preferenceWeights['kebap'] = 1.25;
        user.preferenceWeights['ev_yemekleri'] = 1.25;
        user.preferenceWeights['burger'] = 1.20;
      }

      if (cp.socialEnergy === 'energetic_social') {
        user.preferenceWeights['spor_outdoor'] = 1.25;
        user.preferenceWeights['eglence_oyun'] = Math.max(user.preferenceWeights['eglence_oyun'] || 1.0, 1.25);
        user.preferenceWeights['gece_hayati'] = 1.20;
      } else {
        user.preferenceWeights['kahve_tatli'] = 1.25;
        user.preferenceWeights['kafe_sohbet'] = 1.20;
        user.preferenceWeights['kultur_sanat'] = Math.max(user.preferenceWeights['kultur_sanat'] || 1.0, 1.20);
      }
    }
  }
  user.vibeWeights = user.vibeWeights || {};
  user.districtWeights = user.districtWeights || {};
  user.tagWeights = user.tagWeights || {};
  user.feedbackCount = user.feedbackCount ?? 0;
  return user;
}

class Store {
  private data: DatabaseData;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseData {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.users && parsed.venues) {
          parsed.feedbacks = parsed.feedbacks || [];
          parsed.groupFairnessScores = parsed.groupFairnessScores || defaultGroupFairnessScores;
          parsed.coupleFairnessScores = parsed.coupleFairnessScores || defaultCoupleFairnessScores;
          parsed.dailyContexts = parsed.dailyContexts || {};

          // Sync mock venues with parsed venues to ensure spatial & weather metadata and new venues exist
          const existingMap = new Map((parsed.venues as VenueCandidate[]).map(v => [v.id, v]));
          parsed.venues = mockVenues.map(mock => {
            const existing = existingMap.get(mock.id);
            return existing
              ? {
                  ...existing,
                  isIndoor: mock.isIndoor,
                  hasTerrace: mock.hasTerrace,
                  isCozy: mock.isCozy,
                  busynessLevel: mock.busynessLevel,
                  lat: mock.lat,
                  lng: mock.lng,
                  categoryNameTr: mock.categoryNameTr
                }
              : mock;
          });

          // Ensure users have seeded weights
          for (const u of Object.values(parsed.users as Record<string, User>)) {
            seedUserPreferences(u);
          }

          // Ensure couple profiles have all extended fields
          if (parsed.coupleProfiles) {
            for (const c of Object.values(parsed.coupleProfiles as Record<string, CoupleProfile>)) {
              c.specialDates = c.specialDates || defaultSpecialDays;
              c.sharedWishlist = c.sharedWishlist || defaultWishlist;
              c.activeSurprises = c.activeSurprises || defaultSurprises;
              c.surpriseAffinities = c.surpriseAffinities || { kultur_sanat: 1.4 };
            }
          }

          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not load database file, creating fresh in-memory store:', e);
      try {
        if (fs.existsSync(DB_FILE)) {
          const backupFile = `${DB_FILE}.corrupt.${Date.now()}.bak`;
          fs.copyFileSync(DB_FILE, backupFile);
          console.warn(`[Store] Corrupted DB file backed up to: ${backupFile}`);
        }
      } catch (backupErr) {
        console.error('[Store] Failed to backup corrupted DB file:', backupErr);
      }
    }

    const initialUsers = { ...defaultUsers };
    for (const u of Object.values(initialUsers)) {
      seedUserPreferences(u);
    }

    const initial: DatabaseData = {
      users: initialUsers,
      activityLogs: defaultActivityLogs,
      groupSessions: {},
      coupleProfiles: defaultCoupleProfiles,
      venues: mockVenues,
      feedbacks: [],
      groupFairnessScores: defaultGroupFairnessScores,
      coupleFairnessScores: defaultCoupleFairnessScores,
      dailyContexts: {}
    };
    this.saveData(initial);
    return initial;
  }

  private savePromise: Promise<void> | null = null;
  private pendingSave = false;

  public async flush(): Promise<void> {
    if (this.savePromise) {
      await this.savePromise;
    }
    if (this.pendingSave) {
      await this.saveData();
    }
  }

  private async saveData(dataToSave?: DatabaseData): Promise<void> {
    if (this.savePromise) {
      this.pendingSave = true;
      return;
    }

    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    try {
      const dataStr = JSON.stringify(dataToSave || this.data, null, 2);
      this.savePromise = (async () => {
        await fs.promises.writeFile(tempFile, dataStr, 'utf-8');
        try {
          await fs.promises.rename(tempFile, DB_FILE);
        } catch (renameErr) {
          // Fallback if cross-device or Windows rename lock occurs
          await fs.promises.copyFile(tempFile, DB_FILE);
          await fs.promises.unlink(tempFile).catch(() => {});
        }
      })();
      await this.savePromise;
    } catch (e) {
      console.error('[Store] Error writing database to disk:', e);
      try {
        if (fs.existsSync(tempFile)) {
          await fs.promises.unlink(tempFile).catch(() => {});
        }
      } catch {}
    } finally {
      this.savePromise = null;
      if (this.pendingSave) {
        this.pendingSave = false;
        await this.saveData();
      }
    }
  }

  // --- USERS ---
  getUser(id: string): User | undefined {
    return this.data.users[id];
  }

  getAllUsers(): User[] {
    return Object.values(this.data.users);
  }

  saveUser(user: User): User {
    seedUserPreferences(user);
    this.data.users[user.id] = user;
    this.saveData();
    return user;
  }

  // --- VENUES ---
  getAllVenues(): VenueCandidate[] {
    return this.data.venues;
  }

  getVenueById(id: string): VenueCandidate | undefined {
    return this.data.venues.find(v => v.id === id);
  }

  // --- ACTIVITY LOGS ---
  getUserLogs(userId: string): ActivityLog[] {
    return this.data.activityLogs
      .filter(l => l.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  addActivityLog(log: ActivityLog): ActivityLog {
    this.data.activityLogs.unshift(log);
    this.saveData();
    return log;
  }

  updateActivityFeedback(logId: string, feedback: 'liked' | 'neutral' | 'disliked', rating?: number): ActivityLog | undefined {
    const log = this.data.activityLogs.find(l => l.id === logId);
    if (log) {
      log.feedback = feedback;
      if (rating) log.rating = rating;
      this.saveData();
    }
    return log;
  }

  // --- FEEDBACKS & REJECTIONS ---
  getUserFeedbacks(userId: string): RecommendationFeedback[] {
    return this.data.feedbacks.filter(f => f.userId === userId);
  }

  addFeedback(feedback: RecommendationFeedback): RecommendationFeedback {
    this.data.feedbacks.unshift(feedback);
    this.saveData();
    return feedback;
  }

  // --- DAILY CONTEXT ---
  getDailyContext(userId: string, date = todayStr): DailyContext {
    const key = `${userId}_${date}`;
    if (!this.data.dailyContexts[key]) {
      this.data.dailyContexts[key] = {
        userId,
        date,
        temporaryExcludedCategories: [],
        sessionExcludedDistricts: []
      };
      this.saveData();
    } else {
      if (!this.data.dailyContexts[key].sessionExcludedDistricts) {
        this.data.dailyContexts[key].sessionExcludedDistricts = [];
      }
    }
    return this.data.dailyContexts[key];
  }

  updateDailyContext(context: DailyContext): DailyContext {
    const key = `${context.userId}_${context.date}`;
    this.data.dailyContexts[key] = context;
    this.saveData();
    return context;
  }

  // --- GROUP FAIRNESS ---
  getUserAverageFairness(userId: string): number {
    const userScores = this.data.groupFairnessScores
      .filter(s => s.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10); // Windowed to last 10 sessions

    if (userScores.length === 0) return 0.75;
    const sum = userScores.reduce((acc, curr) => acc + curr.satisfactionScore, 0);
    return Number((sum / userScores.length).toFixed(2));
  }

  recordGroupFairnessScore(score: GroupFairnessScore): void {
    this.data.groupFairnessScores.push(score);
    this.saveData();
  }

  // --- COUPLE FAIRNESS & EXTENSIONS ---
  getCoupleUserAverageSatisfaction(coupleId: string, userId: string): number {
    // Exclude manual overrides from auto-balance and window to last 10 sessions
    const scores = this.data.coupleFairnessScores
      .filter(s => s.coupleId === coupleId && s.userId === userId && !s.isManualOverride)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    if (scores.length === 0) return 0.8;
    const sum = scores.reduce((acc, curr) => acc + curr.satisfactionScore, 0);
    return Number((sum / scores.length).toFixed(2));
  }

  recordCoupleFairnessScore(score: CoupleFairnessScore): void {
    this.data.coupleFairnessScores.push(score);
    this.saveData();
  }

  // --- GROUP SESSIONS ---
  getGroupSession(idOrCode: string): GroupSession | undefined {
    const upper = idOrCode.toUpperCase();
    return Object.values(this.data.groupSessions).find(
      g => g.id === idOrCode || g.code.toUpperCase() === upper
    );
  }

  saveGroupSession(session: GroupSession): GroupSession {
    this.data.groupSessions[session.id] = session;
    this.saveData();
    return session;
  }

  // --- COUPLE PROFILES ---
  getAllCoupleProfiles(): CoupleProfile[] {
    return Object.values(this.data.coupleProfiles);
  }

  getCoupleProfileById(coupleId: string): CoupleProfile | undefined {
    return this.data.coupleProfiles[coupleId];
  }

  getCoupleProfile(userId: string): CoupleProfile | undefined {
    return Object.values(this.data.coupleProfiles).find(
      c => c.user1Id === userId || c.user2Id === userId
    );
  }

  getCoupleByPairingCode(code: string): CoupleProfile | undefined {
    return Object.values(this.data.coupleProfiles).find(
      c => c.pairingCode.toUpperCase() === code.toUpperCase()
    );
  }

  saveCoupleProfile(couple: CoupleProfile): CoupleProfile {
    this.data.coupleProfiles[couple.id] = couple;
    this.saveData();
    return couple;
  }
}

export const db = new Store();
