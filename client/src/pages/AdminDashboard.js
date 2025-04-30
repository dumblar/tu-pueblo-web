import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Paper,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Alert,
    Grid,
    IconButton,
    Chip,
    Collapse,
    List,
    ListItem,
    ListItemText,
    Divider,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Button
} from '@mui/material';
import { format, startOfWeek, addDays, subDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const DayReport = ({ dayData }) => {
    const [expanded, setExpanded] = useState(false);

    const formatDate = (dateStr) => {
        try {
            return format(parseISO(dateStr), 'EEEE dd/MM/yyyy', { locale: es });
        } catch (error) {
            console.error('Error formatting date:', error);
            return dateStr;
        }
    };

    return (
        <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <Typography variant="h6">
                        {formatDate(dayData.date)}
                    </Typography>
                    <Chip
                        label={`${dayData.total_passengers} pasajeros`}
                        color="primary"
                        size="small"
                    />
                </Box>
            </AccordionSummary>
            <AccordionDetails>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Rutas del día:
                    </Typography>
                    <Grid container spacing={2}>
                        {dayData.routes.map((route) => (
                            <Grid item xs={12} sm={6} md={4} key={route.id}>
                                <Paper variant="outlined" sx={{ p: 2 }}>
                                    <Typography variant="subtitle2">
                                        {route.origin} → {route.destination}
                                    </Typography>
                                    <Chip
                                        label={`${route.occupancy_percentage}% ocupado`}
                                        color={route.occupancy_percentage >= 90 ? 'error' :
                                            route.occupancy_percentage >= 70 ? 'warning' : 'success'}
                                        size="small"
                                        sx={{ mt: 1 }}
                                    />
                                    <Typography variant="caption" display="block">
                                        {route.booked_seats}/{route.capacity} asientos
                                    </Typography>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                <Typography variant="subtitle1" gutterBottom>
                    Pasajeros por ruta:
                </Typography>

                {dayData.passengers_by_route && dayData.passengers_by_route.length > 0 ? (
                    dayData.passengers_by_route.map((routeData) => (
                        <Box key={routeData.route_id} sx={{ mb: 3 }}>
                            <Typography variant="h6" sx={{ mb: 1 }}>
                                {routeData.origin} → {routeData.destination}
                            </Typography>
                            <List>
                                {routeData.passengers.map((passenger, index) => (
                                    <React.Fragment key={index}>
                                        <ListItem>
                                            <ListItemText
                                                primary={passenger.name}
                                                secondary={
                                                    <>
                                                        <Typography component="span" variant="body2" color="text.primary">
                                                            {passenger.seats} asiento{passenger.seats !== 1 ? 's' : ''}
                                                        </Typography>
                                                        <br />
                                                        {passenger.email} | {passenger.phone}
                                                        <Chip
                                                            label={passenger.status}
                                                            color={passenger.status === 'confirmed' ? 'success' : 'warning'}
                                                            size="small"
                                                            sx={{ ml: 1 }}
                                                        />
                                                    </>
                                                }
                                            />
                                        </ListItem>
                                        {index < routeData.passengers.length - 1 && <Divider />}
                                    </React.Fragment>
                                ))}
                            </List>
                        </Box>
                    ))
                ) : (
                    <Alert severity="info">
                        No hay pasajeros registrados para este día
                    </Alert>
                )}
            </AccordionDetails>
        </Accordion>
    );
};

const AdminDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [expandedRoute, setExpandedRoute] = useState(null);

    useEffect(() => {
        fetchReportData();
    }, [selectedDate]);

    const fetchReportData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Format the date correctly to avoid timezone issues
            // Use a date formatter that doesn't convert to UTC
            const formattedDate = selectedDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format

            console.log('Selected date:', selectedDate);
            console.log('Formatted date being sent to API:', formattedDate);

            const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/admin/seats-report`,
                { date: formattedDate },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );

            console.log('Response received:', response.data);
            setReportData(response.data.days);
        } catch (error) {
            console.error('Error details:', error.response || error);
            setError('Error al cargar el reporte: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handlePreviousDay = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() - 1);
        setSelectedDate(newDate);
    };

    const handleNextDay = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + 1);
        setSelectedDate(newDate);
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" component="h2">
                        Reporte Semanal de Pasajeros
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <IconButton onClick={handlePreviousDay}>
                            <ChevronLeftIcon />
                        </IconButton>
                        <Typography variant="h6">
                            {formatDate(selectedDate)}
                        </Typography>
                        <IconButton onClick={handleNextDay}>
                            <ChevronRightIcon />
                        </IconButton>
                    </Box>
                </Box>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Alert severity="error">{error}</Alert>
                ) : !reportData || reportData.length === 0 ? (
                    <Alert severity="info">No hay datos disponibles para el período seleccionado</Alert>
                ) : (
                    reportData.map((dayData) => {
                        // Parse the date string to ensure correct display
                        const displayDate = new Date(dayData.date + 'T00:00:00');

                        return (
                            <Box key={dayData.date} sx={{ mb: 4 }}>
                                <Typography variant="h6" sx={{ mb: 2 }}>
                                    {formatDate(displayDate)}
                                </Typography>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Ruta</TableCell>
                                                <TableCell align="right">Asientos Totales</TableCell>
                                                <TableCell align="right">Asientos Ocupados</TableCell>
                                                <TableCell align="right">Ocupación</TableCell>
                                                <TableCell align="right">Detalles</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {dayData.routes.map((route) => (
                                                <React.Fragment key={`${dayData.date}-${route.route_name}`}>
                                                    <TableRow>
                                                        <TableCell>{route.route_name}</TableCell>
                                                        <TableCell align="right">{route.total_seats}</TableCell>
                                                        <TableCell align="right">{route.occupied_seats}</TableCell>
                                                        <TableCell align="right">
                                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                                                <Box
                                                                    sx={{
                                                                        width: '100px',
                                                                        mr: 1,
                                                                        bgcolor: 'grey.200',
                                                                        borderRadius: 1,
                                                                        height: 20,
                                                                    }}
                                                                >
                                                                    <Box
                                                                        sx={{
                                                                            width: `${route.occupancy_percentage}%`,
                                                                            bgcolor: route.occupancy_percentage > 80 ? 'error.main' : 'success.main',
                                                                            height: '100%',
                                                                            borderRadius: 1,
                                                                        }}
                                                                    />
                                                                </Box>
                                                                {route.occupancy_percentage}%
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <Button
                                                                variant="outlined"
                                                                size="small"
                                                                onClick={() => setExpandedRoute(expandedRoute === `${dayData.date}-${route.route_name}` ? null : `${dayData.date}-${route.route_name}`)}
                                                            >
                                                                {expandedRoute === `${dayData.date}-${route.route_name}` ? 'Ocultar' : 'Mostrar'} Pasajeros
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
                                                            <Collapse in={expandedRoute === `${dayData.date}-${route.route_name}`} timeout="auto" unmountOnExit>
                                                                <Box sx={{ margin: 1 }}>
                                                                    <Typography variant="h6" gutterBottom component="div">
                                                                        Pasajeros
                                                                    </Typography>
                                                                    {route.passengers.length === 0 ? (
                                                                        <Typography variant="body2" color="text.secondary">
                                                                            No hay pasajeros registrados para esta ruta
                                                                        </Typography>
                                                                    ) : (
                                                                        <List>
                                                                            {route.passengers.map((passenger, index) => (
                                                                                <React.Fragment key={index}>
                                                                                    <ListItem>
                                                                                        <ListItemText
                                                                                            primary={passenger.name}
                                                                                            secondary={
                                                                                                <>
                                                                                                    <Typography component="span" variant="body2">
                                                                                                        Asientos: {passenger.seat_quantity}
                                                                                                    </Typography>
                                                                                                    <br />
                                                                                                    <Typography component="span" variant="body2">
                                                                                                        Email: {passenger.email}
                                                                                                    </Typography>
                                                                                                    <br />
                                                                                                    <Typography component="span" variant="body2">
                                                                                                        Teléfono: {passenger.phone}
                                                                                                    </Typography>
                                                                                                    <br />
                                                                                                    <Typography component="span" variant="body2">
                                                                                                        Estado: {passenger.status}
                                                                                                    </Typography>
                                                                                                </>
                                                                                            }
                                                                                        />
                                                                                    </ListItem>
                                                                                    {index < route.passengers.length - 1 && <Divider />}
                                                                                </React.Fragment>
                                                                            ))}
                                                                        </List>
                                                                    )}
                                                                </Box>
                                                            </Collapse>
                                                        </TableCell>
                                                    </TableRow>
                                                </React.Fragment>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        );
                    })
                )}
            </Paper>
        </Container>
    );
};

export default AdminDashboard; 