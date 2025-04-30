import React, { createContext, useContext, useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import { useNavigate, useLocation } from 'react-router-dom';

// Create context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(null);
    const [showPhoneForm, setShowPhoneForm] = useState(false);
    const [userHasPhone, setUserHasPhone] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // For debugging
    useEffect(() => {
        console.log('AuthContext - Current user:', currentUser);
        console.log('AuthContext - Current path:', location.pathname);
    }, [currentUser, location]);

    // Check if user is logged in on mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            // Fetch user data
            axios.get(`${process.env.REACT_APP_API_URL}/api/auth/user-info`)
                .then(response => {
                    setCurrentUser(response.data);
                })
                .catch(() => {
                    localStorage.removeItem('token');
                    delete axios.defaults.headers.common['Authorization'];
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, []);

    const checkUserPhoneNumber = async (token) => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/user-info`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = response.data;
            console.log('User info response:', data);

            // Check for phone_number property
            const hasPhone = !!data.phone_number;
            setUserHasPhone(hasPhone);

            // Make sure the currentUser has the phone_number property
            if (currentUser) {
                setCurrentUser({
                    ...currentUser,
                    phone_number: data.phone_number
                });
            } else {
                setCurrentUser(data);
            }

            return hasPhone;
        } catch (error) {
            console.error('Error checking phone number:', error);
            return false;
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
                    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

                    // Get full user data including admin status
                    const userResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/user-info`, {
                        headers: { Authorization: `Bearer ${data.token}` }
                    });
                    setCurrentUser(userResponse.data);

                    // Check if user has phone number
                    await checkUserPhoneNumber(data.token);

                    if (!userResponse.data.phone_number) {
                        // Show phone form if user doesn't have a phone number
                        setShowPhoneForm(true);
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
        delete axios.defaults.headers.common['Authorization'];
        setCurrentUser(null);
        setUserHasPhone(false);
        navigate('/');
    };

    const updatePhoneNumber = async (phoneNumber) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/auth/verify-phone`,
                { phoneNumber },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            console.log('Phone update response:', response.data);

            if (response.data.success) {
                // Get updated user data
                const userResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/user-info`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('Updated user data:', userResponse.data);

                // Make sure the phone_number property is set
                const updatedUser = {
                    ...userResponse.data,
                    phone_number: phoneNumber
                };

                setCurrentUser(updatedUser);
                setUserHasPhone(true);
                setShowPhoneForm(false);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error updating phone number:', error);
            return false;
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

    // Value object to be provided by the context
    const value = {
        currentUser,
        loading,
        authError,
        login,
        logout,
        updatePhoneNumber,
        showPhoneForm,
        closePhoneForm,
        openPhoneForm,
        userHasPhone
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext; 