const mongoose = require('mongoose');

const bookedSeatSchema = new mongoose.Schema(
    {
        row: { type: String, required: true },
        seatNumber: { type: Number, required: true },
        category: { type: String, required: true },
        price: { type: Number, required: true },
    },
    { _id: false }
);

const bookingSchema = new mongoose.Schema(
    {
        bookingRef: { type: String, required: true, unique: true },
        customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        show: { type: mongoose.Schema.Types.ObjectId, ref: 'Show', required: true },
        seats: { type: [bookedSeatSchema], required: true },
        totalAmount: { type: Number, required: true },
        status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);