'use client';
import { useEffect, useState, useCallback } from 'react';
import { pricingApi, roomsApi } from '@/lib/api';
import { TagIcon, PlusIcon, TrashIcon, CalculatorIcon, SparklesIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface PricingRule {
    id: string;
    name: string;
    rule_type: 'days_of_week' | 'date_range' | 'room_type';
    adjustment_type: 'percentage' | 'flat';
    value: number;
    start_date: string | null;
    end_date: string | null;
    days_of_week: string[];
    room_type: string;
    priority: number;
    enabled: boolean;
}

interface Room {
    id: string;
    room_number: string;
    room_type: string;
    weekday_price: number;
}

export default function PricingPage() {
    const [rules, setRules] = useState<PricingRule[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [ruleName, setRuleName] = useState('');
    const [ruleType, setRuleType] = useState<'days_of_week' | 'date_range' | 'room_type'>('days_of_week');
    const [adjType, setAdjType] = useState<'percentage' | 'flat'>('percentage');
    const [ruleValue, setRuleValue] = useState(10);
    const [roomTypeSelect, setRoomTypeSelect] = useState('all');
    const [daysSelected, setDaysSelected] = useState<string[]>(['5', '6']);

    // Sandbox Calculator state
    const [calcRoomId, setCalcRoomId] = useState('');
    const [calcIn, setCalcIn] = useState(new Date().toISOString().split('T')[0]);
    const [calcOut, setCalcOut] = useState(new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]);
    const [previewResult, setPreviewResult] = useState<any>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [resR, resRm] = await Promise.all([pricingApi.list(), roomsApi.list()]);
            setRules(resR.data.rules || []);
            const roomList = resRm.data.rooms || [];
            setRooms(roomList);
            if (roomList.length > 0 && !calcRoomId) setCalcRoomId(roomList[0].id);
        } catch {
            toast.error('Failed to load pricing rules');
        } finally {
            setLoading(false);
        }
    }, [calcRoomId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateRule = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await pricingApi.create({
                name: ruleName,
                rule_type: ruleType,
                adjustment_type: adjType,
                value: ruleValue,
                days_of_week: daysSelected,
                room_type: roomTypeSelect,
            });
            toast.success('Pricing rule created');
            setShowModal(false);
            fetchData();
        } catch {
            toast.error('Failed to create rule');
        }
    };

    const handleDeleteRule = async (id: string) => {
        try {
            await pricingApi.delete(id);
            toast.success('Rule deleted');
            fetchData();
        } catch {
            toast.error('Failed to delete rule');
        }
    };

    const handleCalculatePreview = async () => {
        if (!calcRoomId || !calcIn || !calcOut) return;
        try {
            const res = await pricingApi.preview({
                room_id: calcRoomId,
                check_in: calcIn,
                check_out: calcOut,
            });
            setPreviewResult(res.data.preview);
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Calculation failed');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <TagIcon className="w-7 h-7 text-amber-400" />
                        Dynamic Pricing Engine
                    </h1>
                    <p className="text-slate-400 text-sm">
                        Set automated yield management rules for weekends, seasonal surges, and room-specific premiums.
                    </p>
                </div>

                <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
                    <PlusIcon className="w-4 h-4" />
                    Add Pricing Rule
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Rules List */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-lg font-bold text-white">Active Yield Rules ({rules.length})</h2>

                    {loading ? (
                        <div className="card p-6 animate-pulse bg-slate-800/40 h-40" />
                    ) : (
                        <div className="space-y-3">
                            {rules.map((r) => (
                                <div key={r.id} className="card p-4 flex items-center justify-between hover:border-slate-700 transition-all">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-white">{r.name}</h3>
                                            <span className={`badge ${r.adjustment_type === 'percentage' ? (r.value > 0 ? 'badge-red' : 'badge-green') : 'badge-blue'}`}>
                                                {r.value > 0 ? `+${r.value}` : r.value}{r.adjustment_type === 'percentage' ? '%' : ' ₹'}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3 text-xs text-slate-400">
                                            <span>Type: <strong className="text-slate-300 capitalize">{r.rule_type.replace('_', ' ')}</strong></span>
                                            <span>Target: <strong className="text-slate-300 capitalize">{r.room_type}</strong></span>
                                            <span>Priority: <strong className="text-slate-300">{r.priority}</strong></span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleDeleteRule(r.id)}
                                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Live Sandbox Rate Calculator */}
                <div className="card p-5 space-y-4">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <CalculatorIcon className="w-5 h-5 text-blue-400" />
                        Live Price Sandbox
                    </h2>
                    <p className="text-xs text-slate-400">
                        Preview calculated rates for any room and stay dates with all dynamic pricing rules applied.
                    </p>

                    <div className="space-y-3">
                        <div>
                            <label className="label">Select Room</label>
                            <select
                                value={calcRoomId}
                                onChange={(e) => setCalcRoomId(e.target.value)}
                                className="input-field"
                            >
                                {rooms.map((rm) => (
                                    <option key={rm.id} value={rm.id}>
                                        Room {rm.room_number} ({rm.room_type}) – Base ₹{rm.weekday_price}/night
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="label">Check In</label>
                                <input
                                    type="date"
                                    value={calcIn}
                                    onChange={(e) => setCalcIn(e.target.value)}
                                    className="input-field"
                                />
                            </div>

                            <div>
                                <label className="label">Check Out</label>
                                <input
                                    type="date"
                                    value={calcOut}
                                    onChange={(e) => setCalcOut(e.target.value)}
                                    className="input-field"
                                />
                            </div>
                        </div>

                        <button onClick={handleCalculatePreview} className="btn-secondary w-full flex items-center justify-center gap-2">
                            <SparklesIcon className="w-4 h-4 text-amber-400" />
                            Calculate Dynamic Rate
                        </button>
                    </div>

                    {previewResult && (
                        <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                            <div className="flex justify-between items-center text-xs text-slate-400">
                                <span>Base Total:</span>
                                <span>₹{previewResult.baseTotal}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-bold text-emerald-400">
                                <span>Calculated Rate ({previewResult.nights} nights):</span>
                                <span className="text-base">₹{previewResult.totalPrice}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Rule Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="card max-w-md w-full p-6 space-y-4">
                        <h3 className="text-xl font-bold text-white">Create Dynamic Pricing Rule</h3>

                        <form onSubmit={handleCreateRule} className="space-y-4">
                            <div>
                                <label className="label">Rule Name</label>
                                <input
                                    type="text"
                                    value={ruleName}
                                    onChange={(e) => setRuleName(e.target.value)}
                                    placeholder="e.g. Festival Season Surge"
                                    className="input-field"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="label">Rule Trigger</label>
                                    <select
                                        value={ruleType}
                                        onChange={(e: any) => setRuleType(e.target.value)}
                                        className="input-field"
                                    >
                                        <option value="days_of_week">Days of Week</option>
                                        <option value="room_type">Room Type Specific</option>
                                        <option value="date_range">Date Range</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="label">Adjustment Type</label>
                                    <select
                                        value={adjType}
                                        onChange={(e: any) => setAdjType(e.target.value)}
                                        className="input-field"
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="flat">Flat Amount (₹)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="label">Adjustment Value (+ for surge, - for discount)</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={ruleValue}
                                    onChange={(e) => setRuleValue(parseFloat(e.target.value) || 0)}
                                    className="input-field font-mono"
                                    required
                                />
                            </div>

                            <div>
                                <label className="label">Target Room Category</label>
                                <select
                                    value={roomTypeSelect}
                                    onChange={(e) => setRoomTypeSelect(e.target.value)}
                                    className="input-field"
                                >
                                    <option value="all">All Room Types</option>
                                    <option value="Standard">Standard</option>
                                    <option value="Deluxe">Deluxe</option>
                                    <option value="Suite">Suite</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Save Pricing Rule
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
