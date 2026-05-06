import React, { createContext, useContext, useState } from 'react';

import { StateConfig } from '../services/stateConfig';

type GovernanceScope = 'nation' | 'state' | 'union_territory';
type ParliamentHouse = 'lok_sabha' | 'rajya_sabha' | null;
type StateHouse = 'vidhan_sabha' | 'vidhan_parishad' | null;

interface GovernanceScopeContextType {
    scope: GovernanceScope;
    setScope: (scope: GovernanceScope) => void;
    house: ParliamentHouse;
    setHouse: (house: ParliamentHouse) => void;
    selectedState: StateConfig | null;
    setSelectedState: (state: StateConfig | null) => void;
    stateHouse: StateHouse;
    setStateHouse: (house: StateHouse) => void;
}

const GovernanceScopeContext = createContext<GovernanceScopeContextType | undefined>(undefined);

export const GovernanceScopeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [scope, setScope] = useState<GovernanceScope>('nation');
    const [house, setHouse] = useState<ParliamentHouse>('lok_sabha');
    const [selectedState, setSelectedState] = useState<StateConfig | null>(null);
    const [stateHouse, setStateHouse] = useState<StateHouse>('vidhan_sabha');

    return (
        <GovernanceScopeContext.Provider value={{
            scope, setScope,
            house, setHouse,
            selectedState, setSelectedState,
            stateHouse, setStateHouse
        }}>
            {children}
        </GovernanceScopeContext.Provider>
    );
};

export const useGovernanceScope = () => {
    const context = useContext(GovernanceScopeContext);
    if (context === undefined) {
        throw new Error('useGovernanceScope must be used within a GovernanceScopeProvider');
    }
    return context;
};
