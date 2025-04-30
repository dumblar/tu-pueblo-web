const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const { pool } = require('./config/database');
const authRoutes = require('./routes/auth');
const routesRoutes = require('./routes/routes');
const reservationsRoutes = require('./routes/reservations');
const adminRoutes = require('./routes/admin');

// Load environment variables
dotenv.config();

const app = express();

// Trust proxy - required when behind a reverse proxy
app.set('trust proxy', 1);

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS with default settings
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/routes', routesRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 