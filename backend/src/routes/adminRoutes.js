const express = require('express');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

// Example of a role-protected route.
// Later, replace this with real venue/admin endpoints (Phase A step 3 in the plan).
router.get('/ping', protect, requireRole('admin'), (req, res) => {
    res.status(200).json({ message: `Hello admin ${req.user.name}, access confirmed.` });
});

module.exports = router;