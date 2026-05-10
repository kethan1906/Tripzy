/**
 * LiveTrip Controller - FULLY CONNECTED
 * Accepts steps built from itinerary with real coordinates
 * Tracks GPS, provides cab options, alerts
 */
const LiveTrip = require('../models/LiveTrip');
const Itinerary = require('../models/Itinerary');
const { Alert } = require('../models/ExpenseAlert');
const logger = require('../utils/logger');

const CAB_PROVIDERS = [
  { provider: 'Uber', type: 'UberGo', pricePerKm: 12, icon: '🖤', color: '#000' },
  { provider: 'Ola', type: 'Ola Mini', pricePerKm: 10, icon: '🟢', color: '#2ecc40' },
  { provider: 'Rapido', type: 'Bike', pricePerKm: 5, icon: '🟡', color: '#f4c430' },
  { provider: 'Auto', type: 'Auto-Rickshaw', pricePerKm: 8, icon: '🟠', color: '#ff851b' },
];

const calcDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

// POST /api/livetrip/start
const startLiveTrip = async (req, res, next) => {
  try {
    const { tripId, itineraryId, groupId, steps: customSteps } = req.body;

    // End existing active trips
    await LiveTrip.updateMany({ user: req.user._id, status: 'active' }, { status: 'paused' });

    let steps = [];

    // Use custom steps passed from frontend (built from itinerary)
    if (customSteps && customSteps.length > 0) {
      steps = customSteps.map((s, i) => ({
        order: s.order || i,
        title: s.title || `Stop ${i + 1}`,
        description: s.description || '',
        type: s.type || 'activity',
        location: s.location || {},
        scheduledTime: s.scheduledTime ? new Date(s.scheduledTime) : null,
        status: i === 0 ? 'active' : 'upcoming',
        crowdLevel: s.crowdLevel || 'medium',
        alerts: []
      }));
    } else if (itineraryId) {
      // Build steps from itinerary in DB
      const itinerary = await Itinerary.findById(itineraryId);
      if (itinerary) {
        itinerary.days.forEach((day, di) => {
          day.activities?.forEach((activity, ai) => {
            if (activity.location?.name) {
              steps.push({
                order: di * 100 + ai,
                title: activity.title,
                description: activity.description || '',
                type: activity.category === 'food' ? 'meal' : 'activity',
                location: {
                  name: activity.location.name,
                  address: activity.location.address || activity.location.name,
                  coordinates: activity.location.coordinates || { lat: 0, lng: 0 }
                },
                scheduledTime: activity.time ? new Date(`${day.date?.toISOString?.()?.split('T')[0]}T${activity.time}`) : null,
                status: steps.length === 0 ? 'active' : 'upcoming',
                crowdLevel: activity.crowdLevel || 'medium',
                alerts: []
              });
            }
          });
        });
      }
    }

    // Fallback step
    if (steps.length === 0) {
      steps = [{
        order: 0, title: 'Trip Started', description: 'Your journey begins',
        type: 'departure', status: 'active', location: {}, scheduledTime: new Date(), alerts: []
      }];
    }

    // Mark first step as active
    if (steps[0]) steps[0].status = 'active';

    const liveTrip = await LiveTrip.create({
      user: req.user._id,
      trip: tripId || undefined,
      itinerary: itineraryId || undefined,
      group: groupId || undefined,
      status: 'active',
      currentStepIndex: 0,
      steps,
      stats: { startedAt: new Date() }
    });

    logger.info(`LiveTrip started: ${liveTrip._id} with ${steps.length} steps`);
    res.status(201).json({ success: true, liveTrip });
  } catch (err) { next(err); }
};

// GET /api/livetrip/active
const getActiveTrip = async (req, res, next) => {
  try {
    const liveTrip = await LiveTrip.findOne({
      user: req.user._id,
      status: { $in: ['active', 'paused'] }
    }).sort('-createdAt').populate('trip', 'title destinations').populate('itinerary', 'title params');
    res.json({ success: true, liveTrip });
  } catch (err) { next(err); }
};

// PUT /api/livetrip/:id/step/:stepIndex/complete
const completeStep = async (req, res, next) => {
  try {
    const { stepIndex } = req.params;
    const { actualTime, notes } = req.body;
    const liveTrip = await LiveTrip.findOne({ _id: req.params.id, user: req.user._id });
    if (!liveTrip) return res.status(404).json({ error: 'Live trip not found.' });

    const idx = parseInt(stepIndex);
    const step = liveTrip.steps[idx];
    if (!step) return res.status(404).json({ error: 'Step not found.' });

    step.status = 'completed';
    step.actualTime = actualTime ? new Date(actualTime) : new Date();
    if (notes) step.notes = notes;

    // Advance to next
    const nextIdx = idx + 1;
    if (nextIdx < liveTrip.steps.length) {
      liveTrip.steps[nextIdx].status = 'active';
      liveTrip.currentStepIndex = nextIdx;
    } else {
      liveTrip.status = 'completed';
      liveTrip.stats.completedAt = new Date();
    }

    liveTrip.stats.stepsCompleted = liveTrip.steps.filter(s => s.status === 'completed').length;
    await liveTrip.save();

    res.json({ success: true, liveTrip, nextStep: liveTrip.steps[nextIdx] || null });
  } catch (err) { next(err); }
};

// PUT /api/livetrip/:id/location
const updateLocation = async (req, res, next) => {
  try {
    const { lat, lng, accuracy, speed } = req.body;
    const point = { lat, lng, accuracy, speed, timestamp: new Date() };
    const liveTrip = await LiveTrip.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, status: 'active' },
      {
        $set: { currentLocation: point },
        $push: { locationHistory: { $each: [point], $slice: -200 } }
      },
      { new: true }
    );
    if (!liveTrip) return res.status(404).json({ error: 'Active trip not found.' });
    res.json({ success: true });
  } catch (err) { next(err); }
};

// GET /api/livetrip/:id/transport-options
const getTransportOptions = async (req, res, next) => {
  try {
    const { fromLat, fromLng, toLat, toLng } = req.query;
    if (!fromLat || !fromLng || !toLat || !toLng) {
      return res.status(400).json({ error: 'Coordinates required' });
    }
    const distance = calcDistance(parseFloat(fromLat), parseFloat(fromLng), parseFloat(toLat), parseFloat(toLng));
    const cabOptions = CAB_PROVIDERS.map(cab => {
      const price = Math.round(cab.pricePerKm * distance);
      const etaMin = Math.ceil(distance / 30 * 60) + Math.floor(Math.random() * 5);
      return { ...cab, price: Math.max(price, 30), currency: 'INR', eta: `${etaMin} mins`, available: true };
    });

    const recommend = distance < 1 ? 'walk' : distance < 5 ? 'metro' : distance < 15 ? 'cab' : 'train';

    res.json({ success: true, cabOptions, distance: distance.toFixed(2), recommended: recommend });
  } catch (err) { next(err); }
};

// PUT /api/livetrip/:id/:action (pause/resume/end)
const updateTripStatus = async (req, res, next) => {
  try {
    const { action } = req.params;
    const statusMap = { pause: 'paused', resume: 'active', end: 'completed' };
    const newStatus = statusMap[action];
    if (!newStatus) return res.status(400).json({ error: 'Invalid action.' });
    const update = { status: newStatus };
    if (action === 'end') update['stats.completedAt'] = new Date();
    const liveTrip = await LiveTrip.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: update }, { new: true }
    );
    if (!liveTrip) return res.status(404).json({ error: 'Trip not found.' });
    res.json({ success: true, liveTrip });
  } catch (err) { next(err); }
};

module.exports = { startLiveTrip, getActiveTrip, completeStep, updateLocation, getTransportOptions, updateTripStatus };
