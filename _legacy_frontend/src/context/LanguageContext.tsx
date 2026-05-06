import { createContext, useState, useContext, ReactNode, useEffect } from 'react';

type Language = 'en' | 'hi' | 'ta' | 'ml' | 'te' | 'kn' | 'bn' | 'mr' | 'gu' | 'pa';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    userState: string;
    setUserState: (state: string) => void;
    regionalLangCode: Language | null;
    t: (key: string) => string;
}

// State to Language Map
const stateToLangMap: Record<string, Language> = {
    "Tamil Nadu": "ta",
    "Kerala": "ml",
    "Andhra Pradesh": "te",
    "Telangana": "te",
    "Karnataka": "kn",
    "West Bengal": "bn",
    "Maharashtra": "mr",
    "Gujarat": "gu",
    "Punjab": "pa",
    // Default to Hindi for others for this demo (or could be 'en')
    "Delhi": "hi",
    "Uttar Pradesh": "hi",
    "Bihar": "hi"
};

const translations: Record<Language, Record<string, string>> = {
    en: {
        "nav.home": "Home",
        "nav.policy_impact": "Policy Impact",
        "nav.schemes": "Schemes",
        "nav.posters": "Posters",
        "nav.transparency": "Transparency",
        "home.title": "Understand Policies That Affect You",
        "home.subtitle": "This platform helps citizens understand parliamentary discussions, policy impacts, and government schemes in a clear and neutral way.",
        "select_state": "Select State"
    },
    hi: {
        "nav.home": "होम",
        "nav.policy_impact": "नीति प्रभाव",
        "nav.schemes": "योजनाएं",
        "nav.posters": "पोस्टर",
        "nav.transparency": "पारदर्शिता",
        "home.title": "उन नीतियों को समझें",
        "home.subtitle": "यह मंच नागरिकों को संसदीय चर्चाओं और सरकारी योजनाओं को स्पष्ट तरीके से समझने में मदद करता है।",
        "select_state": "राज्य चुनें"
    },
    ta: {
        "nav.home": "முகப்பு",
        "nav.policy_impact": "கொள்கை தாக்கம்",
        "nav.schemes": "திட்டங்கள்",
        "nav.posters": "சுவரொட்டிகள்",
        "nav.transparency": "வெளிப்படைத்தன்மை",
        "home.title": "உங்களை பாதிக்கும் கொள்கைகள்",
        "home.subtitle": "இந்த தளம் குடிமக்கள் பாராளுமன்ற விவாதங்கள் மற்றும் அரசாங்க திட்டங்களை புரிந்து கொள்ள உதவுகிறது.",
        "select_state": "மாநிலத்தைத் தேர்ந்தெடுக்கவும்"
    },
    ml: {
        "nav.home": "ഹോം",
        "nav.policy_impact": "നയപരമായ സ്വാധീനം",
        "nav.schemes": "പദ്ധതികൾ",
        "nav.posters": "പോസ്റ്ററുകൾ",
        "nav.transparency": "സുതാര്യത",
        "home.title": "നിങ്ങളെ ബാധിക്കുന്ന നയങ്ങൾ മനസ്സിലാക്കുക",
        "home.subtitle": "പാർലമെന്ററി ചർച്ചകളും സർക്കാർ പദ്ധതികളും വ്യക്തമായി മനസ്സിലാക്കാൻ ഈ പ്ലാറ്റ്ഫോം സഹായിക്കുന്നു.",
        "select_state": "സംസ്ഥാനം തിരഞ്ഞെടുക്കുക"
    },
    te: {
        "nav.home": "హోమ్",
        "nav.policy_impact": "విధాన ప్రభావం",
        "nav.schemes": "పథకాలు",
        "nav.posters": "పోస్టర్లు",
        "nav.transparency": "పారదర్శకత",
        "home.title": "మిమ్మల్ని ప్రభావితం చేసే విధానాలను అర్థం చేసుకోండి",
        "home.subtitle": "ఈ ప్లాట్‌ఫారమ్ పౌరులకు పార్లమెంటరీ చర్చలు మరియు ప్రభుత్వ పథకాలను అర్థం చేసుకోవడానికి సహాయపడుతుంది.",
        "select_state": "రాష్ట్రాన్ని ఎంచుకోండి"
    },
    kn: {
        "nav.home": "ಮುಖಪುಟ",
        "nav.policy_impact": "ನೀತಿ ಪರಿಣಾಮ",
        "nav.schemes": "ಯೋಜನೆಗಳು",
        "nav.posters": "ಪೋಸ್ಟರ್‌ಗಳು",
        "nav.transparency": "ಪಾರದರ್ಶಕತೆ",
        "home.title": "ನಿಮ್ಮ ಮೇಲೆ ಪರಿಣಾಮ ಬೀರುವ ನೀತಿಗಳನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ",
        "home.subtitle": "ಈ ವೇದಿಕೆಯು ನಾಗರಿಕರಿಗೆ ಸಂಸದೀಯ ಚರ್ಚೆಗಳು ಮತ್ತು ಸರ್ಕಾರಿ ಯೋಜನೆಗಳನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.",
        "select_state": "ರಾಜ್ಯವನ್ನು ಆರಿಸಿ"
    },
    bn: {
        "nav.home": "হোম",
        "nav.policy_impact": "নীতি প্রভাব",
        "nav.schemes": "স্কিম",
        "nav.posters": "পোস্টার",
        "nav.transparency": "স্বচ্ছতা",
        "home.title": "আপনার উপর প্রভাব ফেলে এমন নীতিগুলি বুঝুন",
        "home.subtitle": "এই প্ল্যাটফর্মটি নাগরিকদের সংসদীয় আলোচনা এবং সরকারি প্রকল্পগুলি বুঝতে সাহায্য করে।",
        "select_state": "রাজ্য নির্বাচন করুন"
    },
    mr: {
        "nav.home": "मुख्यपृष्ठ",
        "nav.policy_impact": "धोरण प्रभाव",
        "nav.schemes": "योजना",
        "nav.posters": "पोस्टर्स",
        "nav.transparency": "पारदर्शकता",
        "home.title": "तुमच्यावर परिणाम करणारी धोरणे समजून घ्या",
        "home.subtitle": "हे प्लॅटफॉर्म नागरिकांना संसदीय चर्चा आणि सरकारी योजना स्पष्टपणे समजून घेण्यास मदत करते.",
        "select_state": "राज्य निवडा"
    },
    gu: {
        "nav.home": "ઘર",
        "nav.policy_impact": "નીતિ પ્રભાવ",
        "nav.schemes": "યોજનાઓ",
        "nav.posters": "પોસ્ટરો",
        "nav.transparency": "પારદર્શિતા",
        "home.title": "તમારા પર અસર કરતી નીતિઓને સમજો",
        "home.subtitle": "આ પ્લેટફોર્મ નાગરિકોને સંસદીય ચર્ચાઓ અને સરકારી યોજનાઓને સ્પષ્ટ રીતે સમજવામાં મદદ કરે છે.",
        "select_state": "રાજ્ય પસંદ કરો"
    },
    pa: {
        "nav.home": "ਘਰ",
        "nav.policy_impact": "ਨੀਤੀ ਪ੍ਰਭਾਵ",
        "nav.schemes": "ਸਕੀਮਾਂ",
        "nav.posters": "ਪੋਸਟਰ",
        "nav.transparency": "ਪਾਰਦਰਸ਼ਤਾ",
        "home.title": "ਉਹਨਾਂ ਨੀਤੀਆਂ ਨੂੰ ਸਮਝੋ ਜੋ ਤੁਹਾਡੇ 'ਤੇ ਅਸਰ ਪਾਉਂਦੀਆਂ ਹਨ",
        "home.subtitle": "ਇਹ ਪਲੇਟਫਾਰਮ ਨਾਗਰਿਕਾਂ ਨੂੰ ਸੰਸਦੀ ਚਰਚਾਵਾਂ ਅਤੇ ਸਰਕਾਰੀ ਸਕੀਮਾਂ ਨੂੰ ਸਪਸ਼ਟ ਤੌਰ ਤੇ ਸਮਝਣ ਵਿੱਚ ਮਦਦ ਕਰਦਾ ਹੈ।",
        "select_state": "ਰਾਜ ਚੁਣੋ"
    }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>('en');
    const [userState, setUserState] = useState<string>("Delhi"); // Default
    const [regionalLangCode, setRegionalLangCode] = useState<Language | null>('hi');

    // Update Regional Language when State Changes
    useEffect(() => {
        const code = stateToLangMap[userState];
        if (code) {
            setRegionalLangCode(code);
            // Optional: Auto-switch to regional? Maybe not, usually intrusive. 
            // Just make the button available.
        } else {
            setRegionalLangCode('hi'); // Fallback
        }
    }, [userState]);

    const t = (key: string) => {
        // @ts-ignore
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, userState, setUserState, regionalLangCode, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
