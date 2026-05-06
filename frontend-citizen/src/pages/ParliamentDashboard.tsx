
import React, { useState, useEffect } from 'react';
import { useGovernanceScope } from '../context/GovernanceScopeContext';
import { useConfig } from '../context/ConfigContext';
import { getMembers, getNlpMps } from '../services/api';
import { 
    LOK_SABHA_COMPOSITION,
    RAJYA_SABHA_COMPOSITION,
    LEADERSHIP_DATA,
    PARLIAMENT_MEMBERS,
    ParliamentMember
} from '../services/realNationData';
import { MOCK_MEMBERS, Member as MockMember } from '../services/mockParliamentData';

const normalizeMember = (m: ParliamentMember | MockMember): ParliamentMember => ({
    id: m.id,
    name: m.name,
    party: m.party,
    constituency: (m as any).constituency || (m as any).state || '',
    state: (m as any).state || (m as any).constituency || '',
    house: m.house,
    image: m.image,
    role: (m as any).role || ''
});

const seatKey = (m: ParliamentMember): string => {
    const house = (m.house || '').trim().toLowerCase();
    const constituency = (m.constituency || '').trim().toLowerCase();
    const state = (m.state || '').trim().toLowerCase();
    if (constituency) {
        return `${house}|${constituency}|${state}`;
    }
    return `${house}|name|${(m.name || '').trim().toLowerCase()}`;
};

const uniqueBySeat = (rows: ParliamentMember[]): ParliamentMember[] => {
    const out = new Map<string, ParliamentMember>();
    for (const row of rows) {
        const key = seatKey(row);
        if (!key || out.has(key)) {
            continue;
        }
        out.set(key, row);
    }
    return Array.from(out.values());
};
// import { MemberProfileModal } from '../components/MemberProfileModal'; // Removed old modal import
import { Users, Activity, Search, PieChart, BarChart3, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { CabinetMinisters } from '../components/CabinetMinisters';
import { PoliticalMap } from '../components/PoliticalMap';
import { useNavigate } from 'react-router-dom';

interface ParliamentDashboardProps {
    adminMode?: boolean;
    onEditMember?: (member: ParliamentMember) => void;
}

export const ParliamentDashboard: React.FC<ParliamentDashboardProps> = ({ adminMode = false, onEditMember }) => {
    // FIX: Use context setHouse directly instead of local state to ensure Top Bar works
    const { house, setHouse } = useGovernanceScope();
    const navigate = useNavigate();

    // Default to lok_sabha if null
    const activeTab = house || 'lok_sabha';

    const [searchTerm, setSearchTerm] = useState('');

    const isLokSabha = activeTab === 'lok_sabha';
    const data = isLokSabha ? LOK_SABHA_COMPOSITION : RAJYA_SABHA_COMPOSITION;

    // State for Real Data
    const [dbMembers, setDbMembers] = useState<ParliamentMember[]>([]);
    const [nlpMembers, setNlpMembers] = useState<ParliamentMember[]>([]);

    // State for Alliance Filtering
    const [selectedAlliance, setSelectedAlliance] = useState<string | null>(null);

    // Pagination + performance polish
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);

    useEffect(() => {
        // Fetch LS and RS separately to avoid MLAs bleeding into RS list
        const mapMember = (m: any, house: string) => ({
            id: m.id.toString(),
            name: m.name,
            party: m.party,
            constituency: m.constituency,
            state: m.constituency,
            house,
            image: m.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=random`,
            role: ''
        });

        Promise.all([
            getMembers('Lok Sabha'),
            getMembers('Rajya Sabha'),
        ]).then(([lsData, rsData]) => {
            const lsMapped = (Array.isArray(lsData) ? lsData : []).map((m: any) => mapMember(m, 'lok_sabha'));
            const rsMapped = (Array.isArray(rsData) ? rsData : []).map((m: any) => mapMember(m, 'rajya_sabha'));
            setDbMembers([...lsMapped, ...rsMapped] as ParliamentMember[]);
        }).catch(err => console.error("Failed to load members", err));
    }, []);

    useEffect(() => {
        const loadNlp = async () => {
            try {
                const data: any = await getNlpMps();
                const members = Array.isArray(data.results) ? data.results : data;
                setNlpMembers(members.map((m: any) => ({
                    id: m.id?.toString?.() || `${m.mp_name || m.name}`,
                    name: m.name || m.mp_name || 'Unknown',
                    party: m.party || 'IND',
                    constituency: m.constituency || '',
                    state: m.state || '',
                    house: (m.house || 'lok_sabha').toLowerCase() === 'rajya_sabha' ? 'rajya_sabha' : 'lok_sabha',
                    image: m.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name || m.mp_name || 'Unknown')}&background=random`,
                    role: m.role || ''
                })));
            } catch (e) {
                console.error("NLP fetch failed", e);
            }
        };

        loadNlp();
    }, []);

    // Merge all data sources by house+name to avoid duplicate cards for the same MP.
    const mergedMembersMap = new Map<string, ParliamentMember>();
    const memberKey = (m: ParliamentMember) => `${(m.house || '').toLowerCase()}|${(m.name || '').trim().toLowerCase()}`;

    // Base static previews first
    PARLIAMENT_MEMBERS.forEach(m => {
        const normalized = normalizeMember(m);
        mergedMembersMap.set(memberKey(normalized), normalized);
    });
    MOCK_MEMBERS.forEach(m => {
        const normalized = normalizeMember(m);
        mergedMembersMap.set(memberKey(normalized), normalized);
    });

    // NLP members may have same IDs/names (replace if more authoritative)
    nlpMembers.forEach(m => {
        const normalized = normalizeMember(m);
        mergedMembersMap.set(memberKey(normalized), normalized);
    });

    // DB members are the most authoritative truth if loaded
    dbMembers.forEach(m => {
        const normalized = normalizeMember(m);
        mergedMembersMap.set(memberKey(normalized), normalized);
    });

    const sourceData = Array.from(mergedMembersMap.values());

    const lokSabhaFromNlp = uniqueBySeat(
        nlpMembers
            .filter((m) => m.house === 'lok_sabha')
            .map((m) => normalizeMember(m))
    );

    const lokSabhaAllSources = uniqueBySeat(sourceData.filter((m) => m.house === 'lok_sabha'));
    const lokSabhaBySeat = new Map<string, ParliamentMember>();
    for (const row of lokSabhaAllSources) {
        lokSabhaBySeat.set(seatKey(row), row);
    }
    for (const row of lokSabhaFromNlp) {
        // Prefer canonical NLP roster when the same seat exists in multiple sources.
        lokSabhaBySeat.set(seatKey(row), row);
    }
    const lokSabhaSource = Array.from(lokSabhaBySeat.values());

    const members = activeTab === 'lok_sabha'
        ? lokSabhaSource.slice(0, LOK_SABHA_COMPOSITION.total_seats)
        : sourceData.filter(m => m.house === activeTab);
    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.party.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.constituency && m.constituency.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const totalPages = Math.max(1, Math.ceil(filteredMembers.length / itemsPerPage));
    const paginatedMembers = filteredMembers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        // Reset to first page when user changes filter/search/house.
        setCurrentPage(1);
    }, [searchTerm, activeTab, selectedAlliance, itemsPerPage]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    // Calculate Alliance Totals (Dynamic based on sourceData would be better, but staying compatible with static 'data' structure for now)
    // To make charts dynamic, we'd need to re-calculate 'data' (LOK_SABHA_COMPOSITION) based on 'members'.
    // For this step, I will just ensure the LIST is dynamic. Updating the charts requires more complex logic.
    // I'll update the charts logic next if needed. For now, let's fix the list.

    const ndaSeats = data.parties.filter(p => p.alliance === 'NDA').reduce((acc, p) => acc + p.seats, 0);
    const indiaSeats = data.parties.filter(p => p.alliance === 'INDIA').reduce((acc, p) => acc + p.seats, 0);
    const otherSeats = data.parties.filter(p => p.alliance === 'OTHERS').reduce((acc, p) => acc + p.seats, 0);

    const handleMemberClick = (member: ParliamentMember) => {
        if (adminMode && onEditMember) {
            onEditMember(member);
            return;
        }
        // Navigate to dedicated page instead of opening modal
        // We'll pass the member ID in the URL.
        navigate(`/member/${member.id}`);
    };

    const { config } = useConfig();

    return (
        <div className={`space-y-8 animate-fade-in pb-24 ${config.glassmorphism ? '' : 'no-glass'}`}>

            {/* --- EMERGENCY ALERT BANNER --- */}
            {config.alert_message && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-center gap-4 animate-pulse">
                    <Activity className="text-red-500" />
                    <div className="text-red-500 font-bold uppercase tracking-widest">{config.alert_message}</div>
                </div>
            )}

            {/* --- HERO HEADER --- */}
            <div
                className={`relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br shadow-2xl transition-all duration-500`}
                style={{
                    // Dynamic Gradient based on Primary Color or Default Houses
                    background: config.primary_color && config.primary_color !== '#FF9933'
                        ? `linear-gradient(135deg, ${config.primary_color}, #000000)`
                        : isLokSabha
                            ? 'linear-gradient(135deg, #064e3b, #115e59)' // emerald-900 to teal-900
                            : 'linear-gradient(135deg, #881337, #450a0a)'  // rose-900 to red-950
                }}
            >
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>

                <div className="relative p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-8">
                        <div className="hidden md:flex flex-col items-center justify-center w-32 h-32 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-inner">
                            <Users size={56} className="text-white drop-shadow-lg" />
                        </div>
                        <div>
                            <div className="flex gap-3 mb-4">
                                <button
                                    onClick={() => setHouse('lok_sabha')}
                                    className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'lok_sabha' ? 'bg-white text-emerald-900 shadow-lg scale-105' : 'bg-black/30 text-white/70 hover:bg-black/40'}`}
                                >
                                    Lok Sabha
                                </button>
                                <button
                                    onClick={() => setHouse('rajya_sabha')}
                                    className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'rajya_sabha' ? 'bg-white text-rose-900 shadow-lg scale-105' : 'bg-black/30 text-white/70 hover:bg-black/40'}`}
                                >
                                    Rajya Sabha
                                </button>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-none mb-2 drop-shadow-xl">
                                {isLokSabha ? 'House of the People' : 'Council of States'}
                            </h1>
                            <p className="text-white/80 font-medium text-xl flex items-center gap-2">
                                <Activity size={20} />
                                Max Strength: <span className="text-white font-bold text-2xl">{data.total_seats}</span> Seats
                            </p>
                        </div>
                    </div>

                    {/* Quick Stats Pill */}
                    <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10 min-w-[200px]">
                        <div className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2">Current Session</div>
                        <div className="flex items-center gap-2 text-white font-bold">
                            <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></span>
                            {config.session_name || 'Budget Session 2026'}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- LEADERSHIP CARDS (Ultra Premium) --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. President (Always Head) */}
                <div className="col-span-1 md:col-span-3 lg:col-span-1 bg-gradient-to-b from-amber-900 to-amber-950 rounded-3xl p-1 shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="bg-black/20 backdrop-blur-sm h-full rounded-[1.3rem] p-6 flex items-center gap-6 relative z-10">
                        <img src={LEADERSHIP_DATA.president.image} className="w-20 h-20 rounded-2xl border-2 border-amber-500/50 object-cover shadow-lg" alt="President" />
                        <div>
                            <div className="px-3 py-1 bg-amber-500/20 rounded-full w-fit mb-2 border border-amber-500/30">
                                <span className="text-[10px] font-black text-amber-300 uppercase tracking-[0.2em]">Head of State</span>
                            </div>
                            <h2 className="text-xl font-bold text-white leading-tight">{LEADERSHIP_DATA.president.name}</h2>
                            <p className="text-amber-200/60 text-xs mt-1">President of India</p>
                        </div>
                    </div>
                </div>

                {/* 2. House Chairman/Speaker */}
                <div className={`col-span-1 bg-gradient-to-br ${isLokSabha ? 'from-emerald-800 to-teal-900' : 'from-rose-800 to-red-900'} rounded-3xl p-6 relative overflow-hidden shadow-xl group hover:shadow-2xl transition-all`}>
                    <div className="relative z-10 flex items-center gap-6">
                        <img src={isLokSabha ? LEADERSHIP_DATA.speaker.image : LEADERSHIP_DATA.vice_president.image} className="w-20 h-20 rounded-2xl border-2 border-white/20 object-cover shadow-lg" alt="Speaker" />
                        <div>
                            <div className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-1">Presiding Officer</div>
                            <h2 className="text-xl font-bold text-white leading-tight">
                                {isLokSabha ? LEADERSHIP_DATA.speaker.name : LEADERSHIP_DATA.vice_president.name}
                            </h2>
                            <p className="text-white/60 text-xs mt-1">
                                {isLokSabha ? 'Speaker of the House' : 'Chairman'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 3. Leader of House (PM) */}
                <div className="col-span-1 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl"></div>
                    <div className="relative z-10 flex items-center gap-6">
                        <img src={LEADERSHIP_DATA.prime_minister.image} className="w-20 h-20 rounded-2xl border-2 border-orange-100 dark:border-orange-900 object-cover shadow-lg" alt="Prime Minister" />
                        <div>
                            <div className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-[0.2em] mb-1">Leader of House</div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{LEADERSHIP_DATA.prime_minister.name}</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Prime Minister</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- CABINET MINISTERS (New Feature) --- */}
            <CabinetMinisters scope="nation" />

            {/* --- COMPOSITION & ALLIANCES --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* LEFT: Charts (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Alliance Breakdown Bar */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 shadow-lg">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <PieChart className="text-slate-400" size={20} />
                                Alliance Strength
                            </h3>
                            <button
                                onClick={() => setSelectedAlliance(null)}
                                className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${!selectedAlliance ? 'bg-slate-200 text-slate-800' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                {selectedAlliance ? 'Clear Filter' : `Majority Mark: ${Math.floor(data.total_seats / 2) + 1}`}
                            </button>
                        </div>

                        {/* Progress Bar (Clickable Segments) */}
                        <div className="h-16 w-full rounded-2xl overflow-hidden flex shadow-inner ring-4 ring-slate-50 dark:ring-slate-800 mb-6 cursor-pointer">
                            <div onClick={() => setSelectedAlliance('NDA')} style={{ width: `${(ndaSeats / data.total_seats) * 100}%` }} className={`h-full bg-gradient-to-r from-orange-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-md z-10 relative group transition-opacity ${selectedAlliance && selectedAlliance !== 'NDA' ? 'opacity-30' : 'opacity-100'}`}>
                                <span className="hidden group-hover:inline absolute -top-8 bg-black/80 text-white text-[10px] px-2 py-1 rounded">NDA</span>
                                {ndaSeats}
                            </div>
                            <div onClick={() => setSelectedAlliance('INDIA')} style={{ width: `${(indiaSeats / data.total_seats) * 100}%` }} className={`h-full bg-gradient-to-r from-blue-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-md z-10 relative group transition-opacity ${selectedAlliance && selectedAlliance !== 'INDIA' ? 'opacity-30' : 'opacity-100'}`}>
                                <span className="hidden group-hover:inline absolute -top-8 bg-black/80 text-white text-[10px] px-2 py-1 rounded">INDIA</span>
                                {indiaSeats}
                            </div>
                            <div onClick={() => setSelectedAlliance('OTHERS')} style={{ width: `${(otherSeats / data.total_seats) * 100}%` }} className={`h-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs transition-opacity ${selectedAlliance && selectedAlliance !== 'OTHERS' ? 'opacity-30' : 'opacity-100'}`}>
                                {otherSeats}
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-center">
                            <button onClick={() => setSelectedAlliance('NDA')} className={`p-4 rounded-2xl border transition-all ${selectedAlliance === 'NDA' ? 'bg-orange-100 border-orange-300 ring-2 ring-orange-200' : 'bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30'}`}>
                                <div className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-1">NDA</div>
                                <div className="text-2xl font-black text-slate-900 dark:text-white">{ndaSeats}</div>
                            </button>
                            <button onClick={() => setSelectedAlliance('INDIA')} className={`p-4 rounded-2xl border transition-all ${selectedAlliance === 'INDIA' ? 'bg-blue-100 border-blue-300 ring-2 ring-blue-200' : 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30'}`}>
                                <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">INDIA</div>
                                <div className="text-2xl font-black text-slate-900 dark:text-white">{indiaSeats}</div>
                            </button>
                            <button onClick={() => setSelectedAlliance('OTHERS')} className={`p-4 rounded-2xl border transition-all ${selectedAlliance === 'OTHERS' ? 'bg-slate-200 border-slate-300 ring-2 ring-slate-200' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Others</div>
                                <div className="text-2xl font-black text-slate-900 dark:text-white">{otherSeats}</div>
                            </button>
                        </div>
                    </div>

                    {/* Detailed Party Grid */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 shadow-lg">
                        <div className="flex items-center gap-2 mb-6 text-slate-500">
                            <BarChart3 size={20} />
                            <h3 className="font-bold text-slate-900 dark:text-white">
                                {selectedAlliance ? `${selectedAlliance} Parties` : 'All Parties'}
                            </h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-in fade-in duration-500">
                            {data.parties.filter(p => !selectedAlliance || p.alliance === selectedAlliance).map((party) => (
                                <div key={party.party} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:bg-white hover:shadow-md dark:hover:bg-slate-800 transition-all">
                                    <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: party.color }}></div>
                                    <div>
                                        <div className="text-lg font-black text-slate-800 dark:text-white leading-none">{party.seats}</div>
                                        <div className="text-[10px] font-bold text-slate-500 uppercase truncate max-w-[80px]">{party.party}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {data.parties.filter(p => !selectedAlliance || p.alliance === selectedAlliance).length === 0 && (
                            <div className="text-center text-slate-400 py-8">No parties found in this alliance.</div>
                        )}
                    </div>

                    {/* Political Map (New Feature) */}
                    <PoliticalMap />
                </div>

                {/* RIGHT: Member Directory (5 cols) */}
                <div className="lg:col-span-5 flex flex-col h-full">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col h-[800px] sticky top-24">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/90 backdrop-blur-md">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Member Directory</h3>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search MPs..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 pl-10 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-shadow"
                                />
                                <Search size={16} className="absolute left-3 top-3.5 text-slate-400" />
                            </div>
                            <div className="mt-2 text-xs text-slate-500">
                                Showing {filteredMembers.length} of {members.length} {activeTab === 'lok_sabha' ? 'Lok Sabha' : 'Rajya Sabha'} members
                            </div>
                            <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <span>Rows</span>
                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                                    >
                                        <option value={25}>25</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                        <option value={200}>200</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage <= 1}
                                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"
                                    >
                                        <ChevronLeft size={14} />
                                        Prev
                                    </button>
                                    <span className="text-slate-500">Page {currentPage} / {totalPages}</span>
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage >= totalPages}
                                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"
                                    >
                                        Next
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                            {paginatedMembers.map(m => (
                                <div key={`${m.id || ''}|${seatKey(m)}|${m.name}`} onClick={() => handleMemberClick(m)} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl cursor-pointer transition-colors group border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                                    <img src={m.image} className="w-12 h-12 rounded-full object-cover bg-slate-200" alt={m.name} />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-slate-800 dark:text-white truncate text-sm">{m.name}</div>
                                        <div className="text-xs text-slate-500 flex items-center gap-1">
                                            <span style={{ color: isLokSabha && m.party === 'BJP' ? '#FF9933' : '#666' }} className="font-bold">{m.party}</span>
                                            <span>•</span>
                                            <span className="truncate">{m.constituency || m.state}</span>
                                        </div>
                                    </div>
                                    <ChevronLeft size={16} className="text-slate-300 group-hover:text-blue-500 rotate-180 transition-colors" />
                                </div>
                            ))}
                            {filteredMembers.length === 0 && (
                                <div className="text-center p-8 text-slate-400 text-sm">
                                    No members found for "{searchTerm}"
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>

            {/* Modal Removed - Using Full Page Navigation */}
        </div>
    );
};
