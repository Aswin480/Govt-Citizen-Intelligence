import React, { useState } from 'react';
import { useGovernanceScope } from '../context/GovernanceScopeContext';
import { Building2, Map, ChevronDown } from 'lucide-react';
import { StateSelector } from './StateSelector';

export const GovernanceToggle: React.FC = () => {
    const { scope, setScope, house, setHouse, selectedState } = useGovernanceScope();
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [filterType, setFilterType] = useState<'state' | 'ut'>('state');

    const handleOpenSelector = (type: 'state' | 'ut') => {
        setFilterType(type);
        setIsSelectorOpen(true);
    };

    return (
        <div className="flex items-center gap-3">
            {/* Main Scope Switcher (Segmented Control) */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                    onClick={() => { setScope('nation'); if (!house) setHouse('lok_sabha'); }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${scope === 'nation'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                        }`}
                >
                    <Building2 size={14} />
                    Nation
                </button>
                <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1 self-center"></div>
                <button
                    onClick={() => handleOpenSelector('state')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${scope === 'state'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                        }`}
                >
                    <Map size={14} />
                    {scope === 'state' && selectedState ? selectedState.code : 'State'}
                    {scope === 'state' ? <ChevronDown size={12} className="opacity-50" /> : null}
                </button>
                <button
                    onClick={() => handleOpenSelector('ut')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${scope === 'union_territory'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                        }`}
                >
                    <span className="text-[10px]">UT</span>
                    {scope === 'union_territory' && selectedState ? selectedState.code : ''}
                    {scope === 'union_territory' ? <ChevronDown size={12} className="opacity-50" /> : null}
                </button>
            </div>

            {/* Secondary Switch (Lok Sabha / Rajya Sabha) - Only Visible when Nation is active */}
            {scope === 'nation' && (
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 animate-fade-in">
                    <button
                        onClick={() => setHouse('lok_sabha')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${house === 'lok_sabha' || !house
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                            }`}
                    >
                        Lok Sabha
                    </button>
                    <button
                        onClick={() => setHouse('rajya_sabha')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${house === 'rajya_sabha'
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                            }`}
                    >
                        Rajya Sabha
                    </button>
                </div>
            )}

            <StateSelector isOpen={isSelectorOpen} onClose={() => setIsSelectorOpen(false)} filterType={filterType} />
        </div>
    );
};
