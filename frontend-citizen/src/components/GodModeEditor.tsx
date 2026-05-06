import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Palette, Type, MousePointer, Save, RotateCcw, Undo, Redo, AlertCircle, Copy, Clipboard, Download, Sparkles, History, Activity, CreditCard, AlertTriangle, CreditCard as CardIcon } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import { useAuth } from '../context/AuthContext';
import { saveElementStyle, getChangeHistory, getAnalyticsSummary, createDynamicComponent } from '../services/api';

interface StyleSnapshot {
    cssText: string;
    timestamp: number;
}

interface StylePreset {
    name: string;
    styles: string;
}

export const GodModeEditor: React.FC = () => {
    const { isAuthenticated, role, user } = useAuth();
    const { config, updateConfig, isVisualMode, toggleVisualMode } = useConfig();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'theme' | 'content' | 'element' | 'layout' | 'advanced' | 'history' | 'insert'>('theme');
    const [changeHistory, setChangeHistory] = useState<any[]>([]);
    const [analytics, setAnalytics] = useState<any>(null);
    const [historyFilters, setHistoryFilters] = useState({
        action: 'all',
        days: 'all'
    });

    // Check admin status early (needed by useEffect below)
    const isAdmin = isAuthenticated && (role === 'admin' || user?.role === 'admin' || user?.username === 'admin');
    const isShowingInAdmin = location.pathname.startsWith('/admin');

    // Load change history and analytics when History tab is opened
    useEffect(() => {
        if (activeTab === 'history' && isAdmin) {
            const loadHistoryData = async () => {
                try {
                    // Load history with filters
                    const filters: any = {};
                    if (historyFilters.action !== 'all') filters.action = historyFilters.action;
                    if (historyFilters.days !== 'all') filters.days = parseInt(historyFilters.days);

                    const history = await getChangeHistory(50, filters);
                    setChangeHistory(history);

                    // Load analytics summary
                    const analyticsData = await getAnalyticsSummary(
                        historyFilters.days !== 'all' ? parseInt(historyFilters.days) : undefined
                    );
                    setAnalytics(analyticsData);
                } catch (error) {
                    console.error('Failed to load history data:', error);
                }
            };
            loadHistoryData();
        }
    }, [activeTab, isAdmin, historyFilters]);

    // Listen for external open triggers
    useEffect(() => {
        const handleOpen = () => {
            setIsOpen(true);
            setActiveTab('insert'); // Switch to Insert tab automatically
            console.log("Visual Builder opened via external trigger");
        };
        window.addEventListener('open-visual-builder', handleOpen);
        return () => window.removeEventListener('open-visual-builder', handleOpen);
    }, []);

    // Visual Editing State
    const [selectedDomElement, setSelectedDomElement] = useState<HTMLElement | null>(null);
    const [elementStyles, setElementStyles] = useState({
        backgroundColor: '',
        color: '',
        fontSize: '',
        padding: '',
        borderRadius: '',
        margin: '',
        display: '',
        position: '',
        flexDirection: '',
        justifyContent: '',
        alignItems: '',
        boxShadow: '',
        transform: '',
        opacity: '',
        border: '',
        fontWeight: '',
        lineHeight: '',
        textAlign: '',
        zIndex: ''
    });

    // Undo/Redo History
    const [history, setHistory] = useState<StyleSnapshot[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [hasChanges, setHasChanges] = useState(false);
    const originalStyles = useRef<string>('');
    const [copiedStyles, setCopiedStyles] = useState<string>('');

    // Copy/Paste & Presets
    const [presets] = useState<StylePreset[]>([
        { name: 'Card', styles: 'background-color: rgb(30, 41, 59); border-radius: 16px; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);' },
        { name: 'Button', styles: 'background: linear-gradient(to right, #10b981, #059669); color: white; padding: 12px 24px; border-radius: 8px; font-weight: 700;' },
        { name: 'Badge', styles: 'background-color: #fbbf24; color: black; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700;' }
    ]);

    // Generate unique CSS selector for element
    const generateSelector = (element: HTMLElement): string => {
        // Priority 1: Use ID if available
        if (element.id) {
            return `#${element.id}`;
        }

        // Priority 2: Use data-component-id (Robust Custom Attribute)
        if (element.getAttribute('data-component')) {
            return `[data-component="${element.getAttribute('data-component')}"]`;
        }

        // Priority 3: Full CSS Path (Most Robust Fallback)
        const path: string[] = [];
        let current: HTMLElement | null = element;

        while (current && current.tagName !== 'BODY' && current.parentElement) {
            const parentElement = current.parentElement as HTMLElement;
            const children = Array.from(parentElement.children) as HTMLElement[];
            const index = children.indexOf(current) + 1;

            let selector = current.tagName.toLowerCase();

            // Optimization: If this specific element has a unique class among siblings, use it
            if (current.className && typeof current.className === 'string' && current.className.trim()) {
                const classes = current.className.trim().split(/\s+/).filter(c => !c.includes(':') && !c.includes('/'));
                if (classes.length > 0) {
                    // Check if this class combo is unique among siblings
                    const siblingsWithSameClass = children.filter(c => {
                        return c !== current && c.className === current!.className;
                    });
                    if (siblingsWithSameClass.length === 0) {
                        selector += `.${classes[0]}`; // Use first class if unique
                    } else {
                        selector += `:nth-child(${index})`;
                    }
                } else {
                    selector += `:nth-child(${index})`;
                }
            } else {
                selector += `:nth-child(${index})`;
            }

            path.unshift(selector);
            current = parentElement;
        }

        return 'body > ' + path.join(' > ');
    };

    // Save snapshot to history
    const saveToHistory = (element: HTMLElement) => {
        const snapshot: StyleSnapshot = {
            cssText: element.style.cssText,
            timestamp: Date.now()
        };

        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(snapshot);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setHasChanges(true);
    };

    const handleUndo = () => {
        if (historyIndex > 0 && selectedDomElement) {
            const prevSnapshot = history[historyIndex - 1];
            selectedDomElement.style.cssText = prevSnapshot.cssText;
            setHistoryIndex(historyIndex - 1);
            updateElementStyles();
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1 && selectedDomElement) {
            const nextSnapshot = history[historyIndex + 1];
            selectedDomElement.style.cssText = nextSnapshot.cssText;
            setHistoryIndex(historyIndex + 1);
            updateElementStyles();
        }
    };

    const handleSave = async () => {
        console.log("💾 Save Button Clicked!"); // Debug Log
        if (selectedDomElement) {
            try {
                const selector = generateSelector(selectedDomElement);

                // Sanitize CSS to remove artifacts like the picker cursor or outline
                let cssText = selectedDomElement.style.cssText;
                cssText = cssText.replace(/cursor:\s*crosshair;?/gi, '').replace(/outline:[^;]+;?/gi, '').trim();

                console.log(`Sending to API: ${selector} -> ${cssText}`);

                // Save to database
                await saveElementStyle(selector, cssText);

                originalStyles.current = cssText;
                setHasChanges(false);

                // FORCE FEEDBACK
                alert(`Saved! Refresh the user page to see changes on: ${selector}`);
                showNotification(`✓ Saved! All users will see this change.`, 'success');

                console.log(`💾 Saved style for selector: ${selector}`);
            } catch (error) {
                console.error('Failed to save element style:', error);
                const errMsg = (error as any)?.response?.data?.detail || (error as any)?.message || JSON.stringify(error);
                alert(`Save Failed! Error: ${errMsg}`);
                showNotification('❌ Failed to save changes', 'error');
            }
        } else {
            alert("No element selected to save!");
        }
    };

    const handleCancel = () => {
        if (selectedDomElement && hasChanges) {
            if (confirm('Discard all changes? This cannot be undone.')) {
                selectedDomElement.style.cssText = originalStyles.current;
                setHistory([]);
                setHistoryIndex(-1);
                setHasChanges(false);
                updateElementStyles();
            }
        }
    };

    // Copy/Paste Functions
    const handleCopyStyles = () => {
        if (selectedDomElement) {
            setCopiedStyles(selectedDomElement.style.cssText);
            showNotification('📋 Styles Copied!', 'info');
        }
    };

    const handlePasteStyles = () => {
        if (selectedDomElement && copiedStyles) {
            selectedDomElement.style.cssText = copiedStyles;
            saveToHistory(selectedDomElement);
            updateElementStyles();
            showNotification('✓ Styles Pasted!', 'success');
        }
    };

    const handleApplyPreset = (preset: StylePreset) => {
        if (selectedDomElement) {
            selectedDomElement.style.cssText = preset.styles;
            saveToHistory(selectedDomElement);
            updateElementStyles();
            showNotification(`✓ Applied "${preset.name}" preset!`, 'success');
        }
    };

    const handleExportCSS = () => {
        if (selectedDomElement) {
            const css = selectedDomElement.style.cssText;
            navigator.clipboard.writeText(css);
            showNotification('📄 CSS Exported to Clipboard!', 'success');
        }
    };

    const showNotification = (message: string, type: 'success' | 'info' | 'error') => {
        const colors = {
            success: 'bg-green-500',
            info: 'bg-blue-500',
            error: 'bg-red-500'
        };
        const notification = document.createElement('div');
        notification.className = `fixed top-24 right-6 ${colors[type]} text-white px-6 py-3 rounded-xl font-bold shadow-2xl animate-fade-in z-[10000]`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
    };

    const updateElementStyles = () => {
        if (selectedDomElement) {
            const computed = window.getComputedStyle(selectedDomElement);
            setElementStyles({
                backgroundColor: selectedDomElement.style.backgroundColor || computed.backgroundColor,
                color: selectedDomElement.style.color || computed.color,
                fontSize: selectedDomElement.style.fontSize || computed.fontSize,
                padding: selectedDomElement.style.padding || computed.padding,
                borderRadius: selectedDomElement.style.borderRadius || computed.borderRadius,
                margin: selectedDomElement.style.margin || computed.margin,
                display: selectedDomElement.style.display || computed.display,
                position: selectedDomElement.style.position || computed.position,
                flexDirection: selectedDomElement.style.flexDirection || computed.flexDirection,
                justifyContent: selectedDomElement.style.justifyContent || computed.justifyContent,
                alignItems: selectedDomElement.style.alignItems || computed.alignItems,
                boxShadow: selectedDomElement.style.boxShadow || computed.boxShadow,
                transform: selectedDomElement.style.transform || computed.transform,
                opacity: selectedDomElement.style.opacity || computed.opacity,
                border: selectedDomElement.style.border || computed.border,
                fontWeight: selectedDomElement.style.fontWeight || computed.fontWeight,
                lineHeight: selectedDomElement.style.lineHeight || computed.lineHeight,
                textAlign: selectedDomElement.style.textAlign || computed.textAlign,
                zIndex: selectedDomElement.style.zIndex || computed.zIndex
            });
        }
    };

    const handleInsertComponent = async (type: string, props: any = {}) => {
        try {
            const data = {
                type,
                content: props.defaultContent || 'New Component',
                props,
                style: {},
                parent_id: 'layout-top', // Default insertion point
                order: Date.now()
            };
            await createDynamicComponent(data);
            showNotification(`✓ Added new ${type}!`, 'success');
        } catch (error) {
            console.error(error);
            showNotification('❌ Failed to add component', 'error');
        }
    };

    useEffect(() => {
        if (selectedDomElement) {
            originalStyles.current = selectedDomElement.style.cssText;
            setHistory([{ cssText: selectedDomElement.style.cssText, timestamp: Date.now() }]);
            setHistoryIndex(0);
            setHasChanges(false);
            updateElementStyles();
        }
    }, [selectedDomElement]);

    // Helper to convert RGB/RGBA to Hex
    const rgbToHex = (rgb: string) => {
        if (!rgb) return '#000000';
        if (rgb.startsWith('#')) return rgb;

        const rgbValues = rgb.match(/\d+/g);
        if (!rgbValues || rgbValues.length < 3) return '#000000';

        const r = parseInt(rgbValues[0]).toString(16).padStart(2, '0');
        const g = parseInt(rgbValues[1]).toString(16).padStart(2, '0');
        const b = parseInt(rgbValues[2]).toString(16).padStart(2, '0');

        return `#${r}${g}${b}`;
    };

    useEffect(() => {
        if (!isVisualMode) return;

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest('.god-mode-panel') || target.closest('.god-mode-ignore') || target.tagName === 'HTML' || target.tagName === 'BODY') return;

            target.style.outline = "3px dashed #f59e0b";
            target.style.outlineOffset = "2px";
            target.style.cursor = "crosshair";
        };

        const handleMouseOut = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            target.style.outline = "";
            target.style.outlineOffset = "";
            target.style.cursor = "";
        };

        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest('.god-mode-panel') || target.closest('.god-mode-ignore')) return;

            e.preventDefault();
            e.stopPropagation();

            // Clear highlight immediately before selecting
            target.style.outline = "";
            target.style.outlineOffset = "";
            target.style.cursor = "";

            setSelectedDomElement(target);
            setIsOpen(true);
            setActiveTab('element');
            toggleVisualMode();
        };

        document.addEventListener('mouseover', handleMouseOver, true);
        document.addEventListener('mouseout', handleMouseOut, true);
        document.addEventListener('click', handleClick, true);

        return () => {
            document.removeEventListener('mouseover', handleMouseOver, true);
            document.removeEventListener('mouseout', handleMouseOut, true);
            document.removeEventListener('click', handleClick, true);

            document.querySelectorAll('*').forEach((el: any) => {
                el.style.outline = '';
                el.style.outlineOffset = '';
                el.style.cursor = ''; // Clean up cursor
            });
        };
    }, [isVisualMode]);

    const applyStyle = (property: string, value: string) => {
        if (selectedDomElement) {
            (selectedDomElement.style as any)[property] = value;
            setElementStyles(prev => ({ ...prev, [property]: value }));
            saveToHistory(selectedDomElement);
        }
    };

    if (!isAdmin || !isShowingInAdmin) return null;

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-[9999] bg-gradient-to-br from-green-600 to-emerald-600 text-white border-2 border-green-400 p-4 rounded-full shadow-2xl shadow-green-500/50 hover:scale-110 hover:shadow-green-400/70 transition-all duration-300 group god-mode-panel"
                title="Open Visual Builder"
            >
                <Sparkles size={28} className="group-hover:rotate-180 transition-transform duration-700" />
            </button>
        );
    }

    return (
        <div className="fixed top-20 right-6 z-[9999] w-[440px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 backdrop-blur-2xl border-2 border-green-500/50 rounded-3xl shadow-2xl shadow-green-500/20 animate-fade-in font-sans text-sm max-h-[90vh] overflow-hidden flex flex-col god-mode-panel">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b-2 border-green-900/50 bg-gradient-to-r from-green-950/60 to-emerald-950/60">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-2 rounded-xl shadow-lg">
                        <Sparkles size={20} className="text-white" />
                    </div>
                    <div>
                        <div className="text-green-400 font-black uppercase tracking-wider text-sm">Visual Builder</div>
                        <div className="text-green-600 text-[10px] font-bold">Standard Edition</div>
                    </div>
                </div>
                <button
                    onClick={() => {
                        if (hasChanges && !confirm('You have unsaved changes. Close anyway?')) return;
                        setIsOpen(false);
                    }}
                    className="text-green-500 hover:text-white hover:rotate-90 hover:bg-red-500/20 p-2 rounded-lg transition-all"
                >
                    <X size={20} />
                </button>
            </div>

            {hasChanges && (
                <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 border-b border-amber-500/30 px-5 py-2 flex items-center gap-2 animate-pulse">
                    <AlertCircle size={14} className="text-amber-400" />
                    <span className="text-amber-400 text-xs font-bold">Unsaved Changes</span>
                </div>
            )}

            {/* Quick Actions */}
            <div className="p-4 border-b border-green-900/30 bg-slate-900/50 space-y-3">
                <button
                    onClick={toggleVisualMode}
                    className={`w-full flex items-center justify-center gap-3 p-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg ${isVisualMode ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-amber-500/50 animate-pulse' : 'bg-gradient-to-r from-green-900/70 to-emerald-900/70 text-green-300 hover:from-green-800 hover:to-emerald-800 border-2 border-green-700/50'}`}
                >
                    <MousePointer size={16} />
                    {isVisualMode ? '🎯 PICKING ACTIVE' : '🖱️ START PICKER'}
                </button>

                {selectedDomElement && (
                    <>
                        <div className="flex gap-2">
                            <button onClick={handleUndo} disabled={historyIndex <= 0} className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:opacity-30 text-slate-300 py-2 rounded-lg text-xs font-bold transition-all">
                                <Undo size={14} /> Undo
                            </button>
                            <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:opacity-30 text-slate-300 py-2 rounded-lg text-xs font-bold transition-all">
                                <Redo size={14} /> Redo
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleCopyStyles} className="flex-1 flex items-center justify-center gap-2 bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 py-2 rounded-lg text-xs font-bold transition-all border border-blue-700/30">
                                <Copy size={14} /> Copy
                            </button>
                            <button onClick={handlePasteStyles} disabled={!copiedStyles} className="flex-1 flex items-center justify-center gap-2 bg-purple-900/30 hover:bg-purple-900/50 disabled:bg-slate-900 disabled:opacity-30 text-purple-400 disabled:text-slate-600 py-2 rounded-lg text-xs font-bold transition-all border border-purple-700/30">
                                <Clipboard size={14} /> Paste
                            </button>
                            <button onClick={handleExportCSS} className="flex-1 flex items-center justify-center gap-2 bg-cyan-900/30 hover:bg-cyan-900/50 text-cyan-400 py-2 rounded-lg text-xs font-bold transition-all border border-cyan-700/30">
                                <Download size={14} /> CSS
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b-2 border-green-900/50 bg-slate-900/30 overflow-x-auto">
                {[
                    { id: 'theme', icon: '🎨', label: 'Theme' },
                    { id: 'insert', icon: '➕', label: 'Insert', color: 'green' }, // NEW
                    { id: 'content', icon: '📝', label: 'Content' },
                    { id: 'element', icon: '✨', label: 'Style', color: 'amber' },
                    { id: 'layout', icon: '📐', label: 'Layout', color: 'amber' },
                    { id: 'advanced', icon: '⚡', label: 'Advanced', color: 'amber' },
                    { id: 'history', icon: '📜', label: 'History', color: 'blue' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 py-3 px-2 text-center text-[10px] uppercase font-black tracking-wider transition-all whitespace-nowrap ${activeTab === tab.id
                            ? `bg-gradient-to-b from-${tab.color || 'green'}-900/70 to-${tab.color || 'green'}-900/40 text-${tab.color || 'green'}-300 border-b-2 border-${tab.color || 'green'}-400 shadow-lg`
                            : `text-slate-700 hover:text-${tab.color || 'green'}-500 hover:bg-slate-900/30`
                            }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* INSERT TAB */}
                {activeTab === 'insert' && (
                    <div className="space-y-4">
                        <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-700/50 rounded-xl p-4">
                            <h3 className="text-sm font-bold text-green-400 mb-2">Build Your Page</h3>
                            <p className="text-xs text-slate-400 mb-4">Click to add components to the top of the page.</p>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => handleInsertComponent('button', { defaultContent: 'Click Me', href: '#', variant: 'success' })}
                                    className="flex flex-col items-center gap-2 bg-slate-900 p-4 rounded-xl border border-slate-700 hover:border-green-500 hover:bg-green-900/10 transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <MousePointer size={20} className="text-green-400" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-300">Action Button</span>
                                </button>

                                <button
                                    onClick={() => handleInsertComponent('card', { defaultContent: '<h3>New Card</h3><p>Enter details here...</p>', actionLabel: 'Learn More' })}
                                    className="flex flex-col items-center gap-2 bg-slate-900 p-4 rounded-xl border border-slate-700 hover:border-blue-500 hover:bg-blue-900/10 transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <CreditCard size={20} className="text-blue-400" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-300">Info Card</span>
                                </button>

                                <button
                                    onClick={() => handleInsertComponent('alert', { defaultContent: 'Important System Announcement', title: 'Alert', variant: 'danger' })}
                                    className="flex flex-col items-center gap-2 bg-slate-900 p-4 rounded-xl border border-slate-700 hover:border-red-500 hover:bg-red-900/10 transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <AlertTriangle size={20} className="text-red-400" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-300">Warning Alert</span>
                                </button>

                                <button
                                    onClick={() => handleInsertComponent('alert', { defaultContent: 'System is running smoothly.', title: 'Status', variant: 'success' })}
                                    className="flex flex-col items-center gap-2 bg-slate-900 p-4 rounded-xl border border-slate-700 hover:border-emerald-500 hover:bg-emerald-900/10 transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Activity size={20} className="text-emerald-400" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-300">Success Box</span>
                                </button>
                            </div>
                        </div>

                        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Instructions</h4>
                            <ul className="text-[10px] text-slate-400 space-y-1 list-disc pl-4">
                                <li>Components are added to the top of the layout.</li>
                                <li>Use "Style" tab to customize them after adding.</li>
                                <li>Use "Content" tab to edit text.</li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* ELEMENT TAB */}
                {activeTab === 'element' && selectedDomElement && (
                    <div className="space-y-4">
                        {/* Element Info */}
                        <div className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-2 border-amber-500/40 rounded-2xl p-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="text-[9px] text-amber-600 uppercase tracking-widest font-bold mb-1">Selected</div>
                                    <div className="text-amber-400 font-black text-xl">&lt;{selectedDomElement.tagName.toLowerCase()}&gt;</div>
                                </div>
                                <button onClick={() => setSelectedDomElement(null)} className="text-red-400 text-xs bg-red-900/30 px-4 py-2 rounded-xl border-2 border-red-700/40 hover:bg-red-900/50 font-bold">
                                    Deselect
                                </button>
                            </div>
                        </div>

                        {/* Presets */}
                        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 space-y-3">
                            <label className="text-xs uppercase text-slate-300 font-bold">🎭 Quick Presets</label>
                            <div className="grid grid-cols-3 gap-2">
                                {presets.map(preset => (
                                    <button
                                        key={preset.name}
                                        onClick={() => handleApplyPreset(preset)}
                                        className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 hover:from-purple-800/40 hover:to-pink-800/40 text-purple-300 py-2 rounded-lg text-[10px] font-bold transition-all border border-purple-700/30"
                                    >
                                        {preset.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Colors */}
                        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 space-y-3">
                            <label className="text-xs uppercase text-slate-300 font-bold flex justify-between">
                                <span>🎨 Background</span>
                                <span className="text-amber-500 font-mono text-[10px]">{elementStyles.backgroundColor || 'none'}</span>
                            </label>
                            <div className="flex gap-2">
                                <input type="color" className="h-10 w-14 border-2 border-slate-600 rounded-lg cursor-pointer" value={rgbToHex(elementStyles.backgroundColor) || '#000000'} onChange={(e) => applyStyle('backgroundColor', e.target.value)} />
                                <input type="text" className="flex-1 bg-black/70 border-2 border-slate-700 text-slate-200 rounded-lg px-3 text-xs font-mono focus:border-amber-500 focus:outline-none" value={elementStyles.backgroundColor} onChange={(e) => applyStyle('backgroundColor', e.target.value)} placeholder="#000000" />
                                <button onClick={() => applyStyle('backgroundColor', '')} className="text-xs text-red-400 px-3 bg-red-900/20 rounded-lg border border-red-700/30 font-bold">Clear</button>
                            </div>
                        </div>

                        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 space-y-3">
                            <label className="text-xs uppercase text-slate-300 font-bold flex justify-between">
                                <span>✍️ Text Color</span>
                                <span className="text-amber-500 font-mono text-[10px]">{elementStyles.color || 'inherit'}</span>
                            </label>
                            <div className="flex gap-2">
                                <input type="color" className="h-10 w-14 border-2 border-slate-600 rounded-lg cursor-pointer" value={rgbToHex(elementStyles.color) || '#ffffff'} onChange={(e) => applyStyle('color', e.target.value)} />
                                <input type="text" className="flex-1 bg-black/70 border-2 border-slate-700 text-slate-200 rounded-lg px-3 text-xs font-mono focus:border-amber-500 focus:outline-none" value={elementStyles.color} onChange={(e) => applyStyle('color', e.target.value)} placeholder="#ffffff" />
                            </div>
                        </div>

                        {/* Typography */}
                        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 space-y-3">
                            <label className="text-xs uppercase text-slate-300 font-bold">📏 Font Size: {elementStyles.fontSize}</label>
                            <input type="range" min="8" max="72" value={parseInt(elementStyles.fontSize) || 16} className="w-full h-2 accent-amber-500" onChange={(e) => applyStyle('fontSize', `${e.target.value}px`)} />
                            <div className="grid grid-cols-4 gap-2">
                                {['12px', '16px', '24px', '32px'].map(size => (
                                    <button key={size} onClick={() => applyStyle('fontSize', size)} className="bg-slate-800 hover:bg-amber-600 hover:text-black text-[10px] py-2 rounded-lg font-bold transition-all">{size}</button>
                                ))}
                            </div>
                        </div>

                        {/* Spacing */}
                        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 space-y-3">
                            <label className="text-xs uppercase text-slate-300 font-bold">📦 Padding</label>
                            <div className="grid grid-cols-4 gap-2">
                                {['0', '8px', '16px', '24px'].map(pad => (
                                    <button key={pad} onClick={() => applyStyle('padding', pad)} className="bg-slate-800 hover:bg-amber-600 hover:text-black text-[10px] py-2 rounded-lg font-bold transition-all">{pad === '0' ? 'None' : pad}</button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 space-y-3">
                            <label className="text-xs uppercase text-slate-300 font-bold">🔲 Border Radius</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[{ label: 'Sharp', value: '0' }, { label: 'Round', value: '12px' }, { label: 'Pill', value: '9999px' }].map(({ label, value }) => (
                                    <button key={label} onClick={() => applyStyle('borderRadius', value)} className="bg-slate-800 hover:bg-amber-600 hover:text-black text-[10px] py-2 rounded-lg font-bold transition-all">{label}</button>
                                ))}
                            </div>
                        </div>

                        {/* Text Content */}
                        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 space-y-3">
                            <label className="text-xs uppercase text-slate-300 font-bold">📄 Content</label>
                            <textarea className="w-full bg-black/70 border-2 border-slate-700 rounded-lg p-3 text-xs text-slate-200 focus:border-amber-500 focus:outline-none resize-none" rows={4} defaultValue={selectedDomElement.innerText} onChange={(e) => { if (selectedDomElement) { selectedDomElement.innerText = e.target.value; saveToHistory(selectedDomElement); } }} placeholder="Edit text..." />
                        </div>
                    </div>
                )}

                {/* LAYOUT TAB */}
                {activeTab === 'layout' && selectedDomElement && (
                    <div className="space-y-4">
                        {/* Display */}
                        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 space-y-3">
                            <label className="text-xs uppercase text-slate-300 font-bold">📺 Display</label>
                            <select className="w-full bg-black border-2 border-slate-700 text-slate-200 rounded-lg p-3 text-xs font-bold" value={elementStyles.display} onChange={(e) => applyStyle('display', e.target.value)}>
                                <option value="block">Block</option>
                                <option value="inline">Inline</option>
                                <option value="inline-block">Inline Block</option>
                                <option value="flex">Flex</option>
                                <option value="grid">Grid</option>
                                <option value="none">None</option>
                            </select>
                        </div>

                        {/* Position */}
                        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 space-y-3">
                            <label className="text-xs uppercase text-slate-300 font-bold">📍 Position</label>
                            <select className="w-full bg-black border-2 border-slate-700 text-slate-200 rounded-lg p-3 text-xs font-bold" value={elementStyles.position} onChange={(e) => applyStyle('position', e.target.value)}>
                                <option value="static">Static</option>
                                <option value="relative">Relative</option>
                                <option value="absolute">Absolute</option>
                                <option value="fixed">Fixed</option>
                                <option value="sticky">Sticky</option>
                            </select>
                        </div>

                        {/* Flexbox */}
                        {elementStyles.display === 'flex' && (
                            <>
                                <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 space-y-3">
                                    <label className="text-xs uppercase text-slate-300 font-bold">↔️ Flex Direction</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['row', 'column'].map(dir => (
                                            <button key={dir} onClick={() => applyStyle('flexDirection', dir)} className="bg-slate-800 hover:bg-amber-600 hover:text-black text-[10px] py-2 rounded-lg font-bold transition-all capitalize">{dir}</button>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 space-y-3">
                                    <label className="text-xs uppercase text-slate-300 font-bold">⚖️ Justify Content</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['flex-start', 'center', 'flex-end', 'space-between', 'space-around'].map(val => (
                                            <button key={val} onClick={() => applyStyle('justifyContent', val)} className="bg-slate-800 hover:bg-amber-600 hover:text-black text-[9px] py-2 rounded-lg font-bold transition-all">{val.replace('flex-', '').replace('-', ' ')}</button>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 space-y-3">
                                    <label className="text-xs uppercase text-slate-300 font-bold">🎯 Align Items</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['flex-start', 'center', 'flex-end', 'stretch'].map(val => (
                                            <button key={val} onClick={() => applyStyle('alignItems', val)} className="bg-slate-800 hover:bg-amber-600 hover:text-black text-[10px] py-2 rounded-lg font-bold transition-all">{val.replace('flex-', '')}</button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Z-Index */}
                        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 space-y-3">
                            <label className="text-xs uppercase text-slate-300 font-bold">🔢 Z-Index (Layer)</label>
                            <input type="number" className="w-full bg-black border-2 border-slate-700 text-slate-200 rounded-lg p-3 text-xs font-mono" value={elementStyles.zIndex} onChange={(e) => applyStyle('zIndex', e.target.value)} placeholder="auto" />
                        </div>
                    </div>
                )}

                {/* ADVANCED TAB */}
                {activeTab === 'advanced' && selectedDomElement && (
                    <div className="space-y-4">
                        {/* Box Shadow */}
                        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 space-y-3">
                            <label className="text-xs uppercase text-slate-300 font-bold">💎 Box Shadow</label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { label: 'None', value: 'none' },
                                    { label: 'Small', value: '0 2px 8px rgba(0,0,0,0.1)' },
                                    { label: 'Medium', value: '0 4px 16px rgba(0,0,0,0.2)' },
                                    { label: 'Large', value: '0 10px 30px rgba(0,0,0,0.3)' },
                                    { label: 'Glow', value: '0 0 20px rgba(34,197,94,0.5)' },
                                    { label: 'Neon', value: '0 0 30px rgba(251,191,36,0.8)' }
                                ].map(({ label, value }) => (
                                    <button key={label} onClick={() => applyStyle('boxShadow', value)} className="bg-slate-800 hover:bg-amber-600 hover:text-black text-[10px] py-2 rounded-lg font-bold transition-all">{label}</button>
                                ))}
                            </div>
                        </div>

                        {/* Border */}
                        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 space-y-3">
                            <label className="text-xs uppercase text-slate-300 font-bold">🔳 Border</label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { label: 'None', value: 'none' },
                                    { label: 'Thin', value: '1px solid #64748b' },
                                    { label: 'Medium', value: '2px solid #64748b' },
                                    { label: 'Thick', value: '4px solid #64748b' },
                                    { label: 'Dashed', value: '2px dashed #64748b' },
                                    { label: 'Dotted', value: '2px dotted #64748b' }
                                ].map(({ label, value }) => (
                                    <button key={label} onClick={() => applyStyle('border', value)} className="bg-slate-800 hover:bg-amber-600 hover:text-black text-[10px] py-2 rounded-lg font-bold transition-all">{label}</button>
                                ))}
                            </div>
                        </div>

                        {/* Opacity */}
                        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 space-y-3">
                            <label className="text-xs uppercase text-slate-300 font-bold">👻 Opacity: {Math.round((parseFloat(elementStyles.opacity) || 1) * 100)}%</label>
                            <input type="range" min="0" max="1" step="0.1" value={elementStyles.opacity || 1} className="w-full h-2 accent-amber-500" onChange={(e) => applyStyle('opacity', e.target.value)} />
                        </div>

                        {/* Transform */}
                        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 space-y-3">
                            <label className="text-xs uppercase text-slate-300 font-bold">🔄 Transform</label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { label: 'None', value: 'none' },
                                    { label: 'Rotate 45°', value: 'rotate(45deg)' },
                                    { label: 'Scale 1.2x', value: 'scale(1.2)' },
                                    { label: 'Skew', value: 'skew(5deg, 5deg)' }
                                ].map(({ label, value }) => (
                                    <button key={label} onClick={() => applyStyle('transform', value)} className="bg-slate-800 hover:bg-amber-600 hover:text-black text-[10px] py-2 rounded-lg font-bold transition-all">{label}</button>
                                ))}
                            </div>
                        </div>

                        {/* Font Weight */}
                        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 space-y-3">
                            <label className="text-xs uppercase text-slate-300 font-bold">💪 Font Weight</label>
                            <div className="grid grid-cols-4 gap-2">
                                {['300', '400', '600', '700', '900'].map(weight => (
                                    <button key={weight} onClick={() => applyStyle('fontWeight', weight)} className="bg-slate-800 hover:bg-amber-600 hover:text-black text-[10px] py-2 rounded-lg font-bold transition-all">{weight}</button>
                                ))}
                            </div>
                        </div>

                        {/* Text Align */}
                        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 space-y-3">
                            <label className="text-xs uppercase text-slate-300 font-bold">📐 Text Align</label>
                            <div className="grid grid-cols-4 gap-2">
                                {['left', 'center', 'right', 'justify'].map(align => (
                                    <button key={align} onClick={() => applyStyle('textAlign', align)} className="bg-slate-800 hover:bg-amber-600 hover:text-black text-[10px] py-2 rounded-lg font-bold transition-all capitalize">{align}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* THEME TAB */}
                {activeTab === 'theme' && (
                    <div className="space-y-4">
                        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 space-y-3">
                            <label className="text-xs uppercase text-green-500 font-bold flex items-center gap-2"><Palette size={14} /> Primary Color</label>
                            <div className="flex gap-2">
                                <input type="color" className="h-10 w-14 border-2 border-green-700 rounded-lg cursor-pointer" value={config.primary_color || "#FF9933"} onChange={(e) => updateConfig('primary_color', e.target.value)} />
                                <input type="text" className="flex-1 bg-black border-2 border-green-700 text-green-400 rounded-lg px-3 font-mono text-xs" value={config.primary_color || "#FF9933"} onChange={(e) => updateConfig('primary_color', e.target.value)} />
                            </div>
                        </div>
                    </div>
                )}

                {/* CONTENT TAB */}
                {activeTab === 'content' && (
                    <div className="space-y-4">
                        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 space-y-3">
                            <label className="text-xs uppercase text-green-500 font-bold flex items-center gap-2"><Type size={14} /> Session Header</label>
                            <input type="text" className="w-full bg-black border-2 border-green-700 text-green-400 rounded-lg p-3 text-xs" value={config.session_name || ""} onChange={(e) => updateConfig('session_name', e.target.value)} placeholder="e.g. Budget Session 2026" />
                        </div>
                    </div>
                )}

                {/* HISTORY TAB */}
                {activeTab === 'history' && (
                    <div className="space-y-3">
                        {/* Analytics Dashboard */}
                        {analytics && (
                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-green-950/20 border border-green-800/30 rounded-lg p-3">
                                    <div className="text-green-400 text-2xl font-bold">{analytics.creates}</div>
                                    <div className="text-green-600 text-xs uppercase font-bold">Created</div>
                                </div>
                                <div className="bg-blue-950/20 border border-blue-800/30 rounded-lg p-3">
                                    <div className="text-blue-400 text-2xl font-bold">{analytics.updates}</div>
                                    <div className="text-blue-600 text-xs uppercase font-bold">Updated</div>
                                </div>
                                <div className="bg-red-950/20 border border-red-800/30 rounded-lg p-3">
                                    <div className="text-red-400 text-2xl font-bold">{analytics.deletes}</div>
                                    <div className="text-red-600 text-xs uppercase font-bold">Deleted</div>
                                </div>
                            </div>
                        )}

                        {/* Filters */}
                        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 space-y-2">
                            <div className="text-slate-300 text-xs font-bold uppercase mb-2">🔍 Filters</div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Action</label>
                                    <select
                                        value={historyFilters.action}
                                        onChange={(e) => setHistoryFilters({ ...historyFilters, action: e.target.value })}
                                        className="w-full bg-black border border-slate-700 text-slate-300 rounded-lg p-2 text-xs font-bold"
                                    >
                                        <option value="all">All Actions</option>
                                        <option value="create">Create</option>
                                        <option value="update">Update</option>
                                        <option value="delete">Delete</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Time Range</label>
                                    <select
                                        value={historyFilters.days}
                                        onChange={(e) => setHistoryFilters({ ...historyFilters, days: e.target.value })}
                                        className="w-full bg-black border border-slate-700 text-slate-300 rounded-lg p-2 text-xs font-bold"
                                    >
                                        <option value="all">All Time</option>
                                        <option value="7">Last 7 Days</option>
                                        <option value="30">Last 30 Days</option>
                                        <option value="90">Last 90 Days</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Change Log */}
                        {changeHistory.length > 0 ? (
                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                {changeHistory.map((log: any) => (
                                    <div key={log.id} className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 hover:border-blue-500/30 transition-colors">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${log.action === 'create' ? 'bg-green-900/30 text-green-400 border border-green-700/30' :
                                                    log.action === 'update' ? 'bg-blue-900/30 text-blue-400 border border-blue-700/30' :
                                                        'bg-red-900/30 text-red-400 border border-red-700/30'
                                                    }`}>
                                                    {log.action}
                                                </span>
                                                <span className="text-slate-400 text-xs font-mono">{log.element_selector}</span>
                                            </div>
                                            <span className="text-slate-600 text-[10px]">
                                                {new Date(log.changed_at).toLocaleString()}
                                            </span>
                                        </div>

                                        <div className="text-[10px] text-slate-500 mb-2">
                                            By: <span className="text-blue-400 font-bold">{log.changed_by}</span>
                                        </div>

                                        {log.action === 'update' && log.old_css_text && (
                                            <details className="text-[10px] mt-2">
                                                <summary className="cursor-pointer text-slate-400 hover:text-slate-300">View Changes</summary>
                                                <div className="mt-2 space-y-1">
                                                    <div className="bg-red-950/20 border border-red-900/30 rounded p-2">
                                                        <div className="text-red-400 font-bold mb-1">Before:</div>
                                                        <code className="text-red-300 font-mono text-[9px] break-all">{log.old_css_text}</code>
                                                    </div>
                                                    <div className="bg-green-950/20 border border-green-900/30 rounded p-2">
                                                        <div className="text-green-400 font-bold mb-1">After:</div>
                                                        <code className="text-green-300 font-mono text-[9px] break-all">{log.new_css_text}</code>
                                                    </div>
                                                </div>
                                            </details>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-500">
                                <History size={48} className="mx-auto mb-4 opacity-20" />
                                <p className="font-bold text-sm">No Changes Found</p>
                                <p className="text-xs opacity-70 mt-1">Try adjusting your filters</p>
                            </div>
                        )}
                    </div>
                )}

                {!selectedDomElement && activeTab !== 'theme' && activeTab !== 'content' && activeTab !== 'history' && (
                    <div className="text-center py-16 text-slate-500">
                        <MousePointer size={56} className="mx-auto mb-4 opacity-20" />
                        <p className="font-bold text-lg mb-2">No Element Selected</p>
                        <p className="text-xs opacity-70">Click "START PICKER" and select an element</p>
                    </div>
                )}
            </div>

            {/* Footer Actions - ALWAYS visible if element selected */}
            {selectedDomElement && (
                <div className="p-4 border-t-2 border-slate-800 bg-gradient-to-r from-slate-950 to-slate-900 space-y-2 z-[10001] relative shadow-2xl">
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={handleCancel} className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-900/40 to-rose-900/40 hover:from-red-900/60 hover:to-rose-900/60 text-red-400 border-2 border-red-700/50 py-3 rounded-xl text-xs font-black uppercase transition-all">
                            <RotateCcw size={14} /> Cancel
                        </button>
                        <button type="button" onClick={handleSave} className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white border-2 border-green-500 py-3 rounded-xl text-xs font-black uppercase transition-all shadow-lg shadow-green-500/30 cursor-pointer">
                            <Save size={14} /> Save
                        </button>
                    </div>
                    <button onClick={() => { if (selectedDomElement) { selectedDomElement.style.cssText = ''; setHistory([]); setHistoryIndex(-1); setHasChanges(false); updateElementStyles(); } }} className="w-full bg-gradient-to-r from-yellow-900/30 to-orange-900/30 text-yellow-400 border-2 border-yellow-700/50 py-3 rounded-xl text-xs font-black uppercase hover:from-yellow-900/50 hover:to-orange-900/50 transition-all">
                        🔄 Reset All
                    </button>
                </div>
            )}

            <div className="p-3 border-t-2 border-green-900/50 bg-gradient-to-r from-green-950/60 to-emerald-950/60 text-center">
                <div className="text-[10px] text-green-700 font-bold uppercase tracking-wider">⚡ Visual Builder - Standard Edition</div>
            </div>
        </div>
    );
};
