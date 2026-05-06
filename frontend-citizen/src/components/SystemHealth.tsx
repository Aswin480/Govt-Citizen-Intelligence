import { useEffect, useState } from 'react';
import { Shield, Activity, RefreshCw, AlertTriangle, CheckCircle, XCircle, Terminal } from 'lucide-react';

interface ScraperJob {
    id: number;
    name: string;
    url: string;
    status: string;
    health_score: number;
    last_run: string;
    frequency: number;
    is_active: boolean;
}

export const SystemHealth = () => {
    const [jobs, setJobs] = useState<ScraperJob[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchHealth = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8000/config/scrape/jobs');
            const data = await res.json();
            setJobs(data);
            setLoading(false);
        } catch (e) {
            console.error("Health Check Failed", e);
        }
    };

    useEffect(() => {
        fetchHealth();
        // Poll every 5s for live status
        const interval = setInterval(fetchHealth, 5000);
        return () => clearInterval(interval);
    }, []);

    const toggleJob = async (id: number) => {
        await fetch(`http://127.0.0.1:8000/config/scrape/jobs/${id}/toggle`, { method: 'POST' });
        fetchHealth();
    };

    return (
        <div className="h-full bg-black border border-green-900/50 rounded-xl overflow-hidden font-mono text-sm relative">

            {/* Header */}
            <div className="bg-green-950/20 border-b border-green-900 p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Shield className="text-green-500 animate-pulse" size={18} />
                    <h2 className="font-bold text-green-400 uppercase tracking-widest">System Defense Matrix</h2>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-green-700">
                    <Activity size={12} />
                    LIVE MONITORING
                </div>
            </div>

            {/* Grid */}
            <div className="p-4 overflow-y-auto h-[calc(100%-60px)] grid grid-cols-1 md:grid-cols-2 gap-4">
                {loading ? (
                    <div className="text-green-500 animate-pulse col-span-2 text-center p-8">SCANNING NETWORK...</div>
                ) : jobs.map(job => (
                    <div key={job.id} className={`p-4 border rounded-lg bg-black/50 backdrop-blur transition-all relative group ${!job.is_active ? 'border-red-900/50 opacity-60 grayscale' :
                            job.health_score < 70 ? 'border-amber-500/50' : 'border-green-500/30 hover:border-green-400'
                        }`}>

                        {/* Status Light */}
                        <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${!job.is_active ? 'bg-red-900' :
                                job.health_score < 50 ? 'bg-red-500 animate-ping' :
                                    'bg-green-500 animate-pulse'
                            }`} />

                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-slate-200">{job.name || "Unknown Agent"}</h3>
                                <div className="text-[10px] text-slate-500 truncate w-48">{job.url}</div>
                            </div>
                            <div className="text-right">
                                <div className={`text-2xl font-black ${job.health_score > 90 ? 'text-green-500' :
                                        job.health_score > 50 ? 'text-amber-500' : 'text-red-500'
                                    }`}>
                                    {Math.round(job.health_score)}%
                                </div>
                                <div className="text-[9px] uppercase tracking-wide text-slate-600">Health Score</div>
                            </div>
                        </div>

                        {/* Metrics Bar */}
                        <div className="w-full bg-slate-800 h-1 mt-2 mb-3 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-1000 ${job.health_score > 80 ? 'bg-green-500' : 'bg-red-500'
                                    }`}
                                style={{ width: `${job.health_score}%` }}
                            />
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-slate-400">
                            <div className="flex gap-2">
                                <span className={`flex items-center gap-1 ${job.last_run ? 'text-green-400' : 'text-slate-600'}`}>
                                    <RefreshCw size={10} /> {job.last_run ? new Date(job.last_run).toLocaleTimeString() : 'NEVER'}
                                </span>
                                {job.status === 'healing' && <span className="text-amber-400 animate-pulse">HEALING...</span>}
                            </div>

                            <button
                                onClick={() => toggleJob(job.id)}
                                className={`px-2 py-1 rounded border transition-colors uppercase font-bold ${job.is_active
                                        ? 'border-red-900/30 text-red-500 hover:bg-red-900/20'
                                        : 'border-green-900/30 text-green-500 hover:bg-green-900/20'
                                    }`}
                            >
                                {job.is_active ? 'KILL SWITCH' : 'REVIVE'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
