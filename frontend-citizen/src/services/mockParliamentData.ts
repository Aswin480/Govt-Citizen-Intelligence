import lsDataRaw from '../data/lok_sabha_2024.json';
import centralGovtData from '../data/central_govt_2026.json';
import rsDataRaw from '../data/rajya_sabha_2026.json';

export type Party = 'BJP' | 'INC' | 'DMK' | 'TMC' | 'AAP' | 'YSRCP' | 'SP' | 'Others';

export interface Member {
    id: string;
    name: string;
    party: string;
    constituency: string; // Or State for RS
    house: 'lok_sabha' | 'rajya_sabha';
    role?: string; // e.g. "Prime Minister", "Speaker"
    image: string;
    stats: {
        attendance?: number; // Optional
        debates?: number;
        questions?: number;
        bills_introduced?: number;
    };
    votes: {
        bill: string;
        vote: 'For' | 'Against' | 'Abstain';
        date: string;
    }[];
}

export const PARTIES: Record<string, { color: string; full_name: string }> = {
    BJP: { color: '#FF9933', full_name: 'Bharatiya Janata Party' },
    INC: { color: '#00BFFF', full_name: 'Indian National Congress' },
    DMK: { color: '#DD1100', full_name: 'Dravida Munnetra Kazhagam' },
    TMC: { color: '#228B22', full_name: 'All India Trinamool Congress' },
    AAP: { color: '#0072B0', full_name: 'Aam Aadmi Party' },
    YSRCP: { color: '#14438d', full_name: 'YSR Congress Party' },
    SP: { color: '#EF4444', full_name: 'Samajwadi Party' },
    Others: { color: '#808080', full_name: 'Others' },
};

// Process Real Data - ZERO MOCK STATS
const MAPPED_MEMBERS: Member[] = lsDataRaw.map((m: any, idx: number) => ({
    id: `ls-2024-${idx}`,
    name: m.name,
    party: m.party,
    constituency: m.constituency,
    house: 'lok_sabha',
    role: m.role !== 'MP' ? m.role : undefined,
    image: `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=random`,
    stats: {
        attendance: undefined,
        debates: undefined,
        questions: undefined,
        bills_introduced: undefined
    },
    votes: []
}));

// Process Real RS Data
const RS_REAL_MEMBERS: Member[] = rsDataRaw.map((m: any, idx: number) => ({
    id: `rs-2026-${idx}`,
    name: m.name,
    party: m.party,
    constituency: m.state, // RS members represent states
    house: 'rajya_sabha',
    role: undefined,
    image: `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=random`,
    stats: {},
    votes: []
}));

export const MOCK_MEMBERS = [...MAPPED_MEMBERS, ...RS_REAL_MEMBERS];

export const LEADERSHIP_DATA = {
    president: centralGovtData.president,
    vice_president: centralGovtData.vice_president,
    prime_minister: centralGovtData.prime_minister,
    speaker: centralGovtData.speaker,
    opposition_leader: centralGovtData.opposition_leader
};

export const MINISTRY_DATA = centralGovtData.ministers;

// Auto-Calculate Seating Logic
const calculateComposition = (members: Member[], house: string) => {
    const counts: Record<string, number> = {};
    members.filter(m => m.house === house).forEach(m => {
        const p = m.party;
        counts[p] = (counts[p] || 0) + 1;
    });

    return Object.entries(counts)
        .map(([party, seats]) => ({
            party,
            seats,
            // Fallback color logic
            color: PARTIES[party]?.color || (party.includes('BJP') ? '#FF9933' : party.includes('INC') ? '#00BFFF' : '#94a3b8')
        }))
        .sort((a, b) => b.seats - a.seats);
};

export const MOCK_SEATING_DATA = {
    lok_sabha: calculateComposition(MAPPED_MEMBERS, 'lok_sabha'),
    rajya_sabha: calculateComposition(RS_REAL_MEMBERS, 'rajya_sabha')
};

export const MOCK_NEWS = [
    {
        id: 1,
        headline: "Lok Sabha passes historic Women's Reservation Bill",
        house: 'lok_sabha',
        time: '2h ago',
        category: 'Bill Passed'
    },
    {
        id: 2,
        headline: "Rajya Sabha debates new Education Policy nuances",
        house: 'rajya_sabha',
        time: '4h ago',
        category: 'Debate'
    },
    {
        id: 3,
        headline: "Speaker suspends question hour due to uproar",
        house: 'lok_sabha',
        time: '1d ago',
        category: 'Procedure'
    },
    {
        id: 4,
        headline: "Committee on External Affairs submits report in Upper House",
        house: 'rajya_sabha',
        time: '2d ago',
        category: 'Report'
    }
];
