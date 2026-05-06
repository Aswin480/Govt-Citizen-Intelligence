import React, { useState, useEffect } from 'react';
import { getNlpMpSpeeches } from '../services/api';
import {
    Building2, Leaf, Tractor, GraduationCap, Heart, Zap,
    Scale, Shield, Briefcase, ThumbsUp, ThumbsDown,
    Minus, TrendingUp, MessageSquare, Eye, Activity
} from 'lucide-react';
import { DebateViewer } from './DebateViewer';

// Indian Government Departments mapped to NLP core values
const DEPARTMENTS = [
    { id: 'infrastructure', name: 'Infrastructure & Transport', icon: Building2, color: 'orange', coreValue: 'Infrastructure & Development' },
    { id: 'environment', name: 'Environment & Climate', icon: Leaf, color: 'green', coreValue: 'Environment & Pollution' },
    { id: 'agriculture', name: 'Agriculture & Farmers', icon: Tractor, color: 'amber', coreValue: 'Agriculture & Farmers' },
    { id: 'education', name: 'Education & Skill Development', icon: GraduationCap, color: 'blue', coreValue: 'Education' },
    { id: 'health', name: 'Health & Family Welfare', icon: Heart, color: 'red', coreValue: 'Health' },
    { id: 'energy', name: 'Social Justice & Welfare', icon: Zap, color: 'yellow', coreValue: 'Social Justice & Welfare' },
    { id: 'law', name: 'Law & Justice', icon: Scale, color: 'purple', coreValue: 'Governance & Law' },
    { id: 'defense', name: 'Defense & Security', icon: Shield, color: 'slate', coreValue: 'National Security & Military' },
    { id: 'finance', name: 'Finance & Economy', icon: Briefcase, color: 'emerald', coreValue: 'Economy & Jobs' },
];

interface MemberPerformanceProps {
    member: any;
}

export const MemberPerformance: React.FC<MemberPerformanceProps> = ({ member }) => {
    const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
    const [selectedDebate, setSelectedDebate] = useState<any | null>(null);

    const [speeches, setSpeeches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (member?.name) {
            setLoading(true);
            getNlpMpSpeeches(member.name, 500, 0, true, 'all')
                .then(res => {
                    setSpeeches(res?.speeches || []);
                    setLoading(false);
                })
                .catch(() => {
                    setSpeeches([]);
                    setLoading(false);
                });
        }
    }, [member?.name]);

    const generatePerformanceData = () => {
        const data: any = {};
        DEPARTMENTS.forEach(dept => {
            const deptSpeeches = speeches.filter(s => s.core_value === dept.coreValue);
            const scoreSum = deptSpeeches.reduce((acc, s) => acc + (s.score || 0), 0);
            const avgScore = deptSpeeches.length ? scoreSum / deptSpeeches.length : 0;
            const stance = avgScore > 2 ? 'support' : avgScore < -2 ? 'oppose' : 'neutral';
            
            data[dept.id] = {
                debates: deptSpeeches.length,
                stance,
                keyTopics: [dept.name],
                debates_list: deptSpeeches.map((s, idx) => ({
                    id: `${s.batch_id || 'DEB'}-${s.row_index || idx}`,
                    title: `Debate on ${dept.name}`,
                    date: s.start_date || 'Recent',
                    house: member.house === 'lok_sabha' ? 'Lok Sabha' : member.house === 'rajya_sabha' ? 'Rajya Sabha' : 'State Assembly',
                    location: 'Parliament House, New Delhi',
                    department: dept.name,
                    status: 'Concluded',
                    participants: Math.floor(Math.random() * 50) + 10,
                    stance: (s.score || 0) > 0 ? 'support' : 'oppose',
                    summary: `Parliamentary intervention regarding ${dept.name}`,
                    transcript: [
                        {
                            speaker: member.name,
                            party: member.party,
                            timestamp: 'Session time',
                            stance: (s.score || 0) > 0 ? 'support' : 'oppose',
                            text: s.speech
                        }
                    ]
                }))
            };
        });
        return data;
    };
    
    const performanceData = generatePerformanceData();

    const getStanceIcon = (stance: string) => {
        switch (stance) {
            case 'support': return <ThumbsUp className="text-green-500" size={20} />;
            case 'oppose': return <ThumbsDown className="text-red-500" size={20} />;
            case 'neutral': return <Minus className="text-amber-500" size={20} />;
            default: return null;
        }
    };

    const getStanceColor = (stance: string) => {
        switch (stance) {
            case 'support': return 'from-green-500/20 to-green-600/20 border-green-500/30';
            case 'oppose': return 'from-red-500/20 to-red-600/20 border-red-500/30';
            case 'neutral': return 'from-amber-500/20 to-amber-600/20 border-amber-500/30';
            default: return 'from-slate-500/20 to-slate-600/20 border-slate-500/30';
        }
    };

    const getStanceText = (stance: string) => {
        switch (stance) {
            case 'support': return 'Generally Supportive';
            case 'oppose': return 'Generally Opposed';
            case 'neutral': return 'Neutral/Balanced';
            default: return 'No Clear Stance';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12 text-slate-500">
                <div className="animate-pulse flex items-center gap-2">
                    <div className="w-4 h-4 bg-indigo-500 rounded-full"></div>
                    <div className="w-4 h-4 bg-indigo-500 rounded-full animation-delay-200"></div>
                    <div className="w-4 h-4 bg-indigo-500 rounded-full animation-delay-400"></div>
                </div>
            </div>
        );
    }

    if (!loading && speeches.length === 0) {
        return (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/10 p-8 text-center">
                <Activity className="mx-auto mb-4 text-amber-400" size={48} />
                <div className="text-lg font-bold text-amber-800 dark:text-amber-200 mb-2">No debate records found</div>
                <p className="text-sm text-amber-700 dark:text-amber-300 max-w-md mx-auto">
                    No parliamentary speech data is available for <strong>{member?.name}</strong> in the current NLP dataset.
                    This may mean the NLP pipeline has not yet processed their speeches, or the NLP service (port 8001) is offline.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-slide-up">

            {/* Summary Banner */}
            <div className="flex items-center gap-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                <TrendingUp className="text-indigo-500" size={24} />
                <div>
                    <div className="font-bold text-slate-900 dark:text-white">{speeches.length} Speech Records Found</div>
                    <div className="text-sm text-slate-500">Across {DEPARTMENTS.filter(d => (performanceData[d.id]?.debates || 0) > 0).length} policy areas — sourced from parliamentary NLP pipeline</div>
                </div>
            </div>

            {/* Department Grid */}
            <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                    <TrendingUp className="text-indigo-500" />
                    Performance by Department
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {DEPARTMENTS.map((dept) => {
                        const data = performanceData[dept.id as keyof typeof performanceData];
                        const Icon = dept.icon;

                        return (
                            <button
                                key={dept.id}
                                onClick={() => setSelectedDepartment(dept.id)}
                                className={`group relative bg-white dark:bg-slate-900 rounded-2xl p-6 border-2 transition-all hover:shadow-xl hover:-translate-y-1 text-left ${selectedDepartment === dept.id
                                        ? `border-${dept.color}-500 shadow-lg shadow-${dept.color}-500/20`
                                        : 'border-slate-200 dark:border-slate-800'
                                    }`}
                            >
                                {/* Department Icon */}
                                <div className={`w-14 h-14 rounded-xl bg-${dept.color}-50 dark:bg-${dept.color}-900/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    <Icon className={`text-${dept.color}-600 dark:text-${dept.color}-400`} size={28} />
                                </div>

                                {/* Department Name */}
                                <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-sm leading-tight">
                                    {dept.name}
                                </h3>

                                {/* Stats */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <MessageSquare size={16} className="text-slate-400" />
                                        <span className="text-2xl font-black text-slate-900 dark:text-white">
                                            {data.debates}
                                        </span>
                                    </div>
                                    {getStanceIcon(data.stance)}
                                </div>

                                {/* Stance Badge */}
                                <div className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${data.stance === 'support' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                                        data.stance === 'oppose' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                                            'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                                    }`}>
                                    {getStanceText(data.stance)}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Department Details */}
            {selectedDepartment && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl animate-slide-up">
                    {(() => {
                        const dept = DEPARTMENTS.find(d => d.id === selectedDepartment)!;
                        const data = performanceData[selectedDepartment as keyof typeof performanceData];
                        const Icon = dept.icon;

                        return (
                            <>
                                {/* Header */}
                                <div className="flex items-start justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-16 h-16 rounded-2xl bg-${dept.color}-50 dark:bg-${dept.color}-900/20 flex items-center justify-center`}>
                                            <Icon className={`text-${dept.color}-600 dark:text-${dept.color}-400`} size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{dept.name}</h3>
                                            <p className="text-slate-500 dark:text-slate-400 font-medium">{data.debates} debates participated</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedDepartment(null)}
                                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {/* Overall Stance */}
                                <div className={`bg-gradient-to-br ${getStanceColor(data.stance)} border rounded-2xl p-6 mb-8`}>
                                    <div className="flex items-center gap-3 mb-2">
                                        {getStanceIcon(data.stance)}
                                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">Overall Stance</h4>
                                    </div>
                                    <p className="text-slate-700 dark:text-slate-300 font-medium">{getStanceText(data.stance)}</p>
                                </div>

                                {/* Key Topics */}
                                <div className="mb-8">
                                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Key Topics Addressed</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {data.keyTopics.map((topic, index) => (
                                            <span
                                                key={index}
                                                className={`px-4 py-2 bg-${dept.color}-50 dark:bg-${dept.color}-900/20 text-${dept.color}-700 dark:text-${dept.color}-300 rounded-full text-sm font-bold border border-${dept.color}-200 dark:border-${dept.color}-800`}
                                            >
                                                {topic}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Debates List */}
                                <div>
                                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Recent Debates</h4>
                                    {data.debates_list && data.debates_list.length > 0 ? (
                                        <div className="space-y-4">
                                            {data.debates_list.map((debate) => (
                                                <button
                                                    key={debate.id}
                                                    onClick={() => setSelectedDebate(debate)}
                                                    className="w-full group bg-slate-50 dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:shadow-lg transition-all text-left"
                                                >
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex-1">
                                                            <h5 className="font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                                {debate.title}
                                                            </h5>
                                                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                                                {debate.summary}
                                                            </p>
                                                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                                                <span>{debate.date}</span>
                                                                <span>•</span>
                                                                <span>{debate.house}</span>
                                                                <span>•</span>
                                                                <span>{debate.participants} participants</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {getStanceIcon(debate.stance)}
                                                            <Eye className="text-slate-400 group-hover:text-indigo-500 transition-colors" size={20} />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${debate.status === 'Concluded'
                                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                                                            }`}>
                                                            {debate.status}
                                                        </span>
                                                        <span className="text-xs text-slate-400">Click to view full transcript</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                            <MessageSquare className="mx-auto mb-3 text-slate-300" size={48} />
                                            <p className="text-slate-500 dark:text-slate-400 font-medium">
                                                No debate transcripts available yet
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}

            {/* Debate Viewer Modal */}
            {selectedDebate && (
                <DebateViewer
                    debate={selectedDebate}
                    onClose={() => setSelectedDebate(null)}
                />
            )}
        </div>
    );
};
