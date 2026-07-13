const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @route  POST /api/auth/register
// @access Public
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'An account with this email already exists' });
        }

        // Only allow customer/organiser at signup. Admin accounts should be created
        // manually (e.g. directly in the DB) — never trust role from a public signup form
        // beyond these two options.
        const allowedSelfRoles = ['customer', 'organiser'];
        const finalRole = allowedSelfRoles.includes(role) ? role : 'customer';

        const user = await User.create({ name, email, password, role: finalRole });

        return res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id, user.role),
        });
    } catch (err) {
        return res.status(500).json({ message: 'Registration failed', error: err.message });
    }
};

// @route  POST /api/auth/login
// @access Public
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // password has select:false on the schema, so explicitly request it here
        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        return res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id, user.role),
        });
    } catch (err) {
        return res.status(500).json({ message: 'Login failed', error: err.message });
    }
};

// @route  GET /api/auth/me
// @access Private (any logged-in user)
const getMe = async (req, res) => {
    // req.user is attached by the `protect` middleware
    return res.status(200).json(req.user);
};

module.exports = { register, login, getMe };