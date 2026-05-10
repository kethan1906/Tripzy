/**
 * Trip Model
 * Core trip planning data structure
 */

const mongoose = require('mongoose');

const destinationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  city: String,
  country: String,
  coordinates: {
    lat: Number,
    lng: Number
  },
  arrivalDate: Date,
  departureDate: Date,
  nights: Number
}, { _id: false });

const tripSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Trip title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: String,
  destinations: [destinationSchema],
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  duration: Number,  // Computed in days
  budget: {
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    breakdown: {
      transport: { type: Number, default: 0 },
      accommodation: { type: Number, default: 0 },
      food: { type: Number, default: 0 },
      activities: { type: Number, default: 0 },
      misc: { type: Number, default: 0 }
    }
  },
  interests: [{
    type: String,
    enum: ['culture', 'nature', 'adventure', 'food', 'shopping', 'history', 'photography', 'nightlife', 'wellness', 'sports']
  }],
  travelStyle: {
    type: String,
    enum: ['budget', 'comfort', 'luxury'],
    default: 'comfort'
  },
  status: {
    type: String,
    enum: ['planning', 'confirmed', 'ongoing', 'completed', 'cancelled'],
    default: 'planning'
  },
  coverImage: String,
  isPublic: { type: Boolean, default: false },
  collaborators: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['viewer', 'editor'], default: 'viewer' }
  }],
  tags: [String],
  notes: String,
  // Computed stats (updated by aggregation)
  stats: {
    totalSpent: { type: Number, default: 0 },
    bookingsCount: { type: Number, default: 0 },
    alertsCount: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Calculate duration before saving
tripSchema.pre('save', function(next) {
  if (this.startDate && this.endDate) {
    const diff = this.endDate - this.startDate;
    this.duration = Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
  next();
});

// Index for efficient queries
tripSchema.index({ user: 1, status: 1 });
tripSchema.index({ startDate: 1 });

module.exports = mongoose.model('Trip', tripSchema);
