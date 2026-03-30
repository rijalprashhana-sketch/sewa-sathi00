const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Load .env if it exists
dotenv.config();

// Hardcoded fallbacks — works even WITHOUT a .env file
process.env.PORT       = process.env.PORT       || '5000';
process.env.MONGO_URI  = process.env.MONGO_URI  || 'mongodb://localhost:27017/sewasathi';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'sewasathi_jwt_secret_key_2024';

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected: localhost'))
    .catch(err => { console.error('MongoDB Error:', err.message); process.exit(1); });

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes    = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const User          = require('./models/User');
const { protect }   = require('./middleware/authMiddleware');

const userRoutes = require('./routes/users');
app.use('/api/auth',     authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users',    userRoutes);

// Serve frontend static files from ../public
const path = require('path');
app.use(express.static(path.join(__dirname, '..', 'public')));

// Catch-all: serve index.html for any unknown route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Get all workers, optionally filter by ?category=
app.get('/api/workers', async (req, res) => {
    try {
        const filter = { role: 'worker' };
        if (req.query.category) filter.category = req.query.category;
        const workers = await User.find(filter).select('-password');
        res.json({ success: true, data: workers });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Get workers by profession
app.get('/api/workers/profession/:profession', async (req, res) => {
    try {
        const workers = await User.find({
            role: 'worker',
            profession: { $regex: req.params.profession, $options: 'i' }
        }).select('-password');
        res.json({ success: true, data: workers });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Get all customers
app.get('/api/customers', async (req, res) => {
    try {
        const customers = await User.find({ role: 'customer' }).select('-password');
        res.json({ success: true, data: customers });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Delete user (protected)
app.delete('/api/users/:id', protect, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        await user.deleteOne();
        res.json({ success: true, message: 'User deleted' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Update user (protected)
app.put('/api/users/:id', protect, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
        res.json({ success: true, data: user });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
