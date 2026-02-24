import { useState, useRef, useEffect, useCallback } from 'react';
import debounce from 'lodash/debounce';
import {
    Box, Stepper, Step, StepLabel, Button, Typography, Paper, Grid,
    TextField, Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, IconButton, MenuItem, Divider, Checkbox, FormControlLabel,
    InputAdornment, Card, CardContent, CircularProgress, Autocomplete
} from '@mui/material';
import { Plus, Trash2, Save, Send, ChevronRight, ChevronLeft, Eraser, Package, User, CreditCard, PenLine, CheckCircle2, Clock, MapPin } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { format } from 'date-fns';
import { QRCodeCanvas } from 'qrcode.react';
import { io } from 'socket.io-client';

const socket = io(`http://${window.location.hostname}:5000`);

const steps = [
    { label: 'Allgemein', icon: <Package size={20} /> },
    { label: 'Kunde', icon: <User size={20} /> },
    { label: 'Produkte', icon: <Package size={20} /> },
    { label: 'Zahlung', icon: <CreditCard size={20} /> },
    { label: 'Unterschriften', icon: <PenLine size={20} /> }
];

const CustomStepIcon = ({ active, completed, index }) => {
    const stepIcon = steps[index]?.icon;
    return (
        <Box sx={{
            width: 40, height: 40, borderRadius: '50%',
            bgcolor: active || completed ? 'primary.main' : '#E2E8F0',
            color: active || completed ? 'white' : '#64748B',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.3s'
        }}>
            {stepIcon}
        </Box>
    );
};

const ContractForm = () => {
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [savedId, setSavedId] = useState(null);
    const [savedContractId, setSavedContractId] = useState(null);
    const [localIp, setLocalIp] = useState(window.location.hostname);
    const [formData, setFormData] = useState({
        invoiceNr: '',
        technicianName: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        appointmentDate: '',
        appointmentTime: '',
        deviceType: '',
        customerName: '',
        customerAddress: '',
        items: [{ pos: 1, qty: 1, description: '', price: 0, availability: 'Sofort verfügbar' }],
        paymentMethod: 'Bar',
        sum: 0,
        vatAmount: 0,
        totalAmount: 0,
        technicianSignature: '',
        customerSignature: '',
        signatureReceived: false,
        isPhoneOrder: false,
        signatureMethod: 'Digital'
    });

    const [addressOptions, setAddressOptions] = useState([]);
    const [addressLoading, setAddressLoading] = useState(false);
    const [addressOpen, setAddressOpen] = useState(false);

    const fetchAddresses = useCallback(
        debounce(async (query) => {
            if (!query || query.length < 3) {
                setAddressOptions([]);
                return;
            }
            setAddressLoading(true);
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&countrycodes=de&limit=8`,
                    { headers: { 'Accept-Language': 'de', 'User-Agent': 'GeraeteweltKoeln/1.0' } }
                );
                const data = await response.json();
                const options = data.map(item => item.display_name);
                setAddressOptions(options);
                if (options.length > 0) setAddressOpen(true);
            } catch (err) {
                console.error('Error fetching addresses:', err);
            } finally {
                setAddressLoading(false);
            }
        }, 300),
        []
    );

    const techSigRef = useRef();
    const customerSigRef = useRef();

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            setFormData(prev => ({
                ...prev,
                technicianName: user.name || prev.technicianName,
                technicianSignature: user.defaultSignature || prev.technicianSignature
            }));
        }
    }, []);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const { data } = await api.get('/config');
                if (data.localIp && data.localIp !== 'localhost') {
                    setLocalIp(data.localIp);
                }
            } catch (err) {
                console.error('Failed to fetch config', err);
            }
        };
        fetchConfig();
    }, []);

    useEffect(() => {
        socket.on('signatureReceived', ({ id, type, signature }) => {
            if (id === savedId || id === formData.id) {
                if (type === 'customer') {
                    setFormData(prev => ({ ...prev, customerSignature: signature, signatureReceived: true }));
                } else if (type === 'technician') {
                    setFormData(prev => ({ ...prev, technicianSignature: signature }));
                }
            }
        });
        return () => socket.off('signatureReceived');
    }, [savedId, formData.id]);

    const handleNext = () => setActiveStep((prev) => prev + 1);
    const handleBack = () => setActiveStep((prev) => prev - 1);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const calculateTotals = (items) => {
        const totalAmount = items.reduce((acc, item) => acc + (Number(item.qty) * Number(item.price)), 0);
        const sum = totalAmount / 1.19; // Netto amount
        const vatAmount = totalAmount - sum; // VAT amount
        return { sum, vatAmount, totalAmount };
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;

        const totals = calculateTotals(newItems);

        setFormData(prev => ({
            ...prev,
            ...totals,
            items: newItems
        }));
    };

    const addItem = () => {
        const newItems = [...formData.items, { pos: formData.items.length + 1, qty: 1, description: '', price: 0, availability: 'Sofort verfügbar' }];
        const totals = calculateTotals(newItems);
        setFormData(prev => ({
            ...prev,
            ...totals,
            items: newItems
        }));
    };

    const removeItem = (index) => {
        const newItems = formData.items
            .filter((_, i) => i !== index)
            .map((item, i) => ({ ...item, pos: i + 1 }));
        const totals = calculateTotals(newItems);
        setFormData(prev => ({ ...prev, ...totals, items: newItems }));
    };

    const saveContract = async (status = 'Draft') => {
        if (!formData.invoiceNr) {
            alert('Bitte geben Sie eine Rechnungs-Nummer ein.');
            setActiveStep(0);
            return;
        }
        if (!formData.customerName) {
            alert('Bitte geben Sie den Kundennamen ein.');
            setActiveStep(1);
            return;
        }
        if (formData.items.length === 0 || !formData.items[0].description) {
            alert('Bitte fügen Sie mindestens ein Produkt hinzu.');
            setActiveStep(2);
            return;
        }
        setLoading(true);
        try {
            const token = localStorage.getItem('token');

            const techSig = techSigRef.current && !techSigRef.current.isEmpty() ? techSigRef.current.toDataURL() : formData.technicianSignature;
            const custSig = customerSigRef.current && !customerSigRef.current.isEmpty() ? customerSigRef.current.toDataURL() : formData.customerSignature;

            const finalData = {
                ...formData,
                status,
                technicianSignature: techSig,
                customerSignature: custSig,
                signatureReceived: custSig !== ''
            };

            let res;
            if (savedId || formData.id) {
                const id = savedId || formData.id;
                res = await api.put(`/contracts/${id}`, finalData);
            } else {
                res = await api.post('/contracts', finalData);
                setSavedId(res.data.id);
                setSavedContractId(res.data.id);
            }

            if (status === 'Signed') {
                navigate(`/contracts/${res.data.id}`);
            }
        } catch (err) {
            console.error('Error saving contract:', err);
            alert('Fehler beim Speichern');
        } finally {
            setLoading(false);
        }
    };

    const checkSignatureManual = async () => {
        const id = savedId || formData.id || savedContractId;
        if (!id) return;
        try {
            const { data } = await api.get(`/contracts/public/${id}`);
            if (data.signatureReceived) {
                const fullData = await api.get(`/contracts/${id}`);
                setFormData(fullData.data);
            } else {
                alert('Noch keine Unterschrift gefunden.');
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <Box maxWidth="1000px" mx="auto">
            <Box sx={{ mb: 6, textAlign: 'center' }}>
                <Typography variant="h1" gutterBottom>Neuer Kaufvertrag</Typography>
                <Typography variant="body1" color="text.secondary">Erstellen Sie einen neuen digitalen Kaufvertrag für Gerätewelt.</Typography>
            </Box>

            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 6 }}>
                {steps.map((step, index) => (
                    <Step key={step.label}>
                        <StepLabel
                            StepIconComponent={(props) => <CustomStepIcon {...props} index={index} />}
                        >{step.label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            <Paper sx={{ p: 5, mb: 4, borderRadius: 6, position: 'relative' }}>
                {loading && <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(255,255,255,0.7)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress /></Box>}

                {activeStep === 0 && (
                    <Grid container spacing={4}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label="Rechnungs-Nummer"
                                name="invoiceNr"
                                value={formData.invoiceNr}
                                onChange={handleInputChange}
                                required
                                error={!formData.invoiceNr && activeStep === 0}
                                helperText={!formData.invoiceNr && activeStep === 0 ? "Pflichtfeld" : ""}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">#</InputAdornment>
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            {/* Techniker name field removed as requested */}
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField fullWidth type="date" label="Datum" name="date" InputLabelProps={{ shrink: true }} value={formData.date} onChange={handleInputChange} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField fullWidth type="date" label="Termin" name="appointmentDate" InputLabelProps={{ shrink: true }} value={formData.appointmentDate} onChange={handleInputChange} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField fullWidth type="time" label="Uhrzeit" name="appointmentTime" InputLabelProps={{ shrink: true }} value={formData.appointmentTime} onChange={handleInputChange} />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField fullWidth label="Gerätetyp" name="deviceType" value={formData.deviceType} onChange={handleInputChange} placeholder="z.B. Waschmaschine, Miele W1" />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={formData.isPhoneOrder}
                                        onChange={(e) => setFormData(p => ({ ...p, isPhoneOrder: e.target.checked }))}
                                        color="primary"
                                    />
                                }
                                label={
                                    <Box>
                                        <Typography fontWeight="700">Extern</Typography>
                                        <Typography variant="caption" color="text.secondary">Unterschrift wird erst bei Lieferung/Abholung erfasst</Typography>
                                    </Box>
                                }
                            />
                        </Grid>
                    </Grid>
                )}

                {activeStep === 1 && (
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12 }}>
                            <TextField fullWidth label="Kundenname" name="customerName" value={formData.customerName} onChange={handleInputChange} />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            {/* Email field removed as requested */}
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Autocomplete
                                freeSolo
                                open={addressOpen}
                                onOpen={() => addressOptions.length > 0 && setAddressOpen(true)}
                                onClose={() => setAddressOpen(false)}
                                options={addressOptions}
                                loading={addressLoading}
                                filterOptions={(x) => x}  // Disable MUI's built-in filtering — API already filters
                                value={formData.customerAddress}
                                onInputChange={(event, newInputValue, reason) => {
                                    setFormData(prev => ({ ...prev, customerAddress: newInputValue }));
                                    if (reason === 'input') {
                                        fetchAddresses(newInputValue);
                                    }
                                }}
                                onChange={(event, newValue) => {
                                    if (newValue) {
                                        setFormData(prev => ({ ...prev, customerAddress: newValue }));
                                        setAddressOpen(false);
                                    }
                                }}
                                ListboxProps={{ style: { maxHeight: 280 } }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Vollständige Anschrift"
                                        placeholder="Straße, Hausnummer, PLZ, Stadt..."
                                        InputProps={{
                                            ...params.InputProps,
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <MapPin size={20} color="#BF0010" />
                                                </InputAdornment>
                                            ),
                                            endAdornment: (
                                                <>
                                                    {addressLoading ? <CircularProgress color="inherit" size={18} /> : null}
                                                    {params.InputProps.endAdornment}
                                                </>
                                            ),
                                        }}
                                    />
                                )}
                            />
                        </Grid>
                    </Grid>
                )}

                {activeStep === 2 && (
                    <Box>
                        <TableContainer sx={{ border: '1px solid #E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Pos</TableCell>
                                        <TableCell width="100">Stück</TableCell>
                                        <TableCell>Beschreibung / Artikel</TableCell>
                                        <TableCell width="150">Brutto Preis (€)</TableCell>
                                        <TableCell width="200">Verfügbarkeit</TableCell>
                                        <TableCell width="50"></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {formData.items.map((item, index) => (
                                        <TableRow key={index} hover>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>
                                                <TextField type="number" size="small" value={item.qty} onChange={(e) => handleItemChange(index, 'qty', e.target.value)} />
                                            </TableCell>
                                            <TableCell>
                                                <TextField fullWidth size="small" value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} placeholder="Produktname & EAN/Modell" />
                                            </TableCell>
                                            <TableCell>
                                                <TextField type="number" size="small" value={item.price} onChange={(e) => handleItemChange(index, 'price', e.target.value)} />
                                            </TableCell>
                                            <TableCell>
                                                <TextField select fullWidth size="small" value={item.availability} onChange={(e) => handleItemChange(index, 'availability', e.target.value)}>
                                                    <MenuItem value="Sofort verfügbar">Sofort verfügbar</MenuItem>
                                                    <MenuItem value="Auf Bestellung">Auf Bestellung</MenuItem>
                                                    <MenuItem value="In 2-3 Tagen">In 2-3 Tagen</MenuItem>
                                                </TextField>
                                            </TableCell>
                                            <TableCell>
                                                <IconButton color="error" onClick={() => removeItem(index)} disabled={formData.items.length === 1}>
                                                    <Trash2 size={18} />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <Button color="secondary" sx={{ mt: 3, fontWeight: 700 }} startIcon={<Plus size={18} />} onClick={addItem}>
                            Position hinzufügen
                        </Button>
                    </Box>
                )}

                {activeStep === 3 && (
                    <Grid container spacing={6}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="h6" fontWeight="800" gutterBottom>Zahlungsart</Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
                                {['Bar', 'Überweisung', 'Kartenzahlung'].map((method) => (
                                    <Paper
                                        key={method}
                                        onClick={() => setFormData({ ...formData, paymentMethod: method })}
                                        sx={{
                                            p: 2, borderRadius: 4, cursor: 'pointer',
                                            border: formData.paymentMethod === method ? '2px solid #BF0010' : '2px solid transparent',
                                            bgcolor: formData.paymentMethod === method ? '#FFF5F5' : 'white',
                                            transition: 'all 0.2s',
                                            display: 'flex', alignItems: 'center', gap: 2
                                        }}
                                    >
                                        <Checkbox checked={formData.paymentMethod === method} />
                                        <Typography fontWeight="700">Zahlung per {method}</Typography>
                                    </Paper>
                                ))}
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Card sx={{ bgcolor: 'secondary.main', color: 'white', borderRadius: 6 }}>
                                <CardContent sx={{ p: 4 }}>
                                    <Typography variant="h6" fontWeight="700" sx={{ opacity: 0.8, mb: 3 }}>Zahlungsübersicht</Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant="h5" fontWeight="900">Brutto Gesamt:</Typography>
                                        <Typography variant="h4" fontWeight="900" color="primary.light">{formData.totalAmount.toFixed(2)} €</Typography>
                                    </Box>
                                    <Divider sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.2)' }} />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body1" fontWeight="700" sx={{ opacity: 0.8 }}>davon 19% MwSt.:</Typography>
                                        <Typography variant="body1" fontWeight="700">{formData.vatAmount.toFixed(2)} €</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body1" fontWeight="700" sx={{ opacity: 0.8 }}>Netto Summe:</Typography>
                                        <Typography variant="body1" fontWeight="700">{formData.sum.toFixed(2)} €</Typography>
                                    </Box>
                                    <Typography variant="caption" sx={{ opacity: 0.6 }}>Alle Preise verstehen sich inkl. 19% MwSt.</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                )}

                {activeStep === 4 && (
                    <Grid container spacing={4}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="subtitle1" fontWeight="800" gutterBottom align="center">Unterschrift Techniker</Typography>
                            <Box sx={{ border: '2px solid #E2E8F0', borderRadius: 5, bgcolor: '#FFFFFF', overflow: 'hidden' }}>
                                {formData.technicianSignature ? (
                                    <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <img src={formData.technicianSignature} style={{ maxHeight: '100%' }} />
                                    </Box>
                                ) : (
                                    <SignatureCanvas
                                        ref={techSigRef}
                                        penColor='#1E293B'
                                        canvasProps={{ width: 450, height: 200, className: 'sigCanvas' }}
                                    />
                                )}
                                <Box sx={{ p: 1, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Button
                                        variant="text"
                                        size="small"
                                        onClick={async () => {
                                            const sig = techSigRef.current.toDataURL();
                                            try {
                                                await api.put('/auth/signature', { signature: sig });
                                                const user = JSON.parse(localStorage.getItem('user'));
                                                user.defaultSignature = sig;
                                                localStorage.setItem('user', JSON.stringify(user));
                                                setFormData(prev => ({ ...prev, technicianSignature: sig }));
                                                alert('Signatur als Standard gespeichert!');
                                            } catch (err) {
                                                alert('Fehler beim Speichern der Standardsignatur');
                                            }
                                        }}
                                        disabled={!techSigRef.current || techSigRef.current.isEmpty()}
                                    >
                                        Als Standard speichern
                                    </Button>
                                    <Button variant="text" size="small" startIcon={<Eraser size={14} />} onClick={() => { if (techSigRef.current) techSigRef.current.clear(); setFormData(p => ({ ...p, technicianSignature: '' })) }}>Löschen</Button>
                                </Box>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="subtitle1" fontWeight="800" gutterBottom align="center">Unterschrift Kunde</Typography>
                            {formData.customerSignature ? (
                                <Box sx={{ border: '2px solid #10B981', borderRadius: 5, bgcolor: '#F0FDF4', height: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <CheckCircle2 color="#10B981" size={40} />
                                    <Typography variant="h6" color="success.main" fontWeight="700">Unterschrift erhalten</Typography>
                                    <img src={formData.customerSignature} style={{ maxHeight: '100px', marginTop: 10 }} />
                                    <Button size="small" sx={{ mt: 1 }} onClick={() => setFormData(p => ({ ...p, customerSignature: '', signatureReceived: false }))}>Neu anfordern</Button>
                                </Box>
                            ) : formData.isPhoneOrder ? (
                                <Box sx={{ border: '2px dashed #3B82F6', borderRadius: 5, p: 4, textAlign: 'center', bgcolor: '#EFF6FF', height: 240, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                    <Clock color="#3B82F6" size={40} />
                                    <Typography variant="h6" color="primary.main" fontWeight="700" sx={{ mt: 1 }}>Extern</Typography>
                                    <Typography variant="body2" color="text.secondary">Die Unterschrift wird bei der Lieferung erfasst.</Typography>
                                    <Button variant="outlined" sx={{ mt: 2 }} onClick={() => setFormData(p => ({ ...p, isPhoneOrder: false }))}>Jetzt unterschreiben lassen</Button>
                                </Box>
                            ) : savedId ? (
                                <Box sx={{ border: '2px dashed #CBD5E1', borderRadius: 5, p: 3, textAlign: 'center', bgcolor: '#F8FAFC' }}>
                                    <Typography variant="body2" gutterBottom fontWeight="700">QR-Code zum mobilen Unterschreiben:</Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 2, p: 2, bgcolor: 'white', borderRadius: 3, width: 'fit-content', mx: 'auto' }}>
                                        <QRCodeCanvas value={`http://${localIp}:5173/sign/${savedId}`} size={160} />
                                    </Box>
                                    <Typography variant="caption" color="text.secondary">Kunde kann diesen Code mit dem Tablet/Handy scannen</Typography>
                                    <Button fullWidth variant="text" size="small" onClick={checkSignatureManual} sx={{ mt: 1 }}>Manuell prüfen</Button>
                                </Box>
                            ) : (
                                <Box sx={{ textAlign: 'center', p: 5 }}>
                                    <Button variant="contained" color="secondary" onClick={() => saveContract('Draft')}>
                                        QR-Code generieren
                                    </Button>
                                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>Speichern Sie den Entwurf, um den QR-Code zu sehen</Typography>
                                </Box>
                            )}
                        </Grid>
                    </Grid>
                )}
            </Paper>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button
                    disabled={activeStep === 0}
                    onClick={handleBack}
                    startIcon={<ChevronLeft size={18} />}
                    sx={{ color: 'text.secondary' }}
                >
                    Zurück
                </Button>
                <Box>
                    <Button key="draft-btn" variant="outlined" startIcon={<Save size={18} />} onClick={() => saveContract('Draft')} sx={{ mr: 2 }}>
                        Als Entwurf
                    </Button>
                    {activeStep === steps.length - 1 ? (
                        <Button key="finish-btn" variant="contained" size="large" startIcon={<Send size={18} />} onClick={() => saveContract('Signed')}>
                            Vertrag Finalisieren
                        </Button>
                    ) : (
                        <Button key="next-btn" variant="contained" size="large" onClick={handleNext} endIcon={<ChevronRight size={18} />}>
                            Nächster Schritt
                        </Button>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default ContractForm;
