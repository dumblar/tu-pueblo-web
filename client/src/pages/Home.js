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
import PhoneNumberForm from '../components/PhoneNumberForm';
import jwtDecode from 'jwt-decode';

// Helper function to format price
const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price);
};

const Home = () => {
    const navigate = useNavigate();
    const { currentUser, login, openPhoneForm, userHasPhone, setCurrentUser } = useAuth();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [routes, setRoutes] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [seatQuantity, setSeatQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [showPhoneDialog, setShowPhoneDialog] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [activeStep, setActiveStep] = useState(0);
    const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
    const [reservationDetails, setReservationDetails] = useState(null);
    const [availabilityMap, setAvailabilityMap] = useState({});
    const [nextAvailableDate, setNextAvailableDate] = useState(null);
    const [pickupLocation, setPickupLocation] = useState('');
    const [dropoffLocation, setDropoffLocation] = useState('');
    const [localUser, setLocalUser] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);

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

    // Add new functions for incrementing and decrementing seat quantity
    const incrementSeatQuantity = (e) => {
        if (e) {
            e.stopPropagation(); // Prevent the route selection from triggering
        }
        if (selectedRoute && seatQuantity < selectedRoute.available_seats) {
            setSeatQuantity(prevQuantity => prevQuantity + 1);
        }
    };

    const decrementSeatQuantity = (e) => {
        if (e) {
            e.stopPropagation(); // Prevent the route selection from triggering
        }
        if (seatQuantity > 1) {
            setSeatQuantity(prevQuantity => prevQuantity - 1);
        }
    };

    const handleConfirm = async () => {
        if (!currentUser) {
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

        if (!pickupLocation || !dropoffLocation) {
            setError('Por favor ingresa los lugares de recogida y destino');
            return;
        }

        // Check if user has a phone number
        if (!currentUser.phone_number) {
            openPhoneForm();
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            // Create the reservation
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/reservations`,
                {
                    routeId: selectedRoute.id,
                    reservationDate: format(selectedDate, 'yyyy-MM-dd'),
                    seatNumber: seatQuantity,
                    pickupLocation,
                    dropoffLocation,
                    status: 'confirmed'
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data) {
                setError(null);
                setSuccessMessage('¡Reserva exitosa! Redirigiendo a tus reservas...');
                setTimeout(() => {
                    navigate('/my-bookings');
                }, 1500);
            }
        } catch (error) {
            console.error('Error creating reservation:', error);
            setError(error.response?.data?.message || 'Error al crear la reserva');
            setSuccessMessage(null);
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
        setLoading(true);
        setError(null);

        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let currentDate = new Date(today);

        // Create a delay function
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        // Search for the next 30 days
        for (let i = 0; i < 30; i++) {
            try {
                const formattedDate = format(currentDate, 'yyyy-MM-dd');

                // Add a delay between requests to avoid rate limiting
                if (i > 0) {
                    await delay(500); // 500ms delay between requests
                }

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

                // If we get a rate limit error, wait longer before trying again
                if (error.response && error.response.status === 429) {
                    await delay(2000); // Wait 2 seconds before continuing
                }

                // Move to the next day even if there's an error
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }

        // If we get here, no available dates were found
        setError('No hay fechas disponibles para esta ruta en los próximos 30 días');
        setLoading(false);
    };

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

                {successMessage && (
                    <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}>
                        {successMessage}
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
                                                        Salida: {new Date(selectedDate.toISOString().split('T')[0] + 'T' + route.departure_time).toLocaleString('es-ES', {
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
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
                                                            <Grid container spacing={2}>
                                                                <Grid item xs={12}>
                                                                    <TextField
                                                                        fullWidth
                                                                        label="Dirección de recogida"
                                                                        value={pickupLocation}
                                                                        onChange={(e) => {
                                                                            e.stopPropagation();
                                                                            setPickupLocation(e.target.value);
                                                                        }}
                                                                        margin="normal"
                                                                        required
                                                                    />
                                                                    <TextField
                                                                        fullWidth
                                                                        label="Dirección de llegada"
                                                                        value={dropoffLocation}
                                                                        onChange={(e) => {
                                                                            e.stopPropagation();
                                                                            setDropoffLocation(e.target.value);
                                                                        }}
                                                                        margin="normal"
                                                                        required
                                                                    />
                                                                </Grid>
                                                                <Grid item xs={12}>
                                                                    <Typography variant="subtitle1" gutterBottom>
                                                                        Cantidad de asientos:
                                                                    </Typography>
                                                                    <Grid container spacing={2} alignItems="center">
                                                                        <Grid item xs={12} sm={6}>
                                                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                                <IconButton
                                                                                    color="primary"
                                                                                    onClick={decrementSeatQuantity}
                                                                                    disabled={seatQuantity <= 1}
                                                                                    sx={{
                                                                                        border: '1px solid #1976d2',
                                                                                        borderRadius: '50%',
                                                                                        p: 1,
                                                                                        mr: 2
                                                                                    }}
                                                                                >
                                                                                    <RemoveIcon />
                                                                                </IconButton>
                                                                                <Typography variant="h5" sx={{ mx: 2, minWidth: '40px', textAlign: 'center' }}>
                                                                                    {seatQuantity}
                                                                                </Typography>
                                                                                <IconButton
                                                                                    color="primary"
                                                                                    onClick={incrementSeatQuantity}
                                                                                    disabled={seatQuantity >= selectedRoute.available_seats}
                                                                                    sx={{
                                                                                        border: '1px solid #1976d2',
                                                                                        borderRadius: '50%',
                                                                                        p: 1,
                                                                                        ml: 2
                                                                                    }}
                                                                                >
                                                                                    <AddIcon />
                                                                                </IconButton>
                                                                            </Box>
                                                                            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                                                                                {selectedRoute.available_seats} asientos disponibles
                                                                            </Typography>
                                                                        </Grid>
                                                                        <Grid item xs={12} sm={6}>
                                                                            <Typography variant="subtitle1" gutterBottom>
                                                                                Total: {formatPrice(route.price * seatQuantity)}
                                                                            </Typography>
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
                                                                                    variant="contained"
                                                                                    color="primary"
                                                                                    size="small"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        findNextAvailableDateForRoute(route.id);
                                                                                    }}
                                                                                    sx={{
                                                                                        mt: 1,
                                                                                        width: '100%',
                                                                                        textTransform: 'none',
                                                                                        fontWeight: 'bold'
                                                                                    }}
                                                                                    startIcon={<NavigateNextIcon />}
                                                                                >
                                                                                    Buscar fecha disponible
                                                                                </Button>
                                                                            )}
                                                                        </Grid>
                                                                    </Grid>
                                                                </Grid>
                                                            </Grid>

                                                            <Box mt={3} display="flex" justifyContent="center">
                                                                <Button
                                                                    variant="contained"
                                                                    color="primary"
                                                                    size="large"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleConfirm();
                                                                    }}
                                                                    disabled={loading || seatQuantity < 1 || seatQuantity > selectedRoute.available_seats || !pickupLocation || !dropoffLocation}
                                                                    sx={{
                                                                        width: '100%',
                                                                        textTransform: 'none',
                                                                        fontWeight: 'bold'
                                                                    }}
                                                                >
                                                                    {loading ? <CircularProgress size={24} /> : 'Confirmar Reserva'}
                                                                </Button>
                                                            </Box>
                                                        </>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
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
                                        secondary="info@idayvuelta.co"
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
                            © {new Date().getFullYear()} Ida y vuelta. Todos los derechos reservados.
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