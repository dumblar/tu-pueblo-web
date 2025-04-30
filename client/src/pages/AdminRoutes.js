import React, { useState, useEffect } from 'react';
import {
    Container,
    Box,
    Typography,
    Button,
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
    TextField,
    Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

function AdminRoutes() {
    const [routes, setRoutes] = useState([]);
    const [open, setOpen] = useState(false);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({
        origin: '',
        destination: '',
        departure_time: '',
        arrival_time: '',
        capacity: '',
        price: ''
    });

    useEffect(() => {
        fetchRoutes();
    }, []);

    const fetchRoutes = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/routes`);
            const data = await response.json();
            setRoutes(data);
        } catch (error) {
            setError('Error al cargar las rutas');
        }
    };

    const handleOpen = (route = null) => {
        if (route) {
            setSelectedRoute(route);
            setFormData({
                origin: route.origin,
                destination: route.destination,
                departure_time: route.departure_time,
                arrival_time: route.arrival_time,
                capacity: route.capacity,
                price: route.price
            });
        } else {
            setSelectedRoute(null);
            setFormData({
                origin: '',
                destination: '',
                departure_time: '',
                arrival_time: '',
                capacity: '',
                price: ''
            });
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedRoute(null);
        setFormData({
            origin: '',
            destination: '',
            departure_time: '',
            arrival_time: '',
            capacity: '',
            price: ''
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const url = selectedRoute
                ? `${process.env.REACT_APP_API_URL}/api/routes/${selectedRoute.id}`
                : `${process.env.REACT_APP_API_URL}/api/routes`;

            const method = selectedRoute ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Error al guardar la ruta');
            }

            setSuccess(selectedRoute ? 'Ruta actualizada exitosamente' : 'Ruta creada exitosamente');
            handleClose();
            fetchRoutes();
        } catch (error) {
            setError(error.message);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de eliminar esta ruta?')) {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/api/routes/${id}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    throw new Error('Error al eliminar la ruta');
                }

                setSuccess('Ruta eliminada exitosamente');
                fetchRoutes();
            } catch (error) {
                setError(error.message);
            }
        }
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography component="h1" variant="h5">
                        Gestión de Rutas
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpen()}
                    >
                        Nueva Ruta
                    </Button>
                </Box>

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
                                <TableCell>Origen</TableCell>
                                <TableCell>Destino</TableCell>
                                <TableCell>Hora Salida</TableCell>
                                <TableCell>Hora Llegada</TableCell>
                                <TableCell>Capacidad</TableCell>
                                <TableCell>Precio</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {routes.map((route) => (
                                <TableRow key={route.id}>
                                    <TableCell>{route.origin}</TableCell>
                                    <TableCell>{route.destination}</TableCell>
                                    <TableCell>{route.departure_time}</TableCell>
                                    <TableCell>{route.arrival_time}</TableCell>
                                    <TableCell>{route.capacity}</TableCell>
                                    <TableCell>${route.price}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleOpen(route)}>
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton onClick={() => handleDelete(route.id)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Dialog open={open} onClose={handleClose}>
                    <DialogTitle>
                        {selectedRoute ? 'Editar Ruta' : 'Nueva Ruta'}
                    </DialogTitle>
                    <DialogContent>
                        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                            <TextField
                                fullWidth
                                label="Origen"
                                value={formData.origin}
                                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                                margin="normal"
                                required
                            />
                            <TextField
                                fullWidth
                                label="Destino"
                                value={formData.destination}
                                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                                margin="normal"
                                required
                            />
                            <TextField
                                fullWidth
                                label="Hora de Salida"
                                type="time"
                                value={formData.departure_time}
                                onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                                margin="normal"
                                required
                                InputLabelProps={{ shrink: true }}
                            />
                            <TextField
                                fullWidth
                                label="Hora de Llegada"
                                type="time"
                                value={formData.arrival_time}
                                onChange={(e) => setFormData({ ...formData, arrival_time: e.target.value })}
                                margin="normal"
                                required
                                InputLabelProps={{ shrink: true }}
                            />
                            <TextField
                                fullWidth
                                label="Capacidad"
                                type="number"
                                value={formData.capacity}
                                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                margin="normal"
                                required
                            />
                            <TextField
                                fullWidth
                                label="Precio"
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                margin="normal"
                                required
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose}>Cancelar</Button>
                        <Button onClick={handleSubmit} variant="contained">
                            {selectedRoute ? 'Actualizar' : 'Crear'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Container>
    );
}

export default AdminRoutes; 