import { useState } from "react";
import Navbar from "../components/Navbar";
import { generatePolicyPoster } from "../services/api";

export default function Posters() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [posterPath, setPosterPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setPosterPath(null);

    try {
      const data = await generatePolicyPoster(title, description);
      setPosterPath(data.poster_path);
    } catch {
      setError("Unable to generate poster at the moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto mt-12 px-4">
        <h1 className="text-2xl font-semibold text-gray-800">
          Policy Visual Summary
        </h1>

        {/* Explain-before-react */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="font-semibold text-blue-800">
            Before You React
          </h2>
          <ul className="mt-3 text-sm text-blue-700 list-disc ml-5 space-y-2">
            <li>Understand what the policy discusses.</li>
            <li>Check whether it applies to you.</li>
            <li>Verify details using official government sources.</li>
          </ul>
        </div>

        {/* Input */}
        <div className="mt-6 bg-white border rounded-lg p-6">
          <input
            className="w-full border rounded px-3 py-2 mb-4"
            placeholder="Policy title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="w-full border rounded px-3 py-2"
            placeholder="Short policy description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <button
            className="mt-4 bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
            onClick={handleGenerate}
            disabled={!title || !description || loading}
          >
            {loading ? "Generating..." : "Generate Poster"}
          </button>
        </div>

        {/* Poster */}
        {posterPath && (
          <div className="mt-8">
            <h2 className="font-semibold text-gray-800 mb-4">
              Generated Poster
            </h2>
            {/* Using Port 8001 as that's where I'm running backend */}
            <img
              src={`http://127.0.0.1:8001/${posterPath}`}
              alt="Policy Poster"
              className="border rounded shadow"
            />
          </div>
        )}

        {error && (
          <div className="mt-6 text-red-600 text-sm">{error}</div>
        )}

        <div className="mt-8 text-sm text-gray-500">
          * Visual summaries are informational and not an official government notice.
        </div>
      </div>
    </>
  );
}
