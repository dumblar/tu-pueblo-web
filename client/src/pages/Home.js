import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    Box
} from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const routes = [
    {
        id: 1,
        origin: 'Támesis',
        destination: 'Medellín',
        time: '5:00 AM',
        icon: <DirectionsCarIcon fontSize="large" />
    },
    {
        id: 2,
        origin: 'Medellín',
        destination: 'Támesis',
        time: '3:00 PM',
        icon: <DirectionsCarIcon fontSize="large" />
    }
];

const Home = () => {
    const navigate = useNavigate();

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Box textAlign="center" mb={6}>
                <Typography variant="h3" component="h1" gutterBottom>
                    Bienvenido a Reserva de Vehículos
                </Typography>
                <Typography variant="h6" color="text.secondary" paragraph>
                    Reserva tu asiento para los viajes diarios entre Támesis y Medellín
                </Typography>
                <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/reservation')}
                    sx={{ mt: 2 }}
                >
                    Hacer una Reserva
                </Button>
            </Box>

            <Grid container spacing={4}>
                {routes.map((route) => (
                    <Grid item xs={12} md={6} key={route.id}>
                        <Card>
                            <CardContent>
                                <Box display="flex" alignItems="center" mb={2}>
                                    {route.icon}
                                    <Typography variant="h6" ml={1}>
                                        {route.origin} → {route.destination}
                                    </Typography>
                                </Box>
                                <Box display="flex" alignItems="center" mb={1}>
                                    <AccessTimeIcon sx={{ mr: 1 }} />
                                    <Typography>Salida: {route.time}</Typography>
                                </Box>
                                <Box display="flex" alignItems="center">
                                    <LocationOnIcon sx={{ mr: 1 }} />
                                    <Typography>
                                        Ruta: {route.origin} a {route.destination}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Box mt={6} textAlign="center">
                <Typography variant="h5" gutterBottom>
                    ¿Por qué elegir nuestro servicio?
                </Typography>
                <Grid container spacing={3} mt={2}>
                    <Grid item xs={12} md={4}>
                        <Typography variant="h6" gutterBottom>
                            Horario Fijo
                        </Typography>
                        <Typography color="text.secondary">
                            Salidas diarias en horarios convenientes
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Typography variant="h6" gutterBottom>
                            Reserva Fácil
                        </Typography>
                        <Typography color="text.secondary">
                            Proceso de reserva simple y seguro
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Typography variant="h6" gutterBottom>
                            Servicio Confiable
                        </Typography>
                        <Typography color="text.secondary">
                            Conductores profesionales y vehículos bien mantenidos
                        </Typography>
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );
};

export default Home; 