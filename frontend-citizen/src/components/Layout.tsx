import React from 'react';
import { LayoutDashboard, Users, FileText, Settings, Bell, Menu, LogOut, Newspaper, Landmark, Scale, Map, Sun, Moon } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { AlertTicker } from './AlertTicker';
import { GovernanceToggle } from './GovernanceToggle';
import DynamicRenderer from './DynamicRenderer';
import { ErrorBoundary } from './ErrorBoundary';


export const Layout: React.FC<{
    children: React.ReactNode;
    className?: string;
    onAdminNavigate?: (page: string) => void;
    currentAdminPage?: string;
}> = ({ children, className, onAdminNavigate, currentAdminPage }) => {
    const location = useLocation();
    const { user, logout } = useAuth(); // Importing logout function
    const [isProfileMenuOpen, setIsProfileMenuOpen] = React.useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
    const [isDarkMode, setIsDarkMode] = React.useState(() => {
        if (typeof window !== 'undefined') {
            return document.documentElement.classList.contains('dark') ||
                (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
        return false;
    });

    React.useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    const toggleTheme = () => setIsDarkMode(!isDarkMode);

    // Helper to determine if a link is active (Admin Mode vs Normal Mode)
    const isLinkActive = (path: string) => {
        if (onAdminNavigate && currentAdminPage) {
            return currentAdminPage === path;
        }
        return location.pathname === path;
    };

    return (
        <div className={cn("flex h-screen bg-[var(--color-bg-app)] overflow-hidden", className)}>
            {/* Sidebar */}
            <aside className="w-64 bg-[var(--color-gov-navy-900)] text-white hidden md:flex flex-col shadow-2xl z-20">
                <div className="p-6 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[var(--color-gov-amber-500)] rounded-lg flex items-center justify-center font-bold text-slate-900 text-xl shadow-lg shadow-amber-500/50">
                            G
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight text-white leading-none">GOV.ONE</h1>
                            <span className="text-xs text-slate-400 uppercase tracking-widest">Citizen Portal</span>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <NavItem
                        to="/"
                        icon={<LayoutDashboard size={20} />}
                        label="Overview"
                        isActive={isLinkActive('/')}
                        onClick={onAdminNavigate ? () => onAdminNavigate('/') : undefined}
                    />
                    <NavItem
                        to="/my-portal"
                        icon={<Users size={20} />}
                        label="My Portal"
                        isActive={isLinkActive('/my-portal')}
                        onClick={onAdminNavigate ? () => onAdminNavigate('/my-portal') : undefined}
                    />
                    <NavItem
                        to="/state"
                        icon={<Landmark size={20} />}
                        label="State Dashboard"
                        isActive={isLinkActive('/state')}
                        onClick={onAdminNavigate ? () => onAdminNavigate('/state') : undefined}
                    />
                    <NavItem
                        to="/citizens"
                        icon={<Scale size={20} />}
                        label="Constitution"
                        isActive={isLinkActive('/citizens')}
                        onClick={onAdminNavigate ? () => onAdminNavigate('/citizens') : undefined}
                    />
                    <NavItem
                        to="/schemes"
                        icon={<FileText size={20} />}
                        label="Schemes"
                        isActive={isLinkActive('/schemes')}
                        onClick={onAdminNavigate ? () => onAdminNavigate('/schemes') : undefined}
                    />
                    <NavItem
                        to="/budget"
                        icon={<Landmark size={20} />}
                        label="Budget"
                        isActive={isLinkActive('/budget')}
                        onClick={onAdminNavigate ? () => onAdminNavigate('/budget') : undefined}
                    />
                    <NavItem
                        to="/news"
                        icon={<Newspaper size={20} />}
                        label="News"
                        isActive={isLinkActive('/news')}
                        onClick={onAdminNavigate ? () => onAdminNavigate('/news') : undefined}
                    />
                    <NavItem
                        to="/settings"
                        icon={<Settings size={20} />}
                        label="Settings"
                        isActive={isLinkActive('/settings')}
                        onClick={onAdminNavigate ? () => onAdminNavigate('/settings') : undefined}
                    />

                    {user?.role === 'admin' && (
                        <NavItem
                            to="/admin/nexus"
                            icon={<Map size={20} />}
                            label="Nexus Graph"
                            isActive={isLinkActive('/admin/nexus')}
                            onClick={() => window.location.href = '/admin/nexus'}
                        />
                    )}
                </nav>

                <div className="p-4 border-t border-slate-700">
                    <div className="bg-slate-800/50 rounded-lg p-4">
                        <div className="text-xs text-slate-400 font-medium mb-2">SYSTEM STATUS</div>
                        <div className="flex items-center gap-2 text-sm text-[var(--color-gov-amber-400)]">
                            <span className="w-2 h-2 rounded-full bg-[var(--color-gov-amber-500)] animate-pulse shadow-[0_0_10px_var(--color-gov-amber-500)]"></span>
                            Secure Connection
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Alert Ticker */}
                <ErrorBoundary>
                    <AlertTicker />
                </ErrorBoundary>

                {/* Header */}
                <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 z-50 sticky top-0">
                    <div className="flex items-center gap-4">
                        <button className="md:hidden text-slate-500 hover:text-slate-700">
                            <Menu size={24} />
                        </button>
                        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Dashboard</h2>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Scope Toggle - Visible on all pages within Layout */}
                        <ErrorBoundary>
                            <GovernanceToggle />
                        </ErrorBoundary>

                        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>

                        <button
                            onClick={toggleTheme}
                            className="p-2 text-slate-400 hover:text-[var(--color-gov-amber-500)] transition-colors"
                        >
                            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                className="relative p-2 text-slate-400 hover:text-[var(--color-gov-amber-500)] transition-colors"
                            >
                                <Bell size={20} />
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                            </button>
                            {isNotificationsOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)}></div>
                                    <div className="absolute right-0 top-12 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                                        <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Notifications</p>
                                        </div>
                                        <div className="p-2 space-y-2 max-h-64 overflow-y-auto">
                                            <div className="p-2 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/50">
                                                <p className="text-xs font-bold text-amber-800 dark:text-amber-500">System Alert</p>
                                                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">Platform updated to v3.0 successfully.</p>
                                            </div>
                                            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">New Policy Open</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review the latest AI policy changes.</p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="relative">
                            <button
                                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                className="flex items-center gap-3 pl-2 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-lg transition-all duration-200"
                            >
                                <div className="text-right hidden md:block">
                                    <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{user?.username || "Citizen"}</div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user?.role || "GUEST"}</div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden ring-2 ring-transparent group-hover:ring-[var(--color-gov-amber-500)]">
                                    <img
                                        src={user?.profile_pic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'User'}`}
                                        alt="User"
                                    />
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            {isProfileMenuOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsProfileMenuOpen(false)}
                                    ></div>
                                    <div className="absolute right-0 top-14 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                                        <div className="p-3 border-b border-slate-100 dark:border-slate-800 mb-2">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Signed in as</p>
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{user?.username}</p>
                                        </div>

                                        <button
                                            onClick={() => {
                                                logout();
                                                setIsProfileMenuOpen(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors group"
                                        >
                                            <LogOut size={16} className="group-hover:scale-110 transition-transform" />
                                            Sign Out safely
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                    {/* Dynamic Header Area (Page Builder) */}


                    {children}
                </div>
            </main>
        </div>
    );
};

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    to: string;
    isActive: boolean;
    onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, to, isActive, onClick }) => {
    // If onClick is present, act as a button (Admin Preview Mode)
    if (onClick) {
        return (
            <button
                onClick={(e) => {
                    e.preventDefault();
                    onClick();
                }}
                className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group text-left",
                    isActive
                        ? 'bg-[var(--color-gov-amber-500)] text-slate-900 font-bold shadow-lg shadow-amber-500/20'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                )}
            >
                <span className={isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-white transition-colors'}>
                    {icon}
                </span>
                {label}
            </button>
        );
    }

    // Default NavLink behavior (User Mode)
    return (
        <NavLink to={to} end={to === '/'} className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
            isActive
                ? 'bg-[var(--color-gov-amber-500)] text-slate-900 font-bold shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        )}>
            <span className={isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-white transition-colors'}>
                {icon}
            </span>
            {label}
        </NavLink>
    );
};
