import { AlertTriangle } from 'lucide-react';

export const AlertTicker = () => {
    return (
        <div className="bg-[var(--color-gov-amber-500)] text-slate-900 font-bold text-sm w-full overflow-hidden whitespace-nowrap py-2 sticky top-0 z-50 shadow-md flex items-center">
            <div className="inline-flex items-center gap-2 px-4 bg-slate-900 text-[var(--color-gov-amber-500)] py-2 absolute left-0 h-full z-10 shadow-lg uppercase tracking-wider text-xs">
                <AlertTriangle className="w-4 h-4" />
                <span>System Protocol</span>
            </div>
            <div className="animate-marquee inline-block pl-40">
                <span className="mx-8">⚠️ HIGH PRIORITY: Citizen Policy Intelligence System Online</span>
                <span className="mx-8">• All Systems nominal</span>
                <span className="mx-8">• Real-time connection to Parliament API active</span>
                <span className="mx-8">• Secure Encrypted Channel Established (AES-256)</span>
                <span className="mx-8">• Official Verification Node #8821 Active</span>
            </div>
        </div>
    );
};
