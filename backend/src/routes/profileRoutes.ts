import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/store.js';
import { User, CorePersonalityVector } from '../types/index.js';
import { LearningEngine, ONBOARDING_SWIPE_CARDS } from '../engine/learningEngine.js';

const router = Router();

// Get all users (demo selector)
router.get('/users', (req, res) => {
  try {
    res.json(db.getAllUsers());
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Kullanıcılar getirilemedi' });
  }
});

// Get user profile
router.get('/users/:id', (req, res) => {
  try {
    const user = db.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Profil getirilemedi' });
  }
});

// Create new user (short core onboarding questionnaire)
router.post('/users', (req, res) => {
  try {
    const { name, age, location, corePersonality } = req.body;

    const defaultCore: CorePersonalityVector = {
      explorationTendency: corePersonality?.explorationTendency || 'novelty_seeker',
      spontaneity: corePersonality?.spontaneity || 'spontaneous',
      socialEnergy: corePersonality?.socialEnergy || 'energetic_social',
      budgetFlexibility: corePersonality?.budgetFlexibility || 'flexible'
    };

    const newUser: User = {
      id: `user-${uuidv4().slice(0, 8)}`,
      name: name?.trim() || 'Yeni Kullanıcı',
      age: age || 25,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name || 'user')}`,
      location: location || { city: 'İstanbul', district: 'Kadıköy' },
      corePersonality: defaultCore,
      preferences: {
        energyLevel: defaultCore.socialEnergy === 'energetic_social' ? 'active' : 'calm',
        socialLevel: 'balanced',
        adventureLevel: defaultCore.explorationTendency === 'novelty_seeker' ? 'adventurous' : 'traditional',
        budgetPreference: defaultCore.budgetFlexibility === 'strict_budget' ? 1 : 2,
        foodPreferences: [],
        dietaryRestrictions: [],
        activityPreferences: []
      },
      preferenceWeights: {
        burger: 1.0,
        italyan: 1.0,
        kebap: 1.0,
        uzakdogu: 1.0,
        ev_yemekleri: 1.0,
        kahve_tatli: 1.0
      },
      cooldownOverrides: {},
      createdAt: new Date().toISOString()
    };

    db.saveUser(newUser);
    res.status(201).json(newUser);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Kullanıcı oluşturulamadı' });
  }
});

// Update core personality or preferences
router.put('/users/:id/personality', (req, res) => {
  try {
    const user = db.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    if (req.body.corePersonality) {
      user.corePersonality = {
        ...user.corePersonality,
        ...req.body.corePersonality
      };
    }

    if (req.body.preferences) {
      user.preferences = {
        ...user.preferences,
        ...req.body.preferences
      };
    }

    db.saveUser(user);
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Kişilik profili güncellenemedi' });
  }
});

// Update cooldown overrides
router.put('/users/:id/cooldowns', (req, res) => {
  try {
    const user = db.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    user.cooldownOverrides = req.body.cooldownOverrides || {};
    db.saveUser(user);
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Soğuma süreleri güncellenemedi' });
  }
});

// GET /api/profile/onboarding-cards (Tinder-style calibration deck)
router.get('/profile/onboarding-cards', (req, res) => {
  try {
    res.json(ONBOARDING_SWIPE_CARDS);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Kartlar yüklenemedi' });
  }
});

// POST /api/profile/quick-swipe (Instant calibrate weights from swipe)
router.post('/profile/quick-swipe', (req, res) => {
  try {
    const { userId, cardId, action } = req.body;
    if (!userId || !cardId || !action) {
      return res.status(400).json({ error: 'userId, cardId ve action (like/dislike) zorunludur' });
    }

    const updatedUser = LearningEngine.processQuickSwipe(userId, cardId, action);
    if (!updatedUser) {
      return res.status(404).json({ error: 'Kullanıcı veya kart bulunamadı' });
    }

    res.json({ success: true, user: updatedUser });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Zevk kalibrasyonu işlenirken hata oluştu' });
  }
});

export default router;
