'use client';
import { useEffect, useState } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { bookingsApi, paymentsApi } from '@/lib/api';
import { ArrowLeftIcon, CreditCardIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
    confirmed: 'badge-blue', checked_in: 'badge-green', checked_out: 'badge-gray', cancelled: 'badge-red'
};
const PAYMENT_COLORS: Record<string, string> = { paid: 'badge-green', partial: 'badge-yellow', pending: 'badge-red' };

const defaultPaymentForm = { method: 'cash', amount: '', transaction_ref: '', upi_id: '', notes: '' };

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [booking, setBooking] = useState<any>(null);
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [paymentForm, setPaymentForm] = useState({ ...defaultPaymentForm });
    const [showPayment, setShowPayment] = useState(false);
    const [savingPayment, setSavingPayment] = useState(false);

    const fetch = async () => {
        try {
            const res = await bookingsApi.get(id);
            setBooking(res.data.booking);
            setPayments(res.data.payments);
            setPaymentForm(f => ({ ...f, amount: (parseFloat(res.data.booking.total_amount) - parseFloat(res.data.booking.paid_amount || 0)).toString() }));
        } catch { toast.error('Booking not found'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetch(); }, [id]);

    const handleAction = async (action: 'checkIn' | 'checkOut' | 'cancel') => {
        if (action === 'cancel' && !confirm('Cancel this booking?')) return;
        try {
            await bookingsApi[action](id);
            toast.success('Action successful!');
            fetch();
        } catch (err: any) { toast.error(err.response?.data?.error || 'Action failed'); }
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingPayment(true);
        try {
            await paymentsApi.record({ booking_id: id, ...paymentForm, amount: parseFloat(paymentForm.amount) });
            toast.success('Payment recorded!');
            setShowPayment(false);
            fetch();
        } catch (err: any) { toast.error(err.response?.data?.error || 'Payment failed'); }
        finally { setSavingPayment(false); }
    };

    if (loading) return <div className="flex justify-center items-center h-64"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
    if (!booking) return <div className="text-center text-slate-400 py-16">Booking not found</div>;

    const nights = Math.ceil((new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / 86400000);
    const balance = parseFloat(booking.total_amount) - parseFloat(booking.paid_amount || 0);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/bookings" className="btn-secondary p-2"><ArrowLeftIcon className="w-4 h-4" /></Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-white font-mono">{booking.booking_ref}</h1>
                        <span className={STATUS_COLORS[booking.status] || 'badge-gray'}>{booking.status.replace('_', ' ')}</span>
                        <span className={PAYMENT_COLORS[booking.payment_status] || 'badge-gray'}>{booking.payment_status}</span>
                    </div>
                    <p className="text-slate-400 text-sm mt-0.5">Created {new Date(booking.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
                {/* Actions */}
                <div className="flex gap-2">
                    {booking.status === 'confirmed' && <button onClick={() => handleAction('checkIn')} className="btn-success">Check In</button>}
                    {booking.status === 'checked_in' && <button onClick={() => handleAction('checkOut')} className="btn-primary">Check Out</button>}
                    {!['checked_out', 'cancelled'].includes(booking.status) && <button onClick={() => handleAction('cancel')} className="btn-danger">Cancel</button>}
                    <a href={paymentsApi.invoiceUrl(id)} target="_blank" rel="noreferrer" className="btn-secondary flex items-center gap-2">
                        <DocumentArrowDownIcon className="w-4 h-4" /> Invoice
                    </a>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Booking details */}
                <div className="card p-5 space-y-4">
                    <h3 className="text-white font-semibold">Booking Details</h3>
                    <div className="space-y-2 text-sm">
                        {[
                            ['Room', `${booking.room_number} - ${booking.room_type}`],
                            ['Bed Type', booking.bed_type],
                            ['Check-in', new Date(booking.check_in).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })],
                            ['Check-out', new Date(booking.check_out).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })],
                            ['Duration', `${nights} night${nights !== 1 ? 's' : ''}`],
                            ['Guests', `${booking.adults} adults, ${booking.children} children`],
                        ].map(([label, val]) => (
                            <div key={label} className="flex justify-between">
                                <span className="text-slate-400">{label}</span>
                                <span className="text-white font-medium">{val}</span>
                            </div>
                        ))}
                    </div>
                    {booking.notes && <div className="pt-3 border-t border-slate-800"><p className="text-xs text-slate-400 mb-1">Notes</p><p className="text-sm text-slate-300">{booking.notes}</p></div>}
                    {booking.special_requests && <div><p className="text-xs text-slate-400 mb-1">Special Requests</p><p className="text-sm text-slate-300">{booking.special_requests}</p></div>}
                </div>

                {/* Customer details */}
                <div className="card p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-white font-semibold">Guest Information</h3>
                        <Link href={`/customers/${booking.customer_id}`} className="text-blue-400 text-xs hover:text-blue-300">View Profile →</Link>
                    </div>
                    <div className="space-y-2 text-sm">
                        {[
                            ['Name', booking.customer_name],
                            ['Phone', booking.customer_phone],
                            ['Email', booking.customer_email || '—'],
                            ['Address', booking.customer_address || '—'],
                        ].map(([label, val]) => (
                            <div key={label} className="flex justify-between">
                                <span className="text-slate-400">{label}</span>
                                <span className="text-white">{val}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Payment summary */}
                <div className="card p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-white font-semibold">Payment Summary</h3>
                        {balance > 0 && (
                            <button onClick={() => setShowPayment(!showPayment)} className="btn-primary flex items-center gap-2 text-sm py-1.5">
                                <CreditCardIcon className="w-4 h-4" /> Record Payment
                            </button>
                        )}
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-slate-400">Total Amount</span><span className="text-white font-bold text-base">₹{parseFloat(booking.total_amount).toLocaleString('en-IN')}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Amount Paid</span><span className="text-emerald-400 font-medium">₹{parseFloat(booking.paid_amount || 0).toLocaleString('en-IN')}</span></div>
                        {balance > 0 && <div className="flex justify-between pt-2 border-t border-slate-800"><span className="text-red-400">Balance Due</span><span className="text-red-400 font-bold">₹{balance.toLocaleString('en-IN')}</span></div>}
                        {balance <= 0 && <div className="pt-2 border-t border-slate-800 text-center text-emerald-400 font-medium">✓ Fully Paid</div>}
                    </div>

                    {showPayment && (
                        <form onSubmit={handlePayment} className="pt-3 border-t border-slate-800 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="label">Method</label>
                                    <select className="input-field" value={paymentForm.method} onChange={e => setPaymentForm(f => ({ ...f, method: e.target.value }))}>
                                        {['cash', 'upi', 'card', 'bank_transfer'].map(m => <option key={m}>{m}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Amount (₹)</label>
                                    <input type="number" step="0.01" min="1" className="input-field" value={paymentForm.amount} onChange={e => setPaymentForm(f => ({ ...f, amount: e.target.value }))} required />
                                </div>
                                {paymentForm.method === 'upi' && <div className="col-span-2"><label className="label">UPI ID</label><input className="input-field" value={paymentForm.upi_id} onChange={e => setPaymentForm(f => ({ ...f, upi_id: e.target.value }))} /></div>}
                                <div className="col-span-2"><label className="label">Transaction Ref</label><input className="input-field" value={paymentForm.transaction_ref} onChange={e => setPaymentForm(f => ({ ...f, transaction_ref: e.target.value }))} /></div>
                            </div>
                            <button type="submit" disabled={savingPayment} className="btn-primary w-full">{savingPayment ? 'Recording...' : 'Record Payment'}</button>
                        </form>
                    )}
                </div>

                {/* Payment history */}
                <div className="card p-5">
                    <h3 className="text-white font-semibold mb-4">Payment History</h3>
                    {payments.length === 0 ? (
                        <p className="text-slate-500 text-sm text-center py-4">No payments recorded</p>
                    ) : (
                        <div className="space-y-2">
                            {payments.map(p => (
                                <div key={p.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                                    <div>
                                        <p className="text-sm text-white font-medium capitalize">{p.method}</p>
                                        <p className="text-xs text-slate-400">{new Date(p.paid_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}{p.transaction_ref ? ` · ${p.transaction_ref}` : ''}</p>
                                    </div>
                                    <span className="text-emerald-400 font-semibold">₹{parseFloat(p.amount).toLocaleString('en-IN')}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
