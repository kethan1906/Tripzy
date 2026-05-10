/**
 * Transport options endpoint addition for liveTripController
 * Add this to the existing liveTripController.js after the existing code
 */

// GET /api/livetrip/:id/transport-options
const getTransportOptions = async (req, res, next) => {
  try {
    const { fromLat, fromLng, toLat, toLng } = req.query;

    if (!fromLat || !fromLng || !toLat || !toLng) {
      return res.status(400).json({ error: 'fromLat, fromLng, toLat, toLng are required' });
    }

    // Haversine distance
    const R = 6371;
    const dLat = (parseFloat(toLat) - parseFloat(fromLat)) * Math.PI / 180;
    const dLng = (parseFloat(toLng) - parseFloat(fromLng)) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(parseFloat(fromLat) * Math.PI / 180) *
      Math.cos(parseFloat(toLat) * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;
    const dist = Math.max(1, Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10);

    const etaMinutes = (dist, speedKmh) => Math.round((dist / speedKmh) * 60 + 3);

    const cabOptions = [
      {
        provider: 'Uber',
        type: 'UberGo',
        icon: '🖤',
        price: Math.round(dist * 14 + 20),
        eta: `${etaMinutes(dist, 25)} min`,
        deepLink: `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${toLat}&dropoff[longitude]=${toLng}&dropoff[nickname]=Destination`,
        webLink: 'https://www.uber.com',
        color: '#000000',
      },
      {
        provider: 'Ola',
        type: 'Ola Mini',
        icon: '🟢',
        price: Math.round(dist * 11 + 15),
        eta: `${etaMinutes(dist, 28)} min`,
        deepLink: `https://www.olacabs.com`,
        webLink: 'https://www.olacabs.com',
        color: '#28A745',
      },
      {
        provider: 'Rapido',
        type: 'Bike',
        icon: '🟡',
        price: Math.round(dist * 6 + 10),
        eta: `${etaMinutes(dist, 35)} min`,
        deepLink: 'https://rapido.bike',
        webLink: 'https://rapido.bike',
        color: '#FFC107',
      },
      {
        provider: 'Auto',
        type: 'Auto-Rickshaw',
        icon: '🛺',
        price: Math.round(dist * 9 + 12),
        eta: `${etaMinutes(dist, 20)} min`,
        deepLink: 'https://www.olacabs.com',
        webLink: 'https://www.olacabs.com',
        color: '#FF851B',
      },
    ];

    res.json({
      success: true,
      distance: dist,
      recommended: 'ola',
      cabOptions,
    });
  } catch (error) {
    next(error);
  }
};

// Make sure to export this and add to the livetrip route:
// router.get('/:id/transport-options', protect, getTransportOptions);
module.exports = { getTransportOptions };
