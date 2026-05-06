import { useState, useEffect } from 'react';
import { User, Bell, FileText, Settings, Shield, LogOut, Loader2, Flag, Landmark, Siren, PhoneCall, Flame, Navigation, ShieldAlert, Activity, Pill, Stethoscope, Users, ShoppingCart, IndianRupee, Gavel, Bus, BookOpen, ChevronRight, Send, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGovernanceScope } from '../context/GovernanceScopeContext';

import { fetchFamilyByRation, fetchMemberByMobile } from '../services/familyApi';
import { GrievanceStore } from '../services/grievanceStore';
import { FamilyResources } from '../components/FamilyResources';
import { JeevanSetu } from '../components/JeevanSetu';

export default function UserDashboard() {
    const { user, logout } = useAuth();
    const { scope, selectedState } = useGovernanceScope();
    const [loading] = useState(false);

    // Family State
    const [showFamilyModal, setShowFamilyModal] = useState(false);
    const [rationInput, setRationInput] = useState('');
    const [mobileInput, setMobileInput] = useState('');
    const [fetchMode, setFetchMode] = useState<'RATION' | 'MOBILE'>('RATION');
    const [familyMembers, setFamilyMembers] = useState<any[]>([]);
    const [isFetchingFamily, setIsFetchingFamily] = useState(false);

    // Grievance State
    const [showGrievanceModal, setShowGrievanceModal] = useState(false);
    const [grievanceText, setGrievanceText] = useState('');
    const [grievanceType, setGrievanceType] = useState('Pothole');
    const [isSubmittingGrievance, setIsSubmittingGrievance] = useState(false);


    const handleFetchFamily = async () => {
        setIsFetchingFamily(true);
        try {
            if (fetchMode === 'RATION') {
                const data: any = await fetchFamilyByRation(rationInput);
                // Transform to array
                const members = data.members.map((m: any, i: number) => ({ ...m, id: i + 1 }));
                setFamilyMembers(members);
            } else {
                const member: any = await fetchMemberByMobile(mobileInput);
                setFamilyMembers(prev => [...prev, { ...member, id: Date.now() }]);
            }
            setShowFamilyModal(false);
        } catch (e) {
            alert("Record not found! Try Ration Card: 1234567890");
        }
        setIsFetchingFamily(false);
    };

    const [locationStatus, setLocationStatus] = useState<'idle' | 'locating' | 'success' | 'error'>('idle');
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedCategory, setSelectedCategory] = useState<string>('All'); // New State for Filter

    // Live Clock & Status Engine
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every min

        // Auto-fetch location on mount
        setLocationStatus('locating');
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
                    setLocationStatus('success');
                },
                () => setLocationStatus('error')
            );
        } else {
            setLocationStatus('error');
        }
        return () => clearInterval(timer);
    }, []);

    // Logic: Determine Status based on REAL time (e.g. 3 AM = Closed)
    const getStatus = (type: 'office' | 'emergency' | 'wifi') => {
        const hour = currentTime.getHours();
        if (type === 'emergency' || type === 'wifi') return { text: 'Active', color: 'text-green-600', dot: 'bg-green-500 animate-pulse' };
        if (hour >= 9 && hour < 17) return { text: 'Open Now', color: 'text-green-600', dot: 'bg-green-500' };
        if (hour >= 17 && hour < 18) return { text: 'Closing Soon', color: 'text-amber-600', dot: 'bg-amber-500' };
        return { text: 'Closed', color: 'text-red-500', dot: 'bg-slate-400' };
    };

    // Mock Data for Dashboard
    const complaints = [
        { id: 'CMP-2024-001', title: 'Street Light Malfunction', status: 'In Progress', date: '2024-02-01', location: 'Sector 45' },
        { id: 'CMP-2024-002', title: 'Water Leakage', status: 'Resolved', date: '2024-01-28', location: 'Main Market' }
    ];

    // Elite Logic: Crowd Simulation & Resource Monitor
    const getLoadStatus = (baseWaitTime: number) => {
        const hour = currentTime.getHours();
        // Peak hours: 9-11 AM and 5-7 PM
        const isPeak = (hour >= 9 && hour <= 11) || (hour >= 17 && hour <= 19);
        const multiplier = isPeak ? 1.5 : 0.8;
        const currentWait = Math.round(baseWaitTime * multiplier);

        if (currentWait < 15) return { label: 'Low Traffic', color: 'text-green-600', bg: 'bg-green-100', wait: `${currentWait} min` };
        if (currentWait < 45) return { label: 'Moderate', color: 'text-amber-600', bg: 'bg-amber-100', wait: `${currentWait} min` };
        return { label: 'High Load', color: 'text-red-600', bg: 'bg-red-100', wait: `${currentWait} min` };
    };

    const allServices = [
        // --- HEALTH SCTOR ---
        {
            id: 1,
            icon: <Stethoscope size={20} />,
            name: "District Civil Hospital",
            type: "STATE GOVT",
            access: "FREE", // Key for low income
            category: "Healthcare",
            filterCat: "Hospitals",
            dist: "1.2 km",
            ...getStatus('office'),
            load: getLoadStatus(45),
            features: ["Free OPD", "X-Ray (Free)", "Gen. Ward"],
            coords: "28.6139,77.2090"
        },
        {
            id: 2,
            icon: <Pill size={20} />,
            name: "PM Jan Aushadhi Kendra",
            type: "CENTRAL GOVT",
            access: "SUBSIDIZED", // Key for middle class
            category: "Pharmacy",
            filterCat: "Pharmacy",
            dist: "0.5 km",
            ...getStatus('office'),
            load: getLoadStatus(10),
            features: ["Generic Meds (-70%)", "Insulin", "Implants"],
            coords: "28.6129,77.2295"
        },
        {
            id: 3,
            icon: <Activity size={20} />,
            name: "Apollo Clinic (Pvt)",
            type: "PRIVATE",
            access: "PAID", // Key for high income choice
            category: "Healthcare",
            filterCat: "Hospitals",
            dist: "2.5 km",
            ...getStatus('office'),
            load: getLoadStatus(5),
            features: ["No Wait Time", "Specialist Consult", "AC Rooms"],
            coords: "28.6200,77.2100"
        },
        {
            id: 9,
            icon: <Pill size={20} />,
            name: "City Wellness Chemist",
            type: "PRIVATE",
            access: "PAID",
            category: "Pharmacy",
            filterCat: "Pharmacy",
            dist: "1.5 km",
            ...getStatus('office'),
            load: getLoadStatus(10),
            features: ["Home Delivery", "24/7"],
            coords: "28.6200,77.2100"
        },

        // --- FOOD & RATION (Common Man Needs) ---
        {
            id: 4,
            icon: <ShoppingCart size={20} />,
            name: "Fair Price Shop #42 (Ration)",
            type: "STATE GOVT",
            access: "SUBSIDIZED",
            category: "Food Security",
            filterCat: "Ration",
            dist: "0.3 km",
            ...getStatus('office'),
            load: getLoadStatus(30),
            features: ["Rice: ₹3/kg", "Wheat: ₹2/kg", "Oil: Stock Low"],
            coords: "28.6250,77.2150"
        },

        // --- GOVERNANCE & UTILITIES ---
        {
            id: 5,
            icon: <Landmark size={20} />,
            name: "e-Seva Kendra (CSC)",
            type: "STATE GOVT",
            access: "NOMINAL FEE",
            category: "Services",
            filterCat: "Govt Services",
            dist: "0.8 km",
            ...getStatus('office'),
            load: getLoadStatus(20),
            features: ["Aadhaar Update", "Pan Card", "Pension Verify"],
            coords: "28.6100,77.2300"
        },
        {
            id: 6,
            icon: <IndianRupee size={20} />,
            name: "SBI Main Branch",
            type: "PUBLIC SECTOR",
            access: "PUBLIC",
            category: "Finance",
            filterCat: "Finance",
            dist: "1.0 km",
            ...getStatus('office'),
            load: getLoadStatus(15),
            features: ["ATM", "Pension Acct", "Mudra Loan"],
            coords: "28.6110,77.2200"
        },

        // --- LAW & SAFETY ---
        {
            id: 7,
            icon: <Gavel size={20} />,
            name: "District Court / Legal Aid",
            type: "STATE GOVT",
            access: "FREE",
            category: "Legal",
            filterCat: "Legal",
            dist: "3.5 km",
            ...getStatus('office'),
            load: getLoadStatus(0),
            features: ["Free Legal Aid", "Notary", "Affidavits"],
            coords: "28.6300,77.2400"
        },
        {
            id: 8,
            icon: <Bus size={20} />,
            name: "Central Bus Depot",
            type: "STATE GOVT",
            access: "PUBLIC",
            category: "Transport",
            filterCat: "Transport",
            dist: "4.0 km",
            ...getStatus('office'),
            load: getLoadStatus(20),
            features: ["Inter-State", "Low Floor AC", "Pass Counter"],
            coords: "28.6400,77.2500"
        }
    ];

    // Common Man Categories
    const categories = ["All", "Hospitals", "Pharmacy", "Ration", "Govt Services", "Finance", "Legal", "Transport"];

    // Filter the list
    const filteredServices = selectedCategory === 'All' ? allServices : allServices.filter(s => s.filterCat === selectedCategory);

    const savedSchemes = [
        { id: 1, name: 'PM Kisan Samman Nidhi', benefit: '₹6,000/year' },
        { id: 2, name: 'Ayushman Bharat', benefit: 'Health Cover up to ₹5 Lakh' }
    ];

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0c0c14] text-slate-900 dark:text-slate-100 p-4 md:p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-black p-6 rounded-2xl shadow-lg border border-indigo-100 dark:border-indigo-900/30">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold relative group cursor-pointer">
                            {user?.username?.[0]?.toUpperCase() || 'U'}
                            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                                Welcome, {user?.username || 'Citizen'} <Shield size={16} className="text-indigo-500" />
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Citizen ID: IND-{Math.floor(Math.random() * 10000000)} | {scope === 'nation' ? 'India' : selectedState?.name}
                            </p>

                            {/* Family Constellation (New) */}
                            {familyMembers.length > 0 && (
                                <div className="mt-4 flex items-center gap-3 animate-fade-in-up">
                                    <div className="text-[10px] uppercase font-bold text-slate-400">My Parivar:</div>
                                    <div className="flex -space-x-2">
                                        {familyMembers.map((m, i) => (
                                            <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white dark:border-black flex items-center justify-center text-[10px] font-bold relative group cursor-help" title={`${m.name} (${m.relation})`}>
                                                {m.name[0]}
                                                <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-white ${m.status === 'Student' ? 'bg-blue-400' : m.status === 'Pensioner' ? 'bg-purple-400' : 'bg-green-500'}`}></span>
                                            </div>
                                        ))}
                                        <button onClick={() => setShowFamilyModal(true)} className="w-8 h-8 rounded-full bg-indigo-50 border-2 border-dashed border-indigo-300 flex items-center justify-center text-indigo-500 hover:bg-indigo-100 transition-colors">
                                            +
                                        </button>
                                    </div>
                                </div>
                            )}
                            {familyMembers.length === 0 && (
                                <button onClick={() => setShowFamilyModal(true)} className="mt-3 text-xs flex items-center gap-1 text-indigo-600 font-bold hover:underline decoration-indigo-300 underline-offset-4">
                                    <Users size={12} /> Link Family Tree
                                </button>
                            )}
                        </div>
                    </div>

                    {/* FAMILY FETCH MODAL */}
                    {showFamilyModal && (
                        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
                            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-2xl border border-indigo-100 dark:border-indigo-900">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-indigo-600">
                                    <Users size={24} /> Link Family ID
                                </h3>

                                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mb-6">
                                    <button
                                        onClick={() => setFetchMode('RATION')}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${fetchMode === 'RATION' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                                    >
                                        Ration Card
                                    </button>
                                    <button
                                        onClick={() => setFetchMode('MOBILE')}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${fetchMode === 'MOBILE' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                                    >
                                        Mobile Number
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {fetchMode === 'RATION' ? (
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase text-slate-500">Enter Ration Card No.</label>
                                            <input
                                                type="text"
                                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-mono tracking-widest focus:ring-2 focus:ring-indigo-500 outline-none"
                                                placeholder="XXXX XXXX XXXX"
                                                value={rationInput}
                                                onChange={e => setRationInput(e.target.value)}
                                            />
                                            <p className="text-[10px] text-green-600 flex items-center gap-1"><Shield size={10} /> Fetches from NFSA Database</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase text-slate-500">Linked Mobile Number</label>
                                            <input
                                                type="text"
                                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-mono tracking-widest focus:ring-2 focus:ring-indigo-500 outline-none"
                                                placeholder="+91 XXXXX XXXXX"
                                                value={mobileInput}
                                                onChange={e => setMobileInput(e.target.value)}
                                            />
                                            <p className="text-[10px] text-orange-600 flex items-center gap-1"><Shield size={10} /> Simulates OTP Verification</p>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleFetchFamily}
                                        disabled={isFetchingFamily}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                    >
                                        {isFetchingFamily ? <Loader2 className="animate-spin" size={18} /> : 'Fetch Family Details'}
                                    </button>
                                    <button onClick={() => setShowFamilyModal(false)} className="w-full text-xs text-slate-500 font-bold hover:text-slate-800 py-2">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="mt-4 md:mt-0 flex gap-3 items-center">
                        <button onClick={() => setShowGrievanceModal(true)} className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 transition-colors shadow-lg shadow-rose-500/20 animate-pulse">
                            <Siren size={18} /> File Grievance
                        </button>
                        <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 relative">
                            <Bell size={20} />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        </button>
                        <button onClick={logout} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors">
                            <LogOut size={16} /> Logout
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Col: Activity */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Civic Resource Radar (Elite Version) */}
                        <section className="bg-white dark:bg-black p-6 rounded-2xl shadow-lg border border-indigo-100 dark:border-indigo-900/30 overflow-hidden relative">
                            {/* Decorative Background Grid */}
                            <div className="absolute inset-0 text-slate-200/10 dark:text-slate-800/10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                            <div className="flex justify-between items-center mb-6 relative z-10">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Activity size={20} className="text-indigo-600 animate-pulse" /> Civic Resource Radar
                                </h2>
                                <div className="flex items-center gap-2">
                                    {locationStatus === 'locating' && <Loader2 size={14} className="animate-spin text-indigo-500" />}
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Live Feed</span>
                                        <span className="text-xs font-mono text-indigo-600 font-bold">
                                            {locationStatus === 'success' ? `LAT:${coords?.lat.toFixed(4)} LONG:${coords?.lng.toFixed(4)}` : 'SCANNING AREA...'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Category Filter Bar */}
                            <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-indigo-600 text-white shadow-md transform scale-105' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 gap-4 max-h-[500px] overflow-y-auto">
                                {filteredServices.map((service) => (
                                    <div key={service.id} className="relative group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all hover:shadow-md">
                                        {/* Status Line Left */}
                                        <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-lg ${service.color === 'text-green-600' ? 'bg-green-500' : service.color === 'text-amber-600' ? 'bg-amber-500' : 'bg-red-500'}`}></div>

                                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between pl-3">
                                            {/* Left: Icon & Info */}
                                            <div className="flex items-start gap-4">
                                                <div className={`p-3 rounded-lg ${service.type === 'CENTRAL GOVT' ? 'bg-orange-50 text-orange-600' : service.type === 'PRIVATE' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'} border dark:border-white/5`}>
                                                    {service.icon}
                                                </div>
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${service.type === 'CENTRAL GOVT' ? 'bg-orange-100 text-orange-700 border-orange-200' : service.type === 'PRIVATE' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                                                            {service.type}
                                                        </span>
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${service.access === 'FREE' ? 'bg-green-100 text-green-700 border-green-200' : service.access === 'SUBSIDIZED' ? 'bg-teal-100 text-teal-700 border-teal-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                            {service.access}
                                                        </span>
                                                    </div>
                                                    <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">{service.name}</h3>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {service.features.map((f, idx) => (
                                                            <span key={idx} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                                                                {f}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right: Real-time Stats & Action */}
                                            <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end mt-4 md:mt-0">
                                                <div className="flex flex-col items-end min-w-[80px]">
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <Users size={12} className="text-slate-400" />
                                                        <span className={`text-xs font-bold ${service.load.color}`}>{service.load.label}</span>
                                                    </div>
                                                    <span className="text-[10px] text-slate-500 font-number">Est. Wait: {service.load.wait}</span>
                                                </div>

                                                <div className="flex flex-col items-end min-w-[90px] border-l pl-4 dark:border-slate-800">
                                                    <div className={`flex items-center gap-1.5 mb-1 ${service.color}`}>
                                                        <div className={`w-2 h-2 rounded-full ${service.dot}`}></div>
                                                        <span className="text-xs font-bold uppercase">{service.text}</span>
                                                    </div>
                                                    <a
                                                        href={`https://www.google.com/maps/search/?api=1&query=${service.coords}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline uppercase"
                                                    >
                                                        <Navigation size={10} /> Navigate ({service.dist})
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Complaints Section */}
                        <section className="bg-white dark:bg-black p-6 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Flag size={20} className="text-orange-500" /> My Grievances
                                </h2>
                                <button className="text-xs font-bold uppercase text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1 rounded-full">
                                    + File New
                                </button>
                            </div>
                            {/* Constitution Explorer Entry */}
                            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between group cursor-pointer hover:shadow-md transition-all" onClick={() => window.location.href = '/constitution'}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-100 dark:bg-amber-800/30 text-amber-700 rounded-lg">
                                        <BookOpen size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-amber-900 dark:text-amber-100 text-sm">Constitutional Compass</h3>
                                        <p className="text-[10px] text-amber-700 dark:text-amber-400">Trace Bills & Rights (No AI)</p>
                                    </div>
                                </div>
                                <ChevronRight className="text-amber-400 group-hover:translate-x-1 transition-transform" size={16} />
                            </div>
                            <div className="space-y-4">
                                {complaints.map(ticket => (
                                    <div key={ticket.id} className="flex justify-between items-center p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-indigo-300 transition-colors cursor-pointer group">
                                        <div>
                                            <h3 className="font-bold text-sm group-hover:text-indigo-500 transition-colors">{ticket.title}</h3>
                                            <p className="text-xs text-slate-400">{ticket.id} • {ticket.location}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${ticket.status === 'Resolved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {ticket.status}
                                            </span>
                                            <p className="text-[10px] text-slate-400 mt-1">{ticket.date}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Recent Schemes */}
                        <section className="bg-white dark:bg-black p-6 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <FileText size={20} className="text-green-500" /> Enrolled Schemes
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {savedSchemes.map(scheme => (
                                    <div key={scheme.id} className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-black border border-indigo-100 dark:border-indigo-900/50">
                                        <h3 className="font-bold text-indigo-900 dark:text-indigo-300">{scheme.name}</h3>
                                        <p className="text-xs text-slate-500 mt-2">Benefit: {scheme.benefit}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Right Col: Profile & Stats */}
                    <div className="space-y-8">

                        {/* Emergency SOS Widget */}
                        <div className="bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950/40 dark:to-rose-900/20 border border-red-200 dark:border-red-900/50 p-6 rounded-2xl shadow-sm relative overflow-hidden group">
                            <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
                                <Siren size={120} className="text-red-600" />
                            </div>
                            <h3 className="text-red-800 dark:text-red-200 font-bold flex items-center gap-2 mb-4 relative z-10">
                                <ShieldAlert size={18} className="animate-pulse text-red-600" /> Emergency SOS
                            </h3>
                            <div className="grid grid-cols-3 gap-2 relative z-10">
                                <button className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-red-950/50 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/60 border border-red-100 dark:border-red-900 transition-all shadow-sm group/btn hover:-translate-y-1">
                                    <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-full text-red-600 group-hover/btn:scale-110 transition-transform">
                                        <Siren size={18} />
                                    </div>
                                    <span className="text-[10px] font-bold text-red-800 dark:text-red-200">Police</span>
                                </button>
                                <button className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-red-950/50 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/60 border border-red-100 dark:border-red-900 transition-all shadow-sm group/btn hover:-translate-y-1">
                                    <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-full text-red-600 group-hover/btn:scale-110 transition-transform relative">
                                        <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20"></div>
                                        <PhoneCall size={18} className="relative z-10" />
                                    </div>
                                    <span className="text-[10px] font-bold text-red-800 dark:text-red-200">Ambulance</span>
                                </button>
                                <button className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-red-950/50 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/60 border border-red-100 dark:border-red-900 transition-all shadow-sm group/btn hover:-translate-y-1">
                                    <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-full text-orange-600 group-hover/btn:scale-110 transition-transform">
                                        <Flame size={18} />
                                    </div>
                                    <span className="text-[10px] font-bold text-red-800 dark:text-red-200">Fire</span>
                                </button>
                            </div>
                        </div>
                        <section className="bg-gradient-to-b from-indigo-600 to-indigo-800 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-lg font-bold opacity-90 mb-1">Citizen Score</h3>
                                <div className="text-5xl font-black mb-2">850</div>
                                <p className="text-xs opacity-70">Good Standing. Eligible for Tier-1 benefits.</p>
                                <div className="mt-6 h-2 bg-black/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-400 w-[85%]"></div>
                                </div>
                            </div>
                            {/* Decor */}
                            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
                        </section>

                        <section className="bg-white dark:bg-black p-6 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800">
                            <h3 className="font-bold text-slate-500 uppercase text-xs tracking-wider mb-4">Quick Actions</h3>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors">
                                    <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center"><Settings size={16} /></div>
                                    <span className="text-sm font-medium">Account Settings</span>
                                </li>
                                <li className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors">
                                    <div className="w-8 h-8 rounded bg-purple-100 text-purple-600 flex items-center justify-center"><User size={16} /></div>
                                    <span className="text-sm font-medium">Verify Identity (KYC)</span>
                                </li>
                            </ul>
                        </section>
                    </div>
                </div>

                {/* Family Resources / Shared Household Section (New) */}
                {familyMembers.length > 0 && <FamilyResources members={familyMembers} />}

                {/* Jeevan Setu - Life Cycle AI (New) */}
                {familyMembers.length > 0 && <JeevanSetu members={familyMembers} />}

                {/* GRIEVANCE FILING MODAL */}
                {showGrievanceModal && (
                    <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl p-6 shadow-2xl border border-red-100 dark:border-red-900 relative max-h-[90vh] overflow-y-auto">
                            <button
                                onClick={() => setShowGrievanceModal(false)}
                                className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                            >
                                <LogOut className="rotate-180" size={20} />
                            </button>

                            <h3 className="text-xl font-bold mb-1 flex items-center gap-2 text-rose-600">
                                <Siren size={24} /> Report Public Grievance
                            </h3>
                            <p className="text-sm text-slate-500 mb-6">Directly link your issue to the District War Room.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Column: Details */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Issue Type</label>
                                        <select
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-medium outline-none focus:border-rose-500 transition-colors"
                                            value={grievanceType}
                                            onChange={(e) => setGrievanceType(e.target.value)}
                                        >
                                            <option value="Infrastructure">🚧 Infrastructure / Road</option>
                                            <option value="Water">💧 Water Supply</option>
                                            <option value="Electricity">⚡ Electricity</option>
                                            <option value="Sanitation">🗑️ Sanitation / Garbage</option>
                                            <option value="Safety">🛡️ Public Safety</option>
                                            <option value="Other">📝 Other</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Description</label>
                                        <textarea
                                            className="w-full h-32 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-medium outline-none focus:border-rose-500 transition-colors resize-none"
                                            placeholder="Describe the issue in detail..."
                                            value={grievanceText}
                                            onChange={(e) => setGrievanceText(e.target.value)}
                                        ></textarea>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Evidence</label>
                                        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center text-slate-400 hover:border-rose-500 hover:text-rose-500 transition-colors cursor-pointer bg-slate-50 dark:bg-slate-800/50">
                                            <FileText size={24} className="mb-2" />
                                            <span className="text-xs font-bold">Click to Upload Photo</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Location Hierarchy */}
                                <div className="space-y-4">
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-1"><MapPin size={12} /> Specific Location</h4>

                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">State</label>
                                                <select className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs outline-none" id="g_state">
                                                    <option>Delhi</option>
                                                    <option>Maharashtra</option>
                                                    <option>Karnataka</option>
                                                    <option>Kerala</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">District</label>
                                                <select className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs outline-none" id="g_district">
                                                    <option>New Delhi</option>
                                                    <option>North Delhi</option>
                                                    <option>South Delhi</option>
                                                </select>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Taluk/Block</label>
                                                    <input type="text" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs outline-none" defaultValue="Connaught Place" id="g_taluk" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Panchayat/Zone</label>
                                                    <input type="text" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs outline-none" defaultValue="Zone 1" id="g_panchayat" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Ward Number</label>
                                                <input type="text" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs outline-none" defaultValue="Ward 42" id="g_ward" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30 flex gap-2">
                                        <Shield size={20} className="text-blue-600 shrink-0" />
                                        <p className="text-[10px] text-blue-800 dark:text-blue-200 leading-tight">
                                            Your grievance will be geo-tagged and routed to the correct jurisdiction officer automatically.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <button
                                    onClick={() => {
                                        setIsSubmittingGrievance(true);

                                        // Capture Values
                                        const state = (document.getElementById('g_state') as HTMLSelectElement).value;
                                        const district = (document.getElementById('g_district') as HTMLSelectElement).value;
                                        const taluk = (document.getElementById('g_taluk') as HTMLInputElement).value;
                                        const panchayat = (document.getElementById('g_panchayat') as HTMLInputElement).value;
                                        const ward = (document.getElementById('g_ward') as HTMLInputElement).value;

                                        // Persist
                                        GrievanceStore.add({
                                            userId: user?.username || 'Citizen',
                                            userName: user?.username || 'Verified User',
                                            type: grievanceType === 'Infrastructure' || grievanceType === 'Safety' ? 'CRITICAL' : 'NORMAL',
                                            category: grievanceType,
                                            description: grievanceText,
                                            location: {
                                                lat: 28.61 + (Math.random() * 0.05), // Mock variation
                                                lng: 77.20 + (Math.random() * 0.05),
                                                state, district, taluk, panchayat, ward
                                            },
                                            evidenceUrl: 'https://images.unsplash.com/photo-1541844053-a3d53f638124?auto=format&fit=crop&q=80&w=200'
                                        });

                                        setTimeout(() => {
                                            setIsSubmittingGrievance(false);
                                            setShowGrievanceModal(false);
                                            setGrievanceText('');
                                            alert(`Grievance Reported Successfully! \nTrack ID generated. \nSent to: ${ward}, ${state} War Room.`);
                                        }, 1000);
                                    }}
                                    disabled={!grievanceText || isSubmittingGrievance}
                                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-rose-500/20 active:scale-[0.98] transition-all"
                                >
                                    {isSubmittingGrievance ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Submit Report to War Room</>}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
