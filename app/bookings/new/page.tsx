'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { bookingsApi, roomsApi, customersApi } from '@/lib/api';
import { PlusIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const defaultCustomerForm = { name: '', email: '', phone: '', address: '', id_type: 'aadhar', id_number: '' };

export default function NewBookingPage() {
    const router = useRouter();
    const [rooms, setRooms] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<any>(null);
    const [form, setForm] = useState({ room_id: '', customer_id: '', check_in: '', check_out: '', adults: 1, children: 0, notes: '', special_requests: '' });
    const [newCustomer, setNewCustomer] = useState({ ...defaultCustomerForm });
    const [showNewCustomer, setShowNewCustomer] = useState(false);
    const [saving, setSaving] = useState(false);
    const [estimatedTotal, setEstimatedTotal] = useState<number | null>(null);

    useEffect(() => {
        Promise.all([
            roomsApi.list({ status: 'available' }),
            customersApi.list(),
        ]).then(([r, c]) => { setRooms(r.data.rooms); setCustomers(c.data.customers); });
    }, []);

    useEffect(() => {
        const room = rooms.find(r => r.id === form.room_id);
        setSelectedRoom(room || null);
        if (room && form.check_in && form.check_out) {
            const start = new Date(form.check_in);
            const end = new Date(form.check_out);
            let total = 0;
            const curr = new Date(start);
            while (curr < end) {
                const d = curr.getDay();
                total += (d === 0 || d === 6) ? parseFloat(room.weekend_price) : parseFloat(room.weekday_price);
                curr.setDate(curr.getDate() + 1);
            }
            setEstimatedTotal(total > 0 ? total : null);
        } else {
            setEstimatedTotal(null);
        }
    }, [form.room_id, form.check_in, form.check_out, rooms]);

    const handleAddCustomer = async () => {
        if (!newCustomer.name || !newCustomer.phone) { toast.error('Name and phone required'); return; }
        try {
            const res = await customersApi.create(newCustomer);
            const c = res.data.customer;
            setCustomers(prev => [c, ...prev]);
            setForm(f => ({ ...f, customer_id: c.id }));
            setShowNewCustomer(false);
            setNewCustomer({ ...defaultCustomerForm });
            toast.success('Customer added!');
        } catch { toast.error('Failed to add customer'); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.room_id || !form.customer_id || !form.check_in || !form.check_out) {
            toast.error('Please fill all required fields'); return;
        }
        setSaving(true);
        try {
            const res = await bookingsApi.create(form);
            toast.success(`Booking ${res.data.booking.booking_ref} created!`);
            router.push('/bookings');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to create booking');
        } finally { setSaving(false); }
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">New Booking</h1>
                <p className="text-slate-400 text-sm mt-0.5">Create a manual booking entry</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Room Selection */}
                <div className="card p-5 space-y-4">
                    <h3 className="text-white font-medium">Room Details</h3>
                    <div>
                        <label className="label">Select Room *</label>
                        <select className="input-field" value={form.room_id} onChange={e => setForm(f => ({ ...f, room_id: e.target.value }))} required>
                            <option value="">-- Choose a room --</option>
                            {rooms.map(r => (
                                <option key={r.id} value={r.id}>
                                    Room {r.room_number} - {r.room_type} ({r.bed_type}) · ₹{parseFloat(r.weekday_price).toLocaleString('en-IN')}/wkday
                                </option>
                            ))}
                        </select>
                        {selectedRoom && (
                            <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-slate-300 grid grid-cols-2 gap-2">
                                <span>Type: <strong className="text-white">{selectedRoom.room_type}</strong></span>
                                <span>Bed: <strong className="text-white">{selectedRoom.bed_type}</strong></span>
                                <span>Max Guests: <strong className="text-white">{selectedRoom.max_guests}</strong></span>
                                <span>Floor: <strong className="text-white">{selectedRoom.floor}</strong></span>
                                <span>Weekday: <strong className="text-white">₹{parseFloat(selectedRoom.weekday_price).toLocaleString('en-IN')}</strong></span>
                                <span>Weekend: <strong className="text-white">₹{parseFloat(selectedRoom.weekend_price).toLocaleString('en-IN')}</strong></span>
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Check-in Date *</label>
                            <input type="date" min={today} className="input-field" value={form.check_in}
                                onChange={e => setForm(f => ({ ...f, check_in: e.target.value, check_out: f.check_out < e.target.value ? '' : f.check_out }))} required />
                        </div>
                        <div>
                            <label className="label">Check-out Date *</label>
                            <input type="date" min={form.check_in || today} className="input-field" value={form.check_out}
                                onChange={e => setForm(f => ({ ...f, check_out: e.target.value }))} required />
                        </div>
                        <div>
                            <label className="label">Adults</label>
                            <input type="number" min="1" max={selectedRoom?.max_guests || 20} className="input-field"
                                value={form.adults} onChange={e => setForm(f => ({ ...f, adults: parseInt(e.target.value) }))} />
                        </div>
                        <div>
                            <label className="label">Children</label>
                            <input type="number" min="0" className="input-field"
                                value={form.children} onChange={e => setForm(f => ({ ...f, children: parseInt(e.target.value) }))} />
                        </div>
                    </div>
                    {estimatedTotal !== null && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-between">
                            <span className="text-sm text-slate-300">Estimated Total</span>
                            <span className="text-emerald-400 font-bold text-lg">₹{estimatedTotal.toLocaleString('en-IN')}</span>
                        </div>
                    )}
                </div>

                {/* Customer Selection */}
                <div className="card p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-white font-medium">Guest Information</h3>
                        <button type="button" onClick={() => setShowNewCustomer(!showNewCustomer)}
                            className="btn-secondary flex items-center gap-2 text-sm">
                            <UserPlusIcon className="w-4 h-4" /> New Customer
                        </button>
                    </div>

                    {showNewCustomer && (
                        <div className="p-4 bg-slate-800/50 rounded-lg space-y-3">
                            <p className="text-sm text-white font-medium">Quick Add Customer</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="label">Name *</label><input className="input-field" value={newCustomer.name} onChange={e => setNewCustomer(n => ({ ...n, name: e.target.value }))} /></div>
                                <div><label className="label">Phone *</label><input className="input-field" value={newCustomer.phone} onChange={e => setNewCustomer(n => ({ ...n, phone: e.target.value }))} /></div>
                                <div><label className="label">Email</label><input type="email" className="input-field" value={newCustomer.email} onChange={e => setNewCustomer(n => ({ ...n, email: e.target.value }))} /></div>
                                <div><label className="label">ID Type</label>
                                    <select className="input-field" value={newCustomer.id_type} onChange={e => setNewCustomer(n => ({ ...n, id_type: e.target.value }))}>
                                        {['aadhar', 'passport', 'driving_license', 'voter_id'].map(t => <option key={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div><label className="label">ID Number</label><input className="input-field" value={newCustomer.id_number} onChange={e => setNewCustomer(n => ({ ...n, id_number: e.target.value }))} /></div>
                                <div><label className="label">Address</label><input className="input-field" value={newCustomer.address} onChange={e => setNewCustomer(n => ({ ...n, address: e.target.value }))} /></div>
                            </div>
                            <button type="button" onClick={handleAddCustomer} className="btn-primary text-sm">Add Customer</button>
                        </div>
                    )}

                    <div>
                        <label className="label">Select Customer *</label>
                        <select className="input-field" value={form.customer_id} onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))} required>
                            <option value="">-- Select customer --</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>{c.name} · {c.phone}{c.email ? ` · ${c.email}` : ''}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Notes */}
                <div className="card p-5 space-y-4">
                    <h3 className="text-white font-medium">Additional Details</h3>
                    <div>
                        <label className="label">Internal Notes</label>
                        <textarea className="input-field min-h-[80px] resize-y" value={form.notes}
                            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Internal notes for staff..." />
                    </div>
                    <div>
                        <label className="label">Special Requests</label>
                        <textarea className="input-field min-h-[80px] resize-y" value={form.special_requests}
                            onChange={e => setForm(f => ({ ...f, special_requests: e.target.value }))} placeholder="Guest's special requests..." />
                    </div>
                </div>

                <div className="flex gap-3">
                    <button type="submit" disabled={saving} className="btn-primary flex-1 py-3 text-base">
                        {saving ? 'Creating Booking...' : 'Create Booking'}
                    </button>
                    <button type="button" onClick={() => router.push('/bookings')} className="btn-secondary flex-1 py-3">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
