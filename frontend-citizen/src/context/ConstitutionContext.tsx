
import React, { createContext, useContext, useState, useEffect } from 'react';

interface ConstitutionContextType {
    // Admin Actions
    setAdminApiKey: (key: string) => void;
    setConstitutionText: (text: string) => void;

    // User Access (In a real app, strict separation. Here, we simulate)
    getAdminApiKey: () => string | null;
    constitutionText: string;

    // Metadata
    lastUpdated: string | null;
}

const CONST_KEY_STORAGE = 'gov_const_api_key_secure';
const CONST_TEXT_STORAGE = 'gov_const_text_body';
const CONST_META_STORAGE = 'gov_const_meta_date';

// Default Text (Fallback if Admin hasn't uploaded specific text)
const DEFAULT_TEXT = `THE CONSTITUTION OF INDIA

PREAMBLE

WE, THE PEOPLE OF INDIA, having solemnly resolved to constitute India into a SOVEREIGN SOCIALIST SECULAR DEMOCRATIC REPUBLIC and to secure to all its citizens:

JUSTICE, social, economic and political;
LIBERTY of thought, expression, belief, faith and worship;
EQUALITY of status and of opportunity;
and to promote among them all
FRATERNITY assuring the dignity of the individual and the unity and integrity of the Nation;

IN OUR CONSTITUENT ASSEMBLY this twenty-sixth day of November, 1949, do HEREBY ADOPT, ENACT AND GIVE TO OURSELVES THIS CONSTITUTION.

---

PART III: FUNDAMENTAL RIGHTS

Article 14: Equality before law.
The State shall not deny to any person equality before the law or the equal protection of the laws within the territory of India.

Article 19: Protection of certain rights regarding freedom of speech, etc.
(1) All citizens shall have the right—
(a) to freedom of speech and expression;
(b) to assemble peaceably and without arms;
(c) to form associations or unions;
(d) to move freely throughout the territory of India;
(e) to reside and settle in any part of the territory of India.

Article 21: Protection of life and personal liberty.
No person shall be deprived of his life or personal liberty except according to procedure established by law.

Article 32: Remedies for enforcement of rights.
The right to move the Supreme Court by appropriate proceedings for the enforcement of the rights conferred by this Part is guaranteed.
`;

const ConstitutionContext = createContext<ConstitutionContextType>({
    setAdminApiKey: () => { },
    setConstitutionText: () => { },
    getAdminApiKey: () => null,
    constitutionText: DEFAULT_TEXT,
    lastUpdated: null
});

export const ConstitutionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [text, setText] = useState<string>(DEFAULT_TEXT);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    // Hydrate from "Server" (LocalStorage)
    useEffect(() => {
        const storedKey = localStorage.getItem(CONST_KEY_STORAGE);
        const storedText = localStorage.getItem(CONST_TEXT_STORAGE);
        const storedMeta = localStorage.getItem(CONST_META_STORAGE);

        if (storedKey) setApiKey(storedKey);
        if (storedText) setText(storedText);
        if (storedMeta) setLastUpdated(storedMeta);
    }, []);

    const setAdminApiKey = (key: string) => {
        setApiKey(key);
        localStorage.setItem(CONST_KEY_STORAGE, key);
    };

    const setConstitutionText = (newText: string) => {
        setText(newText);
        localStorage.setItem(CONST_TEXT_STORAGE, newText);

        const date = new Date().toLocaleDateString('en-IN', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        setLastUpdated(date);
        localStorage.setItem(CONST_META_STORAGE, date);
    };

    const getAdminApiKey = () => apiKey || import.meta.env.VITE_GEMINI_API_KEY || null;

    return (
        <ConstitutionContext.Provider value={{
            setAdminApiKey,
            setConstitutionText,
            getAdminApiKey,
            constitutionText: text,
            lastUpdated
        }}>
            {children}
        </ConstitutionContext.Provider>
    );
};

export const useConstitution = () => useContext(ConstitutionContext);
