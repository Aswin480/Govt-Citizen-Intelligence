import React from 'react';
import { Party, PARTIES } from '../../services/mockParliamentData';

export interface SeatingData {
    party: string;
    seats: number;
    color?: string; // Optional direct color override
}

interface SeatingChartProps {
    data: SeatingData[];
    totalSeats: number;
}

export const SeatingChart: React.FC<SeatingChartProps> = ({ data, totalSeats }) => {
    // Calculate cumulative angles for donut slices
    let currentAngle = -180; // Start from left (semi-circle)
    const radius = 100;
    const strokeWidth = 50;

    return (
        <div className="relative w-full aspect-[2/1] max-w-lg mx-auto flex items-end justify-center overflow-hidden">
            <svg viewBox="-150 -150 300 150" className="w-full h-full transform translate-y-6">
                {/* Background Arc */}
                <path d="M -100 0 A 100 100 0 0 1 100 0" fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} className="opacity-20 dark:opacity-10" />

                {data.map((item, index) => {
                    // Start with passed color, fallback to Parliament lookup, fallback to gray
                    let color = item.color;
                    if (!color) {
                        const partyInfo = PARTIES[item.party as Party];
                        color = partyInfo ? partyInfo.color : '#94a3b8'; // slate-400 fallback
                    }

                    const share = item.seats / totalSeats;
                    const angleSpan = share * 180; // Span in degrees (semi-circle is 180)

                    // SVG Arc Logic
                    // We only render simple arcs. 
                    const startAngle = currentAngle;
                    const endAngle = currentAngle + angleSpan;

                    // Convert degrees to radians
                    const startRad = (startAngle * Math.PI) / 180;
                    const endRad = (endAngle * Math.PI) / 180;

                    // Coordinates
                    const x1 = radius * Math.cos(startRad);
                    const y1 = radius * Math.sin(startRad);
                    const x2 = radius * Math.cos(endRad);
                    const y2 = radius * Math.sin(endRad);

                    // Large arc flag
                    const largeArcFlag = angleSpan > 180 ? 1 : 0;

                    // Path Command
                    const d = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;

                    currentAngle += angleSpan;

                    return (
                        <g key={index} className="group cursor-pointer">
                            <path
                                d={d}
                                fill="none"
                                stroke={color}
                                strokeWidth={strokeWidth}
                                className="transition-all duration-300 hover:stroke-[55] hover:opacity-90"
                            />
                            <title>{`${item.party}: ${item.seats} Seats`}</title>
                        </g>
                    );
                })}
            </svg>

            {/* Center Text */}
            <div className="absolute bottom-0 text-center mb-4">
                <div className="text-4xl font-black text-slate-800 dark:text-white">{totalSeats}</div>
                <div className="text-xs text-slate-500 uppercase tracking-widest font-bold">Total Seats</div>
            </div>
        </div>
    );
};
