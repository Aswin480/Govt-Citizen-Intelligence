import React, { useEffect, useState } from 'react';
import { getDynamicComponents, DynamicComponent } from '../services/api';
import { motion } from 'framer-motion';
import { AlertTriangle, Info, CheckCircle, ExternalLink, ArrowRight } from 'lucide-react';

interface DynamicRendererProps {
    parentId: string;
    className?: string;
}

const DynamicRenderer: React.FC<DynamicRendererProps> = ({ parentId, className = '' }) => {
    const [components, setComponents] = useState<DynamicComponent[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchComponents = async () => {
        try {
            const data = await getDynamicComponents(parentId);
            setComponents(data);
        } catch (error) {
            console.error(`Failed to load components for ${parentId}`, error);
        } finally {
            setLoading(false);
        }
    };

    // Poll for updates every 5 seconds (Simulate real-time)
    useEffect(() => {
        fetchComponents();
        const interval = setInterval(fetchComponents, 5000);
        return () => clearInterval(interval);
    }, [parentId]);

    if (loading && components.length === 0) return null;

    return (
        <div className={`dynamic-container ${className}`} id={parentId}>
            {components.map((comp) => (
                <RenderComponent key={comp.id} component={comp} />
            ))}
        </div>
    );
};

const RenderComponent: React.FC<{ component: DynamicComponent }> = ({ component }) => {
    // Safety fallback: Ensure props and style are always objects to prevent "Cannot read properties of undefined"
    const { type, content, props = {}, style = {} } = component;

    switch (type) {
        case 'card':
            return (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl mb-4"
                    style={style}
                >
                    <div dangerouslySetInnerHTML={{ __html: content }} />
                    {props.actionLabel && (
                        <button className="mt-4 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                            {props.actionLabel} <ArrowRight size={14} />
                        </button>
                    )}
                </motion.div>
            );

        case 'button':
            return (
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-6 py-3 rounded-xl font-bold text-white shadow-lg flex items-center gap-2 ${props.variant === 'danger' ? 'bg-red-600' : 'bg-green-600'}`}
                    style={style}
                    onClick={() => props.href && window.open(props.href, '_blank')}
                >
                    {content} {props.icon === 'external' && <ExternalLink size={16} />}
                </motion.button>
            );

        case 'alert':
            return (
                <div className={`p-4 rounded-lg border-l-4 mb-4 flex items-start gap-3 ${props.variant === 'danger' ? 'bg-red-900/20 border-red-500 text-red-200' :
                    props.variant === 'success' ? 'bg-green-900/20 border-green-500 text-green-200' :
                        'bg-blue-900/20 border-blue-500 text-blue-200'
                    }`} style={style}>
                    <div className="mt-1">
                        {props.variant === 'danger' ? <AlertTriangle size={18} /> :
                            props.variant === 'success' ? <CheckCircle size={18} /> :
                                <Info size={18} />}
                    </div>
                    <div>
                        <div className="font-bold text-sm uppercase tracking-wider mb-1">
                            {props.title || 'Notice'}
                        </div>
                        <div className="text-sm opacity-90">{content}</div>
                    </div>
                </div>
            );

        case 'container':
            return (
                <div className="p-4 border border-dashed border-slate-700/50 rounded-xl my-4" style={style}>
                    <DynamicRenderer parentId={`container-${component.id}`} />
                </div>
            );

        default:
            return <div className="text-red-500 text-xs">Unknown component type: {type}</div>;
    }
};

export default DynamicRenderer;
