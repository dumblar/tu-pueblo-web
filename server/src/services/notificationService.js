const axios = require('axios');
require('dotenv').config();

/**
 * Sends an SMS notification to the admin phone number
 * @param {string} message - The message to send
 * @returns {Promise<boolean>} - Whether the notification was sent successfully
 */
const sendAdminNotification = async (message) => {
    try {
        const adminPhone = process.env.ADMIN_PHONE_NUMBER;

        if (!adminPhone) {
            console.error('Admin phone number not configured in environment variables');
            return false;
        }

        // Use the previous POST method
        const response = await axios.post('https://vcw-vcw-service-production.up.railway.app/v1/messages', {
            number: adminPhone,
            message: message
        });

        console.log(`Admin notification sent to ${adminPhone}`);
        return true;
    } catch (error) {
        console.error('Error sending admin notification:', error);
        return false;
    }
};

/**
 * Sends a notification about a new reservation
 * @param {Object} reservation - The reservation details
 * @returns {Promise<boolean>} - Whether the notification was sent successfully
 */
const notifyNewReservation = async (reservation) => {
    const message = `Nueva reserva: ${reservation.seat_number} asiento(s) para la ruta #${reservation.route_id} el ${reservation.reservation_date}`;
    return sendAdminNotification(message);
};

/**
 * Sends a notification about a cancelled reservation
 * @param {Object} reservation - The reservation details
 * @returns {Promise<boolean>} - Whether the notification was sent successfully
 */
const notifyCancelledReservation = async (reservation) => {
    const message = `Reserva cancelada: ${reservation.seat_number} asiento(s) para la ruta #${reservation.route_id} el ${reservation.reservation_date}`;
    return sendAdminNotification(message);
};

module.exports = {
    sendAdminNotification,
    notifyNewReservation,
    notifyCancelledReservation
}; 