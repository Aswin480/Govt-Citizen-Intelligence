import { useRef, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { motion } from 'framer-motion';

// Types for our Nexus Graph
interface Node {
    id: string;
    name: string;
    type: 'Region' | 'Person' | 'Policy' | 'Budget';
    val: number; // Size
    color?: string;
}

interface Link {
    source: string;
    target: string;
    relation: string;
}

interface GraphData {
    nodes: Node[];
    links: Link[];
}

export const NexusVisualizer = () => {
    const fgRef = useRef<any>();
    const [data, setData] = useState<GraphData>({ nodes: [], links: [] });
    const [loading, setLoading] = useState(true);

    // Poll Engine 2.0 API
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/v1/graph/visualize');
                const json = await res.json();

                // Transform backend NetworkX data to React-Force-Graph format
                const nodes = json.nodes.map((n: any) => ({
                    id: n.id,
                    name: n.name || n.id,
                    type: n.type,
                    val: n.type === 'Region' ? 20 : n.type === 'Person' ? 15 : 10,
                    color: n.type === 'Region' ? '#00f2ff' : n.type === 'Person' ? '#ff0055' : '#7d41ff'
                }));

                const links = json.links.map((l: any) => ({
                    source: l.source,
                    target: l.target,
                    relation: l.relation
                }));

                setData({ nodes, links });
                setLoading(false);
            } catch (e) {
                console.error("Nexus Graph Offline", e);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="relative w-full h-[600px] bg-black/40 border border-white/10 rounded-xl overflow-hidden backdrop-blur-md">
            {/* HUD Overlay */}
            <div className="absolute top-4 right-4 z-20">
                <button
                    onClick={() => window.location.href = '/admin'}
                    className="px-4 py-2 border border-cyan-500/50 text-cyan-500 font-bold uppercase text-xs rounded hover:bg-cyan-900/40 hover:text-white transition-all shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                >
                    Return to Command Center
                </button>
            </div>
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                    NEXUS GRAPH <span className="text-xs text-white/50 ml-2">ENGINE 2.0 LIVE</span>
                </h2>
                <div className="text-xs text-cyan-500 mt-1 flex gap-2">
                    <span>● {data.nodes.length} NODES</span>
                    <span>● {data.links.length} CONNECTIONS</span>
                </div>
            </div>

            {loading && (
                <div className="absolute inset-0 flex items-center justify-center text-cyan-500 animate-pulse">
                    INITIALIZING NEURAL LINK...
                </div>
            )}

            {!loading && (
                <ForceGraph2D
                    ref={fgRef}
                    graphData={data}
                    nodeLabel="name"
                    nodeColor="color"
                    linkDirectionalArrowLength={3.5}
                    linkDirectionalArrowRelPos={1}
                    linkCurvature={0.25}
                    backgroundColor="rgba(0,0,0,0)"
                    enableNodeDrag={true}
                    onNodeClick={node => {
                        // Zoom to node
                        fgRef.current.centerAt(node.x, node.y, 1000);
                        fgRef.current.zoom(8, 2000);
                    }}
                    nodeCanvasObject={(node: any, ctx, globalScale) => {
                        const label = node.name;
                        const fontSize = 12 / globalScale;
                        ctx.font = `${fontSize}px Sans-Serif`;
                        const textWidth = ctx.measureText(label).width;
                        const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

                        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                        if (node.color) ctx.fillStyle = node.color;

                        ctx.beginPath();
                        ctx.arc(node.x, node.y, 4, 0, 2 * Math.PI, false);
                        ctx.fill();

                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = node.color || 'white';
                        if (globalScale > 1.5) {
                            ctx.fillText(label, node.x, node.y + 8);
                        }
                    }}
                />
            )}
        </div>
    );
};
