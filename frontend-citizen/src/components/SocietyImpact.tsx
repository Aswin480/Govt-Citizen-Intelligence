import React from 'react';
import {
    Clock, Heart, ShieldCheck, MapPin, Search,
    Share2, Activity, User, Briefcase, Calendar,
    CheckCircle2, AlertTriangle, Play
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'; // Assuming leaflet installed, else mock map

// Mock Project Data
const PROJECTS = [
    { id: 1, type: 'Road', name: 'NH-45 Widening', lat: 28.6139, lng: 77.2090, status: 'Completed', image: 'https://images.unsplash.com/photo-1545569384-6345492cceea?auto=format&fit=crop&q=80&w=200' },
    { id: 2, type: 'Water', name: 'Jal Jeevan Pipeline', lat: 28.6200, lng: 77.2100, status: 'In Progress', image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=200' },
    { id: 3, type: 'School', name: 'Model School Upgrade', lat: 28.6100, lng: 77.2200, status: 'Proposed', image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=200' }
];

export const SocietyImpact: React.FC = () => {

    return (
        <div className="space-y-8 animate-fade-in">

            {/* --- 1. TRUST GAUGE & VELOCITY --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Public Trust Gauge */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col items-center text-center">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                        <Heart className="text-red-500" size={20} /> Public Trust Index
                    </h3>
                    <p className="text-sm text-slate-500 mb-6">Real-time Constituent Sentiment</p>

                    {/* Gauge Visual */}
                    <div className="relative w-64 h-32 overflow-hidden mb-4">
                        <div className="absolute inset-0 w-full h-64 rounded-full border-[1.5rem] border-slate-100 dark:border-slate-800 border-b-0 rotate-[225deg] transform origin-bottom border-l-transparent border-r-transparent"></div> {/* Background Arc */}
                        <div className="absolute inset-0 w-full h-64 rounded-full border-[1.5rem] border-emerald-500 border-b-0 rotate-[45deg] transform origin-bottom transition-all duration-1000" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)', transform: 'rotate(-45deg)' }}></div> {/* Active Arc - Mock 75% */}

                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
                            <span className="text-4xl font-black text-slate-900 dark:text-white block -mt-8">78</span>
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Strong Trust</span>
                        </div>
                    </div>

                    <div className="flex gap-4 text-xs font-bold text-slate-400">
                        <span className="text-red-400">Critical</span>
                        <span className="w-24 h-1 bg-gradient-to-r from-red-400 via-amber-400 to-emerald-400 rounded-full mt-1.5"></span>
                        <span className="text-emerald-500">Trusted</span>
                    </div>
                </div>

                {/* Grievance Velocity */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                            <Clock className="text-blue-500" size={20} /> Grievance Velocity
                        </h3>
                        <p className="text-sm text-slate-500 mb-6">Average time to resolve citizen complaints</p>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-5xl font-black text-slate-900 dark:text-white mb-1">12<span className="text-xl text-slate-400 font-bold ml-1">Days</span></div>
                            <div className="text-xs font-bold text-blue-500 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded inline-block">Faster than avg (15 days)</div>
                        </div>
                        <div className="h-24 w-24 rounded-full border-4 border-blue-100 dark:border-blue-900 border-t-blue-500 animate-spin-slow flex items-center justify-center bg-slate-50 dark:bg-slate-950 shadow-inner">
                            <Activity className="text-blue-500" size={32} />
                        </div>
                    </div>
                </div>
            </div>

            {/* --- 2. CONSTITUENCY PULSE MAP --- */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                            <MapPin className="text-purple-500" size={20} /> Constituency Pulse
                        </h3>
                        <p className="text-sm text-slate-500">ongoing and completed development projects</p>
                    </div>
                    <div className="flex gap-2">
                        <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-lg border border-purple-100">64 Projects</span>
                    </div>
                </div>

                {/* Project Cards (Simulating Map Pins for now if Map not fully setup or just to show list) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {PROJECTS.map(project => (
                        <div key={project.id} className="group relative rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300">
                            {/* Image Background */}
                            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `url(${project.image})` }}></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

                            {/* Content */}
                            <div className="relative p-5 h-48 flex flex-col justify-end text-white">
                                <div className="mb-auto flex justify-between items-start">
                                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded backdrop-blur-md ${project.status === 'Completed' ? 'bg-emerald-500/80' : project.status === 'In Progress' ? 'bg-amber-500/80' : 'bg-slate-500/80'}`}>
                                        {project.status}
                                    </span>
                                </div>
                                <h4 className="text-lg font-bold leading-tight mb-1">{project.name}</h4>
                                <div className="flex items-center gap-2 text-xs opacity-80">
                                    <MapPin size={12} /> Place Holder Road
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 text-center">
                    <button className="text-sm font-bold text-purple-600 hover:text-purple-800 transition-colors flex items-center justify-center gap-2">
                        View Full Project Map <Share2 size={14} />
                    </button>
                </div>
            </div>

        </div>
    );
};
