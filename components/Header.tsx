'use client';
import { useEffect, useState } from 'react';
import {
    BellIcon, ArrowRightOnRectangleIcon, Bars3Icon, SunIcon, MoonIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { notificationsApi } from '@/lib/api';
import Link from 'next/link';

interface HeaderProps {
    title?: string;
    onMobileToggle?: () => void;
}

export default function Header({ title, onMobileToggle }: HeaderProps) {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [unread, setUnread] = useState(0);

    useEffect(() => {
        notificationsApi.list({ unread_only: true })
            .then(res => setUnread(res.data.unread_count))
            .catch(() => { });
    }, []);

    return (
        <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-3">
                {/* Mobile Hamburger Menu button */}
                <button
                    onClick={onMobileToggle}
                    className="md:hidden text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
                    aria-label="Open sidebar menu"
                >
                    <Bars3Icon className="w-6 h-6" />
                </button>

                {title && <h1 className="text-white font-semibold text-lg">{title}</h1>}
            </div>

            <div className="flex items-center gap-2 md:gap-3">
                {/* Light / Dark Mode Toggle Button */}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                    title={theme === 'dark' ? 'Switch to Bright Mode' : 'Switch to Dark Mode'}
                >
                    {theme === 'dark' ? (
                        <>
                            <SunIcon className="w-5 h-5 text-amber-400" />
                            <span className="text-xs font-medium text-amber-300 hidden sm:inline">Bright</span>
                        </>
                    ) : (
                        <>
                            <MoonIcon className="w-5 h-5 text-indigo-500" />
                            <span className="text-xs font-medium text-slate-700 hidden sm:inline">Dark</span>
                        </>
                    )}
                </button>

                {/* Notifications Icon */}
                <Link href="/notifications" className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                    <BellIcon className="w-5 h-5" />
                    {unread > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                            {unread > 9 ? '9+' : unread}
                        </span>
                    )}
                </Link>

                {/* User Profile & Logout */}
                <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-3 border-l border-slate-700">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">{user?.name[0]}</span>
                    </div>
                    <span className="text-slate-300 text-sm font-medium hidden lg:block">{user?.name}</span>
                    <button onClick={logout} className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors" title="Logout">
                        <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </header>
    );
}
