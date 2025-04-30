import React, { useState, useEffect } from 'react';
import {
    Container,
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    Alert,
    Grid,
    FormControlLabel,
    Switch,
    Divider
} from '@mui/material';

function AdminSettings() {
    const [settings, setSettings] = useState({
        maintenance_mode: false,
        max_seats_per_reservation: 4,
        min_reservation_hours: 24,
        max_reservation_days: 30,
        notification_email: '',
        company_name: 'Tu Pueblo',
        company_address: '',
        company_phone: '',
        company_email: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/settings`);
            const data = await response.json();
            setSettings(data);
        } catch (error) {
            setError('Error al cargar la configuración');
        }
    };

    const handleChange = (e) => {
        const { name, value, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: e.target.type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(settings),
            });

            if (!response.ok) {
                throw new Error('Error al guardar la configuración');
            }

            setSuccess('Configuración actualizada exitosamente');
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <Container maxWidth="md">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Typography component="h1" variant="h5" gutterBottom>
                    Configuración del Sistema
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {success}
                    </Alert>
                )}

                <Paper elevation={3} sx={{ p: 4 }}>
                    <Box component="form" onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom>
                                    Configuración General
                                </Typography>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={settings.maintenance_mode}
                                            onChange={handleChange}
                                            name="maintenance_mode"
                                        />
                                    }
                                    label="Modo Mantenimiento"
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="h6" gutterBottom>
                                    Configuración de Reservas
                                </Typography>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Máximo de Asientos por Reserva"
                                    type="number"
                                    name="max_seats_per_reservation"
                                    value={settings.max_seats_per_reservation}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Horas Mínimas para Reserva"
                                    type="number"
                                    name="min_reservation_hours"
                                    value={settings.min_reservation_hours}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Días Máximos para Reserva"
                                    type="number"
                                    name="max_reservation_days"
                                    value={settings.max_reservation_days}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="h6" gutterBottom>
                                    Información de la Empresa
                                </Typography>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Nombre de la Empresa"
                                    name="company_name"
                                    value={settings.company_name}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Dirección"
                                    name="company_address"
                                    value={settings.company_address}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Teléfono"
                                    name="company_phone"
                                    value={settings.company_phone}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    type="email"
                                    name="company_email"
                                    value={settings.company_email}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    sx={{ mt: 2 }}
                                >
                                    Guardar Configuración
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
}

export default AdminSettings; 