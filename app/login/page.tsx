'use client';
import { useState } from 'react';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState('admin@roomsadmin.com');
    const [password, setPassword] = useState('password');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            toast.success('Welcome back!');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-600/10 to-indigo-600/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-600/10 to-purple-600/5 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-2xl shadow-blue-500/30 mb-4">
                        <BuildingOfficeIcon className="w-9 h-9 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">RoomAdmin</h1>
                    <p className="text-slate-400 mt-1 text-sm">Room Management System</p>
                </div>

                {/* Card */}
                <div className="card p-8 shadow-2xl">
                    <h2 className="text-xl font-semibold text-white mb-1">Sign in</h2>
                    <p className="text-slate-400 text-sm mb-6">Enter your admin credentials to continue</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="label">Email Address</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                className="input-field" placeholder="admin@roomsadmin.com" required />
                        </div>
                        <div>
                            <label className="label">Password</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                                className="input-field" placeholder="••••••••" required />
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-2">
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Signing in...
                                </span>
                            ) : 'Sign In'}
                        </button>
                    </form>

                    {/* Demo hint */}
                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <p className="text-blue-400 text-xs font-medium">Demo credentials pre-filled:</p>
                        <p className="text-slate-400 text-xs mt-0.5">admin@roomsadmin.com / password</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
