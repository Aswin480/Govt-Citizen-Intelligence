
import React, { useState } from 'react';
import {
    Shield, Key, UploadCloud, Save, CheckCircle2,
    AlertTriangle, FileText, Lock
} from 'lucide-react';
import { useConstitution } from '../context/ConstitutionContext';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminConstitutionConfig: React.FC = () => {
    const {
        setAdminApiKey,
        getAdminApiKey,
        setConstitutionText,
        constitutionText,
        lastUpdated
    } = useConstitution();

    const [apiKey, setKey] = useState(getAdminApiKey() || '');
    const [textBody, setTextBody] = useState(constitutionText);
    const [isSaved, setIsSaved] = useState(false);

    const handleSave = () => {
        if (apiKey) setAdminApiKey(apiKey);
        if (textBody) setConstitutionText(textBody);

        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-8 animate-fade-in shadow-xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                    <Shield size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Supreme Constitution Control</h2>
                    <p className="text-slate-400 text-sm">Manage the Master Document and AI Intelligence Core.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 1. API Key Vault */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase text-xs tracking-widest">
                        <Key size={14} /> AI Intelligence Core
                    </div>
                    <div className="bg-slate-950 p-6 rounded-xl border border-slate-800/50 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                        <label className="text-sm font-bold text-slate-300 mb-2 block">Gemini API Key (Master)</label>
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <Lock size={14} className="absolute left-3 top-3 text-slate-500" />
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setKey(e.target.value)}
                                    placeholder="Enter Secure Server Key..."
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-600"
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                            <CheckCircle2 size={10} className="text-emerald-500" />
                            Encrypted & Stored in Secure Vault. Users cannot see this.
                        </p>
                    </div>
                </div>

                {/* 2. Document Uplink */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-blue-400 font-bold uppercase text-xs tracking-widest">
                        <FileText size={14} /> Master Document
                    </div>
                    <div className="bg-slate-950 p-6 rounded-xl border border-slate-800/50 relative">
                        <label className="text-sm font-bold text-slate-300 mb-2 block">Upload Constitution (PDF/Text)</label>
                        <textarea
                            value={textBody}
                            onChange={(e) => setTextBody(e.target.value)}
                            className="w-full h-32 bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs font-mono text-slate-300 focus:border-blue-500 outline-none resize-none"
                            placeholder="Paste full text here or upload file..."
                        />
                        <div className="mt-3 flex justify-between items-center">
                            <button className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300 font-bold">
                                <UploadCloud size={14} /> Upload PDF
                            </button>
                            <span className="text-[10px] text-slate-500">
                                Last Updated: {lastUpdated || 'Never'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-8 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/20"
                >
                    {isSaved ? <CheckCircle2 size={18} /> : <Save size={18} />}
                    {isSaved ? 'Configuration Saved' : 'Save Intelligence Config'}
                </button>
            </div>
        </div>
    );
};
