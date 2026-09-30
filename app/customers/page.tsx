'use client';
import { useEffect, useState, useCallback } from 'react';
import { customersApi } from '@/lib/api';
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Link from 'next/link';

const defaultForm = { name: '', email: '', phone: '', address: '', id_type: 'aadhar', id_number: '' };

export default function CustomersPage() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<any>(null);
    const [form, setForm] = useState({ ...defaultForm });
    const [saving, setSaving] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [customerDetail, setCustomerDetail] = useState<{ customer: any, bookings: any[] } | null>(null);

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await customersApi.list(search ? { search } : {});
            setCustomers(res.data.customers);
        } catch { toast.error('Failed to load customers'); }
        finally { setLoading(false); }
    }, [search]);

    useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

    const openCreate = () => { setEditingCustomer(null); setForm({ ...defaultForm }); setShowModal(true); };
    const openEdit = (c: any) => { setEditingCustomer(c); setForm({ name: c.name, email: c.email || '', phone: c.phone, address: c.address || '', id_type: c.id_type || 'aadhar', id_number: c.id_number || '' }); setShowModal(true); };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingCustomer) { await customersApi.update(editingCustomer.id, form); toast.success('Customer updated!'); }
            else { await customersApi.create(form); toast.success('Customer added!'); }
            setShowModal(false);
            fetchCustomers();
        } catch (err: any) { toast.error(err.response?.data?.error || 'Failed to save'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this customer? This will not delete their bookings.')) return;
        try { await customersApi.delete(id); toast.success('Customer deleted'); fetchCustomers(); }
        catch { toast.error('Failed to delete customer'); }
    };

    const viewCustomer = async (c: any) => {
        setSelectedCustomer(c);
        try {
            const res = await customersApi.get(c.id);
            setCustomerDetail({ customer: res.data.customer, bookings: res.data.bookings });
        } catch { toast.error('Failed to load customer details'); }
    };

    const STATUS_COLORS: Record<string, string> = { confirmed: 'badge-blue', checked_in: 'badge-green', checked_out: 'badge-gray', cancelled: 'badge-red' };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Customers</h1>
                    <p className="text-slate-400 text-sm mt-0.5">{customers.length} customers total</p>
                </div>
                <button onClick={openCreate} className="btn-primary flex items-center gap-2">
                    <PlusIcon className="w-4 h-4" /> Add Customer
                </button>
            </div>

            {/* Search */}
            <div className="relative w-80">
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, email..."
                    className="input-field pl-9" />
            </div>

            <div className="flex gap-5">
                {/* Customer List */}
                <div className="card overflow-hidden flex-1">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-800/50">
                                <tr>
                                    {['Customer', 'Contact', 'Bookings', 'Total Spent', 'Last Stay', 'Actions'].map(h => (
                                        <th key={h} className="table-header">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    [...Array(5)].map((_, i) => <tr key={i}><td colSpan={6} className="table-cell"><div className="h-4 bg-slate-800 rounded animate-pulse" /></td></tr>)
                                ) : customers.map(c => (
                                    <tr key={c.id} className={`table-row cursor-pointer ${selectedCustomer?.id === c.id ? 'bg-blue-500/10' : ''}`}
                                        onClick={() => viewCustomer(c)}>
                                        <td className="table-cell">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-white text-xs font-bold">{c.name[0]}</span>
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium text-sm">{c.name}</p>
                                                    {c.id_type && <p className="text-xs text-slate-500 capitalize">{c.id_type}: {c.id_number}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="table-cell">
                                            <p className="text-sm">{c.phone}</p>
                                            {c.email && <p className="text-xs text-slate-500">{c.email}</p>}
                                        </td>
                                        <td className="table-cell text-center">
                                            <span className="font-medium text-white">{c.total_bookings}</span>
                                        </td>
                                        <td className="table-cell font-medium">₹{parseFloat(c.total_spent || 0).toLocaleString('en-IN')}</td>
                                        <td className="table-cell text-slate-400 text-xs">
                                            {c.last_checkin ? new Date(c.last_checkin).toLocaleDateString('en-IN') : '—'}
                                        </td>
                                        <td className="table-cell" onClick={e => e.stopPropagation()}>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => openEdit(c)} className="p-1.5 rounded text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors">
                                                    <PencilIcon className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors">
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!loading && customers.length === 0 && (
                                    <tr><td colSpan={6} className="table-cell text-center text-slate-500 py-12">No customers found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Customer Detail Panel */}
                {selectedCustomer && customerDetail && (
                    <div className="card w-80 flex-shrink-0 overflow-y-auto max-h-[70vh]">
                        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                            <h3 className="text-white font-semibold">Profile</h3>
                            <button onClick={() => { setSelectedCustomer(null); setCustomerDetail(null); }} className="text-slate-400 hover:text-white text-lg">✕</button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center mx-auto mb-3">
                                    <span className="text-white text-2xl font-bold">{customerDetail.customer.name[0]}</span>
                                </div>
                                <p className="text-white font-bold">{customerDetail.customer.name}</p>
                                <p className="text-slate-400 text-sm">{customerDetail.customer.phone}</p>
                            </div>
                            <div className="space-y-2 text-sm">
                                {customerDetail.customer.email && <div className="flex items-center gap-2 text-slate-400"><EnvelopeIcon className="w-4 h-4" />{customerDetail.customer.email}</div>}
                                {customerDetail.customer.address && <div className="text-slate-400 text-xs">{customerDetail.customer.address}</div>}
                                {customerDetail.customer.id_type && <div className="text-xs text-slate-500 capitalize">{customerDetail.customer.id_type}: {customerDetail.customer.id_number}</div>}
                            </div>
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                                <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                                    <p className="text-xl font-bold text-white">{customerDetail.bookings.length}</p>
                                    <p className="text-xs text-slate-400">Bookings</p>
                                </div>
                                <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                                    <p className="text-xl font-bold text-emerald-400">₹{(customerDetail.bookings.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0) / 1000).toFixed(1)}K</p>
                                    <p className="text-xs text-slate-400">Spent</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Booking History</p>
                                {customerDetail.bookings.slice(0, 5).map(b => (
                                    <Link key={b.id} href={`/bookings/${b.id}`} className="block p-2.5 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-mono text-blue-400 text-xs">{b.booking_ref}</span>
                                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${b.status === 'confirmed' ? 'bg-blue-500/15 text-blue-400' :
                                                    b.status === 'checked_in' ? 'bg-green-500/15 text-green-400' :
                                                        b.status === 'cancelled' ? 'bg-red-500/15 text-red-400' : 'bg-slate-500/15 text-slate-400'
                                                }`}>{b.status.replace('_', ' ')}</span>
                                        </div>
                                        <p className="text-slate-300 text-xs">Room {b.room_number} · {new Date(b.check_in).toLocaleDateString('en-IN')}</p>
                                        <p className="text-emerald-400 text-xs font-medium">₹{parseFloat(b.total_amount).toLocaleString('en-IN')}</p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="card w-full max-w-lg">
                        <div className="flex items-center justify-between p-5 border-b border-slate-800">
                            <h2 className="text-white font-semibold">{editingCustomer ? 'Edit Customer' : 'Add Customer'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>
                        <form onSubmit={handleSave} className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2"><label className="label">Full Name *</label><input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
                                <div><label className="label">Phone *</label><input className="input-field" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required /></div>
                                <div><label className="label">Email</label><input type="email" className="input-field" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
                                <div><label className="label">ID Type</label>
                                    <select className="input-field" value={form.id_type} onChange={e => setForm(f => ({ ...f, id_type: e.target.value }))}>
                                        {['aadhar', 'passport', 'driving_license', 'voter_id', 'pan'].map(t => <option key={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div><label className="label">ID Number</label><input className="input-field" value={form.id_number} onChange={e => setForm(f => ({ ...f, id_number: e.target.value }))} /></div>
                                <div className="col-span-2"><label className="label">Address</label><textarea className="input-field resize-y min-h-[70px]" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : editingCustomer ? 'Update' : 'Add Customer'}</button>
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
