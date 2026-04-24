import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

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
        // STUB: Bypass backend for testing
        setTimeout(() => {
            persist({ id: 1, name: 'Test User', email }, 'fake-jwt-token-123');
            setLoading(false);
        }, 500);
        return { success: true };
    }, [persist]);

    // ── Register ───────────────────────────────────────────────────────────────
    const register = useCallback(async (name, email, password) => {
        setLoading(true);
        // STUB: Bypass backend for testing
        setTimeout(() => {
            persist({ id: 1, name, email }, 'fake-jwt-token-123');
            setLoading(false);
        }, 500);
        return { success: true };
    }, [persist]);

    // ── Google OAuth ───────────────────────────────────────────────────────────
    const loginWithGoogle = useCallback(() => {
        window.location.href = 'http://localhost:3000/api/auth/google';
    }, []);

    // ── Handle OAuth callback (called from OAuthCallback page) ─────────────────
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
