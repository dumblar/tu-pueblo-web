const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');

// Create a new reservation
router.post(
    '/',
    verifyToken,
    [
        body('routeId').isInt().withMessage('Invalid route ID'),
        body('reservationDate').isDate().withMessage('Invalid date'),
        body('seatNumber').isInt({ min: 1 }).withMessage('Invalid seat number'),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { routeId, reservationDate, seatNumber } = req.body;
            const userId = req.user.id;

            // Check if user has phone number
            const [users] = await pool.query(
                'SELECT phone_number FROM users WHERE id = ?',
                [userId]
            );

            if (!users[0].phone_number) {
                return res.status(400).json({
                    message: 'Phone number required for reservation'
                });
            }

            // Check if seat is available
            const [existingReservations] = await pool.query(
                'SELECT * FROM reservations WHERE route_id = ? AND reservation_date = ? AND seat_number = ? AND status != "cancelled"',
                [routeId, reservationDate, seatNumber]
            );

            if (existingReservations.length > 0) {
                return res.status(400).json({
                    message: 'Seat already reserved'
                });
            }

            // Create reservation
            const reservationId = uuidv4();
            await pool.query(
                'INSERT INTO reservations (id, user_id, route_id, reservation_date, seat_number, status) VALUES (?, ?, ?, ?, ?, "confirmed")',
                [reservationId, userId, routeId, reservationDate, seatNumber]
            );

            // Get route details for email
            const [routes] = await pool.query(
                'SELECT * FROM routes WHERE id = ?',
                [routeId]
            );

            // Send confirmation email
            await sendEmail({
                to: req.user.email,
                subject: 'Reservation Confirmation',
                text: `Your reservation has been confirmed for ${routes[0].origin} to ${routes[0].destination} on ${reservationDate} at seat ${seatNumber}.`
            });

            res.json({
                message: 'Reservation created successfully',
                reservationId
            });
        } catch (error) {
            console.error('Error creating reservation:', error);
            res.status(500).json({ message: 'Failed to create reservation' });
        }
    }
);

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

// Cancel reservation
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if reservation exists and belongs to user
        const [reservations] = await pool.query(
            'SELECT * FROM reservations WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );

        if (reservations.length === 0) {
            return res.status(404).json({ message: 'Reservation not found' });
        }

        // Cancel reservation
        await pool.query(
            'UPDATE reservations SET status = "cancelled" WHERE id = ?',
            [id]
        );

        // Send cancellation email
        await sendEmail({
            to: req.user.email,
            subject: 'Reservation Cancelled',
            text: `Your reservation for ${reservations[0].reservation_date} has been cancelled.`
        });

        res.json({ message: 'Reservation cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling reservation:', error);
        res.status(500).json({ message: 'Failed to cancel reservation' });
    }
});

module.exports = router; 