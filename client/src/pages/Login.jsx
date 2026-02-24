import { useState } from 'react';
import {
    Box, TextField, Button, Typography, Paper, Alert, Container,
    InputAdornment, IconButton, CircularProgress, Link
} from '@mui/material';
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import api from '../services/api';
import { motion } from 'framer-motion';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const { data } = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify({
                name: data.name,
                email: data.email,
                role: data.role,
                defaultSignature: data.defaultSignature
            }));
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Login fehlgeschlagen');
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Paper elevation={0} sx={{
                        p: 5,
                        borderRadius: 8,
                        boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
                        textAlign: 'center'
                    }}>
                        <Box sx={{
                            width: 60, height: 60, bgcolor: 'primary.main', borderRadius: '16px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            mx: 'auto', mb: 3, boxShadow: '0 8px 16px rgba(191, 0, 16, 0.2)'
                        }}>
                            <ShieldCheck color="white" size={32} />
                        </Box>

                        <Typography variant="h4" fontWeight="800" gutterBottom>Willkommen</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                            Bitte melden Sie sich an, um das Digital Kaufvertrag System zu nutzen.
                        </Typography>

                        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>{error}</Alert>}

                        <Box component="form" onSubmit={handleSubmit}>
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
                                type={showPassword ? 'text' : 'password'}
                                variant="outlined"
                                margin="normal"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><Lock size={18} /></InputAdornment>,
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                            />
                            <Button
                                fullWidth
                                type="submit"
                                variant="contained"
                                size="large"
                                disabled={loading}
                                sx={{ mt: 4, py: 2, fontSize: '1.1rem', position: 'relative' }}
                            >
                                <span style={{ visibility: loading ? 'hidden' : 'visible' }}>Anmelden</span>
                                {loading && (
                                    <CircularProgress
                                        size={24}
                                        color="inherit"
                                        sx={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            marginTop: '-12px',
                                            marginLeft: '-12px',
                                        }}
                                    />
                                )}
                            </Button>
                        </Box>

                    </Paper>
                </motion.div>

                <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 4, color: 'text.secondary' }}>
                    &copy; {new Date().getFullYear()} Gerätewelt Köln. Alle Rechte vorbehalten.
                </Typography>
            </Container>
        </Box>
    );
};

export default Login;
