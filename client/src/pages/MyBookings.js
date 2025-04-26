import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Card,
    CardContent,
    Grid,
    Button,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const MyBookings = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);

    useEffect(() => {
        if (user) {
            fetchBookings();
        }
    }, [user]);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const { data } = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/reservations/user`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setBookings(data);
            setError(null);
        } catch (error) {
            setError('Failed to fetch bookings');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelClick = (booking) => {
        setSelectedBooking(booking);
        setCancelDialogOpen(true);
    };

    const handleCancelConfirm = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            await axios.delete(
                `${process.env.REACT_APP_API_URL}/api/reservations/${selectedBooking.id}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setBookings(bookings.filter(b => b.id !== selectedBooking.id));
            setError(null);
        } catch (error) {
            setError('Failed to cancel booking');
            console.error('Error:', error);
        } finally {
            setLoading(false);
            setCancelDialogOpen(false);
        }
    };

    if (!user) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Alert severity="info">
                    Please log in to view your bookings
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Typography variant="h4" gutterBottom>
                My Bookings
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {loading ? (
                <Box display="flex" justifyContent="center" mt={4}>
                    <CircularProgress />
                </Box>
            ) : bookings.length === 0 ? (
                <Alert severity="info">
                    You don't have any bookings yet
                </Alert>
            ) : (
                <Grid container spacing={3}>
                    {bookings.map((booking) => (
                        <Grid item xs={12} key={booking.id}>
                            <Card>
                                <CardContent>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={8}>
                                            <Typography variant="h6">
                                                {booking.origin} → {booking.destination}
                                            </Typography>
                                            <Typography color="text.secondary">
                                                Date: {new Date(booking.reservation_date).toLocaleDateString()}
                                            </Typography>
                                            <Typography color="text.secondary">
                                                Departure: {new Date(`2000-01-01T${booking.departure_time}`).toLocaleTimeString()}
                                            </Typography>
                                            <Typography color="text.secondary">
                                                Seat: {booking.seat_number}
                                            </Typography>
                                            <Typography color="text.secondary">
                                                Price: ${booking.price}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                            {booking.status === 'confirmed' && (
                                                <Button
                                                    variant="outlined"
                                                    color="error"
                                                    onClick={() => handleCancelClick(booking)}
                                                >
                                                    Cancel Booking
                                                </Button>
                                            )}
                                            {booking.status === 'cancelled' && (
                                                <Typography color="error">
                                                    Cancelled
                                                </Typography>
                                            )}
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            <Dialog
                open={cancelDialogOpen}
                onClose={() => setCancelDialogOpen(false)}
            >
                <DialogTitle>Cancel Booking</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to cancel this booking?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCancelDialogOpen(false)}>
                        No, Keep Booking
                    </Button>
                    <Button onClick={handleCancelConfirm} color="error">
                        Yes, Cancel Booking
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default MyBookings; 