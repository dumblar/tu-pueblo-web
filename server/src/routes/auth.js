const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { verifyGoogleToken, verifyToken } = require('../middleware/auth');

// Google OAuth login
router.post('/google', async (req, res) => {
    try {
        const { token } = req.body;
        const payload = await verifyGoogleToken(token);
        console.log('Google user info:', payload);

        // Check if user exists
        const [users] = await pool.query(
            'SELECT * FROM users WHERE google_id = ?',
            [payload.sub]
        );

        let userId;
        if (users.length === 0) {
            // Create new user
            userId = uuidv4();
            await pool.query(
                'INSERT INTO users (id, email, name, google_id) VALUES (?, ?, ?, ?)',
                [userId, payload.email, payload.name, payload.sub]
            );
        } else {
            userId = users[0].id;
        }

        // Generate JWT
        const jwtToken = jwt.sign(
            { id: userId, email: payload.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token: jwtToken });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(401).json({ message: 'Authentication failed' });
    }
});

// Get user information
router.get('/user-info', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Get user information
        const [users] = await pool.query(
            'SELECT id, email, name, phone_number,isAdmin FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = users[0];
        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            phone_number: user.phone_number,
            isAdmin: user.isAdmin
        });
    } catch (error) {
        console.error('Error getting user info:', error);
        res.status(500).json({ message: 'Failed to get user information' });
    }
});

// Verify phone number
router.post(
    '/verify-phone',
    [
        body('phoneNumber').matches(/^\+?[1-9]\d{1,14}$/).withMessage('Invalid phone number format'),
    ],
    verifyToken,
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { phoneNumber } = req.body;
            const userId = req.user.id;
            console.log(phoneNumber, userId);
            // Update user's phone number
            await pool.query(
                'UPDATE users SET phone_number = ? WHERE id = ?',
                [phoneNumber, userId]
            );

            res.json({ message: 'Phone number updated successfully' });
        } catch (error) {
            console.error('Phone verification error:', error);
            res.status(500).json({ message: 'Failed to update phone number' });
        }
    }
);

module.exports = router; 