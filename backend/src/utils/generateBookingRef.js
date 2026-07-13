const crypto = require('crypto');

// Short, human-readable, unique-enough booking reference, e.g. "TB-8F2A9C1D"
const generateBookingRef = () => {
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `TB-${random}`;
};

module.exports = generateBookingRef;