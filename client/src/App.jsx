import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ContractForm from './pages/ContractForm';
import ContractDetail from './pages/ContractDetail';
import UserManagement from './pages/UserManagement';
import Layout from './components/Layout';
import RemoteSign from './pages/RemoteSign';

const App = () => {
    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/sign/:id" element={<RemoteSign />} />

                <Route path="/" element={<ProtectedRoute />}>
                    <Route index element={<Dashboard />} />
                    <Route path="contracts/new" element={<ContractForm />} />
                    <Route path="contracts/:id" element={<ContractDetail />} />
                    <Route path="users" element={<AdminRoute />} />
                </Route>

                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    );
};

// Helper components for reactive auth
const ProtectedRoute = () => {
    const isAuthenticated = !!localStorage.getItem('token');
    return isAuthenticated ? <Layout /> : <Navigate to="/login" />;
};

const AdminRoute = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.role === 'Admin' ? <UserManagement /> : <Navigate to="/" />;
};

export default App;
