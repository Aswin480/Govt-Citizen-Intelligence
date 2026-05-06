import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Member {
    id: string;
    name: string;
    party: string;
    constituency: string;
    house: string;
    image?: string;
}

interface HUDProps {
    hoveredMember: Member | null;
    selectedMember: Member | null;
}

export const HolographicHUD: React.FC<HUDProps> = ({ hoveredMember, selectedMember }) => {
    const activeMember = hoveredMember || selectedMember;

    return (
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
            <AnimatePresence>
                {activeMember && (
                    <motion.div
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.95 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="absolute right-10 top-1/4 w-96 p-1 rounded-2xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 backdrop-blur-xl border border-white/10 shadow-[0_0_50px_rgba(0,100,255,0.2)]"
                    >
                        {/* Inner Container with Cut Corners */}
                        <div className="bg-[#050510]/80 rounded-xl p-6 relative overflow-hidden">
                            {/* Scanning Line Animation */}
                            <motion.div
                                animate={{ top: ['0%', '100%'] }}
                                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                className="absolute left-0 w-full h-1 bg-blue-400/20 blur-sm pointer-events-none"
                            />

                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h4 className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">
                                        Subject Identified
                                    </h4>
                                    <h2 className="text-2xl font-black text-white leading-none">
                                        {activeMember.name}
                                    </h2>
                                </div>
                                <div className={`px-3 py-1 rounded text-xs font-bold uppercase border ${activeMember.party.includes('BJP') ? 'border-orange-500 text-orange-400' :
                                        activeMember.party.includes('INC') ? 'border-blue-500 text-blue-400' :
                                            'border-gray-500 text-gray-400'
                                    }`}>
                                    {activeMember.party}
                                </div>
                            </div>

                            {/* Image / Avatar Placeholder */}
                            <div className="w-full h-48 bg-gray-900 rounded-lg mb-4 border border-blue-500/30 relative flex items-center justify-center overflow-hidden group">
                                {activeMember.image ? (
                                    <img src={activeMember.image} alt={activeMember.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                ) : (
                                    <div className="text-6xl opacity-20">👤</div>
                                )}
                                {/* Grid Overlay */}
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <StatBox label="Constituency" value={activeMember.constituency} />
                                <StatBox label="House" value={activeMember.house || 'Lok Sabha'} />
                                <StatBox label="Attendance" value="92%" color="text-green-400" />
                                <StatBox label="Loyalty" value="High" color="text-blue-400" />
                            </div>

                            {/* Footer */}
                            <div className="flex justify-between items-center pt-4 border-t border-white/10">
                                <span className="text-[10px] text-gray-500 font-mono">ID: {activeMember.id.substring(0, 8)}...</span>
                                <div className="flex gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse delay-75" />
                                    <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse delay-150" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const StatBox = ({ label, value, color = 'text-white' }: { label: string, value: string, color?: string }) => (
    <div className="bg-white/5 p-3 rounded border border-white/5">
        <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{label}</div>
        <div className={`font-mono font-bold ${color}`}>{value}</div>
    </div>
);
