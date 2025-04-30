import React, { useState, useEffect } from 'react';
import {
    Container,
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

function AdminReservations() {
    const [reservations, setReservations] = useState([]);
    const [open, setOpen] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [status, setStatus] = useState('');

    useEffect(() => {
        fetchReservations();
    }, []);

    const fetchReservations = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/reservations`);
            const data = await response.json();
            setReservations(data);
        } catch (error) {
            setError('Error al cargar las reservas');
        }
    };

    const handleOpen = (reservation) => {
        setSelectedReservation(reservation);
        setStatus(reservation.status);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedReservation(null);
        setStatus('');
    };

    const handleStatusChange = async () => {
        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/api/reservations/${selectedReservation.id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ status }),
                }
            );

            if (!response.ok) {
                throw new Error('Error al actualizar la reserva');
            }

            setSuccess('Reserva actualizada exitosamente');
            handleClose();
            fetchReservations();
        } catch (error) {
            setError(error.message);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de eliminar esta reserva?')) {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/api/reservations/${id}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    throw new Error('Error al eliminar la reserva');
                }

                setSuccess('Reserva eliminada exitosamente');
                fetchReservations();
            } catch (error) {
                setError(error.message);
            }
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Typography component="h1" variant="h5" gutterBottom>
                    Gestión de Reservas
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

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Usuario</TableCell>
                                <TableCell>Ruta</TableCell>
                                <TableCell>Fecha</TableCell>
                                <TableCell>Asientos</TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {reservations.map((reservation) => (
                                <TableRow key={reservation.id}>
                                    <TableCell>{reservation.id}</TableCell>
                                    <TableCell>{reservation.user_name}</TableCell>
                                    <TableCell>{reservation.route_name}</TableCell>
                                    <TableCell>{formatDate(reservation.date)}</TableCell>
                                    <TableCell>{reservation.seat_number}</TableCell>
                                    <TableCell>{reservation.status}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleOpen(reservation)}>
                                            <VisibilityIcon />
                                        </IconButton>
                                        <IconButton onClick={() => handleDelete(reservation.id)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Dialog open={open} onClose={handleClose}>
                    <DialogTitle>Detalles de la Reserva</DialogTitle>
                    <DialogContent>
                        {selectedReservation && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle1">
                                    <strong>Usuario:</strong> {selectedReservation.user_name}
                                </Typography>
                                <Typography variant="subtitle1">
                                    <strong>Ruta:</strong> {selectedReservation.route_name}
                                </Typography>
                                <Typography variant="subtitle1">
                                    <strong>Fecha:</strong> {formatDate(selectedReservation.date)}
                                </Typography>
                                <Typography variant="subtitle1">
                                    <strong>Asientos:</strong> {selectedReservation.seat_number}
                                </Typography>
                                <Typography variant="subtitle1">
                                    <strong>Estado:</strong> {selectedReservation.status}
                                </Typography>
                                <FormControl fullWidth sx={{ mt: 2 }}>
                                    <InputLabel>Estado</InputLabel>
                                    <Select
                                        value={status}
                                        label="Estado"
                                        onChange={(e) => setStatus(e.target.value)}
                                    >
                                        <MenuItem value="pending">Pendiente</MenuItem>
                                        <MenuItem value="confirmed">Confirmada</MenuItem>
                                        <MenuItem value="cancelled">Cancelada</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose}>Cancelar</Button>
                        <Button onClick={handleStatusChange} variant="contained">
                            Actualizar Estado
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Container>
    );
}

export default AdminReservations; 