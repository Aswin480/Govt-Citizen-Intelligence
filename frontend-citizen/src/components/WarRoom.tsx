import React, { useEffect, useState, useMemo } from 'react';
import { AlertCircle, X, MessageSquare, Send, MapPin, Layers, ChevronRight, ChevronDown, Clock, Download, BarChart3, Zap, HardHat, Shield, Activity, Filter, Droplets, Briefcase, Flame } from 'lucide-react';
import { MapContainer, TileLayer, Marker, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { GrievanceStore, Grievance } from '../services/grievanceStore';

// Internal Error Boundary Class
class MapErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: any) {
        return { hasError: true, error };
    }

    componentDidCatch(error: any, errorInfo: any) {
        console.error("Map Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="h-full w-full bg-slate-950 flex flex-col items-center justify-center p-8 text-center border border-red-900 rounded-xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-red-900/10 animate-pulse"></div>
                    <AlertCircle className="text-red-500 mb-4 relative z-10" size={48} />
                    <h3 className="text-xl font-bold text-white mb-2 relative z-10">Tactical Map Offline</h3>
                    <p className="text-slate-400 mb-4 text-sm max-w-md relative z-10">The geospatial subsystem encountered a critical startup error.</p>
                    <button onClick={() => this.setState({ hasError: false })} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold relative z-10 transition-colors shadow-lg shadow-red-500/20">
                        Re-Initialize System
                    </button>
                    <code className="mt-8 text-[10px] text-red-900/50 font-mono max-w-xs truncate relative z-10">
                        ERR_CODE: {this.state.error?.message || "UNKNOWN_FAILURE"}
                    </code>
                </div>
            );
        }
        return this.props.children;
    }
}

// Custom Icon
const customMarkerIcon = (type: string) => new L.Icon({
    iconUrl: type === 'CRITICAL'
        ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png'
        : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Component to handle map view transitions
const MapController = ({ view }: { view: any }) => {
    const map = useMap();
    useEffect(() => {
        if (view) {
            map.flyTo([view.lat, view.lng], view.zoom, { duration: 1.5 });
        }
    }, [view, map]);
    return null;
};

// Hierarchy Type
type HierarchyLevel = 'Nation' | 'State' | 'District' | 'Taluk' | 'Panchayat' | 'Ward';
interface HierarchyNode {
    name: string;
    level: HierarchyLevel;
    count: number;
    children: Record<string, HierarchyNode>;
    lat?: number;
    lng?: number;
}

const WarRoom = () => {
    const [grievances, setGrievances] = useState<Grievance[]>([]);
    const [selectedComplaint, setSelectedComplaint] = useState<Grievance | null>(null);
    const [view, setView] = useState({ lat: 20.5937, lng: 78.9629, zoom: 4 }); // India View
    const [replyText, setReplyText] = useState("");
    const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

    // New Feature States
    const [activeFilter, setActiveFilter] = useState<string>('ALL');
    const [viewMode, setViewMode] = useState<'MARKERS' | 'DENSITY'>('MARKERS');

    // Fetch data using the Store
    const refreshData = () => {
        setGrievances(GrievanceStore.getAll());
    };

    useEffect(() => {
        refreshData();
        const interval = setInterval(refreshData, 5000);
        return () => clearInterval(interval);
    }, []);

    // Filter Logic
    const filteredGrievances = useMemo(() => {
        if (activeFilter === 'ALL') return grievances;
        return grievances.filter(g => g.category === activeFilter || (activeFilter === 'CRITICAL' && g.type === 'CRITICAL'));
    }, [grievances, activeFilter]);

    // KPI Calculations
    const stats = useMemo(() => {
        return {
            total: grievances.length,
            critical: grievances.filter(g => g.type === 'CRITICAL').length,
            resolved: grievances.filter(g => g.status === 'Resolved').length,
            pending: grievances.filter(g => g.status !== 'Resolved').length
        };
    }, [grievances]);

    // Build Hierarchy Tree dynamically from data
    const hierarchy = useMemo(() => {
        const root: HierarchyNode = { name: 'India', level: 'Nation', count: 0, children: {} };
        // Use filtered grievances for the tree so the sidebar reflects the map? 
        // Usually sidebar shows EVERYTHING, map shows filtered. Let's keep sidebar as Global Source of Truth (all grievances).
        grievances.forEach(g => {
            root.count++;
            const { state, district, taluk, panchayat, ward, lat, lng } = g.location;

            // State Level
            if (!root.children[state]) root.children[state] = { name: state, level: 'State', count: 0, children: {}, lat, lng };
            root.children[state].count++;

            // District Level
            const stateNode = root.children[state];
            if (!stateNode.children[district]) stateNode.children[district] = { name: district, level: 'District', count: 0, children: {}, lat, lng };
            stateNode.children[district].count++;

            // Taluk Level
            const distNode = stateNode.children[district];
            if (!distNode.children[taluk]) distNode.children[taluk] = { name: taluk, level: 'Taluk', count: 0, children: {}, lat, lng };
            distNode.children[taluk].count++;

            // Panchayat Level
            const talukNode = distNode.children[taluk];
            if (!talukNode.children[panchayat]) talukNode.children[panchayat] = { name: panchayat, level: 'Panchayat', count: 0, children: {}, lat, lng };
            talukNode.children[panchayat].count++;

            // Ward Level
            const panchayatNode = talukNode.children[panchayat];
            if (!panchayatNode.children[ward]) panchayatNode.children[ward] = { name: ward, level: 'Ward', count: 0, children: {}, lat, lng };
            panchayatNode.children[ward].count++;
        });

        return root;
    }, [grievances]);

    const handleNodeClick = (node: HierarchyNode) => {
        setExpandedNodes(prev => ({ ...prev, [node.name]: !prev[node.name] }));
        if (node.lat && node.lng) {
            let zoom = 4;
            if (node.level === 'State') zoom = 7;
            if (node.level === 'District') zoom = 9;
            if (node.level === 'Taluk') zoom = 11;
            if (node.level === 'Panchayat') zoom = 13;
            if (node.level === 'Ward') zoom = 15;
            setView({ lat: node.lat, lng: node.lng, zoom });
        }
    };

    const handleReply = () => {
        if (!selectedComplaint || !replyText) return;
        GrievanceStore.addReply(selectedComplaint.id, replyText, 'Admin');
        refreshData();
        setReplyText("");
        const updated = GrievanceStore.getAll().find(g => g.id === selectedComplaint.id);
        if (updated) setSelectedComplaint(updated);
    };

    const handleStatusUpdate = (status: 'Open' | 'In Progress' | 'Resolved') => {
        if (!selectedComplaint) return;
        GrievanceStore.updateStatus(selectedComplaint.id, status);
        refreshData();
        const updated = GrievanceStore.getAll().find(g => g.id === selectedComplaint.id);
        if (updated) setSelectedComplaint(updated);
    }

    const handleAssign = (dept: string) => {
        if (!selectedComplaint) return;
        GrievanceStore.assignDept(selectedComplaint.id, dept);
        refreshData();
        const updated = GrievanceStore.getAll().find(g => g.id === selectedComplaint.id);
        if (updated) setSelectedComplaint(updated);
    }

    // Recursive Tree Renderer
    const renderTree = (node: HierarchyNode, depth = 0) => {
        const isExpanded = expandedNodes[node.name];
        const hasChildren = Object.keys(node.children).length > 0;
        const paddingLeft = `${depth * 12}px`;

        return (
            <div key={node.name}>
                <div
                    className={`flex items-center justify-between p-2 hover:bg-slate-800/50 cursor-pointer border-b border-white/5 transition-colors ${selectedComplaint?.location.state === node.name ? 'bg-indigo-900/20' : ''}`}
                    style={{ paddingLeft: depth === 0 ? '12px' : paddingLeft }}
                    onClick={() => handleNodeClick(node)}
                >
                    <div className="flex items-center gap-2 overflow-hidden">
                        {hasChildren && (
                            isExpanded ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />
                        )}
                        {!hasChildren && <div className="w-3.5" />} {/* Spacer */}

                        <span className={`text-xs font-medium truncate ${node.level === 'Nation' ? 'text-green-400 font-bold uppercase' : 'text-slate-300'}`}>
                            {node.name}
                        </span>
                    </div>
                    <span className="text-[10px] font-bold bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                        {node.count}
                    </span>
                </div>
                {isExpanded && hasChildren && (
                    <div className="animate-in slide-in-from-top-1 duration-200">
                        {Object.values(node.children).map(child => renderTree(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-[750px] w-full bg-slate-950 border border-green-900/30 rounded-xl relative overflow-hidden flex shadow-2xl font-sans">

            {/* LEFT SIDEBAR - HIERARCHY TREE */}
            <div className="w-80 bg-slate-900/50 backdrop-blur-md border-r border-green-900/30 flex flex-col z-20 transition-all">
                <div className="p-4 border-b border-green-900/30 flex justify-between items-center bg-slate-900/80">
                    <div className="font-bold text-xs text-green-500 uppercase flex items-center gap-2">
                        <Layers size={14} /> National Grid
                    </div>
                    <div className="text-[10px] text-slate-500">Live Feed</div>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    {renderTree(hierarchy)}
                </div>

                <div className="p-3 border-t border-green-900/30 bg-slate-900/80 text-[10px] text-slate-500 space-y-2">
                    <button
                        onClick={() => {
                            // GENERATE CSV logic (omitted for brevity repitition, assumed same logic or imported)
                            const headers = ["ID", "User", "Type", "Status", "District", "Ward", "Description", "Time"];
                            const rows = grievances.map(g => [
                                g.id, g.userName, g.type, g.status, g.location.district, g.location.ward, `"${g.description.replace(/"/g, '""')}"`, new Date(g.timestamp).toLocaleString()
                            ]);
                            const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
                            const link = document.createElement("a");
                            link.setAttribute("href", encodeURI(csvContent));
                            link.setAttribute("download", `WAR_ROOM_REPORT_${new Date().toISOString().slice(0, 10)}.csv`);
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 rounded border border-slate-600 transition-colors font-bold"
                    >
                        <Download size={12} /> Export Daily Report
                    </button>
                </div>
            </div>

            {/* MAIN MAP AREA */}
            <div className="flex-1 relative bg-slate-950">
                <MapErrorBoundary>
                    <MapContainer
                        key={`${view.zoom}-${view.lat}`}
                        center={[view.lat, view.lng]}
                        zoom={view.zoom}
                        style={{ height: '100%', width: '100%', background: '#020617' }}
                        zoomControl={false}
                        attributionControl={false}
                    >
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; CartoDB' />
                        <MapController view={view} />

                        {filteredGrievances.map((c) => (
                            viewMode === 'DENSITY' ? (
                                <CircleMarker
                                    key={c.id}
                                    center={[c.location.lat, c.location.lng]}
                                    radius={20}
                                    pathOptions={{
                                        color: 'transparent',
                                        fillColor: c.type === 'CRITICAL' ? '#ef4444' : '#3b82f6',
                                        fillOpacity: 0.6
                                    }}
                                    eventHandlers={{ click: () => { setSelectedComplaint(c); setView({ lat: c.location.lat, lng: c.location.lng, zoom: 16 }); } }}
                                />
                            ) : (
                                <Marker
                                    key={c.id}
                                    position={[c.location.lat, c.location.lng]}
                                    icon={customMarkerIcon(c.type)}
                                    eventHandlers={{ click: () => { setSelectedComplaint(c); setView({ lat: c.location.lat, lng: c.location.lng, zoom: 16 }); } }}
                                />
                            )
                        ))}
                    </MapContainer>
                </MapErrorBoundary>

                {/* KPI HUD (Heads-Up Display) */}
                <div className="absolute top-4 left-4 z-[900] flex gap-3 pointer-events-none">
                    <div className="bg-slate-900/90 backdrop-blur border border-green-500/30 p-2 px-4 rounded-lg shadow-lg flex flex-col items-center">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Total</span>
                        <span className="text-xl font-bold text-white leading-none">{stats.total}</span>
                    </div>
                    <div className="bg-slate-900/90 backdrop-blur border border-red-500/30 p-2 px-4 rounded-lg shadow-lg flex flex-col items-center">
                        <span className="text-[10px] text-red-400 font-bold uppercase flex items-center gap-1"><Flame size={10} /> Critical</span>
                        <span className="text-xl font-bold text-red-500 leading-none">{stats.critical}</span>
                    </div>
                    <div className="bg-slate-900/90 backdrop-blur border border-blue-500/30 p-2 px-4 rounded-lg shadow-lg flex flex-col items-center">
                        <span className="text-[10px] text-blue-400 font-bold uppercase flex items-center gap-1"><Activity size={10} /> Active</span>
                        <span className="text-xl font-bold text-blue-500 leading-none">{stats.pending}</span>
                    </div>
                </div>

                {/* FILTER & VIEW BAR */}
                <div className="absolute top-4 right-4 z-[900] flex flex-col gap-2 items-end">
                    <div className="bg-slate-900/90 backdrop-blur border border-slate-700 p-1 rounded-lg flex gap-1 shadow-xl">
                        {[
                            { id: 'ALL', label: 'All', icon: <Layers size={14} /> },
                            { id: 'CRITICAL', label: 'Critical', icon: <Flame size={14} className="text-red-500" /> },
                            { id: 'Infrastructure', label: 'Roads', icon: <HardHat size={14} /> },
                            { id: 'Water', label: 'Water', icon: <Droplets size={14} /> },
                            { id: 'Electricity', label: 'Power', icon: <Zap size={14} /> },
                            { id: 'Sanitation', label: 'Waste', icon: <Filter size={14} /> }
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setActiveFilter(f.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors border ${activeFilter === f.id ? 'bg-indigo-600 border-indigo-500 text-white' : 'hover:bg-slate-800 border-transparent text-slate-400'}`}
                            >
                                {f.icon} {f.label}
                            </button>
                        ))}
                    </div>

                    <div className="bg-slate-900/90 backdrop-blur border border-slate-700 p-1 rounded-lg flex gap-1 shadow-xl">
                        <button onClick={() => setViewMode('MARKERS')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${viewMode === 'MARKERS' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>
                            <MapPin size={14} /> Markers
                        </button>
                        <button onClick={() => setViewMode('DENSITY')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${viewMode === 'DENSITY' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>
                            <Activity size={14} /> Heat Density
                        </button>
                    </div>
                </div>

                {/* COMPLAINT DETAILS OVERLAY */}
                {selectedComplaint && (
                    <div className="absolute top-16 right-4 bottom-4 w-96 bg-slate-950/95 backdrop-blur-xl border border-green-500/30 rounded-xl shadow-2xl p-0 z-[1000] flex flex-col animate-in slide-in-from-right duration-300">
                        {/* Header */}
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 rounded-t-xl">
                            <div>
                                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                                    <AlertCircle size={16} className={selectedComplaint.type === 'CRITICAL' ? 'text-red-500 animate-pulse' : 'text-blue-500'} />
                                    {selectedComplaint.id}
                                </h3>
                                <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                                    <Clock size={10} /> {new Date(selectedComplaint.timestamp).toLocaleString()}
                                </p>
                            </div>
                            <button onClick={() => setSelectedComplaint(null)} className="text-slate-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/50 border border-transparent p-1.5 rounded-full transition-all">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-700">
                            {/* Evidence Image */}
                            {selectedComplaint.evidenceUrl && (
                                <div className="rounded-lg overflow-hidden border border-slate-700 relative group shadow-lg">
                                    <img src={selectedComplaint.evidenceUrl} alt="Evidence" className="w-full h-40 object-cover" />
                                </div>
                            )}

                            {/* Location Chain */}
                            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                                <div className="flex flex-wrap gap-2">
                                    {[selectedComplaint.location.district, selectedComplaint.location.ward].map((loc, i) => (
                                        <span key={i} className="px-2 py-1 bg-slate-800 text-[10px] text-indigo-300 rounded border border-slate-700 shadow-sm">{loc}</span>
                                    ))}
                                </div>
                            </div>

                            {/* Department Assignment */}
                            <div className="p-3 bg-slate-800/30 border border-slate-700 rounded-lg">
                                <label className="text-[10px] uppercase text-slate-500 font-bold mb-2 flex items-center gap-1"><Briefcase size={10} /> Assign Department</label>
                                <select
                                    className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-xs text-white outline-none focus:border-indigo-500"
                                    value={selectedComplaint.assignedTo || 'Unassigned'}
                                    onChange={(e) => handleAssign(e.target.value)}
                                >
                                    <option value="Unassigned">-- Select Department --</option>
                                    <option value="PWD">Public Works Dept (PWD)</option>
                                    <option value="Sanitation">Sanitation & Health</option>
                                    <option value="Water">Water Board (Jal Board)</option>
                                    <option value="Police">Traffic Police</option>
                                    <option value="Electricity">Electricity Board</option>
                                </select>
                            </div>

                            {/* Description */}
                            <div className="bg-slate-800/80 p-3 rounded-lg border-l-2 border-indigo-500">
                                <p className="text-xs text-slate-300 italic leading-relaxed">"{selectedComplaint.description}"</p>
                            </div>

                            {/* Chat History */}
                            {selectedComplaint.replies.length > 0 && (
                                <div className="space-y-3 pt-2">
                                    <div className="h-px bg-slate-800 w-full" />
                                    <h4 className="text-[10px] uppercase text-slate-500 font-bold">Timeline</h4>
                                    {selectedComplaint.replies.map((reply, idx) => (
                                        <div key={idx} className={`flex ${reply.sender === 'Admin' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] p-2 rounded-lg text-xs ${reply.sender === 'Admin' ? 'bg-indigo-900/50 text-indigo-100' : 'bg-slate-800 text-slate-300'}`}>
                                                {reply.message}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Status Actions */}
                        <div className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
                            <button onClick={() => handleStatusUpdate('In Progress')} className="flex-1 py-1.5 text-[10px] font-bold rounded bg-yellow-900/20 text-yellow-500 border border-yellow-800 hover:bg-yellow-900/40">In Progress</button>
                            <button onClick={() => handleStatusUpdate('Resolved')} className="flex-1 py-1.5 text-[10px] font-bold rounded bg-green-900/20 text-green-500 border border-green-800 hover:bg-green-900/40">Resolve</button>
                        </div>

                        {/* Reply Box */}
                        <div className="p-4 bg-slate-900/80 border-t border-slate-800 rounded-b-xl relative">
                            <textarea
                                className="w-full bg-black/40 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-green-500 outline-none resize-none h-16"
                                placeholder="Write official response..."
                                value={replyText}
                                onChange={e => setReplyText(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                            />
                            <button onClick={handleReply} className="absolute bottom-6 right-6 text-green-500 hover:text-white"><Send size={14} /></button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WarRoom;
