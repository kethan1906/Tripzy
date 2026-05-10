const express = require('express');
const { predictCrowd, getCrowdHotspots } = require('../controllers/weatherCrowdController');
const { protect } = require('../middleware/auth');
const router = express.Router();
router.use(protect);
router.post('/predict', predictCrowd);
router.get('/hotspots', getCrowdHotspots);
module.exports = router;
