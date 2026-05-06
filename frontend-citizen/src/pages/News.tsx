import { useState, useEffect, useRef } from 'react';
import { ShieldAlert, Loader2, Download, RefreshCw, Clock, MapPin, FileDown, Newspaper } from 'lucide-react';
import { useGovernanceScope } from '../context/GovernanceScopeContext';
import { cn } from '../lib/utils';
import { getLiveNews } from '../services/api';
import { INDIAN_STATES } from '../services/stateConfig';
import { Link } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function News() {
    const { scope, selectedState } = useGovernanceScope();
    const [newsData, setNewsData] = useState<any[]>([]);
    const [regionalBriefs, setRegionalBriefs] = useState<any[]>([]); // For National View
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [error, setError] = useState<string | null>(null);
    const refreshIntervalRef = useRef<any>(null);

    // Zero-dependency date formatter
    const formatDate = (date: Date) =>
        date.toLocaleString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });

    // Select correct region name for API
    const currentRegion = scope === 'nation' ? 'nation' : (selectedState?.name || 'nation');
    const regionLabel = scope === 'nation' ? 'National - India' : currentRegion;

    const fetchNews = async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Fetch Main Feed (National or State)
            const mainData = await getLiveNews(currentRegion);
            const enrichedMainData = mainData.map((item: any, idx: number) => ({
                ...item,
                image: `https://picsum.photos/seed/${item.id || idx}/1200/800`,
                category: idx === 0 ? 'HEADLINE' : 'MAIN STORY'
            }));
            setNewsData(enrichedMainData);

            // 2. If National View, fetch brief news from random states
            if (scope === 'nation') {
                const randomStates = INDIAN_STATES.sort(() => 0.5 - Math.random()).slice(0, 4);
                const briefs = await Promise.all(randomStates.map(async (state) => {
                    // Use a slightly different mapping for state names if needed, but current map should work
                    // Note: 'Andaman and Nicobar Islands' in config vs '&' in news.py. API needs to handle fuzzy match or simple strings.
                    // For now, passing state.name directly.
                    try {
                        // Simple fix for '&' vs 'and' mismatch just in case. 
                        const queryName = state.name.replace(' and ', ' & ');
                        const data = await getLiveNews(queryName);
                        return data.length > 0 ? { ...data[0], stateName: state.name, stateCode: state.code } : null;
                    } catch (e) { return null; }
                }));
                setRegionalBriefs(briefs.filter(b => b !== null));
            } else {
                setRegionalBriefs([]);
            }

            setLastUpdated(new Date());
        } catch (err) {
            console.error("Failed to fetch live news:", err);
            setError("FEED DISRUPTED");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNews();

        // Auto-refresh every 5 minutes
        refreshIntervalRef.current = setInterval(() => {
            fetchNews();
        }, 5 * 60 * 1000);

        return () => {
            if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
        };
    }, [currentRegion]);



    const [currentPage, setCurrentPage] = useState(1);

    // Reset page when region changes
    useEffect(() => {
        setCurrentPage(1);
    }, [currentRegion]);

    // Segregate News - Safety Checked and Paginated
    const PAGE_1_COUNT = 14; // 1 headline + 3 main + 10 sub
    const ITEMS_PER_ARCHIVE_PAGE = 12;
    const totalPages = newsData.length <= PAGE_1_COUNT ? 1 : 1 + Math.ceil((newsData.length - PAGE_1_COUNT) / ITEMS_PER_ARCHIVE_PAGE);

    const isFirstPage = currentPage === 1;
    const headline = isFirstPage && newsData.length > 0 ? newsData[0] : null;
    const mainStories = isFirstPage && newsData.length > 1 ? newsData.slice(1, 4) : [];
    const subStories = isFirstPage && newsData.length > 4 ? newsData.slice(4, PAGE_1_COUNT) : [];

    const getArchiveStories = () => {
        if (isFirstPage) return [];
        const start = PAGE_1_COUNT + (currentPage - 2) * ITEMS_PER_ARCHIVE_PAGE;
        return newsData.slice(start, start + ITEMS_PER_ARCHIVE_PAGE);
    };

    const archiveStories = getArchiveStories();

    const [downloadingPdf, setDownloadingPdf] = useState(false);

    const handleDownloadPdf = async () => {
        const contentElement = document.getElementById('news-content-container');
        if (!contentElement) return;

        setDownloadingPdf(true);
        try {
            // A4 dimensions in mm
            const a4Width = 210;
            const a4Height = 297;

            // Render the DOM to canvas (temporarily adjusting class if needed, or straight capture)
            const canvas = await html2canvas(contentElement, {
                scale: 1.5, // Balance quality and performance
                useCORS: true,
                logging: false,
                backgroundColor: document.documentElement.classList.contains('dark') ? '#0c0c14' : '#f4f1ea'
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // Calculate how many pages this continuous canvas needs
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            let heightLeft = pdfHeight;
            let position = 0;

            pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= a4Height;

            while (heightLeft >= 0) {
                position = heightLeft - pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= a4Height;
            }

            const formattedDate = new Date().toISOString().split('T')[0];
            pdf.save(`LiveFeed_${regionLabel}_${formattedDate}.pdf`);

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert("Failed to generate PDF snapshot.");
        } finally {
            setDownloadingPdf(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-[#f4f1ea] dark:bg-[#0c0c14] text-slate-900 dark:text-slate-100 transition-colors duration-700 pb-20 font-serif">
            {/* Paper Texture Overlay */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.4] dark:opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/cardboard-flat.png')] mix-blend-multiply dark:mix-blend-overlay"></div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-8">

                {/* --- NEWSPAPER HEADER --- */}
                <header className="border-b-4 border-black dark:border-white mb-8 pb-4">
                    <div className="flex justify-between items-center mb-4 border-b border-black/10 dark:border-white/10 pb-2">
                        <div className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                            Live Edition
                        </div>
                        <div className="text-xs font-mono text-slate-400 uppercase text-right md:text-left">
                            {formatDate(lastUpdated)}
                        </div>
                        <div className="flex gap-2 print:hidden">
                            <button onClick={fetchNews} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors" title="Refresh Feed">
                                <RefreshCw size={14} className={cn(loading && "animate-spin")} />
                            </button>
                            <button
                                onClick={handleDownloadPdf}
                                disabled={downloadingPdf || loading}
                                className="flex items-center gap-2 px-3 py-1 bg-slate-200 text-black dark:bg-slate-800 dark:text-white border border-slate-300 dark:border-slate-700 text-xs font-bold uppercase tracking-wider hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                            >
                                {downloadingPdf ? (
                                    <><div className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full"></div> Processing...</>
                                ) : (
                                    <><FileDown size={12} /> Live PDF</>
                                )}
                            </button>
                            <Link to="/newspaper" className="flex items-center gap-2 px-3 py-1 bg-black text-white dark:bg-white dark:text-black text-xs font-bold uppercase tracking-wider hover:opacity-80 transition-opacity">
                                <Newspaper size={12} /> View E-Paper
                            </Link>
                        </div>
                    </div>

                    <div className="text-center space-y-4 pt-4">
                        <h1 className="text-7xl md:text-9xl font-black uppercase tracking-tighter leading-[0.8] font-serif text-black dark:text-white border-b-[6px] border-black dark:border-white pb-6 inline-block">
                            THE {scope === 'nation' ? 'NATIONAL' : (selectedState?.name?.toUpperCase() || 'REGIONAL')} <br /><span className="italic font-light">GAZETTE</span>
                        </h1>
                        <div className="flex items-center justify-center gap-4 text-sm font-bold uppercase tracking-[0.4em] border-b-2 border-black dark:border-white py-3">
                            <span>TRANSPARENCY</span> • <span>EVIDENCE-BASED</span> • <span>UNBIASED</span> • <span>{regionLabel.toUpperCase()}</span>
                        </div>
                    </div>
                </header>

                {loading ? (
                    <div className="h-[60vh] flex flex-col items-center justify-center space-y-6">
                        <Loader2 size={48} className="text-red-600 animate-spin" />
                        <p className="text-xl font-mono uppercase tracking-widest text-slate-500">Fetching Wire Service...</p>
                    </div>
                ) : error ? (
                    <div className="h-64 flex flex-col items-center justify-center border-4 border-red-500 bg-red-50 dark:bg-red-900/10 p-8 text-center">
                        <ShieldAlert size={48} className="text-red-500 mb-4" />
                        <h2 className="text-2xl font-bold uppercase text-red-700 dark:text-red-400">Signal Interrupted</h2>
                        <p className="max-w-md text-slate-600 dark:text-slate-400 mt-2">{error}. Please verify network uplink.</p>
                        <button onClick={fetchNews} className="mt-6 px-6 py-2 bg-red-600 text-white font-bold uppercase hover:bg-red-700">Retry Connection</button>
                    </div>
                ) : (
                    <div id="news-content-container" className="flex flex-col bg-[#f4f1ea] dark:bg-[#0c0c14] pb-8 pt-4">
                        {isFirstPage ? (
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                                {/* --- LEFT COL: HEADLINE --- */}
                                <div className="lg:col-span-3 space-y-12">
                                    {headline && (
                                        <article className="group cursor-pointer" onClick={() => window.open(headline.link, '_blank')}>
                                            <div className="relative overflow-hidden border-2 border-slate-900 dark:border-slate-100 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] transition-shadow hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]">
                                                <div className="absolute top-0 left-0 bg-black text-white px-6 py-2 text-sm font-black uppercase tracking-widest z-10 border-b-2 border-r-2 border-white">
                                                    LEAD STORY
                                                </div>
                                                <img src={headline.image} alt={headline.title} className="w-full h-[500px] object-cover filter grayscale hover:grayscale-0 transition-all duration-700" />
                                            </div>
                                            <h2 className="text-5xl md:text-7xl font-black mt-8 leading-[0.9] group-hover:underline decoration-4 underline-offset-8 decoration-black dark:decoration-white transition-all font-serif">
                                                {headline.title}
                                            </h2>
                                            {headline.sentiment_insight && (
                                                <div className={`inline-flex items-center gap-2 mt-4 px-4 py-2 font-bold text-xs uppercase tracking-widest border border-black dark:border-white bg-transparent`}>
                                                    <ShieldAlert size={14} /> OFFICIAL DATA: {headline.sentiment_insight}
                                                </div>
                                            )}
                                            <div className="mt-6 text-xl md:text-2xl text-slate-800 dark:text-slate-200 font-serif leading-relaxed first-letter:float-left first-letter:text-7xl first-letter:pr-2 first-letter:font-black first-letter:mt-[-0.1em]">
                                                {headline.excerpt ? headline.excerpt : headline.content?.[0] || "No detail available"}
                                            </div>
                                            <div className="flex justify-between items-center border-y-2 border-black dark:border-white py-2 mt-6 text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">
                                                <span className="flex items-center gap-2"><Clock size={14} /> {headline.date || "TODAY"}</span>
                                                <span>SOURCE: {headline.source || "GOV.ONE DB"}</span>
                                            </div>
                                        </article>
                                    )}

                                    {/* Secondary Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t-2 border-slate-300 dark:border-slate-700">
                                        {mainStories.map((news) => (
                                            <article key={news.id} className="flex flex-col gap-4 group cursor-pointer border-b md:border-b-0 border-slate-300 dark:border-slate-700 pb-8 md:pb-0" onClick={() => window.open(news.link, '_blank')}>
                                                <div className="h-64 overflow-hidden border border-black dark:border-white relative filter grayscale group-hover:grayscale-0 transition-all duration-500">
                                                    <img src={news.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="News" />
                                                </div>
                                                <h3 className="text-3xl font-black font-serif leading-none group-hover:underline decoration-2 underline-offset-4">
                                                    {news.title}
                                                </h3>
                                                <p className="text-lg text-slate-700 dark:text-slate-300 font-serif leading-snug line-clamp-4">
                                                    {news.excerpt || news.content?.[0]}
                                                </p>
                                            </article>
                                        ))}
                                    </div>

                                    {/* --- REGIONAL HIGHLIGHTS (NATIONAL LAYOUT ONLY) --- */}
                                    {scope === 'nation' && regionalBriefs.length > 0 && (
                                        <div className="mt-16 pt-8 border-t-4 border-black dark:border-white">
                                            <div className="flex items-center justify-between mb-8">
                                                <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                                                    State & Union Territory <span className="text-red-600">Briefs</span>
                                                </h3>
                                                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Live Wire from 28 States</span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                                {regionalBriefs.map((brief, i) => (
                                                    <div key={i} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.open(brief.link, '_blank')}>
                                                        <div className="flex items-center gap-2 mb-2 text-[10px] font-black uppercase text-indigo-500 tracking-wider">
                                                            <MapPin size={10} /> {brief.stateName}
                                                        </div>
                                                        <h4 className="font-bold text-sm leading-snug line-clamp-3 mb-2 hover:text-indigo-500 transition-colors">
                                                            {brief.title}
                                                        </h4>
                                                        <span className="text-[10px] text-slate-400">{brief.source}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* --- RIGHT COL: SIDEBAR / TICKER --- */}
                                <aside className="lg:col-span-1 border-l border-black/10 dark:border-white/10 pl-0 lg:pl-8 space-y-8">
                                    <div className="bg-slate-100 dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-700">
                                        <h4 className="font-black uppercase tracking-widest text-xs mb-4 border-b border-slate-300 pb-2">
                                            {scope === 'nation' ? 'Quick Dispatch' : 'Local Wire'}
                                        </h4>
                                        <div className="space-y-6">
                                            {subStories.map((news) => (
                                                <div key={news.id} className="group cursor-pointer border-b border-slate-300 dark:border-slate-700 pb-4 last:border-0 last:pb-0" onClick={() => window.open(news.link, '_blank')}>
                                                    <span className="text-[10px] text-red-700 dark:text-red-400 font-bold uppercase tracking-widest">{news.source}</span>
                                                    <h5 className="font-bold text-sm leading-snug mt-1 group-hover:text-red-700 transition-colors">
                                                        {news.title}
                                                    </h5>
                                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">{news.date}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-900 text-white text-center shadow-lg">
                                        <h4 className="font-black text-2xl uppercase italic">Gov.One</h4>
                                        <p className="text-[10px] uppercase tracking-widest opacity-70 mt-1">Official Intelligence</p>
                                        <div className="mt-4 w-16 h-16 bg-white mx-auto flex items-center justify-center text-black font-black text-xs">
                                            Q/R
                                        </div>
                                    </div>
                                </aside>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
                                {archiveStories.map((news) => (
                                    <article key={news.id} className="flex flex-col gap-4 group cursor-pointer border border-slate-300 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 shadow-sm" onClick={() => window.open(news.link, '_blank')}>
                                        {news.image && (
                                            <div className="h-48 overflow-hidden relative filter grayscale group-hover:grayscale-0 transition-all duration-500 border border-black/10 dark:border-white/10">
                                                <img src={news.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="News" />
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-2">
                                            <span>{news.source}</span>
                                            <span>{news.date}</span>
                                        </div>
                                        <h3 className="text-xl font-black font-serif leading-tight group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors">
                                            {news.title}
                                        </h3>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 font-serif leading-relaxed line-clamp-3">
                                            {news.excerpt || news.content?.[0]}
                                        </p>
                                    </article>
                                ))}
                            </div>
                        )}

                        {/* --- PAGINATION CONTROLS --- */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-6 mt-16 pt-8 border-t-4 border-black dark:border-white">
                                <button
                                    onClick={() => {
                                        setCurrentPage(Math.max(1, currentPage - 1));
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    disabled={currentPage === 1}
                                    className="px-6 py-2 border-2 border-black dark:border-white font-bold uppercase tracking-widest text-xs hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-current"
                                >
                                    Previous Page
                                </button>
                                <span className="font-mono font-bold text-slate-500 uppercase tracking-widest">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => {
                                        setCurrentPage(Math.min(totalPages, currentPage + 1));
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    disabled={currentPage === totalPages}
                                    className="px-6 py-2 border-2 border-black dark:border-white font-bold uppercase tracking-widest text-xs hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-current"
                                >
                                    Next Page
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
