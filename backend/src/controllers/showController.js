const Show = require('../models/Show');
const Venue = require('../models/Venue');
const SeatStatus = require('../models/SeatStatus');
const generateSeatMapForShow = require('../utils/generateSeatMapForShow');

// @route  POST /api/shows
// @access Private (organiser)
const createShow = async (req, res) => {
    try {
        const { title, type, venue: venueId, showDateTime, pricing } = req.body;

        if (!title || !type || !venueId || !showDateTime || !pricing) {
            return res
                .status(400)
                .json({ message: 'title, type, venue, showDateTime, and pricing are required' });
        }

        const venue = await Venue.findById(venueId);
        if (!venue) return res.status(404).json({ message: 'Venue not found' });

        // Every category priced must actually exist on the venue's seat map
        const validCategories = venue.getCategories();
        const invalid = pricing.filter((p) => !validCategories.includes(p.category));
        if (invalid.length > 0) {
            return res.status(400).json({
                message: `Unknown category in pricing: ${invalid.map((p) => p.category).join(', ')}`,
                validCategories,
            });
        }

        const show = await Show.create({
            title,
            type,
            venue: venueId,
            showDateTime,
            pricing,
            organiser: req.user._id,
        });

        const seatCount = await generateSeatMapForShow(show._id, venue);

        return res.status(201).json({ ...show.toObject(), seatsGenerated: seatCount });
    } catch (err) {
        return res.status(400).json({ message: 'Failed to create show', error: err.message });
    }
};

// @route  GET /api/shows
// @access Public
// Supports filters: ?type=movie&venue=<id>&from=2026-08-01&to=2026-08-31&search=dune
const getShows = async (req, res) => {
    try {
        const { type, venue, from, to, search } = req.query;
        const filter = { status: 'scheduled' };

        if (type) filter.type = type;
        if (venue) filter.venue = venue;
        if (search) filter.title = { $regex: search, $options: 'i' };
        if (from || to) {
            filter.showDateTime = {};
            if (from) filter.showDateTime.$gte = new Date(from);
            if (to) filter.showDateTime.$lte = new Date(to);
        }

        const shows = await Show.find(filter)
            .populate('venue', 'name address')
            .populate('organiser', 'name')
            .sort({ showDateTime: 1 });

        return res.status(200).json(shows);
    } catch (err) {
        return res.status(500).json({ message: 'Failed to fetch shows', error: err.message });
    }
};

// @route  GET /api/shows/:id
// @access Public
const getShowById = async (req, res) => {
    try {
        const show = await Show.findById(req.params.id)
            .populate('venue')
            .populate('organiser', 'name');
        if (!show) return res.status(404).json({ message: 'Show not found' });
        return res.status(200).json(show);
    } catch (err) {
        return res.status(400).json({ message: 'Invalid show id' });
    }
};

// @route  PUT /api/shows/:id
// @access Private (organiser, own shows only)
const updateShow = async (req, res) => {
    try {
        const show = await Show.findById(req.params.id);
        if (!show) return res.status(404).json({ message: 'Show not found' });

        if (show.organiser.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only edit your own shows' });
        }

        const { title, showDateTime, pricing, status } = req.body;
        if (title !== undefined) show.title = title;
        if (showDateTime !== undefined) show.showDateTime = showDateTime;
        if (status !== undefined) show.status = status;

        if (pricing !== undefined) {
            const venue = await Venue.findById(show.venue);
            const validCategories = venue.getCategories();
            const invalid = pricing.filter((p) => !validCategories.includes(p.category));
            if (invalid.length > 0) {
                return res.status(400).json({
                    message: `Unknown category in pricing: ${invalid.map((p) => p.category).join(', ')}`,
                });
            }
            show.pricing = pricing;
        }

        await show.save();
        return res.status(200).json(show);
    } catch (err) {
        return res.status(400).json({ message: 'Failed to update show', error: err.message });
    }
};

// @route  DELETE /api/shows/:id
// @access Private (organiser, own shows only)
const deleteShow = async (req, res) => {
    try {
        const show = await Show.findById(req.params.id);
        if (!show) return res.status(404).json({ message: 'Show not found' });

        if (show.organiser.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only delete your own shows' });
        }

        await SeatStatus.deleteMany({ show: show._id });
        await show.deleteOne();
        return res.status(200).json({ message: 'Show deleted' });
    } catch (err) {
        return res.status(400).json({ message: 'Failed to delete show', error: err.message });
    }
};

module.exports = { createShow, getShows, getShowById, updateShow, deleteShow };