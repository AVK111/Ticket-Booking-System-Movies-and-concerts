const Show = require('../models/Show');
const Booking = require('../models/Booking');
const SeatStatus = require('../models/SeatStatus');

// @route  GET /api/organiser/shows
// @access Private (organiser)
const getMyShows = async (req, res) => {
    try {
        const shows = await Show.find({ organiser: req.user._id })
            .populate('venue', 'name address')
            .sort({ showDateTime: -1 });
        return res.status(200).json(shows);
    } catch (err) {
        return res.status(500).json({ message: 'Failed to fetch shows', error: err.message });
    }
};

// @route  GET /api/organiser/shows/:id/summary
// @access Private (organiser, own shows only)
const getShowSummary = async (req, res) => {
    try {
        const show = await Show.findById(req.params.id).populate('venue', 'name address');
        if (!show) return res.status(404).json({ message: 'Show not found' });
        if (show.organiser.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only view summaries for your own shows' });
        }

        // Confirmed bookings only — cancelled bookings shouldn't count toward revenue
        const bookings = await Booking.find({ show: show._id, status: 'confirmed' });

        const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
        const totalSeatsSold = bookings.reduce((sum, b) => sum + b.seats.length, 0);

        // Revenue + seats sold, broken down by category
        const byCategory = {};
        for (const booking of bookings) {
            for (const seat of booking.seats) {
                if (!byCategory[seat.category]) {
                    byCategory[seat.category] = { category: seat.category, seatsSold: 0, revenue: 0 };
                }
                byCategory[seat.category].seatsSold += 1;
                byCategory[seat.category].revenue += seat.price;
            }
        }

        // Live seat map status breakdown (available / held / booked) per category —
        // gives the organiser a real-time occupancy view, not just historical bookings
        const statusBreakdown = await SeatStatus.aggregate([
            { $match: { show: show._id } },
            { $group: { _id: { category: '$category', status: '$status' }, count: { $sum: 1 } } },
        ]);

        const occupancy = {};
        for (const row of statusBreakdown) {
            const { category, status } = row._id;
            if (!occupancy[category]) {
                occupancy[category] = { category, available: 0, held: 0, booked: 0 };
            }
            occupancy[category][status] = row.count;
        }

        return res.status(200).json({
            show: { id: show._id, title: show.title, showDateTime: show.showDateTime, venue: show.venue },
            totalBookings: bookings.length,
            totalRevenue,
            totalSeatsSold,
            byCategory: Object.values(byCategory),
            occupancy: Object.values(occupancy),
        });
    } catch (err) {
        return res.status(500).json({ message: 'Failed to build summary', error: err.message });
    }
};

module.exports = { getMyShows, getShowSummary };