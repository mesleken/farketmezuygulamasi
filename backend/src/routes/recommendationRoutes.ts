import { Router } from 'express';
import { RecommendationEngine } from '../engine/recommendationEngine.js';
import { ItemType, BudgetLevel, RejectReasonTag } from '../types/index.js';

const router = Router();

// GET /api/recommendations/single (Single Clear Recommendation with Environmental & Spatial Awareness)
router.get('/recommendations/single', (req, res) => {
  try {
    const userId = (req.query.userId as string) || 'user-1';
    const type = req.query.type as ItemType | 'all' | undefined;
    const budget = req.query.budget ? (parseInt(req.query.budget as string) as BudgetLevel) : undefined;
    const streak = req.query.streak ? parseInt(req.query.streak as string) : 0;
    const broadFilter = req.query.broadFilter as any;
    const exploreMode = req.query.exploreMode === 'true';

    // Location
    const lat = req.query.userLat ? parseFloat(req.query.userLat as string) : undefined;
    const lng = req.query.userLng ? parseFloat(req.query.userLng as string) : undefined;
    const userLocation = lat && lng ? { lat, lng } : undefined;
    const transportMode = req.query.transportMode as 'walking' | 'transit' | 'driving' | undefined;

    // Weather
    const weatherCond = req.query.weatherCondition as any;
    const temp = req.query.temperature ? parseFloat(req.query.temperature as string) : undefined;
    const weather = weatherCond ? { condition: weatherCond, temperature: temp ?? 20 } : undefined;

    const result = RecommendationEngine.recommendSingle({
      userId,
      type,
      budget,
      rejectStreakCount: streak,
      broadFilter,
      exploreMode,
      userLocation,
      transportMode,
      weather
    });

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/recommendations/itinerary (Multi-Stop Sequential Route Generator)
router.post('/recommendations/itinerary', (req, res) => {
  try {
    const {
      userId = 'user-1',
      theme = 'chill_evening',
      userLocation,
      weather
    } = req.body;

    const itinerary = RecommendationEngine.buildItinerary({
      userId,
      theme,
      userLocation,
      weather
    });

    res.json(itinerary);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/recommendations/itinerary (Quick route retrieval)
router.get('/recommendations/itinerary', (req, res) => {
  try {
    const userId = (req.query.userId as string) || 'user-1';
    const theme = (req.query.theme as any) || 'chill_evening';
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;
    const userLocation = lat && lng ? { lat, lng } : undefined;

    const weatherCond = req.query.weatherCondition as any;
    const temp = req.query.temperature ? parseFloat(req.query.temperature as string) : undefined;
    const weather = weatherCond ? { condition: weatherCond, temperature: temp ?? 20 } : undefined;

    const itinerary = RecommendationEngine.buildItinerary({
      userId,
      theme,
      userLocation,
      weather
    });

    res.json(itinerary);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/recommendations/reject (Low-Friction Reason Tagged Rejection)
router.post('/recommendations/reject', (req, res) => {
  try {
    const { userId = 'user-1', venueId, reasonTag, streak = 0 } = req.body;

    if (!venueId || !reasonTag) {
      return res.status(400).json({ error: 'venueId and reasonTag are required' });
    }

    const nextResult = RecommendationEngine.handleRejection(
      userId,
      venueId,
      reasonTag as RejectReasonTag,
      streak
    );

    res.json(nextResult);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/recommendations (Fallback / Catalog list)
router.get('/recommendations', (req, res) => {
  try {
    const userId = (req.query.userId as string) || 'user-1';
    const type = req.query.type as ItemType | 'all' | undefined;
    const budget = req.query.budget ? (parseInt(req.query.budget as string) as BudgetLevel) : undefined;

    const result = RecommendationEngine.recommendSingle({
      userId,
      type,
      budget
    });

    res.json(result.recommendation ? [result.recommendation] : []);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
