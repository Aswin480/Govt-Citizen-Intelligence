import React, { useEffect, useState } from 'react';
import { useGovernanceScope } from '../context/GovernanceScopeContext';

import { getStateData, getMembers } from '../services/api';
import { RealStateData } from '../services/realStateData';
import { ArrowLeft, Building2, Crown, Info, Map as MapIcon, Shield, Users, X, User, Activity, Briefcase, Calendar, Award, Share2, CheckCircle2, Flag } from 'lucide-react';
import { MemberPerformance } from '../components/MemberPerformance';
import { CabinetMinisters } from '../components/CabinetMinisters';
import { OfficialMemberRegistry } from '../components/OfficialMemberRegistry';

export const StateDashboard: React.FC = () => {
    const { selectedState, setScope, setSelectedState } = useGovernanceScope();
    const [data, setData] = useState<RealStateData | null>(null);
    const [lsMembers, setLsMembers] = useState<any[]>([]);
    const [rsMembers, setRsMembers] = useState<any[]>([]);
    const [mlas, setMlas] = useState<any[]>([]);
    const [selectedMember, setSelectedMember] = useState<any | null>(null);
    const [activeProfileTab, setActiveProfileTab] = useState<'overview' | 'performance'>('overview');

    useEffect(() => {
        const loadData = async () => {
            if (selectedState) {
                // Fetch State Data
                try {
                    const stateData = await getStateData(selectedState.id);
                    if (stateData) setData(stateData);
                } catch (e) { console.error("State load failed", e); }

                // Fetch Members
                try {
                    const ls = await getMembers("Lok Sabha", selectedState.id);
                    setLsMembers(ls);
                    const rs = await getMembers("Rajya Sabha", selectedState.id);
                    setRsMembers(rs);
                    // Fetch MLAs
                    const mlaList = await getMembers(undefined, selectedState.id, "state_assembly");
                    setMlas(mlaList);
                } catch (e) {
                    console.error("Members load failed", e);
                }
            }
        };
        loadData();
    }, [selectedState]);

    if (!selectedState) return null;

    const handleBack = () => {
        setScope('nation');
        setSelectedState(null);
    };

    // Fallback if data is missing
    const safeData = data || {
        id: selectedState.id,
        leadership: { governor: { name: "Pending Update" } },
        total_seats: 0,
        composition: []
    };

    // Logic to show CM: Only if data has it (which means it's a State or a UT with Assembly)
    // User requested "in union teritoryes donthave cm only governer". 
    // We strictly respect the data: if 'chief_minister' is undefined in RealStateData, we don't render the card.
    const showCM = !!safeData.leadership.chief_minister;

    // Calculate majority
    const sortedComposition = [...(safeData.composition || [])].sort((a, b) => b.seats - a.seats);
    const majorityMark = Math.floor(safeData.total_seats / 2) + 1;

    return (
        <div className="space-y-8 animate-fade-in p-6 pb-24">

            {/* Header with Glassmorphism & Back Button */}
            <div className="relative">
                <button
                    onClick={handleBack}
                    className="group flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-blue-500/50 transition-all duration-300 mb-6 w-fit"
                >
                    <div className="bg-slate-100 dark:bg-slate-700 p-1.5 rounded-full group-hover:bg-blue-500 group-hover:text-white transition-colors">
                        <ArrowLeft size={16} />
                    </div>
                    <span className="font-bold text-sm text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">
                        Back to National View
                    </span>
                </button>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 dark:border-slate-800 pb-8">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border ${selectedState.type === 'state'
                                ? 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800'
                                : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
                                }`}>
                                {selectedState.type === 'state' ? 'State' : 'Union Territory'}
                            </span>
                            <span className="text-slate-400 text-sm font-medium flex items-center gap-1">
                                <MapIcon size={14} /> {selectedState.code}
                            </span>
                        </div>
                        <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-4">
                            {selectedState.name}
                        </h1>
                        <p className="text-lg text-slate-500 dark:text-slate-400 mt-2 font-medium max-w-2xl">
                            Governance Dashboard • {safeData.total_seats > 0 ? `${safeData.total_seats} Legislative Seats` : 'Direct Administration'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Leadership Section - Premium Cards */}
            <div className={`grid grid-cols-1 ${showCM ? 'md:grid-cols-2' : 'md:grid-cols-1 max-w-2xl mx-auto'} gap-8`}>

                {showCM && (
                    <div className="group relative bg-gradient-to-br from-indigo-600 to-violet-800 rounded-[2rem] p-8 text-white shadow-2xl overflow-hidden hover:scale-[1.01] transition-transform duration-500">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 group-hover:bg-white/15 transition-colors"></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-8">
                                <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                                    <Crown size={32} />
                                </div>
                                <div className="px-4 py-1.5 bg-black/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider border border-white/10">
                                    Head of Government
                                </div>
                            </div>

                            <div className="flex items-end gap-6">
                                <div className="flex-1">
                                    <h3 className="text-indigo-200 font-bold uppercase tracking-widest text-sm mb-2">Chief Minister</h3>
                                    <div className="text-4xl font-black leading-tight tracking-tight">
                                        {safeData.leadership.chief_minister?.name}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className={`group relative bg-white dark:bg-slate-800 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden hover:border-slate-300 dark:hover:border-slate-600 transition-colors`}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-slate-100 dark:bg-slate-700/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-8">
                            <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-2xl text-slate-700 dark:text-slate-300">
                                <Shield size={32} />
                            </div>
                            <div className="px-4 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-full text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {selectedState.type === 'state' ? 'Constitutional Head' : 'Administrator'}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-slate-500 font-bold uppercase tracking-widest text-sm mb-2">
                                {selectedState.type === 'ut' && !selectedState.hasAssembly ? 'Administrator / Lt. Governor' : 'Governor'}
                            </h3>
                            <div className="text-3xl font-black text-slate-900 dark:text-white leading-tight">
                                {safeData.leadership.governor.name}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cabinet Ministers (New Feature) */}
            <CabinetMinisters scope="state" stateName={selectedState.name} />

            {/* Assembly Composition Section (If Assembly Exists) */}
            {safeData.total_seats > 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-2xl">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Legislative Assembly Composition</h2>
                            <p className="text-slate-500 font-medium text-sm">Party-wise seat distribution</p>
                        </div>
                    </div>

                    {/* Progress Bar Chart */}
                    <div className="mb-10">
                        <div className="flex h-16 w-full rounded-2xl overflow-hidden shadow-inner ring-4 ring-slate-100 dark:ring-slate-800">
                            {sortedComposition.map((party) => {
                                const widthPercent = (party.seats / safeData.total_seats) * 100;
                                return (
                                    <div
                                        key={party.party}
                                        style={{ width: `${widthPercent}%`, backgroundColor: party.color }}
                                        className="h-full relative group transition-all duration-300 hover:brightness-110 flex items-center justify-center"
                                        title={`${party.party}: ${party.seats} seats`}
                                    >
                                        {widthPercent > 5 && (
                                            <span className="text-white font-bold text-xs drop-shadow-md truncate px-1">
                                                {party.party}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-between text-xs font-bold text-slate-400 mt-2 px-1">
                            <span>0</span>
                            <span className="flex items-center gap-1">
                                <div className="w-0.5 h-3 bg-red-400/50"></div>
                                Majority Mark: {majorityMark}
                            </span>
                            <span>{safeData.total_seats}</span>
                        </div>
                    </div>

                    {/* Party Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {sortedComposition.map((party) => (
                            <div key={party.party} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:bg-white hover:shadow-lg hover:border-slate-200 dark:hover:bg-slate-800 transition-all group">
                                <div
                                    className="w-3 h-12 rounded-full"
                                    style={{ backgroundColor: party.color }}
                                ></div>
                                <div>
                                    <div className="text-3xl font-black text-slate-900 dark:text-white group-hover:scale-105 transition-transform origin-left">
                                        {party.seats}
                                    </div>
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                        {party.party}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-slate-400 text-sm">
                        <Info size={16} />
                        <span>Data reflects the latest assembly election results and current ruling governments.</span>
                    </div>

                </div>
            ) : (
                <div className="bg-slate-100 dark:bg-slate-900 rounded-[2.5rem] p-12 text-center border border-dashed border-slate-300 dark:border-slate-700">
                    <div className="max-w-md mx-auto">
                        <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-6" />
                        <h2 className="text-2xl font-black text-slate-700 dark:text-slate-300 mb-2">Direct Central Administration</h2>
                        <p className="text-slate-500 font-medium">
                            This territory does not have a legislative assembly. It is directly governed by the Central Government through the Administrator.
                        </p>
                    </div>
                </div>
            )}

            {/* Elite Unified Official Registry */}
            <OfficialMemberRegistry
                mlas={mlas}
                lsMembers={lsMembers}
                rsMembers={rsMembers}
                onMemberClick={setSelectedMember}
                stateName={selectedState.name}
            />

            {/* Member Profile Modal */}
            {selectedMember && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
                    <div className="bg-slate-50 dark:bg-slate-950 max-w-6xl w-full rounded-3xl shadow-2xl max-h-[95vh] overflow-y-auto relative">
                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedMember(null)}
                            className="absolute top-6 right-6 z-50 p-3 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-all border border-white/10"
                        >
                            <X size={20} />
                        </button>

                        {/* Header */}
                        <div className={`relative bg-gradient-to-br ${selectedMember.party === 'BJP' ? 'from-orange-500 via-orange-600 to-orange-800' :
                            selectedMember.party === 'INC' ? 'from-blue-500 via-blue-600 to-blue-800' :
                                'from-slate-700 via-slate-800 to-slate-900'
                            } pb-16 pt-20 px-8`}>
                            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

                            <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-end gap-8 relative z-10">
                                {/* Avatar */}
                                <div className="w-40 h-40 md:w-48 md:h-48 shrink-0 rounded-2xl p-1 bg-white shadow-2xl md:mb-[-3rem]">
                                    <img
                                        src={selectedMember.profile_image || `https://ui-avatars.com/api/?name=${selectedMember.name}&background=random`}
                                        alt={selectedMember.name}
                                        className="w-full h-full object-cover rounded-xl bg-slate-200"
                                    />
                                </div>

                                {/* Details */}
                                <div className="flex-1 pb-4 text-white">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="bg-black/20 backdrop-blur-md border border-white/20 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest">
                                            {selectedMember.house === 'lok_sabha' ? 'Lok Sabha' :
                                                selectedMember.house === 'rajya_sabha' ? 'Rajya Sabha' :
                                                    'State Assembly'}
                                        </span>
                                        <span className="px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 bg-white text-slate-900 shadow-sm">
                                            <div className={`w-2 h-2 rounded-full ${selectedMember.party === 'BJP' ? 'bg-orange-500' :
                                                selectedMember.party === 'INC' ? 'bg-blue-500' :
                                                    'bg-slate-500'
                                                }`}></div>
                                            {selectedMember.party}
                                        </span>
                                    </div>

                                    <h1 className="text-4xl md:text-5xl font-black leading-tight mb-2 tracking-tight">
                                        {selectedMember.name}
                                    </h1>

                                    <div className="flex flex-wrap items-center gap-4 text-base font-medium text-white/90">
                                        <span className="flex items-center gap-2 opacity-80">
                                            <Flag size={16} />
                                            {selectedMember.constituency || selectedMember.state || 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                {/* Share Button */}
                                <div className="pb-4 hidden md:block">
                                    <button className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold text-sm shadow-xl hover:scale-105 transition-transform flex items-center gap-2">
                                        <Share2 size={18} />
                                        Share Profile
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-8 flex gap-1">
                            <button
                                onClick={() => setActiveProfileTab('overview')}
                                className={`px-6 py-4 font-bold text-sm uppercase tracking-wider transition-all ${activeProfileTab === 'overview'
                                    ? 'bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border-t-4 border-indigo-500'
                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700/50'
                                    }`}
                            >
                                <User className="inline mr-2" size={16} />
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveProfileTab('performance')}
                                className={`px-6 py-4 font-bold text-sm uppercase tracking-wider transition-all ${activeProfileTab === 'performance'
                                    ? 'bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border-t-4 border-purple-500'
                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700/50'
                                    }`}
                            >
                                <Activity className="inline mr-2" size={16} />
                                Performance & Debates
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 space-y-6">

                            {/* Overview Tab */}
                            {activeProfileTab === 'overview' && (
                                <>
                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className={`p-6 rounded-2xl ${selectedMember.party === 'BJP' ? 'bg-orange-50 border-orange-100' :
                                            selectedMember.party === 'INC' ? 'bg-blue-50 border-blue-100' :
                                                'bg-slate-50 border-slate-100'
                                            } border transition-all hover:shadow-md`}>
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="p-3 bg-white/60 rounded-xl backdrop-blur-sm shadow-sm">
                                                    <Flag className={
                                                        selectedMember.party === 'BJP' ? 'text-orange-600' :
                                                            selectedMember.party === 'INC' ? 'text-blue-600' :
                                                                'text-slate-600'
                                                    } />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Constituency</div>
                                                <div className="text-lg font-black text-slate-800 leading-tight">{selectedMember.constituency || 'N/A'}</div>
                                                <div className="text-sm font-semibold text-slate-500/80 mt-1">{selectedMember.state || selectedState?.name}</div>
                                            </div>
                                        </div>

                                        <div className={`p-6 rounded-2xl ${selectedMember.party === 'BJP' ? 'bg-orange-50 border-orange-100' :
                                            selectedMember.party === 'INC' ? 'bg-blue-50 border-blue-100' :
                                                'bg-slate-50 border-slate-100'
                                            } border transition-all hover:shadow-md`}>
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="p-3 bg-white/60 rounded-xl backdrop-blur-sm shadow-sm">
                                                    <Building2 className={
                                                        selectedMember.party === 'BJP' ? 'text-orange-600' :
                                                            selectedMember.party === 'INC' ? 'text-blue-600' :
                                                                'text-slate-600'
                                                    } />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">House</div>
                                                <div className="text-lg font-black text-slate-800 leading-tight">
                                                    {selectedMember.house === 'lok_sabha' ? 'Lok Sabha' :
                                                        selectedMember.house === 'rajya_sabha' ? 'Rajya Sabha' :
                                                            'Vidhan Sabha'}
                                                </div>
                                                <div className="text-sm font-semibold text-slate-500/80 mt-1">
                                                    {selectedMember.house === 'state_assembly' ? 'State Legislature' : 'Parliament of India'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className={`p-6 rounded-2xl ${selectedMember.party === 'BJP' ? 'bg-orange-50 border-orange-100' :
                                            selectedMember.party === 'INC' ? 'bg-blue-50 border-blue-100' :
                                                'bg-slate-50 border-slate-100'
                                            } border transition-all hover:shadow-md`}>
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="p-3 bg-white/60 rounded-xl backdrop-blur-sm shadow-sm">
                                                    <Activity className="text-emerald-600" />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Attendance</div>
                                                <div className="text-3xl font-black text-emerald-600 leading-tight">92%</div>
                                                <div className="text-sm font-semibold text-slate-500/80 mt-1">Session 2025</div>
                                            </div>
                                        </div>

                                        <div className={`p-6 rounded-2xl ${selectedMember.party === 'BJP' ? 'bg-orange-50 border-orange-100' :
                                            selectedMember.party === 'INC' ? 'bg-blue-50 border-blue-100' :
                                                'bg-slate-50 border-slate-100'
                                            } border transition-all hover:shadow-md`}>
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="p-3 bg-white/60 rounded-xl backdrop-blur-sm shadow-sm">
                                                    <CheckCircle2 className="text-blue-600" />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Status</div>
                                                <div className="text-lg font-black text-slate-800 leading-tight">Active Member</div>
                                                <div className="text-sm font-semibold text-slate-500/80 mt-1">Current Term</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Biography */}
                                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 dark:bg-white/5 rounded-bl-[100px] -mr-16 -mt-16"></div>
                                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 relative z-10 flex items-center gap-2">
                                            <Award className="text-amber-500" />
                                            Professional Biography
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-400 leading-8 text-base relative z-10">
                                            A distinguished member of the <strong>{selectedMember.party}</strong>, representing the people of {selectedMember.constituency || selectedMember.state || selectedState?.name}.
                                            {selectedMember.house === 'state_assembly' ?
                                                ` Currently serving in the ${selectedState?.name} Legislative Assembly, focusing on state development policies and regional welfare.` :
                                                ` Currently serving in the ${selectedMember.house === 'lok_sabha' ? '18th Lok Sabha' : 'Rajya Sabha'}, focusing on national development policies and regional welfare.`
                                            }
                                            <br /><br />
                                            Known for active participation in debates concerning infrastructure and economic reforms.
                                            Has consistently advocated for sustainable development goals within the constituency.
                                        </p>
                                    </div>
                                </>
                            )}

                            {/* Performance Tab */}
                            {activeProfileTab === 'performance' && (
                                <MemberPerformance member={selectedMember} />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
