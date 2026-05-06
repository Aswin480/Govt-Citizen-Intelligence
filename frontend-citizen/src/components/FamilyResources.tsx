
import React, { useState } from 'react';
import { ShoppingCart, Zap, Droplet, Flame, CheckCircle, Clock } from 'lucide-react';

export const FamilyResources = ({ members }: { members: any[] }) => {
    // Mock State for Ration
    const [rationState, setRationState] = useState({
        rice: { total: 20, collected: 0, unit: 'kg' },
        wheat: { total: 15, collected: 15, unit: 'kg' },
        sugar: { total: 2, collected: 0, unit: 'kg' }
    });

    const collectRation = (item: string) => {
        setRationState(prev => ({
            ...prev,
            [item]: { ...prev[item as keyof typeof prev], collected: prev[item as keyof typeof prev].total }
        }));
    };

    return (
        <div className="space-y-6 animate-fade-in-up delay-100">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                <span className="bg-orange-500 text-white p-1 rounded">🏠</span>
                Sanjha Chulha (Household Resources)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* 1. SMART RATION CARD */}
                <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <ShoppingCart size={120} className="text-yellow-600" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="font-bold text-lg text-yellow-800 dark:text-yellow-500 flex items-center gap-2">
                                    <ShoppingCart size={20} /> Digital Ration Card
                                </h3>
                                <p className="text-xs text-yellow-700 font-mono mt-1">CARD NO: 8829-1992-XXXX • PHH (Priority)</p>
                            </div>
                            <span className="bg-yellow-200 text-yellow-800 text-[10px] font-bold px-2 py-1 rounded border border-yellow-300">
                                FEB 2026
                            </span>
                        </div>

                        {/* Visual Ration Bars */}
                        <div className="space-y-4">
                            {/* RICE */}
                            <div>
                                <div className="flex justify-between text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                                    <span>🍚 Rice ({rationState.rice.total} kg)</span>
                                    <span className={rationState.rice.collected === rationState.rice.total ? "text-green-600" : "text-red-500"}>
                                        {rationState.rice.collected === rationState.rice.total ? "COLLECTED" : "PENDING"}
                                    </span>
                                </div>
                                <div className="h-3 bg-white/50 rounded-full overflow-hidden border border-yellow-200">
                                    <div className={`h-full transition-all duration-1000 ${rationState.rice.collected === rationState.rice.total ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${(rationState.rice.collected / rationState.rice.total) * 100}%` }}></div>
                                </div>
                                {rationState.rice.collected === 0 && (
                                    <button onClick={() => collectRation('rice')} className="mt-2 text-[10px] bg-yellow-400 hover:bg-yellow-500 text-black px-3 py-1 rounded font-bold shadow-sm">
                                        Simulate Collection
                                    </button>
                                )}
                            </div>

                            {/* WHEAT */}
                            <div>
                                <div className="flex justify-between text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                                    <span>🌾 Wheat ({rationState.wheat.total} kg)</span>
                                    <span className="text-green-600 flex items-center gap-1">
                                        <CheckCircle size={10} /> COLLECTED (12th Feb)
                                    </span>
                                </div>
                                <div className="h-3 bg-white/50 rounded-full overflow-hidden border border-yellow-200">
                                    <div className="h-full bg-green-500 w-full"></div>
                                </div>
                            </div>
                        </div>

                        {/* Family Members Beneficiary List */}
                        <div className="mt-6 pt-4 border-t border-yellow-200/50">
                            <p className="text-[10px] font-bold uppercase text-yellow-700 mb-2">Beneficiaries (Linked)</p>
                            <div className="flex -space-x-2">
                                {members.map((m, i) => (
                                    <div key={i} className="w-6 h-6 rounded-full bg-yellow-100 border border-yellow-300 flex items-center justify-center text-[10px] text-yellow-800 font-bold" title={m.name}>
                                        {m.name[0]}
                                    </div>
                                ))}
                                <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-[8px] text-slate-500">
                                    +2
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. UTILITY BILLS (Consolidated) */}
                <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-900 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Zap size={120} className="text-purple-600" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="font-bold text-lg text-purple-800 dark:text-purple-400 flex items-center gap-2">
                                    <Zap size={20} /> Utility Command
                                </h3>
                                <p className="text-xs text-purple-700 font-mono mt-1">Consumer ID: 1100-2233-44</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {/* Electricity Bill */}
                            <div className="bg-white/60 dark:bg-black/20 p-3 rounded-xl border border-purple-100 flex justify-between items-center group cursor-pointer hover:border-purple-300 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                                        <Zap size={14} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Electricity (North Grid)</div>
                                        <div className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                                            <Clock size={8} /> Due in 2 days
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-slate-800 dark:text-white">₹450.00</div>
                                    <button className="text-[10px] text-indigo-600 font-bold hover:underline">PAY NOW</button>
                                </div>
                            </div>

                            {/* Water Bill */}
                            <div className="bg-white/60 dark:bg-black/20 p-3 rounded-xl border border-purple-100 flex justify-between items-center opacity-70">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                        <Droplet size={14} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Water Supply</div>
                                        <div className="text-[10px] text-green-600 font-bold flex items-center gap-1">
                                            PAID (Auto-Debit)
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-slate-800 dark:text-white line-through decoration-slate-400">₹120.00</div>
                                </div>
                            </div>

                            {/* Gas Booking */}
                            <div className="bg-white/60 dark:bg-black/20 p-3 rounded-xl border border-purple-100 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                                        <Flame size={14} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Indane Gas Cylinder</div>
                                        <div className="text-[10px] text-slate-500">Last booked: 20 Jan</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <button className="bg-red-500 text-white text-[10px] font-bold px-3 py-1.5 rounded hover:bg-red-600 transition-colors">
                                        BOOK REFILL
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
