/**
 * Itinerary Routes - Fixed with getAll and delete endpoints
 */
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  generateItinerary,
  getItinerary,
  getAllItineraries,
  updateItinerary,
  deleteItinerary,
} = require('../controllers/itineraryController');

// GET /api/itinerary - get ALL itineraries for user
router.get('/', protect, getAllItineraries);

// POST /api/itinerary/generate - generate new
router.post('/generate', protect, generateItinerary);

// GET /api/itinerary/:tripId - get specific
router.get('/:tripId', protect, getItinerary);

// PUT /api/itinerary/:id/update - update
router.put('/:id/update', protect, updateItinerary);
router.put('/:id', protect, updateItinerary);

// DELETE /api/itinerary/:id - soft delete
router.delete('/:id', protect, deleteItinerary);

module.exports = router;
