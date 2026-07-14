// Run with: npm run seed:demo
// Same accounts as the basic seed, but populates 2 venues and 4 shows
// (2 movies + 2 concerts) for a fuller browse/demo experience.
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Venue = require('../models/Venue');
const Show = require('../models/Show');
const SeatStatus = require('../models/SeatStatus');
const generateSeatMapForShow = require('../utils/generateSeatMapForShow');

const daysFromNow = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

const seed = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await Promise.all([
        User.deleteMany({}),
        Venue.deleteMany({}),
        Show.deleteMany({}),
        SeatStatus.deleteMany({}),
    ]);

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

    // --- Venues ---
    const cineplex = await Venue.create({
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

    const arena = await Venue.create({
        name: 'Skyline Arena',
        address: '45 Riverside Avenue, Pune',
        createdBy: admin._id,
        seatMap: [
            { row: 'A', category: 'VIP', seatCount: 6 },
            { row: 'B', category: 'VIP', seatCount: 6 },
            { row: 'C', category: 'General', seatCount: 16 },
            { row: 'D', category: 'General', seatCount: 16 },
        ],
    });

    // --- Shows: 2 movies + 2 concerts ---
    const showDefs = [
        {
            title: 'Dune: Part Three',
            type: 'movie',
            venue: cineplex,
            showDateTime: daysFromNow(3),
            pricing: [
                { category: 'Premium', price: 350 },
                { category: 'Standard', price: 200 },
            ],
        },
        {
            title: 'The Last Heist',
            type: 'movie',
            venue: cineplex,
            showDateTime: daysFromNow(5),
            pricing: [
                { category: 'Premium', price: 320 },
                { category: 'Standard', price: 180 },
            ],
        },
        {
            title: 'Neon Skyline Tour',
            type: 'concert',
            venue: arena,
            showDateTime: daysFromNow(7),
            pricing: [
                { category: 'VIP', price: 2500 },
                { category: 'General', price: 900 },
            ],
        },
        {
            title: 'Acoustic Nights: Live',
            type: 'concert',
            venue: arena,
            showDateTime: daysFromNow(10),
            pricing: [
                { category: 'VIP', price: 1800 },
                { category: 'General', price: 700 },
            ],
        },
    ];

    console.log('\nSeed complete:');
    console.log(`  Admin      -> admin@example.com / password123`);
    console.log(`  Organiser  -> organiser@example.com / password123`);
    console.log(`  Customer   -> customer@example.com / password123`);
    console.log(`  Venues     -> ${cineplex.name}, ${arena.name}`);

    for (const def of showDefs) {
        const show = await Show.create({
            title: def.title,
            type: def.type,
            organiser: organiser._id,
            venue: def.venue._id,
            showDateTime: def.showDateTime,
            pricing: def.pricing,
        });
        const seatCount = await generateSeatMapForShow(show._id, def.venue);
        console.log(`  Show       -> ${show.title} (${def.type}) @ ${def.venue.name}, ${seatCount} seats`);
    }

    await mongoose.disconnect();
    process.exit(0);
};

seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});