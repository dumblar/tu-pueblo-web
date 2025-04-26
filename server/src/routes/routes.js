const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// Get all routes
router.get('/', async (req, res) => {
    try {
        const [routes] = await pool.query('SELECT * FROM routes');
        res.json(routes);
    } catch (error) {
        console.error('Error fetching routes:', error);
        res.status(500).json({ message: 'Failed to fetch routes' });
    }
});

// Get route availability for a specific date
router.get('/:date', async (req, res) => {
    try {
        const { date } = req.params;
        // Check if date is non-operational
        const [nonOperationalDays] = await pool.query(
            'SELECT * FROM non_operational_days WHERE date = ?',
            [date]
        );

        if (nonOperationalDays.length > 0) {
            return res.json({
                isOperational: false,
                reason: nonOperationalDays[0].reason
            });
        }
        // Get all routes with their availability
        const [routes] = await pool.query(`
      SELECT 
        r.*,
        COUNT(res.id) as booked_seats
      FROM routes r
      LEFT JOIN reservations res ON r.id = res.route_id 
        AND res.reservation_date = ? 
        AND res.status != 'cancelled'
      GROUP BY r.id
    `, [date]);
        const routesWithAvailability = routes.map(route => ({
            ...route,
            available_seats: route.capacity - route.booked_seats
        }));

        res.json({
            isOperational: true,
            routes: routesWithAvailability
        });
    } catch (error) {
        console.error('Error fetching route availability:', error);
        res.status(500).json({ message: 'Failed to fetch route availability' });
    }
});

// Get non-operational days (admin only)
router.get('/non-operational-days', verifyToken, async (req, res) => {
    try {
        const [days] = await pool.query('SELECT * FROM non_operational_days ORDER BY date');
        res.json(days);
    } catch (error) {
        console.error('Error fetching non-operational days:', error);
        res.status(500).json({ message: 'Failed to fetch non-operational days' });
    }
});

// Add non-operational day (admin only)
router.post('/non-operational-days', verifyToken, async (req, res) => {
    try {
        const { date, reason } = req.body;

        await pool.query(
            'INSERT INTO non_operational_days (date, reason) VALUES (?, ?)',
            [date, reason]
        );

        res.json({ message: 'Non-operational day added successfully' });
    } catch (error) {
        console.error('Error adding non-operational day:', error);
        res.status(500).json({ message: 'Failed to add non-operational day' });
    }
});

module.exports = router; 