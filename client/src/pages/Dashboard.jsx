import { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Button, Chip, TextField, InputAdornment, IconButton,
    Grid, Card, CardContent, Fade, Tooltip, Avatar, CircularProgress
} from '@mui/material';
import { Search, Eye, FilePlus, Trash2, Package, TrendingUp, CheckCircle2, Clock, Download, Sparkles, Send, Bot, User as UserIcon, MessageSquare, Trash, Phone, PenTool } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import api from '../services/api';
import * as XLSX from 'xlsx';
import { io } from 'socket.io-client';

const socket = io(`http://${window.location.hostname}:5000`);

const Dashboard = () => {
    const [contracts, setContracts] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [aiPrompt, setAiPrompt] = useState('');
    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem('ai_messages');
        return saved ? JSON.parse(saved) : [];
    });
    const [aiLoading, setAiLoading] = useState(false);

    useEffect(() => {
        localStorage.setItem('ai_messages', JSON.stringify(messages));
    }, [messages]);

    const clearChat = () => {
        if (window.confirm('Verlauf wirklich leeren?')) {
            setMessages([]);
            localStorage.removeItem('ai_messages');
        }
    };

    const scrollToBottom = () => {
        const chatContainer = document.getElementById('chat-container');
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    const user = JSON.parse(localStorage.getItem('user'));

    const handleAiQuery = async () => {
        if (!aiPrompt.trim() || aiLoading) return;

        const userMessage = { role: 'user', content: aiPrompt };
        setMessages(prev => [...prev, userMessage]);
        setAiPrompt('');
        setAiLoading(true);

        try {
            const { data } = await api.post('/ai/query', {
                prompt: aiPrompt,
                history: messages.slice(-5) // Send last 5 messages for context
            });
            setMessages(prev => [...prev, { role: 'bot', content: data.answer }]);
        } catch (err) {
            console.error('AI Query Error:', err);
            setMessages(prev => [...prev, { role: 'bot', content: 'Fehler bei der Anfrage. Bitte versuchen Sie es später erneut.', error: true }]);
        } finally {
            setAiLoading(false);
        }
    };

    useEffect(() => {
        const fetchContracts = async () => {
            try {
                const { data } = await api.get('/contracts');
                setContracts(data);
            } catch (err) {
                console.error('Error fetching contracts:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchContracts();

        // Real-time listeners
        socket.on('contractCreated', (newContract) => {
            setContracts(prev => [newContract, ...prev]);
        });

        socket.on('contractUpdated', (updatedContract) => {
            setContracts(prev => prev.map(c => c.id === updatedContract.id ? updatedContract : c));
        });

        socket.on('contractDeleted', (id) => {
            setContracts(prev => prev.filter(c => c.id !== id));
        });

        return () => {
            socket.off('contractCreated');
            socket.off('contractUpdated');
            socket.off('contractDeleted');
        };
    }, []);

    const handleDelete = async (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        if (!window.confirm('Möchten Sie diesen Kaufvertrag wirklich löschen?')) return;

        try {
            await api.delete(`/contracts/${id}`);
            // Socket will handle local state update
        } catch (err) {
            alert('Fehler beim Löschen');
        }
    };

    const handleExport = async () => {
        try {
            const { data } = await api.get('/contracts/export');

            // Format data for Excel
            const worksheet = XLSX.utils.json_to_sheet(data.map(c => ({
                'Rechnungs-Nr': c.invoiceNr,
                'Datum': c.date,
                'Status': c.status,
                'Kunde': c.customerName,
                'Produkt': c.deviceType,
                'Netto': c.sum,
                'MwSt': c.vatAmount,
                'Gesamt': c.totalAmount,
                'Zahlungsart': c.paymentMethod
            })));

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Kaufverträge");
            XLSX.writeFile(workbook, `Kaufvertraege_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (err) {
            alert('Export fehlgeschlagen: ' + (err.response?.data?.message || err.message));
        }
    };
    const filteredContracts = contracts.filter(c =>
        c.invoiceNr?.toLowerCase().includes(search.toLowerCase()) ||
        c.customerName?.toLowerCase().includes(search.toLowerCase()) ||
        c.deviceType?.toLowerCase().includes(search.toLowerCase())
    );

    const stats = [
        { label: 'Gesamtverträge', value: contracts.length, icon: <Package size={24} />, color: '#BF0010' },
        { label: 'Umsatz Gesamt', value: `${contracts.reduce((acc, curr) => acc + Number(curr.totalAmount), 0).toFixed(2)} €`, icon: <TrendingUp size={24} />, color: '#10B981' },
        { label: 'Abgeschlossen', value: contracts.filter(c => c.status === 'Signed').length, icon: <CheckCircle2 size={24} />, color: '#3B82F6' },
    ];

    return (
        <Box>
            <Box sx={{ mb: 6 }}>
                <Typography variant="h1" gutterBottom>Management Übersicht</Typography>
                <Typography variant="body1" color="text.secondary">Hier finden Sie alle aktuellen Kaufverträge und Verkäufe in Echtzeit.</Typography>
            </Box>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 6 }}>
                {stats.map((stat, i) => (
                    <Grid size={{ xs: 12, md: 4 }} key={i}>
                        <Card sx={{
                            borderRadius: 4,
                            border: 'none',
                            background: 'white',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'translateY(-4px)' }
                        }}>
                            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3, p: 3 }}>
                                <Box sx={{
                                    p: 2,
                                    borderRadius: 3,
                                    bgcolor: `${stat.color}10`,
                                    color: stat.color,
                                    display: 'flex'
                                }}>
                                    {stat.icon}
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ textTransform: 'uppercase' }}>{stat.label}</Typography>
                                    <Typography variant="h4" fontWeight="800">{stat.value}</Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* AI Smart Assistant */}
            <Paper sx={{
                mb: 6,
                p: 3,
                borderRadius: 5,
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                        <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'primary.main', display: 'flex' }}>
                            <Sparkles size={20} color="white" />
                        </Box>
                        <Typography variant="h6" fontWeight="700">KI Smart Assistant</Typography>
                        <Box sx={{ flexGrow: 1 }} />
                        {messages.length > 0 && (
                            <Tooltip title="Chat leeren">
                                <IconButton onClick={clearChat} size="small" sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: 'white' } }}>
                                    <Trash size={16} />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                    <Typography variant="body2" sx={{ opacity: 0.8, mb: 3 }}>
                        Fragen Sie Ihren Assistenten nach Berichten, Analysen oder spezifischen Daten (z.B. "Wie viel Umsatz haben wir diesen Monat mit Waschmaschinen gemacht?")
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Frage stellen..."
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAiQuery()}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: 'rgba(255,255,255,0.05)',
                                    color: 'white',
                                    borderRadius: 3,
                                    '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                                    '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                                }
                            }}
                        />
                        <Button
                            variant="contained"
                            disabled={aiLoading}
                            onClick={handleAiQuery}
                            sx={{ borderRadius: 3, px: 4, minWidth: 120 }}
                        >
                            {aiLoading ? (
                                <CircularProgress key="loading-icon" size={24} color="inherit" />
                            ) : (
                                <Box key="send-content" sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Send size={18} style={{ marginRight: 8 }} />
                                    <Typography variant="button">Senden</Typography>
                                </Box>
                            )}
                        </Button>
                    </Box>

                    <Box
                        id="chat-container"
                        sx={{
                            mt: 3,
                            maxHeight: 400,
                            overflowY: 'auto',
                            pr: 1,
                            pb: 2,
                            '&::-webkit-scrollbar': { width: '6px' },
                            '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '10px' }
                        }}
                    >
                        {messages.length === 0 && !aiLoading && (
                            <Box sx={{ p: 6, textAlign: 'center', opacity: 0.5 }}>
                                <Box sx={{ mb: 2, display: 'inline-flex', p: 2, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.03)' }}>
                                    <MessageSquare size={32} />
                                </Box>
                                <Typography variant="h6" gutterBottom>Gerätewelt KI Analyst</Typography>
                                <Typography variant="body2">Wie kann ich Ihnen beim Auswerten der Kaufverträge helfen?</Typography>
                            </Box>
                        )}

                        {messages.map((msg, idx) => (
                            <Fade in key={idx}>
                                <Box sx={{
                                    display: 'flex',
                                    gap: 2,
                                    mb: 2,
                                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
                                }}>
                                    <Box sx={{
                                        p: 1,
                                        borderRadius: 2,
                                        bgcolor: msg.role === 'user' ? 'primary.dark' : 'rgba(255,255,255,0.05)',
                                        display: 'flex',
                                        height: 'fit-content'
                                    }}>
                                        {msg.role === 'user' ? <UserIcon size={18} /> : <Bot size={18} color="#3B82F6" />}
                                    </Box>
                                    <Paper sx={{
                                        p: 2,
                                        borderRadius: msg.role === 'user' ? '20px 4px 20px 20px' : '4px 20px 20px 20px',
                                        bgcolor: msg.role === 'user' ? 'primary.main' : 'rgba(255,255,255,0.08)',
                                        color: 'white',
                                        maxWidth: '85%',
                                        backdropFilter: 'blur(10px)',
                                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                                        border: msg.error ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.08)'
                                    }}>
                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                                            {msg.content}
                                        </Typography>
                                    </Paper>
                                </Box>
                            </Fade>
                        ))}

                        {aiLoading && (
                            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)', display: 'flex' }}>
                                    <Bot size={18} color="#3B82F6" />
                                </Box>
                                <Paper sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.08)', color: 'white' }}>
                                    <CircularProgress size={16} color="inherit" />
                                </Paper>
                            </Box>
                        )}
                    </Box>
                </Box>
                {/* Decorative background element */}
                <Box sx={{
                    position: 'absolute',
                    top: -50,
                    right: -50,
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0) 70%)',
                    zIndex: 0
                }} />
            </Paper>

            {/* Table Section */}
            <Paper sx={{ mb: 4, p: 4, borderRadius: 5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <TextField
                        sx={{ width: 400 }}
                        placeholder="Suche..."
                        size="small"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search size={20} color="#94A3B8" />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        {user?.role === 'Admin' && (
                            <Button
                                variant="outlined"
                                onClick={handleExport}
                                startIcon={<Download size={18} />}
                            >
                                Export (Admin)
                            </Button>
                        )}
                        <Button
                            variant="contained"
                            component={Link}
                            to="/contracts/new"
                            startIcon={<FilePlus size={18} />}
                        >
                            Neuer Kaufvertrag
                        </Button>
                    </Box>
                </Box>

                <TableContainer sx={{ borderRadius: 3, overflow: 'hidden' }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Rechnungs-Nr</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Kunde</TableCell>
                                <TableCell>Betrag</TableCell>
                                <TableCell align="right">Aktionen</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredContracts.map((contract) => (
                                <TableRow key={contract.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>{contract.invoiceNr}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={contract.status}
                                            icon={contract.status === 'Signed' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                                            color={contract.status === 'Signed' ? 'success' : 'warning'}
                                            variant="soft"
                                            size="small"
                                            sx={{ fontWeight: 700, borderRadius: '8px' }}
                                        />
                                        {contract.isPhoneOrder && (
                                            <Chip
                                                label="Extern"
                                                icon={<Phone size={12} />}
                                                sx={{ ml: 1, fontWeight: 700, borderColor: '#3B82F6', color: '#3B82F6' }}
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell>{contract.customerName || '-'}</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>{Number(contract.totalAmount).toFixed(2)} €</TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                            <Tooltip title="Ansehen">
                                                <IconButton component={Link} to={`/contracts/${contract.id}`} sx={{ color: '#475569' }}>
                                                    <Eye size={20} />
                                                </IconButton>
                                            </Tooltip>
                                            {contract.isPhoneOrder && !contract.signatureReceived && (
                                                <Tooltip title="Unterschrift erfassen">
                                                    <IconButton component={Link} to={`/sign/${contract.id}`} sx={{ color: '#3B82F6' }}>
                                                        <PenTool size={20} />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            {user?.role === 'Admin' && (
                                                <Tooltip title="Löschen">
                                                    <IconButton onClick={(e) => handleDelete(e, contract.id)} sx={{ color: '#F43F5E' }}>
                                                        <Trash2 size={20} />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default Dashboard;
