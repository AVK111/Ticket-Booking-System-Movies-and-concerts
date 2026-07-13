// Run with: npm run seed
// Creates one admin, one organiser, a venue, and a show — enough to start
// testing the whole booking flow immediately without manual Postman setup.
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Venue = require('../models/Venue');
const Show = require('../models/Show');
const generateSeatMapForShow = require('../utils/generateSeatMapForShow');

const seed = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Wipe existing data so this script is safely re-runnable
    await Promise.all([User.deleteMany({}), Venue.deleteMany({}), Show.deleteMany({})]);
    const SeatStatus = require('../models/SeatStatus');
    await SeatStatus.deleteMany({});

    const admin = await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin',
    });

    const organiser = await User.create({
        name: 'Olivia Organiser',
        email: 'organiser@example.com',
        password: 'password123',
        role: 'organiser',
    });

    await User.create({
        name: 'Charlie Customer',
        email: 'customer@example.com',
        password: 'password123',
        role: 'customer',
    });

    const venue = await Venue.create({
        name: 'Grand Cineplex',
        address: '123 Main Street, Pune',
        createdBy: admin._id,
        seatMap: [
            { row: 'A', category: 'Premium', seatCount: 8 },
            { row: 'B', category: 'Premium', seatCount: 8 },
            { row: 'C', category: 'Standard', seatCount: 10 },
            { row: 'D', category: 'Standard', seatCount: 10 },
        ],
    });

    const show = await Show.create({
        title: 'Dune: Part Three',
        type: 'movie',
        organiser: organiser._id,
        venue: venue._id,
        showDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        pricing: [
            { category: 'Premium', price: 350 },
            { category: 'Standard', price: 200 },
        ],
    });

    const seatCount = await generateSeatMapForShow(show._id, venue);

    console.log('\nSeed complete:');
    console.log(`  Admin      -> admin@example.com / password123`);
    console.log(`  Organiser  -> organiser@example.com / password123`);
    console.log(`  Customer   -> customer@example.com / password123`);
    console.log(`  Venue      -> ${venue.name} (${venue._id})`);
    console.log(`  Show       -> ${show.title} (${show._id}), ${seatCount} seats generated`);

    await mongoose.disconnect();
    process.exit(0);
};

seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});