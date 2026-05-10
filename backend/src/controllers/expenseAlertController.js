/**
 * Expense Controller - FULLY FUNCTIONAL
 * - Real calculations linked to itinerary and bookings
 * - Budget tracking with alerts
 * - Per-user data isolation
 */

const { Expense, Alert } = require('../models/ExpenseAlert');
const Trip = require('../models/Trip');
const mongoose = require('mongoose');

// GET /api/expenses/:tripId
const getExpenses = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { category, startDate, endDate, page = 1, limit = 50 } = req.query;

    // Verify user owns the trip
    if (tripId !== 'all') {
      const trip = await Trip.findOne({ _id: tripId, user: req.user._id });
      if (!trip) return res.status(404).json({ error: 'Trip not found.' });
    }

    const filter = { user: req.user._id };
    if (tripId !== 'all') filter.trip = tripId;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const [expenses, total] = await Promise.all([
      Expense.find(filter)
        .sort('-date')
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate('booking', 'bookingReference type status'),
      Expense.countDocuments(filter)
    ]);

    // Calculate summary by category
    const matchStage = { user: req.user._id };
    if (tripId !== 'all') matchStage.trip = mongoose.Types.ObjectId.createFromHexString(tripId);
    if (category) matchStage.category = category;

    const summary = await Expense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      },
      { $sort: { total: -1 } }
    ]);

    const totalSpent = summary.reduce((s, item) => s + item.total, 0);

    res.json({
      success: true,
      expenses,
      summary,
      totalSpent,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/expenses
const createExpense = async (req, res, next) => {
  try {
    const { trip, amount, category, title, currency = 'USD', date, paymentMethod, notes } = req.body;

    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount is required.' });
    if (!category) return res.status(400).json({ error: 'Category is required.' });
    if (!title) return res.status(400).json({ error: 'Title is required.' });

    // Verify trip ownership if provided
    if (trip) {
      const tripDoc = await Trip.findOne({ _id: trip, user: req.user._id });
      if (!tripDoc) return res.status(404).json({ error: 'Trip not found.' });
    }

    const expense = await Expense.create({
      user: req.user._id,
      trip: trip || undefined,
      category,
      title,
      amount: parseFloat(amount),
      currency,
      date: date ? new Date(date) : new Date(),
      paymentMethod: paymentMethod || 'card',
      notes
    });

    // Check budget and create alert if overspending
    if (trip) {
      const tripDoc = await Trip.findById(trip);
      if (tripDoc?.budget?.total) {
        const totalExpenses = await Expense.aggregate([
          { $match: { trip: mongoose.Types.ObjectId.createFromHexString(trip), user: req.user._id } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalSpent = totalExpenses[0]?.total || 0;
        const percentUsed = (totalSpent / tripDoc.budget.total) * 100;

        if (percentUsed >= 90 && percentUsed < 100) {
          await Alert.create({
            user: req.user._id,
            trip,
            type: 'system',
            severity: 'warning',
            title: '⚠️ Budget Alert: 90% Used',
            message: `You have used ${percentUsed.toFixed(0)}% of your budget for "${tripDoc.title}". Only $${(tripDoc.budget.total - totalSpent).toFixed(2)} remaining.`,
            isActionRequired: true
          });
        } else if (percentUsed >= 100) {
          await Alert.create({
            user: req.user._id,
            trip,
            type: 'system',
            severity: 'danger',
            title: '🚨 Budget Exceeded!',
            message: `You have exceeded your budget for "${tripDoc.title}" by $${(totalSpent - tripDoc.budget.total).toFixed(2)}.`,
            isActionRequired: true
          });
        }
      }
    }

    res.status(201).json({ success: true, expense });
  } catch (error) {
    next(error);
  }
};

// PUT /api/expenses/:id
const updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!expense) return res.status(404).json({ error: 'Expense not found.' });
    res.json({ success: true, expense });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/expenses/:id
const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!expense) return res.status(404).json({ error: 'Expense not found.' });
    res.json({ success: true, message: 'Expense deleted.' });
  } catch (error) {
    next(error);
  }
};

// GET /api/expenses/:tripId/analysis
const getBudgetAnalysis = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const trip = await Trip.findOne({ _id: tripId, user: req.user._id });
    if (!trip) return res.status(404).json({ error: 'Trip not found.' });

    const expenses = await Expense.find({ trip: tripId, user: req.user._id });
    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
    const totalBudget = trip.budget?.total || 0;
    const remaining = totalBudget - totalSpent;
    const percentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    // By category
    const byCategory = {};
    expenses.forEach(e => {
      if (!byCategory[e.category]) byCategory[e.category] = 0;
      byCategory[e.category] += e.amount;
    });

    // Daily spending
    const dailySpending = {};
    expenses.forEach(e => {
      const day = new Date(e.date).toISOString().split('T')[0];
      if (!dailySpending[day]) dailySpending[day] = 0;
      dailySpending[day] += e.amount;
    });

    // Projection
    const daysWithSpending = Object.keys(dailySpending).length;
    const avgDailySpend = daysWithSpending > 0 ? totalSpent / daysWithSpending : 0;
    const projectedTotal = trip.duration ? avgDailySpend * trip.duration : null;

    // Budget breakdown comparison
    const budgetBreakdown = trip.budget?.breakdown || {};
    const categoryComparison = Object.keys(budgetBreakdown).map(cat => ({
      category: cat,
      budgeted: budgetBreakdown[cat] || 0,
      spent: byCategory[cat] || 0,
      remaining: (budgetBreakdown[cat] || 0) - (byCategory[cat] || 0)
    }));

    res.json({
      success: true,
      analysis: {
        totalBudget,
        totalSpent,
        remaining,
        percentUsed: Math.round(percentUsed),
        isOverBudget: totalSpent > totalBudget,
        byCategory,
        dailySpending,
        avgDailySpend: Math.round(avgDailySpend * 100) / 100,
        projectedTotal: projectedTotal ? Math.round(projectedTotal) : null,
        categoryComparison,
        currency: trip.budget?.currency || 'USD',
        expenseCount: expenses.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── Alerts ───────────────────────────────────────────────────────────────────

const getAlerts = async (req, res, next) => {
  try {
    const { type, isRead, tripId, page = 1, limit = 30 } = req.query;
    const filter = { user: req.user._id };
    if (type) filter.type = type;
    if (isRead !== undefined) filter.isRead = isRead === 'true';
    if (tripId) filter.trip = tripId;

    const [alerts, unreadCount] = await Promise.all([
      Alert.find(filter)
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate('trip', 'title'),
      Alert.countDocuments({ user: req.user._id, isRead: false })
    ]);

    res.json({ success: true, alerts, unreadCount });
  } catch (error) {
    next(error);
  }
};

const markRead = async (req, res, next) => {
  try {
    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: { isRead: true } },
      { new: true }
    );
    if (!alert) return res.status(404).json({ error: 'Alert not found.' });
    res.json({ success: true, alert });
  } catch (error) {
    next(error);
  }
};

const markAllRead = async (req, res, next) => {
  try {
    const result = await Alert.updateMany(
      { user: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ success: true, message: `${result.modifiedCount} alerts marked as read.` });
  } catch (error) {
    next(error);
  }
};

const createAlert = async (req, res, next) => {
  try {
    const alert = await Alert.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, alert });
  } catch (error) {
    next(error);
  }
};

const deleteAlert = async (req, res, next) => {
  try {
    await Alert.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExpenses, createExpense, updateExpense, deleteExpense, getBudgetAnalysis,
  getAlerts, markRead, markAllRead, createAlert, deleteAlert
};
