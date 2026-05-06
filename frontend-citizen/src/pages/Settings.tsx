import React, { useState, useEffect } from 'react';
import { Bell, Shield, Eye, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';

const Settings = () => {
    const { config, updateConfig } = useConfig();

    // Load preferences from actual backend state, defaulting to local states if first load
    const [darkMode, setDarkMode] = useState(() => config?.theme === 'dark' || document.documentElement.classList.contains('dark'));
    const [compactView, setCompactView] = useState(() => config?.compactView === 'true');
    const [criticalAlerts, setCriticalAlerts] = useState(() => config?.criticalAlerts !== 'false');
    const [dailyDigest, setDailyDigest] = useState(() => config?.dailyDigest !== 'false');

    // Sync from config when it loads
    useEffect(() => {
        if (config?.theme !== undefined) setDarkMode(config.theme === 'dark');
        if (config?.compactView !== undefined) setCompactView(config.compactView === 'true');
        if (config?.criticalAlerts !== undefined) setCriticalAlerts(config.criticalAlerts === 'true');
        if (config?.dailyDigest !== undefined) setDailyDigest(config.dailyDigest === 'true');
    }, [config]);

    // Apply & Save Dark Mode
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            updateConfig('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            updateConfig('theme', 'light');
        }
    }, [darkMode]);

    // Apply & Save other settings to Backend Config System
    useEffect(() => {
        updateConfig('compactView', String(compactView));
        updateConfig('criticalAlerts', String(criticalAlerts));
        updateConfig('dailyDigest', String(dailyDigest));

        if (compactView) {
            document.documentElement.classList.add('compact-view');
        } else {
            document.documentElement.classList.remove('compact-view');
        }
    }, [compactView, criticalAlerts, dailyDigest]);

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-[var(--color-gov-navy-900)] dark:text-white mb-8">System Settings</h1>

            <div className="space-y-6">
                <SettingSection title="Preferences" icon={<Eye size={20} />}>
                    <Toggle
                        label="Dark Mode"
                        description="Switch between Day and Night standard themes."
                        on={darkMode}
                        onChange={setDarkMode}
                    />
                    <Toggle
                        label="Compact View"
                        description="Increase data density in tables."
                        on={compactView}
                        onChange={setCompactView}
                    />
                </SettingSection>

                <SettingSection title="Notifications" icon={<Bell size={20} />}>
                    <Toggle
                        label="Critical Alerts"
                        description="Receive immediate SMS for Level-1 incidents."
                        on={criticalAlerts}
                        onChange={setCriticalAlerts}
                    />
                    <Toggle
                        label="Daily Digest"
                        description="Email summary of department activities."
                        on={dailyDigest}
                        onChange={setDailyDigest}
                    />
                </SettingSection>

                <SettingSection title="Security" icon={<Shield size={20} />}>
                    <div className="flex items-center justify-between py-2">
                        <div>
                            <h4 className="font-medium text-slate-800 dark:text-slate-200">Two-Factor Authentication</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Currently Enabled (SMS)</p>
                        </div>
                        <button className="text-[var(--color-gov-amber-600)] dark:text-amber-400 font-medium text-sm hover:underline">Configure</button>
                    </div>
                </SettingSection>

                <SettingSection title="Session Management" icon={<LogOut size={20} />}>
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/50 rounded-lg p-4 flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-red-700 dark:text-red-400">Sign Out</h4>
                            <p className="text-sm text-red-600/80 dark:text-red-400/70">Securely end your current session.</p>
                        </div>
                        <LogoutButton />
                    </div>
                </SettingSection>
            </div>
        </div>
    );
};

const SettingSection: React.FC<{ title: string, icon: React.ReactNode, children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="glass-panel dark:bg-[#151c2c] dark:border-slate-700 p-6 rounded-[var(--radius-lg)]">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
            <div className="text-[var(--color-gov-navy-700)] dark:text-slate-300">{icon}</div>
            <h3 className="text-lg font-bold text-[var(--color-gov-navy-900)] dark:text-white">{title}</h3>
        </div>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const Toggle: React.FC<{ label: string, description: string, on?: boolean, onChange?: (val: boolean) => void }> = ({ label, description, on, onChange }) => (
    <div className="flex items-center justify-between">
        <div>
            <h4 className="font-medium text-slate-800 dark:text-white">{label}</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
        <button
            onClick={() => onChange?.(!on)}
            className={`w-11 h-6 rounded-full relative transition-colors duration-200 focus:outline-none ${on ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${on ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    </div>
);

export default Settings;

const LogoutButton: React.FC = () => {
    const { logout } = useAuth();
    return (
        <button
            onClick={logout}
            className="px-4 py-2 bg-white dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 font-semibold rounded-md shadow-sm hover:bg-red-50 transition-colors"
        >
            Log Out
        </button>
    );
};
