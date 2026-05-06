
import React, { useState } from 'react';
import {
    UploadCloud, FileText, CheckCircle2, AlertCircle,
    BarChart3, Search, Clock, Shield, ArrowRight,
    Loader2, Database, Zap, File
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
type DocType = 'Budget' | 'Circular' | 'Report';
type ProcessingStatus = 'idle' | 'uploading' | 'scanning' | 'extracting' | 'analyzing' | 'complete';

interface Document {
    id: string;
    name: string;
    type: DocType;
    size: string;
    uploadedAt: string;
    status: 'Processed' | 'Processing' | 'Failed';
    entities: number;
    sentiment: 'Positive' | 'Neutral' | 'Critical';
}

// --- Mock Data ---
const RECENT_DOCS: Document[] = [
    { id: '1', name: 'Union_Budget_2026.pdf', type: 'Budget', size: '4.2 MB', uploadedAt: '10 mins ago', status: 'Processed', entities: 145, sentiment: 'Positive' },
    { id: '2', name: 'RBI_Circular_Crypto_Reg.pdf', type: 'Circular', size: '1.8 MB', uploadedAt: '2 hrs ago', status: 'Processed', entities: 32, sentiment: 'Neutral' },
    { id: '3', name: 'NHAI_Annual_Report_25.pdf', type: 'Report', size: '12.5 MB', uploadedAt: '1 day ago', status: 'Processing', entities: 0, sentiment: 'Neutral' },
];

export const GovDocs: React.FC = () => {
    const [status, setStatus] = useState<ProcessingStatus>('idle');
    const [activeTab, setActiveTab] = useState<'upload' | 'dashboard'>('upload');

    const handleUpload = () => {
        setStatus('uploading');
        setTimeout(() => setStatus('scanning'), 1500);
        setTimeout(() => setStatus('extracting'), 3500);
        setTimeout(() => setStatus('analyzing'), 5500);
        setTimeout(() => {
            setStatus('complete');
            // Reset after showing success
            setTimeout(() => {
                setStatus('idle');
                setActiveTab('dashboard');
            }, 2000);
        }, 7500);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 animate-fade-in text-slate-900 dark:text-slate-100 font-sans">

            {/* Header */}
            <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-blue-600 rounded-lg text-white">
                            <Database size={20} />
                        </div>
                        <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">GovDoc Intelligence Platform</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                        Document <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Ingestion Engine</span>
                    </h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400 mt-4 max-w-2xl">
                        Upload official PDFs. Our AI extracts structured data, financial entities, and policy shifts instantly.
                    </p>
                </div>

                <div className="flex gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <TabButton active={activeTab === 'upload'} onClick={() => setActiveTab('upload')} icon={<UploadCloud size={16} />} label="Upload" />
                    <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<BarChart3 size={16} />} label="Intelligence Dashboard" />
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto">
                <AnimatePresence mode="wait">
                    {activeTab === 'upload' ? (
                        <motion.div
                            key="upload"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-12 border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

                            {status === 'idle' ? (
                                <div className="flex flex-col items-center justify-center text-center py-12">
                                    <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-8 border-2 border-dashed border-blue-200 dark:border-blue-700 animate-pulse-slow">
                                        <UploadCloud size={40} className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <h2 className="text-2xl font-bold mb-4">Drop Official Documents Here</h2>
                                    <p className="text-slate-500 mb-8 max-w-md">
                                        Supports .PDF (Vector/Scanned). <br />
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Budgets • Circulars • Gazettes</span>
                                    </p>

                                    <button
                                        onClick={handleUpload}
                                        className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/20 transition-all hover:scale-105 flex items-center gap-3"
                                    >
                                        <FileText size={20} /> Select PDF File
                                    </button>
                                </div>
                            ) : (
                                <ProcessingView status={status} />
                            )}
                        </motion.div>
                    ) : (
                        <DashboardView />
                    )}
                </AnimatePresence>

                {/* Recent Documents Strip */}
                <div className="mt-12">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                        <Clock size={16} /> Recently Processed
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {RECENT_DOCS.map(doc => (
                            <DocCard key={doc.id} doc={doc} />
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

// --- Sub-Components ---

const TabButton = ({ active, onClick, icon, label }: any) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${active
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
    >
        {icon} {label}
    </button>
);

const ProcessingView = ({ status }: { status: ProcessingStatus }) => {
    const steps = [
        { id: 'uploading', label: 'Uploading to Secure Vault', icon: <UploadCloud size={20} /> },
        { id: 'scanning', label: 'OCR & Layout Detection', icon: <Search size={20} /> },
        { id: 'extracting', label: 'Extracting Financial Entities', icon: <Database size={20} /> },
        { id: 'analyzing', label: 'Generating Analytics', icon: <BarChart3 size={20} /> },
    ];

    const currentStepIndex = steps.findIndex(s => s.id === status);
    const isComplete = status === 'complete';

    return (
        <div className="max-w-xl mx-auto py-8">
            {isComplete ? (
                <div className="text-center animate-scale-in">
                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-3xl font-black mb-2">Ingestion Complete</h2>
                    <p className="text-slate-500 font-medium">145 Data Points Extracted Successfully.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold animate-pulse">Processing Document Intelligence...</h2>
                        <p className="text-slate-400 text-sm font-mono mt-2">ID: DOC-2026-X99 • 4.2 MB</p>
                    </div>

                    <div className="space-y-4 relative">
                        {/* Connecting Line */}
                        <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-800 -z-10"></div>

                        {steps.map((step, idx) => {
                            const isActive = steps.findIndex(s => s.id === status) === idx;
                            const isPast = steps.findIndex(s => s.id === status) > idx;

                            return (
                                <div key={step.id} className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-500 ${isActive
                                        ? 'bg-blue-50 dark:bg-slate-800 border-blue-200 dark:border-slate-700 scale-105 shadow-lg'
                                        : isPast
                                            ? 'bg-white dark:bg-slate-900 border-transparent opacity-60'
                                            : 'bg-transparent border-transparent opacity-40'
                                    }`}>
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center border-4 transition-colors ${isActive ? 'bg-white border-blue-500 text-blue-600' :
                                            isPast ? 'bg-emerald-500 border-emerald-600 text-white' :
                                                'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                                        }`}>
                                        {isPast ? <CheckCircle2 size={24} /> : isActive ? <Loader2 size={24} className="animate-spin" /> : step.icon}
                                    </div>
                                    <div>
                                        <h4 className={`font-bold ${isActive ? 'text-blue-600' : 'text-slate-700 dark:text-slate-300'}`}>{step.label}</h4>
                                        {isActive && <span className="text-xs font-bold text-blue-400 uppercase tracking-wider animate-pulse">Running Model...</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

const DashboardView = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
    >
        {/* Left: Document Preview */}
        <div className="lg:col-span-1 bg-slate-200 dark:bg-slate-800 rounded-3xl h-[600px] p-4 flex items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/lined-paper.png')]"></div>
            <FileText size={64} className="text-slate-400 mb-4" />
            <div className="absolute bottom-6 left-6 right-6 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-lg">
                <h4 className="font-bold text-sm mb-1">Union_Budget_2026.pdf</h4>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="w-full h-full bg-emerald-500"></div>
                </div>
                <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 uppercase">
                    <span>145 Pages</span>
                    <span>100% Processed</span>
                </div>
            </div>
        </div>

        {/* Right: Intelligence */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-xl">
                <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                    <Zap size={20} className="text-amber-500" /> Extracted Highlights
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <HighlightCard label="Total Allocation" value="₹48.2L Cr" change="+12.5%" />
                    <HighlightCard label="Top Sector" value="Defence" change="₹6.2L Cr" />
                    <HighlightCard label="New Schemes" value="14" change="High Impact" />
                    <HighlightCard label="Fiscal Deficit" value="4.5%" change="-0.2%" good />
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-xl">
                <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                    <Shield size={20} className="text-emerald-500" /> Policy Shifts
                </h3>
                <div className="space-y-4">
                    <PolicyShift
                        title="Digital Rupee Infrastructure"
                        desc="Section 42.1 mentions a ₹5000cr corpus for CBDC pilot expansion in rural districts."
                        tag="Technology"
                    />
                    <PolicyShift
                        title="Green Hydrogen Mandate"
                        desc="New compliance requirement for heavy industries to adopt 15% green energy mix by 2027."
                        tag="Environment"
                    />
                </div>
            </div>
        </div>
    </motion.div>
);

const DocCard = ({ doc }: { doc: Document }) => (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all cursor-pointer group">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${doc.type === 'Budget' ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600' :
                    doc.type === 'Circular' ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-600' :
                        'bg-blue-100 dark:bg-blue-900/20 text-blue-600'
                }`}>
                <File size={20} />
            </div>
            {doc.status === 'Processed' && <CheckCircle2 size={18} className="text-emerald-500" />}
            {doc.status === 'Processing' && <Loader2 size={18} className="text-blue-500 animate-spin" />}
        </div>
        <h4 className="font-bold text-slate-900 dark:text-white mb-1 truncate">{doc.name}</h4>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-4">
            <span>{doc.size}</span>
            <span>•</span>
            <span>{doc.uploadedAt}</span>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{doc.type}</span>
            <div className="flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                View Insights <ArrowRight size={12} />
            </div>
        </div>
    </div>
);

const HighlightCard = ({ label, value, change, good }: any) => (
    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</div>
        <div className="text-2xl font-black text-slate-900 dark:text-white">{value}</div>
        <div className={`text-xs font-bold ${good || change.includes('+') ? 'text-emerald-500' : 'text-blue-500'}`}>{change}</div>
    </div>
);

const PolicyShift = ({ title, desc, tag }: any) => (
    <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
        <div className="w-1 h-full bg-blue-500 rounded-full shrink-0"></div>
        <div>
            <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{title}</h4>
                <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-[10px] font-bold rounded uppercase">{tag}</span>
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">{desc}</p>
        </div>
    </div>
);

export default GovDocs;
