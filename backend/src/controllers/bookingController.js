const QRCode = require('qrcode');
const SeatStatus = require('../models/SeatStatus');
const Show = require('../models/Show');
const Booking = require('../models/Booking');
const Waitlist = require('../models/Waitlist');
const generateBookingRef = require('../utils/generateBookingRef');
const sendEmail = require('../utils/sendEmail');
const { bookingConfirmationEmail } = require('../utils/emailTemplates');
const offerNextWaitlistEntry = require('../utils/offerNextWaitlistEntry');
const { emitSeatUpdate } = require('../socket');

// @route  POST /api/bookings
// @body   { showId, seats: [{ row, seatNumber }] }
// @access Private (customer)
//
// Only converts seats that are currently 'held' by THIS user into 'booked'.
// Two-step approach: (1) verify everything up front with zero writes, so a
// bad request never touches the DB; (2) do the atomic per-seat updates, and
// if any single one unexpectedly fails (e.g. TTL cron beat us to it), roll
// back whatever was already flipped in this request.
const createBooking = async (req, res) => {
    try {
        const { showId, seats } = req.body;

        if (!showId || !Array.isArray(seats) || seats.length === 0) {
            return res.status(400).json({ message: 'showId and seats array are required' });
        }

        const show = await Show.findById(showId);
        if (!show) return res.status(404).json({ message: 'Show not found' });

        // Step 1 — verify every requested seat is actually held by this user
        const currentSeats = await SeatStatus.find({
            show: showId,
            $or: seats.map(({ row, seatNumber }) => ({ row, seatNumber })),
        });

        const notHeldByUser = currentSeats.filter(
            (s) => s.status !== 'held' || s.heldBy?.toString() !== req.user._id.toString()
        );

        if (currentSeats.length !== seats.length || notHeldByUser.length > 0) {
            return res.status(409).json({
                message: 'One or more seats are not currently held by you. Please re-select and try again.',
            });
        }

        // Step 2 — atomically flip each seat from held-by-you to booked
        const confirmedSeats = [];
        const failedSeats = [];

        for (const seat of currentSeats) {
            const updated = await SeatStatus.findOneAndUpdate(
                { _id: seat._id, status: 'held', heldBy: req.user._id },
                { status: 'booked', heldBy: null, holdExpiresAt: null, waitlistOfferId: null },
                { new: true }
            );
            if (updated) {
                confirmedSeats.push(updated);
                // If this seat was held via a waitlist offer, mark that entry converted
                if (seat.waitlistOfferId) {
                    await Waitlist.findByIdAndUpdate(seat.waitlistOfferId, { status: 'converted' });
                }
            } else {
                failedSeats.push(seat);
            }
        }

        if (failedSeats.length > 0) {
            // Roll back whatever we just booked in this request
            const rollbackIds = confirmedSeats.map((s) => s._id);
            if (rollbackIds.length > 0) {
                await SeatStatus.updateMany(
                    { _id: { $in: rollbackIds } },
                    { status: 'available', heldBy: null, holdExpiresAt: null }
                );
            }
            return res.status(409).json({
                message: 'Your hold expired on one or more seats. Please re-select and try again.',
            });
        }

        // Build the seat + price breakdown from the show's per-category pricing
        const priceMap = {};
        for (const p of show.pricing) priceMap[p.category] = p.price;

        const bookedSeats = confirmedSeats.map((s) => ({
            row: s.row,
            seatNumber: s.seatNumber,
            category: s.category,
            price: priceMap[s.category] ?? 0,
        }));
        const totalAmount = bookedSeats.reduce((sum, s) => sum + s.price, 0);

        const booking = await Booking.create({
            bookingRef: generateBookingRef(),
            customer: req.user._id,
            show: showId,
            seats: bookedSeats,
            totalAmount,
        });

        emitSeatUpdate(showId, {
            seats: bookedSeats.map((s) => ({ row: s.row, seatNumber: s.seatNumber, status: 'booked' })),
            reason: 'booked',
        });

        // Generate QR (encodes the booking reference) and email it — failure to
        // email should not fail the booking itself, since the seats are already sold.
        const qrBuffer = await QRCode.toBuffer(booking.bookingRef, { width: 300 });

        const seatList = bookedSeats.map((s) => `${s.row}${s.seatNumber} (${s.category})`).join(', ');
        await sendEmail({
            to: req.user.email,
            subject: `Booking Confirmed — ${show.title} (${booking.bookingRef})`,
            html: bookingConfirmationEmail({ show, booking, seatList, totalAmount }),
            attachments: [{ filename: 'ticket-qr.png', content: qrBuffer, cid: 'qrcode' }],
        });

        return res.status(201).json(booking);
    } catch (err) {
        return res.status(500).json({ message: 'Booking failed', error: err.message });
    }
};

// @route  GET /api/bookings/my
// @access Private (customer)
const getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ customer: req.user._id })
            .populate('show', 'title showDateTime type')
            .sort({ createdAt: -1 });
        return res.status(200).json(bookings);
    } catch (err) {
        return res.status(500).json({ message: 'Failed to fetch bookings', error: err.message });
    }
};

// @route  GET /api/bookings/:id
// @access Private (customer, owner only)
const getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('show');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.customer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not your booking' });
        }
        return res.status(200).json(booking);
    } catch (err) {
        return res.status(400).json({ message: 'Invalid booking id' });
    }
};

// @route  POST /api/bookings/:id/cancel
// @access Private (customer, owner only)
//
// NOTE: releases seats straight to 'available'. Phase E will change this to
// check the waitlist first and offer the seat there before opening it up.
const cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.customer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not your booking' });
        }
        if (booking.status === 'cancelled') {
            return res.status(400).json({ message: 'Booking already cancelled' });
        }

        booking.status = 'cancelled';
        await booking.save();

        // For each cancelled seat: offer it to the next waitlisted customer for
        // that category if one exists, otherwise release it to 'available'.
        // (offerNextWaitlistEntry handles both the seat update and the socket emit.)
        const seatDocs = await SeatStatus.find({
            show: booking.show,
            $or: booking.seats.map((s) => ({ row: s.row, seatNumber: s.seatNumber })),
        });

        for (const seat of seatDocs) {
            await offerNextWaitlistEntry(booking.show.toString(), seat.category, seat);
        }

        return res.status(200).json({ message: 'Booking cancelled', booking });
    } catch (err) {
        return res.status(500).json({ message: 'Failed to cancel booking', error: err.message });
    }
};

module.exports = { createBooking, getMyBookings, getBookingById, cancelBooking };