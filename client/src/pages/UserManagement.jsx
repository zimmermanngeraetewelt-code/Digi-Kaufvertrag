import { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Button, IconButton, TextField, Dialog,
    DialogTitle, DialogContent, DialogActions, MenuItem, Alert
} from '@mui/material';
import { UserPlus, Trash2, ShieldCheck, Mail, User } from 'lucide-react';
import api from '../services/api';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [open, setOpen] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'Technician' });
    const [error, setError] = useState('');

    const fetchUsers = async () => {
        try {
            const { data } = await api.get('/auth/users');
            setUsers(data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreate = async () => {
        try {
            await api.post('/auth/register', newUser);
            setOpen(false);
            setNewUser({ name: '', email: '', password: '', role: 'Technician' });
            fetchUsers();
        } catch (err) {
            setError(err.response?.data?.message || 'Fehler beim Erstellen');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Möchten Sie diesen Benutzer wirklich löschen?')) return;
        try {
            await api.delete(`/auth/users/${id}`);
            fetchUsers();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h1">Benutzerverwaltung</Typography>
                <Button
                    variant="contained"
                    startIcon={<UserPlus size={18} />}
                    onClick={() => setOpen(true)}
                >
                    Neuer Benutzer
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>E-Mail</TableCell>
                            <TableCell>Rolle</TableCell>
                            <TableCell align="right">Aktionen</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id} hover>
                                <TableCell sx={{ fontWeight: 600 }}>{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {user.role === 'Admin' ? <ShieldCheck size={16} color="#BF0010" /> : <User size={16} />}
                                        {user.role}
                                    </Box>
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton color="error" onClick={() => handleDelete(user.id)} disabled={user.email === 'admin@geraetewelt.com'}>
                                        <Trash2 size={20} />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 800 }}>Benutzer erstellen</DialogTitle>
                <DialogContent>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            label="Vollständiger Name"
                            fullWidth
                            value={newUser.name}
                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        />
                        <TextField
                            label="E-Mail"
                            fullWidth
                            value={newUser.email}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        />
                        <TextField
                            label="Passwort"
                            type="password"
                            fullWidth
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        />
                        <TextField
                            select
                            label="Rolle"
                            fullWidth
                            value={newUser.role}
                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        >
                            <MenuItem value="Technician">Techniker</MenuItem>
                            <MenuItem value="Admin">Administrator</MenuItem>
                            <MenuItem value="Viewer">Viewer (Nur Lesen)</MenuItem>
                        </TextField>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpen(false)} color="inherit">Abbrechen</Button>
                    <Button variant="contained" onClick={handleCreate}>Erstellen</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UserManagement;
