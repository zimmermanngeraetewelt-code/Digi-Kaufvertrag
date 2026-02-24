import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Paper, Grid, Divider, Button, Chip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    CircularProgress, Checkbox, FormControlLabel, Switch, Alert, Tooltip
} from '@mui/material';
import { Printer, ArrowLeft, Trash2, CheckCircle2, Phone } from 'lucide-react';
import api from '../services/api';

const ContractDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [contract, setContract] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        const fetchContract = async () => {
            try {
                const { data } = await api.get(`/contracts/${id}`);
                setContract(data);
            } catch (err) {
                setError('Vertrag nicht gefunden');
            } finally {
                setLoading(false);
            }
        };
        fetchContract();
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    const confirmPaperSignature = async () => {
        try {
            const { data } = await api.put(`/contracts/${id}`,
                {
                    signatureReceived: true,
                    status: 'Signed',
                    signatureMethod: 'Paper'
                }
            );
            setContract(data);
        } catch (err) {
            alert('Fehler beim Aktualisieren');
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Diesen Vertrag wirklich für immer löschen?')) return;
        try {
            await api.delete(`/contracts/${id}`);
            navigate('/');
        } catch (err) {
            alert('Löschen fehlgeschlagen');
        }
    };


    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }} className="no-print"><CircularProgress /></Box>;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Box sx={{ minHeight: '100vh', py: 4 }}>
            {/* Action Bar - Hidden on Print */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, px: 2 }} className="no-print">
                <Button startIcon={<ArrowLeft size={18} />} onClick={() => navigate('/')} color="inherit">Zurück zum Dashboard</Button>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    {contract.isPhoneOrder && !contract.signatureReceived && (
                        <Button
                            variant="outlined"
                            color="success"
                            startIcon={<CheckCircle2 size={18} />}
                            onClick={confirmPaperSignature}
                            sx={{ mr: 2, fontWeight: 700 }}
                        >
                            Papier-Unterschrift Bestätigen
                        </Button>
                    )}

                    {!contract.isPhoneOrder && (
                        <FormControlLabel
                            control={<Switch checked={contract.signatureReceived} onChange={async () => {
                                const updatedStatus = !contract.signatureReceived;
                                const { data } = await api.put(`/contracts/${id}`, { signatureReceived: updatedStatus, status: updatedStatus ? 'Signed' : 'Pending' });
                                setContract(data);
                            }} color="success" />}
                            label={contract.signatureReceived ? "Unterschrift Liegt vor" : "Warten auf Unterschrift"}
                            sx={{ mr: 2 }}
                        />
                    )}

                    {contract.isPhoneOrder && (
                        <Chip
                            label={contract.signatureReceived ? "Abgeschlossen (Papier)" : "Extern"}
                            icon={contract.signatureReceived ? <CheckCircle2 size={14} /> : <Phone size={14} />}
                            color={contract.signatureReceived ? "success" : "primary"}
                            variant="outlined"
                            sx={{ mr: 2, fontWeight: 700 }}
                        />
                    )}


                    <Button variant="contained" color="secondary" startIcon={<Printer size={18} />} onClick={handlePrint}>Drucken</Button>
                    {user?.role === 'Admin' && (
                        <Button variant="outlined" color="error" startIcon={<Trash2 size={18} />} onClick={handleDelete}>Löschen</Button>
                    )}
                </Box>
            </Box>

            {/* The Printable Contract Paper - Flexbox to ensure full height expansion */}
            <Paper elevation={0} sx={{
                width: '210mm',
                minHeight: '297mm',
                mx: 'auto',
                p: 0,
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                bgcolor: 'white',
                border: '1px solid #eee',
                boxShadow: (theme) => theme.shadows[1],
                '& *': { color: 'black !important' },
                '@media print': {
                    boxShadow: 'none',
                    border: 'none',
                    m: 0,
                    p: 0,
                    width: '210mm',
                    minHeight: '297mm',
                    height: 'auto',
                    '.no-print': { display: 'none' },
                    '*': { WebkitPrintColorAdjust: 'exact !important', printColorAdjust: 'exact !important' },
                    'thead': { display: 'table-header-group' },
                    'tbody': { display: 'table-row-group' },
                    'tr': { pageBreakInside: 'avoid' }
                },
            }} className="printable-page">
                <style>
                    {`
                        @page {
                            size: A4;
                            margin: 0; /* Zero margin to let us control padding manually */
                        }
                        @media print {
                            body { margin: 0; padding: 0; }
                            .printable-page { 
                                margin: 0 !important; 
                                width: 210mm !important; 
                                min-height: 297mm !important; 
                            }
                        }
                    `}
                </style>

                {/* Letterhead Image */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        zIndex: 0,
                        pointerEvents: 'none'
                    }}
                >
                    <img
                        src="/letterhead.jpg"
                        alt="Letterhead"
                        style={{
                            width: '100%',
                            height: 'auto',
                            maxHeight: '297mm',
                            objectFit: 'contain'
                        }}
                    />
                </Box>

                {/* Content Area - Flex 1 to push footer down */}
                <Box className="content-box" sx={{ px: '20mm', pt: '50mm', pb: '15mm', flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, minHeight: '297mm' }}>

                    {/* Address Row */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" sx={{ fontSize: '9px', textDecoration: 'underline', mb: 0.5, display: 'block', opacity: 0.7 }}>
                                Gerätewelt • Nikolaus Str. 50 • 51149 Köln
                            </Typography>
                            <Box sx={{ mt: 1, pl: 0.5 }}>
                                <Typography variant="h5" fontWeight="900" sx={{ mb: 0.5, letterSpacing: -0.5 }}>{contract?.customerName || ''}</Typography>
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-line', fontSize: '14px', lineHeight: 1.4 }}>
                                    {contract?.customerAddress || ''}
                                </Typography>
                            </Box>
                        </Box>
                        {/* Right side - Pushed down further to clear red curve */}
                        <Box sx={{ textAlign: 'right', minWidth: '180px', pt: '25mm' }}>
                            <Box sx={{ mb: 1.5 }}>
                                <Typography variant="caption" display="block" sx={{ fontWeight: 900, textTransform: 'uppercase', color: '#d32f2f !important', fontSize: '10px' }}>Datum:</Typography>
                                <Typography variant="body1" fontWeight="800">{contract?.date || ''}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" display="block" sx={{ fontWeight: 900, textTransform: 'uppercase', color: '#d32f2f !important', fontSize: '10px' }}>Rechnungs-Nr:</Typography>
                                <Typography variant="body1" fontWeight="900">{contract?.invoiceNr || ''}</Typography>
                            </Box>
                        </Box>
                    </Box>

                    {/* General Info Fields */}
                    <Box sx={{ border: '1.5px solid #d32f2f', py: 1, px: 2, mb: 3, borderRadius: '6px', bgcolor: 'rgba(211, 47, 47, 0.01)' }}>
                        <Grid container>
                            <Grid size={{ xs: 6 }} sx={{ borderRight: '1px solid rgba(211, 47, 47, 0.1)', py: 0.5 }}>
                                <Typography variant="caption" sx={{ fontWeight: 900, color: '#d32f2f !important', display: 'block', fontSize: '9px', textAlign: 'center' }}>TERMIN</Typography>
                                <Typography variant="body2" fontWeight="800" sx={{ fontSize: '13px', textAlign: 'center' }}>{contract?.appointmentDate || '--'}</Typography>
                            </Grid>
                            <Grid size={{ xs: 6 }} sx={{ py: 0.5 }}>
                                <Typography variant="caption" sx={{ fontWeight: 900, color: '#d32f2f !important', display: 'block', fontSize: '9px', textAlign: 'center' }}>UHRZEIT</Typography>
                                <Typography variant="body2" fontWeight="800" sx={{ fontSize: '13px', textAlign: 'center' }}>{contract?.appointmentTime || '--'}</Typography>
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Divider sx={{ borderColor: 'rgba(211, 47, 47, 0.15)' }} />
                                <Box sx={{ py: 1, textAlign: 'center' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 900, color: '#d32f2f !important', display: 'block', fontSize: '9px' }}>GERÄTETYP / MODELL</Typography>
                                    <Typography variant="body1" fontWeight="900" sx={{ textTransform: 'uppercase', fontSize: '15px', letterSpacing: '0.5px' }}>{contract?.deviceType || ''}</Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Items Table */}
                    <TableContainer sx={{ border: '1.5px solid #000', mb: 3, borderRadius: '0px', overflow: 'hidden' }}>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: 'rgba(211, 47, 47, 0.05)' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: '900', py: 1, borderRight: '1px solid #ccc', color: '#d32f2f !important', fontSize: '11px' }}>POS</TableCell>
                                    <TableCell sx={{ fontWeight: '900', borderRight: '1px solid #ccc', color: '#d32f2f !important', fontSize: '11px' }}>ANZ.</TableCell>
                                    <TableCell sx={{ fontWeight: '900', borderRight: '1px solid #ccc', color: '#d32f2f !important', fontSize: '11px' }}>BESCHREIBUNG / ARTIKEL</TableCell>
                                    <TableCell sx={{ fontWeight: '900', borderRight: '1px solid #ccc', color: '#d32f2f !important', fontSize: '11px' }}>BRUTTO PREIS</TableCell>
                                    <TableCell sx={{ fontWeight: '900', color: '#d32f2f !important', fontSize: '11px' }}>GESAMT</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {(contract?.items || []).map((item, i) => (
                                    <TableRow key={i}>
                                        <TableCell sx={{ borderRight: '1px solid #ddd', fontSize: '12px', py: 0.8 }}>{i + 1}</TableCell>
                                        <TableCell sx={{ borderRight: '1px solid #ddd', fontSize: '12px' }}>{item.qty}</TableCell>
                                        <TableCell sx={{ borderRight: '1px solid #ddd', fontWeight: 700, py: 0.8, fontSize: '12px' }}>{item.description}</TableCell>
                                        <TableCell sx={{ borderRight: '1px solid #ddd', fontSize: '12px' }}>{Number(item.price).toFixed(2)} €</TableCell>
                                        <TableCell sx={{ fontWeight: 800, fontSize: '12px' }}>{(item.qty * item.price).toFixed(2)} €</TableCell>
                                    </TableRow>
                                ))}
                                {Array.from({ length: Math.max(0, 2 - (contract?.items?.length || 0)) }).map((_, i) => (
                                    <TableRow key={`empty-${i}`}>
                                        <TableCell sx={{ borderRight: '1px solid #ddd', height: '30px' }}></TableCell>
                                        <TableCell sx={{ borderRight: '1px solid #ddd' }}></TableCell>
                                        <TableCell sx={{ borderRight: '1px solid #ddd' }}></TableCell>
                                        <TableCell sx={{ borderRight: '1px solid #ddd' }}></TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Calculations and Payment */}
                    <Grid container spacing={2} sx={{ mb: 3, alignItems: 'stretch' }}>
                        <Grid size={{ xs: 8 }}>
                            <Box sx={{ p: 1.5, height: '100%', border: '2.5px solid #000', borderRadius: '4px', display: 'flex', flexDirection: 'column', justifyContent: 'center', bgcolor: '#fff' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                    <Typography variant="h6" fontWeight="900" sx={{ color: '#d32f2f !important', fontSize: '1.1rem' }}>BRUTTO ENDBETRAG:</Typography>
                                    <Typography variant="h5" fontWeight="900" sx={{ color: '#000 !important', whiteSpace: 'nowrap' }}>{Number(contract?.totalAmount || 0).toFixed(2)} €</Typography>
                                </Box>
                                <Divider sx={{ my: 0.5, borderColor: '#000', borderBottomWidth: 1 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                    <Typography sx={{ fontWeight: 800, fontSize: '12px' }}>inkl. 19% MwSt.:</Typography>
                                    <Typography sx={{ fontWeight: 800, fontSize: '12px' }}>{Number(contract?.vatAmount || 0).toFixed(2)} €</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                    <Typography sx={{ fontWeight: 800, fontSize: '12px' }}>NETTO SUMME:</Typography>
                                    <Typography sx={{ fontWeight: 800, fontSize: '12px' }}>{Number(contract?.sum || 0).toFixed(2)} €</Typography>
                                </Box>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 4 }}>
                            <Box sx={{ border: '1px solid #000', p: 1, borderRadius: '4px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <Typography variant="caption" fontWeight="950" sx={{ mb: 1, display: 'block', textDecoration: 'underline', textAlign: 'center', color: '#d32f2f !important', fontSize: '10px' }}>ZAHLUNGSWEISE</Typography>
                                {['Bar', 'Überweisung', 'Kartenzahlung'].map(method => (
                                    <Box key={method} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                        <Checkbox checked={contract.paymentMethod === method} size="small" sx={{ p: 0.1, color: '#d32f2f' }} />
                                        <Typography variant="caption" sx={{ fontWeight: contract.paymentMethod === method ? 900 : 500, fontSize: '11px' }}>
                                            {method === 'Bar' ? 'Bar / Cash' : method}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Grid>
                    </Grid>

                    {/* Important Notes */}
                    <Box sx={{ mb: 3, p: 2, border: '1px solid #000', borderRadius: '4px', bgcolor: 'rgba(0,0,0,0.02)' }}>
                        <Typography variant="caption" sx={{ fontWeight: 900, color: '#d32f2f !important', display: 'block', mb: 1, fontSize: '10px' }}>WICHTIGE HINWEISE:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '11px', lineHeight: 1.4 }}>
                            1) DIE ZAHLUNG MUSS INNERHALB VON 7 TAGEN NACH ERSTELLUNG DIESER RECHNUNG ERFOLGEN. (THE PAYMENT HAS TO BE MADE WITHIN 7 DAYS OF GENERATION OF THIS INVOICE.)<br />
                            2) BEI ÜBERWEISUNGEN (BANKTRANSFER ODER ONLINE-ZAHLUNGEN) GEBEN SIE BITTE UNBEDINGT DIE OBEN GENANNTE RECHNUNGSNUMMER ALS VERWENDUNGSZWECK AN. (IF TRANSFER IS BY ONLINE METHODS LIKE BANK TRANSFER OR ONLINE PAYMENTS; IT IS VERY IMPORTANT TO WRITE THE ABOVE INVOICE NUMBER FROM THE QUOTATION IN THE REFERENCE OF PAYMENT.)
                        </Typography>
                    </Box>

                    {/* Signature Block - Compressed */}
                    <Box sx={{ mt: 'auto', pt: 2 }}>
                        <Grid container spacing={10}>
                            <Grid size={{ xs: 6 }}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Box sx={{ height: '70px', mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '2px solid #000' }}>
                                        {contract.technicianSignature && <img src={contract.technicianSignature} style={{ maxHeight: '60px', maxWidth: '200px' }} />}
                                    </Box>
                                    <Typography variant="caption" fontWeight="800" sx={{ fontSize: '11px' }}>Datum, Unterschrift Techniker</Typography>
                                </Box>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Box sx={{ height: '70px', mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '2px solid #000' }}>
                                        {contract.customerSignature ? (
                                            <img src={contract.customerSignature} style={{ maxHeight: '60px', maxWidth: '200px' }} />
                                        ) : contract.signatureMethod === 'Paper' ? (
                                            <Typography variant="body2" fontWeight="800">UNTERZEICHNET AUF PAPIER</Typography>
                                        ) : null}
                                    </Box>
                                    <Typography variant="caption" fontWeight="800" sx={{ fontSize: '11px' }}>Unterschrift Kunde</Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Footer Information */}
                    <Box sx={{ mt: 2, textAlign: 'center', pt: 1.5, borderTop: '1px solid #eee' }}>
                        <Typography sx={{ fontSize: '8px', fontWeight: 'bold', mb: 0.2 }}>
                            Umsatzsteuer ID. DE36 820 90 11 500 TSW | vertreten durch Frau Ebru Karababa - Geschäftsführerin
                        </Typography>
                        <Typography sx={{ fontSize: '7px', opacity: 0.8 }}>
                            Bankverbindung: Postbank, IBAN: DE61 3707 0209 0044 100 00, BIC: DEUTDEDKP08, Ebru Karababa
                        </Typography>
                    </Box>
                </Box>
            </Paper>


        </Box>
    );
};

export default ContractDetail;
