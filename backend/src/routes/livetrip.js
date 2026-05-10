const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  startLiveTrip,
  getActiveTrip,
  completeStep,
  updateLocation,
  updateTripStatus,
} = require('../controllers/liveTripController');

const getTransportOptions = (req, res) => {
  const { fromLat = 0, fromLng = 0, toLat = 0, toLng = 0 } = req.query;
  const R = 6371;
  const dLat = (parseFloat(toLat) - parseFloat(fromLat)) * Math.PI / 180;
  const dLng = (parseFloat(toLng) - parseFloat(fromLng)) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(parseFloat(fromLat)*Math.PI/180) * Math.cos(parseFloat(toLat)*Math.PI/180) * Math.sin(dLng/2)**2;
  const dist = Math.max(1, Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 10) / 10);
  const eta = (d, s) => `${Math.round((d/s)*60+3)} min`;

  res.json({
    success: true,
    distance: dist,
    recommended: 'ola',
    cabOptions: [
      { provider: 'Uber',   type: 'UberGo',       icon: '🖤', price: Math.round(dist*14+20), eta: eta(dist,25), deepLink: `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${toLat}&dropoff[longitude]=${toLng}`, webLink: 'https://www.uber.com' },
      { provider: 'Ola',    type: 'Ola Mini',      icon: '🟢', price: Math.round(dist*11+15), eta: eta(dist,28), deepLink: 'https://www.olacabs.com', webLink: 'https://www.olacabs.com' },
      { provider: 'Rapido', type: 'Bike',          icon: '🟡', price: Math.round(dist*6+10),  eta: eta(dist,35), deepLink: 'https://rapido.bike',     webLink: 'https://rapido.bike' },
      { provider: 'Auto',   type: 'Auto-Rickshaw', icon: '🛺', price: Math.round(dist*9+12),  eta: eta(dist,20), deepLink: 'https://www.olacabs.com', webLink: 'https://www.olacabs.com' },
    ]
  });
};

router.post('/start',                        protect, startLiveTrip);
router.get('/active',                        protect, getActiveTrip);
router.put('/:id/step/:stepIndex/complete',  protect, completeStep);
router.put('/:id/location',                  protect, updateLocation);
router.put('/:id/pause',                     protect, (req, res, next) => { req.body.status = 'paused';    updateTripStatus(req, res, next); });
router.put('/:id/resume',                    protect, (req, res, next) => { req.body.status = 'active';    updateTripStatus(req, res, next); });
router.put('/:id/end',                       protect, (req, res, next) => { req.body.status = 'completed'; updateTripStatus(req, res, next); });
router.get('/:id/transport-options',         protect, getTransportOptions);

module.exports = router;