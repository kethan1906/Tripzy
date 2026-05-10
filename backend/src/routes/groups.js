// groups.js
const express = require('express');
const { getGroups, createGroup, getGroup, joinByCode, createPoll, vote, addGroupExpense, getBalances, sendMessage } = require('../controllers/groupController');
const { protect } = require('../middleware/auth');
const router = express.Router();
router.use(protect);
router.get('/', getGroups);
router.post('/', createGroup);
router.get('/:id', getGroup);
router.post('/join/:code', joinByCode);
router.post('/:id/polls', createPoll);
router.post('/:id/polls/:pollId/vote', vote);
router.post('/:id/expenses', addGroupExpense);
router.get('/:id/balances', getBalances);
router.post('/:id/messages', sendMessage);
module.exports = router;
