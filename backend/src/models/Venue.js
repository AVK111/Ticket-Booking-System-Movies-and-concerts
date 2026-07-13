const mongoose = require('mongoose');

// One entry per physical row in the venue. Seat-level documents (Phase B)
// get generated from this when a Show is created against the venue.
const rowConfigSchema = new mongoose.Schema(
    {
        row: { type: String, required: true }, // e.g. "A"
        category: { type: String, required: true }, // e.g. "Premium", "Standard"
        seatCount: { type: Number, required: true, min: 1 },
    },
    { _id: false }
);

const venueSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        address: { type: String, required: true, trim: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        seatMap: {
            type: [rowConfigSchema],
            required: true,
            validate: {
                validator: (arr) => arr.length > 0,
                message: 'Venue must have at least one row configured',
            },
        },
    },
    { timestamps: true }
);

// Convenience: list of distinct category names, and total seat count.
// Used by showController to validate pricing entries against real categories.
venueSchema.methods.getCategories = function () {
    return [...new Set(this.seatMap.map((r) => r.category))];
};

venueSchema.methods.getTotalSeats = function () {
    return this.seatMap.reduce((sum, r) => sum + r.seatCount, 0);
};

module.exports = mongoose.model('Venue', venueSchema);