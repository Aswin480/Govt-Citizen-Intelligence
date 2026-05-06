
export interface LandmarkCase {
    id: string;
    case_name: string;
    year: number;
    quote: string;
    related_article: string;
}

export interface Article {
    article: string;
    title: string;
    description: string;
    keywords: string[];
    landmark_cases: string[]; // IDs of landmark cases
}

export const CONSTITUTION_DATA: Article[] = [
    {
        article: "Article 14",
        title: "Equality before Law",
        description: "The State shall not deny to any person equality before the law or the equal protection of the laws within the territory of India.",
        keywords: ["equality", "discrimination", "religion", "race", "caste", "sex", "class_divide"],
        landmark_cases: ["maneka_1978", "shayara_2017"]
    },
    {
        article: "Article 19(1)(a)",
        title: "Freedom of Speech",
        description: "All citizens shall have the right to freedom of speech and expression.",
        keywords: ["speech", "expression", "press", "media", "internet", "protest", "censorship"],
        landmark_cases: ["shreya_2015", "romesh_1950"]
    },
    {
        article: "Article 21",
        title: "Protection of Life & Personal Liberty",
        description: "No person shall be deprived of his life or personal liberty except according to procedure established by law.",
        keywords: ["life", "liberty", "privacy", "health", "environment", "surveillance", "detention"],
        landmark_cases: ["puttaswamy_2017", "menaka_1978"]
    },
    {
        article: "Article 25",
        title: "Freedom of Religion",
        description: "Freedom of conscience and free profession, practice and propagation of religion.",
        keywords: ["religion", "worship", "faith", "secularism", "uniform_civil_code"],
        landmark_cases: ["sr_bommai_1994"]
    },
    {
        article: "Schedule 7 (State List)",
        title: "State Jurisdiction",
        description: "Matters where only State Governments have the power to legislate.",
        keywords: ["police", "agriculture", "land", "health", "local_govt"],
        landmark_cases: []
    }
];

export const LANDMARK_CASES: Record<string, LandmarkCase> = {
    "puttaswamy_2017": {
        id: "puttaswamy_2017",
        case_name: "K.S. Puttaswamy v. Union of India",
        year: 2017,
        quote: "The right to privacy is protected as an intrinsic part of the right to life and personal liberty under Article 21.",
        related_article: "Article 21"
    },
    "shreya_2015": {
        id: "shreya_2015",
        case_name: "Shreya Singhal v. Union of India",
        year: 2015,
        quote: "Liberty of speech and expression is cardinal to the working of a democracy.",
        related_article: "Article 19(1)(a)"
    },
    "maneka_1978": {
        id: "maneka_1978",
        case_name: "Maneka Gandhi v. Union of India",
        year: 1978,
        quote: "Procedure established by law must be fair, just and reasonable, not fanciful, oppressive or arbitrary.",
        related_article: "Article 14 & 21"
    }
};

export const MOCK_BILLS = [
    {
        id: "BILL_2025_01",
        title: "The National Social Media Identity Act",
        description: "Mandates linking of Govt ID to all social media accounts to prevent anonymity and curb fake news.",
        sector: "IT & Communication",
        tags: ["privacy", "speech", "internet", "surveillance"],
        impact_analysis: {
            rich: "Neutral",
            middle: "High Impact (Privacy Loss)",
            poor: "Low Impact"
        },
        protest_risk: "High (Youth & Activists)"
    },
    {
        id: "BILL_2025_02",
        title: "Unified Agricultural Market Bill",
        description: "Allows farmers to sell produce anywhere in the country, bypassing state mandis.",
        sector: "Agriculture",
        tags: ["agriculture", "land", "market", "trade"],
        impact_analysis: {
            rich: "Positive (Corporates)",
            middle: "Neutral",
            poor: "Negative (Small Farmers)"
        },
        protest_risk: "Severe (Farmers)"
    },
    {
        id: "BILL_2025_03",
        title: "Universal Digital Health Card",
        description: "Creates a central database of citizen health records.",
        sector: "Health",
        tags: ["health", "privacy", "data", "state_subject"],
        impact_analysis: {
            rich: "Positive",
            middle: "Positive",
            poor: "Neutral"
        },
        protest_risk: "Low"
    }
];
