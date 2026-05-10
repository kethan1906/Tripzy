/**
 * LiveTrip Model
 * Real-time trip mode state, tracking, and navigation
 */
const mongoose = require('mongoose');

const locationPointSchema = new mongoose.Schema({
  lat: Number,
  lng: Number,
  timestamp: { type: Date, default: Date.now },
  accuracy: Number,
  speed: Number,
  heading: Number
}, { _id: false });

const tripStepSchema = new mongoose.Schema({
  order: Number,
  title: String,
  description: String,
  type: {
    type: String,
    enum: ['departure', 'transport', 'arrival', 'activity', 'meal', 'checkin', 'checkout', 'waypoint'],
    default: 'waypoint'
  },
  transport: {
    mode: { type: String, enum: ['flight', 'train', 'bus', 'metro', 'cab', 'walk', 'bike', 'ferry', 'car'] },
    provider: String,
    bookingRef: String,
    from: String,
    to: String,
    departureTime: Date,
    arrivalTime: Date,
    platform: String,
    gate: String,
    estimatedDuration: Number, // minutes
    estimatedDistance: Number, // km
    cost: Number
  },
  location: {
    name: String,
    address: String,
    coordinates: { lat: Number, lng: Number },
    placeId: String
  },
  scheduledTime: Date,
  actualTime: Date,
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed', 'skipped', 'delayed'],
    default: 'upcoming'
  },
  alerts: [{
    type: String,
    message: String,
    severity: String,
    timestamp: Date
  }],
  crowdLevel: { type: String, enum: ['low', 'medium', 'high'] },
  weatherCondition: String,
  notes: String,
  alternativeOptions: [{
    title: String,
    reason: String,
    transport: String,
    estimatedTimeSaving: Number
  }]
}, { _id: true });

const liveTripSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  itinerary: { type: mongoose.Schema.Types.ObjectId, ref: 'Itinerary' },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },

  status: {
    type: String,
    enum: ['idle', 'active', 'paused', 'completed'],
    default: 'idle'
  },

  currentStepIndex: { type: Number, default: 0 },
  steps: [tripStepSchema],

  // Real-time location tracking
  locationHistory: [locationPointSchema],
  currentLocation: locationPointSchema,

  // Live stats
  stats: {
    startedAt: Date,
    completedAt: Date,
    totalDistance: { type: Number, default: 0 },
    totalDuration: { type: Number, default: 0 },
    stepsCompleted: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    alertsReceived: { type: Number, default: 0 }
  },

  // Notifications queue
  pendingNotifications: [{
    id: String,
    type: { type: String, enum: ['departure', 'arrival', 'crowd', 'weather', 'reminder', 'delay'] },
    title: String,
    message: String,
    scheduledFor: Date,
    sent: { type: Boolean, default: false },
    priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' }
  }],

  settings: {
    trackLocation: { type: Boolean, default: true },
    sendNotifications: { type: Boolean, default: true },
    autoAdvanceSteps: { type: Boolean, default: false },
    showAlternativeRoutes: { type: Boolean, default: true },
    voiceGuidance: { type: Boolean, default: false }
  }
}, { timestamps: true });

liveTripSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('LiveTrip', liveTripSchema);
