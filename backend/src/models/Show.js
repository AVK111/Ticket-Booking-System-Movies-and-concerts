const mongoose = require('mongoose');

const pricingSchema = new mongoose.Schema(
    {
        category: { type: String, required: true }, // must match a category in venue.seatMap
        price: { type: Number, required: true, min: 0 },
    },
    { _id: false }
);

const showSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        type: { type: String, enum: ['movie', 'concert'], required: true },
        image: { type: String },
        organiser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true },
        showDateTime: { type: Date, required: true },
        pricing: {
            type: [pricingSchema],
            required: true,
            validate: {
                validator: (arr) => arr.length > 0,
                message: 'At least one category price is required',
            },
        },
        status: { type: String, enum: ['scheduled', 'cancelled'], default: 'scheduled' },
    },
    { timestamps: true }
);

showSchema.index({ venue: 1, showDateTime: 1 });

module.exports = mongoose.model('Show', showSchema);