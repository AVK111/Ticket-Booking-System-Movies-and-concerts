const mongoose = require('mongoose');

const waitlistSchema = new mongoose.Schema(
    {
        show: { type: mongoose.Schema.Types.ObjectId, ref: 'Show', required: true },
        category: { type: String, required: true },
        customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        // waiting   -> in the queue, no seat assigned yet
        // offered   -> a seat was assigned, time-limited offer is active
        // converted -> customer completed the booking in time
        // expired   -> customer didn't complete the booking in time
        // cancelled -> customer voluntarily left the queue
        status: {
            type: String,
            enum: ['waiting', 'offered', 'converted', 'expired', 'cancelled'],
            default: 'waiting',
        },
        offeredSeat: {
            row: { type: String, default: null },
            seatNumber: { type: Number, default: null },
        },
        offerExpiresAt: { type: Date, default: null },
    },
    { timestamps: true }
);

// FIFO ordering per show+category comes from createdAt — no separate
// position field needed, which avoids having to re-shuffle ranks on changes.
waitlistSchema.index({ show: 1, category: 1, status: 1, createdAt: 1 });

module.exports = mongoose.model('Waitlist', waitlistSchema);