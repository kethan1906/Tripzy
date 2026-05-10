/**
 * Trip Controller
 * CRUD operations for trips
 */

const Trip = require('../models/Trip');
const { Expense } = require('../models/ExpenseAlert');
const logger = require('../utils/logger');

// GET /api/trips - Get all user trips
const getTrips = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10, sort = '-createdAt' } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status;

    const [trips, total] = await Promise.all([
      Trip.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean(),
      Trip.countDocuments(filter)
    ]);

    res.json({
      success: true,
      trips,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/trips/:id - Get single trip
const getTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({
      _id: req.params.id,
      $or: [
        { user: req.user._id },
        { 'collaborators.user': req.user._id }
      ]
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found.' });
    }

    res.json({ success: true, trip });
  } catch (error) {
    next(error);
  }
};

// POST /api/trips - Create trip
const createTrip = async (req, res, next) => {
  try {
    const tripData = { ...req.body, user: req.user._id };
    const trip = await Trip.create(tripData);

    logger.info(`Trip created: ${trip._id} by user ${req.user._id}`);
    res.status(201).json({ success: true, trip });
  } catch (error) {
    next(error);
  }
};

// PUT /api/trips/:id - Update trip
const updateTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found or unauthorized.' });
    }

    res.json({ success: true, trip });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/trips/:id - Delete trip
const deleteTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found or unauthorized.' });
    }

    res.json({ success: true, message: 'Trip deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// GET /api/trips/:id/stats - Get trip statistics
const getTripStats = async (req, res, next) => {
  try {
    const tripId = req.params.id;

    const expenseStats = await Expense.aggregate([
      { $match: { trip: require('mongoose').Types.ObjectId.createFromHexString(tripId) } },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const totalSpent = expenseStats.reduce((sum, cat) => sum + cat.total, 0);

    res.json({
      success: true,
      stats: {
        expenseByCategory: expenseStats,
        totalSpent,
        expenseCount: expenseStats.reduce((sum, cat) => sum + cat.count, 0)
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTrips, getTrip, createTrip, updateTrip, deleteTrip, getTripStats };
