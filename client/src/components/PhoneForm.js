import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Alert
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const PhoneForm = () => {
    const { showPhoneForm, closePhoneForm, updatePhoneNumber } = useAuth();
    const navigate = useNavigate();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!phoneNumber) {
            setError('Por favor ingresa tu número de teléfono');
            return;
        }

        try {
            setLoading(true);
            setError('');
            const response = await updatePhoneNumber(phoneNumber);
            closePhoneForm(true);
            if (response.confirmedReservations > 0) {
                navigate('/my-bookings');
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Error al actualizar el número de teléfono');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setPhoneNumber('');
        setError('');
        closePhoneForm();
    };

    return (
        <Dialog open={showPhoneForm} onClose={handleClose}>
            <DialogTitle>Ingresa tu número de teléfono</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Número de teléfono"
                        type="tel"
                        fullWidth
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+573007490767"
                        helperText="Ingresa tu número con código de país (ej: +573007490767)"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancelar</Button>
                    <Button type="submit" variant="contained" disabled={loading}>
                        {loading ? 'Procesando...' : 'Confirmar'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default PhoneForm; 