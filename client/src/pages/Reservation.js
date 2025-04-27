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
    CircularProgress,
    Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const steps = ['Seleccionar Fecha', 'Elegir Ruta y Asiento', 'Confirmar'];

const Reservation = () => {
    const navigate = useNavigate();
    const { user, login, openPhoneForm, userHasPhone } = useAuth();
    const [activeStep, setActiveStep] = useState(0);
    const [selectedDate, setSelectedDate] = useState(null);
    const [routes, setRoutes] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [availableSeats, setAvailableSeats] = useState([]);
    const [reservedSeats, setReservedSeats] = useState([]);
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
            if (data.isOperational) {
                setRoutes(data.routes || []);
                setError(null);
            } else {
                setError(`La ruta no está disponible para esta fecha: ${data.reason}`);
                setRoutes([]);
            }
        } catch (error) {
            setError('Error al obtener disponibilidad de rutas');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDateSelect = (date) => {
        setSelectedDate(date);
        setSelectedRoute(null);
        setSelectedSeat(null);
        setReservedSeats([]);
        setActiveStep(1);
    };

    const handleRouteSelect = (route) => {
        setSelectedRoute(route);
        // Calculate reserved seats based on booked_seats
        const reserved = [];
        for (let i = 1; i <= route.booked_seats; i++) {
            reserved.push(i);
        }
        setReservedSeats(reserved);
        setAvailableSeats(Array.from({ length: route.capacity }, (_, i) => i + 1));
    };

    const handleSeatSelect = (seat) => {
        if (!reservedSeats.includes(seat)) {
            setSelectedSeat(seat);
        }
    };

    const handleConfirm = async () => {
        if (!user) {
            login();
            return;
        }

        if (!selectedRoute || !selectedSeat) {
            setError('Por favor selecciona una ruta y un asiento');
            return;
        }

        // Check if user has a phone number first
        if (!userHasPhone) {
            openPhoneForm();
            setError('Por favor ingresa tu número de teléfono para continuar');
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
            setError(error.response?.data?.message || 'Error al crear la reserva');
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
                            Selecciona la Fecha de Viaje
                        </Typography>
                        <DatePicker
                            label="Fecha"
                            value={selectedDate}
                            onChange={handleDateSelect}
                            minDate={new Date()}
                            renderInput={(params) => <TextField {...params} />}
                        />
                    </Box>
                );

            case 1:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Fecha seleccionada: {selectedDate.toLocaleDateString()}
                        </Typography>

                        {loading ? (
                            <Box display="flex" justifyContent="center" mt={4}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <Grid container spacing={3}>
                                {routes.map((route) => (
                                    <Grid item xs={12} key={route.id}>
                                        <Card
                                            sx={{
                                                border: selectedRoute?.id === route.id ? '2px solid #1976d2' : 'none',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => handleRouteSelect(route)}
                                        >
                                            <CardContent>
                                                <Typography variant="h6">
                                                    {route.origin} → {route.destination}
                                                </Typography>
                                                <Typography>
                                                    Salida: {new Date(`2000-01-01T${route.departure_time}`).toLocaleTimeString()}
                                                </Typography>
                                                <Typography>
                                                    Asientos Disponibles: {route.available_seats}
                                                </Typography>
                                                <Typography>
                                                    Precio: ${route.price}
                                                </Typography>

                                                {selectedRoute?.id === route.id && (
                                                    <>
                                                        <Divider sx={{ my: 2 }} />
                                                        <Typography variant="subtitle1" gutterBottom>
                                                            Selecciona un asiento:
                                                        </Typography>
                                                        <Grid container spacing={1}>
                                                            {availableSeats.map((seat) => (
                                                                <Grid item xs={2} sm={1} key={seat}>
                                                                    <Card
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleSeatSelect(seat);
                                                                        }}
                                                                        sx={{
                                                                            cursor: reservedSeats.includes(seat) ? 'not-allowed' : 'pointer',
                                                                            bgcolor: reservedSeats.includes(seat)
                                                                                ? 'grey.300'
                                                                                : selectedSeat === seat
                                                                                    ? 'primary.main'
                                                                                    : 'background.paper',
                                                                            color: selectedSeat === seat ? 'white' : 'inherit',
                                                                            textAlign: 'center',
                                                                            p: 1,
                                                                            position: 'relative'
                                                                        }}
                                                                    >
                                                                        <Typography>Asiento {seat}</Typography>
                                                                        {reservedSeats.includes(seat) && (
                                                                            <Typography
                                                                                variant="caption"
                                                                                sx={{
                                                                                    position: 'absolute',
                                                                                    top: 0,
                                                                                    left: 0,
                                                                                    right: 0,
                                                                                    bgcolor: 'error.main',
                                                                                    color: 'white',
                                                                                    fontSize: '0.7rem',
                                                                                    py: 0.5
                                                                                }}
                                                                            >
                                                                                Reservado
                                                                            </Typography>
                                                                        )}
                                                                    </Card>
                                                                </Grid>
                                                            ))}
                                                        </Grid>
                                                    </>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        )}

                        {selectedRoute && selectedSeat && (
                            <Box mt={3} display="flex" justifyContent="center">
                                <Button
                                    variant="contained"
                                    onClick={() => setActiveStep(2)}
                                    disabled={loading}
                                >
                                    Continuar
                                </Button>
                            </Box>
                        )}
                    </Box>
                );

            case 2:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Confirmar Reserva
                        </Typography>
                        <Typography>
                            Fecha: {selectedDate.toLocaleDateString()}
                        </Typography>
                        <Typography>
                            Ruta: {selectedRoute.origin} → {selectedRoute.destination}
                        </Typography>
                        <Typography>
                            Salida: {new Date(`2000-01-01T${selectedRoute.departure_time}`).toLocaleTimeString()}
                        </Typography>
                        <Typography>
                            Asiento: {selectedSeat}
                        </Typography>
                        <Typography>
                            Precio: ${selectedRoute.price}
                        </Typography>
                        <Box mt={3} display="flex" justifyContent="center">
                            <Button
                                variant="contained"
                                onClick={handleConfirm}
                                disabled={loading}
                            >
                                {loading ? <CircularProgress size={24} /> : 'Confirmar Reserva'}
                            </Button>
                        </Box>
                    </Box>
                );

            default:
                return null;
        }
    };

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>
            {renderStepContent(activeStep)}
        </Container>
    );
};

export default Reservation; 