'use client';
import { useEffect, useState, useCallback } from 'react';
import { notificationsApi, bookingsApi } from '@/lib/api';
import { BellIcon, CheckIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const TYPE_COLORS: Record<string, string> = {
    booking_confirmed: 'bg-blue-500', checkin_reminder: 'bg-amber-500', checkout_reminder: 'bg-orange-500',
    checkin_done: 'bg-emerald-500', checkout_done: 'bg-slate-500', payment_received: 'bg-green-500',
    cancellation: 'bg-red-500', reminder: 'bg-purple-500'
};
const TYPE_ICONS: Record<string, string> = {
    booking_confirmed: '📋', checkin_reminder: '⏰', checkout_reminder: '🚪',
    checkin_done: '✅', checkout_done: '🏠', payment_received: '💰',
    cancellation: '❌', reminder: '🔔'
};

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showReminder, setShowReminder] = useState(false);
    const [bookings, setBookings] = useState<any[]>([]);
    const [reminderForm, setReminderForm] = useState({ booking_id: '', type: 'checkin_reminder', message: '' });
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const res = await notificationsApi.list(filter === 'unread' ? { unread_only: true } : {});
            setNotifications(res.data.notifications);
            setUnreadCount(res.data.unread_count);
        } catch { toast.error('Failed to load notifications'); }
        finally { setLoading(false); }
    }, [filter]);

    useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

    const markRead = async (id: string) => {
        try { await notificationsApi.markRead(id); fetchNotifications(); }
        catch { toast.error('Failed to mark as read'); }
    };

    const markAllRead = async () => {
        try { await notificationsApi.markAllRead(); toast.success('All marked as read'); fetchNotifications(); }
        catch { toast.error('Failed'); }
    };

    const deleteNotif = async (id: string) => {
        try { await notificationsApi.delete(id); fetchNotifications(); }
        catch { toast.error('Failed to delete'); }
    };

    const openReminder = async () => {
        try {
            const res = await bookingsApi.list({ status: 'confirmed' });
            const ci = await bookingsApi.list({ status: 'checked_in' });
            setBookings([...res.data.bookings, ...ci.data.bookings]);
        } catch { }
        setShowReminder(true);
    };

    const sendReminder = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await notificationsApi.sendReminder(reminderForm);
            toast.success('Reminder sent!');
            setShowReminder(false);
            fetchNotifications();
        } catch { toast.error('Failed to send reminder'); }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Notifications</h1>
                    <p className="text-slate-400 text-sm mt-0.5">{unreadCount} unread</p>
                </div>
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <button onClick={markAllRead} className="btn-secondary flex items-center gap-2 text-sm">
                            <CheckIcon className="w-4 h-4" /> Mark all read
                        </button>
                    )}
                    <button onClick={openReminder} className="btn-primary flex items-center gap-2 text-sm">
                        <BellIcon className="w-4 h-4" /> Send Reminder
                    </button>
                </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2">
                {[['all', 'All'], ['unread', 'Unread']].map(([val, label]) => (
                    <button key={val} onClick={() => setFilter(val as any)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${filter === val ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                        {label} {val === 'unread' && unreadCount > 0 && <span className="bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{unreadCount}</span>}
                    </button>
                ))}
            </div>

            {/* Notifications List */}
            <div className="space-y-2">
                {loading ? (
                    [...Array(5)].map((_, i) => <div key={i} className="card h-16 animate-pulse" />)
                ) : notifications.length === 0 ? (
                    <div className="card p-16 text-center">
                        <BellIcon className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-400">No notifications</p>
                    </div>
                ) : (
                    notifications.map(n => (
                        <div key={n.id} className={`card p-4 flex items-start gap-4 transition-all ${!n.is_read ? 'border-slate-700 bg-slate-900' : 'opacity-70'}`}>
                            {/* Icon */}
                            <div className={`w-10 h-10 rounded-full ${TYPE_COLORS[n.type] || 'bg-slate-500'} flex items-center justify-center flex-shrink-0 text-lg`}>
                                {TYPE_ICONS[n.type] || '🔔'}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <p className="text-white text-sm font-medium">{n.title}</p>
                                    {!n.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                                    {n.booking_ref && <span className="font-mono text-blue-400 text-xs">{n.booking_ref}</span>}
                                </div>
                                <p className="text-slate-400 text-xs">{n.message}</p>
                                <p className="text-slate-600 text-xs mt-1">{new Date(n.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                                {!n.is_read && (
                                    <button onClick={() => markRead(n.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors" title="Mark as read">
                                        <CheckIcon className="w-4 h-4" />
                                    </button>
                                )}
                                <button onClick={() => deleteNotif(n.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Send Reminder Modal */}
            {showReminder && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="card w-full max-w-md">
                        <div className="flex items-center justify-between p-5 border-b border-slate-800">
                            <h2 className="text-white font-semibold">Send Reminder</h2>
                            <button onClick={() => setShowReminder(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>
                        <form onSubmit={sendReminder} className="p-5 space-y-4">
                            <div>
                                <label className="label">Booking *</label>
                                <select className="input-field" value={reminderForm.booking_id} onChange={e => setReminderForm(f => ({ ...f, booking_id: e.target.value }))} required>
                                    <option value="">-- Select booking --</option>
                                    {bookings.map(b => <option key={b.id} value={b.id}>{b.booking_ref} - {b.customer_name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="label">Reminder Type</label>
                                <select className="input-field" value={reminderForm.type} onChange={e => setReminderForm(f => ({ ...f, type: e.target.value }))}>
                                    {['checkin_reminder', 'checkout_reminder', 'payment_reminder', 'reminder'].map(t => (
                                        <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="label">Message</label>
                                <textarea className="input-field min-h-[80px] resize-y" value={reminderForm.message}
                                    onChange={e => setReminderForm(f => ({ ...f, message: e.target.value }))} placeholder="Reminder message..." />
                            </div>
                            <div className="flex gap-3">
                                <button type="submit" className="btn-primary flex-1">Send Reminder</button>
                                <button type="button" onClick={() => setShowReminder(false)} className="btn-secondary flex-1">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
