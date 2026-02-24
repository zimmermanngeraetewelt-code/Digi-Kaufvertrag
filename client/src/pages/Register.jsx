import { useState } from 'react';
import {
    Box, TextField, Button, Typography, Paper, Alert, Container,
    InputAdornment, Link
} from '@mui/material';
import { Mail, Lock, User, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import api from '../services/api';
import { motion } from 'framer-motion';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/auth/register', { name, email, password });
            alert('Registrierung erfolgreich! Bitte loggen Sie sich ein.');
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Registrierung fehlgeschlagen');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
            p: 2
        }}>
            <Container maxWidth="xs">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <Paper elevation={0} sx={{ p: 5, borderRadius: 8, boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}>
                        <Button
                            component={RouterLink}
                            to="/login"
                            startIcon={<ArrowLeft size={16} />}
                            sx={{ mb: 3, textTransform: 'none' }}
                            color="inherit"
                        >
                            Zurück zum Login
                        </Button>

                        <Box sx={{
                            width: 50, height: 50, bgcolor: 'primary.main', borderRadius: '12px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3
                        }}>
                            <ShieldCheck color="white" size={28} />
                        </Box>

                        <Typography variant="h4" fontWeight="800" gutterBottom>Registrieren</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                            Erstellen Sie ein neues Techniker-Konto.
                        </Typography>

                        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>{error}</Alert>}

                        <Box component="form" onSubmit={handleSubmit}>
                            <TextField
                                fullWidth
                                label="Vollständiger Name"
                                variant="outlined"
                                margin="normal"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><User size={18} /></InputAdornment>
                                }}
                            />
                            <TextField
                                fullWidth
                                label="E-Mail Adresse"
                                variant="outlined"
                                margin="normal"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><Mail size={18} /></InputAdornment>
                                }}
                            />
                            <TextField
                                fullWidth
                                label="Passwort"
                                type="password"
                                variant="outlined"
                                margin="normal"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><Lock size={18} /></InputAdornment>
                                }}
                            />
                            <Button
                                fullWidth
                                type="submit"
                                variant="contained"
                                size="large"
                                disabled={loading}
                                sx={{ mt: 4, py: 1.5, fontSize: '1rem' }}
                            >
                                {loading ? 'Wird erstellt...' : 'Konto erstellen'}
                            </Button>
                        </Box>
                    </Paper>
                </motion.div>
            </Container>
        </Box>
    );
};

export default Register;
