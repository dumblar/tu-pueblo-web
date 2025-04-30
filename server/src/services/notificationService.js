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
 * Formats a date string to a more readable format
 * @param {string} dateString - The date string to format (YYYY-MM-DD)
 * @returns {string} - Formatted date string
 */
const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
};

/**
 * Sends a notification about a new reservation
 * @param {Object} reservation - The reservation details
 * @returns {Promise<boolean>} - Whether the notification was sent successfully
 */
const notifyNewReservation = async (reservation) => {
    const formattedDate = formatDate(reservation.reservation_date);
    const message = `🚌 NUEVA RESERVA\n\n` +
        `📅 Fecha: ${formattedDate}\n` +
        `📍 Ruta: ${reservation.route_name}\n` +
        `⏰ Hora: ${reservation.departure_time}\n` +
        `👥 Pasajeros: ${reservation.seat_number}\n` +
        `👤 Usuario: ${reservation.passenger_name}\n` +
        `📱 Teléfono: ${reservation.passenger_phone}\n` +
        `📧 Email: ${reservation.passenger_email}`;

    return sendAdminNotification(message);
};

/**
 * Sends a notification about a cancelled reservation
 * @param {Object} reservation - The reservation details
 * @returns {Promise<boolean>} - Whether the notification was sent successfully
 */
const notifyCancelledReservation = async (reservation) => {
    const formattedDate = formatDate(reservation.reservation_date);
    const message = `❌ RESERVA CANCELADA\n\n` +
        `📅 Fecha: ${formattedDate}\n` +
        `📍 Ruta: ${reservation.route_name}\n` +
        `⏰ Hora: ${reservation.departure_time}\n` +
        `👥 Pasajeros: ${reservation.seat_number}\n` +
        `👤 Usuario: ${reservation.passenger_name}\n` +
        `📱 Teléfono: ${reservation.passenger_phone}\n` +
        `📧 Email: ${reservation.passenger_email}`;

    return sendAdminNotification(message);
};

module.exports = {
    sendAdminNotification,
    notifyNewReservation,
    notifyCancelledReservation
}; 