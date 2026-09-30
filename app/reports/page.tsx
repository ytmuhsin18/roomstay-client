'use client';
import { useEffect, useState } from 'react';
import { reportsApi } from '@/lib/api';
import {
    BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import toast from 'react-hot-toast';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e'];

export default function ReportsPage() {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [activeTab, setActiveTab] = useState<'monthly' | 'daily' | 'rooms'>('monthly');
    const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);
    const [dailyRevenue, setDailyRevenue] = useState<any[]>([]);
    const [roomStats, setRoomStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                if (activeTab === 'monthly') {
                    const res = await reportsApi.revenue({ period: 'monthly', year });
                    const data = Array.from({ length: 12 }, (_, i) => {
                        const found = res.data.data.find((d: any) => parseInt(d.month) === i + 1);
                        return { name: MONTHS[i], revenue: found ? parseFloat(found.revenue) : 0, transactions: found ? parseInt(found.transactions) : 0 };
                    });
                    setMonthlyRevenue(data);
                } else if (activeTab === 'daily') {
                    const res = await reportsApi.revenue({ period: 'daily', year, month });
                    setDailyRevenue(res.data.data.map((d: any) => ({
                        date: new Date(d.date).getDate(),
                        revenue: parseFloat(d.revenue),
                        transactions: parseInt(d.transactions)
                    })));
                } else {
                    const res = await reportsApi.roomStats();
                    setRoomStats(res.data.rooms);
                }
            } catch { toast.error('Failed to load report'); }
            finally { setLoading(false); }
        };
        loadData();
    }, [activeTab, year, month]);

    const totalMonthlyRevenue = monthlyRevenue.reduce((s, d) => s + d.revenue, 0);
    const bestMonth = monthlyRevenue.reduce((a, b) => b.revenue > a.revenue ? b : a, { revenue: 0, name: '—' });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
                    <p className="text-slate-400 text-sm mt-0.5">Revenue and occupancy insights</p>
                </div>
                <div className="flex items-center gap-2">
                    <select className="input-field w-28" value={year} onChange={e => setYear(parseInt(e.target.value))}>
                        {[now.getFullYear() - 1, now.getFullYear()].map(y => <option key={y}>{y}</option>)}
                    </select>
                    {activeTab === 'daily' && (
                        <select className="input-field w-36" value={month} onChange={e => setMonth(parseInt(e.target.value))}>
                            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                        </select>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                {[['monthly', 'Monthly Revenue'], ['daily', 'Daily Revenue'], ['rooms', 'Room Performance']].map(([val, label]) => (
                    <button key={val} onClick={() => setActiveTab(val as any)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === val ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                        {label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="card h-64 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    {activeTab === 'monthly' && (
                        <>
                            {/* Summary cards */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="card p-4 text-center">
                                    <p className="text-slate-400 text-xs mb-1">Annual Revenue ({year})</p>
                                    <p className="text-2xl font-bold text-white">₹{(totalMonthlyRevenue / 1000).toFixed(1)}K</p>
                                </div>
                                <div className="card p-4 text-center">
                                    <p className="text-slate-400 text-xs mb-1">Best Month</p>
                                    <p className="text-2xl font-bold text-emerald-400">{bestMonth.name}</p>
                                    <p className="text-slate-400 text-xs">₹{(bestMonth.revenue / 1000).toFixed(1)}K</p>
                                </div>
                                <div className="card p-4 text-center">
                                    <p className="text-slate-400 text-xs mb-1">Monthly Average</p>
                                    <p className="text-2xl font-bold text-white">₹{(totalMonthlyRevenue / 12 / 1000).toFixed(1)}K</p>
                                </div>
                            </div>

                            <div className="card p-5">
                                <h3 className="text-white font-semibold mb-4">Monthly Revenue - {year}</h3>
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={monthlyRevenue}>
                                        <defs>
                                            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.8} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}
                                            tickFormatter={v => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}`} />
                                        <Tooltip
                                            contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#f1f5f9' }}
                                            formatter={(v: any, name: any) => [name === 'revenue' ? `₹${v.toLocaleString('en-IN')}` : v, name === 'revenue' ? 'Revenue' : 'Transactions']} />
                                        <Bar dataKey="revenue" fill="url(#barGrad)" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </>
                    )}

                    {activeTab === 'daily' && (
                        <div className="card p-5">
                            <h3 className="text-white font-semibold mb-4">Daily Revenue - {MONTHS[month - 1]} {year}</h3>
                            {dailyRevenue.length === 0 ? (
                                <div className="text-center text-slate-500 py-16">No payment data for this period</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={dailyRevenue}>
                                        <defs>
                                            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                        <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}
                                            tickFormatter={v => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}`} />
                                        <Tooltip
                                            contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#f1f5f9' }}
                                            formatter={(v: any) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
                                        <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#areaGrad)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    )}

                    {activeTab === 'rooms' && (
                        <div className="card overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-800">
                                <h3 className="text-white font-semibold">Room Performance</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-800/50">
                                        <tr>
                                            {['Room', 'Type', 'Status', 'Total Bookings', 'Revenue', 'Avg Stay'].map(h => (
                                                <th key={h} className="table-header">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {roomStats.map(r => (
                                            <tr key={r.room_number} className="table-row">
                                                <td className="table-cell font-medium text-white">Room {r.room_number}</td>
                                                <td className="table-cell text-slate-400">{r.room_type}</td>
                                                <td className="table-cell">
                                                    <span className={`badge ${r.status === 'available' ? 'badge-green' : r.status === 'occupied' ? 'badge-blue' : 'badge-yellow'}`}>{r.status}</span>
                                                </td>
                                                <td className="table-cell text-center font-medium">{r.total_bookings}</td>
                                                <td className="table-cell font-medium text-emerald-400">₹{parseFloat(r.total_revenue || 0).toLocaleString('en-IN')}</td>
                                                <td className="table-cell text-center">{parseFloat(r.avg_stay_nights || 0).toFixed(1)} nights</td>
                                            </tr>
                                        ))}
                                        {roomStats.length === 0 && (
                                            <tr><td colSpan={6} className="table-cell text-center text-slate-500 py-12">No room data available</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
