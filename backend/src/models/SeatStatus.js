const mongoose = require('mongoose');

const seatStatusSchema = new mongoose.Schema(
    {
        show: { type: mongoose.Schema.Types.ObjectId, ref: 'Show', required: true },
        row: { type: String, required: true },
        seatNumber: { type: Number, required: true },
        category: { type: String, required: true },
        status: {
            type: String,
            enum: ['available', 'held', 'booked'],
            default: 'available',
        },
        heldBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        holdExpiresAt: { type: Date, default: null },
        // Set when this seat is being held as a time-limited offer to a specific
        // waitlist entry (rather than a normal customer-initiated hold). Lets the
        // TTL cron tell the two cases apart and cascade to the next waitlister.
        waitlistOfferId: { type: mongoose.Schema.Types.ObjectId, ref: 'Waitlist', default: null },
    },
    { timestamps: true }
);

// One seat can only have one status doc per show
seatStatusSchema.index({ show: 1, row: 1, seatNumber: 1 }, { unique: true });

module.exports = mongoose.model('SeatStatus', seatStatusSchema);