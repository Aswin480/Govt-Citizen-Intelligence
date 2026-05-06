import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

interface AuthContextType {
    isAuthenticated: boolean;
    user: any | null;
    role: string | null;
    login: (token: string, role: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initialize synchronously to avoid "flashing" logout state on refresh
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!localStorage.getItem('token'));
    const [role, setRole] = useState<string | null>(() => localStorage.getItem('role'));
    // Basic user restoration to allow immediate rendering while fetchMe runs
    const [user, setUser] = useState<any | null>(() => {
        const u = localStorage.getItem('username');
        return u ? { name: u, role: localStorage.getItem('role') } : null;
    });

    useEffect(() => {
        // We still run this to sync invalid states if needed, but primary state is already set
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        const username = localStorage.getItem('username');

        if (token) {
            setIsAuthenticated(true);
            setRole(role);
            setUser({ name: username || "User", role: role || "citizen" });
        }
    }, []);

    const login = (token: string, role: string) => {
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
        setIsAuthenticated(true);
        setRole(role);
        // We will fetch user details in the components or here if we want global access
        // For now, let's at least set the role correctly so routing works
        setUser({ name: "User", role: role });
    };

    const fetchMe = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const userData = await api.auth.getMe(token);
                setUser(userData);
                setRole(userData.role);
                localStorage.setItem('username', userData.username);
            } catch (e: any) {
                console.error("Failed to fetch user, session may be invalid:", e);
                // If 401, definitely logout. For others, maybe safer to logout to reset state.
                if (e.response && e.response.status === 401) {
                    logout();
                }
            }
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchMe();
        }
    }, [isAuthenticated]);

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        setIsAuthenticated(false);
        setUser(null);
        setRole(null);
        // FORCE RELOAD to clear any memory/context artifacts
        // Appending a timestamp forces the browser to treat this as a NEW page load,
        // bypassing cache and React Router soft-navigation completely.
        window.location.href = `/login?refresh=${Date.now()}`;
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, role, login, logout }}>
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
