import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tabs,
    Tab
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import jwtDecode from 'jwt-decode';

const steps = ['Seleccionar Fecha', 'Elegir Ruta y Asiento', 'Confirmar'];

// Helper function to format price
const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price);
};

const Reservation = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser, login, openPhoneForm, userHasPhone } = useAuth();
    const [activeStep, setActiveStep] = useState(0);
    const [selectedDate, setSelectedDate] = useState(null);
    const [routes, setRoutes] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [availableSeats, setAvailableSeats] = useState([]);
    const [reservedSeats, setReservedSeats] = useState([]);
    const [selectedSeat, setSelectedSeat] = useState(null);
    const [pickupLocation, setPickupLocation] = useState('');
    const [dropoffLocation, setDropoffLocation] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [tabValue, setTabValue] = useState(0);
    const [bookings, setBookings] = useState([]);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [localUser, setLocalUser] = useState(null);

    // Check if we're on the my-bookings route
    const isMyBookings = location.pathname === '/my-bookings';

    // Check for active session in localStorage
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token && !currentUser) {
            try {
                const decoded = jwtDecode(token);
                setLocalUser(decoded);
            } catch (error) {
                console.error('Error decoding token:', error);
                localStorage.removeItem('token');
            }
        }
    }, [currentUser]);

    useEffect(() => {
        if (isMyBookings && (currentUser || localUser)) {
            fetchBookings();
        }
    }, [isMyBookings, currentUser, localUser]);

    useEffect(() => {
        if (selectedDate) {
            fetchRouteAvailability();
        }
    }, [selectedDate]);

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
            setError('Error al obtener las reservas');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

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
        console.log('Selected route:', route);
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
        // Check if user is logged in using either currentUser or localUser
        if (!currentUser && !localUser) {
            navigate('/login');
            return;
        }

        if (!selectedRoute || !selectedSeat) {
            setError('Por favor selecciona una ruta y un asiento');
            return;
        }

        if (!pickupLocation || !dropoffLocation) {
            setError('Por favor ingresa los lugares de recogida y destino');
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

            // Debug log to check the request data
            const requestData = {
                routeId: selectedRoute.id,
                reservationDate: selectedDate.toISOString().split('T')[0],
                seatNumber: selectedSeat,
                pickupLocation,
                dropoffLocation
            };
            console.log('Reservation request data:', requestData);

            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/reservations`,
                requestData,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            console.log('Reservation response:', response.data);
            navigate('/my-bookings');
        } catch (error) {
            console.error('Error details:', error.response?.data);
            setError(error.response?.data?.message || 'Error al crear la reserva');
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
            await axios.put(
                `${process.env.REACT_APP_API_URL}/api/reservations/${selectedBooking.id}/cancel`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            // Refresh the bookings list
            fetchBookings();
            setError(null);
        } catch (error) {
            setError('Error al cancelar la reserva');
            console.error('Error:', error);
        } finally {
            setLoading(false);
            setCancelDialogOpen(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const renderStepContent = (step) => {
        console.log('Step:', step);
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

                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Lugar de recogida"
                                    value={pickupLocation}
                                    onChange={(e) => setPickupLocation(e.target.value)}
                                    margin="normal"
                                    required
                                />
                                <TextField
                                    fullWidth
                                    label="Lugar de destino"
                                    value={dropoffLocation}
                                    onChange={(e) => setDropoffLocation(e.target.value)}
                                    margin="normal"
                                    required
                                />
                            </Grid>
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
                                                        Precio: {formatPrice(route.price)}
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
                                        onClick={() => {
                                            if (!pickupLocation || !dropoffLocation) {
                                                setError('Por favor ingresa los lugares de recogida y destino');
                                                return;
                                            }
                                            setActiveStep(2);
                                        }}
                                        disabled={loading}
                                    >
                                        Continuar
                                    </Button>
                                </Box>
                            )}
                        </Grid>
                    </Box>
                );

            case 2:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Confirmar Reserva
                        </Typography>
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Typography variant="h6">
                                    {selectedRoute.origin} → {selectedRoute.destination}
                                </Typography>
                                <Typography>
                                    Fecha: {selectedDate.toLocaleDateString()}
                                </Typography>
                                <Typography>
                                    Salida: {new Date(`2000-01-01T${selectedRoute.departure_time}`).toLocaleTimeString()}
                                </Typography>
                                <Typography>
                                    Asiento: {selectedSeat}
                                </Typography>
                                <Typography>
                                    Precio: {formatPrice(selectedRoute.price)}
                                </Typography>
                                <Typography>
                                    Lugar de recogida: {pickupLocation}
                                </Typography>
                                <Typography>
                                    Lugar de destino: {dropoffLocation}
                                </Typography>
                            </CardContent>
                        </Card>
                        <Box display="flex" justifyContent="space-between">
                            <Button
                                variant="outlined"
                                onClick={() => setActiveStep(1)}
                            >
                                Volver
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleConfirm}
                                disabled={loading}
                            >
                                Confirmar Reserva
                            </Button>
                        </Box>
                    </Box>
                );

            default:
                return null;
        }
    };

    const renderMyBookings = () => {
        if (!currentUser && !localUser) {
            return (
                <Alert severity="info">
                    Por favor inicia sesión para ver tus reservas
                </Alert>
            );
        }

        return (
            <Box>
                <Typography variant="h4" gutterBottom>
                    Mis Reservas
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
                        No tienes reservas aún
                    </Alert>
                ) : (
                    <Grid container spacing={3}>
                        {bookings.map((booking) => (
                            <Grid item xs={12} key={booking.id}>
                                <Card>
                                    <CardContent>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} md={8}>
                                                <Typography variant="h6" gutterBottom>
                                                    {booking.origin} → {booking.destination}
                                                </Typography>
                                                <Grid container spacing={1}>
                                                    <Grid item xs={12} sm={6}>
                                                        <Typography color="text.secondary">
                                                            Fecha: {new Date(booking.reservation_date).toLocaleDateString()}
                                                        </Typography>
                                                        <Typography color="text.secondary">
                                                            Salida: {new Date(`2000-01-01T${booking.departure_time}`).toLocaleTimeString()}
                                                        </Typography>
                                                        <Typography color="text.secondary">
                                                            Asiento: {booking.seat_number}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={12} sm={6}>
                                                        <Typography color="text.secondary">
                                                            Dirección de recogida: {booking.pickup_location}
                                                        </Typography>
                                                        <Typography color="text.secondary">
                                                            Dirección de llegada: {booking.dropoff_location}
                                                        </Typography>
                                                        <Typography color="text.secondary">
                                                            Precio por asiento: {formatPrice(booking.price)}
                                                        </Typography>
                                                        <Typography color="text.secondary" sx={{ fontWeight: 'bold' }}>
                                                            Total: {formatPrice(booking.price * booking.seat_number)}
                                                        </Typography>
                                                    </Grid>
                                                </Grid>
                                                <Typography
                                                    color={booking.status === 'confirmed' ? 'success.main' : booking.status === 'cancelled' ? 'error.main' : 'warning.main'}
                                                    sx={{ mt: 1 }}
                                                >
                                                    Estado: {booking.status === 'confirmed' ? 'Confirmada' : booking.status === 'cancelled' ? 'Cancelada' : 'Pendiente'}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                                {booking.status === 'confirmed' && (
                                                    <Button
                                                        variant="outlined"
                                                        color="error"
                                                        onClick={() => handleCancelClick(booking)}
                                                    >
                                                        Cancelar Reserva
                                                    </Button>
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
                    <DialogTitle>Cancelar Reserva</DialogTitle>
                    <DialogContent>
                        <Typography>
                            ¿Estás seguro de que deseas cancelar esta reserva?
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setCancelDialogOpen(false)}>
                            No, Mantener Reserva
                        </Button>
                        <Button onClick={handleCancelConfirm} color="error">
                            Sí, Cancelar Reserva
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        );
    };

    if (isMyBookings) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
                    <Tab label="Mis Reservas" />
                    <Tab label="Nueva Reserva" onClick={() => navigate('/')} />
                </Tabs>
                {renderMyBookings()}
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Typography variant="h4" gutterBottom>
                Reservar Viaje
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
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