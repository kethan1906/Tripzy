/**
 * Expense Model
 * Track all trip-related expenses
 */

const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true,
    index: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  category: {
    type: String,
    enum: ['transport', 'accommodation', 'food', 'activities', 'shopping', 'health', 'communication', 'misc'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  amountInUSD: Number,  // Normalized amount for budget comparison
  date: {
    type: Date,
    default: Date.now
  },
  location: String,
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'online', 'other'],
    default: 'card'
  },
  receipt: String,  // URL to receipt image
  notes: String,
  isShared: { type: Boolean, default: false },
  sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  splitAmount: Number
}, {
  timestamps: true
});

expenseSchema.index({ trip: 1, category: 1 });
expenseSchema.index({ user: 1, date: -1 });

const Expense = mongoose.model('Expense', expenseSchema);

// ─── Alert Model ──────────────────────────────────────────────────────────────

const alertSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip'
  },
  type: {
    type: String,
    enum: ['weather', 'crowd', 'safety', 'booking', 'itinerary', 'system'],
    required: true
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'danger', 'critical'],
    default: 'info'
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  location: {
    name: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  data: mongoose.Schema.Types.Mixed,  // Additional alert-specific data
  isRead: { type: Boolean, default: false },
  isActionRequired: { type: Boolean, default: false },
  action: {
    label: String,
    url: String
  },
  expiresAt: Date
}, {
  timestamps: true
});

alertSchema.index({ user: 1, isRead: 1, createdAt: -1 });
alertSchema.index({ trip: 1 });

const Alert = mongoose.model('Alert', alertSchema);

module.exports = { Expense, Alert };
