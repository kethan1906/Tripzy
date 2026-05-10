const express = require('express');
const {
  searchFlights, searchHotels, searchGuides, searchTrains, searchBuses,
  getBookings, createBooking, getBooking, cancelBooking, getBookingSummary
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');
const router = express.Router();
router.use(protect);
router.get('/search/flights', searchFlights);
router.get('/search/hotels', searchHotels);
router.get('/search/guides', searchGuides);
router.get('/search/trains', searchTrains);
router.get('/search/buses', searchBuses);
router.get('/summary', getBookingSummary);
router.get('/', getBookings);
router.post('/', createBooking);
router.get('/:id', getBooking);
router.put('/:id/cancel', cancelBooking);
module.exports = router;
