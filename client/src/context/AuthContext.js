import React, { createContext, useState, useContext, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import jwtDecode from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for existing token
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                if (decoded.exp * 1000 > Date.now()) {
                    setUser(decoded);
                } else {
                    localStorage.removeItem('token');
                }
            } catch (error) {
                localStorage.removeItem('token');
            }
        }
        setLoading(false);
    }, []);

    const login = useGoogleLogin({
        onSuccess: async (response) => {
            try {
                const { data } = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/google`, {
                    token: response.access_token
                });

                localStorage.setItem('token', data.token);
                const decoded = jwtDecode(data.token);
                setUser(decoded);
            } catch (error) {
                console.error('Login error:', error);
                throw error;
            }
        },
        onError: () => {
            console.error('Login Failed');
        }
    });

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
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
            return true;
        } catch (error) {
            console.error('Phone verification error:', error);
            throw error;
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, updatePhoneNumber }}>
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