'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import AuthGuard from './AuthGuard';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLogin = pathname === '/login';
    const [mobileOpen, setMobileOpen] = useState(false);

    if (isLogin) {
        return <>{children}</>;
    }

    return (
        <AuthGuard>
            <div className="flex h-screen overflow-hidden bg-slate-950 transition-colors duration-200 main-app-container">
                <Sidebar
                    mobileOpen={mobileOpen}
                    onMobileClose={() => setMobileOpen(false)}
                />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header
                        onMobileToggle={() => setMobileOpen(!mobileOpen)}
                    />
                    <main className="flex-1 overflow-y-auto p-4 md:p-6 main-content-area transition-colors duration-200">
                        {children}
                    </main>
                </div>
            </div>
        </AuthGuard>
    );
}
