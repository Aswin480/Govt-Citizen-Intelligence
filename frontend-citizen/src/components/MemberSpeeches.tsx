import { Share2, Clock, MapPin, Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import React, { useState, useMemo } from 'react';

interface SpeechProps {
    speeches?: any[];
}

export const MemberSpeeches: React.FC<SpeechProps> = ({ speeches }) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [filterType, setFilterType] = useState<'all' | 'support' | 'oppose' | 'question'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedSpeeches, setExpandedSpeeches] = useState<Record<string, boolean>>({});

    const ITEMS_PER_PAGE = 10;
    const PREVIEW_WORD_LIMIT = 55;

    const getPreviewText = (text: string): { isLong: boolean; preview: string } => {
        const words = text.trim().split(/\s+/).filter(Boolean);
        const isLong = words.length > PREVIEW_WORD_LIMIT;
        if (!isLong) {
            return { isLong: false, preview: text };
        }

        const previewWords = words.slice(0, PREVIEW_WORD_LIMIT).join(' ');
        return { isLong: true, preview: `${previewWords}...` };
    };

    const hashText = (text: string): string => {
        let hash = 0;
        for (let i = 0; i < text.length; i += 1) {
            hash = (hash << 5) - hash + text.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash).toString(36);
    };

    const getSpeechKey = (speech: any): string => {
        const batchId = speech.batch_id ?? 'no-batch';
        const rowIndex = speech.row_index ?? 'no-row';
        const coreValue = speech.core_value ?? 'no-core';
        const speechText = typeof speech.speech === 'string' ? speech.speech : '';
        const speechSignature = `${speechText.length}-${hashText(speechText.slice(0, 300))}`;
        return `${batchId}-${rowIndex}-${coreValue}-${speechSignature}`;
    };

    const isExpanded = (speech: any): boolean => {
        const key = getSpeechKey(speech);
        return Boolean(expandedSpeeches[key]);
    };

    const toggleExpanded = (speech: any): void => {
        const key = getSpeechKey(speech);
        setExpandedSpeeches((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    // Filter speeches based on type and search
    const filteredSpeeches = useMemo(() => {
        if (!speeches || speeches.length === 0) return [];

        return speeches.filter((speech) => {
            const typeMatch =
                filterType === 'all' ||
                (speech.core_value?.toLowerCase().includes(filterType));

            const searchMatch =
                searchQuery === '' ||
                (speech.speech && speech.speech.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (speech.core_value && speech.core_value.toLowerCase().includes(searchQuery.toLowerCase()));

            return typeMatch && searchMatch;
        });
    }, [speeches, filterType, searchQuery]);

    // Calculate statistics
    const stats = useMemo(() => {
        if (!speeches || speeches.length === 0) {
            return { total: 0, avgScore: 0, duration: 0, topFocus: 'N/A' };
        }

        const totalDebates = speeches.length;
        const avgScore = (speeches.reduce((sum, s) => sum + (s.score || 0), 0) / totalDebates).toFixed(1);
        const durationHours = Math.floor(totalDebates / 60);
        const durationMinutes = totalDebates % 60;
        const topFocus = speeches[0]?.core_value || 'Mixed';

        return {
            total: totalDebates,
            avgScore: parseFloat(avgScore),
            duration: `${durationHours}h ${durationMinutes}m`,
            topFocus
        };
    }, [speeches]);

    // Pagination
    const paginatedSpeeches = useMemo(() => {
        const start = currentPage * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        return filteredSpeeches.slice(start, end);
    }, [filteredSpeeches, currentPage]);

    const totalPages = Math.ceil(filteredSpeeches.length / ITEMS_PER_PAGE);

    if (!speeches || speeches.length === 0) {
        return <div className="p-8 text-center text-slate-400">No speeches found.</div>;
    }

    return (
        <div className="space-y-6">
            {/* Statistics Panel */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-900/10 rounded-2xl p-4 border border-indigo-200 dark:border-indigo-800">
                    <div className="text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest mb-2">Total Debates</div>
                    <div className="text-3xl font-bold text-indigo-900 dark:text-indigo-200">{stats.total}</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-2xl p-4 border border-blue-200 dark:border-blue-800">
                    <div className="text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">Duration</div>
                    <div className="text-3xl font-bold text-blue-900 dark:text-blue-200">{stats.duration}</div>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/10 rounded-2xl p-4 border border-amber-200 dark:border-amber-800">
                    <div className="text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-widest mb-2">Focus Area</div>
                    <div className="text-xl font-bold text-amber-900 dark:text-amber-200 truncate">{stats.topFocus}</div>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/10 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800">
                    <div className="text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2">Avg Impact</div>
                    <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-200">{stats.avgScore.toFixed(1)}/10</div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 items-center">
                <button
                    onClick={() => { setFilterType('all'); setCurrentPage(0); }}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                        filterType === 'all'
                            ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                >
                    All
                </button>
                <button
                    onClick={() => { setFilterType('support'); setCurrentPage(0); }}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                        filterType === 'support'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300'
                    }`}
                >
                    Support
                </button>
                <button
                    onClick={() => { setFilterType('oppose'); setCurrentPage(0); }}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                        filterType === 'oppose'
                            ? 'bg-red-600 text-white'
                            : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300'
                    }`}
                >
                    Oppose
                </button>
                <button
                    onClick={() => { setFilterType('question'); setCurrentPage(0); }}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                        filterType === 'question'
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300'
                    }`}
                >
                    Question
                </button>

                {/* Search Box */}
                <div className="ml-auto flex items-center">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search transcripts & topics..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(0); }}
                            className="pl-10 pr-4 py-2 rounded-full text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>
            </div>

            {/* Debates List */}
            {paginatedSpeeches.length > 0 ? (
                <div className="space-y-4">
                    {paginatedSpeeches.map((speech) => {
                        const speechText = typeof speech.speech === 'string' ? speech.speech : '';
                        const previewMeta = getPreviewText(speechText);
                        const speechIsLong = previewMeta.isLong;
                        const expanded = isExpanded(speech);
                        const displayedText = speechIsLong && !expanded ? previewMeta.preview : speechText;
                        const speechContentId = `speech-content-${getSpeechKey(speech)}`;

                        const typeColor =
                            speech.core_value?.toLowerCase().includes('support')
                                ? 'emerald'
                                : speech.core_value?.toLowerCase().includes('oppose')
                                ? 'red'
                                : speech.core_value?.toLowerCase().includes('question')
                                ? 'blue'
                                : 'indigo';

                        const badgeClasses = {
                            emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
                            red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
                            blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
                            indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
                        };

                        return (
                            <div
                                key={getSpeechKey(speech)}
                                className="relative pl-6 border-l-4 border-indigo-300 dark:border-indigo-700 group"
                                style={{
                                    borderLeftColor:
                                        typeColor === 'emerald' ? '#10b981' : typeColor === 'red' ? '#ef4444' : typeColor === 'blue' ? '#3b82f6' : '#6366f1',
                                }}
                            >
                                <div className="absolute top-0 -left-4 w-6 h-6 bg-white dark:bg-slate-950 border-2 rounded-full flex items-center justify-center transition-all"
                                    style={{ borderColor: typeColor === 'emerald' ? '#10b981' : typeColor === 'red' ? '#ef4444' : typeColor === 'blue' ? '#3b82f6' : '#6366f1' }}
                                >
                                    <div className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: typeColor === 'emerald' ? '#10b981' : typeColor === 'red' ? '#ef4444' : typeColor === 'blue' ? '#3b82f6' : '#6366f1' }}
                                    />
                                </div>

                                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 transition-all hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-800 relative overflow-hidden">

                                    {/* Header with Enhanced Metadata */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-grow">
                                            {/* Date and Metadata Row */}
                                            <div className="flex items-center gap-3 mb-3 flex-wrap">
                                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                                    {speech.end_date ? new Date(speech.end_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '— —'} • LOK SABHA
                                                </span>
                                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${badgeClasses[typeColor as keyof typeof badgeClasses]}`}>
                                                    {speech.core_value || 'Debate'}
                                                </span>
                                                {speech.score !== null && speech.score !== undefined && (
                                                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-full">
                                                        Impact: {speech.score.toFixed(1)}/10
                                                    </span>
                                                )}
                                            </div>
                                            
                                            {/* Speaker and Position */}
                                            <h4 className="font-bold text-lg text-slate-900 dark:text-white leading-snug mb-1">
                                                {typeColor === 'emerald' ? '✓ ' : typeColor === 'red' ? '✗ ' : typeColor === 'blue' ? '❓ ' : '• '}
                                                {speech.core_value || 'Parliamentary Intervention'}
                                            </h4>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                Speech #{speech.row_index || '—'} in Parliamentary record
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0 mt-2">
                                            <button className="text-slate-300 hover:text-indigo-600 transition-colors">
                                                <Share2 size={18} />
                                            </button>
                                            {speechIsLong && (
                                                <button
                                                    type="button"
                                                    onClick={() => toggleExpanded(speech)}
                                                    aria-expanded={expanded}
                                                    aria-controls={speechContentId}
                                                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                                                    title={expanded ? 'Collapse statement' : 'Expand statement'}
                                                >
                                                    {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Speech Content with Enhanced Formatting */}
                                    <div className="relative mb-6 mt-6">
                                        {/* Speech Type Indicator */}
                                        <div className="mb-3 flex items-center gap-2">
                                            {typeColor === 'emerald' && <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><span className="text-sm font-bold">SUPPORTING</span></span>}
                                            {typeColor === 'red' && <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400"><span className="text-sm font-bold">OPPOSING</span></span>}
                                            {typeColor === 'blue' && <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400"><span className="text-sm font-bold">QUESTIONING</span></span>}
                                            {typeColor === 'indigo' && <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400"><span className="text-sm font-bold">STATEMENT</span></span>}
                                        </div>

                                        {/* Full Speech Text with Better Typography */}
                                        <div id={speechContentId} className="bg-gradient-to-br from-slate-50 to-slate-50/50 dark:from-slate-800/30 dark:to-slate-900/20 rounded-xl p-6 border border-slate-200 dark:border-slate-700 relative">
                                            <p className="text-slate-700 dark:text-slate-200 leading-relaxed text-base break-words whitespace-pre-wrap font-normal">
                                                {displayedText || 'Speech content not available'}
                                            </p>

                                        </div>

                                        {/* Content Length Badge */}
                                        {speech.speech && (
                                            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                <span className="font-medium">{speech.speech.split(/\s+/).length} words</span>
                                                <span>•</span>
                                                <span>{Math.ceil(speech.speech.length / 5)} min read</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Enhanced Footer with Full Metadata */}
                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800/50 flex flex-col gap-3">
                                        {/* Metadata Grid */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                            <div>
                                                <div className="text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1">Speaker</div>
                                                <div className="text-slate-900 dark:text-slate-100 font-medium">Member of Parliament</div>
                                            </div>
                                            <div>
                                                <div className="text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1">Date</div>
                                                <div className="text-slate-900 dark:text-slate-100 font-medium">
                                                    {speech.end_date ? new Date(speech.end_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: '2-digit' }) : '— —'}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1">Period</div>
                                                <div className="text-slate-900 dark:text-slate-100 font-medium">
                                                    {speech.start_date && speech.end_date ? `${new Date(speech.start_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} - ${new Date(speech.end_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}` : '— —'}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1">Position</div>
                                                <div className="text-slate-900 dark:text-slate-100 font-medium">
                                                    {typeColor === 'emerald' ? 'In Support' : typeColor === 'red' ? 'In Opposition' : typeColor === 'blue' ? 'Questioning' : 'Neutral'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Score and Index */}
                                        <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800/50">
                                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                <Clock size={14} />
                                                <span>Record #{speech.row_index || '—'}</span>
                                            </div>
                                            {speech.score !== null && speech.score !== undefined && (
                                                <div className="font-semibold text-sm">
                                                    Score: <span className="text-indigo-600 dark:text-indigo-400">{speech.score.toFixed(2)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Background Decoration */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-50/50 to-transparent dark:from-indigo-900/5 rounded-bl-[100px] pointer-events-none" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-700 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-200">
                    <div className="text-sm font-bold uppercase tracking-widest mb-2">No debates found</div>
                    <p className="text-sm">Try adjusting your search or filter criteria.</p>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                    <button
                        onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                        disabled={currentPage === 0}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <div className="flex gap-1">
                        {Array.from({ length: totalPages }, (_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentPage(i)}
                                className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                                    currentPage === i
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                                }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                        disabled={currentPage === totalPages - 1}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>

                    <span className="text-sm text-slate-600 dark:text-slate-400 ml-4">
                        Page {currentPage + 1} of {totalPages} • {filteredSpeeches.length} results
                    </span>
                </div>
            )}
        </div>
    );
};
