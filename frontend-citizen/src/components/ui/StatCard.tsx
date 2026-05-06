import React from 'react';
import { cn } from '../../lib/utils';

interface StatCardProps {
    title: string;
    value: string | number;
    trend?: string;
    trendUp?: boolean;
    icon?: React.ReactNode;
    className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, trend, trendUp, icon, className }) => {
    return (
        <div className={cn("glass-panel p-6 rounded-[var(--radius-lg)] relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300", className)}>
            {/* Decorative Gradient Blob */}
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-[var(--color-gov-amber-400)]/10 rounded-full blur-2xl group-hover:bg-[var(--color-gov-amber-400)]/20 transition-all" />

            <div className="flex justify-between items-start relative z-10">
                <div>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        {title}
                    </h3>
                    <div className="text-3xl font-bold text-[var(--color-gov-navy-900)] dark:text-white">
                        {value}
                    </div>
                </div>
                {icon && (
                    <div className="p-3 bg-[var(--color-bg-app)] rounded-lg text-[var(--color-gov-navy-700)] shadow-sm">
                        {icon}
                    </div>
                )}
            </div>

            {trend && (
                <div className="mt-4 flex items-center text-sm">
                    <span className={cn(
                        "font-medium px-2 py-0.5 rounded-full text-xs",
                        trendUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                        {trend}
                    </span>
                    <span className="text-slate-400 ml-2 text-xs">vs last month</span>
                </div>
            )}
        </div>
    );
};
