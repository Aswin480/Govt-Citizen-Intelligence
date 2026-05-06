
// Types
export interface ParliamentMember {
    id: string;
    name: string;
    party: string;
    constituency?: string;
    state: string; // For Rajya Sabha
    house: 'lok_sabha' | 'rajya_sabha';
    image: string;
    role?: string; // Ministry or special role
}

export interface ParliamentParty {
    party: string;
    seats: number;
    color: string;
    alliance?: 'NDA' | 'INDIA' | 'OTHERS';
}

export interface HouseComposition {
    house: 'lok_sabha' | 'rajya_sabha';
    total_seats: number;
    parties: ParliamentParty[];
    vacant: number;
}

// Colors (Consistent with State Dashboard)
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
    UBT: '#FF0000', // Shiv Sena UBT
    BJD: '#006400',
    BRS: '#FF3399',
    IND: '#808080',
    OTH: '#A9A9A9',
    JMM: '#008000',
    LJP: '#0000FF',
    RLD: '#00FF00',
    SAD: '#FFFF00',
    JKNC: '#FF0000',
    IUML: '#008000',
    VCK: '#0000FF',
    AIMIM: '#008000',
    JSP: '#D2691E'
};

// --- DATA: LOK SABHA 2024 ---
export const LOK_SABHA_COMPOSITION: HouseComposition = {
    house: 'lok_sabha',
    total_seats: 543,
    vacant: 0,
    parties: [
        { party: 'BJP', seats: 240, color: COLORS.BJP, alliance: 'NDA' },
        { party: 'INC', seats: 99, color: COLORS.INC, alliance: 'INDIA' },
        { party: 'SP', seats: 37, color: COLORS.SP, alliance: 'INDIA' },
        { party: 'AITC', seats: 29, color: COLORS.TMC, alliance: 'INDIA' },
        { party: 'DMK', seats: 22, color: COLORS.DMK, alliance: 'INDIA' },
        { party: 'TDP', seats: 16, color: COLORS.TDP, alliance: 'NDA' },
        { party: 'JD(U)', seats: 12, color: COLORS.JDU, alliance: 'NDA' },
        { party: 'SS (UBT)', seats: 9, color: COLORS.UBT, alliance: 'INDIA' },
        { party: 'NCP (SP)', seats: 8, color: COLORS.NCP, alliance: 'INDIA' },
        { party: 'Shiv Sena', seats: 7, color: COLORS.SHIV_SENA, alliance: 'NDA' },
        { party: 'LJP (RV)', seats: 5, color: COLORS.LJP, alliance: 'NDA' },
        { party: 'YSRCP', seats: 4, color: COLORS.YSRCP, alliance: 'OTHERS' },
        { party: 'RJD', seats: 4, color: COLORS.RJD, alliance: 'INDIA' },
        { party: 'CPI(M)', seats: 4, color: COLORS.CPIM, alliance: 'INDIA' },
        { party: 'AAP', seats: 3, color: COLORS.AAP, alliance: 'INDIA' },
        { party: 'JMM', seats: 3, color: COLORS.JMM, alliance: 'INDIA' },
        { party: 'IUML', seats: 3, color: COLORS.IUML, alliance: 'INDIA' },
        { party: 'CPI', seats: 2, color: COLORS.CPI, alliance: 'INDIA' },
        { party: 'CPI(ML)L', seats: 2, color: COLORS.CPI, alliance: 'INDIA' },
        { party: 'JD(S)', seats: 2, color: COLORS.TDP, alliance: 'NDA' }, // Approx color
        { party: 'Jana Sena', seats: 2, color: COLORS.JSP, alliance: 'NDA' },
        { party: 'RLD', seats: 2, color: COLORS.RLD, alliance: 'NDA' },
        { party: 'JKNC', seats: 2, color: COLORS.JKNC, alliance: 'INDIA' },
        { party: 'VCK', seats: 2, color: COLORS.VCK, alliance: 'INDIA' },
        { party: 'AIMIM', seats: 1, color: COLORS.AIMIM, alliance: 'OTHERS' },
        { party: 'Others & Ind', seats: 22, color: COLORS.OTH, alliance: 'OTHERS' }
    ]
};

// --- DATA: RAJYA SABHA 2026 (Projected/Current Mix) ---
export const RAJYA_SABHA_COMPOSITION: HouseComposition = {
    house: 'rajya_sabha',
    total_seats: 245,
    vacant: 4,
    parties: [
        { party: 'BJP', seats: 97, color: COLORS.BJP, alliance: 'NDA' },
        { party: 'INC', seats: 29, color: COLORS.INC, alliance: 'INDIA' },
        { party: 'AITC', seats: 13, color: COLORS.TMC, alliance: 'INDIA' },
        { party: 'AAP', seats: 10, color: COLORS.AAP, alliance: 'INDIA' },
        { party: 'DMK', seats: 10, color: COLORS.DMK, alliance: 'INDIA' },
        { party: 'YSRCP', seats: 9, color: COLORS.YSRCP, alliance: 'OTHERS' },
        { party: 'BRS', seats: 7, color: COLORS.BRS, alliance: 'OTHERS' },
        { party: 'RJD', seats: 6, color: COLORS.RJD, alliance: 'INDIA' },
        { party: 'CPI(M)', seats: 5, color: COLORS.CPIM, alliance: 'INDIA' },
        { party: 'AIADMK', seats: 4, color: COLORS.ADMK, alliance: 'OTHERS' },
        { party: 'JD(U)', seats: 4, color: COLORS.JDU, alliance: 'NDA' },
        { party: 'SP', seats: 4, color: COLORS.SP, alliance: 'INDIA' },
        { party: 'NCP', seats: 3, color: COLORS.NCP, alliance: 'NDA' }, // Split faction mix
        { party: 'Shiv Sena', seats: 3, color: COLORS.SHIV_SENA, alliance: 'NDA' },
        { party: 'Others', seats: 37, color: COLORS.OTH, alliance: 'OTHERS' }
    ]
};

// --- LEADERSHIP DATA ---
export const LEADERSHIP_DATA = {
    president: {
        name: "Droupadi Murmu",
        role: "President of India",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Smt._Droupadi_Murmu_official_portrait_%281%29.jpg/480px-Smt._Droupadi_Murmu_official_portrait_%281%29.jpg"
    },
    vice_president: {
        name: "Jagdeep Dhankhar",
        role: "Vice President & Chairman, RS",
        image: "https://upload.wikimedia.org/wikipedia/commons/2/23/Jagdeep_Dhankhar_Vice_President_of_India.jpg"
    },
    prime_minister: {
        name: "Narendra Modi",
        role: "Prime Minister",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Narendra_Modi_2021.jpg/480px-Narendra_Modi_2021.jpg"
    },
    speaker: {
        name: "Om Birla",
        role: "Speaker, Lok Sabha",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Om_Birla_2024.jpg/480px-Om_Birla_2024.jpg"
    },
    opposition_leader_ls: {
        name: "Rahul Gandhi",
        role: "Leader of Opposition (LS)",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Rahul_Gandhi_March_2024.jpg/480px-Rahul_Gandhi_March_2024.jpg"
    }
};

// --- MOCK MEMBERS (Using real names where possible) ---
// This is a sample list to populate the directory.
export const PARLIAMENT_MEMBERS: ParliamentMember[] = [
    // LOK SABHA
    { id: 'PM01', name: "Narendra Modi", party: "BJP", constituency: "Varanasi", state: "Uttar Pradesh", house: 'lok_sabha', image: "https://ui-avatars.com/api/?name=NM&background=FF9933" },
    { id: 'PM02', name: "Rahul Gandhi", party: "INC", constituency: "Rae Bareli", state: "Uttar Pradesh", house: 'lok_sabha', image: "https://ui-avatars.com/api/?name=RG&background=19AAED" },
    { id: 'PM03', name: "Amit Shah", party: "BJP", constituency: "Gandhinagar", state: "Gujarat", house: 'lok_sabha', image: "https://ui-avatars.com/api/?name=AS&background=FF9933", role: "Home Minister" },
    { id: 'PM04', name: "Rajnath Singh", party: "BJP", constituency: "Lucknow", state: "Uttar Pradesh", house: 'lok_sabha', image: "https://ui-avatars.com/api/?name=RS&background=FF9933", role: "Defence Minister" },
    { id: 'PM05', name: "Akhilesh Yadav", party: "SP", constituency: "Kannauj", state: "Uttar Pradesh", house: 'lok_sabha', image: "https://ui-avatars.com/api/?name=AY&background=FF0000" },
    { id: 'PM06', name: "Abhishek Banerjee", party: "AITC", constituency: "Diamond Harbour", state: "West Bengal", house: 'lok_sabha', image: "https://ui-avatars.com/api/?name=AB&background=20C646" },
    { id: 'PM07', name: "Supriya Sule", party: "NCP (SP)", constituency: "Baramati", state: "Maharashtra", house: 'lok_sabha', image: "https://ui-avatars.com/api/?name=SS&background=00B2B2" },
    { id: 'PM08', name: "Asaduddin Owaisi", party: "AIMIM", constituency: "Hyderabad", state: "Telangana", house: 'lok_sabha', image: "https://ui-avatars.com/api/?name=AO&background=008000" },
    { id: 'PM09', name: "Nitin Gadkari", party: "BJP", constituency: "Nagpur", state: "Maharashtra", house: 'lok_sabha', image: "https://ui-avatars.com/api/?name=NG&background=FF9933", role: "Minister of Road Transport" },
    { id: 'PM10', name: "Kiren Rijiju", party: "BJP", constituency: "Arunachal West", state: "Arunachal Pradesh", house: 'lok_sabha', image: "https://ui-avatars.com/api/?name=KR&background=FF9933", role: "Minister of Law" },
    { id: 'PM11', name: "Shashi Tharoor", party: "INC", constituency: "Thiruvananthapuram", state: "Kerala", house: 'lok_sabha', image: "https://ui-avatars.com/api/?name=ST&background=19AAED" },
    { id: 'PM12', name: "Dimple Yadav", party: "SP", constituency: "Mainpuri", state: "Uttar Pradesh", house: 'lok_sabha', image: "https://ui-avatars.com/api/?name=DY&background=FF0000" },

    // RAJYA SABHA
    { id: 'RS01', name: "Jagdeep Dhankhar", party: "BJP", state: "Rajasthan", house: 'rajya_sabha', image: "https://ui-avatars.com/api/?name=JD", role: "Chairman" },
    { id: 'RS02', name: "Mallikarjun Kharge", party: "INC", state: "Karnataka", house: 'rajya_sabha', image: "https://ui-avatars.com/api/?name=MK&background=19AAED", role: "Leader of Opposition (RS)" },
    { id: 'RS03', name: "Nirmala Sitharaman", party: "BJP", state: "Karnataka", house: 'rajya_sabha', image: "https://ui-avatars.com/api/?name=NS&background=FF9933", role: "Finance Minister" },
    { id: 'RS04', name: "S. Jaishankar", party: "BJP", state: "Gujarat", house: 'rajya_sabha', image: "https://ui-avatars.com/api/?name=SJ&background=FF9933", role: "External Affairs Minister" },
    { id: 'RS05', name: "Piyush Goyal", party: "BJP", state: "Maharashtra", house: 'rajya_sabha', image: "https://ui-avatars.com/api/?name=PG&background=FF9933", role: "Leader of House (RS)" },
    { id: 'RS06', name: "Jairam Ramesh", party: "INC", state: "Karnataka", house: 'rajya_sabha', image: "https://ui-avatars.com/api/?name=JR&background=19AAED" },
    { id: 'RS07', name: "Derek O'Brien", party: "AITC", state: "West Bengal", house: 'rajya_sabha', image: "https://ui-avatars.com/api/?name=DO&background=20C646" },
    { id: 'RS08', name: "Raghav Chadha", party: "AAP", state: "Punjab", house: 'rajya_sabha', image: "https://ui-avatars.com/api/?name=RC&background=0066A4" },
    { id: 'RS09', name: "Sanjay Singh", party: "AAP", state: "Delhi", house: 'rajya_sabha', image: "https://ui-avatars.com/api/?name=SS&background=0066A4" },
    { id: 'RS10', name: "Kapil Sibal", party: "IND", state: "Uttar Pradesh", house: 'rajya_sabha', image: "https://ui-avatars.com/api/?name=KS&background=808080" },
    { id: 'RS11', name: "Sudha Murty", party: "NOM", state: "Nominated", house: 'rajya_sabha', image: "https://ui-avatars.com/api/?name=SM&background=A9A9A9", role: "Author & Philanthropist" },
    { id: 'RS12', name: "Harbhajan Singh", party: "AAP", state: "Punjab", house: 'rajya_sabha', image: "https://ui-avatars.com/api/?name=HS&background=0066A4" },
    { id: 'RS13', name: "Misa Bharti", party: "RJD", state: "Bihar", house: 'rajya_sabha', image: "https://ui-avatars.com/api/?name=MB&background=008000" },
    { id: 'RS14', name: "Tiruchi Siva", party: "DMK", state: "Tamil Nadu", house: 'rajya_sabha', image: "https://ui-avatars.com/api/?name=TS&background=DD1100" },
    { id: 'RS15', name: "V. Vijayasai Reddy", party: "YSRCP", state: "Andhra Pradesh", house: 'rajya_sabha', image: "https://ui-avatars.com/api/?name=VR&background=138808" },
    { id: 'RS16', name: "K. Keshava Rao", party: "BRS", state: "Telangana", house: 'rajya_sabha', image: "https://ui-avatars.com/api/?name=KR&background=FF3399" },
    { id: 'RS17', name: "Swati Maliwal", party: "AAP", state: "Delhi", house: 'rajya_sabha', image: "https://ui-avatars.com/api/?name=SM&background=0066A4" },
    { id: 'RS18', name: "P. T. Usha", party: "NOM", state: "Nominated", house: 'rajya_sabha', image: "https://ui-avatars.com/api/?name=PU&background=A9A9A9", role: "Athlete" },
    { id: 'RS19', name: "Ilaiyaraaja", party: "NOM", state: "Nominated", house: 'rajya_sabha', image: "https://ui-avatars.com/api/?name=IL&background=A9A9A9", role: "Musician" },
    { id: 'RS20', name: "V. Sean", party: "BJP", state: "Uttar Pradesh", house: 'rajya_sabha', image: "https://ui-avatars.com/api/?name=VS&background=FF9933" }, // Generic filler
    { id: 'RS21', name: "Harsh Vardhan Shringla", party: "NOM", state: "Nominated", house: 'rajya_sabha', image: "https://ui-avatars.com/api/?name=HS&background=A9A9A9", role: "Diplomat" },
    { id: 'RS22', name: "Ujjwal Nikam", party: "NOM", state: "Nominated", house: 'rajya_sabha', image: "https://ui-avatars.com/api/?name=UN&background=A9A9A9", role: "Legal Expert" },
    { id: 'RS23', name: "Meenakshi Jain", party: "NOM", state: "Nominated", house: 'rajya_sabha', image: "https://ui-avatars.com/api/?name=MJ&background=A9A9A9", role: "Historian" },
    { id: 'RS24', name: "C. Sadanandan Master", party: "NOM", state: "Nominated", house: 'rajya_sabha', image: "https://ui-avatars.com/api/?name=CM&background=A9A9A9", role: "Social Worker" },
    { id: 'RS25', name: "Ghulam Ali", party: "NOM", state: "Nominated", house: 'rajya_sabha', image: "https://ui-avatars.com/api/?name=GA&background=A9A9A9" },
    { id: 'RS26', name: "Satnam Singh Sandhu", party: "NOM", state: "Nominated", house: 'rajya_sabha', image: "https://ui-avatars.com/api/?name=SS&background=A9A9A9" },
    { id: 'RS27', name: "Dharmendra Pradhan", party: "BJP", state: "Madhya Pradesh", house: 'rajya_sabha', image: "https://ui-avatars.com/api/?name=DP&background=FF9933", role: "Minister of Education" },
    { id: 'RS28', name: "Bhupender Yadav", party: "BJP", state: "Rajasthan", house: 'rajya_sabha', image: "https://ui-avatars.com/api/?name=BY&background=FF9933", role: "Minister of Environment" },
];
