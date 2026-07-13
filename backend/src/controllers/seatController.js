const SeatStatus = require('../models/SeatStatus');

// @route  GET /api/shows/:id/seats
// @access Public
// Returns seats grouped by row so the frontend can render a grid directly:
// [{ row: "A", seats: [{ seatNumber, category, status }, ...] }, ...]
const getSeatMap = async (req, res) => {
    try {
        const seats = await SeatStatus.find({ show: req.params.id })
            .select('row seatNumber category status holdExpiresAt heldBy')
            .sort({ row: 1, seatNumber: 1 });

        if (seats.length === 0) {
            return res.status(404).json({ message: 'No seat map found for this show' });
        }

        const grouped = {};
        for (const seat of seats) {
            if (!grouped[seat.row]) grouped[seat.row] = [];
            // "mine" tells the current viewer whether THEY are the one holding this
            // seat — heldBy itself is never sent to the client, so we don't leak
            // who else has a seat on hold.
            const mine = Boolean(req.user && seat.heldBy && seat.heldBy.toString() === req.user._id.toString());
            grouped[seat.row].push({
                seatNumber: seat.seatNumber,
                category: seat.category,
                status: seat.status,
                holdExpiresAt: seat.holdExpiresAt,
                mine,
            });
        }

        const rows = Object.keys(grouped)
            .sort()
            .map((row) => ({ row, seats: grouped[row] }));

        return res.status(200).json({ showId: req.params.id, rows });
    } catch (err) {
        return res.status(400).json({ message: 'Failed to fetch seat map', error: err.message });
    }
};

module.exports = { getSeatMap };