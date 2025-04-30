const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// Helper functions to replace date-fns functionality
function parseDate(dateString) {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
}

function isValidDate(date) {
    return date instanceof Date && !isNaN(date.getTime());
}

function formatDate(date, format = 'yyyy-MM-dd') {
    if (!isValidDate(date)) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    if (format === 'yyyy-MM-dd') {
        return `${year}-${month}-${day}`;
    }

    // Add more format options as needed
    return `${year}-${month}-${day}`;
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function getStartOfWeek(date) {
    // Get the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const day = date.getDay();
    // Calculate the difference to Monday (1)
    // If Sunday (0), we need to go back 6 days, otherwise go back (day - 1) days
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);

    const result = new Date(date);
    result.setDate(diff);
    return result;
}

// Get weekly seats report
router.post('/seats-report', verifyToken, async (req, res) => {
    try {
        const { date } = req.body;

        // Validate date format
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
        }

        // Generate array of 7 dates starting from the provided date
        const dates = Array.from({ length: 7 }, (_, i) => {
            const currentDate = new Date(date);
            currentDate.setDate(currentDate.getDate() + i);
            return currentDate.toISOString().split('T')[0];
        });

        // Get reservations for all 7 days
        const query = `
            SELECT 
                r.id as reservation_id,
                r.reservation_date as date,
                r.seat_number as seat_quantity,
                r.status,
                u.name as passenger_name,
                u.email as passenger_email,
                u.phone_number as passenger_phone,
                CONCAT(rt.origin, ' → ', rt.destination) as route_name,
                rt.capacity as total_seats
            FROM reservations r
            JOIN users u ON r.user_id = u.id
            JOIN routes rt ON r.route_id = rt.id
            WHERE DATE(r.reservation_date) IN (?)
            ORDER BY r.reservation_date ASC, rt.origin ASC, rt.destination ASC
        `;

        const result = await pool.query(query, [dates]);
        // console.log(result, 'result');
        // console.log(dates, 'dates');
        const reservations = result.rows || result[0] || [];

        // Group reservations by date and route
        const reportData = dates.map(date => {
            // Format the date to match the database format (YYYY-MM-DD)
            const formattedDate = new Date(date).toISOString().split('T')[0];

            // Log the date comparison for debugging
            console.log(`Looking for reservations on date: ${formattedDate}`);
            console.log(`Available reservation dates: ${reservations.map(r => r.date).join(', ')}`);

            // Use a more flexible date comparison
            const dateReservations = reservations.filter(r => {
                // Convert both dates to YYYY-MM-DD format for comparison
                const reservationDate = new Date(r.date).toISOString().split('T')[0];
                return reservationDate === formattedDate;
            });

            console.log(`Found ${dateReservations.length} reservations for ${formattedDate}`);

            const routeData = {};

            dateReservations.forEach(reservation => {
                const { route_name, total_seats } = reservation;
                if (!routeData[route_name]) {
                    routeData[route_name] = {
                        total_seats,
                        reservations: []
                    };
                }
                routeData[route_name].reservations.push(reservation);
            });

            return {
                date,
                routes: Object.entries(routeData).map(([routeName, data]) => ({
                    route_name: routeName,
                    total_seats: data.total_seats,
                    occupied_seats: data.reservations.reduce((sum, r) => sum + parseInt(r.seat_quantity), 0),
                    occupancy_percentage: Math.round((data.reservations.reduce((sum, r) => sum + parseInt(r.seat_quantity), 0) / data.total_seats) * 100),
                    passengers: data.reservations.map(r => ({
                        name: r.passenger_name,
                        email: r.passenger_email,
                        phone: r.passenger_phone,
                        seat_quantity: r.seat_quantity,
                        status: r.status
                    }))
                }))
            };
        });

        res.json({ days: reportData });
    } catch (error) {
        console.error('Error fetching seats report:', error);
        res.status(500).json({ message: 'Error al obtener el reporte de asientos' });
    }
});

module.exports = router; 