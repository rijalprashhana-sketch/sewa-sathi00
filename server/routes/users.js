const express = require('express');
const router  = express.Router();
const User    = require('../models/User');

// GET /api/users?role=worker  — list users, optionally filtered by role
router.get('/', async (req, res) => {
    try {
        const filter = {};
        if (req.query.role) filter.role = req.query.role;
        const users = await User.find(filter).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;