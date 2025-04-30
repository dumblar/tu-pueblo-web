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
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [open, setOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone_number: '',
        role: 'user'
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users`);
            const data = await response.json();
            setUsers(data);
        } catch (error) {
            setError('Error al cargar los usuarios');
        }
    };

    const handleOpen = (user = null) => {
        if (user) {
            setSelectedUser(user);
            setFormData({
                name: user.name,
                email: user.email,
                phone_number: user.phone_number,
                role: user.role
            });
        } else {
            setSelectedUser(null);
            setFormData({
                name: '',
                email: '',
                phone_number: '',
                role: 'user'
            });
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedUser(null);
        setFormData({
            name: '',
            email: '',
            phone_number: '',
            role: 'user'
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const url = selectedUser
                ? `${process.env.REACT_APP_API_URL}/api/users/${selectedUser.id}`
                : `${process.env.REACT_APP_API_URL}/api/users`;

            const method = selectedUser ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Error al guardar el usuario');
            }

            setSuccess(selectedUser ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente');
            handleClose();
            fetchUsers();
        } catch (error) {
            setError(error.message);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de eliminar este usuario?')) {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/${id}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    throw new Error('Error al eliminar el usuario');
                }

                setSuccess('Usuario eliminado exitosamente');
                fetchUsers();
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
                        Gestión de Usuarios
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={() => handleOpen()}
                    >
                        Nuevo Usuario
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
                                <TableCell>ID</TableCell>
                                <TableCell>Nombre</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Teléfono</TableCell>
                                <TableCell>Rol</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>{user.id}</TableCell>
                                    <TableCell>{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.phone_number}</TableCell>
                                    <TableCell>{user.role}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleOpen(user)}>
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton onClick={() => handleDelete(user.id)}>
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
                        {selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                    </DialogTitle>
                    <DialogContent>
                        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                            <TextField
                                fullWidth
                                label="Nombre"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                margin="normal"
                                required
                            />
                            <TextField
                                fullWidth
                                label="Email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                margin="normal"
                                required
                            />
                            <TextField
                                fullWidth
                                label="Teléfono"
                                value={formData.phone_number}
                                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                margin="normal"
                                required
                            />
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Rol</InputLabel>
                                <Select
                                    value={formData.role}
                                    label="Rol"
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <MenuItem value="user">Usuario</MenuItem>
                                    <MenuItem value="admin">Administrador</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose}>Cancelar</Button>
                        <Button onClick={handleSubmit} variant="contained">
                            {selectedUser ? 'Actualizar' : 'Crear'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Container>
    );
}

export default AdminUsers; 