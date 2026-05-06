
import React from 'react';
import { Sparkles, ArrowRight, Baby, GraduationCap, Vote, HeartPulse, Briefcase, Coins } from 'lucide-react';

// Logic Engine for Lifecycle Prediction
const analyzeMember = (member: any) => {
    const age = member.age || 25; // Default if missing
    const tasks = [];

    // 0. Universal
    if (!member.aadhaar_verified) tasks.push({ icon: <div className="text-blue-500 font-bold">A</div>, title: "Link Aadhaar", type: "urgent" });

    // 1. Infants / Kids (0-5)
    if (age <= 5) {
        tasks.push({ icon: <Baby size={16} className="text-pink-500" />, title: "Polio Vaccination Due", type: "health" });
        tasks.push({ icon: <div className="text-blue-400 font-bold text-xs">Baal</div>, title: "Blue Aadhaar Card", type: "admin" });
    }

    // 2. Students (6-18)
    if (age > 5 && age < 18) {
        tasks.push({ icon: <GraduationCap size={16} className="text-indigo-500" />, title: "Pre-Matric Scholarship", type: "edu" });
        if (age >= 16) tasks.push({ icon: <Briefcase size={16} className="text-slate-500" />, title: "Apply for Driving License (Learning)", type: "admin" });
    }

    // 3. Young Adults (18-25)
    if (age >= 18 && age <= 25) {
        tasks.push({ icon: <Vote size={16} className="text-orange-500" />, title: "Voter ID Registration", type: "civic" });
        tasks.push({ icon: <Briefcase size={16} className="text-blue-600" />, title: "Yuva Employment Scheme", type: "job" });
    }

    // 4. Women Specific (Mock logic based on relation/gender if available, else assume purely on age/context)
    if (member.relation === 'Wife' || member.gender === 'F') {
        tasks.push({ icon: <HeartPulse size={16} className="text-red-500" />, title: "Matru Vandana Yojana", type: "health" });
        tasks.push({ icon: <Coins size={16} className="text-yellow-600" />, title: "Lakhpati Didi Loan", type: "finance" });
    }

    // 5. Seniors (60+)
    if (age >= 60) {
        tasks.push({ icon: <Coins size={16} className="text-yellow-600" />, title: "Old Age Pension (Apply)", type: "finance" });
        tasks.push({ icon: <HeartPulse size={16} className="text-red-500" />, title: "Free Health Checkup", type: "health" });
    }

    return tasks;
};

export const JeevanSetu = ({ members }: { members: any[] }) => {
    // Generate Suggestions based on family composition
    const suggestions = members.flatMap(m =>
        analyzeMember(m).map(task => ({
            ...task,
            for: m.name,
            relation: m.relation
        }))
    );

    if (suggestions.length === 0) return null;

    return (
        <div className="mt-8 relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 border border-indigo-500/30 shadow-2xl p-6 text-white animate-fade-in-up">

            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-white flex items-center gap-2">
                            <Sparkles className="text-yellow-400" size={24} />
                            Jeevan Setu ai
                        </h2>
                        <p className="text-indigo-200 text-sm mt-1 max-w-lg">
                            Analyze your family's lifecycle data to predict upcoming government benefits and deadlines automatically.
                        </p>
                    </div>
                    <div className="bg-indigo-500/20 border border-indigo-500/50 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-indigo-300">
                        Proactive Governance
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {suggestions.slice(0, 6).map((task, i) => (
                        <div key={i} className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-indigo-500/50 rounded-xl p-4 transition-all group cursor-pointer">
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-2 bg-slate-900 rounded-lg border border-white/10 group-hover:bg-indigo-900/50 transition-colors">
                                    {task.icon}
                                </div>
                                <ArrowRight size={14} className="text-indigo-400 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all" />
                            </div>

                            <h4 className="font-bold text-sm text-slate-100 mb-1">{task.title}</h4>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                <span className="uppercase font-bold text-indigo-300">{task.for}</span>
                                <span>•</span>
                                <span>{task.relation}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 flex justify-center">
                    <button className="text-xs font-bold text-indigo-300 hover:text-white flex items-center gap-2 transition-colors">
                        View All {suggestions.length} Suggestions
                    </button>
                </div>
            </div>
        </div>
    );
};
