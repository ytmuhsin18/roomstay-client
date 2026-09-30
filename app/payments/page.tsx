'use client';
import { useEffect, useState, useCallback } from 'react';
import { paymentsApi, bookingsApi } from '@/lib/api';
import { DocumentArrowDownIcon, CreditCardIcon, PlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const METHOD_ICONS: Record<string, string> = { cash: '💵', upi: '📱', card: '💳', bank_transfer: '🏦' };
const METHOD_COLORS: Record<string, string> = { cash: 'badge-green', upi: 'badge-blue', card: 'badge-yellow', bank_transfer: 'badge-gray' };

export default function PaymentsPage() {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [bookings, setBookings] = useState<any[]>([]);
    const [form, setForm] = useState({ booking_id: '', method: 'cash', amount: '', transaction_ref: '', upi_id: '', notes: '' });
    const [saving, setSaving] = useState(false);
    const [methodFilter, setMethodFilter] = useState('');

    const fetchPayments = useCallback(async () => {
        setLoading(true);
        try {
            const res = await paymentsApi.list();
            setPayments(res.data.payments);
        } catch { toast.error('Failed to load payments'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchPayments(); }, [fetchPayments]);

    const openModal = async () => {
        try {
            const res = await bookingsApi.list({ status: 'confirmed' });
            const ci = await bookingsApi.list({ status: 'checked_in' });
            setBookings([...res.data.bookings, ...ci.data.bookings]);
        } catch { }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await paymentsApi.record({ ...form, amount: parseFloat(form.amount) });
            toast.success('Payment recorded!');
            setShowModal(false);
            setForm({ booking_id: '', method: 'cash', amount: '', transaction_ref: '', upi_id: '', notes: '' });
            fetchPayments();
        } catch (err: any) { toast.error(err.response?.data?.error || 'Failed to record payment'); }
        finally { setSaving(false); }
    };

    const filtered = methodFilter ? payments.filter(p => p.method === methodFilter) : payments;
    const totalRevenue = filtered.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Payments</h1>
                    <p className="text-slate-400 text-sm mt-0.5">{filtered.length} transactions · <span className="text-emerald-400">₹{totalRevenue.toLocaleString('en-IN')}</span> total</p>
                </div>
                <button onClick={openModal} className="btn-primary flex items-center gap-2">
                    <PlusIcon className="w-4 h-4" /> Record Payment
                </button>
            </div>

            {/* Method Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['cash', 'upi', 'card', 'bank_transfer'].map(method => {
                    const methodPayments = payments.filter(p => p.method === method);
                    const total = methodPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
                    return (
                        <button key={method} onClick={() => setMethodFilter(methodFilter === method ? '' : method)}
                            className={`card p-4 text-left hover:border-slate-700 transition-all ${methodFilter === method ? 'border-blue-500 bg-blue-500/5' : ''}`}>
                            <p className="text-2xl mb-1">{METHOD_ICONS[method]}</p>
                            <p className="text-slate-400 text-xs capitalize font-medium">{method.replace('_', ' ')}</p>
                            <p className="text-white font-bold text-lg">₹{(total / 1000).toFixed(1)}K</p>
                            <p className="text-slate-500 text-xs">{methodPayments.length} transactions</p>
                        </button>
                    );
                })}
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2">
                <button onClick={() => setMethodFilter('')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!methodFilter ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>All</button>
                {['cash', 'upi', 'card', 'bank_transfer'].map(m => (
                    <button key={m} onClick={() => setMethodFilter(methodFilter === m ? '' : m)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${methodFilter === m ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                        {METHOD_ICONS[m]} {m.replace('_', ' ')}
                    </button>
                ))}
            </div>

            {/* Payments Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-800/50">
                            <tr>
                                {['Date', 'Booking', 'Customer', 'Room', 'Method', 'Ref', 'Amount', 'Invoice'].map(h => (
                                    <th key={h} className="table-header">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(5)].map((_, i) => <tr key={i}><td colSpan={8} className="table-cell"><div className="h-4 bg-slate-800 rounded animate-pulse" /></td></tr>)
                            ) : filtered.map(p => (
                                <tr key={p.id} className="table-row">
                                    <td className="table-cell text-slate-400 text-xs">{new Date(p.paid_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                    <td className="table-cell"><span className="font-mono text-blue-400">{p.booking_ref}</span></td>
                                    <td className="table-cell text-white">{p.customer_name}</td>
                                    <td className="table-cell">{p.room_number}</td>
                                    <td className="table-cell">
                                        <span className={`${METHOD_COLORS[p.method] || 'badge-gray'} capitalize`}>{METHOD_ICONS[p.method]} {p.method.replace('_', ' ')}</span>
                                    </td>
                                    <td className="table-cell text-slate-400 text-xs font-mono">{p.transaction_ref || p.upi_id || '—'}</td>
                                    <td className="table-cell font-bold text-emerald-400">₹{parseFloat(p.amount).toLocaleString('en-IN')}</td>
                                    <td className="table-cell">
                                        <a href={paymentsApi.invoiceUrl(p.booking_id)} target="_blank" rel="noreferrer"
                                            className="p-1.5 rounded text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors inline-block">
                                            <DocumentArrowDownIcon className="w-4 h-4" />
                                        </a>
                                    </td>
                                </tr>
                            ))}
                            {!loading && filtered.length === 0 && (
                                <tr><td colSpan={8} className="table-cell text-center text-slate-500 py-12">No payments found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Record Payment Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="card w-full max-w-md">
                        <div className="flex items-center justify-between p-5 border-b border-slate-800">
                            <h2 className="text-white font-semibold">Record Payment</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="label">Booking *</label>
                                <select className="input-field" value={form.booking_id} onChange={e => setForm(f => ({ ...f, booking_id: e.target.value }))} required>
                                    <option value="">-- Select booking --</option>
                                    {bookings.map(b => (
                                        <option key={b.id} value={b.id}>{b.booking_ref} - {b.customer_name} (Room {b.room_number})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Method *</label>
                                    <select className="input-field" value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}>
                                        {['cash', 'upi', 'card', 'bank_transfer'].map(m => <option key={m}>{m}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Amount (₹) *</label>
                                    <input type="number" step="0.01" min="1" className="input-field" value={form.amount}
                                        onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
                                </div>
                            </div>
                            {form.method === 'upi' && (
                                <div><label className="label">UPI ID</label><input className="input-field" value={form.upi_id} onChange={e => setForm(f => ({ ...f, upi_id: e.target.value }))} placeholder="name@bank" /></div>
                            )}
                            <div><label className="label">Transaction Reference</label><input className="input-field" value={form.transaction_ref} onChange={e => setForm(f => ({ ...f, transaction_ref: e.target.value }))} /></div>
                            <div><label className="label">Notes</label><textarea className="input-field resize-y min-h-[60px]" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Recording...' : 'Record Payment'}</button>
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
