import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
    "Uttarakhand", "West Bengal", "Delhi"
];

// Helper to get display name for language button
const getLangName = (code: string | null) => {
    switch (code) {
        case 'ta': return 'தமிழ்';
        case 'ml': return 'മലയാളം';
        case 'te': return 'తెలుగు';
        case 'kn': return 'ಕನ್ನಡ';
        case 'bn': return 'বাংলা';
        case 'mr': return 'मराठी';
        case 'gu': return 'ગુજરાતી';
        case 'pa': return 'ਪੰਜਾਬੀ';
        case 'hi': return 'हिन्दी';
        default: return 'Regional';
    }
};

export default function Navbar() {
    const { t, setLanguage, language, userState, setUserState, regionalLangCode } = useLanguage();

    return (
        <nav className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col">
                <span className="font-semibold text-gray-800 text-lg">
                    Citizen Policy Intelligence
                </span>
                <span className="text-xs text-gray-500">
                    GovTech Solution
                </span>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-700 overflow-x-auto w-full md:w-auto">
                <Link to="/" className="hover:text-blue-600 whitespace-nowrap">
                    {t("nav.home")}
                </Link>
                <Link to="/policy-impact" className="hover:text-blue-600 whitespace-nowrap">
                    {t("nav.policy_impact")}
                </Link>
                <Link to="/schemes" className="hover:text-blue-600 whitespace-nowrap">
                    {t("nav.schemes")}
                </Link>
                <Link to="/posters" className="hover:text-blue-600 whitespace-nowrap">
                    {t("nav.posters")}
                </Link>
                <Link to="/transparency" className="hover:text-blue-600 whitespace-nowrap">
                    {t("nav.transparency")}
                </Link>
            </div>

            <div className="flex flex-col items-end gap-2">
                {/* State Selector */}
                <select
                    value={userState}
                    onChange={(e) => setUserState(e.target.value)}
                    className="text-xs border rounded px-2 py-1 bg-gray-50 text-gray-700 outline-none focus:border-blue-500"
                >
                    {INDIAN_STATES.map(state => (
                        <option key={state} value={state}>{state}</option>
                    ))}
                </select>

                {/* Language Toggle Row */}
                <div className="flex gap-2">
                    {/* 1. English (Always) */}
                    <button
                        onClick={() => setLanguage('en')}
                        className={`px-2 py-1 rounded text-xs font-bold ${language === 'en' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                        EN
                    </button>

                    {/* 2. Hindi (Always) */}
                    <button
                        onClick={() => setLanguage('hi')}
                        className={`px-2 py-1 rounded text-xs font-bold ${language === 'hi' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                        हिन्दी
                    </button>

                    {/* 3. Regional (Dynamic based on State) */}
                    {regionalLangCode !== 'hi' && regionalLangCode !== 'en' && (
                        <button
                            onClick={() => setLanguage(regionalLangCode!)}
                            className={`px-2 py-1 rounded text-xs font-bold ${language === regionalLangCode ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        >
                            {getLangName(regionalLangCode)}
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
}
