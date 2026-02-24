import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import {
    AppBar, Toolbar, Typography, Box, Button, Container, IconButton, Avatar,
    Tooltip, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Paper
} from '@mui/material';
import { LogOut, Home, FilePlus, Users, LayoutDashboard, ChevronRight } from 'lucide-react';

const Layout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user'));

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        window.location.reload();
    };

    const navItems = [
        { text: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
        { text: 'Neuer Vertrag', icon: <FilePlus size={20} />, path: '/contracts/new' },
    ];

    if (user?.role === 'Admin') {
        navItems.push({ text: 'Benutzer', icon: <Users size={20} />, path: '/users' });
    }

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            {/* Sidebar - Desktop */}
            <Box sx={{
                width: 280,
                flexShrink: 0,
                display: { xs: 'none', lg: 'block' },
                borderRight: '1px solid rgba(0,0,0,0.06)',
                bgcolor: 'white',
                p: 3
            }}>
                <Box sx={{ mb: 6, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                        width: 40, height: 40, bgcolor: 'primary.main', borderRadius: '10px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Typography color="white" variant="h6" fontWeight="900">GW</Typography>
                    </Box>
                    <Typography variant="h6" fontWeight="800" sx={{ color: 'secondary.main' }}>Gerätewelt</Typography>
                </Box>

                <List sx={{ px: 0 }}>
                    {navItems.map((item) => (
                        <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                            <ListItemButton
                                component={Link}
                                to={item.path}
                                selected={location.pathname === item.path}
                                sx={{
                                    borderRadius: '12px',
                                    py: 1.5,
                                    '&.Mui-selected': {
                                        bgcolor: 'primary.main',
                                        color: 'white',
                                        '&:hover': { bgcolor: 'primary.dark' },
                                        '& .MuiListItemIcon-root': { color: 'white' }
                                    },
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40, color: location.pathname === item.path ? 'white' : 'text.secondary' }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: 600 }} />
                                {location.pathname === item.path && <ChevronRight size={16} />}
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>

                <Box sx={{ mt: 'auto', position: 'absolute', bottom: 30, width: 220 }}>
                    <Paper sx={{ p: 2, bgcolor: '#F1F5F9', boxShadow: 'none', mb: 2, borderRadius: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32, fontSize: '0.8rem' }}>
                                {user?.name?.charAt(0)}
                            </Avatar>
                            <Box>
                                <Typography variant="body2" fontWeight="700">{user?.name}</Typography>
                                <Typography variant="caption" color="text.secondary">{user?.role}</Typography>
                            </Box>
                        </Box>
                    </Paper>
                    <Button
                        fullWidth
                        variant="outlined"
                        color="error"
                        onClick={handleLogout}
                        startIcon={<LogOut size={18} />}
                        sx={{ borderRadius: 3 }}
                    >
                        Abmelden
                    </Button>
                </Box>
            </Box>

            {/* Main Content Area */}
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Mobile Header */}
                <AppBar position="static" elevation={0} sx={{
                    display: { lg: 'none' },
                    bgcolor: 'white',
                    borderBottom: '1px solid rgba(0,0,0,0.06)'
                }} className="no-print">
                    <Toolbar>
                        <Typography variant="h6" fontWeight="800" color="primary">GW</Typography>
                        <Box sx={{ flexGrow: 1 }} />
                        <IconButton onClick={handleLogout} color="error"><LogOut size={20} /></IconButton>
                    </Toolbar>
                </AppBar>

                <Container component="main" maxWidth="xl" sx={{ mt: { xs: 2, lg: 6 }, mb: 4, px: { lg: 6 } }}>
                    <Outlet />
                </Container>
            </Box>
        </Box>
    );
};

export default Layout;
