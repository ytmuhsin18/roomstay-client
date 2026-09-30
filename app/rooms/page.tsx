'use client';
import { useEffect, useState, useCallback } from 'react';
import { roomsApi } from '@/lib/api';
import { PlusIcon, PencilIcon, TrashIcon, PhotoIcon, WifiIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Image from 'next/image';

const ROOM_TYPES = ['Standard', 'Deluxe', 'Suite', 'Executive', 'Studio', 'Villa'];
const BED_TYPES = ['Single', 'Double', 'Twin', 'Queen', 'King'];
const AMENITIES_LIST = ['WiFi', 'AC', 'TV', 'Bathroom', 'Minibar', 'Balcony', 'Kitchen', 'Jacuzzi', 'City View', 'Mountain View', 'Sea View', 'Living Room'];
const STATUS_COLORS: Record<string, string> = { available: 'badge-green', occupied: 'badge-blue', maintenance: 'badge-yellow' };

const defaultForm = { room_number: '', room_type: 'Standard', bed_type: 'Double', max_guests: 2, amenities: [] as string[], weekday_price: '', weekend_price: '', status: 'available', description: '', floor: 1 };

export default function RoomsPage() {
    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRoom, setEditingRoom] = useState<any>(null);
    const [form, setForm] = useState({ ...defaultForm });
    const [saving, setSaving] = useState(false);
    const [filterStatus, setFilterStatus] = useState('');
    const [photoRoom, setPhotoRoom] = useState<any>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    const fetchRooms = useCallback(async () => {
        setLoading(true);
        try {
            const res = await roomsApi.list(filterStatus ? { status: filterStatus } : {});
            setRooms(res.data.rooms);
        } catch { toast.error('Failed to load rooms'); }
        finally { setLoading(false); }
    }, [filterStatus]);

    useEffect(() => { fetchRooms(); }, [fetchRooms]);

    const openCreate = () => { setEditingRoom(null); setForm({ ...defaultForm }); setShowModal(true); };
    const openEdit = (room: any) => {
        setEditingRoom(room);
        setForm({ ...room, amenities: room.amenities || [] });
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingRoom) { await roomsApi.update(editingRoom.id, form); toast.success('Room updated!'); }
            else { await roomsApi.create(form); toast.success('Room created!'); }
            setShowModal(false);
            fetchRooms();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to save room');
        } finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this room?')) return;
        try { await roomsApi.delete(id); toast.success('Room deleted'); fetchRooms(); }
        catch { toast.error('Failed to delete room'); }
    };

    const toggleAmenity = (a: string) => {
        setForm(f => ({ ...f, amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a] }));
    };

    const handlePhotoUpload = async () => {
        if (!photoFile || !photoRoom) return;
        setUploadingPhoto(true);
        try {
            const fd = new FormData();
            fd.append('photos', photoFile);
            await roomsApi.uploadPhotos(photoRoom.id, fd);
            toast.success('Photo uploaded!');
            setPhotoFile(null);
            fetchRooms();
        } catch { toast.error('Photo upload failed'); }
        finally { setUploadingPhoto(false); }
    };

    const handleDeletePhoto = async (roomId: string, url: string) => {
        try { await roomsApi.deletePhoto(roomId, url); toast.success('Photo removed'); fetchRooms(); }
        catch { toast.error('Failed to remove photo'); }
    };

    const counts = { all: rooms.length, available: rooms.filter(r => r.status === 'available').length, occupied: rooms.filter(r => r.status === 'occupied').length, maintenance: rooms.filter(r => r.status === 'maintenance').length };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Rooms</h1>
                    <p className="text-slate-400 text-sm mt-0.5">{counts.all} rooms · {counts.available} available · {counts.occupied} occupied</p>
                </div>
                <button onClick={openCreate} className="btn-primary flex items-center gap-2">
                    <PlusIcon className="w-4 h-4" /> Add Room
                </button>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap">
                {[['', 'All', counts.all], ['available', 'Available', counts.available], ['occupied', 'Occupied', counts.occupied], ['maintenance', 'Maintenance', counts.maintenance]].map(([val, label, count]) => (
                    <button key={val} onClick={() => setFilterStatus(val as string)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === val ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                        {label} <span className="ml-1 opacity-60">({count})</span>
                    </button>
                ))}
            </div>

            {/* Rooms Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[...Array(6)].map((_, i) => <div key={i} className="card h-64 animate-pulse" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {rooms.map(room => (
                        <div key={room.id} className="card overflow-hidden group hover:border-slate-700 transition-all duration-200">
                            {/* Photo */}
                            <div className="h-44 bg-slate-800 relative overflow-hidden">
                                {room.photos?.length > 0 ? (
                                    <img
                                        src={room.photos[0].startsWith('http') ? room.photos[0] : `http://localhost:4000${room.photos[0]}`}
                                        alt={`Room ${room.room_number}`}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-100 dark:bg-slate-800">
                                        <PhotoIcon className="w-10 h-10 mb-1 opacity-70" />
                                        <span className="text-xs font-medium">No Photo</span>
                                    </div>
                                )}
                                <div className="absolute top-2 left-2">
                                    <span className={`badge ${STATUS_COLORS[room.status] || 'badge-gray'} capitalize font-semibold shadow-xs`}>
                                        {room.status}
                                    </span>
                                </div>
                                <div className="absolute top-2 right-2 flex gap-1">
                                    <button
                                        onClick={() => setPhotoRoom(room)}
                                        className="p-1.5 bg-slate-900/80 hover:bg-slate-900 backdrop-blur-xs rounded-lg text-white shadow-md transition-colors"
                                        title="Manage Photos"
                                    >
                                        <PhotoIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <p className="text-white font-bold text-lg">Room {room.room_number}</p>
                                        <p className="text-slate-400 text-xs">{room.room_type} · {room.bed_type} · {room.max_guests} guests · Floor {room.floor}</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-1 mb-3">
                                    {(room.amenities || []).slice(0, 4).map((a: string) => (
                                        <span key={a} className="text-xs bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">{a}</span>
                                    ))}
                                    {(room.amenities || []).length > 4 && <span className="text-xs text-slate-500">+{room.amenities.length - 4}</span>}
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-800 pt-3">
                                    <div>
                                        <p className="text-white font-semibold text-sm">₹{parseFloat(room.weekday_price).toLocaleString('en-IN')}<span className="text-slate-400 text-xs font-normal">/wk</span></p>
                                        <p className="text-slate-400 text-xs">₹{parseFloat(room.weekend_price).toLocaleString('en-IN')}/wknd</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => openEdit(room)} className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors">
                                            <PencilIcon className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(room.id)} className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b border-slate-800">
                            <h2 className="text-white font-semibold text-lg">{editingRoom ? 'Edit Room' : 'Add Room'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>
                        <form onSubmit={handleSave} className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Room Number *</label>
                                    <input className="input-field" value={form.room_number} onChange={e => setForm(f => ({ ...f, room_number: e.target.value }))} required />
                                </div>
                                <div>
                                    <label className="label">Floor</label>
                                    <input type="number" className="input-field" value={form.floor} onChange={e => setForm(f => ({ ...f, floor: parseInt(e.target.value) }))} />
                                </div>
                                <div>
                                    <label className="label">Room Type *</label>
                                    <select className="input-field" value={form.room_type} onChange={e => setForm(f => ({ ...f, room_type: e.target.value }))}>
                                        {ROOM_TYPES.map(t => <option key={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Bed Type *</label>
                                    <select className="input-field" value={form.bed_type} onChange={e => setForm(f => ({ ...f, bed_type: e.target.value }))}>
                                        {BED_TYPES.map(t => <option key={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Max Guests</label>
                                    <input type="number" min="1" max="20" className="input-field" value={form.max_guests} onChange={e => setForm(f => ({ ...f, max_guests: parseInt(e.target.value) }))} />
                                </div>
                                <div>
                                    <label className="label">Status</label>
                                    <select className="input-field" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                                        {['available', 'occupied', 'maintenance'].map(s => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Weekday Price (₹) *</label>
                                    <input type="number" min="0" step="0.01" className="input-field" value={form.weekday_price} onChange={e => setForm(f => ({ ...f, weekday_price: e.target.value }))} required />
                                </div>
                                <div>
                                    <label className="label">Weekend Price (₹) *</label>
                                    <input type="number" min="0" step="0.01" className="input-field" value={form.weekend_price} onChange={e => setForm(f => ({ ...f, weekend_price: e.target.value }))} required />
                                </div>
                            </div>
                            <div>
                                <label className="label">Description</label>
                                <textarea className="input-field min-h-[80px] resize-y" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                            </div>
                            <div>
                                <label className="label">Amenities</label>
                                <div className="flex flex-wrap gap-2">
                                    {AMENITIES_LIST.map(a => (
                                        <button type="button" key={a} onClick={() => toggleAmenity(a)}
                                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${form.amenities.includes(a) ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                                            {a}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" disabled={saving} className="btn-primary flex-1">
                                    {saving ? 'Saving...' : editingRoom ? 'Update Room' : 'Create Room'}
                                </button>
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Photo Manager Modal */}
            {photoRoom && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="card w-full max-w-lg">
                        <div className="flex items-center justify-between p-5 border-b border-slate-800">
                            <h2 className="text-white font-semibold">Photos - Room {photoRoom.room_number}</h2>
                            <button onClick={() => { setPhotoRoom(null); setPhotoFile(null); }} className="text-slate-400 hover:text-white">✕</button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-3 gap-2">
                                {(rooms.find(r => r.id === photoRoom.id)?.photos || []).map((url: string) => (
                                    <div key={url} className="relative aspect-square rounded-lg overflow-hidden group">
                                        <img src={`http://localhost:4000${url}`} alt="Room photo" className="w-full h-full object-cover" />
                                        <button onClick={() => handleDeletePhoto(photoRoom.id, url)}
                                            className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="border-2 border-dashed border-slate-700 rounded-lg p-4">
                                <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] || null)}
                                    className="w-full text-sm text-slate-400 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:text-xs file:cursor-pointer" />
                            </div>
                            <button onClick={handlePhotoUpload} disabled={!photoFile || uploadingPhoto} className="btn-primary w-full">
                                {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
