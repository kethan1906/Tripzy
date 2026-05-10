/**
 * Booking Model
 * Handles transport, hotel, and tour guide bookings
 */

const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    index: true
  },
  type: {
    type: String,
    enum: ['flight', 'train', 'bus', 'hotel', 'tour_guide', 'car_rental', 'activity'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  bookingReference: {
    type: String,
    unique: true,
    sparse: true
  },

  // Transport-specific fields
  transport: {
    from: String,
    to: String,
    departureTime: Date,
    arrivalTime: Date,
    carrier: String,    // Airline/train/bus company name
    flightNumber: String,
    class: { type: String, enum: ['economy', 'business', 'first'] },
    seats: Number,
    duration: String    // e.g. "2h 30m"
  },

  // Hotel-specific fields
  hotel: {
    name: String,
    address: String,
    city: String,
    country: String,
    checkIn: Date,
    checkOut: Date,
    nights: Number,
    roomType: String,
    guests: Number,
    rating: Number,
    amenities: [String],
    coordinates: {
      lat: Number,
      lng: Number
    }
  },

  // Tour guide-specific fields
  tourGuide: {
    guideName: String,
    guideId: String,
    language: String,
    duration: String,   // e.g. "4 hours"
    groupSize: Number,
    meetingPoint: String,
    tourDate: Date,
    highlights: [String]
  },

  // Pricing
  pricing: {
    basePrice: { type: Number, required: true },
    taxes: { type: Number, default: 0 },
    fees: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    paidAmount: { type: Number, default: 0 }
  },

  // Passenger/guest details
  passengers: [{
    name: String,
    age: Number,
    passportNumber: String,
    nationality: String
  }],

  cancellationPolicy: String,
  notes: String,
  confirmationEmail: String
}, {
  timestamps: true
});

// Generate unique booking reference before saving
bookingSchema.pre('save', function(next) {
  if (!this.bookingReference) {
    const prefix = this.type.toUpperCase().slice(0, 3);
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.bookingReference = `TZ-${prefix}-${timestamp}${random}`;
  }
  next();
});

bookingSchema.index({ user: 1, type: 1, status: 1 });
bookingSchema.index({ bookingReference: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
