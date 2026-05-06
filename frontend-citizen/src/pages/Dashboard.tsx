import React from 'react';
import { useGovernanceScope } from '../context/GovernanceScopeContext';
import { ParliamentDashboard } from './ParliamentDashboard';
import { StateDashboard } from './StateDashboard';

import { ParliamentMember } from '../services/realNationData';

interface DashboardProps {
    adminMode?: boolean;
    onEditMember?: (member: ParliamentMember) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ adminMode, onEditMember }) => {
    const { scope } = useGovernanceScope();

    // If Nation Scope -> Render Parliament Dashboard
    if (scope === 'nation') {
        return <ParliamentDashboard adminMode={adminMode} onEditMember={onEditMember} />;
    }

    // If State or UT Scope -> Render State Dashboard
    if (scope === 'state' || scope === 'union_territory') {
        return <StateDashboard />;
    }

    // Default Fallback
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
            <h2 className="text-2xl font-bold text-red-500 mb-2">Display Error</h2>
            <p>Unable to determine dashboard scope.</p>
            <pre className="mt-4 p-4 bg-slate-900 rounded-lg text-xs font-mono">
                Current Scope: {String(scope)}
            </pre>
        </div>
    );
};

export default Dashboard;
