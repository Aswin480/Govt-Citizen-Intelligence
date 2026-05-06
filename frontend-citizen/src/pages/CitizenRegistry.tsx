
import React, { useState, useRef, useEffect } from 'react';
import {
    Book, Search, Send, Bot, User, Settings,
    X, AlertTriangle, Scale, Bookmark, ChevronRight,
    Menu, Sparkles, BookOpen, Quote
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConstitution } from '../context/ConstitutionContext';

// --- MOCK CHAPTERS (Ideally, these would be generated from the text content) ---
const CHAPTERS = [
    { id: 'preamble', title: 'Preamble', icon: <Scale size={16} /> },
    { id: 'part-3-fundamental-rights', title: 'Part III: Rights', icon: <Bookmark size={16} /> },
    { id: 'part-4-dpsp', title: 'Part IV: Directive Principles', icon: <BookOpen size={16} /> }
];

// --- MAIN COMPONENT ---
const CitizenRegistry: React.FC = () => {
    const { getAdminApiKey, constitutionText } = useConstitution();

    // Convert the single text into sections? For now, we just display the whole text or sections if formatted.
    // In a real app, we'd parse the PDF/Text into chapters. Here, we simulate by showing the 'Master Text'.

    const [activeChapter, setActiveChapter] = useState('preamble');

    // We treat the "Master Text" as the content for the active chapter for simplicity in this prototype.
    // In a real elite version, we would parse this text.

    const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
        { role: 'model', text: "Greetings, Citizen. I am the Constitutional Oracle. Ask me any question about your rights, duties, or the law." }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim()) return;
        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsLoading(true);
        try {
            console.log("Calling Oracle Bot:", userMsg);
            const response = await fetch(`http://localhost:8000/v1/system/bot/ask`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: userMsg,
                    context: constitutionText.substring(0, 10000)
                })
            });
            const data = await response.json();
            console.log("Oracle Response:", data);
            setMessages(prev => [...prev, { role: 'model', text: data.answer || "I am currently analyzing legal precedents..." }]);
        } catch (error: any) {
            setMessages(prev => [...prev, { role: 'model', text: `Syncing AI core... Try again in 30s.` }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-[#F5F2E8] dark:bg-[#1a1a1a] overflow-hidden font-serif">

            {/* LEFT: The Codex (Reader) */}
            <div className="flex-1 flex flex-col md:flex-row h-full relative">
                {/* Book Texture Overlay */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] z-0"></div>

                {/* Sidebar Navigation */}
                <div className="w-64 bg-[#EAE6D6] dark:bg-[#151515] border-r border-[#D4CFC0] dark:border-[#333] p-6 max-md:hidden z-10 shadow-inner flex flex-col">
                    <div className="flex items-center gap-3 mb-8 text-[#5C4B35] dark:text-[#A08D70]">
                        <div className="p-2 border border-[#8C7B65] rounded-full">
                            <Scale size={18} />
                        </div>
                        <span className="font-bold uppercase tracking-widest text-sm">The Codex</span>
                    </div>

                    <div className="space-y-2 flex-1 overflow-y-auto">
                        {/* Mock Chapters - In real app, derived from text */}
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 pl-2">Contents</div>
                        {CHAPTERS.map(chapter => (
                            <button
                                key={chapter.id}
                                onClick={() => setActiveChapter(chapter.id)} // For now doesn't change text since we use one master text
                                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold flex items-center gap-3 transition-all ${activeChapter === chapter.id
                                    ? 'bg-[#5C4B35] text-[#F5F2E8] shadow-md'
                                    : 'text-[#8C7B65] hover:bg-[#DED9C4] dark:hover:bg-[#252525] dark:text-[#888]'
                                    }`}
                            >
                                {chapter.icon}
                                <span className="truncate">{chapter.title}</span>
                            </button>
                        ))}
                    </div>

                    {/* Status Footer */}
                    <div className="pt-4 border-t border-[#D4CFC0] dark:border-[#333]">
                        <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Source Status</div>
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 font-bold text-xs">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            Verified Document
                        </div>
                    </div>
                </div>

                {/* Main Reader Content */}
                <div className="flex-1 relative overflow-y-auto p-12 md:p-20 text-lg leading-loose text-[#2C241B] dark:text-[#DDD] font-serif z-10 scroll-smooth">
                    <div className="max-w-3xl mx-auto">
                        <div className="mb-12 text-center border-b-2 border-double border-[#8C7B65] pb-8">
                            <div className="inline-block p-4 border border-[#8C7B65] rounded-full mb-4 opacity-50">
                                <Scale size={32} />
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-[#4A3B2A] dark:text-[#E0C097] mb-4">
                                The Constitution <br /><span className="text-2xl font-normal italic lowercase">of</span> India
                            </h1>
                            <p className="text-sm font-sans uppercase tracking-widest text-slate-500">Adopted 26 January 1950</p>
                        </div>

                        {/* The Actual Text */}
                        <div className="whitespace-pre-wrap font-serif text-justify drop-shadow-sm">
                            {/* We display the master text here. Ideally parsed. */}
                            {constitutionText}
                        </div>

                        <div className="mt-24 text-center text-slate-400 italic text-sm">
                            ~ End of Document ~
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT: The Oracle (AI Chat) */}
            <div className="w-[400px] bg-white dark:bg-[#111] border-l border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl relative z-20">
                {/* Header */}
                <div className="h-20 bg-[#2C241B] dark:bg-black text-[#F5F2E8] flex items-center justify-between px-6 shadow-lg z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#E0C097] text-[#2C241B] flex items-center justify-center shadow-lg shadow-amber-500/20">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg leading-none">The Oracle</h3>
                            <span className="text-[10px] uppercase tracking-widest text-[#E0C097]">AI Legal Assistant</span>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F9F9F9] dark:bg-[#0a0a0a]">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 ${msg.role === 'user' ? 'bg-slate-200 dark:bg-slate-800' : 'bg-[#E0C097] text-[#2C241B]'
                                }`}>
                                {msg.role === 'user' ? <User size={14} /> : <Scale size={14} />}
                            </div>
                            <div className={`p-4 rounded-xl text-sm leading-relaxed shadow-sm max-w-[85%] ${msg.role === 'user'
                                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tr-none border border-slate-200 dark:border-slate-700'
                                : 'bg-[#FFFBEB] dark:bg-[#1a1500] text-slate-800 dark:text-[#E0C097] rounded-tl-none border border-amber-100 dark:border-amber-900/30 font-serif'
                                }`}>
                                {msg.role === 'model' && <Quote size={12} className="text-amber-400 mb-2 opacity-50" />}
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-[#E0C097] text-[#2C241B] flex items-center justify-center animate-pulse">
                                <Bot size={14} />
                            </div>
                            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl rounded-tl-none shadow-sm flex gap-1 items-center h-12">
                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className="p-6 bg-white dark:bg-black border-t border-slate-100 dark:border-slate-800">
                    <div className="relative group">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder="Ask about your rights..."
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-4 pr-14 py-4 text-sm focus:border-[#E0C097] outline-none transition-all resize-none shadow-inner h-14 min-h-[56px] max-h-32 text-slate-900 dark:text-white"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!input.trim() || isLoading}
                            className="absolute right-2 bottom-2 p-2 bg-[#2C241B] dark:bg-[#E0C097] text-white dark:text-black rounded-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-lg"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                    <div className="text-[10px] text-slate-400 text-center mt-3 font-medium uppercase tracking-wider">
                        Powered by Government Intelligence Core
                    </div>
                </div>
            </div>

        </div>
    );
};

export default CitizenRegistry;
