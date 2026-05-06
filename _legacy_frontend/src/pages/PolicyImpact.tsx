import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { evaluatePolicy } from "../services/api";

export default function PolicyImpact() {
    const [state, setState] = useState("");
    const [occupation, setOccupation] = useState("");
    const [result, setResult] = useState<null | {
        impact: string;
        reason: string;
    }>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleCheck = async (silent = false) => {
        if (!silent) setLoading(true);
        setError("");

        try {
            // Hardcoded policy ID 1 for demonstration (requires seeding)
            const data = await evaluatePolicy(1, {
                state,
                occupation,
            });
            setResult(data);
        } catch (err) {
            console.error(err);
            if (!silent) setError("Unable to evaluate policy. (Make sure backend is running on 8001)");
        } finally {
            if (!silent) setLoading(false);
        }
    };

    // --- REAL-TIME AUTO-REFRESH (Step 24B) ---
    // Polls the backend every 15 seconds to check if policy impact rules changed
    // (e.g., if new amendments were ingested)
    useEffect(() => {
        let cleanup: (() => void) | undefined;

        if (state && occupation && result) {
            const interval = setInterval(() => {
                console.log("⚡ Auto-Refreshing Policy Impact...");
                handleCheck(true); // Silent refresh
            }, 15000);
            cleanup = () => clearInterval(interval);
        }

        return () => {
            if (cleanup) cleanup();
        };
    }, [state, occupation, result]);
    // ------------------------------------------

    return (
        <>
            <Navbar />
            <div className="max-w-4xl mx-auto mt-12 px-4">
                <h1 className="text-2xl font-semibold text-gray-800">
                    Does This Policy Affect Me?
                </h1>

                <div className="mt-6 bg-white border rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            className="border rounded px-3 py-2"
                            placeholder="State (e.g., Tamil Nadu)"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                        />
                        <input
                            className="border rounded px-3 py-2"
                            placeholder="Occupation (e.g., student)"
                            value={occupation}
                            onChange={(e) => setOccupation(e.target.value)}
                        />
                    </div>

                    <button
                        className="mt-6 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                        onClick={handleButtonClick}
                        disabled={!state || !occupation || loading}
                    >
                        {loading ? "Checking..." : "Check Policy Impact"}
                    </button>

                    {result && (
                        <div className="mt-6 border rounded p-4 bg-gray-50">
                            <p className="font-semibold">
                                Impact:{" "}
                                <span className={result.impact === "YES" ? "text-green-700" : "text-red-700"}>
                                    {result.impact}
                                </span>
                            </p>
                            <p className="mt-2 text-gray-700">{result.reason}</p>
                        </div>
                    )}

                    {error && (
                        <div className="mt-6 text-red-600 text-sm">{error}</div>
                    )}

                    <div className="mt-6 text-sm text-gray-500">
                        * Results are indicative and subject to official verification.
                    </div>
                </div>
            </div>
        </>
    );
}
