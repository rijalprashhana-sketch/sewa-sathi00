const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = 'sewasathi-secret-key-2024';

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, phone, city, skills } = req.body;

        // Check if user exists
        const [existingUsers] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const skillsString = skills ? JSON.stringify(skills) : null;
        
        const [result] = await db.query(
            'INSERT INTO users (name, email, password, role, phone, city, skills) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, email, hashedPassword, role, phone, city, skillsString]
        );

        // Get inserted user
        const [newUser] = await db.query(
            'SELECT id, name, email, role, city FROM users WHERE id = ?',
            [result.insertId]
        );

        const user = newUser[0];

        // Generate token
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                city: user.city
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const [users] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = users[0];

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                city: user.city
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;