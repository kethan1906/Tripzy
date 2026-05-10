/**
 * Group Model
 * Shared itinerary, expense splitting, and voting for group travel
 */
const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
  joinedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['invited', 'active', 'left'], default: 'invited' },
  sharePercentage: { type: Number, default: 0 } // for expense splitting
}, { _id: false });

const voteOptionSchema = new mongoose.Schema({
  label: String,
  description: String,
  imageUrl: String,
  votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { _id: true });

const pollSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [voteOptionSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deadline: Date,
  isOpen: { type: Boolean, default: true },
  allowMultiple: { type: Boolean, default: false }
}, { timestamps: true });

const groupExpenseSchema = new mongoose.Schema({
  title: String,
  amount: Number,
  currency: { type: String, default: 'USD' },
  paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  splitBetween: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  splitType: { type: String, enum: ['equal', 'percentage', 'custom'], default: 'equal' },
  splits: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    settled: { type: Boolean, default: false }
  }],
  category: String,
  date: { type: Date, default: Date.now }
}, { timestamps: true });

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: String,
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  itinerary: { type: mongoose.Schema.Types.ObjectId, ref: 'Itinerary' },
  members: [memberSchema],
  polls: [pollSchema],
  groupExpenses: [groupExpenseSchema],
  inviteCode: { type: String, unique: true, sparse: true },
  isPublic: { type: Boolean, default: false },
  coverImage: String,
  settings: {
    allowMemberInvite: { type: Boolean, default: false },
    requireVoteForChanges: { type: Boolean, default: false },
    defaultSplitType: { type: String, enum: ['equal', 'percentage', 'custom'], default: 'equal' }
  },
  chatMessages: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    timestamp: { type: Date, default: Date.now },
    type: { type: String, enum: ['text', 'system', 'poll', 'expense'], default: 'text' }
  }]
}, { timestamps: true });

// Generate invite code
groupSchema.pre('save', function(next) {
  if (!this.inviteCode) {
    this.inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Group', groupSchema);
