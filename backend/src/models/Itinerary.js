/**
 * Itinerary Model
 * Dynamic AI-generated travel itineraries
 */

const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  time: String,       // e.g. "09:00"
  title: String,
  description: String,
  location: {
    name: String,
    address: String,
    coordinates: { lat: Number, lng: Number }
  },
  duration: Number,   // minutes
  category: {
    type: String,
    enum: ['sightseeing', 'food', 'transport', 'accommodation', 'activity', 'rest', 'shopping']
  },
  estimatedCost: Number,
  currency: { type: String, default: 'USD' },
  crowdLevel: { type: String, enum: ['low', 'medium', 'high'] },
  weatherDependant: { type: Boolean, default: false },
  alternativeActivity: {
    title: String,
    location: String,
    reason: String
  },
  tips: [String],
  bookingRequired: Boolean,
  bookingLink: String
}, { _id: true });

const dayPlanSchema = new mongoose.Schema({
  day: Number,
  date: Date,
  theme: String,      // e.g. "Historical Sites & Culture"
  location: String,
  weather: {
    condition: String,
    temperature: Number,
    humidity: Number,
    description: String,
    icon: String
  },
  crowdForecast: {
    level: { type: String, enum: ['low', 'medium', 'high'] },
    score: Number,    // 0-100
    peakHours: [String]
  },
  activities: [activitySchema],
  estimatedDayCost: Number,
  notes: String
}, { _id: false });

const itinerarySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip'
  },
  title: String,
  version: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },

  // Generation parameters
  params: {
    budget: Number,
    duration: Number,
    interests: [String],
    travelStyle: String,
    groupSize: Number,
    startDate: Date,
    destinations: [String]
  },

  days: [dayPlanSchema],

  summary: {
    totalDays: Number,
    totalEstimatedCost: Number,
    currency: { type: String, default: 'USD' },
    topAttractions: [String],
    bestTimeToVisit: String,
    transportModes: [String]
  },

  // Track dynamic updates
  updates: [{
    timestamp: { type: Date, default: Date.now },
    reason: String,       // 'crowd_high', 'bad_weather', 'user_request'
    changes: String,
    previousVersion: Number
  }],

  generatedBy: {
    type: String,
    enum: ['ai', 'user', 'auto_update'],
    default: 'ai'
  }
}, {
  timestamps: true
});

itinerarySchema.index({ user: 1, trip: 1 });

module.exports = mongoose.model('Itinerary', itinerarySchema);
