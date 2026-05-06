import apData from '../data/andhra_pradesh_assembly_2026.json';
import tgData from '../data/states/state_telangana_2026.json';
import { INDIAN_STATES } from './stateConfig';

// Types
export interface AssemblyMember {
    id: string;
    name: string;
    party: string;
    constituency: string;
    image: string;
}

export interface StateLeadership {
    governor?: { name: string; image: string; role: string };
    chief_minister?: { name: string; image: string; role: string };
    speaker?: { name: string; image: string; role: string };
}

export interface StateData {
    id: string;
    name: string;
    leadership: StateLeadership;
    members: AssemblyMember[];
    total_seats: number;
}

// Map of imported JSONs
const STATE_RESOURCES: any = {
    'andhra-pradesh': {
        name: 'Andhra Pradesh',
        data: apData
    },
    'telangana': {
        name: 'Telangana',
        data: tgData
    }
    // Add others as they are scraped
};

export const getStateData = (stateId: string): StateData | null => {
    const resource = STATE_RESOURCES[stateId];
    if (!resource) return null;

    const raw = resource.data;

    // Normalize Data Structure (Handling different scraper outputs)
    let members: AssemblyMember[] = [];
    let leadership: StateLeadership = {};

    if (stateId === 'andhra-pradesh') {
        // AP Format (List of objects)
        members = raw.map((m: any, idx: number) => ({
            id: `ap-mla-${idx}`,
            name: m.member,
            party: m.party,
            constituency: m.constituency,
            image: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(m.member) + '&background=random'
        }));
        // Mock Leadership for AP (until scraped properly in generic)
        leadership = {
            governor: { name: "S. Abdul Nazeer", role: "Governor", image: "https://ui-avatars.com/api/?name=S+Abdul+Nazeer" },
            chief_minister: { name: "N. Chandrababu Naidu", role: "Chief Minister", image: "https://ui-avatars.com/api/?name=Chandrababu+Naidu" }
        };
    } else if (stateId === 'telangana') {
        // Generic Format (Object with members array)
        members = raw.members.map((m: any, idx: number) => ({
            id: `tg-mla-${idx}`,
            name: m.name,
            party: m.party,
            constituency: m.constituency,
            image: m.image
        }));
        leadership = raw.leadership;
    }

    return {
        id: stateId,
        name: resource.name,
        leadership,
        members,
        total_seats: members.length
    };
};


// Legacy Type Support (to prevent build errors in other files)
export interface StateDetails {
    id: string;
    name: string;
    capital: string;
    population: string;
    is_union_territory: boolean;
    metrics: {
        gdpGrowth: number;
        literacyRate: number;
        unemployment: number;
        healthcareIndex: number;
    };
    description: string;
    leader: {
        title: string;
        name: string;
        image: string;
        party?: string;
        alliance?: string;
    };
    assembly?: {
        total_seats: number;
        term: string;
        members: any[];
    }
}

const REAL_POLITICAL_DATA: Record<string, any> = {
    // STATES
    "AP": { leader: "N. Chandrababu Naidu", party: "TDP", alliance: "NDA", role: "Chief Minister", metrics: { gdpGrowth: 10.5, literacyRate: 67.0, unemployment: 4.5, healthcareIndex: 65 }, desc: "Focusing on Amaravati development and digital governance." },
    "AR": { leader: "Pema Khandu", party: "BJP", alliance: "NDA", role: "Chief Minister", metrics: { gdpGrowth: 9.6, literacyRate: 65.3, unemployment: 5.2, healthcareIndex: 58 }, desc: "Promoting border infrastructure and eco-tourism." },
    "AS": { leader: "Himanta Biswa Sarma", party: "BJP", alliance: "NDA", role: "Chief Minister", metrics: { gdpGrowth: 12.0, literacyRate: 72.1, unemployment: 5.8, healthcareIndex: 55 }, desc: "Accelerating industrial growth and connectivity." },
    "BR": { leader: "Nitish Kumar", party: "JD(U)", alliance: "NDA", role: "Chief Minister", metrics: { gdpGrowth: 10.9, literacyRate: 61.8, unemployment: 6.5, healthcareIndex: 50 }, desc: "Emphasis on social engineering and rural development." },
    "CG": { leader: "Vishnudeo Sai", party: "BJP", alliance: "NDA", role: "Chief Minister", metrics: { gdpGrowth: 8.2, literacyRate: 70.2, unemployment: 4.2, healthcareIndex: 52 }, desc: "Boosting tribal welfare and mining sector reforms." },
    "GA": { leader: "Pramod Sawant", party: "BJP", alliance: "NDA", role: "Chief Minister", metrics: { gdpGrowth: 9.8, literacyRate: 88.7, unemployment: 9.7, healthcareIndex: 75 }, desc: "Sustaining tourism leadership and IT growth." },
    "GJ": { leader: "Bhupendrabhai Patel", party: "BJP", alliance: "NDA", role: "Chief Minister", metrics: { gdpGrowth: 11.5, literacyRate: 78.0, unemployment: 2.1, healthcareIndex: 70 }, desc: "Leading in industrial output and export infrastructure." },
    "HR": { leader: "Nayab Singh Saini", party: "BJP", alliance: "NDA", role: "Chief Minister", metrics: { gdpGrowth: 8.5, literacyRate: 75.5, unemployment: 6.1, healthcareIndex: 68 }, desc: "Focus on agriculture capabilities and sports infrastructure." },
    "HP": { leader: "Sukhvinder Singh Sukhu", party: "INC", alliance: "INDIA", role: "Chief Minister", metrics: { gdpGrowth: 7.2, literacyRate: 82.8, unemployment: 4.4, healthcareIndex: 72 }, desc: "Promoting green energy and sustainable tourism." },
    "JH": { leader: "Hemant Soren", party: "JMM", alliance: "INDIA", role: "Chief Minister", metrics: { gdpGrowth: 7.8, literacyRate: 66.4, unemployment: 5.5, healthcareIndex: 51 }, desc: "Advocating for tribal rights and mineral revenue share." },
    "KA": { leader: "Siddaramaiah", party: "INC", alliance: "INDIA", role: "Chief Minister", metrics: { gdpGrowth: 9.4, literacyRate: 75.3, unemployment: 3.5, healthcareIndex: 70 }, desc: "Driving the tech ecosystem and social welfare guarantees." },
    "KL": { leader: "Pinarayi Vijayan", party: "CPI(M)", alliance: "INDIA", role: "Chief Minister", metrics: { gdpGrowth: 6.8, literacyRate: 94.0, unemployment: 7.0, healthcareIndex: 82 }, desc: "Leader in human development indices and healthcare." },
    "MP": { leader: "Mohan Yadav", party: "BJP", alliance: "NDA", role: "Chief Minister", metrics: { gdpGrowth: 10.1, literacyRate: 69.3, unemployment: 3.8, healthcareIndex: 56 }, desc: "Expanding irrigation and agricultural production." },
    "MH": { leader: "Eknath Shinde", party: "Shiv Sena", alliance: "NDA", role: "Chief Minister", metrics: { gdpGrowth: 8.8, literacyRate: 82.3, unemployment: 3.9, healthcareIndex: 69 }, desc: "Major infrastructure projects and industrial corridors." },
    "MN": { leader: "N. Biren Singh", party: "BJP", alliance: "NDA", role: "Chief Minister", metrics: { gdpGrowth: 6.5, literacyRate: 76.9, unemployment: 8.5, healthcareIndex: 58 }, desc: "Focusing on peace restoration and border trade." },
    "ML": { leader: "Conrad Sangma", party: "NPP", alliance: "NDA", role: "Chief Minister", metrics: { gdpGrowth: 7.0, literacyRate: 74.4, unemployment: 6.0, healthcareIndex: 55 }, desc: "Enhancing tourism and education infrastructure." },
    "MZ": { leader: "Lalduhoma", party: "ZPM", alliance: "Others", role: "Chief Minister", metrics: { gdpGrowth: 8.1, literacyRate: 91.3, unemployment: 4.1, healthcareIndex: 65 }, desc: "Implementing new economic policies and administrative reforms." },
    "NL": { leader: "Neiphiu Rio", party: "NDPP", alliance: "NDA", role: "Chief Minister", metrics: { gdpGrowth: 6.9, literacyRate: 79.5, unemployment: 9.1, healthcareIndex: 54 }, desc: "Prioritizing peace process and youth employment." },
    "OD": { leader: "Mohan Charan Majhi", party: "BJP", alliance: "NDA", role: "Chief Minister", metrics: { gdpGrowth: 8.5, literacyRate: 72.8, unemployment: 5.3, healthcareIndex: 57 }, desc: "Leveraging mineral wealth for industrialization." },
    "PB": { leader: "Bhagwant Singh Mann", party: "AAP", alliance: "INDIA", role: "Chief Minister", metrics: { gdpGrowth: 6.2, literacyRate: 75.8, unemployment: 7.4, healthcareIndex: 66 }, desc: "Combating drug menace and revitalizing agriculture." },
    "RJ": { leader: "Bhajan Lal Sharma", party: "BJP", alliance: "NDA", role: "Chief Minister", metrics: { gdpGrowth: 9.1, literacyRate: 66.1, unemployment: 4.8, healthcareIndex: 60 }, desc: "Boosting tourism and renewable energy sectors." },
    "SK": { leader: "Prem Singh Tamang", party: "SKM", alliance: "NDA", role: "Chief Minister", metrics: { gdpGrowth: 7.5, literacyRate: 81.4, unemployment: 3.2, healthcareIndex: 70 }, desc: "Promoting organic farming and ecotourism." },
    "TN": { leader: "M. K. Stalin", party: "DMK", alliance: "INDIA", role: "Chief Minister", metrics: { gdpGrowth: 11.2, literacyRate: 80.0, unemployment: 4.1, healthcareIndex: 74 }, desc: "Dravidian model of inclusive growth and industrialization." },
    "TS": { leader: "A. Revanth Reddy", party: "INC", alliance: "INDIA", role: "Chief Minister", metrics: { gdpGrowth: 10.8, literacyRate: 72.8, unemployment: 4.4, healthcareIndex: 68 }, desc: "Focus on Hyderabad's global status and rural welfare." },
    "TR": { leader: "Manik Saha", party: "BJP", alliance: "NDA", role: "Chief Minister", metrics: { gdpGrowth: 8.4, literacyRate: 87.2, unemployment: 1.4, healthcareIndex: 62 }, desc: "Strengthening connectivity with Bangladesh and IT sector." },
    "UP": { leader: "Yogi Adityanath", party: "BJP", alliance: "NDA", role: "Chief Minister", metrics: { gdpGrowth: 9.5, literacyRate: 67.6, unemployment: 4.2, healthcareIndex: 55 }, desc: "Law and order reforms and massive infrastructure rollout." },
    "UK": { leader: "Pushkar Singh Dhami", party: "BJP", alliance: "NDA", role: "Chief Minister", metrics: { gdpGrowth: 7.9, literacyRate: 78.8, unemployment: 5.1, healthcareIndex: 64 }, desc: "Implementation of UCC and tourism enhancement." },
    "WB": { leader: "Mamata Banerjee", party: "AITC", alliance: "INDIA", role: "Chief Minister", metrics: { gdpGrowth: 8.1, literacyRate: 76.2, unemployment: 4.9, healthcareIndex: 61 }, desc: "Social welfare schemes and MSME growth." },

    // UTs
    "DL": { leader: "Rekha Gupta", party: "BJP", alliance: "NDA", role: "Chief Minister", metrics: { gdpGrowth: 9.2, literacyRate: 86.2, unemployment: 5.5, healthcareIndex: 80 }, desc: "Capital infrastructure and pollution control initiatives." },
    "JK": { leader: "Omar Abdullah", party: "JKNC", alliance: "INDIA", role: "Chief Minister", metrics: { gdpGrowth: 6.5, literacyRate: 67.1, unemployment: 4.4, healthcareIndex: 58 }, desc: "Restoration of statehood and economic stability." },
    "PY": { leader: "N. Rangaswamy", party: "AINRC", alliance: "NDA", role: "Chief Minister", metrics: { gdpGrowth: 7.1, literacyRate: 85.8, unemployment: 6.2, healthcareIndex: 72 }, desc: "Tourism and industrial development." },
    "AN": { leader: "DK Joshi", party: "N/A", alliance: "N/A", role: "Lt. Governor", metrics: { gdpGrowth: 6.0, literacyRate: 86.6, unemployment: 8.0, healthcareIndex: 65 }, desc: "Strategic island development." },
    "CH": { leader: "Banwarilal Purohit", party: "N/A", alliance: "N/A", role: "Administrator", metrics: { gdpGrowth: 7.5, literacyRate: 86.0, unemployment: 6.0, healthcareIndex: 78 }, desc: "Urban planning excellence." },
    "DN": { leader: "Praful Khoda Patel", party: "N/A", alliance: "N/A", role: "Administrator", metrics: { gdpGrowth: 6.8, literacyRate: 76.2, unemployment: 4.0, healthcareIndex: 60 }, desc: "Industrial hub development." },
    "LA": { leader: "B.D. Mishra", party: "N/A", alliance: "N/A", role: "Lt. Governor", metrics: { gdpGrowth: 5.5, literacyRate: 77.0, unemployment: 6.0, healthcareIndex: 55 }, desc: "Sustainable mountain development." },
    "LD": { leader: "Praful Khoda Patel", party: "N/A", alliance: "N/A", role: "Administrator", metrics: { gdpGrowth: 5.0, literacyRate: 91.8, unemployment: 11.1, healthcareIndex: 68 }, desc: "Eco-tourism and fisheries." }
};

// Legacy Function Stub (returns mock data if called)
// Enhanced function to return Real Data
export const getStateDetails = (stateId: string): StateDetails | null => {
    const config = INDIAN_STATES.find(s => s.id.toLowerCase() === stateId.toLowerCase() || s.code === stateId);
    if (!config) return null;

    // Fetch real data or fall back to generic defaults
    const realData = REAL_POLITICAL_DATA[config.id] || {
        leader: "TBD", party: "N/A", alliance: "N/A", role: "Chief Minister",
        metrics: { gdpGrowth: 6.0, literacyRate: 70.0, unemployment: 5.0, healthcareIndex: 50 },
        desc: "Data pending update."
    };

    const leaderName = typeof realData.leader === 'string' ? realData.leader : realData.leader.name;

    return {
        id: config.id,
        name: config.name,
        capital: config.capital,
        population: 'N/A', // Could add this to real data too if needed
        is_union_territory: config.type === 'ut',
        metrics: realData.metrics,
        description: realData.desc,
        leader: {
            title: realData.role || 'Chief Minister',
            name: leaderName,
            image: `https://ui-avatars.com/api/?name=${encodeURIComponent(leaderName)}&background=random`,
            party: realData.party,
            alliance: realData.alliance
        }
    };
};

export const getAllStates = () => INDIAN_STATES.map(s => ({ id: s.id, name: s.name }));
