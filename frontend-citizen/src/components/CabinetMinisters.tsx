import React from 'react';
import { Shield, Briefcase, IndianRupee, Globe, GraduationCap, Stethoscope, Tractor, Train, Zap, Plane, Anchor, ShoppingCart, Users, Radio, MessageSquare } from 'lucide-react';

interface Minister {
    name: string;
    portfolio: string;
    image: string;
    party?: string;
}

const NATION_CABINET: Minister[] = [
    {
        name: "Narendra Modi",
        portfolio: "Prime Minister",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Narendra_Modi_2021.jpg/480px-Narendra_Modi_2021.jpg",
        party: "BJP"
    },
    {
        name: "Rajnath Singh",
        portfolio: "Minister of Defence",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Rajnath_Singh_in_2019_%28cropped%29.jpg/220px-Rajnath_Singh_in_2019_%28cropped%29.jpg",
        party: "BJP"
    },
    {
        name: "Amit Shah",
        portfolio: "Minister of Home Affairs & Cooperation",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Amit_Shah_in_February_2023.jpg/220px-Amit_Shah_in_February_2023.jpg",
        party: "BJP"
    },
    {
        name: "Nirmala Sitharaman",
        portfolio: "Minister of Finance",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Nirmala_Sitharaman_in_October_2023.jpg/220px-Nirmala_Sitharaman_in_October_2023.jpg",
        party: "BJP"
    },
    {
        name: "Dr. S. Jaishankar",
        portfolio: "Minister of External Affairs",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/S_Jaishankar_in_2023.jpg/220px-S_Jaishankar_in_2023.jpg",
        party: "BJP"
    },
    {
        name: "Nitin Gadkari",
        portfolio: "Minister of Road Transport & Highways",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Nitin_Gadkari_2024.jpg/220px-Nitin_Gadkari_2024.jpg",
        party: "BJP"
    },
    {
        name: "J.P. Nadda",
        portfolio: "Minister of Health & Chemicals",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/J_P_Nadda_%28cropped%29.jpg/220px-J_P_Nadda_%28cropped%29.jpg",
        party: "BJP"
    },
    {
        name: "Shivraj Singh Chouhan",
        portfolio: "Minister of Agriculture",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Shivraj_Singh_Chouhan_2023.jpg/220px-Shivraj_Singh_Chouhan_2023.jpg",
        party: "BJP"
    },
    {
        name: "Ashwini Vaishnaw",
        portfolio: "Minister of Railways & IT",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Ashwini_Vaishnaw_in_2023.jpg/220px-Ashwini_Vaishnaw_in_2023.jpg",
        party: "BJP"
    },
    {
        name: "Jyotiraditya Scindia",
        portfolio: "Minister of Communications",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Jyotiraditya_Scindia_in_2023.jpg/220px-Jyotiraditya_Scindia_in_2023.jpg",
        party: "BJP"
    },
    {
        name: "Bhupender Yadav",
        portfolio: "Minister of Environment",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Bhupender_Yadav_in_2023.jpg/220px-Bhupender_Yadav_in_2023.jpg",
        party: "BJP"
    },
    {
        name: "Annapurna Devi",
        portfolio: "Minister of Women & Child Dev",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Annpurna_Devi_official_portrait.jpg/220px-Annpurna_Devi_official_portrait.jpg",
        party: "BJP"
    },
    {
        name: "Kiren Rijiju",
        portfolio: "Minister of Parliamentary Affairs",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Kiren_Rijiju_in_2023.jpg/220px-Kiren_Rijiju_in_2023.jpg",
        party: "BJP"
    },
    {
        name: "Kinjarapu Rammohan Naidu",
        portfolio: "Minister of Civil Aviation",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Ram_Mohan_Naidu_Kinjarapu.jpg/220px-Ram_Mohan_Naidu_Kinjarapu.jpg",
        party: "TDP"
    },
    {
        name: "Sarbananda Sonowal",
        portfolio: "Minister of Ports & Shipping",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Sarbananda_Sonowal_in_2023.jpg/220px-Sarbananda_Sonowal_in_2023.jpg",
        party: "BJP"
    },
    {
        name: "Pralhad Joshi",
        portfolio: "Minister of Consumer Affairs",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Pralhad_Joshi_in_2023.jpg/220px-Pralhad_Joshi_in_2023.jpg",
        party: "BJP"
    },
    {
        name: "Giriraj Singh",
        portfolio: "Minister of Textiles",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Giriraj_Singh_in_2023.jpg/220px-Giriraj_Singh_in_2023.jpg",
        party: "BJP"
    },
    {
        name: "Dr. Virendra Kumar",
        portfolio: "Minister of Social Justice",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Virendra_Kumar_Khatik_in_2023.jpg/220px-Virendra_Kumar_Khatik_in_2023.jpg",
        party: "BJP"
    }
];

// Mock basic state structure
const STATE_CABINET_MOCK: Minister[] = [
    {
        name: "Chief Minister",
        portfolio: "General Administration",
        image: "https://ui-avatars.com/api/?name=Chief+Minister&background=random",
        party: "Ruling Party"
    },
    {
        name: "Home Minister",
        portfolio: "Home & Disaster Mgmt",
        image: "https://ui-avatars.com/api/?name=Home+Minister&background=random",
        party: "Ruling Party"
    },
    {
        name: "Finance Minister",
        portfolio: "Finance & Planning",
        image: "https://ui-avatars.com/api/?name=Finance+Minister&background=random",
        party: "Ruling Party"
    },
    {
        name: "Education Minister",
        portfolio: "School & Higher Education",
        image: "https://ui-avatars.com/api/?name=Edu+Minister&background=random",
        party: "Ruling Party"
    },
    {
        name: "Health Minister",
        portfolio: "Health & Family Welfare",
        image: "https://ui-avatars.com/api/?name=Health+Minister&background=random",
        party: "Ruling Party"
    }
];

interface CabinetMinistersProps {
    scope: 'nation' | 'state';
    stateName?: string;
}

export const CabinetMinisters: React.FC<CabinetMinistersProps> = ({ scope, stateName }) => {
    const ministers = scope === 'nation' ? NATION_CABINET : STATE_CABINET_MOCK;
    const title = scope === 'nation' ? "Union Cabinet" : `${stateName || 'State'} Cabinet`;

    const getIcon = (portfolio: string) => {
        const p = portfolio.toLowerCase();
        if (p.includes("prime minister")) return <Briefcase size={16} />;
        if (p.includes("home")) return <Shield size={16} />;
        if (p.includes("finance")) return <IndianRupee size={16} />;
        if (p.includes("defence")) return <Shield size={16} />;
        if (p.includes("external")) return <Globe size={16} />;
        if (p.includes("education")) return <GraduationCap size={16} />;
        if (p.includes("health")) return <Stethoscope size={16} />;
        if (p.includes("agriculture")) return <Tractor size={16} />;
        if (p.includes("transport")) return <Train size={16} />;
        if (p.includes("railways")) return <Train size={16} />;
        if (p.includes("aviation")) return <Plane size={16} />;
        if (p.includes("ports") || p.includes("shipping")) return <Anchor size={16} />;
        if (p.includes("consumer") || p.includes("food")) return <ShoppingCart size={16} />;
        if (p.includes("women") || p.includes("child") || p.includes("social")) return <Users size={16} />;
        if (p.includes("parliamentary") || p.includes("communications")) return <MessageSquare size={16} />;
        if (p.includes("energy") || p.includes("it")) return <Zap size={16} />;
        if (p.includes("environment")) return <Globe size={16} />;
        return <Briefcase size={16} />;
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                    <Briefcase size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                        {scope === 'nation' ? 'Key Council of Ministers' : 'State Leadership'}
                    </p>
                </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                {ministers.map((minister, idx) => (
                    <div key={idx} className="min-w-[160px] bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center hover:shadow-lg transition-all group shrink-0">
                        <div className="relative mb-3">
                            <img
                                src={minister.image}
                                alt={minister.name}
                                className="w-20 h-20 rounded-full object-cover border-2 border-white dark:border-slate-600 shadow-md group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute -bottom-1 -right-1 bg-slate-900 text-white p-1 rounded-full text-[10px] border border-white dark:border-slate-800">
                                {getIcon(minister.portfolio)}
                            </div>
                        </div>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white leading-tight mb-1 line-clamp-2 h-9 flex items-center justify-center">{minister.name}</h4>
                        <p className="text-[10px] text-slate-500 font-medium uppercase mb-2 h-6 flex items-center justify-center line-clamp-2">{minister.portfolio}</p>
                        {minister.party && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-[10px] font-bold rounded-full">
                                {minister.party}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
