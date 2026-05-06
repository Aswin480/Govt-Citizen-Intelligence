import { useState, useEffect, useRef } from 'react';

import { useVoiceCommand } from '../hooks/useVoiceCommand';
import { Activity, Users, Database, AlertTriangle, Shield, RefreshCw, Terminal, Search, Map, Mic, Settings as SettingsIcon, PenTool, Type, Save, ExternalLink, Radio, Plus, Layout as LayoutIcon, Box, RotateCcw, FileText, TrendingUp, TrendingDown } from 'lucide-react';
import { getStats, getDbStatus, triggerBackup, searchUsers, simulatePolicy, askOracle, getEvents, updateMember, deleteMember, processUrlExtraction, processPdfExtraction, createMember, getHouses, createScheme, updateScheme, deleteScheme } from '../services/api';
import WarRoom from '../components/WarRoom';
import { SystemHealth } from '../components/SystemHealth';
import { DailyBrief } from '../components/DailyBrief';
import Dashboard from './Dashboard';
import { StateDashboard } from './StateDashboard';
import { Layout } from '../components/Layout';
import { useConfig } from '../context/ConfigContext';
import Schemes from './Schemes';
import Citizens from './CitizenRegistry';
import Settings from './Settings';
import { GovernanceToggle } from '../components/GovernanceToggle';
import News from './News';
import Budget from './Budget';
import UserDashboard from './UserDashboard';
import { AdminConstitutionConfig } from '../components/AdminConstitutionConfig';

const AdminCommandCenter = () => {
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Global Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Alt + Tabs
            if (e.altKey && e.key === '1') setActiveTab('terminal');
            if (e.altKey && e.key === '2') setActiveTab('warroom');
            if (e.altKey && e.key === '3') setActiveTab('data');
            if (e.altKey && e.key === '4') setActiveTab('config');

            // Ctrl + K for Search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const [stats, setStats] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [dbStatus, setDbStatus] = useState<any>(null);
    const [houses, setHouses] = useState<any[]>([]);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [backupStatus, setBackupStatus] = useState<string>('');
    const [simPolicy, setSimPolicy] = useState('');
    const [simResult, setSimResult] = useState<any>(null);

    // Phase 4 State
    const [activeTab, setActiveTab] = useState<'terminal' | 'warroom' | 'config' | 'data' | 'extractor' | 'constitution'>('terminal'); // Added 'extractor'
    const [userPreviewPage, setUserPreviewPage] = useState('/'); // Phase 4: Data Management (User Preview) State
    const [oracleQuery, setOracleQuery] = useState('');
    const [oracleResponse, setOracleResponse] = useState<any>(null);
    const [isOracleLoading, setIsOracleLoading] = useState(false);

    // Extractor State
    const [extractUrl, setExtractUrl] = useState('');
    const [extractFile, setExtractFile] = useState<File | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractedData, setExtractedData] = useState<any[]>([]);
    const [activeDataset, setActiveDataset] = useState<any>(null);
    const [colMapping, setColMapping] = useState({ name: '', party: '', constituency: '' });
    const [targetConfig, setTargetConfig] = useState({ house_id: 1, state_id: '' });
    const [syncProgress, setSyncProgress] = useState(0);

    // Terminal State
    const [cmdHistory, setCmdHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [inputVal, setInputVal] = useState('');

    // Data Management State

    const [editingMember, setEditingMember] = useState<any>(null);
    const [editingScheme, setEditingScheme] = useState<any>(null);


    // Phase 5: Voice Command
    const { isListening, startListening } = useVoiceCommand((cmd) => {
        // Simple Command Parser
        if (cmd.includes('war room') || cmd.includes('map')) {
            setActiveTab('warroom');
            setLogs(prev => [`[VOICE] Command Recognized: SWITCH_TO_WARROOM`, ...prev]);
        }
        else if (cmd.includes('terminal') || cmd.includes('console')) {
            setActiveTab('terminal');
            setLogs(prev => [`[VOICE] Command Recognized: SWITCH_TO_TERMINAL`, ...prev]);
        }
        else if (cmd.includes('backup') || cmd.includes('save database')) {
            handleBackup();
            setLogs(prev => [`[VOICE] Command Recognized: INITIATE_BACKUP`, ...prev]);
        }
        else if (cmd.includes('refresh') || cmd.includes('status')) {
            fetchStats();
            setLogs(prev => [`[VOICE] Command Recognized: REFRESH_SYSTEM`, ...prev]);
        }
    });

    const { config: contextConfig, updateConfig, isDraftMode, setDraftMode, publishChanges, discardChanges, isVisualMode, toggleVisualMode } = useConfig();
    const [config, setConfig] = useState<any>(contextConfig || {});

    useEffect(() => {
        if (contextConfig) setConfig(contextConfig);
    }, [contextConfig]);

    // Live Preview Broadcaster
    useEffect(() => {
        if (editingMember) {
            const channel = new BroadcastChannel('admin-live-preview');
            channel.postMessage({ type: 'MEMBER_PREVIEW', data: editingMember });
            channel.close();
        }
    }, [editingMember]);

    useEffect(() => {
        if (editingScheme) {
            const channel = new BroadcastChannel('admin-live-preview');
            channel.postMessage({ type: 'SCHEME_PREVIEW', data: editingScheme });
            channel.close();
        }
    }, [editingScheme]);

    useEffect(() => {
        // Load initial stats
        fetchStats();
        fetchDbStatus();
        getHouses().then(setHouses).catch(console.error);

        // Note: pollEvents() disabled to prevent overwriting interactive terminal history.
        // User can manually fetch logs via terminal commands if needed.

        const interval = setInterval(() => {
            // Keep stats fresh
            fetchStats();
        }, 5000);

        return () => clearInterval(interval);
    }, []);



    const handleSaveMember = async () => {
        if (!editingMember) return;
        await updateMember(editingMember.id, editingMember);
        setEditingMember(null);
    };

    const handleDeleteMember = async (id: number) => {
        if (confirm('Delete member?')) {
            await deleteMember(id);

        }
    };

    const handleSaveScheme = async () => {
        if (!editingScheme) return;
        try {
            if (editingScheme.id) {
                await updateScheme(editingScheme.id, {
                    name: editingScheme.title,
                    description: editingScheme.description,
                    applicable_states: editingScheme.applicable_states,
                    eligible_occupations: editingScheme.eligibility,
                    income_limit: editingScheme.income_limit,
                    official_pdf_url: editingScheme.official_pdf_url
                });
                alert('Scheme updated successfully');
            } else {
                await createScheme({
                    name: editingScheme.title,
                    description: editingScheme.description,
                    applicable_states: editingScheme.applicable_states,
                    eligible_occupations: editingScheme.eligibility,
                    income_limit: editingScheme.income_limit,
                    official_pdf_url: editingScheme.official_pdf_url
                });
                alert('Scheme created successfully');
            }
            setEditingScheme(null);
        } catch (e) {
            console.error(e);
            alert('Failed to save scheme');
        }
    };

    const handleDeleteScheme = async (id: number) => {
        if (!confirm('Delete this scheme?')) return;
        try {
            await deleteScheme(id);
            setEditingScheme(null);
            alert('Scheme deleted');
        } catch (e) {
            console.error(e);
            alert('Delete failed');
        }
    };

    const handleConfigSave = async (key: string, value: string) => {
        try {
            await updateConfig(key, value);
            alert(`Successfully saved ${key}! If in Draft mode, remember to click Publish.`);
        } catch (e) {
            alert(`Failed to save ${key} to backend.`);
        }
    };

    const pollEvents = async () => {
        try {
            const events = await getEvents();
            const formattedLogs = events.map((e: any) =>
                `[${e.timestamp}][${e.level}] ${e.type}: ${e.message} `
            );
            setLogs(formattedLogs);
        } catch (e) { }
    };

    const fetchStats = async () => {
        try {
            const data = await getStats();
            setStats(data);
        } catch (e) {
            console.error("Failed to fetch stats", e);
        }
    };

    const fetchDbStatus = async () => {
        try {
            const status = await getDbStatus();
            setDbStatus(status);
        } catch (e) { }
    };

    const handleBackup = async () => {
        try {
            setBackupStatus('Backing up...');
            await triggerBackup();
            setBackupStatus('Backup Complete');
            setTimeout(() => setBackupStatus(''), 2000);
        } catch (e) {
            setBackupStatus('Failed');
        }
    };

    const handleOracle = async () => {
        if (!oracleQuery) return;
        setIsOracleLoading(true);
        try {
            const res = await askOracle(oracleQuery);
            setOracleResponse(res);
        } catch (e) {
            setOracleResponse({ answer: "Oracle Connection Failed." });
        }
        setIsOracleLoading(false);
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg-app)] text-white font-sans selection:bg-green-500/30">

            {/* Version Control Header */}
            <div className="bg-black/90 border-b border-green-900/50 p-4 flex justify-between items-center backdrop-blur-md sticky top-0 z-[60] shadow-2xl">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-green-500 text-xs font-mono uppercase tracking-widest">
                        <Terminal size={14} />
                        <span>System Context</span>
                    </div>
                    <div className="flex bg-slate-900/50 border border-green-900/30 rounded-lg p-1">
                        <button onClick={() => setDraftMode(false)} className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-[0.2em] transition-all ${!isDraftMode ? 'bg-green-600 text-black shadow-lg shadow-green-900/50' : 'text-slate-500 hover:text-white'}`}>Live Production</button>
                        <button onClick={() => setDraftMode(true)} className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-[0.2em] transition-all ${isDraftMode ? 'bg-amber-500 text-black shadow-lg shadow-amber-900/50' : 'text-slate-500 hover:text-white'}`}>Draft / Staging</button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {isDraftMode ? (
                        <>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg animate-fade-in">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                <span className="text-amber-500 text-[10px] font-bold uppercase tracking-widest">Draft Mode Active</span>
                            </div>
                            <div className="h-6 w-px bg-white/10"></div>
                            <button onClick={discardChanges} className="text-red-400 hover:text-red-300 text-[10px] font-bold uppercase tracking-widest hover:underline decoration-red-500/50 underline-offset-4">Reset Drafts</button>
                            <button onClick={publishChanges} className="bg-green-500 hover:bg-green-400 text-black px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(34,197,94,0.4)] flex items-center gap-2 hover:scale-105 transition-all">
                                <Save size={14} strokeWidth={3} /> Publish & Archive
                            </button>
                        </>
                    ) : (
                        <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                            <Shield size={12} /> Read-Only View
                        </div>
                    )}
                </div>
            </div>

            <div className="p-8 space-y-8 animate-fade-in pb-24 font-mono text-green-500">
                {/* Header */}
                <div className="flex justify-between items-center mb-8 border-b border-green-900 pb-4">
                    <div className="flex items-center gap-4">
                        <Shield size={32} />
                        <h1 className="text-3xl font-bold tracking-widest uppercase">Command Center <span className="text-xs align-top opacity-50">v3.0-WARLORD</span></h1>
                    </div>

                    {activeTab === 'data' && (
                        <div className="flex-1 flex justify-center">
                            <div className="bg-black/50 p-2 rounded-xl border border-green-900/50 backdrop-blur-xl scale-125">
                                <GovernanceToggle />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-4 text-xs">
                        <button
                            onClick={startListening}
                            className={`flex items - center gap - 2 px - 3 py - 1 rounded border transition - all ${isListening ? 'bg-red-900/50 border-red-500 text-red-400 animate-pulse' : 'bg-green-900/20 border-green-900 text-green-500 hover:bg-green-900/40'} `}
                        >
                            <Mic size={14} />
                            {isListening ? `LISTENING...` : "VOICE CONTROL"}
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            SYSTEM ONLINE
                        </div>
                    </div>
                </div>

                {/* Grid Layout */}
                <div className="grid grid-cols-12 gap-6">

                    {/* Critical Metrics (Top Row) */}
                    {activeTab !== 'data' && (
                        <>
                            <div className="col-span-12 md:col-span-3 border border-green-900 bg-green-950/10 p-4 rounded-lg relative overflow-hidden group hover:border-green-500/50 transition-all">
                                <div className="absolute -right-4 -top-4 opacity-[0.05] group-hover:opacity-[0.1] transition-all">
                                    <Users size={100} />
                                </div>
                                <div className="flex items-center gap-3 mb-2 opacity-70">
                                    <Users size={18} />
                                    <span className="text-sm uppercase">Active Citizens</span>
                                </div>
                                <div className="flex items-baseline gap-3">
                                    <div className="text-4xl font-bold tracking-tighter shadow-green-500/20 drop-shadow-lg">{stats?.totalCitizens || "---"}</div>
                                    <div className="text-xs text-green-400 font-bold flex items-center bg-green-900/40 px-1.5 py-0.5 rounded">
                                        <TrendingUp size={10} className="mr-1" /> +12.5%
                                    </div>
                                </div>
                                <div className="h-10 mt-2 w-full opacity-60">
                                    <svg className="w-full h-full stroke-green-500 fill-none" viewBox="0 0 100 20" preserveAspectRatio="none">
                                        <path d="M0 15 L10 12 L20 16 L30 10 L40 12 L50 8 L60 14 L70 5 L80 10 L90 4 L100 8" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                                        <path d="M0 15 L10 12 L20 16 L30 10 L40 12 L50 8 L60 14 L70 5 L80 10 L90 4 L100 8 V 20 H 0 Z" className="fill-green-500/10 stroke-none" />
                                    </svg>
                                </div>
                                <div className="text-xs opacity-50 mt-1">Total Digital Identities Issued</div>
                            </div>

                            <div className="col-span-12 md:col-span-3 border border-green-900 bg-green-950/10 p-4 rounded-lg relative overflow-hidden group hover:border-green-500/50 transition-all">
                                <div className="absolute -right-4 -top-4 opacity-[0.05] group-hover:opacity-[0.1] transition-all">
                                    <Activity size={100} />
                                </div>
                                <div className="flex items-center gap-3 mb-2 opacity-70">
                                    <Activity size={18} />
                                    <span className="text-sm uppercase">Public Sentiment</span>
                                </div>
                                <div className="flex items-baseline gap-3">
                                    <div className="text-4xl font-bold tracking-tighter">{stats?.avgSentiment || "---"}</div>
                                    <div className="text-xs text-amber-400 font-bold flex items-center bg-amber-900/40 px-1.5 py-0.5 rounded">
                                        <TrendingUp size={10} className="mr-1" /> +2.1%
                                    </div>
                                </div>
                                <div className="w-full bg-green-900/30 h-1.5 mt-4 rounded-full overflow-hidden">
                                    <div className="bg-gradient-to-r from-green-600 to-green-400 h-full relative" style={{ width: stats?.avgSentiment || '0%' }}>
                                        <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 animate-pulse"></div>
                                    </div>
                                </div>
                                <div className="flex justify-between mt-2 text-[10px] opacity-50 uppercase font-bold">
                                    <span>Negative</span>
                                    <span>Neutral</span>
                                    <span>Positive</span>
                                </div>
                            </div>

                            <div className="col-span-12 md:col-span-3 border border-green-900 bg-green-950/10 p-4 rounded-lg relative overflow-hidden group hover:border-green-500/50 transition-all">
                                <div className="absolute -right-4 -top-4 opacity-[0.05] group-hover:opacity-[0.1] transition-all">
                                    <Database size={100} />
                                </div>
                                <div className="flex items-center gap-3 mb-2 opacity-70">
                                    <Database size={18} />
                                    <span className="text-sm uppercase">Policy Database</span>
                                </div>
                                <div className="flex items-baseline gap-3">
                                    <div className="text-4xl font-bold tracking-tighter">{stats?.activeSchemes || "---"}</div>
                                    <div className="text-xs text-slate-400 font-bold flex items-center bg-slate-800 px-1.5 py-0.5 rounded">
                                        <RefreshCw size={10} className="mr-1" /> SYNCED
                                    </div>
                                </div>
                                <div className="h-10 mt-2 w-full opacity-60">
                                    <svg className="w-full h-full stroke-green-500 fill-none" viewBox="0 0 100 20" preserveAspectRatio="none">
                                        <path d="M0 18 L20 18 L25 10 L30 18 L50 18 L55 5 L60 18 L100 18" strokeWidth="1.5" strokeDasharray="4 2" />
                                    </svg>
                                </div>
                                <div className="text-xs opacity-50 mt-1">Active Schemes & Acts</div>
                            </div>

                            <div className="col-span-12 md:col-span-3 border border-red-900/50 bg-red-950/10 p-4 rounded-lg text-red-500 relative overflow-hidden group hover:border-red-500/50 transition-all hover:bg-red-950/20">
                                <div className="absolute -right-4 -top-4 opacity-[0.05] group-hover:opacity-[0.1] transition-all">
                                    <AlertTriangle size={100} />
                                </div>
                                <div className="flex items-center gap-3 mb-2 opacity-70">
                                    <AlertTriangle size={18} />
                                    <span className="text-sm uppercase">Critical Alerts</span>
                                </div>
                                <div className="text-4xl font-bold tracking-tighter">{stats?.criticalIssues || "0"}</div>
                                <div className="text-xs opacity-50 mt-1 animate-pulse font-bold text-red-400">REQUIRES IMMEDIATE ATTENTION</div>
                                {stats?.criticalIssues > 0 && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-500 animate-loading-bar"></div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Main Console Area (War Room / Terminal) */}
                    <div className={`col-span-12 ${activeTab === 'data' ? '' : 'md:col-span-8'} border border-green-900 bg-black p-0 rounded-lg relative overflow-hidden flex flex-col min-h-[500px]`}>
                        {/* Tabs */}
                        <div className="flex border-b border-green-900">
                            <button
                                onClick={() => setActiveTab('terminal')}
                                className={`px-6 py-3 text-sm font-bold uppercase flex items-center gap-2 hover:bg-green-900/20 transition-all ${activeTab === 'terminal' ? 'bg-green-900/30 text-white border-r border-green-900' : 'opacity-60'}`}
                            >
                                <Terminal size={16} /> System Terminal
                            </button>
                            <button
                                onClick={() => setActiveTab('warroom')}
                                className={`px-6 py-3 text-sm font-bold uppercase flex items-center gap-2 hover:bg-green-900/20 transition-all ${activeTab === 'warroom' ? 'bg-green-900/30 text-white border-r border-green-900' : 'opacity-60'}`}
                            >
                                <Map size={16} /> War Room <span className="text-[10px] bg-red-500 text-white px-1 rounded animate-pulse">LIVE</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('data')}
                                className={`px-6 py-3 text-sm font-bold uppercase flex items-center gap-2 hover:bg-green-900/20 transition-all ${activeTab === 'data' ? 'bg-green-900/30 text-white border-r border-green-900' : 'opacity-60'}`}
                            >
                                <Users size={16} /> Data Management
                            </button>
                            <button
                                onClick={() => setActiveTab('extractor')}
                                className={`px-6 py-3 text-sm font-bold uppercase flex items-center gap-2 hover:bg-green-900/20 transition-all ${activeTab === 'extractor' ? 'bg-green-900/30 text-white border-r border-green-900' : 'opacity-60'}`}
                            >
                                <Activity size={16} /> Scraper Health
                            </button>
                            <button
                                onClick={() => setActiveTab('config')}
                                className={`px-6 py-3 text-sm font-bold uppercase flex items-center gap-2 hover:bg-green-900/20 transition-all ${activeTab === 'config' ? 'bg-green-900/30 text-white border-r border-green-900' : 'opacity-60'}`}
                            >
                                <SettingsIcon size={16} /> System Config
                            </button>
                            <button
                                onClick={() => setActiveTab('constitution')}
                                className={`px-6 py-3 text-sm font-bold uppercase flex items-center gap-2 hover:bg-green-900/20 transition-all ${activeTab === 'constitution' ? 'bg-green-900/30 text-white border-r border-green-900' : 'opacity-60'}`}
                            >
                                <Shield size={16} /> Magna Carta
                            </button>
                            <button
                                onClick={() => window.location.href = '/admin/nexus'}
                                className={`px-6 py-3 text-sm font-bold uppercase flex items-center gap-2 hover:bg-emerald-900/20 transition-all text-emerald-500 opacity-80`}
                            >
                                <Map size={16} /> Nexus Graph
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 flex-1 relative overflow-y-auto">
                            {activeTab === 'terminal' ? (
                                <>
                                    {/* INTERACTIVE TERMINAL v2.0 */}
                                    <div className="flex flex-col h-[500px] font-mono text-sm bg-black p-2 rounded-lg border border-green-900/50 shadow-inner overflow-hidden">

                                        {/* Output Area */}
                                        <div className="flex-1 overflow-y-auto space-y-1 p-2 scrollbar-thin scrollbar-thumb-green-900/50">
                                            <div className="text-green-600 mb-4 opacity-70">
                                                Citizen Policy Intelligence (CPI) [Version 3.1.0]<br />
                                                (c) 2026 Admin Corp. All rights reserved.<br />
                                                Type 'help' for available commands.
                                            </div>

                                            {logs.map((log, i) => (
                                                <div key={i} className={`break-words ${log.startsWith('>') ? 'text-green-400 font-bold mt-2' : 'text-slate-300 opacity-90'}`}>
                                                    {log}
                                                </div>
                                            ))}
                                            <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
                                        </div>

                                        {/* Input Area */}
                                        <div className="flex items-center gap-2 border-t border-green-900/50 pt-2 px-2 pb-1 bg-green-900/5">
                                            <span className="text-green-500 font-bold animate-pulse">{'>'}</span>
                                            <input
                                                autoFocus
                                                type="text"
                                                className="flex-1 bg-transparent text-green-400 outline-none placeholder:text-green-900"
                                                placeholder="Enter system command..."
                                                value={inputVal}
                                                onChange={(e) => setInputVal(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Tab') {
                                                        e.preventDefault();
                                                        const cmds = ['help', 'status', 'clear', 'broadcast', 'sim', 'oracle', 'refresh', 'backup', 'cls', 'reset'];
                                                        const match = cmds.find(c => c.startsWith(inputVal.toLowerCase()));
                                                        if (match) setInputVal(match);
                                                    } else if (e.key === 'ArrowUp') {
                                                        e.preventDefault();
                                                        if (cmdHistory.length > 0) {
                                                            const newIndex = Math.min(historyIndex + 1, cmdHistory.length - 1);
                                                            setHistoryIndex(newIndex);
                                                            setInputVal(cmdHistory[cmdHistory.length - 1 - newIndex]);
                                                        }
                                                    } else if (e.key === 'ArrowDown') {
                                                        e.preventDefault();
                                                        if (historyIndex > 0) {
                                                            const newIndex = historyIndex - 1;
                                                            setHistoryIndex(newIndex);
                                                            setInputVal(cmdHistory[cmdHistory.length - 1 - newIndex]);
                                                        } else {
                                                            setHistoryIndex(-1);
                                                            setInputVal('');
                                                        }
                                                    } else if (e.key === 'Enter') {
                                                        const cmd = inputVal.trim();
                                                        if (!cmd) return;

                                                        // Add to logs & History
                                                        setLogs(prev => [...prev, `> ${cmd}`]);
                                                        setCmdHistory(prev => [...prev, cmd]);
                                                        setHistoryIndex(-1);
                                                        setInputVal('');

                                                        // PROCESS COMMANDS
                                                        const args = cmd.split(' ');
                                                        const main = args[0].toLowerCase();
                                                        const params = args.slice(1).join(' ');

                                                        switch (main) {
                                                            case 'help':
                                                                setLogs(prev => [...prev,
                                                                    'AVAILABLE COMMANDS:',
                                                                    '  status          - Show system health',
                                                                    '  clear (cls)     - Clear terminal',
                                                                    '  broadcast [msg] - Send alert',
                                                                    '  sim [policy]    - Run Simulation',
                                                                    '  oracle [query]  - Ask AI Oracle',
                                                                    '  refresh         - Refresh Data',
                                                                    '  backup          - Trigger Backup'
                                                                ]);
                                                                break;
                                                            case 'clear':
                                                            case 'cls':
                                                            case 'reset':
                                                                setLogs([
                                                                    'Citizen Policy Intelligence (CPI) [Version 3.1.0]',
                                                                    'Terminal Session Reset.',
                                                                    'System Ready.'
                                                                ]);
                                                                setSimResult(null);
                                                                setOracleResponse(null);
                                                                break;
                                                            case 'status':
                                                                const cpu = Math.floor(Math.random() * 30) + 10;
                                                                const mem = Math.floor(Math.random() * 40) + 20;
                                                                const bar = (val: number) => '[' + '█'.repeat(Math.floor(val / 10)) + '.'.repeat(10 - Math.floor(val / 10)) + ']';

                                                                setLogs(prev => [...prev,
                                                                    'SYSTEM DIAGNOSTICS:',
                                                                    '-------------------',
                                                                `CPU LOAD:   ${bar(cpu)} ${cpu}%`,
                                                                `MEMORY:     ${bar(mem)} ${mem}%`,
                                                                    `INTEGRITY:  [██████████] 100%`,
                                                                    `NODES:      4 ONLINE (SECURE)`
                                                                ]);
                                                                break;
                                                            case 'broadcast':
                                                                if (!params) { setLogs(prev => [...prev, 'Error: Message required. Usage: broadcast <message>']); break; }
                                                                setConfig({ ...config, alert_message: params });
                                                                setLogs(prev => [...prev, `[SUCCESS] Alert Broadcasted: "${params}"`]);
                                                                break;
                                                            case 'sim':
                                                                if (!params) { setLogs(prev => [...prev, 'Error: Policy required. Usage: sim <policy_text>']); break; }
                                                                setLogs(prev => [...prev, 'Running Simulation...']);
                                                                setSimPolicy(params);
                                                                // Trigger existing simulation logic (we can invoke it directly or simulate the button click conceptually)
                                                                (async () => {
                                                                    const res = await simulatePolicy(params);
                                                                    setSimResult({
                                                                        ...res,
                                                                        forecast: Array.from({ length: 12 }, () => Math.min(100, Math.max(10, 50 + Math.random() * 40 - 20))), // random fluctuation
                                                                        demographics: {
                                                                            urban: Math.floor(Math.random() * 80) + 20,
                                                                            rural: Math.floor(Math.random() * 80) + 20,
                                                                            youth: Math.floor(Math.random() * 90) + 10,
                                                                            senior: Math.floor(Math.random() * 60) + 20,
                                                                        }
                                                                    });
                                                                    setLogs(prev => [...prev, `SIMULATION COMPLETE: ${res.predicted_reaction} (${res.estimated_approval})`]);
                                                                })();
                                                                break;
                                                            case 'oracle':
                                                                if (!params) { setLogs(prev => [...prev, 'Error: Query required. Usage: oracle <question>']); break; }
                                                                setLogs(prev => [...prev, 'Consulting Oracle...']);
                                                                (async () => {
                                                                    try {
                                                                        const res = await askOracle(params);
                                                                        setLogs(prev => [...prev, `ORACLE: ${res.answer}`]);
                                                                    } catch {
                                                                        setLogs(prev => [...prev, 'ORACLE: Connection Failed.']);
                                                                    }
                                                                })();
                                                                break;
                                                            case 'refresh':
                                                                fetchStats();
                                                                setLogs(prev => [...prev, 'Stats Refreshed.']);
                                                                break;
                                                            case 'backup':
                                                                handleBackup();
                                                                setLogs(prev => [...prev, 'Backup Initiated...']);
                                                                break;
                                                            default:
                                                                setLogs(prev => [...prev, `Command not found: ${main}. Type 'help' for list.`]);
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Simulation Result Visualization (Only show if result exists) */}
                                    {simResult && (
                                        <div className="mt-4 bg-green-900/10 border border-green-900/50 rounded p-4 animate-fade-in mb-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <h3 className="font-bold text-green-400">LAST SIMULATION RESULT</h3>
                                                <button onClick={() => setSimResult(null)} className="text-xs text-green-700 hover:text-green-500">[DISMISS]</button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="text-3xl font-black">{simResult.predicted_reaction}</div>
                                                <div className="text-sm opacity-70 border-l border-green-900 pl-4">{simResult.estimated_approval}</div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : activeTab === 'constitution' ? (
                                <AdminConstitutionConfig />
                            ) : activeTab === 'data' ? (
                                <div className="animate-fade-in relative min-h-screen pb-20">
                                    {/* Edit Overlay Modal */}
                                    {editingMember && (
                                        <div className="fixed inset-0 z-[10000] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm god-mode-ignore">
                                            <div className="bg-black border-2 border-green-500 p-8 rounded-3xl w-full max-w-2xl shadow-[0_0_50px_rgba(34,197,94,0.2)] relative">
                                                <button onClick={() => setEditingMember(null)} className="absolute top-4 right-4 text-green-500 hover:text-white"><SettingsIcon size={20} /></button>

                                                <h3 className="text-2xl font-black uppercase mb-8 text-white flex items-center gap-3 tracking-tighter">
                                                    <span className="bg-green-500 text-black px-3 py-1 rounded-lg text-lg">EDIT</span>
                                                    {editingMember.id ? editingMember.name : 'New Member Protocol'}
                                                </h3>

                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="text-xs uppercase text-green-500 font-bold">Full Name</label>
                                                        <input className="w-full bg-green-900/10 border border-green-800 rounded-xl p-4 text-white focus:border-green-400 outline-none" value={editingMember.name} onChange={e => setEditingMember({ ...editingMember, name: e.target.value })} placeholder="Name" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs uppercase text-green-500 font-bold">Political Party</label>
                                                        <input className="w-full bg-green-900/10 border border-green-800 rounded-xl p-4 text-white focus:border-green-400 outline-none" value={editingMember.party} onChange={e => setEditingMember({ ...editingMember, party: e.target.value })} placeholder="Party" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs uppercase text-green-500 font-bold">Constituency / State</label>
                                                        <input className="w-full bg-green-900/10 border border-green-800 rounded-xl p-4 text-white focus:border-green-400 outline-none" value={editingMember.constituency || editingMember.state} onChange={e => setEditingMember({ ...editingMember, constituency: e.target.value })} placeholder="Constituency" />
                                                    </div>
                                                    <div className="space-y-2 col-span-2">
                                                        <label className="text-xs uppercase text-green-500 font-bold">House Allocation</label>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="text-[10px] uppercase text-green-500/70 mb-1 block">Type</label>
                                                                <select
                                                                    className="w-full bg-green-900/10 border border-green-800 rounded-xl p-3 text-white focus:border-green-400 outline-none text-sm"
                                                                    value={(() => {
                                                                        const h = houses.find(h => h.id === editingMember.house_id);
                                                                        if (!h) return 'lok_sabha';
                                                                        return h.type;
                                                                    })()}
                                                                    onChange={e => {
                                                                        const type = e.target.value;
                                                                        // Find first house of this type
                                                                        const h = houses.find(h => h.type === type);
                                                                        if (h) {
                                                                            setEditingMember({ ...editingMember, house_id: h.id, state_id: h.state || editingMember.state_id });
                                                                        }
                                                                    }}
                                                                >
                                                                    <option value="lok_sabha">Lok Sabha</option>
                                                                    <option value="rajya_sabha">Rajya Sabha</option>
                                                                    <option value="state_assembly">Vidhan Sabha (Assembly)</option>
                                                                </select>
                                                            </div>

                                                            {/* If State Assembly, show specific Assembly selection */}
                                                            {(() => {
                                                                const currentHouse = houses.find(h => h.id === editingMember.house_id);
                                                                const isAssembly = currentHouse?.type === 'state_assembly';

                                                                if (isAssembly) return (
                                                                    <div>
                                                                        <label className="text-[10px] uppercase text-green-500/70 mb-1 block">Select State Assembly</label>
                                                                        <select
                                                                            className="w-full bg-green-900/10 border border-green-800 rounded-xl p-3 text-white focus:border-green-400 outline-none text-sm"
                                                                            value={editingMember.house_id}
                                                                            onChange={e => {
                                                                                const newId = parseInt(e.target.value);
                                                                                const h = houses.find(x => x.id === newId);
                                                                                setEditingMember({ ...editingMember, house_id: newId, state_id: h?.state });
                                                                            }}
                                                                        >
                                                                            {houses
                                                                                .filter(h => h.type === 'state_assembly')
                                                                                .sort((a, b) => a.name.localeCompare(b.name))
                                                                                .map(h => (
                                                                                    <option key={h.id} value={h.id}>{h.name.replace(' Legislative Assembly', '')}</option>
                                                                                ))
                                                                            }
                                                                        </select>
                                                                    </div>
                                                                );
                                                                return null;
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-4 mt-8 pt-6 border-t border-green-900/50">
                                                    <button onClick={handleSaveMember} className="flex-[2] bg-green-500 text-black font-black py-4 rounded-xl hover:bg-white hover:scale-105 transition-all uppercase tracking-widest shadow-lg shadow-green-500/20">
                                                        {editingMember.id ? 'Save Changes' : 'Initialize Member'}
                                                    </button>

                                                    {editingMember.id && (
                                                        <button onClick={() => handleDeleteMember(editingMember.id)} className="flex-1 bg-red-500/10 text-red-500 border border-red-500/50 font-bold py-4 rounded-xl hover:bg-red-500 hover:text-white transition-colors uppercase tracking-widest">
                                                            Delete
                                                        </button>
                                                    )}

                                                    <button onClick={() => setEditingMember(null)} className="flex-1 bg-gray-800 text-white font-bold py-4 rounded-xl hover:bg-gray-700 uppercase tracking-widest">
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Scheme Editing Modal */}
                                    {editingScheme && (
                                        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-fade-in god-mode-ignore">
                                            <div className="bg-gradient-to-br from-green-950 to-black border-2 border-green-500/50 rounded-3xl p-8 max-w-3xl w-full shadow-[0_0_60px_rgba(34,197,94,0.3)] max-h-[90vh] overflow-y-auto">
                                                <h2 className="text-3xl font-black text-green-400 mb-6 uppercase tracking-widest flex items-center gap-3">
                                                    <FileText size={28} />
                                                    {editingScheme.id ? 'Edit Scheme' : 'New Scheme'}
                                                </h2>

                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="col-span-2">
                                                        <label className="text-xs uppercase text-green-500 font-bold">Scheme Title</label>
                                                        <input
                                                            className="w-full bg-green-900/10 border border-green-800 rounded-xl p-3 text-white mt-2 focus:border-green-400 outline-none"
                                                            value={editingScheme.title || ''}
                                                            onChange={e => setEditingScheme({ ...editingScheme, title: e.target.value })}
                                                            placeholder="e.g., National Solar Energy Mission"
                                                        />
                                                    </div>

                                                    <div className="col-span-2">
                                                        <label className="text-xs uppercase text-green-500 font-bold">Description</label>
                                                        <textarea
                                                            className="w-full bg-green-900/10 border border-green-800 rounded-xl p-3 text-white mt-2 focus:border-green-400 outline-none min-h-[100px]"
                                                            value={editingScheme.description || ''}
                                                            onChange={e => setEditingScheme({ ...editingScheme, description: e.target.value })}
                                                            placeholder="Describe the scheme benefits and objectives..."
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-xs uppercase text-green-500 font-bold">Eligibility Criteria</label>
                                                        <input
                                                            className="w-full bg-green-900/10 border border-green-800 rounded-xl p-3 text-white mt-2 focus:border-green-400 outline-none"
                                                            value={editingScheme.eligibility || ''}
                                                            onChange={e => setEditingScheme({ ...editingScheme, eligibility: e.target.value })}
                                                            placeholder="e.g., Homeowners with >500sqft roof"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-xs uppercase text-green-500 font-bold">Beneficiaries</label>
                                                        <input
                                                            className="w-full bg-green-900/10 border border-green-800 rounded-xl p-3 text-white mt-2 focus:border-green-400 outline-none"
                                                            value={editingScheme.beneficiaries || ''}
                                                            onChange={e => setEditingScheme({ ...editingScheme, beneficiaries: e.target.value })}
                                                            placeholder="e.g., 2.4M Households"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-xs uppercase text-green-500 font-bold">Status</label>
                                                        <select
                                                            className="w-full bg-green-900/10 border border-green-800 rounded-xl p-3 text-white mt-2 focus:border-green-400 outline-none"
                                                            value={editingScheme.status || 'Active'}
                                                            onChange={e => setEditingScheme({ ...editingScheme, status: e.target.value })}
                                                        >
                                                            <option value="Active">Active</option>
                                                            <option value="Upcoming">Upcoming</option>
                                                            <option value="Closed">Closed</option>
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="text-xs uppercase text-green-500 font-bold">Funding Type</label>
                                                        <input
                                                            className="w-full bg-green-900/10 border border-green-800 rounded-xl p-3 text-white mt-2 focus:border-green-400 outline-none"
                                                            value={editingScheme.funding_type || ''}
                                                            onChange={e => setEditingScheme({ ...editingScheme, funding_type: e.target.value })}
                                                            placeholder="e.g., Central Govt, State Govt"
                                                        />
                                                    </div>

                                                    <div className="col-span-2">
                                                        <label className="text-xs uppercase text-green-500 font-bold">Official PDF URL</label>
                                                        <input
                                                            className="w-full bg-green-900/10 border border-green-800 rounded-xl p-3 text-white mt-2 focus:border-green-400 outline-none"
                                                            value={editingScheme.official_pdf_url || ''}
                                                            onChange={e => setEditingScheme({ ...editingScheme, official_pdf_url: e.target.value })}
                                                            placeholder="https://example.gov.in/scheme-document.pdf"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex gap-4 mt-8 pt-6 border-t border-green-900/50">
                                                    <button onClick={handleSaveScheme} className="flex-[2] bg-green-500 text-black font-black py-4 rounded-xl hover:bg-white hover:scale-105 transition-all uppercase tracking-widest shadow-lg shadow-green-500/20">
                                                        {editingScheme.id ? 'Save Changes' : 'Create Scheme'}
                                                    </button>

                                                    {editingScheme.id && (
                                                        <button onClick={() => handleDeleteScheme(editingScheme.id)} className="flex-1 bg-red-500/10 text-red-500 border border-red-500/50 font-bold py-4 rounded-xl hover:bg-red-500 hover:text-white transition-colors uppercase tracking-widest">
                                                            Delete
                                                        </button>
                                                    )}

                                                    <button onClick={() => setEditingScheme(null)} className="flex-1 bg-gray-800 text-white font-bold py-4 rounded-xl hover:bg-gray-700 uppercase tracking-widest">
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Full User Dashboard View (1:1 with User Side) */}
                                    <div className="relative animate-fade-in -m-4">
                                        {/* Embedded User Layout with Admin Navigation Control */}
                                        <Layout
                                            className="h-[850px] rounded-[3rem] border-4 border-green-900/30 shadow-2xl overflow-hidden isolation-auto"
                                            onAdminNavigate={(page) => setUserPreviewPage(page)}
                                            currentAdminPage={userPreviewPage}
                                        >
                                            {userPreviewPage === '/' && <Dashboard adminMode={true} onEditMember={setEditingMember} />}
                                            {userPreviewPage === '/citizens' && <Citizens />}
                                            {userPreviewPage === '/schemes' && <Schemes adminMode={true} onEditScheme={setEditingScheme} />}
                                            {userPreviewPage === '/budget' && <Budget />}
                                            {userPreviewPage === '/news' && <News />}
                                            {userPreviewPage === '/my-portal' && <UserDashboard />}
                                            {userPreviewPage === '/state' && <StateDashboard />}
                                            {userPreviewPage === '/settings' && <Settings />}
                                        </Layout>

                                        {/* Visual Builder Trigger */}
                                        <button
                                            onClick={toggleVisualMode}
                                            className={`fixed bottom-28 right-10 z-50 px-6 py-4 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-110 transition-all flex items-center gap-3 font-black uppercase text-sm tracking-widest ${isVisualMode ? 'bg-amber-500 text-black animate-pulse' : 'bg-white text-black'}`}
                                            title="Click elements to edit style/content"
                                        >
                                            <PenTool size={20} strokeWidth={3} /> {isVisualMode ? 'Exit Visual Mode' : 'Visual Builder'}
                                        </button>

                                        {/* Floating Add Button */}
                                        <button
                                            onClick={() => setEditingMember({ name: '', party: '', house_id: 1, house: 'lok_sabha' })}
                                            className="fixed bottom-10 right-10 z-50 bg-green-500 text-black px-6 py-4 rounded-full shadow-[0_0_20px_rgba(34,197,94,0.6)] hover:scale-110 hover:shadow-[0_0_40px_rgba(34,197,94,0.8)] transition-all flex items-center gap-3 font-black uppercase text-sm tracking-widest"
                                        >
                                            <Plus size={20} strokeWidth={3} /> New Member
                                        </button>

                                        {/* Admin Badge */}
                                        <div className="absolute top-6 left-6 z-40 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase opacity-50 hover:opacity-100 pointer-events-none">
                                            Admin Edit Mode
                                        </div>
                                    </div>
                                </div>
                            ) : activeTab === 'extractor' ? (
                                <div className="animate-fade-in p-4 space-y-6">
                                    <div className="bg-green-900/10 border border-green-900 p-6 rounded-xl">
                                        <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-green-400 uppercase tracking-widest">
                                            <Database /> External Data Ingestion
                                        </h2>

                                        <div className="grid grid-cols-2 gap-8">
                                            {/* Input Section */}
                                            <div className="space-y-6">
                                                <div>
                                                    <label className="block text-xs uppercase opacity-70 mb-2 font-bold">Source Type</label>
                                                    <div className="flex bg-black border border-green-900 rounded-lg p-1">
                                                        <button
                                                            onClick={() => setExtractFile(null)}
                                                            className={`flex-1 py-2 text-xs font-bold uppercase rounded transition-all ${!extractFile ? 'bg-green-600 text-black' : 'text-gray-500 hover:text-white'}`}
                                                        >
                                                            Website URL
                                                        </button>
                                                        <button
                                                            onClick={() => setExtractUrl('')}
                                                            className={`flex-1 py-2 text-xs font-bold uppercase rounded transition-all ${extractFile ? 'bg-green-600 text-black' : 'text-gray-500 hover:text-white'}`}
                                                        >
                                                            PDF Document
                                                        </button>
                                                    </div>
                                                </div>

                                                {!extractFile ? (
                                                    <div>
                                                        <label className="block text-xs uppercase opacity-70 mb-2 font-bold">Target URL</label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                className="flex-1 bg-black border border-green-900 rounded p-3 text-sm focus:border-green-500 outline-none font-mono"
                                                                placeholder="https://sansad.in/ls/members"
                                                                value={extractUrl}
                                                                onChange={e => setExtractUrl(e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <label className="block text-xs uppercase opacity-70 mb-2 font-bold">Upload PDF</label>
                                                        <div className="border-2 border-dashed border-green-900 rounded-lg p-8 text-center hover:border-green-500 transition-colors cursor-pointer relative">
                                                            <input
                                                                type="file"
                                                                accept=".pdf"
                                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                                onChange={e => setExtractFile(e.target.files ? e.target.files[0] : null)}
                                                            />
                                                            <FileText className="block mx-auto mb-2 text-green-500" size={32} />
                                                            <span className="text-sm font-bold block">{extractFile ? extractFile.name : "Click to Upload Member List PDF"}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                <button
                                                    onClick={async () => {
                                                        setIsExtracting(true);
                                                        setLogs(prev => [...prev, `[EXTRACT] Starting extraction from ${extractFile ? 'PDF' : extractUrl}...`]);
                                                        try {
                                                            let res;
                                                            if (extractFile) {
                                                                res = await processPdfExtraction(extractFile);
                                                            } else {
                                                                res = await processUrlExtraction(extractUrl);
                                                            }

                                                            if (res.status === 'success' && res.datasets) {
                                                                setExtractedData(res.datasets);
                                                                if (res.datasets.length > 0) setActiveDataset(res.datasets[0]);
                                                                setLogs(prev => [...prev, `[EXTRACT] Success! Found ${res.datasets.length} tables.`]);
                                                            } else {
                                                                setLogs(prev => [...prev, `[EXTRACT] Failed: ${res.message || 'Unknown Error'}`]);
                                                            }
                                                        } catch (e) {
                                                            console.error(e);
                                                            setLogs(prev => [...prev, `[EXTRACT] Error: System Failure`]);
                                                        }
                                                        setIsExtracting(false);
                                                    }}
                                                    disabled={isExtracting || (!extractUrl && !extractFile)}
                                                    className="w-full bg-green-500 text-black font-black py-4 rounded-xl uppercase tracking-widest hover:scale-105 transition-transform disabled:opacity-50 disabled:grayscale shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                                                >
                                                    {isExtracting ? 'ANALYZING...' : 'INITIATE EXTRACTION'}
                                                </button>
                                            </div>

                                            {/* Results Preview & Sync */}
                                            <div className="border border-green-900 rounded-lg bg-black p-4 flex flex-col h-[400px]">
                                                {extractedData.length > 0 ? (
                                                    <>
                                                        <div className="flex justify-between items-center mb-4 border-b border-green-900 pb-2">
                                                            <select
                                                                className="bg-green-900/20 border border-green-900 rounded p-1 text-xs"
                                                                onChange={(e) => setActiveDataset(extractedData.find(d => d.id === e.target.value))}
                                                            >
                                                                {extractedData.map(d => <option key={d.id} value={d.id}>{d.title} ({d.data.length} rows)</option>)}
                                                            </select>
                                                            <span className="text-xs text-green-500 font-bold">{activeDataset?.data?.length} Records Found</span>
                                                        </div>

                                                        <div className="flex-1 overflow-auto border border-green-900/30 rounded mb-4 scrollbar-thin scrollbar-thumb-green-900">
                                                            <table className="w-full text-xs text-left">
                                                                <thead className="sticky top-0 bg-green-900 text-black font-bold">
                                                                    <tr>
                                                                        {activeDataset?.columns?.map((c: string) => <th key={c} className="p-2">{c}</th>)}
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {activeDataset?.data?.slice(0, 50).map((row: any, i: number) => (
                                                                        <tr key={i} className="border-b border-green-900/30 font-mono text-gray-400 hover:bg-green-900/10">
                                                                            {activeDataset.columns.map((c: string) => <td key={c} className="p-2 whitespace-nowrap">{row[c]?.toString().slice(0, 30)}</td>)}
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>

                                                        {/* Mapping Config */}
                                                        <div className="bg-green-900/10 p-4 rounded border border-green-900 space-y-4">
                                                            <div className="grid grid-cols-3 gap-2">
                                                                {['name', 'party', 'constituency'].map(field => (
                                                                    <div key={field}>
                                                                        <label className="block text-[10px] uppercase opacity-70 mb-1">{field} Column</label>
                                                                        <select
                                                                            className="w-full bg-black border border-green-900 rounded p-1 text-xs"
                                                                            onChange={(e) => setColMapping({ ...colMapping, [field]: e.target.value })}
                                                                        >
                                                                            <option value="">Select...</option>
                                                                            {activeDataset?.columns?.map((c: string) => <option key={c} value={c}>{c}</option>)}
                                                                        </select>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div>
                                                                    <label className="block text-[10px] uppercase opacity-70 mb-1">Target House</label>
                                                                    <select
                                                                        className="w-full bg-black border border-green-900 rounded p-1 text-xs"
                                                                        onChange={(e) => setTargetConfig({ ...targetConfig, house_id: parseInt(e.target.value) })}
                                                                    >
                                                                        <option value={1}>Lok Sabha</option>
                                                                        <option value={2}>Rajya Sabha</option>
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] uppercase opacity-70 mb-1">State ID (Optional)</label>
                                                                    <input
                                                                        className="w-full bg-black border border-green-900 rounded p-1 text-xs"
                                                                        placeholder="e.g. AP, KL"
                                                                        onChange={(e) => setTargetConfig({ ...targetConfig, state_id: e.target.value })}
                                                                    />
                                                                </div>
                                                            </div>

                                                        </div>

                                                        {/* Connection Verification Preview */}
                                                        {colMapping.name && colMapping.party && activeDataset?.data?.length > 0 && (
                                                            <div className="bg-green-900/20 p-3 rounded border border-green-500/30">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                                                    <h4 className="text-[10px] uppercase font-bold text-green-400">Connection Preview (Row 1)</h4>
                                                                </div>
                                                                <div className="text-xs font-mono space-y-1 bg-black/50 p-2 rounded">
                                                                    <div className="flex justify-between border-b border-white/10 pb-1 mb-1">
                                                                        <span className="opacity-50">Source:</span>
                                                                        <span className="opacity-50">Destination:</span>
                                                                    </div>
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="text-gray-400">"{activeDataset.data[0][colMapping.name]?.toString().slice(0, 15)}..."</span>
                                                                        <span className="text-green-500">→ Member Name</span>
                                                                    </div>
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="text-gray-400">"{activeDataset.data[0][colMapping.party]?.toString().slice(0, 15)}..."</span>
                                                                        <span className="text-green-500">→ Political Party</span>
                                                                    </div>
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="text-amber-500 font-bold">New Record</span>
                                                                        <span className="text-amber-500">→ {targetConfig.house_id === 1 ? 'Lok Sabha' : 'Rajya Sabha'}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <button
                                                            onClick={async () => {
                                                                if (!colMapping.name || !colMapping.party) { alert("Please map Name and Party columns!"); return; }
                                                                if (!activeDataset?.data) return;

                                                                setSyncProgress(1);
                                                                let count = 0;
                                                                for (const row of activeDataset.data) {
                                                                    const payload = {
                                                                        name: row[colMapping.name],
                                                                        party: row[colMapping.party],
                                                                        constituency: row[colMapping.constituency] || "State Representative",
                                                                        house_id: targetConfig.house_id,
                                                                        state_id: targetConfig.state_id,
                                                                        profile_image: `https://ui-avatars.com/api/?name=${row[colMapping.name]}&background=random`
                                                                    };
                                                                    try {
                                                                        await createMember(payload);
                                                                        count++;
                                                                        setSyncProgress(Math.floor((count / activeDataset.data.length) * 100));
                                                                    } catch (e) { console.error(e); }
                                                                }
                                                                setLogs(prev => [...prev, `[SYNC] complete. Added ${count} members.`]);
                                                                setSyncProgress(0);
                                                                alert(`Successfully synced ${count} members to database!`);
                                                            }}
                                                            className="w-full bg-amber-500 text-black font-bold py-2 rounded text-xs uppercase"
                                                        >
                                                            {syncProgress > 0 ? `SYNCING... ${syncProgress}%` : 'SYNC TO DATABASE'}
                                                        </button>
                                                    </>
                                                ) : (
                                                    <div className="flex-1 flex items-center justify-center text-gray-600 text-sm italic">
                                                        No extraction data. Run extraction to see results.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : activeTab === 'warroom' ? (
                                <WarRoom />
                            ) : (
                                <div className="animate-fade-in p-2">
                                    <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                                        <SettingsIcon className="text-green-400" /> SYSTEM CONFIGURATION
                                    </h2>

                                    <div className="grid grid-cols-2 gap-8">
                                        {/* Visual Theme Engine */}
                                        <div className="bg-green-900/10 border border-green-900 p-4 rounded-lg">
                                            <div className="flex items-center gap-2 mb-4 border-b border-green-900/50 pb-2">
                                                <PenTool size={16} />
                                                <h3 className="font-bold uppercase text-sm">Visual Theme Engine</h3>
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs uppercase opacity-70 mb-1">Primary Color (Hex)</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="color"
                                                            className="bg-transparent border border-green-900 rounded h-8 w-12 cursor-pointer"
                                                            value={config.primary_color || "#FF9933"}
                                                            onChange={(e) => handleConfigSave('primary_color', e.target.value)}
                                                        />
                                                        <input
                                                            type="text"
                                                            className="flex-1 bg-black border border-green-900 rounded px-2 text-sm font-mono"
                                                            value={config.primary_color || "#FF9933"}
                                                            onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                                                        />
                                                        <button
                                                            onClick={() => handleConfigSave('primary_color', config.primary_color)}
                                                            className="bg-green-900/30 hover:bg-green-900/50 p-2 rounded border border-green-900"
                                                        >
                                                            <Save size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs uppercase opacity-70 mb-1">Corner Radius</label>
                                                    <select
                                                        className="w-full bg-black border border-green-900 rounded p-2 text-sm"
                                                        value={config.border_radius || "rounded"}
                                                        onChange={(e) => handleConfigSave('border_radius', e.target.value)}
                                                    >
                                                        <option value="rounded">Rounded (Standard)</option>
                                                        <option value="sharp">Sharp (Professional)</option>
                                                        <option value="pill">Pill (Modern)</option>
                                                    </select>
                                                </div>
                                                <div className="flex items-center gap-2 pt-2">
                                                    <input
                                                        type="checkbox"
                                                        className="accent-green-500 w-4 h-4"
                                                        checked={config.glassmorphism === 'true'}
                                                        onChange={(e) => handleConfigSave('glassmorphism', e.target.checked ? 'true' : 'false')}
                                                    />
                                                    <span className="text-sm">Enable Glassmorphism</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Text & Alerts */}
                                        {/* System Operations & Feature Flags */}
                                        <div className="bg-green-900/10 border border-green-900 p-4 rounded-lg flex flex-col gap-6">
                                            <div className="flex items-center gap-2 border-b border-green-900/50 pb-2">
                                                <SettingsIcon size={16} />
                                                <h3 className="font-bold uppercase text-sm">System Operations</h3>
                                            </div>

                                            {/* Session Name */}
                                            <div>
                                                <label className="block text-xs uppercase opacity-70 mb-1">Current Session Name</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        className="flex-1 bg-black border border-green-900 rounded px-2 py-1 text-sm outline-none focus:border-green-500 transition-colors"
                                                        value={config.session_name || ""}
                                                        onChange={(e) => setConfig({ ...config, session_name: e.target.value })}
                                                        placeholder="e.g. Budget Session 2026"
                                                    />
                                                    <button
                                                        onClick={() => handleConfigSave('session_name', config.session_name)}
                                                        className="bg-green-900/30 hover:bg-green-900/50 p-2 rounded border border-green-900 text-green-400"
                                                    >
                                                        <Save size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Feature Flags */}
                                            <div>
                                                <label className="block text-xs uppercase opacity-70 mb-2">Feature Flags</label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {[
                                                        { key: 'maintenance_mode', label: 'Maintenance Mode', danger: true },
                                                        { key: 'public_registration', label: 'Public Registration' },
                                                        { key: 'beta_features', label: 'Beta Features' },
                                                        { key: 'system_logs', label: 'Verbose Logging' }
                                                    ].map(flag => (
                                                        <button
                                                            key={flag.key}
                                                            onClick={() => handleConfigSave(flag.key, config[flag.key] === 'true' ? 'false' : 'true')}
                                                            className={`flex items-center justify-between p-2 rounded border transition-all ${config[flag.key] === 'true' ? (flag.danger ? 'bg-red-900/20 border-red-500' : 'bg-green-500/20 border-green-500') : 'bg-black border-green-900 opacity-60 hover:opacity-100'}`}
                                                        >
                                                            <span className={`text-[10px] font-bold uppercase ${flag.danger && config[flag.key] === 'true' ? 'text-red-400' : 'text-gray-300'}`}>{flag.label}</span>
                                                            <div className={`w-8 h-4 rounded-full relative transition-colors ${config[flag.key] === 'true' ? (flag.danger ? 'bg-red-500' : 'bg-green-500') : 'bg-gray-700'}`}>
                                                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all`} style={{ left: config[flag.key] === 'true' ? '18px' : '2px' }} />
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Danger Zone */}
                                            <div className="pt-4 border-t border-red-900/30">
                                                <label className="block text-xs uppercase opacity-70 mb-2 text-red-500 flex items-center gap-2"><AlertTriangle size={12} /> Danger Zone</label>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setLogs(prev => [...prev, 'SYSTEM: Cache Flushed successfully.'])}
                                                        className="flex-1 bg-red-900/10 hover:bg-red-900/30 border border-red-900 text-red-500 p-2 rounded text-[10px] font-black uppercase transition-colors"
                                                    >
                                                        Flush Cache
                                                    </button>
                                                    <button
                                                        onClick={() => setLogs(prev => [...prev, 'SYSTEM: Factory Reset Initiated (Simulated).'])}
                                                        className="flex-1 bg-red-500 hover:bg-white hover:text-red-600 text-black border border-red-500 p-2 rounded text-[10px] font-black uppercase transition-all shadow-[0_0_10px_rgba(239,68,68,0.4)]"
                                                    >
                                                        Factory Reset
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* AI Configuration Engine */}
                                        <div className="bg-green-900/10 border border-green-900 p-4 rounded-lg flex flex-col gap-6">
                                            <div className="flex items-center gap-2 border-b border-green-900/50 pb-2">
                                                <Database size={16} className="text-amber-500" />
                                                <h3 className="font-bold uppercase text-sm text-amber-500">AI Engine Configuration</h3>
                                            </div>

                                            {/* Gemini API Key */}
                                            <div>
                                                <label className="block text-xs uppercase opacity-70 mb-1">Gemini API Key</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="password"
                                                        className="flex-1 bg-black border border-green-900 rounded px-2 py-1 text-sm outline-none focus:border-green-500 transition-colors"
                                                        value={config.gemini_api_key || ""}
                                                        onChange={(e) => setConfig({ ...config, gemini_api_key: e.target.value })}
                                                        placeholder="AIza..."
                                                    />
                                                    <button
                                                        onClick={() => handleConfigSave('gemini_api_key', config.gemini_api_key)}
                                                        className="bg-green-900/30 hover:bg-green-900/50 p-2 rounded border border-green-900 text-green-400"
                                                        title="Save API Key"
                                                    >
                                                        <Save size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Gemini AI Model */}
                                            <div>
                                                <label className="block text-xs uppercase opacity-70 mb-1">Constitutional AI Model</label>
                                                <div className="flex gap-2">
                                                    <select
                                                        className="flex-1 bg-black border border-green-900 rounded px-2 py-1 text-sm outline-none focus:border-green-500 transition-colors"
                                                        value={config.gemini_model || "gemini-1.5-flash"}
                                                        onChange={(e) => {
                                                            const newModel = e.target.value;
                                                            setConfig({ ...config, gemini_model: newModel });
                                                            handleConfigSave('gemini_model', newModel);
                                                        }}
                                                    >
                                                        <option value="gemini-2.5-pro">Gemini 2.5 Pro (Most Capable)</option>
                                                        <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fastest)</option>
                                                        <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                                                        <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Emergency Broadcast System */}
                                        <div className="bg-red-900/10 border border-red-900 p-4 rounded-lg col-span-2">
                                            <div className="flex items-center gap-2 mb-4 border-b border-red-900/50 pb-2">
                                                <Radio className="text-red-500 animate-pulse" size={16} />
                                                <h3 className="font-bold uppercase text-sm text-red-500">Emergency Broadcast System</h3>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs uppercase opacity-70 mb-1">Broadcast Message</label>
                                                    <textarea
                                                        className="w-full bg-black border border-red-900 rounded p-2 text-sm text-white focus:border-red-500 outline-none h-24"
                                                        placeholder="ENTER EMERGENCY MESSAGE..."
                                                        value={config.emergency_broadcast_text || ""}
                                                        onChange={(e) => setConfig({ ...config, emergency_broadcast_text: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-xs uppercase opacity-70 mb-1">Severity Level</label>
                                                        <select
                                                            className="w-full bg-black border border-red-900 rounded p-2 text-sm text-white"
                                                            value={config.emergency_broadcast_level || "info"}
                                                            onChange={(e) => handleConfigSave('emergency_broadcast_level', e.target.value)}
                                                        >
                                                            <option value="info">INFO (Yellow Alert)</option>
                                                            <option value="critical">CRITICAL (Red Alert)</option>
                                                        </select>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleConfigSave('emergency_broadcast_text', config.emergency_broadcast_text)}
                                                            className="bg-gray-800 hover:bg-gray-700 p-3 rounded flex-1 uppercase text-xs font-bold"
                                                        >
                                                            Save Draft
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const newState = config.emergency_broadcast_active === 'true' ? 'false' : 'true';
                                                                handleConfigSave('emergency_broadcast_active', newState);
                                                            }}
                                                            className={`p-3 rounded flex-[2] uppercase text-xs font-bold border ${config.emergency_broadcast_active === 'true' ? 'bg-red-500 text-black border-red-500 animate-pulse' : 'bg-transparent border-red-500 text-red-500 hover:bg-red-900/20'}`}
                                                        >
                                                            {config.emergency_broadcast_active === 'true' ? 'DEACTIVATE BROADCAST' : 'INITIATE BROADCAST'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions / User Lookup */}
                    <div className={`col-span-12 md:col-span-4 space-y-6 ${activeTab === 'data' ? 'hidden' : ''}`}>
                        <div className="border border-green-900 bg-green-950/5 p-4 rounded-lg">
                            <h3 className="text-sm font-bold uppercase mb-4 flex items-center gap-2">
                                <Search size={16} /> Global Citizen Search
                            </h3>
                            <div className="space-y-2 relative">
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Enter Name or CIT-ID... (Ctrl+K)"
                                    className="w-full bg-black border border-green-900 p-2 text-sm focus:outline-none focus:border-green-500"
                                    onChange={async (e) => {
                                        if (e.target.value.length > 2) {
                                            const results = await searchUsers(e.target.value);
                                            setSearchResults(results);
                                        } else {
                                            setSearchResults([]);
                                        }
                                    }}
                                />
                                {searchResults.length > 0 && (
                                    <div className="absolute top-full left-0 w-full bg-black border border-green-900 z-10 max-h-48 overflow-y-auto">
                                        {searchResults.map((u: any) => (
                                            <div key={u.citizen_id} className="p-2 hover:bg-green-900/20 cursor-pointer border-b border-green-900/30">
                                                <div className="font-bold text-xs text-green-400">{u.username}</div>
                                                <div className="flex justify-between text-[10px] opacity-70">
                                                    <span>{u.citizen_id}</span>
                                                    <span>{u.status}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="border border-green-900 bg-green-950/5 p-4 rounded-lg">
                            <h3 className="text-sm font-bold uppercase mb-4 flex items-center gap-2">
                                <Database size={16} /> Storage Management
                            </h3>

                            <div className="mb-4 text-xs font-mono space-y-1 opacity-80">
                                <div className="flex justify-between">
                                    <span>DB Size:</span>
                                    <span className="text-white">{dbStatus?.size_mb || "Checking..."}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Integrity:</span>
                                    <span className="text-green-400">{dbStatus?.integrity || "---"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Path:</span>
                                    <span className="truncate max-w-[150px]" title={dbStatus?.path}>{dbStatus?.path || "---"}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={handleBackup}
                                    disabled={backupStatus === 'Backing up...'}
                                    className="bg-green-900/20 hover:bg-green-900/40 p-3 rounded text-xs border border-green-900/50 transition-all flex flex-col items-center gap-1"
                                >
                                    <Database size={14} />
                                    {backupStatus || "TRIGGER BACKUP"}
                                </button>
                                <button className="bg-green-900/20 hover:bg-green-900/40 p-3 rounded text-xs border border-green-900/50 transition-all opacity-50 cursor-not-allowed">
                                    OPTIMIZE INDEX
                                </button>
                            </div>
                        </div>

                        {/* Content & Layout Management (New Section) */}
                        <div className="border border-green-900 bg-green-950/5 p-4 rounded-lg">
                            <h3 className="text-sm font-bold uppercase mb-4 flex items-center gap-2">
                                <LayoutIcon size={16} /> Content & Layouts
                            </h3>
                            <div className="space-y-3">
                                <button
                                    onClick={() => window.dispatchEvent(new CustomEvent('open-visual-builder'))}
                                    className="w-full bg-green-900/20 hover:bg-green-900/40 p-3 rounded text-xs border border-green-900/50 transition-all flex items-center justify-between group">
                                    <span className="flex items-center gap-2 font-bold"><Box size={14} /> Manage Components</span>
                                    <ExternalLink size={12} className="opacity-50 group-hover:opacity-100" />
                                </button>
                                <button
                                    onClick={() => window.open('/admin/news-editor', '_blank')}
                                    className="w-full bg-green-900/20 hover:bg-green-900/40 p-3 rounded text-xs border border-green-900/50 transition-all flex items-center justify-between group">
                                    <span className="flex items-center gap-2 font-bold"><FileText size={14} /> Newspaper Editor</span>
                                    <ExternalLink size={12} className="opacity-50 group-hover:opacity-100" />
                                </button>
                                <button
                                    onClick={() => { if (confirm("Reset entire page layout to default?")) alert("Layout Reset!"); }}
                                    className="w-full bg-red-900/10 hover:bg-red-900/30 p-3 rounded text-xs border border-red-900/30 transition-all flex items-center gap-2 text-red-400 group"
                                >
                                    <RotateCcw size={14} className="group-hover:-rotate-180 transition-transform duration-500" /> Reset Page Layout
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div >
    );
};

export default AdminCommandCenter;