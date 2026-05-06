import React from 'react';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip
} from 'recharts';

interface PerformanceProps {
    scores: Record<string, number>;
}

export const MemberPerformanceChart: React.FC<PerformanceProps> = ({ scores }) => {
    if (!scores || Object.keys(scores).length === 0) {
        return <div className="p-8 text-center text-slate-400">No performance data available.</div>;
    }

    const data = Object.entries(scores)
        .map(([subject, score]) => {
            if (score === null || score === undefined || score === '') {
                return null;
            }

            const numeric = Number(score);
            if (!Number.isFinite(numeric)) {
                return null;
            }

            return {
                subject,
                A: Math.max(0, Math.min(100, numeric)),
                fullMark: 100,
            };
        })
        .filter((item): item is { subject: string; A: number; fullMark: number } => item !== null);

    if (data.length === 0) {
        return <div className="p-8 text-center text-slate-400">No performance data available.</div>;
    }

    return (
        <div className="w-full h-[400px] bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 text-center">Core Value Alignment</h3>

            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                    <PolarGrid stroke="#e2e8f0" strokeOpacity={0.5} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                        name="Performance"
                        dataKey="A"
                        stroke="#4f46e5"
                        strokeWidth={3}
                        fill="#6366f1"
                        fillOpacity={0.4}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#818cf8' }}
                    />
                </RadarChart>
            </ResponsiveContainer>

            <div className="absolute bottom-4 right-4 text-[10px] text-slate-300 font-mono">
                AI-ANALYZED • 2024
            </div>
        </div>
    );
};
