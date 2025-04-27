import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Typography,
    Box,
    Alert
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const PhoneNumberForm = () => {
    const { showPhoneForm, closePhoneForm, updatePhoneNumber } = useAuth();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!phoneNumber) {
            setError('Por favor ingresa un número de teléfono');
            return;
        }

        // Basic phone number validation
        if (!/^\+?[1-9]\d{1,14}$/.test(phoneNumber)) {
            setError('Formato de número de teléfono inválido. Ejemplo: +573001234567');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            await updatePhoneNumber(phoneNumber);
            setSuccess(true);
            setTimeout(() => {
                closePhoneForm(true);
            }, 1500);
        } catch (error) {
            console.error('Error updating phone number:', error);
            setError(error.response?.data?.message || 'Error al actualizar el número de teléfono');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={showPhoneForm} onClose={() => closePhoneForm(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Número de Teléfono Requerido</DialogTitle>
            <DialogContent>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                    <Typography variant="body1" gutterBottom>
                        Para completar tu reserva, necesitamos tu número de teléfono.
                        Este número será usado para contactarte en caso de cambios en tu reserva.
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
                            ¡Número de teléfono actualizado exitosamente!
                        </Alert>
                    )}

                    <TextField
                        autoFocus
                        margin="dense"
                        label="Número de Teléfono"
                        type="tel"
                        fullWidth
                        variant="outlined"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+573001234567"
                        helperText="Ingresa tu número con código de país (ej: +573001234567)"
                        sx={{ mt: 2 }}
                        disabled={loading || success}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => closePhoneForm(false)} disabled={loading || success}>
                    Cancelar
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    color="primary"
                    disabled={loading || success}
                >
                    {loading ? 'Guardando...' : 'Guardar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PhoneNumberForm; 