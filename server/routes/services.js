const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all services
router.get('/', async (req, res) => {
    try {
        const [services] = await db.query(`
            SELECT s.*, u.name as worker_name, u.city, u.rating as worker_rating 
            FROM services s 
            JOIN users u ON s.worker_id = u.id 
            WHERE s.available = true 
            ORDER BY s.rating DESC
        `);
        
        res.json(services);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get services by category
router.get('/category/:category', async (req, res) => {
    try {
        const [services] = await db.query(
            `SELECT s.*, u.name as worker_name, u.city, u.rating as worker_rating 
             FROM services s 
             JOIN users u ON s.worker_id = u.id 
             WHERE s.category = ? AND s.available = true`,
            [req.params.category]
        );
        
        res.json(services);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Create service (for workers)
router.post('/', async (req, res) => {
    try {
        const { workerId, serviceName, description, price, category, duration } = req.body;

        // Check if worker exists
        const [workers] = await db.query(
            'SELECT * FROM users WHERE id = ? AND role = "worker"',
            [workerId]
        );

        if (workers.length === 0) {
            return res.status(400).json({ message: 'Invalid worker ID' });
        }

        const worker = workers[0];

        // Insert service
        const [result] = await db.query(
            'INSERT INTO services (service_name, description, price, worker_id, worker_name, category, duration) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [serviceName, description, price, workerId, worker.name, category, duration]
        );

        // Get inserted service
        const [newService] = await db.query(
            'SELECT * FROM services WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json(newService[0]);

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;