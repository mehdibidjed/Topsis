import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { loginUser, registerUser, loginWithGoogleApi } from '../api/auth';
import { useGoogleLogin } from '@react-oauth/google';

const AuthContext = createContext(null);

const TOKEN_KEY = 'geotopsis_token';
const USER_KEY = 'geotopsis_user';

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
    });
    const [loading, setLoading] = useState(false);

    // ── Axios global auth header ───────────────────────────────────────────────
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]);

    // ── Persist helpers ────────────────────────────────────────────────────────
    const persist = useCallback((newUser, newToken) => {
        localStorage.setItem(TOKEN_KEY, newToken);
        localStorage.setItem(USER_KEY, JSON.stringify(newUser));
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        setToken(newToken);
        setUser(newUser);
    }, []);

    // ── Login ──────────────────────────────────────────────────────────────────
    const login = useCallback(async (email, password) => {
        setLoading(true);
        try {
            const data = await loginUser(email, password);
            if (data.success) {
                persist(data.user, data.token);
                setLoading(false);
                return { success: true };
            }
            setLoading(false);
            return { success: false, message: data.message || 'Login failed' };
        } catch (error) {
            setLoading(false);
            return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
    }, [persist]);

    // ── Register ───────────────────────────────────────────────────────────────
    const register = useCallback(async (name, email, password) => {
        setLoading(true);
        try {
            const data = await registerUser(name, email, password);
            if (data.success) {
                persist(data.user, data.token);
                setLoading(false);
                return { success: true };
            }
            setLoading(false);
            return { success: false, message: data.message || 'Registration failed' };
        } catch (error) {
            setLoading(false);
            return { success: false, message: error.response?.data?.message || 'Registration failed' };
        }
    }, [persist]);

    // ── Google OAuth ───────────────────────────────────────────────────────────
    const loginWithGoogle = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setLoading(true);
            try {
                // By default implicit flow gives access_token
                const data = await loginWithGoogleApi(tokenResponse.access_token);
                if (data.success) {
                    persist(data.user, data.token);
                }
            } catch (error) {
                console.error("Google Auth backend error:", error);
            } finally {
                setLoading(false);
            }
        },
        onError: () => {
            console.error('Login Failed');
            setLoading(false);
        }
    });

    // ── Handle OAuth callback (called from OAuthCallback page strictly for dev purposes only if redirect existed) ─────────────────
    const handleOAuthCallback = useCallback((incomingToken, incomingUser) => {
        persist(incomingUser, incomingToken);
    }, [persist]);

    // ── Logout ─────────────────────────────────────────────────────────────────
    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        delete axios.defaults.headers.common['Authorization'];
        setToken(null);
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            token,
            loading,
            isAuthenticated: !!token && !!user,
            login,
            register,
            loginWithGoogle,
            handleOAuthCallback,
            logout,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
