import React, { useState } from 'react';
import { X, Calendar, MapPin, Users, ThumbsUp, ThumbsDown, MessageSquare, Share2, Download, Play, Pause } from 'lucide-react';

interface DebateViewerProps {
    debate: any;
    onClose: () => void;
}

export const DebateViewer: React.FC<DebateViewerProps> = ({ debate, onClose }) => {
    const [activeTab, setActiveTab] = useState<'transcript' | 'analysis' | 'voting'>('transcript');
    const [isPlaying, setIsPlaying] = useState(false);

    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-lg z-[300] flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
            <div className="bg-slate-900 max-w-7xl w-full rounded-3xl shadow-2xl max-h-[95vh] overflow-hidden relative border border-slate-700">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-50 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all border border-white/10"
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-xs font-bold uppercase tracking-widest text-white">
                                {debate.house}
                            </span>
                            <span className="px-4 py-1.5 bg-amber-500/90 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-widest text-black">
                                {debate.department}
                            </span>
                            <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${debate.status === 'Concluded' ? 'bg-green-500/90 text-black' : 'bg-blue-500/90 text-white'
                                }`}>
                                {debate.status}
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">
                            {debate.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-6 text-white/90">
                            <span className="flex items-center gap-2">
                                <Calendar size={18} />
                                {debate.date}
                            </span>
                            <span className="flex items-center gap-2">
                                <MapPin size={18} />
                                {debate.location}
                            </span>
                            <span className="flex items-center gap-2">
                                <Users size={18} />
                                {debate.participants} Participants
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-slate-800 border-b border-slate-700 px-8 flex gap-1">
                    <button
                        onClick={() => setActiveTab('transcript')}
                        className={`px-6 py-4 font-bold text-sm uppercase tracking-wider transition-all ${activeTab === 'transcript'
                                ? 'bg-slate-900 text-white border-t-4 border-indigo-500'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                            }`}
                    >
                        Transcript
                    </button>
                    <button
                        onClick={() => setActiveTab('analysis')}
                        className={`px-6 py-4 font-bold text-sm uppercase tracking-wider transition-all ${activeTab === 'analysis'
                                ? 'bg-slate-900 text-white border-t-4 border-purple-500'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                            }`}
                    >
                        AI Analysis
                    </button>
                    <button
                        onClick={() => setActiveTab('voting')}
                        className={`px-6 py-4 font-bold text-sm uppercase tracking-wider transition-all ${activeTab === 'voting'
                                ? 'bg-slate-900 text-white border-t-4 border-pink-500'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                            }`}
                    >
                        Voting Record
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 max-h-[60vh] overflow-y-auto bg-slate-900">

                    {/* Transcript Tab */}
                    {activeTab === 'transcript' && (
                        <div className="space-y-6">
                            {/* Audio/Video Player */}
                            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-white">Debate Recording</h3>
                                    <button
                                        onClick={() => setIsPlaying(!isPlaying)}
                                        className="p-3 bg-indigo-600 hover:bg-indigo-500 rounded-full text-white transition-all"
                                    >
                                        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                                    </button>
                                </div>
                                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full w-1/3 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                                </div>
                                <div className="flex justify-between text-xs text-slate-400 mt-2">
                                    <span>15:23</span>
                                    <span>45:00</span>
                                </div>
                            </div>

                            {/* Transcript */}
                            <div className="space-y-4">
                                {debate.transcript?.map((entry: any, index: number) => (
                                    <div key={index} className="bg-slate-800 rounded-2xl p-6 border border-slate-700 hover:border-indigo-500/50 transition-all">
                                        <div className="flex items-start gap-4">
                                            <img
                                                src={entry.avatar || `https://ui-avatars.com/api/?name=${entry.speaker}&background=random`}
                                                className="w-12 h-12 rounded-full border-2 border-slate-600"
                                                alt={entry.speaker}
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div>
                                                        <h4 className="font-bold text-white">{entry.speaker}</h4>
                                                        <p className="text-xs text-slate-400">{entry.party} • {entry.timestamp}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {entry.stance === 'support' && (
                                                            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-bold flex items-center gap-1">
                                                                <ThumbsUp size={12} /> Support
                                                            </span>
                                                        )}
                                                        {entry.stance === 'oppose' && (
                                                            <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-bold flex items-center gap-1">
                                                                <ThumbsDown size={12} /> Oppose
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-slate-300 leading-relaxed">{entry.text}</p>
                                                <div className="flex items-center gap-4 mt-3 text-slate-500 text-sm">
                                                    <button className="hover:text-indigo-400 transition-colors flex items-center gap-1">
                                                        <MessageSquare size={14} /> Reply
                                                    </button>
                                                    <button className="hover:text-indigo-400 transition-colors flex items-center gap-1">
                                                        <Share2 size={14} /> Share
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Analysis Tab */}
                    {activeTab === 'analysis' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-2xl p-6">
                                    <div className="text-4xl font-black text-green-400 mb-2">67%</div>
                                    <div className="text-sm font-bold text-green-300 uppercase tracking-wider">In Favor</div>
                                </div>
                                <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 rounded-2xl p-6">
                                    <div className="text-4xl font-black text-red-400 mb-2">28%</div>
                                    <div className="text-sm font-bold text-red-300 uppercase tracking-wider">Against</div>
                                </div>
                                <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/30 rounded-2xl p-6">
                                    <div className="text-4xl font-black text-amber-400 mb-2">5%</div>
                                    <div className="text-sm font-bold text-amber-300 uppercase tracking-wider">Neutral</div>
                                </div>
                            </div>

                            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                                    AI-Generated Summary
                                </h3>
                                <p className="text-slate-300 leading-relaxed">
                                    This debate focused on the proposed infrastructure development bill for national highways.
                                    Key points of contention included environmental impact assessments, budget allocation,
                                    and timeline feasibility. The majority of speakers supported the initiative with suggested
                                    amendments regarding environmental safeguards and local community consultation processes.
                                </p>
                            </div>

                            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                                <h3 className="text-xl font-bold text-white mb-4">Key Topics Discussed</h3>
                                <div className="flex flex-wrap gap-2">
                                    {['Infrastructure', 'Environment', 'Budget', 'Timeline', 'Community Impact', 'Safety Standards'].map((topic) => (
                                        <span key={topic} className="px-4 py-2 bg-indigo-500/20 text-indigo-300 rounded-full text-sm font-bold border border-indigo-500/30">
                                            {topic}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Voting Tab */}
                    {activeTab === 'voting' && (
                        <div className="space-y-6">
                            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                                <h3 className="text-xl font-bold text-white mb-6">Final Vote Breakdown</h3>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-green-400 font-bold">Ayes (For)</span>
                                            <span className="text-white font-bold">245 votes</span>
                                        </div>
                                        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-green-500 to-green-400" style={{ width: '67%' }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-red-400 font-bold">Noes (Against)</span>
                                            <span className="text-white font-bold">102 votes</span>
                                        </div>
                                        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-red-500 to-red-400" style={{ width: '28%' }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-amber-400 font-bold">Abstentions</span>
                                            <span className="text-white font-bold">18 votes</span>
                                        </div>
                                        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400" style={{ width: '5%' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-2 border-green-500/50 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                        <ThumbsUp className="text-white" size={24} />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-black text-green-400">PASSED</div>
                                        <div className="text-sm text-green-300">Motion carried by majority</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="bg-slate-800 border-t border-slate-700 p-6 flex justify-between items-center">
                    <div className="flex gap-3">
                        <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm uppercase tracking-wider transition-all flex items-center gap-2">
                            <Download size={16} />
                            Download Transcript
                        </button>
                        <button className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold text-sm uppercase tracking-wider transition-all flex items-center gap-2">
                            <Share2 size={16} />
                            Share
                        </button>
                    </div>
                    <div className="text-slate-400 text-sm">
                        Debate ID: {debate.id}
                    </div>
                </div>
            </div>
        </div>
    );
};
