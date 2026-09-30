'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

interface User { id: string; name: string; email: string; role: string; }
interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            authApi.me().then(res => { setUser(res.data.user); setLoading(false); })
                .catch(() => { localStorage.clear(); setLoading(false); });
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email: string, password: string) => {
        const res = await authApi.login(email, password);
        localStorage.setItem('accessToken', res.data.accessToken);
        localStorage.setItem('refreshToken', res.data.refreshToken);
        setUser(res.data.user);
        router.push('/');
    };

    const logout = () => {
        localStorage.clear();
        setUser(null);
        router.push('/login');
    };

    return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};
