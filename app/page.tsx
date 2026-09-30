'use client';
import { useEffect, useState } from 'react';
import { reportsApi, bookingsApi } from '@/lib/api';
import {
  BuildingOfficeIcon, UsersIcon, CurrencyRupeeIcon,
  CalendarDaysIcon, ArrowTrendingUpIcon, ClockIcon
} from '@heroicons/react/24/outline';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend
} from 'recharts';
import Link from 'next/link';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const STATUS_COLORS: Record<string, string> = {
  confirmed: 'badge-blue', checked_in: 'badge-green', checked_out: 'badge-gray', cancelled: 'badge-red'
};

function StatCard({ label, value, sub, icon: Icon, color }: any) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-slate-400 text-xs font-medium">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [revenue, setRevenue] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    Promise.all([
      reportsApi.dashboard(),
      reportsApi.revenue({ period: 'monthly', year: now.getFullYear() }),
      bookingsApi.list({ limit: 5 }),
    ]).then(([s, r, b]) => {
      setStats(s.data);
      const monthData = Array.from({ length: 12 }, (_, i) => {
        const found = r.data.data.find((d: any) => parseInt(d.month) === i + 1);
        return { name: MONTHS[i], revenue: found ? parseFloat(found.revenue) : 0 };
      });
      setRevenue(monthData);
      setRecentBookings(b.data.bookings.slice(0, 6));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-0.5">Welcome back! Here's what's happening today.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Rooms" value={stats?.total_rooms || 0}
          sub={`${stats?.occupied_rooms || 0} occupied`}
          icon={BuildingOfficeIcon} color="bg-gradient-to-br from-blue-500 to-indigo-600" />
        <StatCard label="Occupancy Rate" value={`${stats?.occupancy_rate || 0}%`}
          sub="of all rooms"
          icon={ArrowTrendingUpIcon} color="bg-gradient-to-br from-emerald-500 to-teal-600" />
        <StatCard label="Month Revenue" value={`₹${((stats?.month_revenue || 0) / 1000).toFixed(1)}K`}
          sub="this month"
          icon={CurrencyRupeeIcon} color="bg-gradient-to-br from-amber-500 to-orange-600" />
        <StatCard label="Customers" value={stats?.total_customers || 0}
          sub={`${stats?.today_bookings || 0} today`}
          icon={UsersIcon} color="bg-gradient-to-br from-purple-500 to-pink-600" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: '/bookings/new', label: 'New Booking', icon: CalendarDaysIcon, color: 'text-blue-400' },
          { href: '/rooms', label: 'Manage Rooms', icon: BuildingOfficeIcon, color: 'text-emerald-400' },
          { href: '/customers', label: 'Customers', icon: UsersIcon, color: 'text-purple-400' },
          { href: '/payments', label: 'Payments', icon: CurrencyRupeeIcon, color: 'text-amber-400' },
        ].map(({ href, label, icon: Icon, color }) => (
          <Link key={href} href={href} className="card p-4 flex items-center gap-3 hover:bg-slate-800 transition-colors group cursor-pointer">
            <Icon className={`w-5 h-5 ${color}`} />
            <span className="text-slate-300 text-sm font-medium group-hover:text-white transition-colors">{label}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-white font-semibold mb-4">Monthly Revenue ({new Date().getFullYear()})</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenue}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}`} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#f1f5f9' }}
                formatter={(v: any) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Occupancy */}
        <div className="card p-5">
          <h3 className="text-white font-semibold mb-4">Room Status</h3>
          <div className="space-y-3">
            {[
              { label: 'Available', value: (stats?.total_rooms || 0) - (stats?.occupied_rooms || 0), color: 'bg-emerald-500', total: stats?.total_rooms || 1 },
              { label: 'Occupied', value: stats?.occupied_rooms || 0, color: 'bg-blue-500', total: stats?.total_rooms || 1 },
            ].map(({ label, value, color, total }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">{label}</span>
                  <span className="text-white font-medium">{value}</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${(value / total) * 100}%` }} />
                </div>
              </div>
            ))}
            <div className="mt-4 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Pending Checkouts</span>
                <span className="text-amber-400 font-bold text-lg">{stats?.pending_checkouts || 0}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-slate-400 text-sm">Today's Arrivals</span>
                <span className="text-blue-400 font-bold text-lg">{stats?.today_bookings || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent bookings */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h3 className="text-white font-semibold">Recent Bookings</h3>
          <Link href="/bookings" className="text-blue-400 text-sm hover:text-blue-300 transition-colors">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                {['Ref', 'Customer', 'Room', 'Check-in', 'Check-out', 'Status', 'Amount'].map(h => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentBookings.map(b => (
                <tr key={b.id} className="table-row">
                  <td className="table-cell font-mono text-blue-400">{b.booking_ref}</td>
                  <td className="table-cell">{b.customer_name}</td>
                  <td className="table-cell">{b.room_number}</td>
                  <td className="table-cell">{new Date(b.check_in).toLocaleDateString('en-IN')}</td>
                  <td className="table-cell">{new Date(b.check_out).toLocaleDateString('en-IN')}</td>
                  <td className="table-cell">
                    <span className={STATUS_COLORS[b.status] || 'badge-gray'}>{b.status.replace('_', ' ')}</span>
                  </td>
                  <td className="table-cell font-medium">₹{parseFloat(b.total_amount).toLocaleString('en-IN')}</td>
                </tr>
              ))}
              {recentBookings.length === 0 && (
                <tr><td colSpan={7} className="table-cell text-center text-slate-500 py-8">No bookings yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
