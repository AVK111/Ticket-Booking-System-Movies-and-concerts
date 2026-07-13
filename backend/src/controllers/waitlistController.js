const Waitlist = require('../models/Waitlist');
const SeatStatus = require('../models/SeatStatus');

// @route  POST /api/waitlist
// @body   { showId, category }
// @access Private (customer)
const joinWaitlist = async (req, res) => {
    try {
        const { showId, category } = req.body;
        if (!showId || !category) {
            return res.status(400).json({ message: 'showId and category are required' });
        }

        // Only makes sense to join if the category is actually sold out
        const availableCount = await SeatStatus.countDocuments({
            show: showId,
            category,
            status: 'available',
        });
        if (availableCount > 0) {
            return res.status(400).json({
                message: `${availableCount} seat(s) still available in ${category} — book directly instead of joining the waitlist`,
            });
        }

        const existing = await Waitlist.findOne({
            show: showId,
            category,
            customer: req.user._id,
            status: { $in: ['waiting', 'offered'] },
        });
        if (existing) {
            return res.status(409).json({ message: 'You are already on the waitlist for this category' });
        }

        const entry = await Waitlist.create({
            show: showId,
            category,
            customer: req.user._id,
        });

        return res.status(201).json(entry);
    } catch (err) {
        return res.status(500).json({ message: 'Failed to join waitlist', error: err.message });
    }
};

// @route  GET /api/waitlist/my
// @access Private (customer)
const getMyWaitlist = async (req, res) => {
    try {
        const entries = await Waitlist.find({ customer: req.user._id })
            .populate('show', 'title showDateTime')
            .sort({ createdAt: -1 });
        return res.status(200).json(entries);
    } catch (err) {
        return res.status(500).json({ message: 'Failed to fetch waitlist', error: err.message });
    }
};

// @route  DELETE /api/waitlist/:id
// @access Private (customer, owner only) — only while still 'waiting'
const leaveWaitlist = async (req, res) => {
    try {
        const entry = await Waitlist.findById(req.params.id);
        if (!entry) return res.status(404).json({ message: 'Waitlist entry not found' });
        if (entry.customer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not your waitlist entry' });
        }
        if (entry.status !== 'waiting') {
            return res.status(400).json({
                message: `Cannot leave — entry is currently '${entry.status}'`,
            });
        }

        entry.status = 'cancelled';
        await entry.save();
        return res.status(200).json({ message: 'Left the waitlist' });
    } catch (err) {
        return res.status(400).json({ message: 'Failed to leave waitlist', error: err.message });
    }
};

module.exports = { joinWaitlist, getMyWaitlist, leaveWaitlist };