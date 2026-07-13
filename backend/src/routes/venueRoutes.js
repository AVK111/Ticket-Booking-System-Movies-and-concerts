const express = require('express');
const {
    createVenue,
    getVenues,
    getVenueById,
    updateVenue,
    deleteVenue,
} = require('../controllers/venueController');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', getVenues);
router.get('/:id', getVenueById);

router.post('/', protect, requireRole('admin'), createVenue);
router.put('/:id', protect, requireRole('admin'), updateVenue);
router.delete('/:id', protect, requireRole('admin'), deleteVenue);

module.exports = router;