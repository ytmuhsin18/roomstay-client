'use client';
import { useEffect, useState, useCallback } from 'react';
import { bookingsApi, roomsApi, customersApi } from '@/lib/api';
import { PlusIcon, CalendarDaysIcon, TableCellsIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
    confirmed: 'badge-blue', checked_in: 'badge-green', checked_out: 'badge-gray', cancelled: 'badge-red'
};
const PAYMENT_COLORS: Record<string, string> = { paid: 'badge-green', partial: 'badge-yellow', pending: 'badge-red' };

export default function BookingsPage() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
    const [calendarData, setCalendarData] = useState<{ bookings: any[], rooms: any[], month: number, year: number } | null>(null);
    const [calMonth, setCalMonth] = useState(new Date().getMonth() + 1);
    const [calYear, setCalYear] = useState(new Date().getFullYear());

    const fetchBookings = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (statusFilter) params.status = statusFilter;
            const res = await bookingsApi.list(params);
            setBookings(res.data.bookings.filter((b: any) =>
                !search || b.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
                b.booking_ref?.toLowerCase().includes(search.toLowerCase()) ||
                b.room_number?.includes(search)
            ));
        } catch { toast.error('Failed to load bookings'); }
        finally { setLoading(false); }
    }, [statusFilter, search]);

    const fetchCalendar = useCallback(async () => {
        if (viewMode !== 'calendar') return;
        try {
            const res = await bookingsApi.calendar(calMonth, calYear);
            setCalendarData(res.data);
        } catch { toast.error('Failed to load calendar'); }
    }, [viewMode, calMonth, calYear]);

    useEffect(() => { fetchBookings(); }, [fetchBookings]);
    useEffect(() => { fetchCalendar(); }, [fetchCalendar]);

    const handleAction = async (action: 'checkIn' | 'checkOut' | 'cancel', id: string) => {
        const labels = { checkIn: 'Check in', checkOut: 'Check out', cancel: 'Cancel' };
        if (action === 'cancel' && !confirm('Cancel this booking?')) return;
        try {
            await bookingsApi[action](id);
            toast.success(`${labels[action]} successful!`);
            fetchBookings();
            if (viewMode === 'calendar') fetchCalendar();
        } catch (err: any) {
            toast.error(err.response?.data?.error || `${labels[action]} failed`);
        }
    };

    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const daysInMonth = new Date(calYear, calMonth, 0).getDate();
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-white">Bookings</h1>
                    <p className="text-slate-400 text-sm mt-0.5">{bookings.length} bookings shown</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex bg-slate-800 rounded-lg p-1">
                        <button onClick={() => setViewMode('table')} className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'} transition-colors`}>
                            <TableCellsIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => setViewMode('calendar')} className={`p-1.5 rounded ${viewMode === 'calendar' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'} transition-colors`}>
                            <CalendarDaysIcon className="w-4 h-4" />
                        </button>
                    </div>
                    <Link href="/bookings/new" className="btn-primary flex items-center gap-2">
                        <PlusIcon className="w-4 h-4" /> New Booking
                    </Link>
                </div>
            </div>

            {viewMode === 'table' && (
                <>
                    {/* Filters */}
                    <div className="flex flex-wrap gap-3">
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search booking, customer, room..."
                                className="input-field pl-9 w-64" />
                        </div>
                        {['', 'confirmed', 'checked_in', 'checked_out', 'cancelled'].map(s => (
                            <button key={s} onClick={() => setStatusFilter(s)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                                {s ? s.replace('_', '-') : 'All'}
                            </button>
                        ))}
                    </div>

                    {/* Table */}
                    <div className="card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-800/50">
                                    <tr>
                                        {['Booking Ref', 'Customer', 'Room', 'Check-in', 'Check-out', 'Nights', 'Amount', 'Payment', 'Status', 'Actions'].map(h => (
                                            <th key={h} className="table-header">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        [...Array(5)].map((_, i) => <tr key={i}><td colSpan={10} className="table-cell"><div className="h-4 bg-slate-800 rounded animate-pulse" /></td></tr>)
                                    ) : bookings.map(b => {
                                        const nights = Math.ceil((new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) / 86400000);
                                        return (
                                            <tr key={b.id} className="table-row">
                                                <td className="table-cell"><span className="font-mono text-blue-400">{b.booking_ref}</span></td>
                                                <td className="table-cell">
                                                    <p className="font-medium text-white">{b.customer_name}</p>
                                                    <p className="text-xs text-slate-500">{b.customer_phone}</p>
                                                </td>
                                                <td className="table-cell"><span className="font-medium">{b.room_number}</span><span className="text-slate-500 text-xs ml-1">({b.room_type})</span></td>
                                                <td className="table-cell">{new Date(b.check_in).toLocaleDateString('en-IN')}</td>
                                                <td className="table-cell">{new Date(b.check_out).toLocaleDateString('en-IN')}</td>
                                                <td className="table-cell text-center">{nights}</td>
                                                <td className="table-cell font-medium">₹{parseFloat(b.total_amount).toLocaleString('en-IN')}</td>
                                                <td className="table-cell"><span className={PAYMENT_COLORS[b.payment_status] || 'badge-gray'}>{b.payment_status}</span></td>
                                                <td className="table-cell"><span className={STATUS_COLORS[b.status] || 'badge-gray'}>{b.status.replace('_', ' ')}</span></td>
                                                <td className="table-cell">
                                                    <div className="flex items-center gap-1">
                                                        {b.status === 'confirmed' && (
                                                            <button onClick={() => handleAction('checkIn', b.id)} className="px-2 py-1 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white text-xs rounded transition-colors">
                                                                Check In
                                                            </button>
                                                        )}
                                                        {b.status === 'checked_in' && (
                                                            <button onClick={() => handleAction('checkOut', b.id)} className="px-2 py-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white text-xs rounded transition-colors">
                                                                Check Out
                                                            </button>
                                                        )}
                                                        {!['checked_out', 'cancelled'].includes(b.status) && (
                                                            <button onClick={() => handleAction('cancel', b.id)} className="px-2 py-1 bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white text-xs rounded transition-colors">
                                                                Cancel
                                                            </button>
                                                        )}
                                                        <Link href={`/bookings/${b.id}`} className="px-2 py-1 bg-slate-800 text-slate-400 hover:text-white text-xs rounded transition-colors">
                                                            View
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {!loading && bookings.length === 0 && (
                                        <tr><td colSpan={10} className="table-cell text-center text-slate-500 py-12">No bookings found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {viewMode === 'calendar' && (
                <div className="card overflow-hidden">
                    {/* Calendar header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                        <h3 className="text-white font-semibold">{MONTHS[calMonth - 1]} {calYear}</h3>
                        <div className="flex items-center gap-2">
                            <button onClick={() => { const d = new Date(calYear, calMonth - 2, 1); setCalMonth(d.getMonth() + 1); setCalYear(d.getFullYear()); }}
                                className="btn-secondary px-3 py-1 text-sm">← Prev</button>
                            <button onClick={() => { const d = new Date(calYear, calMonth, 1); setCalMonth(d.getMonth() + 1); setCalYear(d.getFullYear()); }}
                                className="btn-secondary px-3 py-1 text-sm">Next →</button>
                        </div>
                    </div>

                    {/* Timeline grid */}
                    {calendarData && (
                        <div className="overflow-x-auto">
                            <div style={{ minWidth: `${50 + daysInMonth * 36}px` }}>
                                {/* Day headers */}
                                <div className="flex border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
                                    <div className="w-32 flex-shrink-0 px-3 py-2 text-xs text-slate-400 font-medium">Room</div>
                                    {Array.from({ length: daysInMonth }, (_, i) => {
                                        const dateStr = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
                                        const isToday = dateStr === today;
                                        const d = new Date(calYear, calMonth - 1, i + 1).getDay();
                                        const isWeekend = d === 0 || d === 6;
                                        return (
                                            <div key={i} className={`w-9 flex-shrink-0 text-center text-xs py-2 ${isToday ? 'text-blue-400 font-bold bg-blue-500/10' : isWeekend ? 'text-amber-500' : 'text-slate-400'}`}>
                                                {i + 1}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Rooms rows */}
                                {calendarData.rooms.map(room => {
                                    const roomBookings = calendarData.bookings.filter(b => b.room_id === room.id);
                                    return (
                                        <div key={room.id} className="flex border-b border-slate-800/50 hover:bg-slate-800/20">
                                            <div className="w-32 flex-shrink-0 px-3 py-2.5 border-r border-slate-800">
                                                <p className="text-white text-xs font-medium">{room.room_number}</p>
                                                <p className="text-slate-500 text-xs">{room.room_type}</p>
                                            </div>
                                            <div className="flex relative flex-1 h-12">
                                                {Array.from({ length: daysInMonth }, (_, i) => {
                                                    const dateStr = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
                                                    const isToday = dateStr === today;
                                                    const d = new Date(calYear, calMonth - 1, i + 1).getDay();
                                                    const isWeekend = d === 0 || d === 6;
                                                    return (
                                                        <div key={i} className={`w-9 flex-shrink-0 h-full border-r border-slate-800/30 ${isToday ? 'bg-blue-500/5' : isWeekend ? 'bg-slate-800/30' : ''}`} />
                                                    );
                                                })}
                                                {/* Booking bars */}
                                                {roomBookings.map(b => {
                                                    const checkIn = new Date(b.check_in);
                                                    const checkOut = new Date(b.check_out);
                                                    const monthStart = new Date(calYear, calMonth - 1, 1);
                                                    const monthEnd = new Date(calYear, calMonth, 0);
                                                    const startDay = Math.max(0, Math.floor((checkIn.getTime() - monthStart.getTime()) / 86400000));
                                                    const endDay = Math.min(daysInMonth, Math.ceil((checkOut.getTime() - monthStart.getTime()) / 86400000));
                                                    const width = (endDay - startDay) * 36;
                                                    const left = startDay * 36;
                                                    if (width <= 0) return null;
                                                    const colors: Record<string, string> = { confirmed: 'bg-blue-500', checked_in: 'bg-emerald-500', checked_out: 'bg-slate-500', cancelled: 'bg-red-500/40' };
                                                    return (
                                                        <Link key={b.id} href={`/bookings/${b.id}`}
                                                            style={{ left, width, top: '8px', height: '28px' }}
                                                            title={`${b.booking_ref} - ${b.customer_name}`}
                                                            className={`absolute ${colors[b.status] || 'bg-slate-600'} rounded px-2 text-white text-xs flex items-center overflow-hidden cursor-pointer hover:brightness-110 transition-all z-10`}>
                                                            {b.customer_name.split(' ')[0]}
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Legend */}
                    <div className="flex gap-4 px-5 py-3 border-t border-slate-800">
                        {[['bg-blue-500', 'Confirmed'], ['bg-emerald-500', 'Checked In'], ['bg-slate-500', 'Checked Out'], ['bg-red-500/40', 'Cancelled']].map(([cls, label]) => (
                            <div key={label} className="flex items-center gap-1.5">
                                <div className={`w-3 h-3 rounded-sm ${cls}`} />
                                <span className="text-slate-400 text-xs">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
