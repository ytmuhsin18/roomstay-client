'use client';
import { useEffect, useState, useCallback } from 'react';
import { usersApi } from '@/lib/api';
import { UserGroupIcon, UserPlusIcon, TrashIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'front_desk';
    created_at: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const [nameInput, setNameInput] = useState('');
    const [emailInput, setEmailInput] = useState('');
    const [passwordInput, setPasswordInput] = useState('');
    const [roleInput, setRoleInput] = useState<'admin' | 'manager' | 'front_desk'>('front_desk');

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const res = await usersApi.list();
            setUsers(res.data.users || []);
        } catch {
            toast.error('Failed to load user accounts (Requires Admin role)');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await usersApi.create({
                name: nameInput,
                email: emailInput,
                password: passwordInput,
                role: roleInput,
            });
            toast.success('User account created');
            setShowModal(false);
            setNameInput('');
            setEmailInput('');
            setPasswordInput('');
            fetchUsers();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to create user');
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user account?')) return;
        try {
            await usersApi.delete(id);
            toast.success('User deleted');
            fetchUsers();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to delete user');
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin': return 'badge-red';
            case 'manager': return 'badge-blue';
            case 'front_desk': return 'badge-green';
            default: return 'badge-gray';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <UserGroupIcon className="w-7 h-7 text-blue-400" />
                        User Roles & Staff Management
                    </h1>
                    <p className="text-slate-400 text-sm">
                        Manage multi-user access control with roles (Admin, Manager, Front Desk) and permissions.
                    </p>
                </div>

                <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
                    <UserPlusIcon className="w-4 h-4" />
                    Add Staff Account
                </button>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    [1, 2, 3].map((i) => <div key={i} className="card p-5 h-36 animate-pulse bg-slate-800/40" />)
                ) : (
                    users.map((u) => (
                        <div key={u.id} className="card p-5 flex flex-col justify-between hover:border-slate-700 transition-all">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow">
                                        {u.name[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white">{u.name}</h3>
                                        <p className="text-xs text-slate-400">{u.email}</p>
                                    </div>
                                </div>

                                <span className={`badge capitalize ${getRoleBadge(u.role)}`}>
                                    {u.role.replace('_', ' ')}
                                </span>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                                <span>Created {new Date(u.created_at).toLocaleDateString()}</span>
                                <button
                                    onClick={() => handleDeleteUser(u.id)}
                                    className="text-slate-400 hover:text-red-400 transition-colors p-1"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add User Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="card max-w-md w-full p-6 space-y-4">
                        <h3 className="text-xl font-bold text-white">Create Staff Account</h3>

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="label">Full Name</label>
                                <input
                                    type="text"
                                    value={nameInput}
                                    onChange={(e) => setNameInput(e.target.value)}
                                    placeholder="e.g. Anish Sharma"
                                    className="input-field"
                                    required
                                />
                            </div>

                            <div>
                                <label className="label">Email Address</label>
                                <input
                                    type="email"
                                    value={emailInput}
                                    onChange={(e) => setEmailInput(e.target.value)}
                                    placeholder="e.g. anish@roomsadmin.com"
                                    className="input-field"
                                    required
                                />
                            </div>

                            <div>
                                <label className="label">Password</label>
                                <input
                                    type="password"
                                    value={passwordInput}
                                    onChange={(e) => setPasswordInput(e.target.value)}
                                    placeholder="Minimum 6 characters"
                                    className="input-field"
                                    required
                                />
                            </div>

                            <div>
                                <label className="label">Assigned Role</label>
                                <select
                                    value={roleInput}
                                    onChange={(e: any) => setRoleInput(e.target.value)}
                                    className="input-field"
                                >
                                    <option value="front_desk">Front Desk (Bookings & Check-ins)</option>
                                    <option value="manager">Hotel Manager (Pricing & Channels)</option>
                                    <option value="admin">Admin (Full System Control)</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Create Account
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
