import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    Box,
    TextField,
    Alert,
    CircularProgress,
    Divider,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Link,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Tooltip,
    Stepper,
    Step,
    StepLabel,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    InputAdornment
} from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import InfoIcon from '@mui/icons-material/Info';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from 'date-fns';
import { useGoogleLogin } from '@react-oauth/google';
import { es } from 'date-fns/locale';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Add as AddIcon, Remove as RemoveIcon, NavigateNext as NavigateNextIcon } from '@mui/icons-material';

const Home = () => {
    const navigate = useNavigate();
    const { user, login, openPhoneForm, userHasPhone } = useAuth();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [routes, setRoutes] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [seatQuantity, setSeatQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [availabilityMap, setAvailabilityMap] = useState({});
    const [nextAvailableDate, setNextAvailableDate] = useState(null);

    useEffect(() => {
        fetchRouteAvailability(selectedDate);
    }, [selectedDate]);

    const fetchRouteAvailability = async (date) => {
        try {
            setLoading(true);
            setError(null);
            const formattedDate = format(date, 'yyyy-MM-dd');
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/routes/availability/${formattedDate}`);

            if (!response.data.isOperational) {
                setError(response.data.reason || 'Esta fecha no está disponible para reservas');
                setRoutes([]);
                return;
            }

            if (!response.data.routes || response.data.routes.length === 0) {
                setError('No hay rutas disponibles para esta fecha');
                setRoutes([]);
                return;
            }

            setRoutes(response.data.routes);
        } catch (error) {
            console.error('Error fetching route availability:', error);
            setError(error.response?.data?.message || 'Error al obtener disponibilidad de rutas');
            setRoutes([]);
        } finally {
            setLoading(false);
        }
    };

    const getDateAvailability = (date) => {
        // Since we don't have availability data for all dates anymore,
        // we'll show all dates as available (green) except for the selected date
        // which will be determined by the actual route data
        if (isSameDay(date, selectedDate)) {
            if (routes.length === 0) return { color: 'grey', tooltip: 'No disponible' };

            const availableRoutes = routes.filter(route => {
                const availableSeats = route.capacity - route.booked_seats;
                return availableSeats > 0;
            });

            if (availableRoutes.length === 0) return { color: 'pink', tooltip: 'Completamente lleno' };

            const totalAvailableSeats = availableRoutes.reduce((sum, route) => {
                return sum + (route.capacity - route.booked_seats);
            }, 0);

            return {
                color: 'green',
                tooltip: `${totalAvailableSeats} asientos disponibles en ${availableRoutes.length} ruta${availableRoutes.length > 1 ? 's' : ''}`
            };
        }

        return { color: 'green', tooltip: 'Disponible' };
    };

    const handleDateSelect = (date) => {
        setSelectedDate(date);
        setSelectedRoute(null);
        setSeatQuantity(1);
        fetchRouteAvailability(date);
    };

    const handleMonthChange = (newMonth) => {
        setCurrentMonth(newMonth);
    };

    const handleRouteSelect = (route) => {
        setSelectedRoute(route);
        setSeatQuantity(1); // Reset to 1 seat when changing route
    };

    const handleSeatQuantityChange = (event) => {
        const value = parseInt(event.target.value);
        if (!isNaN(value) && value > 0 && value <= selectedRoute.available_seats) {
            setSeatQuantity(value);
        } else if (value > selectedRoute.available_seats) {
            setSeatQuantity(selectedRoute.available_seats);
        } else if (value < 1) {
            setSeatQuantity(1);
        }
    };

    const handleConfirm = async () => {
        if (!user) {
            login();
            return;
        }

        if (!selectedRoute) {
            setError('Por favor selecciona una ruta');
            return;
        }

        if (seatQuantity < 1) {
            setError('Por favor selecciona al menos un asiento');
            return;
        }

        if (seatQuantity > selectedRoute.available_seats) {
            setError(`Solo hay ${selectedRoute.available_seats} asientos disponibles`);
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            if (!userHasPhone) {
                // Create a pending reservation
                await axios.post(
                    `${process.env.REACT_APP_API_URL}/api/reservations`,
                    {
                        routeId: selectedRoute.id,
                        reservationDate: format(selectedDate, 'yyyy-MM-dd'),
                        seatNumber: seatQuantity,
                        status: 'pending'
                    },
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
                // Open phone form
                openPhoneForm();
                setError('Por favor ingresa tu número de teléfono para confirmar la reserva');
            } else {
                // Create confirmed reservation
                await axios.post(
                    `${process.env.REACT_APP_API_URL}/api/reservations`,
                    {
                        routeId: selectedRoute.id,
                        reservationDate: format(selectedDate, 'yyyy-MM-dd'),
                        seatNumber: seatQuantity
                    },
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
                navigate('/my-bookings');
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Error al crear la reserva');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Find the next available date
    const findNextAvailableDate = async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Start with today
        let currentDate = new Date(today);

        // Search for the next 30 days
        for (let i = 0; i < 30; i++) {
            try {
                setLoading(true);
                const formattedDate = format(currentDate, 'yyyy-MM-dd');
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/routes/availability/${formattedDate}`);

                // Check if the date is operational and has available seats
                if (response.data.isOperational &&
                    response.data.routes &&
                    response.data.routes.length > 0 &&
                    response.data.routes.some(route => route.available_seats > 0)) {

                    // Found an available date
                    setSelectedDate(currentDate);
                    setRoutes(response.data.routes);
                    setLoading(false);
                    return;
                }

                // Move to the next day
                currentDate.setDate(currentDate.getDate() + 1);
            } catch (error) {
                console.error('Error checking date availability:', error);
                // Move to the next day even if there's an error
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }

        // If we get here, no available dates were found
        setError('No hay fechas disponibles en los próximos 30 días');
        setLoading(false);
    };

    // Find the next available date for a specific route
    const findNextAvailableDateForRoute = async (routeId) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Start with today
        let currentDate = new Date(today);

        // Search for the next 30 days
        for (let i = 0; i < 30; i++) {
            try {
                setLoading(true);
                const formattedDate = format(currentDate, 'yyyy-MM-dd');
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/routes/availability/${formattedDate}`);

                // Check if the date is operational and has the specific route with available seats
                if (response.data.isOperational &&
                    response.data.routes &&
                    response.data.routes.length > 0) {

                    const route = response.data.routes.find(r => r.id === routeId);
                    if (route && route.available_seats > 0) {
                        // Found an available date for this route
                        setSelectedDate(currentDate);
                        setRoutes(response.data.routes);
                        setSelectedRoute(route);
                        setLoading(false);
                        return;
                    }
                }

                // Move to the next day
                currentDate.setDate(currentDate.getDate() + 1);
            } catch (error) {
                console.error('Error checking date availability:', error);
                // Move to the next day even if there's an error
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }

        // If we get here, no available dates were found
        setError('No hay fechas disponibles para esta ruta en los próximos 30 días');
        setLoading(false);
    };

    return (
        <>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
                <Box textAlign="center" mb={4}>
                    <Typography variant="h3" component="h1" gutterBottom>
                        Reserva de Vehículos
                    </Typography>
                    <Typography variant="h6" color="text.secondary" paragraph>
                        Reserva tu asiento para los viajes diarios entre Támesis y Medellín
                    </Typography>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <Grid container spacing={4}>
                    {/* Calendar Section */}
                    <Grid item xs={12} md={4}>
                        <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
                            <Typography variant="h6" gutterBottom>
                                Paso 1: Selecciona la Fecha
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                                    <DateCalendar
                                        value={selectedDate}
                                        onChange={handleDateSelect}
                                        onMonthChange={handleMonthChange}
                                        minDate={new Date()}
                                    />
                                </LocalizationProvider>
                                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        startIcon={<NavigateNextIcon />}
                                        onClick={findNextAvailableDate}
                                        disabled={loading}
                                    >
                                        Siguiente fecha disponible
                                    </Button>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Route and Seat Selection Section */}
                    <Grid item xs={12} md={8}>
                        <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
                            <Typography variant="h6" gutterBottom>
                                Paso 2: Selecciona Ruta y Asiento
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
                                                                Cantidad de asientos:
                                                            </Typography>
                                                            <Grid container spacing={2} alignItems="center">
                                                                <Grid item xs={12} sm={6}>
                                                                    <TextField
                                                                        type="number"
                                                                        label="Cantidad de asientos"
                                                                        value={seatQuantity}
                                                                        onChange={handleSeatQuantityChange}
                                                                        inputProps={{
                                                                            min: 1,
                                                                            max: selectedRoute.available_seats,
                                                                            step: 1
                                                                        }}
                                                                        fullWidth
                                                                    />
                                                                </Grid>
                                                                <Grid item xs={12} sm={2}>
                                                                    <Typography
                                                                        variant="body2"
                                                                        color={route.available_seats > 0 ? 'success.main' : 'error.main'}
                                                                        fontWeight="bold"
                                                                    >
                                                                        {route.available_seats > 0
                                                                            ? `${route.available_seats} asientos disponibles`
                                                                            : 'Completamente lleno'}
                                                                    </Typography>
                                                                    {route.available_seats === 0 && (
                                                                        <Button
                                                                            size="small"
                                                                            color="primary"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                findNextAvailableDateForRoute(route.id);
                                                                            }}
                                                                            sx={{ mt: 1 }}
                                                                        >
                                                                            Buscar fecha disponible
                                                                        </Button>
                                                                    )}
                                                                </Grid>
                                                            </Grid>
                                                        </>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            )}

                            {selectedRoute && (
                                <Box mt={3} display="flex" justifyContent="center">
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        size="large"
                                        onClick={handleConfirm}
                                        disabled={loading || seatQuantity < 1 || seatQuantity > selectedRoute.available_seats}
                                    >
                                        {loading ? <CircularProgress size={24} /> : 'Confirmar Reserva'}
                                    </Button>
                                </Box>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            </Container>

            {/* Footer */}
            <Box
                component="footer"
                sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    py: 6,
                    mt: 8
                }}
            >
                <Container maxWidth="lg">
                    <Grid container spacing={4}>
                        <Grid item xs={12} md={4}>
                            <Typography variant="h6" gutterBottom>
                                Sobre Nosotros
                            </Typography>
                            <Typography variant="body2" paragraph>
                                Ofrecemos un servicio de transporte seguro y confiable entre Támesis y Medellín.
                                Nuestros vehículos están equipados con todas las comodidades para hacer de tu viaje
                                una experiencia agradable.
                            </Typography>
                            <List dense disablePadding>
                                <ListItem disableGutters>
                                    <ListItemIcon sx={{ color: 'white', minWidth: 36 }}>
                                        <InfoIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="Horario de Atención"
                                        secondary="Lunes a Domingo: 6:00 AM - 8:00 PM"
                                    />
                                </ListItem>
                            </List>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Typography variant="h6" gutterBottom>
                                Información de Contacto
                            </Typography>
                            <List dense disablePadding>
                                <ListItem disableGutters>
                                    <ListItemIcon sx={{ color: 'white', minWidth: 36 }}>
                                        <PhoneIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="Teléfono"
                                        secondary="+57 300 123 4567"
                                    />
                                </ListItem>
                                <ListItem disableGutters>
                                    <ListItemIcon sx={{ color: 'white', minWidth: 36 }}>
                                        <EmailIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="Email"
                                        secondary="info@tupueblo.co"
                                    />
                                </ListItem>
                                <ListItem disableGutters>
                                    <ListItemIcon sx={{ color: 'white', minWidth: 36 }}>
                                        <LocationOnIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="Dirección"
                                        secondary="Calle Principal #123, Támesis, Antioquia"
                                    />
                                </ListItem>
                            </List>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Typography variant="h6" gutterBottom>
                                Enlaces Útiles
                            </Typography>
                            <List dense disablePadding>
                                <ListItem disableGutters>
                                    <Link href="/my-bookings" color="inherit" underline="hover">
                                        Mis Reservas
                                    </Link>
                                </ListItem>
                                <ListItem disableGutters>
                                    <Link href="#" color="inherit" underline="hover">
                                        Términos y Condiciones
                                    </Link>
                                </ListItem>
                                <ListItem disableGutters>
                                    <Link href="#" color="inherit" underline="hover">
                                        Política de Privacidad
                                    </Link>
                                </ListItem>
                                <ListItem disableGutters>
                                    <Link href="#" color="inherit" underline="hover">
                                        Preguntas Frecuentes
                                    </Link>
                                </ListItem>
                            </List>
                        </Grid>
                    </Grid>

                    <Divider sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.2)' }} />

                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">
                            © {new Date().getFullYear()} Tu Pueblo. Todos los derechos reservados.
                        </Typography>
                        <Box>
                            <Link href="#" color="inherit" underline="hover" sx={{ mx: 1 }}>
                                Facebook
                            </Link>
                            <Link href="#" color="inherit" underline="hover" sx={{ mx: 1 }}>
                                Instagram
                            </Link>
                            <Link href="#" color="inherit" underline="hover" sx={{ mx: 1 }}>
                                WhatsApp
                            </Link>
                        </Box>
                    </Box>
                </Container>
            </Box>
        </>
    );
};

export default Home; 