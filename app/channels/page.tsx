'use client';
import { useEffect, useState, useCallback } from 'react';
import { channelsApi } from '@/lib/api';
import {
    GlobeAltIcon, ArrowPathIcon, KeyIcon, BuildingOffice2Icon,
    CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Channel {
    id: string;
    name: string;
    code: string;
    api_key: string | null;
    property_id: string | null;
    enabled: boolean;
    status: 'connected' | 'disconnected' | 'error';
    last_sync: string | null;
    updated_at: string;
}

interface ChannelBooking {
    id: string;
    channel_code: string;
    channel_name: string;
    external_ref: string;
    guest_name: string;
    room_number: string;
    check_in: string;
    check_out: string;
    amount: number;
    synced_at: string;
}

export default function ChannelsPage() {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [bookings, setBookings] = useState<ChannelBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
    const [apiKeyInput, setApiKeyInput] = useState('');
    const [propertyIdInput, setPropertyIdInput] = useState('');
    const [enabledInput, setEnabledInput] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [resCh, resBk] = await Promise.all([
                channelsApi.list(),
                channelsApi.getBookings(),
            ]);
            setChannels(resCh.data.channels);
            setBookings(resBk.data.channel_bookings || []);
        } catch {
            toast.error('Failed to load channel data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSyncAll = async () => {
        try {
            setSyncing(true);
            const res = await channelsApi.sync();
            toast.success(res.data.message || 'Channel sync complete');
            fetchData();
        } catch {
            toast.error('Sync failed');
        } finally {
            setSyncing(false);
        }
    };

    const openConfigModal = (ch: Channel) => {
        setEditingChannel(ch);
        setApiKeyInput(ch.api_key || '');
        setPropertyIdInput(ch.property_id || '');
        setEnabledInput(ch.enabled);
    };

    const handleSaveChannel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingChannel) return;
        try {
            await channelsApi.update(editingChannel.id, {
                api_key: apiKeyInput,
                property_id: propertyIdInput,
                enabled: enabledInput,
            });
            toast.success(`${editingChannel.name} settings updated`);
            setEditingChannel(null);
            fetchData();
        } catch {
            toast.error('Failed to update channel credentials');
        }
    };

    const getLogoColor = (code: string) => {
        switch (code) {
            case 'booking_com': return 'from-blue-600 to-blue-800';
            case 'makemytrip': return 'from-red-500 to-amber-600';
            case 'agoda': return 'from-purple-600 to-indigo-700';
            case 'airbnb': return 'from-rose-500 to-pink-600';
            default: return 'from-slate-600 to-slate-800';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <GlobeAltIcon className="w-7 h-7 text-blue-400" />
                        Channel Manager
                    </h1>
                    <p className="text-slate-400 text-sm">
                        Configure official API keys, sync live inventory, rates, and automated cross-platform room blocking.
                    </p>
                </div>

                <button
                    onClick={handleSyncAll}
                    disabled={syncing}
                    className="btn-primary flex items-center gap-2"
                >
                    <ArrowPathIcon className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? 'Syncing Channels...' : 'Sync All Channels Now'}
                </button>
            </div>

            {/* Channel Cards */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="card p-5 h-44 animate-pulse bg-slate-800/50" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {channels.map((ch) => (
                        <div key={ch.id} className="card p-5 flex flex-col justify-between hover:border-slate-700 transition-all">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getLogoColor(ch.code)} flex items-center justify-center font-bold text-white shadow-md`}>
                                        {ch.name[0]}
                                    </div>

                                    <span className={`badge ${ch.enabled ? 'badge-green' : 'badge-gray'}`}>
                                        {ch.enabled ? 'Active' : 'Disabled'}
                                    </span>
                                </div>

                                <h3 className="text-lg font-semibold text-white">{ch.name}</h3>
                                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                    <BuildingOffice2Icon className="w-3.5 h-3.5" />
                                    Property ID: {ch.property_id || 'Not set'}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                    <KeyIcon className="w-3.5 h-3.5" />
                                    API Key: {ch.api_key ? `${ch.api_key.substring(0, 8)}...` : 'Not configured'}
                                </p>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-xs">
                                    {ch.status === 'connected' && <CheckCircleIcon className="w-4 h-4 text-emerald-400" />}
                                    {ch.status === 'error' && <ExclamationTriangleIcon className="w-4 h-4 text-amber-400" />}
                                    {ch.status === 'disconnected' && <XCircleIcon className="w-4 h-4 text-slate-500" />}
                                    <span className="capitalize text-slate-300">{ch.status}</span>
                                </div>

                                <button
                                    onClick={() => openConfigModal(ch)}
                                    className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                                >
                                    Configure Key →
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Channel Bookings Table */}
            <div className="card p-6">
                <h2 className="text-lg font-bold text-white mb-4">Live OTA Bookings Log</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase">
                                <th className="py-3 px-4">Channel</th>
                                <th className="py-3 px-4">External Ref</th>
                                <th className="py-3 px-4">Guest</th>
                                <th className="py-3 px-4">Room</th>
                                <th className="py-3 px-4">Dates</th>
                                <th className="py-3 px-4 text-right">Amount</th>
                                <th className="py-3 px-4 text-right">Synced At</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-sm">
                            {bookings.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-500">
                                        No channel bookings synced yet. Click "Sync All Channels Now" to check for reservations.
                                    </td>
                                </tr>
                            ) : (
                                bookings.map((b) => (
                                    <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                                        <td className="py-3.5 px-4 font-medium text-white">{b.channel_name || b.channel_code}</td>
                                        <td className="py-3.5 px-4 text-blue-400 font-mono text-xs">{b.external_ref}</td>
                                        <td className="py-3.5 px-4 text-slate-200">{b.guest_name}</td>
                                        <td className="py-3.5 px-4 text-slate-300">Room {b.room_number || 'Auto-Assigned'}</td>
                                        <td className="py-3.5 px-4 text-slate-400 text-xs">{b.check_in} → {b.check_out}</td>
                                        <td className="py-3.5 px-4 text-right font-semibold text-emerald-400">₹{b.amount.toLocaleString()}</td>
                                        <td className="py-3.5 px-4 text-right text-slate-500 text-xs">{new Date(b.synced_at).toLocaleString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Configure API Key Modal */}
            {editingChannel && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="card max-w-md w-full p-6 space-y-4">
                        <h3 className="text-xl font-bold text-white">Configure {editingChannel.name} API Key</h3>
                        <p className="text-slate-400 text-xs">
                            Enter your official API Key and Property ID for {editingChannel.name} connectivity.
                        </p>

                        <form onSubmit={handleSaveChannel} className="space-y-4">
                            <div>
                                <label className="label">API Key / OAuth Token</label>
                                <input
                                    type="text"
                                    value={apiKeyInput}
                                    onChange={(e) => setApiKeyInput(e.target.value)}
                                    placeholder="e.g. BCOM_LIVE_KEY_992..."
                                    className="input-field font-mono"
                                    required
                                />
                            </div>

                            <div>
                                <label className="label">Property / Hotel ID</label>
                                <input
                                    type="text"
                                    value={propertyIdInput}
                                    onChange={(e) => setPropertyIdInput(e.target.value)}
                                    placeholder="e.g. PROP_77123"
                                    className="input-field font-mono"
                                    required
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="enableToggle"
                                    checked={enabledInput}
                                    onChange={(e) => setEnabledInput(e.target.checked)}
                                    className="w-4 h-4 accent-blue-600 rounded"
                                />
                                <label htmlFor="enableToggle" className="text-sm font-medium text-slate-200 cursor-pointer">
                                    Enable automatic inventory & rate sync
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setEditingChannel(null)}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Save & Connect API
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
