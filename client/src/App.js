import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PhoneForm from './components/PhoneForm';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Reservation from './pages/Reservation';
import AdminDashboard from './pages/AdminDashboard';
import AdminRoutes from './pages/AdminRoutes';
import AdminReservations from './pages/AdminReservations';
import AdminUsers from './pages/AdminUsers';
import AdminSettings from './pages/AdminSettings';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <main style={{ flex: 1 }}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                <Route path="/my-bookings" element={<PrivateRoute><Reservation /></PrivateRoute>} />
                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/routes" element={<AdminRoute><AdminRoutes /></AdminRoute>} />
                <Route path="/admin/reservations" element={<AdminRoute><AdminReservations /></AdminRoute>} />
                <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
            <PhoneForm />
          </div>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
