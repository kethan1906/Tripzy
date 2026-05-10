// trips.js
const express = require('express');
const { getTrips, getTrip, createTrip, updateTrip, deleteTrip, getTripStats } = require('../controllers/tripController');
const { protect } = require('../middleware/auth');
const router = express.Router();
router.use(protect);
router.get('/', getTrips);
router.post('/', createTrip);
router.get('/:id', getTrip);
router.put('/:id', updateTrip);
router.delete('/:id', deleteTrip);
router.get('/:id/stats', getTripStats);
module.exports = router;
