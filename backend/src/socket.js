const { Server } = require('socket.io');

let ioInstance = null;

// Called once from server.js with the raw HTTP server.
const initSocket = (httpServer) => {
    ioInstance = new Server(httpServer, {
        cors: { origin: process.env.CLIENT_URL || '*' },
    });

    ioInstance.on('connection', (socket) => {
        // Frontend joins a "room" per show it's currently viewing, so seat
        // updates only broadcast to people looking at that specific show.
        socket.on('joinShow', (showId) => {
            socket.join(`show:${showId}`);
        });

        socket.on('leaveShow', (showId) => {
            socket.leave(`show:${showId}`);
        });

        socket.on('disconnect', () => {
            // socket.io auto-removes the socket from all rooms on disconnect
        });
    });

    console.log('Socket.io initialized');
    return ioInstance;
};

// Used by controllers/cron jobs to emit events after they've been initialized.
const getIO = () => {
    if (!ioInstance) {
        throw new Error('Socket.io not initialized — call initSocket(server) first');
    }
    return ioInstance;
};

// Convenience: broadcast a seat update to everyone viewing a show.
// payload example: { seats: [{row, seatNumber, status}], reason: 'held' | 'released' | 'booked' }
const emitSeatUpdate = (showId, payload) => {
    if (!ioInstance) return; // no-op if sockets aren't running (e.g. in tests)
    ioInstance.to(`show:${showId}`).emit('seatUpdate', payload);
};

module.exports = { initSocket, getIO, emitSeatUpdate };