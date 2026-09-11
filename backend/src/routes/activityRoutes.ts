import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/store.js';
import { ActivityLog } from '../types/index.js';
import { LearningEngine } from '../engine/learningEngine.js';

const router = Router();

// GET /api/activities?userId=...
router.get('/activities', (req, res) => {
  try {
    const userId = (req.query.userId as string) || 'user-1';
    const logs = db.getUserLogs(userId);

    // Compute active cooldowns summary
    const user = db.getUser(userId);
    const cooldowns: { category: string; daysRemaining: number; lastDate: string }[] = [];

    const seenCategories = new Set<string>();
    for (const log of logs) {
      if (!seenCategories.has(log.category)) {
        seenCategories.add(log.category);
        const daysAllowed = user?.cooldownOverrides?.[log.category] ?? log.cooldownDays;
        const daysPassed = (Date.now() - new Date(log.date).getTime()) / (1000 * 60 * 60 * 24);
        if (daysPassed < daysAllowed) {
          cooldowns.push({
            category: log.category,
            daysRemaining: Math.ceil(daysAllowed - daysPassed),
            lastDate: log.date
          });
        }
      }
    }

    res.json({
      logs,
      activeCooldowns: cooldowns
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Aktiviteler getirilirken bir hata oluştu' });
  }
});

// POST /api/activities (Log an activity / accept recommendation)
router.post('/activities', (req, res) => {
  try {
    const {
      userId = 'user-1',
      venueId,
      title,
      category,
      type,
      location,
      rating,
      feedback,
      notes,
      priceLevel,
      isCouple,
      groupId
    } = req.body;

    const user = db.getUser(userId);
    const venue = venueId ? db.getVenueById(venueId) : undefined;

    const newLog: ActivityLog = {
      id: `log-${uuidv4().slice(0, 8)}`,
      userId,
      userName: user?.name || 'Kullanıcı',
      venueId,
      title: title || venue?.title || 'Bilinmeyen Aktivite',
      category: category || venue?.category || 'diger',
      type: type || venue?.type || 'food',
      location: location || venue?.district || 'İstanbul',
      date: new Date().toISOString(),
      rating: rating ?? 5,
      feedback: feedback ?? 'liked',
      notes,
      priceLevel: priceLevel ?? venue?.priceLevel ?? 2,
      isCouple: !!isCouple,
      groupId,
      cooldownDays: venue?.defaultCooldownDays ?? 3
    };

    db.addActivityLog(newLog);

    // Trigger Implicit Learning
    if (newLog.feedback) {
      LearningEngine.recordFeedback(userId, newLog.category, newLog.feedback, newLog.rating, newLog.venueId);
    }

    res.status(201).json(newLog);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Aktivite kaydedilirken bir hata oluştu' });
  }
});

// POST /api/activities/:id/feedback
router.post('/activities/:id/feedback', (req, res) => {
  try {
    const { feedback, rating } = req.body;
    const updated = db.updateActivityFeedback(req.params.id, feedback, rating);

    if (!updated) {
      return res.status(404).json({ error: 'Log bulunamadı' });
    }

    // Update weights with multidimensional venue context
    LearningEngine.recordFeedback(updated.userId, updated.category, feedback, rating, updated.venueId);

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Geri bildirim işlenirken bir hata oluştu' });
  }
});

export default router;
