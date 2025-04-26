import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    Stepper,
    Step,
    StepLabel,
    Button,
    TextField,
    Grid,
    Card,
    CardContent,
    Alert,
    CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const steps = ['Select Date', 'Choose Route', 'Select Seat', 'Confirm'];

const Reservation = () => {
    const navigate = useNavigate();
    const { user, login } = useAuth();
    const [activeStep, setActiveStep] = useState(0);
    const [selectedDate, setSelectedDate] = useState(null);
    const [routes, setRoutes] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [availableSeats, setAvailableSeats] = useState([]);
    const [selectedSeat, setSelectedSeat] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (selectedDate) {
            fetchRouteAvailability();
        }
    }, [selectedDate]);

    const fetchRouteAvailability = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/routes/${selectedDate.toISOString().split('T')[0]}`
            );
            setRoutes(data.routes || []);
            setError(null);
        } catch (error) {
            setError('Failed to fetch route availability');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDateSelect = (date) => {
        setSelectedDate(date);
        setActiveStep(1);
    };

    const handleRouteSelect = (route) => {
        setSelectedRoute(route);
        setAvailableSeats(Array.from({ length: route.capacity }, (_, i) => i + 1));
        setActiveStep(2);
    };

    const handleSeatSelect = (seat) => {
        setSelectedSeat(seat);
        setActiveStep(3);
    };

    const handleConfirm = async () => {
        if (!user) {
            login();
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            await axios.post(
                `${process.env.REACT_APP_API_URL}/api/reservations`,
                {
                    routeId: selectedRoute.id,
                    reservationDate: selectedDate.toISOString().split('T')[0],
                    seatNumber: selectedSeat
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            navigate('/my-bookings');
        } catch (error) {
            setError('Failed to create reservation');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Box textAlign="center">
                        <Typography variant="h6" gutterBottom>
                            Select Travel Date
                        </Typography>
                        <DatePicker
                            label="Date"
                            value={selectedDate}
                            onChange={handleDateSelect}
                            minDate={new Date()}
                            renderInput={(params) => <TextField {...params} />}
                        />
                    </Box>
                );

            case 1:
                return (
                    <Grid container spacing={2}>
                        {routes.map((route) => (
                            <Grid item xs={12} md={6} key={route.id}>
                                <Card
                                    onClick={() => handleRouteSelect(route)}
                                    sx={{ cursor: 'pointer' }}
                                >
                                    <CardContent>
                                        <Typography variant="h6">
                                            {route.origin} → {route.destination}
                                        </Typography>
                                        <Typography>
                                            Departure: {new Date(`2000-01-01T${route.departure_time}`).toLocaleTimeString()}
                                        </Typography>
                                        <Typography>
                                            Available Seats: {route.available_seats}
                                        </Typography>
                                        <Typography>
                                            Price: ${route.price}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                );

            case 2:
                return (
                    <Grid container spacing={2}>
                        {availableSeats.map((seat) => (
                            <Grid item xs={3} key={seat}>
                                <Card
                                    onClick={() => handleSeatSelect(seat)}
                                    sx={{
                                        cursor: 'pointer',
                                        bgcolor: selectedSeat === seat ? 'primary.main' : 'background.paper'
                                    }}
                                >
                                    <CardContent>
                                        <Typography align="center">Seat {seat}</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                );

            case 3:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Confirm Reservation
                        </Typography>
                        <Typography>
                            Date: {selectedDate.toLocaleDateString()}
                        </Typography>
                        <Typography>
                            Route: {selectedRoute.origin} → {selectedRoute.destination}
                        </Typography>
                        <Typography>
                            Departure: {new Date(`2000-01-01T${selectedRoute.departure_time}`).toLocaleTimeString()}
                        </Typography>
                        <Typography>
                            Seat: {selectedSeat}
                        </Typography>
                        <Typography>
                            Price: ${selectedRoute.price}
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={handleConfirm}
                            disabled={loading}
                            sx={{ mt: 2 }}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Confirm Reservation'}
                        </Button>
                    </Box>
                );

            default:
                return null;
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {renderStepContent(activeStep)}
        </Container>
    );
};

export default Reservation; 