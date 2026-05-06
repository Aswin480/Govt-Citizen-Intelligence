import React from 'react';
import {
    Vote, CheckCircle2, XCircle, MinusCircle,
    TrendingUp, Award, Layers, PieChart,
    ArrowRight, Activity, CircleDollarSign
} from 'lucide-react';

interface VotingRecord {
    id: string;
    billName: string;
    date: string;
    vote: 'For' | 'Against' | 'Absent' | 'Abstained';
}

const MOCK_VOTES: VotingRecord[] = [
    { id: '1', billName: 'Digital Data Protection Bill', date: '2025-12-18', vote: 'For' },
    { id: '2', billName: 'Women\'s Reservation Bill', date: '2025-09-21', vote: 'For' },
    { id: '3', billName: 'Farm Laws Repeal Bill', date: '2024-11-29', vote: 'For' },
    { id: '4', billName: 'Crypto Regulation Bill', date: '2024-08-15', vote: 'Absent' },
    { id: '5', billName: 'National Education Policy', date: '2024-07-29', vote: 'For' },
    { id: '6', billName: 'Electricity Amendment Bill', date: '2024-06-10', vote: 'Against' },
    { id: '7', billName: 'Finance Bill 2024', date: '2024-02-01', vote: 'For' },
    { id: '8', billName: 'Criminal Procedure Bill', date: '2023-12-20', vote: 'For' },
    { id: '9', billName: 'Forest Conservation Bill', date: '2023-08-05', vote: 'Abstained' },
    { id: '10', billName: 'Biological Diversity Bill', date: '2023-07-25', vote: 'For' },
];

export const LegislativePerformance: React.FC = () => {

    const getVoteColor = (vote: string) => {
        switch (vote) {
            case 'For': return 'bg-emerald-500';
            case 'Against': return 'bg-red-500';
            case 'Absent': return 'bg-slate-300 dark:bg-slate-600';
            case 'Abstained': return 'bg-purple-500';
            default: return 'bg-slate-400';
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">

            {/* --- 1. VOTING DNA STRIP --- */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Vote className="text-emerald-500" /> Legislative DNA
                        </h3>
                        <p className="text-sm text-slate-500 font-medium">Voting history on key bills</p>
                    </div>
                    <div className="flex gap-4 text-xs font-bold text-slate-500">
                        <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> For</span>
                        <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500"></div> Against</span>
                        <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600"></div> Absent</span>
                    </div>
                </div>

                {/* DNA Visualization */}
                <div className="relative h-24 flex items-center w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                    <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-100 dark:bg-slate-800 -z-10"></div>
                    <div className="flex items-center gap-8 px-4 min-w-max">
                        {MOCK_VOTES.map((record, idx) => (
                            <div key={record.id} className="group relative flex flex-col items-center">
                                {/* Date Label */}
                                <span className="absolute -top-8 text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    {record.date}
                                </span>

                                {/* DNA Dot */}
                                <div className={`w-5 h-5 rounded-full ${getVoteColor(record.vote)} border-4 border-white dark:border-slate-900 shadow-sm z-10 transition-transform group-hover:scale-150`}></div>

                                {/* Bill Name Tooltip */}
                                <div className="absolute top-8 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 pointer-events-none">
                                    <div className="bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
                                        {record.billName}
                                        <div className="text-[10px] text-slate-400 font-normal uppercase">{record.vote}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- 2. SPHERES OF INFLUENCE & FINANCE --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Committee Influence */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Layers size={100} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <Layers className="text-blue-500" size={20} /> Spheres of Influence
                    </h3>

                    <div className="space-y-4 relative z-10">
                        <CommitteeCard
                            role="Chairperson"
                            name="Standing Committee on Finance"
                            ministry="Ministry of Finance"
                            badge="High Impact"
                        />
                        <CommitteeCard
                            role="Member"
                            name="Consultative Committee on Defence"
                            ministry="Ministry of Defence"
                        />
                        <CommitteeCard
                            role="Member"
                            name="Joint Committee on Offices of Profit"
                            ministry="Lok Sabha"
                        />
                    </div>
                </div>

                {/* MPLADS Financial Velocity */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                            <CircleDollarSign className="text-amber-500" size={20} /> MPLADS Velocity
                        </h3>
                        <p className="text-sm text-slate-500 mb-6">Fund utilization efficiency for FY 2024-25</p>
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-4xl font-black text-slate-900 dark:text-white">85%</span>
                            <span className="text-xs font-bold text-emerald-500 uppercase">High Efficiency</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
                            <div className="h-full w-[85%] bg-gradient-to-r from-amber-400 to-amber-600 rounded-full shadow-lg relative overflow-hidden">
                                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                            </div>
                        </div>

                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <span>Released: ₹5 Cr</span>
                            <span>Utilized: ₹4.25 Cr</span>
                        </div>

                        {/* Breakdown Pills */}
                        <div className="mt-8 flex gap-2 flex-wrap">
                            <div className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100">
                                🏗️ Infra (40%)
                            </div>
                            <div className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-lg border border-green-100">
                                🏥 Health (30%)
                            </div>
                            <div className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-lg border border-purple-100">
                                🎓 Edu (15%)
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

// --- Sub-Components ---
const CommitteeCard = ({ role, name, ministry, badge }: any) => (
    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 transition-all hover:bg-white hover:shadow-md group">
        <div className="flex justify-between items-start mb-1">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{role}</span>
            {badge && <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">{badge}</span>}
        </div>
        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm leading-tight mb-1 group-hover:text-blue-600 transition-colors">{name}</h4>
        <p className="text-[10px] text-slate-400 font-medium">{ministry}</p>
    </div>
);
