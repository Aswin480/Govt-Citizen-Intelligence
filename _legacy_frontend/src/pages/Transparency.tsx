import Navbar from "../components/Navbar";

export default function Transparency() {
    return (
        <>
            <Navbar />
            <div className="max-w-4xl mx-auto mt-12 px-4">
                <h1 className="text-2xl font-semibold text-gray-800">
                    Ethics & Transparency
                </h1>

                <div className="mt-6 space-y-6 text-gray-700">
                    <section>
                        <h2 className="font-semibold">Purpose</h2>
                        <p>
                            This platform helps citizens understand parliamentary discussions,
                            public policies, and government schemes using neutral and explainable
                            AI techniques.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-semibold">Data Sources</h2>
                        <ul className="list-disc ml-5">
                            <li>Official parliamentary transcripts</li>
                            <li>Public government policy documents</li>
                            <li>Published government scheme guidelines</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="font-semibold">Privacy</h2>
                        <p>
                            No Aadhaar numbers, IDs, or sensitive personal data are collected.
                            User inputs are optional and used only to provide indicative insights.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-semibold">Limitations</h2>
                        <p>
                            All results are informational. Final eligibility and policy decisions
                            depend on official government verification.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-semibold">Neutrality</h2>
                        <p>
                            The system does not support or oppose any political party or ideology.
                            Visuals and explanations are designed to avoid emotional influence.
                        </p>
                    </section>
                </div>
            </div>
        </>
    );
}
