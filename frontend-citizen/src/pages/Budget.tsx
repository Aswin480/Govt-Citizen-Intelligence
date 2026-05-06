
import React, { useState, useEffect } from 'react';
import { useGovernanceScope } from '../context/GovernanceScopeContext';
import {
    TrendingUp, Info,
    ShieldCheck, Wallet, Landmark, Activity, Users,
    Zap, Download, FileText, ChevronDown,
    ChevronUp, Share2, AlertCircle, Heart, Target
} from 'lucide-react';
import { getBudgetData } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const Budget: React.FC = () => {
    const { scope, selectedState } = useGovernanceScope();
    const [budgetData, setBudgetData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedSector, setExpandedSector] = useState<string | null>(null);
    const [aiBrief, setAiBrief] = useState<string | null>(null);
    const [showAiBrief, setShowAiBrief] = useState(false);

    const currentRegion = scope === 'nation' ? 'nation' : (selectedState?.name || 'nation');

    const handleExportPDF = () => {
        window.open(`http://localhost:8000/v1/budget/export/pdf?region=${currentRegion}`, '_blank');
    };

    const handleExportExcel = () => {
        window.open(`http://localhost:8000/v1/budget/export/excel?region=${currentRegion}`, '_blank');
    };

    const handleAIBrief = async () => {
        setShowAiBrief(true);
        setAiBrief("Analyzing budget patterns...");
        try {
            const response = await fetch(`http://localhost:8000/v1/budget/ai/brief?region=${currentRegion}`);
            const data = await response.json();
            setAiBrief(data.brief);
        } catch (err) {
            setAiBrief("Unable to generate AI brief. Summary: Fiscal stability maintained.");
        }
    };

    useEffect(() => {
        const fetchBudget = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getBudgetData(currentRegion);
                setBudgetData(data);
            } catch (err) {
                console.error("Failed to fetch budget data", err);
                setError("Failed to load budget data. Please try again later.");
            } finally {
                setLoading(false);
            }
        };
        fetchBudget();
    }, [currentRegion]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-950">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-emerald-500/20 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 w-16 h-16 border-4 border-t-emerald-500 rounded-full animate-spin"></div>
                    <div className="mt-4 text-emerald-500 font-black tracking-widest text-xs uppercase animate-pulse">Syncing Fiscal Data...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-950 text-white">
                <div className="text-center space-y-4">
                    <AlertCircle size={48} className="text-rose-500 mx-auto" />
                    <h2 className="text-2xl font-bold">Unable to Load Budget Data</h2>
                    <p className="text-slate-400">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-emerald-500 rounded-lg font-bold hover:bg-emerald-600 transition-colors"
                    >
                        Retry Connection
                    </button>
                </div>
            </div>
        );
    }

    if (!budgetData) return null;

    const {
        total_size, revenue_budget, capital_budget, fiscal_deficit,
        budget_growth, per_capita_allocation, health_score,
        highlights, allocations, revenue_sources
    } = budgetData;

    return (
        <div className="space-y-12 animate-fade-in p-6 pb-24 max-w-[1700px] mx-auto bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100">

            {/* 1️⃣ PREMIERE HERO SECTION */}
            <div className="relative group overflow-hidden">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-blue-600 to-purple-600 rounded-[3rem] blur opacity-20 transition duration-1000"></div>
                <div className="relative bg-white dark:bg-slate-900/80 backdrop-blur-3xl border border-slate-200 dark:border-white/10 rounded-[3rem] p-10 md:p-14 overflow-hidden shadow-2xl">

                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start gap-12">
                        <div className="space-y-8 flex-1">
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="px-4 py-1.5 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full border border-emerald-500/30 flex items-center gap-2">
                                    <ShieldCheck size={14} className="text-emerald-500" />
                                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">Verified Budget Protocol 2026</span>
                                </div>
                                <div className="px-4 py-1.5 bg-blue-500/10 dark:bg-blue-500/20 rounded-full border border-blue-500/30">
                                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em]">{scope === 'nation' ? 'UNION OF INDIA' : selectedState?.name.toUpperCase()}</span>
                                </div>
                            </div>

                            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.85] italic">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">
                                    {scope === 'nation' ? 'Union Strategic' : `${selectedState?.name ?? ''} Fiscal`}
                                </span>
                                <br />
                                <span className="text-emerald-500">Budget 2026</span>
                            </h1>

                            <p className="text-slate-500 dark:text-slate-400 max-w-2xl text-xl font-medium leading-relaxed">
                                Deciphering complex financial movements into actionable insights.
                                Strategic capital deployment for the {scope === 'nation' ? 'Next Decade' : 'Regional Growth Phase'}.
                            </p>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    onClick={handleExportPDF}
                                    className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold transition-all hover:scale-105 shadow-lg shadow-emerald-500/20"
                                >
                                    <Download size={18} /> Export PDF Summary
                                </button>
                                <button className="flex items-center gap-2 px-6 py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-2xl font-bold transition-all">
                                    <Share2 size={18} /> Share Analysis
                                </button>
                            </div>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full xl:w-auto">
                            <QuickStatCard
                                label="Total Budget Size"
                                value={`₹${total_size} Lakh Cr`}
                                subValue={`${budget_growth}% Growth YoY`}
                                icon={<Landmark className="text-emerald-400" />}
                                trend="up"
                            />
                            <QuickStatCard
                                label="Budget Health Score"
                                value={`${health_score}/100`}
                                subValue="Institutional Integrity"
                                icon={<Activity className="text-blue-400" />}
                                trend="neutral"
                            />
                            <QuickStatCard
                                label="Fiscal Deficit"
                                value={`${fiscal_deficit}%`}
                                subValue="Target Limit: 4.5%"
                                icon={<AlertCircle className="text-rose-400" />}
                                trend="down"
                            />
                            <QuickStatCard
                                label="Per-Capita Allocation"
                                value={`₹${(per_capita_allocation / 1000).toFixed(1)}K`}
                                subValue="Per Indian Citizen"
                                icon={<Users className="text-purple-400" />}
                                trend="up"
                            />
                        </div >
                    </div >
                </div >
            </div >

            {/* 2️⃣ SECTOR-WISE ALLOCATION (High Interactivity) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-8">
                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-xl overflow-hidden">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                            <div>
                                <h2 className="text-4xl font-black tracking-tight mb-2">Sector-Wise Allocation</h2>
                                <p className="text-slate-500 font-medium italic">Click a sector to dive into specific schemes and beneficiaries.</p>
                            </div>
                            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                                <button className="px-6 py-2 bg-white dark:bg-slate-700 rounded-xl shadow-md text-xs font-bold uppercase tracking-widest">Table</button>
                                <button className="px-6 py-2 text-xs font-bold uppercase tracking-widest text-slate-500">Analytics</button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Table Header */}
                            <div className="grid grid-cols-12 gap-4 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                <div className="col-span-5">Sector Pillars</div>
                                <div className="col-span-3 text-right">Allocation (₹)</div>
                                <div className="col-span-2 text-right">Share</div>
                                <div className="col-span-2 text-right">YoY Change</div>
                            </div>

                            <AnimatePresence>
                                {allocations.map((item: any, idx: number) => (
                                    <SectorRow
                                        key={idx}
                                        item={item}
                                        isExpanded={expandedSector === item.sector}
                                        onToggle={() => setExpandedSector(expandedSector === item.sector ? null : item.sector)}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    </section>

                    {/* 7️⃣ REGIONAL IMPACT MAPPING */}
                    {scope !== 'nation' && (
                        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] p-10 shadow-xl overflow-hidden">
                            <h2 className="text-3xl font-black mb-10 flex items-center gap-3">
                                <Target size={32} className="text-rose-500" /> Regional Impact Mapping
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[
                                    { name: 'Nodal Growth Districts', value: '₹4.2K Cr', focus: 'High' },
                                    { name: 'Aspirational Blocks', value: '₹1.8K Cr', focus: 'Priority' },
                                    { name: 'Urban Infrastructure', value: '₹8.5K Cr', focus: 'Critical' },
                                ].map((reg, i) => (
                                    <div key={i} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                                        <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">{reg.focus} Focus</div>
                                        <div className="text-xl font-black mb-2">{reg.name}</div>
                                        <div className="text-sm font-bold text-slate-500">Allocation: {reg.value}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Urban vs Rural Spending</h4>
                                    <div className="flex items-center gap-2 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden p-1">
                                        <div className="h-full bg-blue-500 rounded-xl flex items-center justify-center text-[10px] font-black text-white" style={{ width: '45%' }}>URBAN 45%</div>
                                        <div className="h-full bg-emerald-500 rounded-xl flex items-center justify-center text-[10px] font-black text-white" style={{ width: '55%' }}>RURAL 55%</div>
                                    </div>
                                </div>
                                <div className="p-6 bg-blue-500/5 rounded-[2rem] border border-blue-500/10 flex items-center gap-4">
                                    <Info className="text-blue-500 shrink-0" />
                                    <p className="text-xs font-medium text-slate-500 italic">
                                        Investment is skewed towards **Rural Infrastructure** to boost localized economy and agrarian logistics.
                                    </p>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* 4️⃣ REVENUE SOURCES & EXPENDITURE ANALYSIS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
                            <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
                                <Wallet className="text-emerald-500" /> Revenue Sources
                            </h3>
                            <div className="space-y-6">
                                {revenue_sources.map((rev: any, i: number) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex justify-between text-sm font-bold">
                                            <span>{rev.source_name}</span>
                                            <span className="text-emerald-500">₹{rev.amount} Lakh Cr</span>
                                        </div>
                                        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(rev.amount / total_size) * 100}%` }}
                                                className={`h-full bg-gradient-to-r ${rev.type === 'Borrowing' ? 'from-rose-500 to-amber-500' : 'from-emerald-400 to-emerald-600'}`}
                                            ></motion.div>
                                        </div>
                                    </div>
                                ))}

                                <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="text-xs font-black uppercase tracking-widest text-slate-400">Dependency Meter</div>
                                        <div className="text-lg font-black text-amber-500">{(revenue_sources.find((r: any) => r.type === 'Borrowing')?.amount / total_size * 100).toFixed(1)}%</div>
                                    </div>
                                    <p className="text-[10px] text-slate-500 leading-relaxed font-bold uppercase">
                                        Share of Borrowings in total revenue pool. Lower is healthier.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] p-8 shadow-xl">
                            <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
                                <Zap className="text-blue-500" /> Expenditure Types
                            </h3>
                            <div className="flex flex-col h-full justify-between">
                                <div className="space-y-8">
                                    <ExpenditureItem
                                        label="Developmental"
                                        value={capital_budget}
                                        total={total_size}
                                        color="bg-blue-500"
                                        desc="Asset building, infra, energy projects."
                                    />
                                    <ExpenditureItem
                                        label="Revenue/Operational"
                                        value={revenue_budget}
                                        total={total_size}
                                        color="bg-slate-400"
                                        desc="Salaries, pensions, interest payments."
                                    />
                                </div>

                                <div className="mt-8 p-6 bg-blue-500/5 border border-blue-500/20 rounded-3xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp size={16} className="text-blue-500" />
                                        <span className="text-xs font-black uppercase tracking-widest text-blue-500">Fiscal Priority</span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                        Shift towards **Capital Expenditure** (Capex) has increased by **11%** this cycle, signalling long-term commitment to growth.
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                {/* RIGHT SIDEBAR: IMPACT & HIGHLIGHTS */}
                <div className="lg:col-span-4 space-y-8">

                    {/* 11&9 - BUDGET HEALTH & IMPACT ANALYSIS */}
                    <section className="bg-slate-900 text-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 to-slate-900 pointer-events-none"></div>
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-black italic uppercase tracking-tighter">Budget Health</h3>
                                <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 flex items-center justify-center p-1">
                                    <div className="w-full h-full rounded-full border-4 border-t-emerald-500 flex items-center justify-center text-sm font-black italic">
                                        {health_score}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <ImpactCard icon={<Users size={16} />} label="Welfare Reach" value="High" />
                                <ImpactCard icon={<Activity size={16} />} label="Fiscal Discipline" value="Moderate" />
                                <ImpactCard icon={<Heart size={16} />} label="Sustainability" value="Elite" />
                            </div>

                            <hr className="border-white/10" />

                            <div>
                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 underline decoration-emerald-500 underline-offset-8">Who Benefits?</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <BenefitTag label="Students" percentage="78%" />
                                    <BenefitTag label="Farmers" percentage="92%" />
                                    <BenefitTag label="MSMEs" percentage="65%" />
                                    <BenefitTag label="Women" percentage="84%" />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 8 - POLICY & SESSION HIGHLIGHTS */}
                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] p-8 shadow-xl">
                        <h3 className="text-xl font-black mb-8 uppercase italic tracking-tight flex items-center gap-2">
                            <FileText className="text-amber-500" /> Session Highlights
                        </h3>
                        <div className="space-y-8">
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 block">Top Debated Issues</div>
                                <div className="space-y-3">
                                    {highlights?.top_debated?.map((msg: string, i: number) => (
                                        <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs font-bold transition-transform hover:scale-102 cursor-default">
                                            <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                                            {msg}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 bg-rose-500/5 border border-rose-500/10 rounded-[2.5rem]">
                                <div className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-2">Major Objections</div>
                                <ul className="text-xs font-medium text-slate-500 dark:text-slate-400 space-y-2 list-disc pl-4">
                                    {highlights?.objections?.map((obj: string, i: number) => (
                                        <li key={i}>{obj}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] relative overflow-hidden">
                                <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">FM Response</div>
                                <p className="text-sm font-black italic text-slate-800 dark:text-slate-200 leading-snug">
                                    &ldquo;{highlights?.minister_response}&rdquo;
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* 12 - DOWNLOAD & CHANNELS */}
                    <div className="bg-slate-100 dark:bg-slate-800/50 rounded-[2.5rem] p-8 space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Intelligence Packs</h4>
                        <button 
                            onClick={handleExportExcel}
                            className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all group"
                        >
                            <span className="text-xs font-bold">Comprehensive Excel Dataset</span>
                            <Download size={14} className="opacity-40 group-hover:opacity-100" />
                        </button>
                        <button 
                            onClick={handleAIBrief}
                            className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl hover:bg-blue-500 hover:text-white transition-all group"
                        >
                            <span className="text-xs font-bold">Legislative Brief (2 Min Summary)</span>
                            <FileText size={14} className="opacity-40 group-hover:opacity-100" />
                        </button>
                    </div>

                    {/* AI Brief Modal */}
                    <AnimatePresence>
                        {showAiBrief && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm"
                                onClick={() => setShowAiBrief(false)}
                            >
                                <motion.div 
                                    initial={{ scale: 0.9, y: 20 }}
                                    animate={{ scale: 1, y: 0 }}
                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 rounded-[3rem] max-w-2xl w-full shadow-2xl relative"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <div className="absolute top-6 right-6 cursor-pointer text-slate-400 hover:text-slate-100" onClick={() => setShowAiBrief(false)}>
                                        ✕
                                    </div>
                                    <div className="flex items-center gap-3 mb-6">
                                        <FileText className="text-blue-500" size={32} />
                                        <h3 className="text-2xl font-black italic">AI Legislative Brief</h3>
                                    </div>
                                    <div className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed whitespace-pre-wrap">
                                        {aiBrief}
                                    </div>
                                    <button 
                                        onClick={() => setShowAiBrief(false)}
                                        className="mt-10 w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black italic tracking-widest uppercase"
                                    >
                                        Acknowledged
                                    </button>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div >
        </div >
    );
};

// Sub-components for cleaner structure
const QuickStatCard = ({ label, value, subValue, icon, trend }: any) => (
    <div className="p-8 bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-[2.5rem] transition-all hover:bg-white/15 cursor-default group min-w-[200px]">
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</div>
        <div className="text-3xl font-black tracking-tighter mb-2 italic">{value}</div>
        <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold ${trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-rose-500' : 'text-blue-500'}`}>
                {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '●'} {subValue}
            </span>
        </div>
    </div>
);

const SectorRow = ({ item, isExpanded, onToggle }: any) => {
    const isUp = item.yoy_change > 0;

    return (
        <div className="group">
            <div
                onClick={onToggle}
                className={`grid grid-cols-12 gap-4 px-6 py-6 items-center cursor-pointer transition-all border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${isExpanded ? 'bg-slate-50 dark:bg-slate-800/50 md:rounded-3xl' : ''}`}
            >
                <div className="col-span-5 flex items-center gap-4">
                    <div className="w-1.5 h-10 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span className="text-lg font-black tracking-tight">{item.sector}</span>
                </div>
                <div className="col-span-3 text-right font-black text-slate-600 dark:text-slate-300">₹{item.amount} Lakh Cr</div>
                <div className="col-span-2 text-right">
                    <div className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-black">{item.percentage_share}%</div>
                </div>
                <div className="col-span-2 text-right flex items-center justify-end gap-2">
                    <span className={`text-xs font-black ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isUp ? '+' : ''}{item.yoy_change}%
                    </span>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-8 bg-slate-50 dark:bg-slate-800/30 border-x border-slate-200 dark:border-slate-800 ml-10 rounded-2xl mb-4 space-y-6">
                            <h4 className="text-xs font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                                <Zap size={14} /> Major Schemes & Impacts
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {item.schemes?.map((scheme: any, i: number) => (
                                    <div key={i} className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="text-lg font-black italic tracking-tighter">{scheme.name}</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase">{scheme.ministry}</div>
                                            </div>
                                            <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] font-black tracking-widest">
                                                +{scheme.change}% FUNDING
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <div className="space-y-1">
                                                <div className="text-[10px] font-black text-slate-400 uppercase">Allocation</div>
                                                <div className="text-sm font-black">₹{scheme.amount} Cr</div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-[10px] font-black text-slate-400 uppercase">Coverage</div>
                                                <div className="text-sm font-black">{scheme.beneficiaries}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const ExpenditureItem = ({ label, value, total, color, desc }: any) => (
    <div className="space-y-3 group">
        <div className="flex justify-between items-end">
            <div>
                <div className="text-sm font-black uppercase tracking-tight">{label}</div>
                <div className="text-[10px] font-medium text-slate-400">{desc}</div>
            </div>
            <div className="text-right">
                <div className="text-xl font-black tracking-tighter">₹{value}T</div>
                <div className="text-[10px] font-bold text-slate-400 italic">{((value / total) * 100).toFixed(1)}% of total</div>
            </div>
        </div>
        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-1">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(value / total) * 100}%` }}
                className={`h-full ${color} rounded-full flex items-center justify-end px-2 group-hover:brightness-110 transition-all`}
            >
                <div className="w-1 h-1 bg-white/50 rounded-full"></div>
            </motion.div>
        </div>
    </div>
);

const ImpactCard = ({ icon, label, value }: any) => (
    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-emerald-400">{icon}</div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">{label}</span>
        </div>
        <span className="text-[11px] font-black uppercase tracking-widest text-emerald-500">{value}</span>
    </div>
);

const BenefitTag = ({ label, percentage }: any) => (
    <div className="flex flex-col gap-1 p-3 bg-white/5 border border-white/5 rounded-xl">
        <span className="text-[10px] font-bold text-slate-500 uppercase">{label}</span>
        <div className="flex items-baseline justify-between">
            <span className="text-lg font-black italic">{percentage}</span>
            <div className="text-[8px] text-emerald-500 font-black">IMPACT</div>
        </div>
    </div>
);

export default Budget;
