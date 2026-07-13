const express = require('express');
const { joinWaitlist, getMyWaitlist, leaveWaitlist } = require('../controllers/waitlistController');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, requireRole('customer'), joinWaitlist);
router.get('/my', protect, requireRole('customer'), getMyWaitlist);
router.delete('/:id', protect, requireRole('customer'), leaveWaitlist);

module.exports = router;