import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#BF0010', // Deep Red
            dark: '#8C000B',
            light: '#E53935',
            contrastText: '#FFFFFF',
        },
        secondary: {
            main: '#1A1A1A', // Sleek Black
            light: '#424242',
            contrastText: '#FFFFFF',
        },
        error: {
            main: '#FC2B1A',
        },
        success: {
            main: '#2E7D32',
        },
        background: {
            default: '#F8FAFC', // Very light cool gray
            paper: '#FFFFFF',
        },
        text: {
            primary: '#1E293B',
            secondary: '#64748B',
        },
    },
    typography: {
        fontFamily: '"Outfit", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontSize: '2.5rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: '#1E293B',
        },
        h2: {
            fontSize: '1.75rem',
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: '#334155',
        },
        h3: {
            fontSize: '1.25rem',
            fontWeight: 600,
        },
        body1: {
            fontSize: '1rem',
            lineHeight: 1.6,
        },
        button: {
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 12,
        },
    },
    shape: {
        borderRadius: 16,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 10,
                    padding: '10px 24px',
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: '0 4px 12px rgba(191, 0, 16, 0.2)',
                    },
                },
                containedPrimary: {
                    background: 'linear-gradient(135deg, #FC2B1A 0%, #BF0010 100%)',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                    border: '1px solid rgba(0,0,0,0.05)',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 12,
                        backgroundColor: '#FFFFFF',
                        '&:hover fieldset': {
                            borderColor: '#BF0010',
                        },
                    },
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                head: {
                    fontWeight: 700,
                    backgroundColor: '#F1F5F9',
                    color: '#475569',
                },
            }
        }
    },
});

export default theme;
