const express = require('express');
const { getMyShows, getShowSummary } = require('../controllers/organiserController');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/shows', protect, requireRole('organiser'), getMyShows);
router.get('/shows/:id/summary', protect, requireRole('organiser'), getShowSummary);

module.exports = router;