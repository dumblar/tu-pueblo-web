import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';

function PrivateRoute({ children }) {
    const { currentUser, loading, login } = useAuth();

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!currentUser) {
        return (
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                minHeight="50vh"
                p={3}
            >
                <Typography variant="h5" gutterBottom>
                    Inicia sesión para continuar
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<GoogleIcon />}
                    onClick={login}
                    size="large"
                    sx={{ mt: 2 }}
                >
                    Iniciar sesión con Google
                </Button>
            </Box>
        );
    }

    return children;
}

export default PrivateRoute; 