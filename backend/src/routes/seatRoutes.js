const express = require('express');
const { getSeatMap } = require('../controllers/seatController');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/:id/seats', optionalAuth, getSeatMap);

module.exports = router;