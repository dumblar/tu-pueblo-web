const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { verifyGoogleToken } = require('../middleware/auth');

// Google OAuth login
router.post('/google', async (req, res) => {
    try {
        const { token } = req.body;
        const payload = await verifyGoogleToken(token);

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

// Verify phone number
router.post(
    '/verify-phone',
    [
        body('phoneNumber').matches(/^\+?[1-9]\d{1,14}$/).withMessage('Invalid phone number format'),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { phoneNumber } = req.body;
            const userId = req.user.id;

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