import React, { useState } from 'react';

import { useAuth } from '../context/AuthContext';
import { User, Lock, Activity, Globe } from 'lucide-react';
import { api } from '../services/api';

const Login = () => {
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [role, setRole] = useState<'citizen' | 'admin'>('citizen');
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ username: '', password: '', email: '' });
    const [error, setError] = useState('');

    const { login } = useAuth(); // Assuming this context updates global state




    // REMOVED: Do not clear localStorage here. It causes race conditions if the router bounces back.
    // The AuthContext logout() handles cleanup sufficently.

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Explicitly clear any stale token before attempting new login/signup
            // This ensures the interceptor doesn't attach an invalid token
            localStorage.removeItem('token');

            let response;
            if (mode === 'signup') {
                response = await api.auth.signup({ ...formData, role });
                // Auto-login after signup
                setMode('login');
                setError('Account created! Please login.');
                setLoading(false);
                return;
            } else {
                response = await api.auth.login(formData);
            }

            // Login Success
            login(response.access_token, response.role);

            // If admin login, mark session as verified
            if (response.role === 'admin') {
                sessionStorage.setItem('admin_verified', 'true');
            }

            // Small delay to ensure localStorage writes complete
            setTimeout(() => {
                // Use Hard Reload to enter the app. This ensures all state is fresh and valid.
                if (response.role === 'admin') {
                    window.location.href = '/admin';
                } else {
                    window.location.href = '/';
                }
            }, 100);
        } catch (err: any) {
            console.error("Login Error:", err);
            const msg = err.response?.data?.detail || err.message || 'Authentication Failed';
            let finalMsg = `Login Failed: ${msg}`;

            if (msg.includes('Network Error')) {
                finalMsg += " (Hint: The backend may be stuck. Run 'clean_start_backend.bat' to fix)";
            }

            setError(finalMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Holographic Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] animate-pulse delay-700"></div>
                <div className="absolute inset-0 bg-white/5 opacity-10"></div>
            </div>

            <div className="relative z-10 w-full max-w-4xl grid md:grid-cols-2 gap-0 overflow-hidden rounded-2xl shadow-2xl border border-slate-800 backdrop-blur-xl bg-slate-900/60">

                {/* Left Side: Visuals */}
                <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-slate-900 to-slate-900/50 border-r border-slate-800">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                <Globe className="text-blue-400" size={20} />
                            </div>
                            <span className="text-xl font-bold tracking-wider text-slate-100">CITIZEN.OS</span>
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-4">
                            {role === 'admin' ? 'Command Function' : 'Citizen Access'}
                        </h2>
                        <p className="text-slate-400 leading-relaxed">
                            {role === 'admin'
                                ? "Secure terminal for policy oversight and demographic analysis. Authorized personnel only."
                                : "Access your digital rights, review active policies, and view your impact score in real-time."}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                            <Activity size={16} className="text-green-500" />
                            <span>System Status: Operational</span>
                        </div>
                        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500/50 w-2/3 animate-pulse"></div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="p-12 flex flex-col justify-center">
                    {/* Role Toggles */}
                    <div className="flex mb-8 bg-slate-800/50 p-1 rounded-lg">
                        <button
                            onClick={() => setRole('citizen')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${role === 'citizen' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            Citizen
                        </button>
                        <button
                            onClick={() => setRole('admin')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${role === 'admin' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            Official
                        </button>
                    </div>

                    <div className="text-center mb-8">
                        <h3 className="text-2xl font-bold text-white mb-2">
                            {mode === 'login' ? 'Welcome Back' : 'Initialize Identity'}
                        </h3>
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm mb-4 break-words">
                                {error}
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="relative group">
                            <User className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Username"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                                required
                            />
                        </div>

                        {mode === 'signup' && (
                            <div className="relative group">
                                <Globe className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                                    required
                                />
                            </div>
                        )}

                        <div className="relative group">
                            <Lock className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                            <input
                                type="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3.5 rounded-xl font-bold tracking-wide transition-all transform active:scale-[0.98] ${role === 'admin'
                                ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-900/20'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-900/20'
                                }`}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Processing...
                                </span>
                            ) : (
                                mode === 'login' ? 'Authenticate' : 'Create Digital ID'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                            className="text-slate-400 hover:text-white text-sm transition-colors"
                        >
                            {mode === 'login' ? "Need a digital ID? Initialize here" : "Already have an ID? Authenticate"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
