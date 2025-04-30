import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, Typography, CircularProgress } from '@mui/material';

function AdminRoute({ children }) {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!currentUser || !currentUser.isAdmin) {
        return (
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                minHeight="50vh"
                p={3}
            >
                <Typography variant="h5" color="error" gutterBottom>
                    Acceso no autorizado
                </Typography>
                <Typography variant="body1">
                    No tienes permisos para acceder a esta página.
                </Typography>
            </Box>
        );
    }

    return children;
}

export default AdminRoute; 