import Navbar from "../components/Navbar";
import { useLanguage } from "../context/LanguageContext";
import { Link } from "react-router-dom";

export default function Home() {
    const { t } = useLanguage();

    return (
        <>
            <Navbar />
            <div className="bg-gradient-to-b from-blue-50 to-white min-h-screen">
                {/* Hero Section */}
                <div className="max-w-6xl mx-auto pt-20 px-6 text-center">
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
                        Citizen Policy Intelligence
                    </span>
                    <h1 className="mt-6 text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
                        {t("home.title")}
                    </h1>
                    <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
                        {t("home.subtitle")}
                    </p>

                    <div className="mt-10 flex flex-wrap justify-center gap-4">
                        <Link to="/schemes">
                            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition shadow-lg shadow-blue-600/20">
                                {t("scheme.check_btn")}
                            </button>
                        </Link>
                        <Link to="/policy-impact">
                            <button className="bg-white text-gray-700 border border-gray-300 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition">
                                {t("policy.check_btn")}
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Feature Grid */}
                <div className="max-w-6xl mx-auto mt-24 px-6 pb-20">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Card 1: Schemes */}
                        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 hover:shadow-2xl transition duration-300">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                                <span className="text-2xl">🌾</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{t("scheme.title")}</h3>
                            <p className="text-gray-600">
                                Find government benefits like PM-KISAN, Student Scholarships, and Health Cover that match your profile.
                            </p>
                            <div className="mt-4 text-green-600 font-medium text-sm">Targeted &bull; Realtime</div>
                        </div>

                        {/* Card 2: Policy */}
                        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 hover:shadow-2xl transition duration-300">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                                <span className="text-2xl">⚖️</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{t("policy.title")}</h3>
                            <p className="text-gray-600">
                                AI-driven analysis of Bills and Acts. Understand the "Who, What, Why" before you react.
                            </p>
                            <div className="mt-4 text-purple-600 font-medium text-sm">Neutral &bull; Explainable</div>
                        </div>

                        {/* Card 3: Posters */}
                        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 hover:shadow-2xl transition duration-300">
                            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                                <span className="text-2xl">🎨</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Visual Summaries</h3>
                            <p className="text-gray-600">
                                Generate shareable, fact-checked infographic posters to combat misinformation in your community.
                            </p>
                            <div className="mt-4 text-orange-600 font-medium text-sm">Shareable &bull; Verified</div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
