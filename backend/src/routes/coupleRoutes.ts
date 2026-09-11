import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/store.js';
import { CoupleProfile, CoupleMemory, SharedWishlistItem } from '../types/index.js';
import { CoupleEngine } from '../engine/coupleEngine.js';

const router = Router();

// GET /api/couples/user/:userId
router.get('/couples/user/:userId', (req, res) => {
  try {
    const couple = db.getCoupleProfile(req.params.userId);
    if (!couple) {
      return res.json(null);
    }
    res.json(couple);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/couples/pair
router.post('/couples/pair', (req, res) => {
  try {
  const { userId, partnerCode } = req.body;
  const user = db.getUser(userId);
  if (!user) {
    return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
  }

  let couple = db.getCoupleByPairingCode(partnerCode);

  if (couple) {
    if (couple.user1Id !== userId && couple.user2Id !== userId) {
      couple.user2Id = userId;
      couple.user2Name = user.name;
      user.partnerId = couple.user1Id;
      db.saveUser(user);
      db.saveCoupleProfile(couple);
    }
  } else {
    couple = {
      id: `couple-${uuidv4().slice(0, 8)}`,
      user1Id: userId,
      user2Id: '',
      user1Name: user.name,
      user2Name: 'Partner Bekleniyor',
      pairingCode: partnerCode.toUpperCase(),
      specialDates: [
        { id: `sp-${uuidv4().slice(0, 6)}`, coupleId: '', name: 'Birlikte İlk Gün', date: new Date().toISOString().split('T')[0], type: 'first_date', isRecurring: true }
      ],
      sharedWishlist: [],
      activeSurprises: [],
      sharedMemories: [],
      surpriseAffinities: {},
      routineWarnings: [],
      createdAt: new Date().toISOString()
    };
    db.saveCoupleProfile(couple);
  }

  res.json(couple);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/couples/:coupleId/recommend (Single Clear Couple Recommendation with Fairness/Override)
router.post('/couples/:coupleId/recommend', (req, res) => {
  try {
    const { requesterUserId = 'user-1', isSpecialDayMode, manualOverrideTarget } = req.body;

    const winner = CoupleEngine.recommendForCouple({
      coupleId: req.params.coupleId,
      requesterUserId,
      isSpecialDayMode,
      manualOverrideTarget
    });

    res.json(winner);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/couples/:coupleId/surprise (Plan a secret surprise)
router.post('/couples/:coupleId/surprise', (req, res) => {
  try {
    const { plannerUserId, targetDateTime, stylePreference, budgetLevel } = req.body;

    const surprise = CoupleEngine.createSurprisePlan(
      req.params.coupleId,
      plannerUserId,
      targetDateTime,
      stylePreference,
      budgetLevel
    );

    res.status(201).json(surprise);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/couples/surprise/:id/feedback
router.post('/couples/surprise/:id/feedback', (req, res) => {
  try {
    const { userId, feedback } = req.body;
    CoupleEngine.recordSurpriseFeedback(req.params.id, userId, feedback);
    res.json({ status: 'ok' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/couples/:coupleId/wishlist
router.post('/couples/:coupleId/wishlist', (req, res) => {
  try {
  const { title, category, venueId, addedByUserId } = req.body;
  const couple = db.getAllCoupleProfiles().find(
    c => c.id === req.params.coupleId
  );

  if (!couple) {
    return res.status(404).json({ error: 'Çift profili bulunamadı' });
  }

  const user = db.getUser(addedByUserId);

  const item: SharedWishlistItem = {
    id: `wish-${uuidv4().slice(0, 8)}`,
    coupleId: couple.id,
    venueId,
    title,
    category: category || 'diger',
    addedByUserId,
    addedByName: user?.name || 'Partner',
    addedDate: new Date().toISOString().split('T')[0],
    isVisited: false
  };

  if (!couple.sharedWishlist) couple.sharedWishlist = [];
  couple.sharedWishlist.unshift(item);
  db.saveCoupleProfile(couple);

  res.status(201).json(couple);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/couples/:coupleId/suggestions
router.get('/couples/:coupleId/suggestions', (req, res) => {
  try {
    const suggestions = CoupleEngine.getCoupleSuggestions(req.params.coupleId);
    res.json(suggestions);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/couples/:coupleId/memories
router.post('/couples/:coupleId/memories', (req, res) => {
  try {
  const { title, venueName, date, note } = req.body;
  const couple = db.getAllCoupleProfiles().find(
    c => c.id === req.params.coupleId
  );

  if (!couple) {
    return res.status(404).json({ error: 'Çift profili bulunamadı' });
  }

  const memory: CoupleMemory = {
    id: `mem-${uuidv4().slice(0, 8)}`,
    title,
    venueName,
    date: date || new Date().toISOString().split('T')[0],
    note
  };

  couple.sharedMemories.unshift(memory);
  db.saveCoupleProfile(couple);

  res.status(201).json(couple);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
