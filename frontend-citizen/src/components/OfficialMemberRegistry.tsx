import React, { useState, useMemo } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    flexRender,
    ColumnDef,
} from '@tanstack/react-table';
import { Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, User, Award, Activity } from 'lucide-react';

interface Member {
    id: string;
    name: string;
    party: string;
    constituency?: string;
    profile_image?: string;
    house: string;
}

interface OfficialMemberRegistryProps {
    mlas: Member[];
    lsMembers: Member[];
    rsMembers: Member[];
    onMemberClick: (member: Member) => void;
    stateName: string;
}

export const OfficialMemberRegistry: React.FC<OfficialMemberRegistryProps> = ({
    mlas,
    lsMembers,
    rsMembers,
    onMemberClick,
    stateName
}) => {
    const [activeTab, setActiveTab] = useState<'mla' | 'ls' | 'rs'>('mla');
    const [globalFilter, setGlobalFilter] = useState('');

    const data = useMemo(() => {
        if (activeTab === 'mla') return mlas.map(m => ({ ...m, house: 'state_assembly' }));
        if (activeTab === 'ls') return lsMembers.map(m => ({ ...m, house: 'lok_sabha' }));
        return rsMembers.map(m => ({ ...m, house: 'rajya_sabha' }));
    }, [activeTab, mlas, lsMembers, rsMembers]);

    const columns = useMemo<ColumnDef<Member>[]>(
        () => [
            {
                accessorKey: 'name',
                header: 'Representative Details',
                cell: info => (
                    <div className="flex items-center gap-4">
                        <img
                            src={info.row.original.profile_image || `https://ui-avatars.com/api/?name=${info.getValue()}&background=random`}
                            alt={info.getValue() as string}
                            className="w-12 h-12 rounded-full border border-slate-200 object-cover shadow-sm bg-slate-100"
                        />
                        <div>
                            <div className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                {info.getValue() as string}
                            </div>
                            <div className="text-xs text-slate-500 font-medium">Official Representative</div>
                        </div>
                    </div>
                ),
            },
            {
                accessorKey: 'party',
                header: 'Political Party',
                cell: info => {
                    const party = info.getValue() as string;
                    let color = 'bg-slate-100 text-slate-700';
                    if (party === 'BJP' || party === 'NDA') color = 'bg-orange-100 text-orange-800 border-orange-200';
                    else if (party === 'INC' || party === 'INDIA') color = 'bg-blue-100 text-blue-800 border-blue-200';
                    else if (party === 'AAP') color = 'bg-blue-50 text-blue-700 border-blue-200';
                    else if (party === 'AITC') color = 'bg-green-100 text-green-800 border-green-200';

                    return (
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${color}`}>
                            {party}
                        </span>
                    );
                },
            },
            {
                accessorKey: 'constituency',
                header: 'Constituency',
                cell: info => (
                    <div className="font-bold text-slate-600 dark:text-slate-300">
                        {info.getValue() as string || 'State Legislature'}
                    </div>
                ),
            },
            {
                id: 'performance',
                header: 'Status',
                cell: () => (
                    <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-500" />
                        <span className="text-emerald-600 font-bold text-sm">Active Term</span>
                    </div>
                )
            }
        ],
        []
    );

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        state: {
            globalFilter,
        },
        onGlobalFilterChange: setGlobalFilter,
        initialState: {
            pagination: { pageSize: 10 }
        }
    });

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            {/* Header & Tabs */}
            <div className="p-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white break-words">
                            Official Legislative Registry
                        </h2>
                        <p className="text-slate-500 font-medium mt-1">
                            Verified list of all elected representatives for {stateName}
                        </p>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, party, or constituency..."
                            value={globalFilter ?? ''}
                            onChange={e => setGlobalFilter(e.target.value)}
                            className="w-full md:w-80 pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                        />
                    </div>
                </div>

                <div className="flex gap-2 p-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl w-fit">
                    <button
                        onClick={() => setActiveTab('mla')}
                        className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'mla' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Legislative Assembly (MLAs) <span className="ml-2 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-xs">{mlas.length}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('ls')}
                        className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'ls' ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Lok Sabha (MPs) <span className="ml-2 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-xs">{lsMembers.length}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('rs')}
                        className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'rs' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Rajya Sabha (MPs) <span className="ml-2 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-xs">{rsMembers.length}</span>
                    </button>
                </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id} className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                                {headerGroup.headers.map(header => (
                                    <th key={header.id} className="p-4 px-8 text-xs font-black uppercase tracking-widest text-slate-400">
                                        <div
                                            className={`flex items-center gap-2 ${header.column.getCanSort() ? 'cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-300' : ''}`}
                                            onClick={header.column.getToggleSortingHandler()}
                                        >
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            {{
                                                asc: <ChevronUp className="w-4 h-4" />,
                                                desc: <ChevronDown className="w-4 h-4" />,
                                            }[header.column.getIsSorted() as string] ?? null}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.map(row => (
                            <tr
                                key={row.id}
                                onClick={() => onMemberClick(row.original)}
                                className="group border-b border-slate-100 dark:border-slate-800/50 hover:bg-blue-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                            >
                                {row.getVisibleCells().map(cell => (
                                    <td key={cell.id} className="p-4 px-8 py-5">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        {table.getRowModel().rows.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-12 text-center text-slate-500 font-medium">
                                    No representatives found matching your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="p-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                <span className="text-sm font-medium text-slate-500">
                    Showing <span className="font-bold text-slate-900 dark:text-white">{table.getRowModel().rows.length}</span> of <span className="font-bold text-slate-900 dark:text-white">{data.length}</span> members
                </span>
                <div className="flex gap-2">
                    <button
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};
