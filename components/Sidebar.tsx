'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
    HomeIcon, BuildingOfficeIcon, CalendarDaysIcon, UsersIcon,
    CreditCardIcon, ChartBarIcon, BellIcon, ChevronLeftIcon, ChevronRightIcon,
    GlobeAltIcon, TagIcon, ClipboardDocumentListIcon, UserGroupIcon, XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
    { href: '/', label: 'Dashboard', icon: HomeIcon },
    { href: '/rooms', label: 'Rooms', icon: BuildingOfficeIcon },
    { href: '/bookings', label: 'Bookings', icon: CalendarDaysIcon },
    { href: '/customers', label: 'Customers', icon: UsersIcon },
    { href: '/payments', label: 'Payments', icon: CreditCardIcon },
    { href: '/channels', label: 'Channel Manager', icon: GlobeAltIcon },
    { href: '/pricing', label: 'Dynamic Pricing', icon: TagIcon },
    { href: '/reports', label: 'Reports', icon: ChartBarIcon },
    { href: '/notifications', label: 'Notifications', icon: BellIcon },
    { href: '/audit', label: 'Audit Logs', icon: ClipboardDocumentListIcon },
    { href: '/users', label: 'User Roles', icon: UserGroupIcon },
];

interface SidebarProps {
    mobileOpen?: boolean;
    onMobileClose?: () => void;
}

export default function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();
    const { user } = useAuth();

    return (
        <>
            {/* Mobile Backdrop Overlay */}
            {mobileOpen && (
                <div
                    onClick={onMobileClose}
                    className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
                />
            )}

            {/* Sidebar Element */}
            <aside
                className={`h-screen sticky top-0 flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 z-40
          ${mobileOpen ? 'fixed left-0 top-0 w-64 translate-x-0' : 'hidden md:flex'}
          ${collapsed && !mobileOpen ? 'md:w-16' : 'md:w-64'}
        `}
            >
                {/* Logo & Mobile Close */}
                <div className="flex items-center justify-between px-4 h-16 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                            <BuildingOfficeIcon className="w-5 h-5 text-white" />
                        </div>
                        {(!collapsed || mobileOpen) && (
                            <div className="overflow-hidden">
                                <p className="text-white font-bold text-sm leading-tight">RoomAdmin</p>
                                <p className="text-slate-400 text-xs">Management Panel</p>
                            </div>
                        )}
                    </div>

                    {/* Close button on mobile */}
                    <button
                        onClick={onMobileClose}
                        className="md:hidden text-slate-400 hover:text-white p-1"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
                    {navItems.map(({ href, label, icon: Icon }) => {
                        const active = pathname === href || (href !== '/' && pathname.startsWith(href));
                        return (
                            <Link
                                key={href}
                                href={href}
                                onClick={onMobileClose}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group
                  ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                            >
                                <Icon className="w-5 h-5 flex-shrink-0" />
                                {(!collapsed || mobileOpen) && <span className="text-sm font-medium truncate">{label}</span>}
                                {collapsed && !mobileOpen && (
                                    <div className="absolute left-16 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 ml-1">
                                        {label}
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User */}
                {(!collapsed || mobileOpen) && user && (
                    <div className="px-4 py-3 border-t border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-xs font-bold">{user.name[0]}</span>
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-white text-xs font-medium truncate">{user.name}</p>
                                <p className="text-slate-400 text-xs truncate capitalize">{user.role}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Collapse button on Desktop */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="hidden md:flex items-center justify-center h-10 border-t border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                    {collapsed ? <ChevronRightIcon className="w-4 h-4" /> : <ChevronLeftIcon className="w-4 h-4" />}
                </button>
            </aside>
        </>
    );
}
