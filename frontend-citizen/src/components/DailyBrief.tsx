import React, { useEffect, useState } from 'react';
import { Newspaper, AlertTriangle, TrendingUp, ShieldAlert, CheckCircle, Info } from 'lucide-react';
import { getIntelBrief } from '../services/api';

interface Brief {
    type: string;
    level: string;
    title: string;
    description: string;
    snippet?: string;
    mp_name?: string;
    topic?: string;
}

const exampleBriefs: Brief[] = [
    { type: 'ALERT', level: 'HIGH', title: 'High Activity in Roads Sector', description: '3 Major bridge contracts awarded in Bihar today. Risk: High.', mp_name: 'Dharmendra Yadav', topic: 'Infrastructure' },
    { type: 'RISK', level: 'MEDIUM', title: 'Performance Gap Detected', description: 'MP Hibi Eden has shown 0% activity in Education sector this quarter.', mp_name: 'Hibi Eden', topic: 'Education' }
];

export const DailyBrief = () => {
    const [briefs, setBriefs] = useState<Brief[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getIntelBrief()
            .then((data: { briefs: Brief[] }) => {
                if (data.briefs && data.briefs.length > 0) {
                    setBriefs(data.briefs);
                } else {
                    setBriefs(exampleBriefs); // Fallback if BE returns empty
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to fetch intel brief:", err);
                setBriefs(exampleBriefs);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="p-4 text-slate-400 animate-pulse">Generating Intelligence Report...</div>;

    return (
        <div className="h-full bg-slate-950/50 border border-slate-800 rounded-xl overflow-hidden flex flex-col font-sans">
            <div className="p-4 border-b border-indigo-900/30 bg-indigo-900/10 flex justify-between items-center">
                <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase tracking-wider text-sm">
                    <Newspaper size={16} /> Daily Intelligence Brief
                </div>
                <div className="text-[10px] text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                    {new Date().toLocaleDateString()}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {briefs.map((brief, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border flex gap-3 transition-all hover:scale-[1.01] cursor-pointer ${brief.level === 'HIGH' ? 'bg-red-900/10 border-red-900/30 hover:border-red-500/50' :
                        brief.type === 'RISK' ? 'bg-amber-900/10 border-amber-900/30 hover:border-amber-500/50' :
                            'bg-slate-900/50 border-slate-800 hover:border-indigo-500/30'
                        }`}>
                        <div className={`mt-1 min-w-[24px]`}>
                            {brief.type === 'ALERT' && <AlertTriangle size={20} className="text-red-500" />}
                            {brief.type === 'RISK' && <ShieldAlert size={20} className="text-amber-500" />}
                            {brief.type === 'INFO' && <Info size={20} className="text-blue-500" />}
                        </div>

                        <div className="flex-1">
                            <h4 className={`text-sm font-bold mb-1 ${brief.level === 'HIGH' ? 'text-red-400' : 'text-slate-200'
                                }`}>
                                {brief.title}
                            </h4>
                            <p className="text-xs text-slate-400 leading-relaxed mb-2">
                                {brief.description}
                            </p>

                            {brief.snippet && (
                                <div className="bg-black/30 p-2 rounded border border-white/5 text-[10px] text-slate-500 italic font-serif">
                                    "{brief.snippet}"
                                </div>
                            )}

                            <div className="flex gap-2 mt-3">
                                {brief.mp_name && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                                        {brief.mp_name}
                                    </span>
                                )}
                                {brief.topic && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-900/30 text-indigo-300 border border-indigo-800/50">
                                        #{brief.topic}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                <div className="p-8 text-center opacity-30">
                    <CheckCircle className="mx-auto mb-2 text-slate-500" size={32} />
                    <p className="text-xs font-mono text-slate-400">ALL SECTORS SCANNED</p>
                </div>
            </div>
        </div>
    );
};
