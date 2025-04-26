import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box,
    Container
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, login, logout } = useAuth();

    return (
        <AppBar position="static">
            <Container maxWidth="lg">
                <Toolbar>
                    <Typography
                        variant="h6"
                        component={RouterLink}
                        to="/"
                        sx={{
                            flexGrow: 1,
                            textDecoration: 'none',
                            color: 'inherit'
                        }}
                    >
                        Car Reservation
                    </Typography>
                    <Box>
                        {user ? (
                            <>
                                <Button
                                    color="inherit"
                                    component={RouterLink}
                                    to="/my-bookings"
                                    sx={{ mx: 1 }}
                                >
                                    My Bookings
                                </Button>
                                <Button
                                    color="inherit"
                                    onClick={logout}
                                    sx={{ mx: 1 }}
                                >
                                    Logout
                                </Button>
                            </>
                        ) : (
                            <Button
                                color="inherit"
                                onClick={() => login()}
                            >
                                Login with Google
                            </Button>
                        )}
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
};

export default Navbar; 