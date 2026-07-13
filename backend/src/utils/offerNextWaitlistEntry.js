const SeatStatus = require('../models/SeatStatus');
const Waitlist = require('../models/Waitlist');
const Show = require('../models/Show');
const sendEmail = require('./sendEmail');
const { emitSeatUpdate } = require('../socket');

const OFFER_TTL_MS = (parseInt(process.env.WAITLIST_OFFER_TTL_MINUTES, 10) || 15) * 60 * 1000;

// Called whenever a specific seat becomes free (booking cancelled, or a
// previous waitlist offer expired without being claimed). Looks for the
// longest-waiting person on this show+category's waitlist and, if found,
// hands them the seat as a time-limited offer instead of opening it to
// everyone. If nobody is waiting, the seat is simply released to 'available'.
//
// Returns true if the seat was offered to someone, false if released as normal.
const offerNextWaitlistEntry = async (showId, category, seat) => {
    // Atomically claim the earliest waiting entry so two seats freeing up at
    // once can't both try to offer themselves to the same waitlist customer.
    const nextEntry = await Waitlist.findOneAndUpdate(
        { show: showId, category, status: 'waiting' },
        { status: 'offered' }, // placeholder flip; full fields set below
        { sort: { createdAt: 1 }, new: false } // new:false -> get pre-update doc, but status already flipped atomically
    );

    if (!nextEntry) {
        // Nobody waiting — release the seat normally
        await SeatStatus.findByIdAndUpdate(seat._id, {
            status: 'available',
            heldBy: null,
            holdExpiresAt: null,
            waitlistOfferId: null,
        });
        emitSeatUpdate(showId, {
            seats: [{ row: seat.row, seatNumber: seat.seatNumber, status: 'available' }],
            reason: 'released',
        });
        return false;
    }

    const offerExpiresAt = new Date(Date.now() + OFFER_TTL_MS);

    await SeatStatus.findByIdAndUpdate(seat._id, {
        status: 'held',
        heldBy: nextEntry.customer,
        holdExpiresAt: offerExpiresAt,
        waitlistOfferId: nextEntry._id,
    });

    await Waitlist.findByIdAndUpdate(nextEntry._id, {
        status: 'offered',
        offeredSeat: { row: seat.row, seatNumber: seat.seatNumber },
        offerExpiresAt,
    });

    emitSeatUpdate(showId, {
        seats: [{ row: seat.row, seatNumber: seat.seatNumber, status: 'held' }],
        reason: 'waitlist_offer',
    });

    // Notify the customer — they need to complete the booking before offerExpiresAt
    const show = await Show.findById(showId);
    const User = require('../models/User');
    const customer = await User.findById(nextEntry.customer);

    if (customer) {
        await sendEmail({
            to: customer.email,
            subject: `A seat is available — ${show?.title || 'your event'} (act fast!)`,
            html: `
        <h2>A seat opened up!</h2>
        <p>Seat <strong>${seat.row}${seat.seatNumber}</strong> (${category}) is being held for you.</p>
        <p>You have until <strong>${offerExpiresAt.toLocaleString()}</strong> to complete your booking,
        or it will be offered to the next person in line.</p>
        <p>Log in and go to "Complete Booking" for this show to confirm your seat.</p>
      `,
        });
    }

    return true;
};

module.exports = offerNextWaitlistEntry;