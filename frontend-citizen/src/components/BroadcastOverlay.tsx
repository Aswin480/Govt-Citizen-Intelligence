import { useEffect, useState } from 'react';
import { useConfig } from '../context/ConfigContext';
import { AlertTriangle, Radio } from 'lucide-react';

export const BroadcastOverlay = () => {
    const { config } = useConfig();
    const [acknowledged, setAcknowledged] = useState(false);

    // Reset acknowledgement if message changes
    useEffect(() => {
        setAcknowledged(false);
    }, [config.emergency_broadcast_text]);

    if (config.emergency_broadcast_active !== 'true' || !config.emergency_broadcast_text) return null;
    if (acknowledged) return null;

    const isCritical = config.emergency_broadcast_level === 'critical';

    return (
        <div className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 transition-all duration-300 ${isCritical ? 'bg-red-950/90 backdrop-blur-md' : 'bg-black/80 backdrop-blur-sm'}`}>
            <div className={`w-full max-w-2xl bg-black border-[3px] shadow-2xl overflow-hidden rounded-lg animate-bounce-in ${isCritical ? 'border-red-500 shadow-red-500/50' : 'border-yellow-500 shadow-yellow-500/50'}`}>
                {/* Header */}
                <div className={`p-4 flex items-center gap-3 ${isCritical ? 'bg-red-600' : 'bg-yellow-600 text-black'}`}>
                    <Radio className={`animate-pulse ${isCritical ? 'text-white' : 'text-black'}`} size={24} />
                    <h2 className={`text-xl font-black uppercase tracking-widest ${isCritical ? 'text-white' : 'text-black'}`}>
                        {isCritical ? 'EMERGENCY BROADCAST SYSTEM' : 'SYSTEM ANNOUNCEMENT'}
                    </h2>
                </div>

                {/* Content */}
                <div className="p-8 text-center space-y-6">
                    <AlertTriangle size={64} className={`mx-auto mb-4 ${isCritical ? 'text-red-500 animate-pulse' : 'text-yellow-500'}`} />

                    <p className={`text-3xl font-bold font-mono uppercase leading-relaxed ${isCritical ? 'text-red-500' : 'text-yellow-500'}`}>
                        "{config.emergency_broadcast_text}"
                    </p>

                    <div className="text-gray-400 text-xs font-mono uppercase tracking-widest mt-8">
                        Official Government Communication • DO NOT IGNORE
                    </div>

                    <button
                        onClick={() => setAcknowledged(true)}
                        className={`w-full py-4 text-lg font-bold uppercase tracking-widest transition-all ${isCritical
                            ? 'bg-red-600 hover:bg-red-500 text-white'
                            : 'bg-yellow-600 hover:bg-yellow-500 text-black'
                            }`}
                    >
                        {isCritical ? 'I ACKNOWLEDGE' : 'DISMISS'}
                    </button>
                </div>
            </div>
        </div>
    );
};
