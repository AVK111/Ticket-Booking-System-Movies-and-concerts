const express = require('express');
const {
    createShow,
    getShows,
    getShowById,
    updateShow,
    deleteShow,
} = require('../controllers/showController');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', getShows);
router.get('/:id', getShowById);

router.post('/', protect, requireRole('organiser'), createShow);
router.put('/:id', protect, requireRole('organiser'), updateShow);
router.delete('/:id', protect, requireRole('organiser'), deleteShow);

module.exports = router;