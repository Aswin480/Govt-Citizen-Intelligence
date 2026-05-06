import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import * as Sentry from "@sentry/react";

// Initialize preferences on page load
if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
} else {
    document.documentElement.classList.remove('dark');
}

if (localStorage.getItem('compactView') === 'true') {
    document.documentElement.classList.add('compact-view');
}

// Initialize Sentry (if DSN is provided)
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
if (SENTRY_DSN) {
    Sentry.init({
        dsn: SENTRY_DSN,
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration(),
        ],
        tracesSampleRate: 0.1, // Trace 10% of transactions
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
    });
    console.log("✅ Sentry Frontend Monitoring Initialized");
} else {
    console.log("⚠️ Sentry DSN not found. Error monitoring disabled.");
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <App />,
)
