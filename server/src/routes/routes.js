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
router.get('/:routeId/availability/:date', async (req, res) => {
    try {
        const { routeId, date } = req.params;

        // Get route capacity
        const [routes] = await pool.query(
            'SELECT capacity FROM routes WHERE id = ?',
            [routeId]
        );

        if (routes.length === 0) {
            return res.status(404).json({ message: 'Route not found' });
        }

        const capacity = routes[0].capacity;

        // Get total booked seats for the date (treating seat_number as quantity)
        const [bookings] = await pool.query(
            'SELECT SUM(seat_number) as total_booked FROM reservations WHERE route_id = ? AND reservation_date = ? AND status != "cancelled"',
            [routeId, date]
        );

        const totalBooked = bookings[0].total_booked || 0;
        const availableSeats = capacity - totalBooked;

        res.json({
            date,
            availableSeats,
            totalSeats: capacity,
            bookedSeats: totalBooked
        });
    } catch (error) {
        console.error('Error getting route availability:', error);
        res.status(500).json({ message: 'Failed to get route availability' });
    }
});

// Get all routes with availability for a specific date
router.get('/availability/:date', async (req, res) => {
    try {
        const { date } = req.params;

        // Validate date format
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
        }

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
                COALESCE(SUM(res.seat_number), 0) as booked_seats
            FROM routes r
            LEFT JOIN reservations res ON r.id = res.route_id 
                AND res.reservation_date = ? 
                AND res.status != 'cancelled'
            GROUP BY r.id, r.name, r.capacity, r.created_at, r.updated_at
        `, [date]);

        if (!routes || routes.length === 0) {
            return res.json({
                isOperational: true,
                routes: []
            });
        }

        const routesWithAvailability = routes.map(route => ({
            ...route,
            available_seats: route.capacity - (parseInt(route.booked_seats) || 0)
        }));

        res.json({
            isOperational: true,
            routes: routesWithAvailability
        });
    } catch (error) {
        console.error('Error fetching route availability:', error);
        res.status(500).json({
            message: 'Failed to fetch route availability',
            error: error.message
        });
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