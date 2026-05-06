import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSchemes } from '../services/api';
import { FileText, ArrowRight, Loader2, Calendar, Users, ShieldCheck } from 'lucide-react';

/* Types for robustness */
export interface Scheme {
    id: number | string;
    title: string;
    description: string;
    eligibility: string;
    deadline?: string;
    beneficiaries: string;
    status: 'Active' | 'Closed' | 'Upcoming';
    funding_type?: string;
    official_pdf_url?: string;
}

interface SchemesProps {
    adminMode?: boolean;
    onEditScheme?: (scheme: Scheme) => void;
}

const Schemes: React.FC<SchemesProps> = ({ adminMode, onEditScheme }) => {
    // 1. Fetching Data with React Query
    const { data: schemes, isLoading, error } = useQuery({
        queryKey: ['schemes'],
        queryFn: getSchemes,
        retry: 1, // Don't spam retries if backend is dead
    });

    // Mock Data for "Power" Preview if API is empty/offline
    const displaySchemes: Scheme[] = schemes?.length ? schemes : [
        {
            id: 101,
            title: "National Solar Energy Mission",
            description: "Subsidies for residential solar panel installation and grid connectivity.",
            eligibility: "Homeowners with >500sqft roof",
            beneficiaries: "2.4M Households",
            status: "Active",
            funding_type: "Central Govt",
            official_pdf_url: "https://mnre.gov.in/img/documents/uploads/file_f-1675239967265.pdf"
        },
        {
            id: 102,
            title: "Digital Literacy Campaign",
            description: "Free computer education for rural youth to boost employability.",
            eligibility: "Age 18-25, Rural Residents",
            beneficiaries: "500k Students",
            status: "Upcoming",
            funding_type: "State Govt"
        },
        {
            id: 103,
            title: "Urban Housing Grant",
            description: "Financial aid for first-time home buyers in metropolitan areas.",
            eligibility: "Income < 8L PA",
            beneficiaries: "125k Families",
            status: "Active",
            funding_type: "Joint Venture"
        }
    ];

    // Live Preview State
    const [previewOverrides, setPreviewOverrides] = useState<Record<string, Partial<Scheme>>>({});

    useEffect(() => {
        const channel = new BroadcastChannel('admin-live-preview');
        channel.onmessage = (event) => {
            if (event.data?.type === 'SCHEME_PREVIEW' && event.data?.data) {
                const preview = event.data.data;
                if (preview.id) {
                    setPreviewOverrides(prev => ({
                        ...prev,
                        [preview.id]: preview
                    }));
                }
            }
        };
        return () => channel.close();
    }, []);

    // Apply Live Previews
    const finalSchemes = displaySchemes.map(s => ({
        ...s,
        ...previewOverrides[s.id]
    }));

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-[var(--color-gov-amber-500)] animate-spin" />
                    <p className="text-slate-500 font-mono text-sm tracking-wider uppercase">Accessing Secure Database...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-[var(--color-gov-navy-900)] dark:text-white leading-tight">
                        Active Gov Schemes
                    </h1>
                    <p className="text-slate-500 mt-2 max-w-2xl">
                        Direct access to centrally sponsored and state-level initiatives. Apply securely using your unique Citizen ID.
                    </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-100">
                    <ShieldCheck className="w-4 h-4" />
                    Official Portal
                </div>
            </div>

            {/* Schemes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {error && (
                    <div className="col-span-full p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg flex items-center gap-2">
                        <span>⚠️ System is in offline mode. Showing cached or demo data.</span>
                    </div>
                )}

                {finalSchemes.map((scheme, index) => (
                    <div
                        key={scheme.id}
                        className="glass-panel p-6 rounded-[var(--radius-lg)] group hover:border-[var(--color-gov-amber-400)] transition-all duration-300 relative overflow-hidden flex flex-col"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        {/* Status Badge */}
                        <div className={`absolute top-4 right-4 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide 
                            ${scheme.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                            {scheme.status}
                        </div>

                        <div className="mb-4 text-[var(--color-gov-navy-700)] dark:text-slate-300 group-hover:text-[var(--color-gov-amber-600)] transition-colors">
                            <FileText className="w-8 h-8" />
                        </div>

                        <h3 className="text-xl font-bold text-[var(--color-gov-navy-900)] mb-2 line-clamp-1" title={scheme.title}>
                            {scheme.title}
                        </h3>
                        <p className="text-slate-500 text-sm mb-6 flex-1 line-clamp-3">
                            {scheme.description}
                        </p>

                        <div className="space-y-3 mb-6">
                            <div className="flex items-start gap-2 text-xs text-slate-600">
                                <Users className="w-4 h-4 shrink-0 text-slate-400" />
                                <span><span className="font-semibold">Beneficiaries:</span> {scheme.beneficiaries}</span>
                            </div>
                            <div className="flex items-start gap-2 text-xs text-slate-600">
                                <Calendar className="w-4 h-4 shrink-0 text-slate-400" />
                                <span><span className="font-semibold">Eligibility:</span> {scheme.eligibility}</span>
                            </div>
                        </div>

                        <div className="mt-auto flex flex-col gap-3">
                            {!adminMode ? (
                                <>
                                    <button className="w-full btn-gov group-hover:bg-[var(--color-gov-navy-800)] flex items-center justify-between">
                                        <span>Check Eligibility</span>
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>

                                    {scheme.official_pdf_url && (
                                        <a
                                            href={scheme.official_pdf_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-[var(--color-gov-amber-500)] hover:bg-[var(--color-gov-amber-50)] dark:hover:bg-[var(--color-gov-amber-900)]/20 hover:text-[var(--color-gov-amber-700)] transition-all text-sm font-bold uppercase tracking-wider text-slate-500"
                                        >
                                            <FileText className="w-4 h-4" />
                                            Official Document
                                        </a>
                                    )}
                                </>
                            ) : (
                                <button
                                    onClick={() => onEditScheme && onEditScheme(scheme)}
                                    className="w-full py-4 rounded-xl bg-green-500/10 border border-green-500/50 text-green-500 font-bold uppercase tracking-widest hover:bg-green-500 hover:text-black transition-all flex items-center justify-center gap-2"
                                >
                                    Edit Scheme
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Schemes;
