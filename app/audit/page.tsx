'use client';
import { useEffect, useState, useCallback } from 'react';
import { auditApi } from '@/lib/api';
import { ClipboardDocumentListIcon, ShieldCheckIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface AuditLog {
    id: string;
    user_id: string | null;
    user_name: string;
    user_email: string | null;
    action: string;
    entity: string;
    entity_id: string | null;
    details: string | null;
    ip_address: string;
    created_at: string;
}

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionFilter, setActionFilter] = useState('');
    const [entityFilter, setEntityFilter] = useState('');
    const [search, setSearch] = useState('');

    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true);
            const res = await auditApi.list({ action: actionFilter || undefined, entity: entityFilter || undefined });
            setLogs(res.data.audit_logs || []);
        } catch {
            toast.error('Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    }, [actionFilter, entityFilter]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const filteredLogs = logs.filter((log) => {
        const q = search.toLowerCase();
        return (
            log.user_name.toLowerCase().includes(q) ||
            log.action.toLowerCase().includes(q) ||
            log.entity.toLowerCase().includes(q) ||
            (log.details && log.details.toLowerCase().includes(q))
        );
    });

    const getActionBadge = (action: string) => {
        switch (action.toUpperCase()) {
            case 'CREATE': return 'badge-green';
            case 'UPDATE': return 'badge-blue';
            case 'DELETE': return 'badge-red';
            case 'SYNC': return 'badge-yellow';
            case 'LOGIN': return 'badge-gray';
            default: return 'badge-gray';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <ClipboardDocumentListIcon className="w-7 h-7 text-indigo-400" />
                        Security & Audit Logs
                    </h1>
                    <p className="text-slate-400 text-sm">
                        Complete compliance trail tracking user actions, channel sync events, price modifications, and logins.
                    </p>
                </div>
            </div>

            {/* Filter bar */}
            <div className="card p-4 flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                    <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                        type="text"
                        placeholder="Search by user, action, entity..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input-field pl-9"
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <select
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                        className="input-field"
                    >
                        <option value="">All Actions</option>
                        <option value="CREATE">CREATE</option>
                        <option value="UPDATE">UPDATE</option>
                        <option value="DELETE">DELETE</option>
                        <option value="SYNC">SYNC</option>
                        <option value="LOGIN">LOGIN</option>
                    </select>

                    <select
                        value={entityFilter}
                        onChange={(e) => setEntityFilter(e.target.value)}
                        className="input-field"
                    >
                        <option value="">All Entities</option>
                        <option value="CHANNEL">CHANNEL</option>
                        <option value="PRICING_RULE">PRICING_RULE</option>
                        <option value="ROOM">ROOM</option>
                        <option value="BOOKING">BOOKING</option>
                        <option value="USER">USER</option>
                    </select>
                </div>
            </div>

            {/* Logs Table */}
            <div className="card p-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase">
                                <th className="py-3 px-4">Timestamp</th>
                                <th className="py-3 px-4">User</th>
                                <th className="py-3 px-4">Action</th>
                                <th className="py-3 px-4">Resource</th>
                                <th className="py-3 px-4">Context Details</th>
                                <th className="py-3 px-4 text-right">IP Address</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-slate-500">
                                        Loading audit trail...
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-slate-500">
                                        No matching audit log entries found.
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                                        <td className="py-3.5 px-4 text-slate-400 text-xs whitespace-nowrap">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td className="py-3.5 px-4 font-medium text-white">
                                            {log.user_name}
                                            {log.user_email && <span className="block text-xs text-slate-500 font-normal">{log.user_email}</span>}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className={`badge ${getActionBadge(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-300 font-mono text-xs">
                                            {log.entity} {log.entity_id ? `#${log.entity_id.substring(0, 6)}` : ''}
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-400 text-xs font-mono max-w-xs truncate">
                                            {log.details || '—'}
                                        </td>
                                        <td className="py-3.5 px-4 text-right text-slate-500 text-xs font-mono">
                                            {log.ip_address}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
