import { useState } from "react";
import Navbar from "../components/Navbar";
import { evaluateScheme } from "../services/api";

export default function Schemes() {
    const [state, setState] = useState("");
    const [occupation, setOccupation] = useState("");
    const [income, setIncome] = useState("");
    const [result, setResult] = useState<null | {
        status: string;
        reason: string;
    }>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleCheck = async () => {
        setLoading(true);
        setError("");
        setResult(null);

        try {
            const data = await evaluateScheme(1, {
                state,
                occupation,
                income: income ? Number(income) : undefined,
            });
            setResult(data);
        } catch {
            setError("Unable to check scheme eligibility right now (Port 8001?).");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar />
            <div className="max-w-4xl mx-auto mt-12 px-4">
                <h1 className="text-2xl font-semibold text-gray-800">
                    Scheme Eligibility Checker
                </h1>

                <div className="mt-6 bg-white border rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                            className="border rounded px-3 py-2"
                            placeholder="State"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                        />
                        <input
                            className="border rounded px-3 py-2"
                            placeholder="Occupation"
                            value={occupation}
                            onChange={(e) => setOccupation(e.target.value)}
                        />
                        <input
                            className="border rounded px-3 py-2"
                            placeholder="Annual Income (optional)"
                            value={income}
                            onChange={(e) => setIncome(e.target.value)}
                        />
                    </div>

                    <button
                        className="mt-6 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                        onClick={handleCheck}
                        disabled={!state || !occupation || loading}
                    >
                        {loading ? "Checking..." : "Check Eligibility"}
                    </button>

                    {result && (
                        <div className="mt-6 border rounded p-4 bg-gray-50">
                            <p className="font-semibold">
                                Status:{" "}
                                <span className={
                                    result.status === "Eligible" ? "text-green-700" :
                                        result.status === "Not Eligible" ? "text-red-700" : "text-yellow-700"
                                }>{result.status}</span>
                            </p>
                            <p className="mt-2 text-gray-700">{result.reason}</p>
                        </div>
                    )}

                    {error && (
                        <div className="mt-6 text-red-600 text-sm">{error}</div>
                    )}

                    <div className="mt-6 text-sm text-gray-500">
                        * Eligibility is indicative and subject to official government verification.
                    </div>
                </div>
            </div>
        </>
    );
}
