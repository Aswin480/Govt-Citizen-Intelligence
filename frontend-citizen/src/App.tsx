import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { lazy, Suspense } from 'react';
import { Layout } from './components/Layout';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Schemes = lazy(() => import('./pages/Schemes'));
const Citizens = lazy(() => import('./pages/CitizenRegistry'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/Login'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const AdminCommandCenter = lazy(() => import('./pages/AdminCommandCenter'));
const AdminNewsEditor = lazy(() => import('./pages/AdminNewsEditor'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const MemberProfilePage = lazy(() => import('./pages/MemberProfilePage').then(module => ({ default: module.MemberProfilePage })));
const ConstitutionExplorer = lazy(() => import('./pages/ConstitutionExplorer'));
const News = lazy(() => import('./pages/News'));
const NewspaperEdition = lazy(() => import('./pages/NewspaperEdition'));
const Budget = lazy(() => import('./pages/Budget'));

import { AuthProvider, useAuth } from './context/AuthContext';
import { GovernanceScopeProvider } from './context/GovernanceScopeContext';
import { ConstitutionProvider } from './context/ConstitutionContext';
import { ConfigProvider } from './context/ConfigContext';
import { GodModeEditor } from './components/GodModeEditor';
import { BroadcastOverlay } from './components/BroadcastOverlay';
import { SyncTransition } from './components/SyncTransition';
import { StyleLoader } from './components/StyleLoader';
import { NexusVisualizer } from './components/NexusVisualizer';

// Create a client
const queryClient = new QueryClient();

// Protected Route Wrapper
const ProtectedRoute = () => {
    const { isAuthenticated } = useAuth();
    // Fallback to localStorage to prevent race conditions during immediate login redirect
    const hasToken = !!localStorage.getItem('token');
    return (isAuthenticated || hasToken) ? <Layout><Outlet /></Layout> : <Navigate to="/login" replace />;
};

// Admin Route Wrapper - Requires authentication AND admin role
const AdminRoute = () => {
    const { isAuthenticated, role } = useAuth();
    const hasToken = !!localStorage.getItem('token');
    const storedRole = localStorage.getItem('role');

    // Check if user is authenticated
    if (!isAuthenticated && !hasToken) {
        return <Navigate to="/login" replace />;
    }

    // Check if user has admin role - STRICT CHECK
    // User must have admin role in BOTH context AND localStorage
    const currentRole = role || storedRole;
    if (currentRole !== 'admin') {
        // Non-admin user trying to access admin panel
        console.warn('Access denied: User role is', currentRole, 'but admin required');
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <GovernanceScopeProvider>
                    <ConstitutionProvider>
                        <ConfigProvider>
                            <Suspense fallback={<div className="p-8 text-center">Loading page...</div>}>
                                <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                                    <Routes>
                                    <Route path="/login" element={<Login />} />
                                    <Route path="/onboarding" element={<Onboarding />} />

                                    {/* Admin Routes - Requires admin role */}
                                    <Route element={<AdminRoute />}>
                                        <Route path="/admin" element={<AdminCommandCenter />} />
                                        <Route path="/admin/news-editor" element={<AdminNewsEditor />} />
                                        <Route path="/admin/nexus" element={<div className="h-screen bg-black pt-16"><NexusVisualizer /></div>} />
                                    </Route>

                                    {/* Protected Routes */}
                                    <Route element={<ProtectedRoute />}>
                                        <Route path="/" element={<Dashboard />} />
                                        <Route path="/citizens" element={<Citizens />} />
                                        <Route path="/schemes" element={<Schemes />} />
                                        <Route path="/budget" element={<Budget />} />
                                        <Route path="/news" element={<News />} />
                                        <Route path="/newspaper" element={<NewspaperEdition />} />
                                        <Route path="/my-portal" element={<UserDashboard />} />
                                        <Route path="/settings" element={<Settings />} />
                                        <Route path="/member/:id" element={<MemberProfilePage />} />
                                        <Route path="/constitution" element={<ConstitutionExplorer />} />
                                    </Route>

                                    {/* Fallback */}
                                    <Route path="*" element={<Navigate to="/" replace />} />
                                </Routes>
                                <GodModeEditor />
                                <BroadcastOverlay />
                                <SyncTransition />
                                <StyleLoader />
                            </Router>
                            </Suspense>
                        </ConfigProvider>
                    </ConstitutionProvider>
                </GovernanceScopeProvider>
            </AuthProvider>
        </QueryClientProvider>
    );
}

export default App;
