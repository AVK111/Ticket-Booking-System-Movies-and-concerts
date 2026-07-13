const express = require('express');
const { holdSeats, releaseSeats } = require('../controllers/holdController');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/:id/hold', protect, requireRole('customer'), holdSeats);
router.post('/:id/release', protect, requireRole('customer'), releaseSeats);

module.exports = router;