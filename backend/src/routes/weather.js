// weather.js
const express = require('express');
const { getCurrentWeather, getForecast } = require('../controllers/weatherCrowdController');
const { protect } = require('../middleware/auth');
const router = express.Router();
router.use(protect);
router.get('/current', getCurrentWeather);
router.get('/forecast', getForecast);
module.exports = router;
