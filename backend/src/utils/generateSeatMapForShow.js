const SeatStatus = require('../models/SeatStatus');

// Called once when a Show is created. Reads the venue's seatMap
// (e.g. [{ row: "A", category: "Premium", seatCount: 10 }]) and creates
// one SeatStatus doc per individual seat, all starting as 'available'.
const generateSeatMapForShow = async (showId, venue) => {
    const seatDocs = [];

    for (const rowConfig of venue.seatMap) {
        for (let seatNumber = 1; seatNumber <= rowConfig.seatCount; seatNumber++) {
            seatDocs.push({
                show: showId,
                row: rowConfig.row,
                seatNumber,
                category: rowConfig.category,
                status: 'available',
            });
        }
    }

    await SeatStatus.insertMany(seatDocs);
    return seatDocs.length;
};

module.exports = generateSeatMapForShow;