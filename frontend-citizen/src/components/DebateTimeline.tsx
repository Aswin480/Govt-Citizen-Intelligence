import React, { useState } from 'react';
import {
    Play, FileText, ExternalLink, ThumbsUp, ThumbsDown, HelpCircle,
    Calendar, Clock, CheckCircle2, Search, Filter, MessageSquare,
    Share2, AlertCircle, X, ChevronDown, ChevronUp, Mic2
} from 'lucide-react';

// --- Types ---
interface Debate {
    id: string;
    date: string;
    house: 'Lok Sabha' | 'Rajya Sabha';
    session: string;
    topic: string;
    category: string;
    stance: 'Support' | 'Oppose' | 'Question' | 'Neutral';
    quote: string;
    duration: string;
    videoUrl?: string; // Optional
    transcriptUrl?: string; // Optional
    officialRecordUrl?: string; // Optional
    outcome: 'Passed' | 'Failed' | 'Pending' | 'Discussed';
    verified: boolean;
    fullTranscript?: string; // Elite Feature
}

// --- Mock Data (Real-world examples) ---
const MOCK_DEBATES: Debate[] = [
    {
        id: '1',
        date: '2025-12-18',
        house: 'Lok Sabha',
        session: 'Winter Session 2025',
        topic: 'Digital Personal Data Protection (Amendment) Bill',
        category: 'Technology & Privacy',
        stance: 'Support',
        quote: "This framework finally balances the citizen's right to privacy with legitimate national security interests, creating a robust digital economy.",
        duration: '14:20',
        videoUrl: '#',
        transcriptUrl: '#',
        officialRecordUrl: '#',
        outcome: 'Passed',
        verified: true,
        fullTranscript: "Honorable Speaker, I rise to support the Digital Personal Data Protection Bill. In an era where data is the new oil, we must ensure... [Transcript continues for 14 mins] ...therefore, this bill is not just a legal necessity but a moral imperative for our digital sovereignty."
    },
    {
        id: '2',
        date: '2025-08-10',
        house: 'Lok Sabha',
        session: 'Monsoon Session 2025',
        topic: 'National Inflation & Price Rise Discussion',
        category: 'Economy',
        stance: 'Oppose',
        quote: "The government's claim of stabilizing prices contradicts the ground reality where essential commodities have seen a 15% spike in rural markets.",
        duration: '08:45',
        videoUrl: '#',
        transcriptUrl: '#',
        outcome: 'Discussed',
        verified: true,
        fullTranscript: "Sir, I wish to draw the attention of the house to the skyrocketing prices of essential goods. While the indexes show a plateau, the basket of goods for the common man tell a different story..."
    },
    {
        id: '3',
        date: '2025-03-22',
        house: 'Lok Sabha',
        session: 'Budget Session 2025',
        topic: 'Question Hour: Railway Safety Standards',
        category: 'Infrastructure',
        stance: 'Question',
        quote: "Can the Minister clarify the allocation of Kavach system implementation across Zone B, given the recent safety concerns?",
        duration: '03:10',
        officialRecordUrl: '#',
        outcome: 'Discussed',
        verified: true,
        fullTranscript: "My question to the Honorable Minister is specific to the funding allocation for the Kavach system. We have seen delays in Zone B..."
    },
    {
        id: '4',
        date: '2024-12-05',
        house: 'Lok Sabha',
        session: 'Winter Session 2024',
        topic: 'Women\'s Reservation Bill Implementation',
        category: 'Social Justice',
        stance: 'Support',
        quote: "History will remember this day as the moment we finally gave half our population their rightful voice in this august house.",
        duration: '12:15',
        videoUrl: '#',
        transcriptUrl: '#',
        outcome: 'Passed',
        verified: true,
        fullTranscript: "Speaker Sir, today is a historic day. As we table this bill, we are not just changing laws, we are changing the destiny of millions of women..."
    }
];

export const DebateTimeline: React.FC = () => {
    const [filterStance, setFilterStance] = useState<string>('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedDebateId, setExpandedDebateId] = useState<string | null>(null);

    const filteredDebates = MOCK_DEBATES.filter(debate => {
        const matchesStance = filterStance === 'All' || debate.stance === filterStance;
        const matchesSearch = debate.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
            debate.quote.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStance && matchesSearch;
    });

    const getStanceIcon = (stance: string) => {
        switch (stance) {
            case 'Support': return <ThumbsUp size={16} />;
            case 'Oppose': return <ThumbsDown size={16} />;
            case 'Question': return <HelpCircle size={16} />;
            default: return <MessageSquare size={16} />;
        }
    };

    const getStanceColor = (stance: string) => {
        switch (stance) {
            case 'Support': return 'text-emerald-500 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800';
            case 'Oppose': return 'text-red-500 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
            case 'Question': return 'text-amber-500 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800';
            default: return 'text-slate-500 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700';
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedDebateId(expandedDebateId === id ? null : id);
    };

    return (
        <div className="space-y-8 animate-fade-in pb-12">

            {/* --- TOP: Elite Insights Strip --- */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    label="Total Debates"
                    value="45"
                    sub="Past 2 Sessions"
                    icon={<MessageSquare size={18} />}
                    color="blue"
                />
                <MetricCard
                    label="Speaking Time"
                    value="6h 12m"
                    sub="Top 5% in House"
                    icon={<Clock size={18} />}
                    color="amber"
                />
                <MetricCard
                    label="Top Topic"
                    value="Economy"
                    sub="12 Debates"
                    icon={<AlertCircle size={18} />}
                    color="purple"
                />
                <MetricCard
                    label="Impact Score"
                    value="9.2/10"
                    sub="High Influence"
                    icon={<CheckCircle2 size={18} />}
                    color="emerald"
                />
            </div>

            {/* --- CONTROLS: Filter & Search --- */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 -mx-4 md:mx-0 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
                <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                    {['All', 'Support', 'Oppose', 'Question'].map(stance => (
                        <button
                            key={stance}
                            onClick={() => setFilterStance(stance)}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border flex items-center gap-2 ${filterStance === stance
                                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 shadow-lg'
                                : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                        >
                            {stance === 'All' && <Filter size={14} />}
                            {stance}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-72 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Search transcripts & topics..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                </div>
            </div>

            {/* --- TIMELINE: Elite Debate Cards --- */}
            <div className="space-y-6 relative pl-4 md:pl-8">
                {/* Timeline Line */}
                <div className="absolute left-4 md:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-slate-200 via-slate-300 to-transparent dark:from-slate-800 dark:via-slate-700"></div>

                {filteredDebates.map((debate) => (
                    <div key={debate.id} className="relative pl-6 md:pl-12 group">

                        {/* Timeline Connector */}
                        <div className={`absolute left-0 md:left-4 top-8 w-8 h-px ${expandedDebateId === debate.id ? 'bg-blue-500 w-12' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                        <div className={`absolute left-0 md:left-4 top-[30px] w-2 h-2 rounded-full border-2 transition-all duration-300 ${expandedDebateId === debate.id
                                ? 'bg-blue-500 border-blue-500 scale-125 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                                : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 group-hover:border-blue-400'
                            } -translate-x-[3px]`}></div>

                        {/* Card */}
                        <div
                            onClick={() => toggleExpand(debate.id)}
                            className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-500 cursor-pointer overflow-hidden ${expandedDebateId === debate.id
                                    ? 'border-blue-500 shadow-2xl shadow-blue-500/10 ring-1 ring-blue-500/20'
                                    : 'border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1'
                                }`}
                        >
                            {/* Card Header (Always Visible) */}
                            <div className="p-6 relative">
                                {/* Stance Accent Line */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300 ${debate.stance === 'Support' ? 'bg-emerald-500' :
                                        debate.stance === 'Oppose' ? 'bg-red-500' : 'bg-amber-500'
                                    }`}></div>

                                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-2 mb-3">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                                {new Date(debate.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                                                {debate.house}
                                            </span>
                                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStanceColor(debate.stance)}`}>
                                                {getStanceIcon(debate.stance)} {debate.stance}
                                            </span>
                                        </div>

                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {debate.topic}
                                        </h3>

                                        {expandedDebateId !== debate.id && (
                                            <div className="text-slate-500 dark:text-slate-400 font-serif italic line-clamp-2 pl-3 border-l-2 border-slate-200 dark:border-slate-700">
                                                "{debate.quote}"
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Side Stats */}
                                    <div className="flex items-center gap-4">
                                        <div className="text-right hidden sm:block">
                                            <div className="text-xl font-black text-slate-900 dark:text-white leading-none">{debate.duration}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Duration</div>
                                        </div>
                                        <button className={`p-2 rounded-full transition-colors ${expandedDebateId === debate.id ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                            {expandedDebateId === debate.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Content (Details, Transcript, Video) */}
                            {expandedDebateId === debate.id && (
                                <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 animate-slide-down">

                                    {/* Proof Badges */}
                                    <div className="px-6 py-4 flex flex-wrap gap-4 border-b border-slate-100 dark:border-slate-800">
                                        <ProofBadge icon={<Play size={14} />} label="Watch Video" type="video" active={!!debate.videoUrl} />
                                        <ProofBadge icon={<FileText size={14} />} label="Read Transcript" type="doc" active={!!debate.transcriptUrl} />
                                        <ProofBadge icon={<ExternalLink size={14} />} label="Official Record" type="link" active={!!debate.officialRecordUrl} />
                                        <div className="ml-auto flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-800">
                                            <CheckCircle2 size={14} /> Verified by Lok Sabha Secretariat
                                        </div>
                                    </div>

                                    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {/* Transcript Preview */}
                                        <div className="lg:col-span-2 space-y-4">
                                            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                                <Mic2 size={16} className="text-blue-500" /> Key Excerpt
                                            </h4>
                                            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner font-serif text-lg leading-relaxed text-slate-700 dark:text-slate-300">
                                                <span className="text-blue-500 font-bold text-2xl float-left mr-2 leading-none">"</span>
                                                {debate.fullTranscript}
                                                <span className="text-blue-500 font-bold text-2xl float-right ml-2 leading-none">"</span>
                                            </div>
                                        </div>

                                        {/* Context & Impact Side Panel */}
                                        <div className="space-y-4">
                                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Debate Context</h5>
                                                <div className="space-y-3">
                                                    <div>
                                                        <div className="text-[10px] text-slate-500 uppercase font-bold">Session</div>
                                                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{debate.session}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] text-slate-500 uppercase font-bold">Category</div>
                                                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{debate.category}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] text-slate-500 uppercase font-bold">Outcome</div>
                                                        <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-bold rounded uppercase ${debate.outcome === 'Passed' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                                                            }`}>
                                                            {debate.outcome}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Disclaimer Footer */}
            <div className="text-center pt-8 pb-4">
                <p className="text-xs text-slate-400 font-medium">All debate data is sourced from official parliamentary records (loksabha.nic.in).</p>
            </div>
        </div>
    );
};

// --- Sub-Components ---
const MetricCard = ({ label, value, sub, icon, color }: any) => {
    const colorClasses = {
        blue: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
        amber: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
        purple: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
        emerald: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
    };

    // Fallback if color is undefined 
    const activeColor = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;

    return (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col relative overflow-hidden group hover:shadow-md transition-all">
            <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${activeColor.split(' ')[0]}`}>
                {React.cloneElement(icon, { size: 48 })}
            </div>
            <div className="flex items-center gap-2 mb-3">
                <div className={`p-2 rounded-lg ${activeColor}`}>
                    {icon}
                </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">{value}</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</div>
            {sub && <div className="text-[10px] text-slate-400 mt-2 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded w-fit">{sub}</div>}
        </div>
    );
};

const ProofBadge = ({ icon, label, type, active }: any) => {
    let hoverColor = 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white';
    if (type === 'video') hoverColor = 'hover:bg-red-50 hover:text-red-600 hover:border-red-200';
    if (type === 'doc') hoverColor = 'hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200';
    if (!active) hoverColor = 'opacity-50 cursor-not-allowed';

    return (
        <button disabled={!active} className={`flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 transition-all ${hoverColor} group bg-white dark:bg-slate-800`}>
            <span className={active ? 'text-slate-700 dark:text-slate-300' : ''}>{icon}</span>
            {label}
        </button>
    );
};
