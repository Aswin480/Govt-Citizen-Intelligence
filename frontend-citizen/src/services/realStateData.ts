
export interface PartySeat {
    party: string;
    seats: number;
    color: string;
}

export interface LeadershipInfo {
    chief_minister?: { name: string; image?: string };
    governor: { name: string; image?: string };
}

export interface RealStateData {
    id: string;
    leadership: LeadershipInfo;
    composition?: PartySeat[];
    total_seats: number;
}

// Helper for party colors
const COLORS: Record<string, string> = {
    BJP: '#FF9933', // Saffron
    INC: '#19AAED', // Sky Blue
    TDP: '#FCE403', // Yellow
    YSRCP: '#138808', // Green
    DMK: '#DD1100', // Red
    ADMK: '#0095B6',
    AAP: '#0066A4',
    TMC: '#20C646',
    CPI: '#CB000F',
    CPIM: '#CB000F',
    SP: '#FF0000',
    RJD: '#008000',
    JDU: '#003366',
    NCP: '#00B2B2',
    SHIV_SENA: '#FF6600',
    BJD: '#006400',
    BRS: '#FF3399',
    IND: '#808080',
    OTH: '#A9A9A9',
    NDA: '#FF9933',
    INDIA: '#19AAED'
};

export const REAL_STATE_DATA: Record<string, RealStateData> = {
    // STATES
    'AP': {
        id: 'AP',
        leadership: {
            chief_minister: { name: "Nara Chandrababu Naidu" },
            governor: { name: "S. Abdul Nazeer" },
        },
        total_seats: 175,
        composition: [
            { party: "TDP", seats: 135, color: COLORS.TDP },
            { party: "Janasena", seats: 21, color: "#D2691E" },
            { party: "BJP", seats: 8, color: COLORS.BJP },
            { party: "YSRCP", seats: 11, color: COLORS.YSRCP }
        ]
    },
    'AR': {
        id: 'AR',
        leadership: {
            chief_minister: { name: "Pema Khandu" },
            governor: { name: "Lt. Gen. Kaiwalya Trivikram Parnaik" },
        },
        total_seats: 60,
        composition: [
            { party: "BJP", seats: 46, color: COLORS.BJP },
            { party: "NPEP", seats: 5, color: "#DB7093" }, // National People's Party
            { party: "NCP", seats: 3, color: COLORS.NCP },
            { party: "PPA", seats: 2, color: "purple" },
            { party: "INC", seats: 1, color: COLORS.INC },
            { party: "IND", seats: 3, color: COLORS.IND }
        ]
    },
    'AS': {
        id: 'AS',
        leadership: {
            chief_minister: { name: "Himanta Biswa Sarma" },
            governor: { name: "Lakshman Prasad Acharya" },
        },
        total_seats: 126,
        composition: [
            { party: "BJP", seats: 63, color: COLORS.BJP }, // Approx ruling
            { party: "INC", seats: 27, color: COLORS.INC },
            { party: "AIUDF", seats: 15, color: "green" },
            { party: "AGP", seats: 9, color: "lightblue" }
        ]
    },
    'BR': {
        id: 'BR',
        leadership: {
            chief_minister: { name: "Nitish Kumar" },
            governor: { name: "Arif Mohammed Khan" },
        },
        total_seats: 243,
        composition: [
            { party: "RJD", seats: 79, color: COLORS.RJD },
            { party: "BJP", seats: 78, color: COLORS.BJP },
            { party: "JD(U)", seats: 45, color: COLORS.JDU },
            { party: "INC", seats: 19, color: COLORS.INC },
            { party: "CPI(ML)L", seats: 12, color: COLORS.CPI }
        ]
    },
    'CG': {
        id: 'CG',
        leadership: {
            chief_minister: { name: "Vishnu Deo Sai" },
            governor: { name: "Ramen Deka" },
        },
        total_seats: 90,
        composition: [
            { party: "BJP", seats: 54, color: COLORS.BJP },
            { party: "INC", seats: 35, color: COLORS.INC },
            { party: "GGP", seats: 1, color: "yellow" }
        ]
    },
    'GA': {
        id: 'GA',
        leadership: {
            chief_minister: { name: "Pramod Sawant" },
            governor: { name: "P.S. Sreedharan Pillai" },
        },
        total_seats: 40,
        composition: [
            { party: "BJP", seats: 20, color: COLORS.BJP },
            { party: "INC", seats: 11, color: COLORS.INC },
            { party: "MGP", seats: 2, color: "orange" },
            { party: "AAP", seats: 2, color: COLORS.AAP }
        ]
    },
    'GJ': {
        id: 'GJ',
        leadership: {
            chief_minister: { name: "Bhupendra Patel" },
            governor: { name: "Acharya Dev Vrat" },
        },
        total_seats: 182,
        composition: [
            { party: "BJP", seats: 156, color: COLORS.BJP },
            { party: "INC", seats: 17, color: COLORS.INC },
            { party: "AAP", seats: 5, color: COLORS.AAP }
        ]
    },
    'HR': {
        id: 'HR',
        leadership: {
            chief_minister: { name: "Nayab Singh Saini" },
            governor: { name: "Bandaru Dattatraya" },
        },
        total_seats: 90,
        composition: [
            { party: "BJP", seats: 48, color: COLORS.BJP },
            { party: "INC", seats: 37, color: COLORS.INC },
            { party: "INLD", seats: 2, color: "green" }
        ]
    },
    'HP': {
        id: 'HP',
        leadership: {
            chief_minister: { name: "Sukhvinder Singh Sukhu" },
            governor: { name: "Shiv Pratap Shukla" },
        },
        total_seats: 68,
        composition: [
            { party: "INC", seats: 40, color: COLORS.INC },
            { party: "BJP", seats: 25, color: COLORS.BJP },
            { party: "IND", seats: 3, color: COLORS.IND }
        ]
    },
    'JH': {
        id: 'JH',
        leadership: {
            chief_minister: { name: "Hemant Soren" },
            governor: { name: "Santosh Kumar Gangwar" },
        },
        total_seats: 81,
        composition: [
            { party: "JMM", seats: 30, color: "green" },
            { party: "BJP", seats: 25, color: COLORS.BJP },
            { party: "INC", seats: 16, color: COLORS.INC }
        ]
    },
    'KA': {
        id: 'KA',
        leadership: {
            chief_minister: { name: "Siddaramaiah" },
            governor: { name: "Thaawarchand Gehlot" },
        },
        total_seats: 224,
        composition: [
            { party: "INC", seats: 135, color: COLORS.INC },
            { party: "BJP", seats: 66, color: COLORS.BJP },
            { party: "JD(S)", seats: 19, color: "green" }
        ]
    },
    'KL': {
        id: 'KL',
        leadership: {
            chief_minister: { name: "Pinarayi Vijayan" },
            governor: { name: "Rajendra Vishwanath Arlekar" },
        },
        total_seats: 140,
        composition: [
            { party: "LDF", seats: 99, color: COLORS.CPIM },
            { party: "UDF", seats: 41, color: COLORS.INC }
        ]
    },
    'MP': {
        id: 'MP',
        leadership: {
            chief_minister: { name: "Mohan Yadav" },
            governor: { name: "Mangubhai Chhaganbhai Patel" },
        },
        total_seats: 230,
        composition: [
            { party: "BJP", seats: 163, color: COLORS.BJP },
            { party: "INC", seats: 66, color: COLORS.INC }
        ]
    },
    'MH': {
        id: 'MH',
        leadership: {
            chief_minister: { name: "Devendra Fadnavis" },
            governor: { name: "C.P. Radhakrishnan" },
        },
        total_seats: 288,
        composition: [
            { party: "BJP", seats: 132, color: COLORS.BJP },
            { party: "Shiv Sena (Shinde)", seats: 57, color: "#FFA500" },
            { party: "NCP (Ajit)", seats: 41, color: "#00B2B2" },
            { party: "INC", seats: 16, color: COLORS.INC },
            { party: "UBT Shiv Sena", seats: 20, color: "firebrick" }
        ]
    },
    'MN': {
        id: 'MN',
        leadership: {
            chief_minister: { name: "N. Biren Singh" },
            governor: { name: "Ajay Kumar Bhalla" },
        },
        total_seats: 60,
        composition: [
            { party: "BJP", seats: 32, color: COLORS.BJP },
            { party: "NPEP", seats: 7, color: "#DB7093" },
            { party: "JD(U)", seats: 6, color: COLORS.JDU },
            { party: "INC", seats: 5, color: COLORS.INC }
        ]
    },
    'ML': {
        id: 'ML',
        leadership: {
            chief_minister: { name: "Conrad Sangma" },
            governor: { name: "C H Vijayashankar" },
        },
        total_seats: 60,
        composition: [
            { party: "NPEP", seats: 26, color: "#DB7093" },
            { party: "UDP", seats: 11, color: "blue" },
            { party: "BJP", seats: 2, color: COLORS.BJP },
            { party: "INC", seats: 5, color: COLORS.INC },
            { party: "VPP", seats: 4, color: "orange" }
        ]
    },
    'MZ': {
        id: 'MZ',
        leadership: {
            chief_minister: { name: "Lalduhoma" },
            governor: { name: "Gen. (Retd.) Vijay Kumar Singh" },
        },
        total_seats: 40,
        composition: [
            { party: "ZPM", seats: 27, color: "yellow" },
            { party: "MNF", seats: 10, color: "blue" },
            { party: "BJP", seats: 2, color: COLORS.BJP },
            { party: "INC", seats: 1, color: COLORS.INC }
        ]
    },
    'NL': {
        id: 'NL',
        leadership: {
            chief_minister: { name: "Neiphiu Rio" },
            governor: { name: "La. Ganesan" },
        },
        total_seats: 60,
        composition: [
            { party: "NDPP", seats: 25, color: "yellow" },
            { party: "BJP", seats: 12, color: COLORS.BJP },
            { party: "NCP", seats: 7, color: COLORS.NCP }
        ]
    },
    'OD': {
        id: 'OD',
        leadership: {
            chief_minister: { name: "Mohan Charan Majhi" },
            governor: { name: "Dr. Hari Babu Kambhampati" },
        },
        total_seats: 147,
        composition: [
            { party: "BJP", seats: 78, color: COLORS.BJP },
            { party: "BJD", seats: 51, color: COLORS.BJD },
            { party: "INC", seats: 14, color: COLORS.INC }
        ]
    },
    'PB': {
        id: 'PB',
        leadership: {
            chief_minister: { name: "Bhagwant Mann" },
            governor: { name: "Gulab Chand Kataria" },
        },
        total_seats: 117,
        composition: [
            { party: "AAP", seats: 92, color: COLORS.AAP },
            { party: "INC", seats: 18, color: COLORS.INC },
            { party: "SAD", seats: 3, color: "yellow" },
            { party: "BJP", seats: 2, color: COLORS.BJP }
        ]
    },
    'RJ': {
        id: 'RJ',
        leadership: {
            chief_minister: { name: "Bhajan Lal Sharma" },
            governor: { name: "Haribhau Kisanrao Bagde" },
        },
        total_seats: 200,
        composition: [
            { party: "BJP", seats: 115, color: COLORS.BJP },
            { party: "INC", seats: 69, color: COLORS.INC },
            { party: "BAP", seats: 3, color: "green" }
        ]
    },
    'SK': {
        id: 'SK',
        leadership: {
            chief_minister: { name: "Prem Singh Tamang" },
            governor: { name: "Om Prakash Mathur" },
        },
        total_seats: 32,
        composition: [
            { party: "SKM", seats: 31, color: "#FFA500" },
            { party: "SDF", seats: 1, color: "yellow" }
        ]
    },
    'TN': {
        id: 'TN',
        leadership: {
            chief_minister: { name: "M. K. Stalin" },
            governor: { name: "R. N. Ravi" },
        },
        total_seats: 234,
        composition: [
            { party: "DMK", seats: 133, color: COLORS.DMK },
            { party: "AIADMK", seats: 66, color: COLORS.ADMK },
            { party: "INC", seats: 18, color: COLORS.INC },
            { party: "VCK", seats: 4, color: "blue" },
            { party: "BJP", seats: 4, color: COLORS.BJP }
        ]
    },
    'TS': {
        id: 'TS',
        leadership: {
            chief_minister: { name: "A. Revanth Reddy" },
            governor: { name: "Jishnu Dev Varma" },
        },
        total_seats: 119,
        composition: [
            { party: "INC", seats: 64, color: COLORS.INC },
            { party: "BRS", seats: 39, color: COLORS.BRS },
            { party: "BJP", seats: 8, color: COLORS.BJP },
            { party: "AIMIM", seats: 7, color: "green" }
        ]
    },
    'TR': {
        id: 'TR',
        leadership: {
            chief_minister: { name: "Manik Saha" },
            governor: { name: "Indra Sena Reddy Nallu" },
        },
        total_seats: 60,
        composition: [
            { party: "BJP", seats: 32, color: COLORS.BJP },
            { party: "TMP", seats: 13, color: "yellow" },
            { party: "CPI(M)", seats: 11, color: COLORS.CPIM },
            { party: "INC", seats: 3, color: COLORS.INC }
        ]
    },
    'UP': {
        id: 'UP',
        leadership: {
            chief_minister: { name: "Yogi Adityanath" },
            governor: { name: "Anandiben Patel" },
        },
        total_seats: 403,
        composition: [
            { party: "BJP", seats: 255, color: COLORS.BJP },
            { party: "SP", seats: 111, color: COLORS.SP },
            { party: "AD(S)", seats: 12, color: "orange" },
            { party: "RLD", seats: 8, color: "green" }
        ]
    },
    'UK': {
        id: 'UK',
        leadership: {
            chief_minister: { name: "Pushkar Singh Dhami" },
            governor: { name: "Lt. Gen. Gurmit Singh" },
        },
        total_seats: 70,
        composition: [
            { party: "BJP", seats: 47, color: COLORS.BJP },
            { party: "INC", seats: 19, color: COLORS.INC },
            { party: "BSP", seats: 2, color: "blue" }
        ]
    },
    'WB': {
        id: 'WB',
        leadership: {
            chief_minister: { name: "Mamata Banerjee" },
            governor: { name: "Dr. C.V. Ananda Bose" },
        },
        total_seats: 294,
        composition: [
            { party: "AITC", seats: 215, color: COLORS.TMC },
            { party: "BJP", seats: 77, color: COLORS.BJP },
            { party: "ISF", seats: 1, color: "green" }
        ]
    },

    // UNION TERRITORIES (UTs)
    // Note: UTs with Assemblies have CMs, others only Lt. Gov
    'DL': {
        id: 'DL',
        leadership: {
            chief_minister: { name: "Atishi Marlena" },
            governor: { name: "Vinai Kumar Saxena" },
        },
        total_seats: 70,
        composition: [
            { party: "AAP", seats: 62, color: COLORS.AAP },
            { party: "BJP", seats: 8, color: COLORS.BJP }
        ]
    },
    'PY': {
        id: 'PY',
        leadership: {
            chief_minister: { name: "N. Rangaswamy" },
            governor: { name: "Dr. Tamilisai Soundararajan (Addl.)" }, // Verify current if possible but this is safe fallback
        },
        total_seats: 30,
        composition: [
            { party: "AINRC", seats: 10, color: "yellow" },
            { party: "BJP", seats: 6, color: COLORS.BJP },
            { party: "DMK", seats: 6, color: COLORS.DMK },
            { party: "INC", seats: 2, color: COLORS.INC }
        ]
    },
    'JK': {
        id: 'JK',
        leadership: {
            chief_minister: { name: "Omar Abdullah" },
            governor: { name: "Manoj Sinha" }, // LG
        },
        total_seats: 90,
        composition: [
            { party: "JKNC", seats: 42, color: "red" },
            { party: "BJP", seats: 29, color: COLORS.BJP },
            { party: "INC", seats: 6, color: COLORS.INC },
            { party: "PDP", seats: 3, color: "green" }
        ]
    },

    // UTs without Legislative Assembly
    'AN': {
        id: 'AN',
        leadership: {
            governor: { name: "Adm. D.K. Joshi" }
        },
        total_seats: 0
    },
    'CH': {
        id: 'CH',
        leadership: {
            governor: { name: "Gulab Chand Kataria" }
        },
        total_seats: 0
    },
    'DN': {
        id: 'DN',
        leadership: {
            governor: { name: "Praful Khoda Patel" }
        },
        total_seats: 0
    },
    'LA': {
        id: 'LA',
        leadership: {
            governor: { name: "Brig. (Dr.) B.D. Mishra" }
        },
        total_seats: 0
    },
    'LD': {
        id: 'LD',
        leadership: {
            governor: { name: "Praful Khoda Patel" }
        },
        total_seats: 0
    }
};
