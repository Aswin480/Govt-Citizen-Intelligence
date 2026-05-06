import { useEffect, useState } from 'react';
import { useGovernanceScope } from '../context/GovernanceScopeContext';
import { Radio, Zap, ShieldCheck } from 'lucide-react';

export const SyncTransition: React.FC = () => {
    const { scope, selectedState, house } = useGovernanceScope();
    const [isVisible, setIsVisible] = useState(false);
    const [label, setLabel] = useState('');

    useEffect(() => {
        // Trigger transition on any scope/state/house change
        const currentLabel = scope === 'nation'
            ? `SYNCING NATIONAL FREQUENCY [${house?.replace('_', ' ').toUpperCase()}]`
            : `ACQUIRING REGIONAL SIGNAL [${selectedState?.name.toUpperCase()}]`;

        setLabel(currentLabel);
        setIsVisible(true);

        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 1500); // 1.5 seconds transition

        return () => clearTimeout(timer);
    }, [scope, selectedState, house]);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[1000] pointer-events-none overflow-hidden flex items-center justify-center">
            {/* Darkening Overlay */}
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] animate-fade-in"></div>

            {/* Scanline Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/10 to-transparent h-20 w-full animate-scanline"></div>

            {/* Central Badge */}
            <div className="relative group scale-110 animate-scale-in">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-blue-600 rounded-full blur opacity-75 animate-pulse"></div>
                <div className="relative bg-slate-900 border-2 border-white/20 px-12 py-6 rounded-full shadow-2xl flex items-center gap-6">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-600/20 animate-pulse-fast">
                        <Radio size={24} className="text-red-500" />
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Zap size={14} className="text-yellow-500 fill-yellow-500" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Telemetry Link Established</span>
                        </div>
                        <h3 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">
                            {label}
                        </h3>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <ShieldCheck size={16} className="text-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-500 uppercase">SECURE</span>
                    </div>
                </div>
            </div>

            {/* Corner Decorative Elements */}
            <div className="absolute top-10 left-10 w-40 h-40 border-l-2 border-t-2 border-white/10 rounded-tl-3xl"></div>
            <div className="absolute top-10 right-10 w-40 h-40 border-r-2 border-t-2 border-white/10 rounded-tr-3xl"></div>
            <div className="absolute bottom-10 left-10 w-40 h-40 border-l-2 border-b-2 border-white/10 rounded-bl-3xl"></div>
            <div className="absolute bottom-10 right-10 w-40 h-40 border-r-2 border-b-2 border-white/10 rounded-br-3xl"></div>
        </div>
    );
};
