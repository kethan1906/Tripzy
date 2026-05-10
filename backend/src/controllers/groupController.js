/**
 * Group Controller
 * Handles group travel: shared itinerary, expense splitting, voting
 */
const Group = require('../models/Group');
const logger = require('../utils/logger');

// GET /api/groups
const getGroups = async (req, res, next) => {
  try {
    const groups = await Group.find({ 'members.user': req.user._id, 'members.status': 'active' })
      .populate('members.user', 'name email avatar')
      .populate('trip', 'title startDate endDate')
      .sort('-createdAt');
    res.json({ success: true, groups });
  } catch (err) { next(err); }
};

// POST /api/groups
const createGroup = async (req, res, next) => {
  try {
    const { name, description, tripId, memberEmails } = req.body;
    const group = await Group.create({
      name, description,
      trip: tripId,
      members: [{ user: req.user._id, role: 'owner', status: 'active' }]
    });
    logger.info(`Group created: ${group._id}`);
    res.status(201).json({ success: true, group });
  } catch (err) { next(err); }
};

// GET /api/groups/:id
const getGroup = async (req, res, next) => {
  try {
    const group = await Group.findOne({
      _id: req.params.id,
      'members.user': req.user._id
    })
      .populate('members.user', 'name email avatar')
      .populate('trip', 'title startDate endDate destinations budget')
      .populate('itinerary');
    if (!group) return res.status(404).json({ error: 'Group not found.' });
    res.json({ success: true, group });
  } catch (err) { next(err); }
};

// POST /api/groups/join/:code
const joinByCode = async (req, res, next) => {
  try {
    const group = await Group.findOne({ inviteCode: req.params.code.toUpperCase() });
    if (!group) return res.status(404).json({ error: 'Invalid invite code.' });

    const alreadyMember = group.members.find(m => m.user.toString() === req.user._id.toString());
    if (alreadyMember) return res.status(409).json({ error: 'Already a member.' });

    group.members.push({ user: req.user._id, role: 'member', status: 'active' });
    await group.save();
    res.json({ success: true, group: { _id: group._id, name: group.name, inviteCode: group.inviteCode } });
  } catch (err) { next(err); }
};

// POST /api/groups/:id/polls
const createPoll = async (req, res, next) => {
  try {
    const { question, options, deadline, allowMultiple } = req.body;
    const group = await Group.findOneAndUpdate(
      { _id: req.params.id, 'members.user': req.user._id },
      { $push: { polls: { question, options: options.map(o => ({ label: o.label, description: o.description, votes: [] })), createdBy: req.user._id, deadline, allowMultiple } } },
      { new: true }
    );
    if (!group) return res.status(404).json({ error: 'Group not found.' });
    res.json({ success: true, polls: group.polls });
  } catch (err) { next(err); }
};

// POST /api/groups/:id/polls/:pollId/vote
const vote = async (req, res, next) => {
  try {
    const { optionId } = req.body;
    const group = await Group.findOne({ _id: req.params.id, 'members.user': req.user._id });
    if (!group) return res.status(404).json({ error: 'Group not found.' });

    const poll = group.polls.id(req.params.pollId);
    if (!poll || !poll.isOpen) return res.status(400).json({ error: 'Poll not found or closed.' });

    // Remove previous vote if single choice
    if (!poll.allowMultiple) {
      poll.options.forEach(opt => {
        opt.votes = opt.votes.filter(v => v.toString() !== req.user._id.toString());
      });
    }

    const option = poll.options.id(optionId);
    if (!option) return res.status(404).json({ error: 'Option not found.' });
    if (!option.votes.includes(req.user._id)) option.votes.push(req.user._id);

    await group.save();
    res.json({ success: true, poll });
  } catch (err) { next(err); }
};

// POST /api/groups/:id/expenses
const addGroupExpense = async (req, res, next) => {
  try {
    const { title, amount, currency, splitBetween, splitType, category } = req.body;
    const group = await Group.findOne({ _id: req.params.id, 'members.user': req.user._id });
    if (!group) return res.status(404).json({ error: 'Group not found.' });

    const membersToSplit = splitBetween || group.members.filter(m => m.status === 'active').map(m => m.user);
    const splitAmount = amount / membersToSplit.length;

    const expense = {
      title, amount, currency: currency || 'USD',
      paidBy: req.user._id,
      splitBetween: membersToSplit,
      splitType: splitType || 'equal',
      splits: membersToSplit.map(userId => ({ user: userId, amount: splitAmount, settled: userId.toString() === req.user._id.toString() })),
      category,
      date: new Date()
    };

    group.groupExpenses.push(expense);
    await group.save();
    res.status(201).json({ success: true, expense: group.groupExpenses[group.groupExpenses.length - 1] });
  } catch (err) { next(err); }
};

// GET /api/groups/:id/balances
const getBalances = async (req, res, next) => {
  try {
    const group = await Group.findOne({ _id: req.params.id, 'members.user': req.user._id })
      .populate('groupExpenses.paidBy', 'name')
      .populate('groupExpenses.splits.user', 'name');
    if (!group) return res.status(404).json({ error: 'Group not found.' });

    // Calculate net balances (who owes whom)
    const balances = {};
    group.members.forEach(m => { balances[m.user.toString()] = 0; });

    group.groupExpenses.forEach(expense => {
      expense.splits.forEach(split => {
        if (!split.settled && split.user._id.toString() !== expense.paidBy._id.toString()) {
          balances[expense.paidBy._id.toString()] = (balances[expense.paidBy._id.toString()] || 0) + split.amount;
          balances[split.user._id.toString()] = (balances[split.user._id.toString()] || 0) - split.amount;
        }
      });
    });

    res.json({ success: true, balances, totalGroupSpend: group.groupExpenses.reduce((s, e) => s + e.amount, 0) });
  } catch (err) { next(err); }
};

// POST /api/groups/:id/messages
const sendMessage = async (req, res, next) => {
  try {
    const { message, type } = req.body;
    const group = await Group.findOneAndUpdate(
      { _id: req.params.id, 'members.user': req.user._id },
      { $push: { chatMessages: { user: req.user._id, message, type: type || 'text', timestamp: new Date() } } },
      { new: true }
    );
    if (!group) return res.status(404).json({ error: 'Group not found.' });
    const newMsg = group.chatMessages[group.chatMessages.length - 1];
    res.status(201).json({ success: true, message: newMsg });
  } catch (err) { next(err); }
};

module.exports = { getGroups, createGroup, getGroup, joinByCode, createPoll, vote, addGroupExpense, getBalances, sendMessage };
