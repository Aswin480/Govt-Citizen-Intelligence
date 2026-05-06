import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronRight } from 'lucide-react';
import { INDIAN_STATES, StateConfig } from '../services/stateConfig';
import { useGovernanceScope } from '../context/GovernanceScopeContext';

interface StateSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    filterType?: 'state' | 'ut'; // Optional, defaults to showing all if undefined, but we will use it strictly
}

export const StateSelector: React.FC<StateSelectorProps> = ({ isOpen, onClose, filterType = 'state' }) => {
    const { setSelectedState, setScope } = useGovernanceScope();
    const [searchTerm, setSearchTerm] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input on open
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const filteredStates = INDIAN_STATES.filter(state =>
        (state.type === filterType) &&
        (state.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            state.code.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleSelect = (state: StateConfig) => {
        setSelectedState(state);
        setScope(state.type === 'ut' ? 'union_territory' : 'state');

        // Short delay to let the sync transition initiate before closing the list
        setTimeout(() => {
            onClose();
            setSearchTerm(''); // Reset search
        }, 200);
    };

    if (!isOpen) return null;

    const title = filterType === 'ut' ? 'Union Territory' : 'State';

    return (
        <div className="fixed inset-0 z-[999] flex items-start justify-center pt-24 px-4 bg-black/80 animate-fade-in" onClick={onClose}>
            <div
                className="bg-white dark:bg-[#0b1120] w-full max-w-2xl rounded-[1.5rem] shadow-[0_20px_70px_-10px_rgba(0,0,0,0.8)] border-t-[4px] border-t-indigo-500 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col animate-scale-in"
                onClick={e => e.stopPropagation()} // Prevent close on modal click
            >
                {/* Modal Search Header */}
                <div className="flex items-center gap-4 p-6 bg-slate-50 dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800">
                    <Search className="text-indigo-500" size={24} />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder={`Search for a ${title}...`}
                        className="flex-1 bg-transparent text-xl font-bold text-slate-800 dark:text-white placeholder:text-slate-500 focus:outline-none"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 transition-all active:scale-95">
                        <X size={20} />
                    </button>
                </div>

                {/* Results Grid */}
                <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
                    {filteredStates.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-sm">
                            No telemetry found for "{searchTerm}"
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {filteredStates.map(state => (
                                <button
                                    key={state.id}
                                    onClick={() => handleSelect(state)}
                                    className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-[#131c31] hover:bg-slate-50 dark:hover:bg-[#1e293b] shadow-sm hover:shadow-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 transition-all text-left group"
                                >
                                    <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-[#1e293b] flex items-center justify-center text-slate-600 dark:text-indigo-400 font-black text-xs shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        {state.code}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                            {state.name}
                                            {state.hasLegislativeCouncil && (
                                                <span className="text-[10px] bg-red-100 text-red-700 dark:bg-rose-500/20 dark:text-rose-400 px-2 py-0.5 rounded font-black uppercase tracking-wider shadow-sm">Bicameral</span>
                                            )}
                                        </div>
                                        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter mt-0.5">Capital: {state.capital}</div>
                                    </div>
                                    <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-1 transition-all" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-slate-50 dark:bg-[#080d1a] border-t border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-500 dark:text-slate-400 flex justify-between uppercase tracking-widest">
                    <span className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        Ready for Selection
                    </span>
                    <span>{filteredStates.length} Regions Synced</span>
                </div>
            </div>
        </div>
    );
};
