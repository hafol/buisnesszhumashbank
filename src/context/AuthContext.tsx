import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, paymentsApi } from '../services/api';

interface User {
    id: string;
    email: string;
    name: string;
    business_type: 'IP' | 'TOO';
    iin: string;
    company?: string;
    city?: string;
    role: 'developer' | 'paid' | 'free';
    subscription_status: string;
    subscription_end_date?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isPremium: boolean;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: object) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('bzb_token'));
    const [loading, setLoading] = useState(true);

    const computeIsPremium = (u: User | null): boolean => {
        if (!u) return false;
        if (u.role === 'developer') return true;
        if (u.role === 'paid' && u.subscription_status === 'active') {
            if (!u.subscription_end_date) return true;
            return new Date(u.subscription_end_date) > new Date();
        }
        return false;
    };

    const isPremium = computeIsPremium(user);

    useEffect(() => {
        const initAuth = async () => {
            const savedToken = localStorage.getItem('bzb_token');
            if (savedToken) {
                try {
                    const userData = await authApi.me();
                    setUser(userData);
                    setToken(savedToken);
                } catch {
                    localStorage.removeItem('bzb_token');
                    setToken(null);
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const login = async (email: string, password: string) => {
        const { token: t, user: u } = await authApi.login({ email, password });
        localStorage.setItem('bzb_token', t);
        setToken(t);
        setUser(u);
    };

    const register = async (data: object) => {
        const { token: t, user: u } = await authApi.register(data);
        localStorage.setItem('bzb_token', t);
        setToken(t);
        setUser(u);
    };

    const logout = () => {
        localStorage.removeItem('bzb_token');
        setToken(null);
        setUser(null);
    };

    const refreshUser = async () => {
        try {
            const userData = await authApi.me();
            setUser(userData);
        } catch { }
    };

    return (
        <AuthContext.Provider value={{ user, token, isPremium, loading, login, register, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
