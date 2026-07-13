const express = require('express');
const {
    createBooking,
    getMyBookings,
    getBookingById,
    cancelBooking,
} = require('../controllers/bookingController');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, requireRole('customer'), createBooking);
router.get('/my', protect, requireRole('customer'), getMyBookings);
router.get('/:id', protect, requireRole('customer'), getBookingById);
router.post('/:id/cancel', protect, requireRole('customer'), cancelBooking);

module.exports = router;