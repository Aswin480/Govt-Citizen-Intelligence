import { useState } from 'react';
import { MOCK_BILLS } from '../data/constitution';
import { getParliBills } from '../services/api';
import { useEffect } from 'react';
import { ConstitutionalEngine, TraceVerdict } from '../utils/ConstitutionalEngine';
import { Scale, BookOpen, Scroll, AlertTriangle, Gavel, ShieldAlert, Cpu } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';

const ConstitutionExplorer = () => {
    const { config } = useConfig();
    const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
    const [traceResult, setTraceResult] = useState<TraceVerdict | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [realBills, setRealBills] = useState<any[]>([]);

    useEffect(() => {
        const fetchBills = async () => {
            try {
                const data = await getParliBills();
                setRealBills(data.records || data || []);
            } catch (error) {
                console.error("Failed to fetch real bills:", error);
            }
        };
        fetchBills();
    }, []);

    // Gemini State
    const [customBillText, setCustomBillText] = useState('');
    const [geminiError, setGeminiError] = useState<string | null>(null);

    const handleTrace = (id: string) => {
        setIsAnimating(true);
        setSelectedBillId(id);
        setGeminiError(null);
        
        // Find bill in mock or real lists
        const realBill = realBills.find(b => String(b.id) === id);
        
        setTimeout(() => {
            const result = ConstitutionalEngine.traceBill(id, realBill);
            setTraceResult(result);
            setIsAnimating(false);
        }, 1500);
    };

    const handleGeminiTrace = async () => {
        const apiKey = config.gemini_api_key;
        const model = config.gemini_model || "gemini-1.5-flash";

        if (!apiKey || !customBillText) {
            setGeminiError("API Key is missing from Admin Config, or Policy Text is empty.");
            return;
        }

        setIsAnimating(true);
        setSelectedBillId('custom');
        setGeminiError(null);

        try {
            const result = await ConstitutionalEngine.evaluateWithGemini(apiKey, customBillText, model);
            setTraceResult(result);
        } catch (error: any) {
            setGeminiError(error.message || "Gemini evaluation failed. Please check your API Key and try again.");
            setTraceResult(null);
        }
        setIsAnimating(false);
    };

    return (
        <div className="min-h-screen bg-[#fdfbf7] dark:bg-[#1a1a1a] text-slate-800 dark:text-slate-200 font-serif p-6">

            {/* Header */}
            <header className="mb-10 text-center relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-600 to-transparent opacity-50"></div>
                <h1 className="text-4xl font-bold flex items-center justify-center gap-3 text-amber-900 dark:text-amber-500 mt-6">
                    <Scale size={36} /> The Constitutional Compass
                </h1>
                <p className="text-slate-500 mt-2 font-sans text-sm tracking-widest uppercase">
                    Deterministic Legislative Analysis Engine
                </p>
            </header>

            <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* LEFT: The Docket (Bill Selection) & Custom Analysis */}
                <div className="lg:col-span-4 space-y-4">
                    {/* Gemini AI Integration */}
                    <div className="bg-amber-900/5 border-2 border-amber-500/30 p-6 rounded-lg shadow-sm relative overflow-hidden">
                        <div className="mb-4 text-amber-600 dark:text-amber-500 text-xs font-sans font-bold uppercase tracking-widest flex items-center gap-2">
                            <Cpu size={14} /> AI Policy Analysis
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Policy / Bill Text</label>
                                <textarea
                                    className="w-full h-32 bg-white dark:bg-black/50 border border-slate-300 dark:border-slate-700 rounded p-2 text-xs font-sans outline-none focus:border-amber-500 transition-colors resize-none"
                                    placeholder="Paste draft legislation or policy here..."
                                    value={customBillText}
                                    onChange={(e) => setCustomBillText(e.target.value)}
                                ></textarea>
                            </div>

                            {geminiError && (
                                <div className="text-red-500 text-xs font-bold bg-red-100 dark:bg-red-900/20 p-2 rounded">
                                    {geminiError}
                                </div>
                            )}

                            <button
                                onClick={handleGeminiTrace}
                                disabled={isAnimating}
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded uppercase text-xs tracking-widest transition-colors shadow-lg shadow-amber-600/20"
                            >
                                {isAnimating ? "Analyzing..." : "Analyze with Gemini"}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#252525] p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden">
                        <div className="heading-ornament mb-4 text-slate-400 text-xs font-sans font-bold uppercase tracking-widest flex items-center gap-2">
                            <Scroll size={14} /> Legislative Docket
                        </div>

                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {/* Real Bills */}
                            {realBills.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 dark:border-slate-800 pb-1">Real Data (Sansad)</p>
                                    {realBills.map(bill => (
                                        <div
                                            key={bill.id}
                                            onClick={() => handleTrace(String(bill.id))}
                                            className={`p-3 mb-2 rounded border cursor-pointer transition-all hover:bg-amber-50 dark:hover:bg-amber-900/10 ${selectedBillId === String(bill.id) ? 'bg-amber-50 border-amber-500 dark:bg-amber-900/20 dark:border-amber-600' : 'bg-slate-50 border-slate-100 dark:bg-black/10 dark:border-slate-800'}`}
                                        >
                                            <h3 className="font-bold text-xs mb-1 font-sans line-clamp-2">{bill.bill_name}</h3>
                                            <div className="flex justify-between items-center mt-1">
                                                <span className="text-[8px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 px-1.5 py-0.5 rounded font-bold uppercase">{bill.bill_type}</span>
                                                <span className="text-[9px] text-slate-400">{bill.bill_year}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Case Studies */}
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 dark:border-slate-800 pb-1">Case Studies (Mock)</p>
                            {MOCK_BILLS.map(bill => (
                                <div
                                    key={bill.id}
                                    onClick={() => handleTrace(bill.id)}
                                    className={`p-4 rounded border cursor-pointer transition-all hover:bg-amber-50 dark:hover:bg-amber-900/10 ${selectedBillId === bill.id ? 'bg-amber-50 border-amber-500 dark:bg-amber-900/20 dark:border-amber-600' : 'bg-slate-50 border-slate-200 dark:bg-black/20 dark:border-slate-700'}`}
                                >
                                    <h3 className="font-bold text-lg mb-1 font-sans">{bill.title}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{bill.description}</p>
                                    <div className="mt-3 flex gap-2">
                                        <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded uppercase font-bold tracking-wide">{bill.sector}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CENTRE: The Visual Trace (Animation Area) */}
                <div className="lg:col-span-8 relative">
                    {/* Placeholder State */}
                    {!selectedBillId && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                            <BookOpen size={64} className="mb-4 opacity-50" />
                            <p className="text-xl font-bold">Select a Bill to Trace</p>
                            <p className="text-sm text-center mt-2 max-w-md">
                                The engine will map the legislation against the Constitution of India, checking for Rights Violations, Federal Overreach, and Socio-Economic Impact.
                            </p>
                        </div>
                    )}

                    {/* Animation Overlay */}
                    {isAnimating && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 dark:bg-black/90 z-20 backdrop-blur-sm rounded-xl">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Scale size={24} className="text-amber-600" />
                                </div>
                            </div>
                            <h2 className="mt-6 text-xl font-bold text-amber-800 dark:text-amber-500 animate-pulse">Consulting the Constitution...</h2>
                            <p className="text-sm text-slate-500 font-mono mt-1">Scanning Article 14, 19, 21...</p>
                        </div>
                    )}

                    {/* RESULT VIEW */}
                    {traceResult && !isAnimating && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                            {/* 1. The Verdict Card */}
                            <div className="bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-200 dark:border-amber-800 p-6 rounded-xl shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Gavel size={120} />
                                </div>
                                <div className="relative z-10">
                                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-amber-900 dark:text-amber-100">
                                        <BookOpen className="text-amber-600" /> Constitutional Verdict
                                    </h2>

                                    {/* GRID STATS */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">

                                        {/* Jurisdiction */}
                                        <div className={`p-4 rounded-lg border flex flex-col items-center text-center ${traceResult.jurisdictionCheck.status === 'Valid' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                                            <span className="text-xs uppercase font-bold tracking-widest mb-1">Jurisdiction</span>
                                            <span className="text-lg font-bold">{traceResult.jurisdictionCheck.status}</span>
                                            <span className="text-[10px] mt-1 opacity-80">{traceResult.jurisdictionCheck.message}</span>
                                        </div>

                                        {/* Impact Winner */}
                                        <div className="p-4 rounded-lg border border-blue-100 bg-blue-50 text-blue-800 flex flex-col items-center text-center">
                                            <span className="text-xs uppercase font-bold tracking-widest mb-1">Primary Beneficiary</span>
                                            <span className="text-lg font-bold">{traceResult.socioEconomicImpact.winner}</span>
                                            <span className="text-[10px] mt-1 opacity-80">Gains most advantage</span>
                                        </div>

                                        {/* Protest Risk */}
                                        <div className={`p-4 rounded-lg border flex flex-col items-center text-center ${traceResult.protestPrediction.level === 'Severe' || traceResult.protestPrediction.level === 'High' ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                                            <span className="text-xs uppercase font-bold tracking-widest mb-1">Public Dissent Risk</span>
                                            <span className="text-lg font-bold flex items-center gap-1">
                                                {traceResult.protestPrediction.level === 'Severe' && <AlertTriangle size={16} />}
                                                {traceResult.protestPrediction.level}
                                            </span>
                                            <span className="text-[10px] mt-1 opacity-80">Group: {traceResult.protestPrediction.group.split('(')[1]?.replace(')', '') || 'None'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. The Detailed Trace (Articles & Precedent) */}
                            <div className="bg-white dark:bg-[#252525] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                                <div className="p-4 bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                                    <h3 className="font-bold flex items-center gap-2">
                                        <Scale size={18} className="text-indigo-600" /> Constitutional Map
                                    </h3>
                                    <span className="text-xs text-slate-400 font-mono text-right">{traceResult.constitutionalMatches.length} Articles Flagged</span>
                                </div>

                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {traceResult.constitutionalMatches.length === 0 ? (
                                        <div className="p-8 text-center text-slate-400">No specific constitutional conflicts detected.</div>
                                    ) : (
                                        traceResult.constitutionalMatches.map((match, idx) => (
                                            <div key={idx} className="p-6 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                                <div className="flex items-start gap-4">
                                                    <div className="min-w-[40px] text-2xl font-serif text-slate-300 font-bold">
                                                        {idx + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded border border-amber-200">
                                                                {match.article.article}
                                                            </span>
                                                            <h4 className="font-bold text-slate-700 dark:text-slate-200">{match.article.title}</h4>
                                                            {match.riskLevel === 'Violation' && (
                                                                <span className="ml-auto flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                                                                    <ShieldAlert size={12} /> VIOLATION RISK
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 italic">
                                                            "{match.article.description}"
                                                        </p>

                                                        {/* Precedent / Case Law Section */}
                                                        {match.precedents.length > 0 && (
                                                            <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-900/40">
                                                                <span className="text-[10px] uppercase font-bold text-indigo-500 mb-2 block flex items-center gap-1">
                                                                    <Gavel size={10} /> Precedent / Case Law
                                                                </span>
                                                                {match.precedents.map((c, i) => (
                                                                    <div key={i} className="mb-2 last:mb-0">
                                                                        <div className="font-bold text-indigo-900 dark:text-indigo-300 text-sm">
                                                                            {c.case_name} ({c.year})
                                                                        </div>
                                                                        <div className="text-xs text-indigo-800 dark:text-indigo-400 mt-0.5 font-serif italic">
                                                                            "{c.quote}"
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ConstitutionExplorer;
