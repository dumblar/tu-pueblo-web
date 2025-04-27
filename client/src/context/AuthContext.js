import React, { createContext, useState, useContext, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import jwtDecode from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(null);
    const [showPhoneForm, setShowPhoneForm] = useState(false);
    const [userHasPhone, setUserHasPhone] = useState(false);

    useEffect(() => {
        // Check for existing token
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                if (decoded.exp * 1000 > Date.now()) {
                    setUser(decoded);
                    // Check if user has phone number
                    checkUserPhoneNumber(token);
                } else {
                    localStorage.removeItem('token');
                }
            } catch (error) {
                console.error('Token decode error:', error);
                localStorage.removeItem('token');
            }
        }
        setLoading(false);
    }, []);

    const checkUserPhoneNumber = async (token) => {
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/auth/user-info`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setUserHasPhone(!!response.data.phoneNumber);
        } catch (error) {
            console.error('Error checking user phone number:', error);
        }
    };

    const login = useGoogleLogin({
        onSuccess: async (response) => {
            try {
                setAuthError(null);
                const { data } = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/google`, {
                    token: response.access_token
                });

                if (data.token) {
                    localStorage.setItem('token', data.token);
                    try {
                        const decoded = jwtDecode(data.token);
                        setUser(decoded);
                        // Check if user has phone number
                        await checkUserPhoneNumber(data.token);
                        // Show phone form if user doesn't have a phone number
                        if (!userHasPhone) {
                            setShowPhoneForm(true);
                        }
                    } catch (decodeError) {
                        console.error('Token decode error:', decodeError);
                        setAuthError('Error al procesar el token de autenticación');
                        localStorage.removeItem('token');
                    }
                } else {
                    setAuthError('No se recibió un token válido del servidor');
                }
            } catch (error) {
                console.error('Login error:', error);
                setAuthError(error.response?.data?.message || 'Error al iniciar sesión');
            }
        },
        onError: (error) => {
            console.error('Google login error:', error);
            setAuthError('Error al iniciar sesión con Google');
        }
    });

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setAuthError(null);
        setUserHasPhone(false);
    };

    const updatePhoneNumber = async (phoneNumber) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${process.env.REACT_APP_API_URL}/api/auth/verify-phone`,
                { phoneNumber },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setUserHasPhone(true);
            return true;
        } catch (error) {
            console.error('Phone verification error:', error);
            throw error;
        }
    };

    const closePhoneForm = (success = false) => {
        setShowPhoneForm(false);
        if (success) {
            setUserHasPhone(true);
        }
    };

    const openPhoneForm = () => {
        setShowPhoneForm(true);
    };

    if (loading) {
        return <div>Cargando...</div>;
    }

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            updatePhoneNumber,
            authError,
            showPhoneForm,
            closePhoneForm,
            openPhoneForm,
            userHasPhone
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 