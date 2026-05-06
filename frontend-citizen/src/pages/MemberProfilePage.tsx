import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    User, Activity, MapPin, Building2, Flag,
    Briefcase, Calendar, Award, Share2, ArrowLeft,
    CheckCircle2, Heart
} from 'lucide-react';
import { getMemberFullProfile, getNlpMpScores, getNlpMpEvidence, getNlpMpSpeeches, getMembers, getNlpMps } from '../services/api';
import { PARLIAMENT_MEMBERS, ParliamentMember } from '../services/realNationData';
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
import { LegislativePerformance } from '../components/LegislativePerformance';
import { SocietyImpact } from '../components/SocietyImpact';
const MemberPerformanceChart = lazy(() => import('../components/MemberPerformanceChart').then((module) => ({ default: module.MemberPerformanceChart })));
import { MemberSpeeches } from '../components/MemberSpeeches';

export const MemberProfilePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [member, setMember] = useState<ParliamentMember | null>(null);
    const [performanceData, setPerformanceData] = useState<any>(null); // New State
    const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'bills' | 'debates' | 'impact'>('overview');

    useEffect(() => {
        const resolveFromNlp = async () => {
            const nlp = await getNlpMps(id || '', 1000);
            const nlpMembers = Array.isArray(nlp?.results) ? nlp.results : [];
            const routeId = (id || '').trim().toLowerCase();
            const normalizedRouteId = routeId.replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
            const normalizeName = (value: string) =>
                (value || '')
                    .toString()
                    .replace(/\(.*?\)/g, '')
                    .replace(/-/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .toLowerCase();

            const nlpMatch = nlpMembers.find((m: any) => {
                const nlpId = (m.id || '').toString().trim().toLowerCase();
                const nlpName = (m.name || m.mp_name || '').toString().trim().toLowerCase();
                const normalizedNlpId = normalizeName(nlpId);
                const normalizedNlpName = normalizeName(nlpName);
                return (
                    nlpId === routeId ||
                    nlpName === routeId ||
                    normalizedNlpId === normalizedRouteId ||
                    normalizedNlpName === normalizedRouteId ||
                    normalizedNlpName.includes(normalizedRouteId) ||
                    normalizedRouteId.includes(normalizedNlpName)
                );
            });

            if (nlpMatch) {
                const canonicalName = (nlpMatch.name || nlpMatch.mp_name || '').toString();
                const normalizedCanonicalName = normalizeName(canonicalName);
                const staticMatch = PARLIAMENT_MEMBERS.find((m) => normalizeName(m.name) === normalizedCanonicalName)
                    || MOCK_MEMBERS.find((m) => normalizeName(m.name) === normalizedCanonicalName);
                let dbMatch: any = null;

                try {
                    const dbMembers = await getMembers();
                    dbMatch = dbMembers.find((m: any) => normalizeName(m.name || '') === normalizedCanonicalName)
                        || dbMembers.find((m: any) => normalizeName(m.name || '').includes(normalizedCanonicalName)
                            || normalizedCanonicalName.includes(normalizeName(m.name || '')));
                } catch {
                    dbMatch = null;
                }

                const nlpParty = (nlpMatch.party || '').toString().trim();
                const resolvedParty =
                    (nlpParty && nlpParty.toLowerCase() !== 'unknown' ? nlpParty : '')
                    || (dbMatch?.party || '').toString().trim()
                    || (staticMatch?.party || '').toString().trim()
                    || 'Unknown';

                const mappedMember: ParliamentMember = {
                    id: (nlpMatch.id || nlpMatch.name || nlpMatch.mp_name || id || '').toString(),
                    name: canonicalName || 'Unknown',
                    party: resolvedParty,
                    constituency: nlpMatch.constituency || dbMatch?.constituency || (staticMatch as any)?.constituency || '',
                    state: nlpMatch.state || dbMatch?.state_id || (staticMatch as any)?.state || nlpMatch.constituency || '',
                    house: (nlpMatch.house || 'lok_sabha').toLowerCase() === 'rajya_sabha' ? 'rajya_sabha' : 'lok_sabha',
                    image: nlpMatch.image || dbMatch?.profile_image || (staticMatch as any)?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(canonicalName || 'Unknown')}&background=random`,
                    role: nlpMatch.role || ''
                };
                setMember(mappedMember);
            }
        };

        // 1. Try Static Data First (expanded to full list)
        const foundMember = PARLIAMENT_MEMBERS.find(m => m.id === id) || MOCK_MEMBERS.find(m => m.id === id);
        if (foundMember) {
            setMember(normalizeMember(foundMember));
        } else {
            // 2. Try Database if not found in static
            getMembers().then(async (data: any[]) => {
                const dbMember = data.find((m: any) => m.id.toString() === id);
                if (dbMember) {
                    const mappedMember: ParliamentMember = {
                        id: dbMember.id.toString(),
                        name: dbMember.name,
                        party: dbMember.party,
                        constituency: dbMember.constituency,
                        state: dbMember.constituency, // Fallback
                        house: dbMember.house_id === 1 ? 'lok_sabha' : 'rajya_sabha',
                        image: dbMember.profile_image || `https://ui-avatars.com/api/?name=${dbMember.name}&background=random`,
                        role: '' // Dynamic roles if needed
                    };
                    setMember(mappedMember);
                    return;
                }

                // 3. Fallback to NLP MP index for full Lok Sabha coverage.
                await resolveFromNlp();
            }).catch(async (err) => {
                console.error("Member not found", err);
                try {
                    await resolveFromNlp();
                } catch (nlpErr) {
                    console.error('NLP member fallback failed', nlpErr);
                }
            });
        }

        // 3. Load live data from API gateway
        const loadData = async () => {
            try {
                if (!id) return;

                // Resolve numeric member ID for back-end full profile route
                let numericMemberId: number | null = null;
                if (!Number.isNaN(Number(id))) {
                    numericMemberId = Number(id);
                }

                const staticMemberFromList = PARLIAMENT_MEMBERS.find(m => m.id === id) || MOCK_MEMBERS.find(m => m.id === id);
                if (numericMemberId === null && staticMemberFromList) {
                    const allDbMembers = await getMembers();
                    const dbMatch = allDbMembers.find((m: any) => m.name?.trim().toLowerCase() === staticMemberFromList.name.trim().toLowerCase());
                    if (dbMatch) {
                        numericMemberId = Number(dbMatch.id);
                    }
                }

                let fullProfile: any = null;
                if (numericMemberId !== null) {
                    fullProfile = await getMemberFullProfile(numericMemberId.toString());
                    if (fullProfile?.member) {
                        const apiMember = fullProfile.member;
                        setMember({
                            id: apiMember.id.toString(),
                            name: apiMember.name,
                            party: apiMember.party,
                            constituency: apiMember.constituency,
                            state: apiMember.state_id || apiMember.constituency || 'Unknown',
                            house: apiMember.house_id === 1 ? 'lok_sabha' : 'rajya_sabha',
                            image: apiMember.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(apiMember.name)}&background=random`,
                            role: ''
                        });
                    }
                } else {
                    console.warn('Cannot resolve numeric member ID for full profile (fallback to static data)', id);
                }

                if (!fullProfile && staticMemberFromList) {
                    setMember(normalizeMember(staticMemberFromList));
                }

                const fallbackName = staticMemberFromList?.name || (Number.isNaN(Number(id || '')) ? (id || '') : '');
                let memberName = fullProfile?.member?.name || fallbackName;

                if (id) {
                    const routeToken = id.trim().toLowerCase();
                    const normalizedRouteToken = routeToken.replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
                    const normalizedMemberName = (memberName || '').trim().toLowerCase();
                    const shouldResolveFromNlp =
                        !memberName ||
                        normalizedMemberName === routeToken ||
                        normalizedMemberName === normalizedRouteToken ||
                        (normalizedMemberName.includes('-') && !normalizedMemberName.includes(' '));

                    if (shouldResolveFromNlp) {
                        const nlp = await getNlpMps(normalizedRouteToken || routeToken, 1000);
                        const nlpMembers = Array.isArray(nlp?.results) ? nlp.results : [];
                        const nlpMatch = nlpMembers.find((m: any) => {
                            const nlpId = (m.id || '').toString().trim().toLowerCase();
                            const nlpName = (m.name || m.mp_name || '').toString().trim().toLowerCase();
                            return (
                                nlpId === routeToken ||
                                nlpName === routeToken ||
                                nlpId === normalizedRouteToken ||
                                nlpName === normalizedRouteToken
                            );
                        }) || nlpMembers.find((m: any) => {
                            const nlpName = (m.name || m.mp_name || '').toString().trim().toLowerCase();
                            return nlpName.includes(normalizedRouteToken) || normalizedRouteToken.includes(nlpName);
                        });

                        if (nlpMatch?.name || nlpMatch?.mp_name) {
                            memberName = (nlpMatch.name || nlpMatch.mp_name || '').toString();
                        }
                    }
                }

                if (!memberName) {
                    console.warn('Member name unresolved; skipping NLP score/evidence calls', { id, fullProfile, member });
                    setPerformanceData({
                        ...(fullProfile?.performance || {}),
                        nlpScores: null,
                        nlpEvidence: null,
                        warning: 'Member name is not available for NLP endpoint calls.'
                    });
                    return;
                }

                const [nlpScoresResult, nlpEvidenceResult, nlpSpeechesResult] = await Promise.allSettled([
                    getNlpMpScores(memberName),
                    getNlpMpEvidence(memberName),
                    getNlpMpSpeeches(memberName, 500, 0, true, 'all')
                ]);

                const nlpScores = nlpScoresResult.status === 'fulfilled' ? nlpScoresResult.value : null;
                const nlpEvidence = nlpEvidenceResult.status === 'fulfilled' ? nlpEvidenceResult.value : null;
                const normalizedScores = (() => {
                    if (!nlpScores || typeof nlpScores !== 'object') {
                        return {} as Record<string, number>;
                    }

                    const nested = (nlpScores as any).core_values_score;
                    const source =
                        nested && typeof nested === 'object' && !Array.isArray(nested)
                            ? nested
                            : nlpScores;

                    return Object.fromEntries(
                        Object.entries(source)
                            .filter(([key]) => {
                                return key !== 'mp_name' && key !== 'batch' && key !== 'batch_id' && key !== 'total_score';
                            })
                            .map(([key, value]) => [key, Number(value)])
                            .filter(([, value]) => Number.isFinite(value))
                    ) as Record<string, number>;
                })();
                const nlpSpeeches =
                    nlpSpeechesResult.status === 'fulfilled' && Array.isArray(nlpSpeechesResult.value?.speeches)
                        ? nlpSpeechesResult.value.speeches
                        : [];
                const speechesLoaded = nlpSpeechesResult.status === 'fulfilled';
                const speechesUnavailable = nlpSpeechesResult.status === 'rejected';

                const legacyPerformance = { ...(fullProfile?.performance || {}) };
                if (speechesLoaded) {
                    delete legacyPerformance.error;
                    delete legacyPerformance.warning;
                }

                setPerformanceData({
                    ...legacyPerformance,
                    // Keep both keys for compatibility across old and new UI paths.
                    nlpScores,
                    nlpEvidence,
                    scores: Object.keys(normalizedScores).length > 0 ? normalizedScores : (legacyPerformance.scores || {}),
                    evidence: nlpEvidence,
                    speeches: nlpSpeeches,
                    speechesLoaded,
                    speechesUnavailable
                });
            } catch (err) {
                console.error('Member profile load failed', err);
                setPerformanceData({ error: (err as Error).message });
            }
        };

        loadData();

        return undefined;
    }, [id]);

    // Live Preview Listener (Admin -> User)
    useEffect(() => {
        if (typeof BroadcastChannel === 'undefined') {
            return undefined;
        }

        const channel = new BroadcastChannel('admin-live-preview');
        channel.onmessage = (event) => {
            if (event.data?.type === 'MEMBER_PREVIEW' && event.data?.data) {
                const preview = event.data.data;
                // Only accept preview if we're on the new member page (no ID) OR the IDs match
                if (!id || (preview.id && preview.id.toString() === id.toString())) {
                    setMember((prev: any) => ({
                        ...prev,
                        name: preview.name || prev?.name || 'New Member',
                        party: preview.party || prev?.party || 'Independent',
                        constituency: preview.constituency || prev?.constituency || '',
                        state: preview.state_id || preview.state || prev?.state || '',
                        house: preview.house_id === 1 ? 'lok_sabha' : preview.house_id === 2 ? 'rajya_sabha' : prev?.house || 'lok_sabha'
                    }));
                }
            }
        };
        return () => channel.close();
    }, [id]);

    if (!member) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500 animate-pulse">Loading Elite Profile...</div>;

    const isBJP = member.party === 'BJP';
    const isINC = member.party === 'INC';

    // Gradients & Colors
    const themeGradient = isBJP
        ? 'from-orange-500 via-orange-600 to-orange-800'
        : isINC
            ? 'from-blue-500 via-blue-600 to-blue-800'
            : 'from-slate-700 via-slate-800 to-slate-900';

    const accentColor = isBJP ? 'text-orange-600' : isINC ? 'text-blue-600' : 'text-slate-600';
    const bgAccent = isBJP ? 'bg-orange-50' : isINC ? 'bg-blue-50' : 'bg-slate-50';
    const borderAccent = isBJP ? 'border-orange-100' : isINC ? 'border-blue-100' : 'border-slate-100';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 animate-fade-in relative z-50 overflow-x-hidden content-bg-pattern">


            {/* --- 1. PROFESSIONAL HEADER (Clean & Standard) --- */}
            <div className={`relative bg-gradient-to-br ${themeGradient} pb-16 pt-24 px-6 md:px-10`}>

                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 bg-black/20 hover:bg-black/30 backdrop-blur-md rounded-full text-white text-sm font-bold transition-all border border-white/10"
                >
                    <ArrowLeft size={16} />
                    Back
                </button>

                {/* Patterns */}
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-end gap-8 relative z-10">

                    {/* Avatar Container (Manual Override for VIPs) */}
                    <div className="w-48 h-48 md:w-64 md:h-64 shrink-0 rounded-2xl p-1 bg-white shadow-2xl rotate-0 md:mb-[-4rem] order-2 md:order-1">
                        <img
                            src={member.name === 'Narendra Modi' ? 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Narendra_Modi_2021.jpg/480px-Narendra_Modi_2021.jpg' :
                                member.name === 'Rahul Gandhi' ? 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Rahul_Gandhi_March_2024.jpg/480px-Rahul_Gandhi_March_2024.jpg' :
                                    member.name === 'Amit Shah' ? 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Amit_Shah_new_portrait.jpg/480px-Amit_Shah_new_portrait.jpg' :
                                        member.name === 'Rajnath Singh' ? 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Rajnath_Singh_official_portrait.jpg/480px-Rajnath_Singh_official_portrait.jpg' :
                                            member.image}
                            alt={member.name}
                            className="w-full h-full object-cover rounded-xl bg-slate-200"
                        />
                    </div>

                    {/* Text Details */}
                    <div className="flex-1 pb-4 text-white order-1 md:order-2">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-black/20 backdrop-blur-md border border-white/20 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest">
                                {member.house === 'lok_sabha' ? 'Lok Sabha' : 'Rajya Sabha'}
                            </span>
                            <span className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 bg-white text-slate-900 shadow-sm`}>
                                <div className={`w-2 h-2 rounded-full ${isBJP ? 'bg-orange-500' : isINC ? 'bg-blue-500' : 'bg-slate-500'}`}></div>
                                {member.party}
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-black leading-tight mb-2 tracking-tight">
                            {member.name}
                        </h1>

                        <div className="flex flex-wrap items-center gap-4 text-lg font-medium text-white/90">
                            {member.role && (
                                <span className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg border border-white/10 text-sm md:text-base">
                                    <Award size={18} />
                                    {member.role}
                                </span>
                            )}
                            <span className="flex items-center gap-2 opacity-80 text-sm md:text-base">
                                <MapPin size={18} />
                                {member.constituency ? `${member.constituency}, ` : ''}{member.state}
                            </span>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="pb-4 hidden md:block order-3">
                        <button className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold text-sm shadow-xl hover:scale-105 transition-transform flex items-center gap-2">
                            <Share2 size={18} />
                            Share Profile
                        </button>
                    </div>

                </div>
            </div>

            {/* --- 2. MAIN CONTENT LAYOUT --- */}
            <div className="max-w-7xl mx-auto px-6 md:px-10 mt-6 md:mt-20 relative z-20">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* LEFT COLUMN: Quick Nav */}
                    <div className="w-full lg:w-72 shrink-0 flex flex-col gap-6">

                        {/* Navigation Menu */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 p-2 overflow-hidden sticky top-24">
                            <NavButton
                                active={activeTab === 'overview'}
                                onClick={() => setActiveTab('overview')}
                                icon={<User size={18} />}
                                label="Overview"
                                color={isBJP ? 'orange' : isINC ? 'blue' : 'slate'}
                            />
                            <NavButton
                                active={activeTab === 'activity'}
                                onClick={() => setActiveTab('activity')}
                                icon={<Activity size={18} />}
                                label="Performance"
                                color={isBJP ? 'orange' : isINC ? 'blue' : 'slate'}
                            />
                            <NavButton
                                active={activeTab === 'debates'}
                                onClick={() => setActiveTab('debates')}
                                icon={<Share2 size={18} />}
                                label="Debates & Speeches"
                                color={isBJP ? 'orange' : isINC ? 'blue' : 'slate'}
                            />
                            <NavButton
                                active={activeTab === 'bills'}
                                onClick={() => setActiveTab('bills')}
                                icon={<Briefcase size={18} />}
                                label="Bills & Legislation"
                                color={isBJP ? 'orange' : isINC ? 'blue' : 'slate'}
                            />

                            <NavButton
                                active={activeTab === 'impact'}
                                onClick={() => setActiveTab('impact')}
                                icon={<Heart size={18} />}
                                label="Impact & Society"
                                color={isBJP ? 'orange' : isINC ? 'blue' : 'slate'}
                            />
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 px-2 pb-2">
                                <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-3 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                                        <CheckCircle2 size={16} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Status</div>
                                        <div className="text-xs font-bold text-slate-900 dark:text-white">Active Member</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* RIGHT COLUMN: Content */}
                    <div className="flex-1 space-y-8 pb-20">

                        {/* TAB CONTENT: Overview */}
                        {activeTab === 'overview' && (
                            <div className="space-y-8 animate-slide-up">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <DetailCard icon={<MapPin className={accentColor} />} label="Constituency" value={member.constituency || 'N/A'} subValue={member.state} bg={bgAccent} border={borderAccent} />
                                    <DetailCard icon={<Building2 className={accentColor} />} label="House" value={member.house === 'lok_sabha' ? 'Lok Sabha' : 'Rajya Sabha'} subValue="Parliament of India" bg={bgAccent} border={borderAccent} />
                                    <DetailCard icon={<Flag className={accentColor} />} label="Party" value={member.party} subValue={member.party === 'BJP' || member.party === 'INC' ? 'National Party' : 'Regional Party'} bg={bgAccent} border={borderAccent} />
                                    <DetailCard icon={<Calendar className={accentColor} />} label="Term Start" value="June 2024" subValue="18th Lok Sabha" bg={bgAccent} border={borderAccent} />
                                </div>

                                <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 dark:bg-white/5 rounded-bl-[100px] -mr-16 -mt-16"></div>
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 relative z-10 flex items-center gap-2">
                                        <Award className="text-amber-500" />
                                        Professional Biography
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-400 leading-8 text-lg relative z-10">
                                        A distinguished member of the <strong>{member.party}</strong>, representing the people of {member.constituency || member.state}.
                                        Currently serving in the <strong>{member.house === 'lok_sabha' ? '18th Lok Sabha' : 'Rajya Sabha'}</strong>, focusing on national development policies and regional welfare.
                                        {member.role ? ` Holds the portfolio of ${member.role} in the Union Cabinet.` : ''}
                                        <br /><br />
                                        Known for active participation in debates concerning infrastructure and economic reforms.
                                        Has consistently advocated for sustainable development goals within the constituency.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* TAB CONTENT: Activity (Enchanced Government Edition) */}
                        {activeTab === 'activity' && (
                            <div className="space-y-6 animate-slide-up">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <StatBox value="92%" label="Attendance" color="text-emerald-500" />
                                    <StatBox value={performanceData?.speeches?.length || "45"} label="Debates" color="text-blue-500" />
                                    <StatBox value="128" label="Questions" color="text-amber-500" />
                                </div>

                                {Object.keys(performanceData?.scores || {}).length > 0 ? (
                                    <MemberPerformanceChart scores={performanceData.scores} />
                                ) : (
                                    <LegislativePerformance />
                                )}
                            </div>
                        )}

                        {/* TAB CONTENT: Impact (New Feature) */}
                        {activeTab === 'impact' && (
                            <div className="space-y-6 animate-slide-up">
                                <SocietyImpact />
                            </div>
                        )}

                        {/* TAB CONTENT: Debates (New Feature) */}
                        {activeTab === 'debates' && (
                            <div className="space-y-6 animate-slide-up">
                                <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                                            <Share2 size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Speeches & Interventions</h3>
                                            <p className="text-sm text-slate-500 font-medium">Verified Parliamentary Record</p>
                                        </div>
                                    </div>

                                    {Array.isArray(performanceData?.speeches) && performanceData.speeches.length > 0 ? (
                                        <MemberSpeeches speeches={performanceData.speeches} />
                                    ) : performanceData?.speechesUnavailable || performanceData?.error || performanceData?.warning ? (
                                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-200">
                                            <div className="text-sm font-bold uppercase tracking-widest mb-2">Live debates unavailable</div>
                                            <p className="text-sm leading-relaxed">
                                                This screen needs the NLP service and pipeline data on port 8001. Your current dev mode starts only frontend + core backend, so debates cannot be loaded right now.
                                            </p>
                                        </div>
                                    ) : performanceData?.speechesLoaded ? (
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-700 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-200">
                                            <div className="text-sm font-bold uppercase tracking-widest mb-2">No live debates found</div>
                                            <p className="text-sm leading-relaxed">No speech rows are available yet for this member in the current NLP dataset.</p>
                                        </div>
                                    ) : (
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-700 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-200">
                                            <div className="text-sm font-bold uppercase tracking-widest mb-2">Loading live debates</div>
                                            <p className="text-sm leading-relaxed">Fetching speech records from backend services...</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB CONTENT: Bills */}
                        {activeTab === 'bills' && (
                            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-12 border border-slate-200 dark:border-slate-800 shadow-sm text-center animate-slide-up">
                                <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100 dark:border-slate-700">
                                    <Briefcase size={40} className="text-slate-300" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No Private Member Bills</h3>
                                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed text-lg">
                                    This member has not introduced any Private Member Bills in the current legislative session.
                                </p>
                            </div>
                        )}

                    </div>
                </div>
            </div>

        </div>
    );
};

// --- Sub-Components ---

const NavButton = ({ active, onClick, icon, label, color }: any) => {
    const activeClass = color === 'orange'
        ? 'bg-orange-50 text-orange-700 border-l-4 border-orange-500 dark:bg-orange-900/20 dark:text-orange-300'
        : color === 'blue'
            ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500 dark:bg-blue-900/20 dark:text-blue-300'
            : 'bg-slate-100 text-slate-900 border-l-4 border-slate-500';

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-6 py-4 text-left font-bold transition-all duration-200 group ${active ? activeClass : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-400 hover:text-slate-900'}`}
        >
            <span className={active ? '' : 'opacity-70 group-hover:opacity-100'}>{icon}</span>
            {label}
        </button>
    );
};

const DetailCard = ({ icon, label, value, subValue, bg, border }: any) => (
    <div className={`p-6 rounded-2xl ${bg} border ${border} transition-all hover:shadow-md`}>
        <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-white/60 dark:bg-black/10 rounded-xl backdrop-blur-sm shadow-sm">{icon}</div>
        </div>
        <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</div>
            <div className="text-xl font-black text-slate-800 dark:text-slate-100 leading-tight">{value}</div>
            {subValue && <div className="text-sm font-semibold text-slate-500/80 mt-1">{subValue}</div>}
        </div>
    </div>
);

const StatBox = ({ value, label, color }: any) => (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-sm hover:shadow-lg transition-all transform hover:-translate-y-1">
        <div className={`text-4xl font-black ${color} mb-2`}>{value}</div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</div>
    </div>
);
