const SeatStatus = require('../models/SeatStatus');
const { emitSeatUpdate } = require('../socket');

const TTL_MS = (parseInt(process.env.SEAT_HOLD_TTL_MINUTES, 10) || 10) * 60 * 1000;

// @route  POST /api/shows/:id/hold
// @body   { seats: [{ row: "A", seatNumber: 3 }, ...] }
// @access Private (customer)
//
// CONCURRENCY: each seat is claimed with a single atomic findOneAndUpdate that
// only matches status:'available'. If two requests race for the same seat,
// MongoDB guarantees only one of those updates succeeds — the other gets null
// back. No manual locking needed; the DB's atomicity does the work.
const holdSeats = async (req, res) => {
    try {
        const { seats } = req.body;
        const showId = req.params.id;

        if (!Array.isArray(seats) || seats.length === 0) {
            return res.status(400).json({ message: 'seats array is required' });
        }

        const holdExpiresAt = new Date(Date.now() + TTL_MS);
        const claimed = [];
        const failed = [];

        // Sequential on purpose: keeps rollback logic simple and predictable.
        // For this project's scale (a handful of seats per request) this is fast enough.
        for (const { row, seatNumber } of seats) {
            const updated = await SeatStatus.findOneAndUpdate(
                { show: showId, row, seatNumber, status: 'available' },
                { status: 'held', heldBy: req.user._id, holdExpiresAt },
                { new: true }
            );

            if (updated) {
                claimed.push(updated);
            } else {
                failed.push({ row, seatNumber });
            }
        }

        // All-or-nothing: if any requested seat couldn't be claimed, release
        // whichever ones we did manage to grab so we don't leave partial holds.
        if (failed.length > 0) {
            const rollbackIds = claimed.map((s) => s._id);
            if (rollbackIds.length > 0) {
                await SeatStatus.updateMany(
                    { _id: { $in: rollbackIds } },
                    { status: 'available', heldBy: null, holdExpiresAt: null }
                );
                emitSeatUpdate(showId, {
                    seats: claimed.map((s) => ({ row: s.row, seatNumber: s.seatNumber, status: 'available' })),
                    reason: 'released',
                });
            }
            return res.status(409).json({
                message: 'Some seats were already taken',
                unavailable: failed,
            });
        }

        emitSeatUpdate(showId, {
            seats: claimed.map((s) => ({ row: s.row, seatNumber: s.seatNumber, status: 'held' })),
            reason: 'held',
        });

        return res.status(200).json({
            message: 'Seats held successfully',
            holdExpiresAt,
            seats: claimed.map((s) => ({ row: s.row, seatNumber: s.seatNumber, category: s.category })),
        });
    } catch (err) {
        return res.status(500).json({ message: 'Failed to hold seats', error: err.message });
    }
};

// @route  POST /api/shows/:id/release
// @body   { seats: [{ row: "A", seatNumber: 3 }, ...] }
// @access Private (customer) — voluntary release, e.g. user leaves checkout
//
// Only releases seats currently held BY THIS USER — prevents a user from
// releasing someone else's hold by guessing seat numbers.
const releaseSeats = async (req, res) => {
    try {
        const { seats } = req.body;
        const showId = req.params.id;

        if (!Array.isArray(seats) || seats.length === 0) {
            return res.status(400).json({ message: 'seats array is required' });
        }

        const orConditions = seats.map(({ row, seatNumber }) => ({ row, seatNumber }));

        const result = await SeatStatus.updateMany(
            {
                show: showId,
                status: 'held',
                heldBy: req.user._id,
                $or: orConditions,
            },
            { status: 'available', heldBy: null, holdExpiresAt: null }
        );

        if (result.modifiedCount > 0) {
            emitSeatUpdate(showId, {
                seats: seats.map(({ row, seatNumber }) => ({ row, seatNumber, status: 'available' })),
                reason: 'released',
            });
        }

        return res.status(200).json({
            message: 'Seats released',
            releasedCount: result.modifiedCount,
        });
    } catch (err) {
        return res.status(500).json({ message: 'Failed to release seats', error: err.message });
    }
};

module.exports = { holdSeats, releaseSeats };