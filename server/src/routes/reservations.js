const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { notifyNewReservation, notifyCancelledReservation } = require('../services/notificationService');

// Create a new reservation
router.post('/', verifyToken, async (req, res) => {
    try {
        const { routeId, reservationDate, seatNumber, status = 'confirmed' } = req.body;
        const userId = req.user.id;

        // Validate required fields
        if (!routeId || !reservationDate || !seatNumber) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Validate seat number is a positive integer
        if (!Number.isInteger(seatNumber) || seatNumber < 1) {
            return res.status(400).json({ message: 'Seat number must be a positive integer' });
        }

        // Check if user has a phone number (only for confirmed reservations)
        if (status === 'confirmed') {
            const [users] = await pool.query(
                'SELECT phone FROM users WHERE id = ?',
                [userId]
            );

            if (!users[0].phone) {
                return res.status(400).json({ message: 'Phone number is required for confirmed reservations' });
            }
        }

        // Get route details to check capacity
        const [routes] = await pool.query(
            'SELECT capacity FROM routes WHERE id = ?',
            [routeId]
        );

        if (routes.length === 0) {
            return res.status(404).json({ message: 'Route not found' });
        }

        const route = routes[0];

        // Check if there are enough seats available
        const [bookings] = await pool.query(
            'SELECT SUM(seat_number) as total_booked FROM reservations WHERE route_id = ? AND reservation_date = ? AND status != "cancelled"',
            [routeId, reservationDate]
        );

        const totalBooked = bookings[0].total_booked || 0;
        const availableSeats = route.capacity - totalBooked;

        if (seatNumber > availableSeats) {
            return res.status(400).json({ message: `Only ${availableSeats} seats available` });
        }

        // Create the reservation
        const [result] = await pool.query(
            'INSERT INTO reservations (user_id, route_id, reservation_date, seat_number, status) VALUES (?, ?, ?, ?, ?)',
            [userId, routeId, reservationDate, seatNumber, status]
        );

        const reservationId = result.insertId;

        // Get the created reservation with route details
        const [reservations] = await pool.query(`
            SELECT r.*, rt.name as route_name, rt.origin, rt.destination, rt.departure_time
            FROM reservations r
            JOIN routes rt ON r.route_id = rt.id
            WHERE r.id = ?
        `, [reservationId]);

        const reservation = reservations[0];

        // Send admin notification
        await notifyNewReservation(reservation);

        res.status(201).json(reservation);
    } catch (error) {
        console.error('Error creating reservation:', error);
        res.status(500).json({ message: 'Failed to create reservation' });
    }
});

// Get user's reservations
router.get('/user', verifyToken, async (req, res) => {
    try {
        const [reservations] = await pool.query(`
      SELECT 
        r.*,
        rt.origin,
        rt.destination,
        rt.departure_time,
        rt.price
      FROM reservations r
      JOIN routes rt ON r.route_id = rt.id
      WHERE r.user_id = ?
      ORDER BY r.reservation_date DESC
    `, [req.user.id]);

        res.json(reservations);
    } catch (error) {
        console.error('Error fetching reservations:', error);
        res.status(500).json({ message: 'Failed to fetch reservations' });
    }
});

// Cancel a reservation
router.put('/:id/cancel', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Get the reservation to check ownership
        const [reservations] = await pool.query(
            'SELECT * FROM reservations WHERE id = ?',
            [id]
        );

        if (reservations.length === 0) {
            return res.status(404).json({ message: 'Reservation not found' });
        }

        const reservation = reservations[0];

        // Check if the user owns the reservation
        if (reservation.user_id !== userId) {
            return res.status(403).json({ message: 'Not authorized to cancel this reservation' });
        }

        // Update the reservation status to cancelled
        await pool.query(
            'UPDATE reservations SET status = "cancelled" WHERE id = ?',
            [id]
        );

        // Send admin notification about the cancellation
        await notifyCancelledReservation(reservation);

        res.json({ message: 'Reservation cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling reservation:', error);
        res.status(500).json({ message: 'Failed to cancel reservation' });
    }
});

module.exports = router; 