import { useState, useEffect } from 'react';
import { useGovernanceScope } from '../context/GovernanceScopeContext';
import { getNewspaperEdition } from '../services/api';

import {
    Download, ChevronLeft, ChevronRight, Layout, ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// --- Sub-component for individual pages (Reusable for View & Print) ---
const NewspaperPage = ({ page, region, date, pageNumber, isDarkMode }: { page: any, region: string, date: string, pageNumber: number, isDarkMode?: boolean }) => {

    // Helper for drop cap
    const DropCap = ({ text }: { text: string }) => {
        if (!text) return null;
        return (
            <p className="mb-4 text-justify leading-relaxed">
                <span className="float-left text-6xl md:text-7xl font-black pr-3 pb-2 pt-1 mt-[-6px] leading-none font-serif text-slate-900 dark:text-slate-100 border-b-2 border-slate-900 dark:border-slate-100 mr-2">
                    {text.charAt(0)}
                </span>
                {text.slice(1)}
            </p>
        );
    };

    // Layout logic specific to a page
    const renderLayout = (articles: any[]) => {
        if (!articles || articles.length === 0) {
            return (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-12">
                    <Layout size={48} className="mb-4 opacity-50" />
                    <p className="font-serif italic text-lg">No official dispatches filed for this page.</p>
                </div>
            );
        }

        const lead = articles[0];
        const others = articles.slice(1);

        return (
            <div className="grid grid-cols-12 gap-8 h-full">
                {/* Main Lead - Spans 8 cols */}
                <div className="col-span-12 lg:col-span-8 flex flex-col border-r-0 lg:border-r border-slate-300 dark:border-slate-600 pr-0 lg:pr-8">
                    {lead.image_url && (
                        <div className="w-full h-64 md:h-80 overflow-hidden border-2 border-slate-900 dark:border-slate-400 mb-6 relative group placeholder-shimmer">
                            <div className="absolute inset-0 bg-black/10 mix-blend-multiply dark:mix-blend-overlay z-10 pointer-events-none"></div>
                            <img src={lead.image_url} alt="Lead" className="w-full h-full object-cover filter grayscale sepia-[0.2] contrast-125 dark:sepia-0 dark:contrast-100 transition-all duration-700 ease-in-out" />
                        </div>
                    )}

                    <h2 className="text-4xl md:text-5xl lg:text-[54px] font-black font-serif leading-[0.95] tracking-tight text-slate-900 dark:text-slate-50 mb-6 drop-shadow-sm">
                        {lead.headline}
                    </h2>

                    <div className="flex gap-4 text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-y border-slate-300 dark:border-slate-600 py-2 mb-6">
                        <span className="text-red-700 dark:text-red-400">{lead.location}</span>
                        <span>•</span>
                        <span>{lead.author}</span>
                        {lead.subheadline && (
                            <>
                                <span>•</span>
                                <span className="italic text-slate-600 dark:text-slate-300 normal-case tracking-normal">{lead.subheadline}</span>
                            </>
                        )}
                    </div>

                    <div className="prose prose-slate dark:prose-invert max-w-none font-serif text-[15px] md:text-base leading-relaxed text-justify relative column-count-1 lg:column-count-2 column-gap-8 text-slate-800 dark:text-slate-300 pb-4">
                        <DropCap text={lead.content?.[0] || ""} />
                        {lead.content?.slice(1).map((para: string, i: number) => (
                            <p key={i} className="mb-4 text-justify leading-relaxed break-inside-avoid">{para}</p>
                        ))}
                    </div>
                </div>

                {/* Sidebar Stories - Spans 4 cols */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                    <div className="w-full border-b-4 border-slate-900 dark:border-slate-400 pb-2 mb-2">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Briefings / Local</h3>
                    </div>
                    {others.map((article: any, i: number) => (
                        <div key={i} className="border-b border-slate-300 dark:border-slate-700 pb-5 last:border-0 relative">
                            <h4 className="text-lg md:text-xl font-bold font-serif mb-3 leading-tight text-slate-900 dark:text-slate-100 hover:text-red-700 dark:hover:text-red-400 transition-colors cursor-pointer">
                                {article.headline}
                            </h4>
                            <p className="text-sm text-slate-700 dark:text-slate-400 line-clamp-4 font-serif leading-relax text-justify">
                                {article.content?.[0]}
                            </p>
                        </div>
                    ))}

                    {/* Filler Ad Space if empty */}
                    {others.length < 2 && (
                        <div className="mt-auto p-6 bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 text-center rounded-sm">
                            <p className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-1">Public Service Announcement</p>
                            <h4 className="font-black text-xl md:text-2xl my-3 text-slate-800 dark:text-slate-200">Pay Taxes. Build Nation.</h4>
                            <div className="w-8 h-8 rounded-full border-2 border-slate-400 dark:border-slate-500 mx-auto mt-4 opacity-50"></div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className={`shadow-2xl transition-colors duration-500 flex flex-col relative text-left overflow-hidden origin-top
            w-[210mm] h-[297mm] p-[15mm] md:p-[20mm]
            ${isDarkMode ? 'bg-[#1e1e24] text-slate-200 shadow-black/80 border border-white/5' : 'bg-[#F9F7F1] text-slate-900 shadow-xl border border-black/5'}
        `}>
            {/* Paper Texture Overlay (Subtle) */}
            <div className={`absolute inset-0 pointer-events-none mix-blend-multiply dark:mix-blend-overlay ${isDarkMode ? 'opacity-[0.15]' : 'opacity-[0.4]'} bg-[url('https://www.transparenttextures.com/patterns/cardboard-flat.png')]`}></div>
            {/* Elegant vignette edge */}
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_0_100px_rgba(0,0,0,0.3)]"></div>

            <div className="relative z-10 h-full flex flex-col">
                {/* Page Header */}
                <div className="border-b-[3px] border-slate-900 dark:border-slate-400 mb-8 pb-3">
                    <div className="flex justify-between items-baseline mb-2">
                        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter font-sans text-slate-900 dark:text-slate-100">{page?.section}</h2>
                        <h3 className="text-xl md:text-2xl font-serif italic text-slate-500 dark:text-slate-400 font-medium">Page {pageNumber}</h3>
                    </div>
                    <div className="flex justify-between items-center text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] border-t border-slate-300 dark:border-slate-600 pt-2 text-slate-600 dark:text-slate-400">
                        <span>{region} EDITION</span>
                        <span>{date}</span>
                        <span className="flex items-center gap-1">GOV.ONE <span className="w-1 h-1 bg-red-600 rounded-full inline-block"></span> OFFICIAL</span>
                    </div>
                </div>

                {/* Article Grid */}
                <div className="flex-1 overflow-hidden">
                    {renderLayout(page?.articles || [])}
                </div>

                {/* Footer */}
                <div className="mt-8 pt-4 border-t-2 border-slate-900 dark:border-slate-500 flex justify-between items-center text-[9px] font-mono text-slate-500 dark:text-slate-500 uppercase tracking-widest leading-none">
                    <span>Printed via Citizen API Server</span>
                    <span>{new Date().toISOString().split('T')[0]}</span>
                    <span className="font-bold text-slate-900 dark:text-slate-300 text-xs">P. {pageNumber}</span>
                </div>
            </div>
        </div>
    );
};

export default function NewspaperEdition() {
    const { scope, selectedState } = useGovernanceScope();
    const [editionData, setEditionData] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [downloading, setDownloading] = useState(false);

    const [language, setLanguage] = useState('en');

    // Listen to document dark mode class
    const [isDarkMode, setIsDarkMode] = useState(false);
    useEffect(() => {
        const checkDarkMode = () => setIsDarkMode(document.documentElement.classList.contains('dark'));
        checkDarkMode();
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    // Determine context
    const currentRegion = scope === 'nation' ? 'India' : (selectedState?.name || 'India');
    const today = new Date().toLocaleDateString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    // Dynamic Language Logic
    const [availableLanguages, setAvailableLanguages] = useState<any[]>([]);

    useEffect(() => {
        // Reset to English on scope change
        setLanguage('en');

        const ALL_LANGS = [
            { code: 'en', label: 'English' },
            { code: 'hi', label: 'Hindi' },
            { code: 'ta', label: 'Tamil' },
            { code: 'ml', label: 'Malayalam' },
            { code: 'kn', label: 'Kannada' },
            { code: 'te', label: 'Telugu' },
            { code: 'mr', label: 'Marathi' },
            { code: 'bn', label: 'Bengali' },
            { code: 'gu', label: 'Gujarati' },
            { code: 'pa', label: 'Punjabi' }
        ];

        if (scope === 'nation') {
            setAvailableLanguages(ALL_LANGS);
        } else if (selectedState && selectedState.languages) {
            const stateLangs = selectedState.languages.map(code => {
                const langDef = ALL_LANGS.find(l => l.code === code);
                return langDef ? { ...langDef, label: langDef.label + (code === 'en' ? ' (Official)' : ' (Regional)') } : null;
            }).filter(Boolean);
            setAvailableLanguages(stateLangs);
        }
    }, [scope, selectedState]);

    useEffect(() => {
        const fetchEdition = async () => {
            setLoading(true);
            try {
                // Fetch full 11-page structure with chosen language
                const data = await getNewspaperEdition(currentRegion, language);
                setEditionData(data);
                setCurrentPage(1);
            } catch (error) {
                console.error("Failed to load edition", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEdition();
    }, [currentRegion, language]);

    const pageContent = editionData?.pages?.find((p: any) => p.page_number === currentPage);

    const handleDownload = async () => {
        if (!editionData || !editionData.pages) return;
        setDownloading(true);
        try {
            // A4 dimensions in mm
            const a4Width = 210;
            const a4Height = 297;
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // Create a temporary staging container in the visible DOM (but offscreen)
            // This ensures html2canvas parses the CSS and dimensions correctly
            const stagingContainer = document.createElement('div');
            stagingContainer.style.position = 'absolute';
            stagingContainer.style.top = '-20000px';
            stagingContainer.style.left = '0';
            stagingContainer.style.width = '210mm';
            document.body.appendChild(stagingContainer);

            for (let i = 0; i < editionData.pages.length; i++) {
                const pageNum = editionData.pages[i].page_number;
                const originalElement = document.getElementById(`print-page-${pageNum}`);

                if (originalElement) {
                    // Clone the element to avoid jumping/flickering in the original hidden container
                    const clone = originalElement.cloneNode(true) as HTMLElement;
                    clone.style.position = 'relative';
                    clone.style.display = 'block';
                    clone.style.width = '210mm';
                    clone.style.height = '297mm';
                    clone.style.backgroundColor = isDarkMode ? '#1e1e24' : '#F9F7F1';

                    stagingContainer.innerHTML = ''; // Clear previous
                    stagingContainer.appendChild(clone);

                    // Allow a tiny delay for browser to calculate styles on the clone
                    await new Promise(resolve => setTimeout(resolve, 100));

                    const canvas = await html2canvas(clone, {
                        scale: 2, // Higher scale for better PDF quality
                        useCORS: true, // Allow loading external images
                        logging: false,
                        windowWidth: clone.scrollWidth,
                        windowHeight: clone.scrollHeight
                    });

                    const imgData = canvas.toDataURL('image/jpeg', 0.95);

                    if (i > 0) {
                        pdf.addPage();
                    }
                    pdf.addImage(imgData, 'JPEG', 0, 0, a4Width, a4Height);
                }
            }

            // Cleanup staging area
            document.body.removeChild(stagingContainer);

            pdf.save(`National_Gazette_${today.replace(/ /g, '_')}_${currentRegion}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert("Failed to generate PDF. Please try again.");
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return <div className="h-screen flex items-center justify-center bg-[#f4f1ea] dark:bg-[#0c0c14]"><div className="animate-spin w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full"></div></div>;
    }

    return (
        <div className="min-h-screen transition-colors duration-700 bg-[#e0ded8] dark:bg-[#0c0c14] p-4 md:p-8 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <header className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white dark:bg-[#1a1c23] rounded-xl p-3 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-white/20 z-20 transition-colors duration-500">
                <div className="flex items-center gap-5">
                    <Link to="/news" className="p-3 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight font-serif text-slate-900 dark:text-white">The National Gazette</h1>
                        <p className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{currentRegion} Edition • {today}</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0 justify-center">
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="p-2 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold uppercase bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-colors cursor-pointer"
                    >
                        {availableLanguages.map(lang => (
                            <option key={lang.code} value={lang.code}>{lang.label}</option>
                        ))}
                    </select>

                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden md:block"></div>

                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1.5 gap-1 border border-slate-200 dark:border-slate-700">
                        <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="p-2 text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded-md shadow-sm disabled:opacity-30 transition-all"><ChevronLeft size={16} /></button>
                        <span className="px-5 py-2 font-mono font-bold text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-md shadow-inner min-w-[100px] text-center">Page {currentPage}</span>
                        <button onClick={() => setCurrentPage(Math.min(11, currentPage + 1))} disabled={currentPage === 11} className="p-2 text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded-md shadow-sm disabled:opacity-30 transition-all"><ChevronRight size={16} /></button>
                    </div>

                    <div className="h-8 w-px bg-slate-300 mx-2"></div>

                    <button
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold text-xs uppercase hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50 transition-colors shadow-sm"
                        onClick={handleDownload}
                        disabled={downloading}
                    >
                        {downloading ? (
                            <>
                                <div className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full"></div>
                                Saving Full Edition...
                            </>
                        ) : (
                            <>
                                <Download size={14} /> PDF
                            </>
                        )}
                    </button>
                </div>
            </header>

            {/* Newspaper Canvas (Visible User Area) */}
            <main className="flex-1 overflow-auto flex justify-center pb-20 px-4 scrollbar-hide">
                {/* Reader Mode Toggle Button (Mobile Friendly) */}
                <div className="fixed bottom-6 right-6 z-50 md:hidden">
                    <button
                        onClick={() => setZoomLevel(prev => prev === 1 ? 0.6 : 1)}
                        className="p-4 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xl"
                    >
                        <Layout size={24} />
                    </button>
                </div>

                {/* Desktop / Print Layout (Visible Page) */}
                <div
                    className="origin-top transition-transform duration-300 hidden md:block"
                    style={{ transform: `scale(${zoomLevel})` }}
                >
                    {pageContent ? (
                        <NewspaperPage
                            page={pageContent}
                            region={currentRegion}
                            date={today}
                            pageNumber={currentPage}
                            isDarkMode={isDarkMode}
                        />
                    ) : (
                        <div className="text-slate-500">Page data not found</div>
                    )}
                </div>

                {/* Mobile Reader Mode (Responsive List) */}
                <div className="md:hidden w-full max-w-lg space-y-6 pb-20 mt-4">
                    <div className="bg-white dark:bg-[#1a1c23] p-6 rounded-xl shadow-lg border-b-4 border-slate-900 dark:border-white transition-colors duration-500">
                        <h2 className="text-3xl font-black uppercase text-center font-serif leading-tight text-slate-900 dark:text-white">{pageContent?.section}</h2>
                        <p className="text-center text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mt-3">{today}</p>
                    </div>

                    {pageContent?.articles?.map((article: any, idx: number) => (
                        <div key={idx} className="bg-white dark:bg-[#1a1c23] p-5 rounded-xl shadow-md border border-slate-100 dark:border-slate-800 transition-colors duration-500">
                            {article.image_url && (
                                <img src={article.image_url} className="w-full h-56 object-cover rounded-md mb-5 filter sepia-[0.2] dark:sepia-0" alt="News" />
                            )}
                            <h3 className="text-2xl font-black font-serif leading-tight mb-3 text-slate-900 dark:text-white">{article.headline}</h3>
                            <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 mb-4 uppercase font-bold tracking-widest border-y border-slate-100 dark:border-slate-800 py-2">
                                <span className="text-red-700 dark:text-red-400">{article.location}</span>
                                <span>{article.author}</span>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm font-serif text-justify">
                                {article.content[0]}
                            </p>
                        </div>
                    ))}
                </div>
            </main>

            {/* HIDDEN RENDER AREA FOR PDF GENERATION */}
            {/* These are rendered but kept totally hidden. We clone them during capture. */}
            <div id="hidden-print-container" className="hidden">
                {editionData?.pages?.map((page: any) => (
                    <div id={`print-page-${page.page_number}`} key={page.page_number} className="w-[210mm] h-[297mm] overflow-hidden">
                        <NewspaperPage
                            page={page}
                            region={currentRegion}
                            date={today}
                            pageNumber={page.page_number}
                            isDarkMode={isDarkMode}
                        />
                    </div>
                ))}
            </div>

        </div>
    );
}
