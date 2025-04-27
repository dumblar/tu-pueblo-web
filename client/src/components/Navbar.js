import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box,
    Container,
    Snackbar,
    Alert
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, login, logout, authError } = useAuth();
    const [openSnackbar, setOpenSnackbar] = React.useState(false);

    React.useEffect(() => {
        if (authError) {
            setOpenSnackbar(true);
        }
    }, [authError]);

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    };

    return (
        <>
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
                            Reserva de Vehículos
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
                                        Mis Reservas
                                    </Button>
                                    <Button
                                        color="inherit"
                                        onClick={logout}
                                        sx={{ mx: 1 }}
                                    >
                                        Cerrar Sesión
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    color="inherit"
                                    onClick={() => login()}
                                >
                                    Iniciar Sesión con Google
                                </Button>
                            )}
                        </Box>
                    </Toolbar>
                </Container>
            </AppBar>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
                    {authError}
                </Alert>
            </Snackbar>
        </>
    );
};

export default Navbar; 