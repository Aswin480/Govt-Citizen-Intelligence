import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSystemConfig, updateSystemConfig, publishConfig, discardDrafts } from '../services/api';

interface SystemConfig {
    primary_color: string;
    border_radius: 'rounded' | 'sharp' | 'pill';
    glassmorphism: boolean;
    session_name: string;
    alert_message: string;
    gemini_api_key: string;
    gemini_model: string;
    [key: string]: any;
}

interface ConfigContextType {
    config: SystemConfig;
    updateConfig: (key: string, value: string) => Promise<void>;
    isLoading: boolean;
    refreshConfig: () => void;

    // Version Control
    isDraftMode: boolean;
    setDraftMode: (enabled: boolean) => void;
    publishChanges: () => Promise<void>;
    discardChanges: () => Promise<void>;

    // Visual Editor
    isVisualMode: boolean;
    toggleVisualMode: () => void;
}

const defaultConfig: SystemConfig = {
    primary_color: '#FF9933', // Default Saffron
    border_radius: 'rounded',
    glassmorphism: true,
    session_name: 'Budget Session 2026',
    alert_message: '',
    gemini_api_key: import.meta.env.VITE_GEMINI_API_KEY || '',
    gemini_model: 'gemini-1.5-flash'
};

const ConfigContext = createContext<ConfigContextType>({
    config: defaultConfig,
    updateConfig: async () => { },
    isLoading: false,
    refreshConfig: () => { },

    isDraftMode: false,
    setDraftMode: () => { },
    publishChanges: async () => { },
    discardChanges: async () => { },

    isVisualMode: false,
    toggleVisualMode: () => { }
});

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [config, setConfig] = useState<SystemConfig>(defaultConfig);
    const [isLoading, setIsLoading] = useState(true);
    const [isDraftMode, setDraftMode] = useState(false);
    const [isVisualMode, setIsVisualMode] = useState(false);

    const refreshConfig = async () => {
        try {
            // Fetch based on current mode
            const data = await getSystemConfig(isDraftMode ? 'draft' : 'live');

            if (data && Array.isArray(data)) {
                // Convert array [{key: 'k', value: 'v'}] to object {k: v}
                const configObj = data.reduce((acc: any, item: any) => {
                    // Handle boolean strings
                    let val: any = item.value;
                    if (val === 'true') val = true;
                    if (val === 'false') val = false;

                    acc[item.key] = val;
                    return acc;
                }, {});

                // Merge with default to ensure all keys exist
                setConfig(prev => ({ ...prev, ...configObj }));
            }
        } catch (error) {
            console.error("Failed to load system config", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshConfig();
    }, [isDraftMode]); // Refresh whenever mode toggles

    // POLL for updates every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            refreshConfig();
        }, 30000); // Poll every 30 seconds instead of 5 to save resources
        return () => clearInterval(interval);
    }, [isDraftMode]);

    const updateConfig = async (key: string, value: string) => {
        // Optimistic Update
        setConfig(prev => ({ ...prev, [key]: value }));

        try {
            // Pass draft flag
            await updateSystemConfig(key, String(value), undefined, isDraftMode);
        } catch (error) {
            console.error("Failed to save config", error);
            refreshConfig();
            throw error;
        }
    };

    const publishChanges = async () => {
        try {
            await publishConfig();
            setDraftMode(false); // Switch back to live view after publishing
            // refreshConfig() will be called automatically by the useEffect
            alert("Configuration Published Successfully!");
        } catch (error) {
            console.error("Failed to publish changes:", error);
            alert("Failed to publish configuration changes. Please try again.");
        }
    };

    const discardChanges = async () => {
        await discardDrafts();
        refreshConfig();
    };

    const toggleVisualMode = () => setIsVisualMode(prev => !prev);

    return (
        <ConfigContext.Provider value={{
            config,
            updateConfig,
            isLoading,
            refreshConfig,
            isDraftMode,
            setDraftMode,
            publishChanges,
            discardChanges,
            isVisualMode,
            toggleVisualMode
        }}>
            {children}
        </ConfigContext.Provider>
    );
};

export const useConfig = () => useContext(ConfigContext);
