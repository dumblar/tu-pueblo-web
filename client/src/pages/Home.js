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
        origin: 'Tamesis',
        destination: 'Medellin',
        time: '5:00 AM',
        icon: <DirectionsCarIcon fontSize="large" />
    },
    {
        id: 2,
        origin: 'Medellin',
        destination: 'Tamesis',
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
                    Welcome to Car Reservation
                </Typography>
                <Typography variant="h6" color="text.secondary" paragraph>
                    Book your seat for daily routes between Tamesis and Medellin
                </Typography>
                <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/reservation')}
                    sx={{ mt: 2 }}
                >
                    Make a Reservation
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
                                    <Typography>Departure: {route.time}</Typography>
                                </Box>
                                <Box display="flex" alignItems="center">
                                    <LocationOnIcon sx={{ mr: 1 }} />
                                    <Typography>
                                        Route: {route.origin} to {route.destination}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Box mt={6} textAlign="center">
                <Typography variant="h5" gutterBottom>
                    Why Choose Our Service?
                </Typography>
                <Grid container spacing={3} mt={2}>
                    <Grid item xs={12} md={4}>
                        <Typography variant="h6" gutterBottom>
                            Fixed Schedule
                        </Typography>
                        <Typography color="text.secondary">
                            Daily departures at convenient times
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Typography variant="h6" gutterBottom>
                            Easy Booking
                        </Typography>
                        <Typography color="text.secondary">
                            Simple and secure reservation process
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Typography variant="h6" gutterBottom>
                            Reliable Service
                        </Typography>
                        <Typography color="text.secondary">
                            Professional drivers and well-maintained vehicles
                        </Typography>
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );
};

export default Home; 