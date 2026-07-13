import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// One shared socket connection for the whole app, created lazily so we
// don't open a connection before it's actually needed.
let socket = null;

export const getSocket = () => {
    if (!socket) {
        socket = io(SOCKET_URL, { autoConnect: true });
    }
    return socket;
};