const Venue = require('../models/Venue');

// @route  POST /api/venues
// @access Private (admin)
const createVenue = async (req, res) => {
    try {
        const { name, address, seatMap } = req.body;

        if (!name || !address || !seatMap) {
            return res.status(400).json({ message: 'name, address, and seatMap are required' });
        }

        const venue = await Venue.create({
            name,
            address,
            seatMap,
            createdBy: req.user._id,
        });

        return res.status(201).json(venue);
    } catch (err) {
        return res.status(400).json({ message: 'Failed to create venue', error: err.message });
    }
};

// @route  GET /api/venues
// @access Public
const getVenues = async (req, res) => {
    try {
        const venues = await Venue.find().sort({ createdAt: -1 });
        return res.status(200).json(venues);
    } catch (err) {
        return res.status(500).json({ message: 'Failed to fetch venues', error: err.message });
    }
};

// @route  GET /api/venues/:id
// @access Public
const getVenueById = async (req, res) => {
    try {
        const venue = await Venue.findById(req.params.id);
        if (!venue) return res.status(404).json({ message: 'Venue not found' });
        return res.status(200).json(venue);
    } catch (err) {
        return res.status(400).json({ message: 'Invalid venue id' });
    }
};

// @route  PUT /api/venues/:id
// @access Private (admin)
const updateVenue = async (req, res) => {
    try {
        const { name, address, seatMap } = req.body;

        const venue = await Venue.findById(req.params.id);
        if (!venue) return res.status(404).json({ message: 'Venue not found' });

        if (name !== undefined) venue.name = name;
        if (address !== undefined) venue.address = address;
        if (seatMap !== undefined) venue.seatMap = seatMap;

        await venue.save();
        return res.status(200).json(venue);
    } catch (err) {
        return res.status(400).json({ message: 'Failed to update venue', error: err.message });
    }
};

// @route  DELETE /api/venues/:id
// @access Private (admin)
const deleteVenue = async (req, res) => {
    try {
        const venue = await Venue.findById(req.params.id);
        if (!venue) return res.status(404).json({ message: 'Venue not found' });

        await venue.deleteOne();
        return res.status(200).json({ message: 'Venue deleted' });
    } catch (err) {
        return res.status(400).json({ message: 'Failed to delete venue', error: err.message });
    }
};

module.exports = { createVenue, getVenues, getVenueById, updateVenue, deleteVenue };