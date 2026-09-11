import { Router } from 'express';
import { db } from '../db/store.js';

const router = Router();

// GET /api/venues
router.get('/venues', (req, res) => {
  try {
    let venues = db.getAllVenues();

    const { type, category, district, priceLevel, isVegetarian } = req.query;

    if (type && type !== 'all') {
      venues = venues.filter(v => v.type === type);
    }
    if (category && category !== 'all') {
      venues = venues.filter(v => v.category === category);
    }
    if (district) {
      venues = venues.filter(v => v.district.toLowerCase() === (district as string).toLowerCase());
    }
    if (priceLevel) {
      venues = venues.filter(v => v.priceLevel === parseInt(priceLevel as string));
    }
    if (isVegetarian === 'true') {
      venues = venues.filter(v => v.isVegetarianFriendly);
    }

    res.json(venues);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Mekanlar getirilemedi' });
  }
});

// GET /api/venues/:id
router.get('/venues/:id', (req, res) => {
  try {
    const venue = db.getVenueById(req.params.id);
    if (!venue) {
      return res.status(404).json({ error: 'Mekan bulunamadı' });
    }
    res.json(venue);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Mekan detayı getirilemedi' });
  }
});

export default router;
