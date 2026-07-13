const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verifies the JWT from the Authorization header and attaches the user to req.user
const protect = async (req, res, next) => {
    let token;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Fetch fresh user (without password) so role/email are always current
        req.user = await User.findById(decoded.id);

        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized, user no longer exists' });
        }

        next();
    } catch (err) {
        return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
    }
};

// Usage: requireRole('admin') or requireRole('admin', 'organiser')
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access denied: requires role ${allowedRoles.join(' or ')}`,
            });
        }
        next();
    };
};

// Like `protect`, but never rejects the request — just attaches req.user if
// a valid token happens to be present. Used on public routes that still want
// to know "is this seat held by the current viewer specifically".
const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id);
        } catch (err) {
            // invalid/expired token on a public route — just proceed as a guest
        }
    }
    next();
};

module.exports = { protect, requireRole, optionalAuth };