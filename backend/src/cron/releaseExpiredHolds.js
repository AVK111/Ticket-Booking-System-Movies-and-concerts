const cron = require('node-cron');
const SeatStatus = require('../models/SeatStatus');
const Waitlist = require('../models/Waitlist');
const offerNextWaitlistEntry = require('../utils/offerNextWaitlistEntry');
const { emitSeatUpdate } = require('../socket');

// Runs every 15 seconds. Finds any seat still marked 'held' whose TTL has
// passed. Two cases:
//   1. Normal customer hold expired            -> release straight to 'available'
//   2. A waitlist time-limited offer expired    -> mark that waitlist entry
//      'expired' and cascade the seat to the NEXT person in that category's
//      queue (or release it if nobody's left waiting)
//
// The match condition (status:'held' AND holdExpiresAt < now) is itself the
// concurrency guard: if a booking confirms the seat a split second before
// this runs, the seat is already 'booked' and won't match — so we never
// accidentally un-book a just-confirmed seat.
const startSeatHoldReleaseCron = () => {
  cron.schedule('*/15 * * * * *', async () => {
    try {
      const expired = await SeatStatus.find({
        status: 'held',
        holdExpiresAt: { $lt: new Date() },
      });

      if (expired.length === 0) return;

      for (const seat of expired) {
        if (seat.waitlistOfferId) {
          // Case 2 — waitlist offer expired, cascade to next in line
          await Waitlist.findByIdAndUpdate(seat.waitlistOfferId, { status: 'expired' });
          await offerNextWaitlistEntry(seat.show.toString(), seat.category, seat);
        } else {
          // Case 1 — plain hold expired, just release it
          await SeatStatus.findByIdAndUpdate(seat._id, {
            status: 'available',
            heldBy: null,
            holdExpiresAt: null,
          });
          emitSeatUpdate(seat.show.toString(), {
            seats: [{ row: seat.row, seatNumber: seat.seatNumber, status: 'available' }],
            reason: 'ttl_expired',
          });
        }
      }

      console.log(`[seat-hold-cron] processed ${expired.length} expired hold(s)`);
    } catch (err) {
      console.error('[seat-hold-cron] error releasing expired holds:', err.message);
    }
  });

  console.log('Seat hold release cron started (every 15s)');
};

module.exports = startSeatHoldReleaseCron;