import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Button, Paper, CircularProgress, Alert } from '@mui/material';
import SignatureCanvas from 'react-signature-canvas';
import { Eraser, Send, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

const RemoteSign = () => {
    const { id } = useParams();
    const [contract, setContract] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const sigRef = useRef();

    useEffect(() => {
        const fetchContract = async () => {
            try {
                const { data } = await axios.get(`/api/contracts/public/${id}`);
                setContract(data);
            } catch (err) {
                console.error('Error fetching contract:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchContract();
    }, [id]);

    const handleClear = () => sigRef.current.clear();

    const handleSubmit = async () => {
        if (sigRef.current.isEmpty()) return alert('Bitte zuerst unterschreiben');

        setSubmitting(true);
        try {
            const signature = sigRef.current.toDataURL();
            await axios.put(`/api/contracts/public/sign/${id}`, {
                signature,
                type: 'customer'
            });
            setSuccess(true);
        } catch (err) {
            alert('Fehler beim Senden der Unterschrift');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress /></Box>;
    if (!contract) return <Box sx={{ p: 4 }}><Alert severity="error">Kaufvertrag nicht gefunden oder abgelaufen.</Alert></Box>;

    if (success || contract.signatureReceived) return (
        <Box sx={{ p: 4, textAlign: 'center', mt: 10 }}>
            <CheckCircle2 size={64} color="#10B981" />
            <Typography variant="h5" sx={{ mt: 2, fontWeight: 700 }}>Vielen Dank!</Typography>
            <Typography color="text.secondary">Ihre Unterschrift wurde bereits erfolgreich übertragen.</Typography>
        </Box>
    );

    return (
        <Box sx={{ maxWidth: 500, mx: 'auto', p: 3 }}>
            <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Typography variant="h5" fontWeight="900" gutterBottom>Digitale Unterschrift</Typography>
                <Typography variant="body2" color="text.secondary">Kaufvertrag: <strong>{contract.invoiceNr}</strong></Typography>
                <Typography variant="body2" color="text.secondary">Kunde: <strong>{contract.customerName}</strong></Typography>
            </Box>

            <Paper sx={{ p: 1, border: '2px solid #E2E8F0', borderRadius: 5, overflow: 'hidden', bgcolor: 'white' }}>
                <SignatureCanvas
                    ref={sigRef}
                    penColor="#1E293B"
                    canvasProps={{
                        width: window.innerWidth > 500 ? 450 : window.innerWidth - 60,
                        height: 250,
                        className: 'sigCanvas'
                    }}
                />
                <Box sx={{ p: 1, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between' }}>
                    <Button variant="text" size="small" startIcon={<Eraser size={14} />} onClick={handleClear}>Löschen</Button>
                    <Typography variant="caption" color="text.secondary" sx={{ py: 1 }}>Bitte im Feld unterschreiben</Typography>
                </Box>
            </Paper>

            <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<Send size={18} />}
                onClick={handleSubmit}
                disabled={submitting}
                sx={{ mt: 4, py: 2, borderRadius: 3, fontWeight: 800 }}
            >
                {submitting ? 'Wird gesendet...' : 'Unterschrift senden'}
            </Button>
        </Box>
    );
};

export default RemoteSign;
