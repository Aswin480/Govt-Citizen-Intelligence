import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMap, Tooltip as LeafletTooltip, GeoJSON as LeafletGeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
    Users, ChevronRight, Gavel,
    Target, AlertTriangle, Globe,
    BookOpen, HeartPulse, MessageSquare,
    Map as MapIcon, RotateCcw
} from 'lucide-react';

interface PoliticalMapProps { }

type Alliance = 'NDA' | 'INDIA' | 'OTHERS' | 'CENTRAL';
type MapLayer = 'POLITICAL' | 'DEVELOPMENT' | 'GRIEVANCE' | 'LITERACY';

// Enhanced Data Structure for "Society Needed" insights
interface StateData {
    id: string;
    name: string;
    nativeName: string; // "Everyone understandable"
    alliance: Alliance;
    party: string;
    seats: number;
    swing: string;
    cm: string;
    governor: string;
    battleground?: boolean;
    literacy: number; // Percentage
    hdi: number; // Human Development Index (0-1)
    grievanceLevel: 'Low' | 'Medium' | 'High' | 'Critical';
    topScheme: string;
    population: string;
    lat: number;
    lng: number;
}

const STATE_DATA: StateData[] = [
    { id: 'JK', name: 'Jammu & Kashmir', nativeName: 'جموں و کشمیر', alliance: 'CENTRAL', party: 'Central Admin', seats: 5, swing: 'N/A', cm: 'LG Admin', governor: 'Manoj Sinha', grievanceLevel: 'High', literacy: 77.3, hdi: 0.699, topScheme: 'Ayushman Bharat', population: '13.6M', lat: 33.77, lng: 76.57 },
    { id: 'LA', name: 'Ladakh', nativeName: 'لداخ', alliance: 'CENTRAL', party: 'Central Admin', seats: 1, swing: 'N/A', cm: 'LG Admin', governor: 'B.D. Mishra', grievanceLevel: 'Medium', literacy: 90.3, hdi: 0.699, topScheme: 'Carbon Neutral Ladakh', population: '0.3M', lat: 34.15, lng: 77.57 },
    { id: 'HP', name: 'Himachal Pradesh', nativeName: 'हिमाचल प्रदेश', alliance: 'INDIA', party: 'INC', seats: 4, swing: '+5.4%', cm: 'Sukhvinder Singh Sukhu', governor: 'Shiv Pratap Shukla', grievanceLevel: 'Low', literacy: 86.6, hdi: 0.739, topScheme: 'Himcare', population: '7.5M', lat: 31.92, lng: 77.20 },
    { id: 'PB', name: 'Punjab', nativeName: 'ਪੰਜਾਬ', alliance: 'INDIA', party: 'AAP', seats: 13, swing: '+12.3%', cm: 'Bhagwant Mann', governor: 'Banwarilal Purohit', grievanceLevel: 'High', literacy: 83.7, hdi: 0.738, topScheme: 'Aam Aadmi Clinics', population: '30.8M', lat: 30.90, lng: 75.85 },
    { id: 'UK', name: 'Uttarakhand', nativeName: 'उत्तराखंड', alliance: 'NDA', party: 'BJP', seats: 5, swing: '+1.8%', cm: 'Pushkar Singh Dhami', governor: 'Gurmit Singh', grievanceLevel: 'Medium', literacy: 87.6, hdi: 0.739, topScheme: 'Ghasyari Kalyan Yojana', population: '11.6M', lat: 30.06, lng: 79.01 },
    { id: 'HR', name: 'Haryana', nativeName: 'हरियाणा', alliance: 'NDA', party: 'BJP', seats: 10, swing: '-2.5%', cm: 'Nayab Singh Saini', governor: 'Bandaru Dattatreya', battleground: true, grievanceLevel: 'High', literacy: 80.4, hdi: 0.724, topScheme: 'Parivar Pehchan Patra', population: '28.9M', lat: 29.05, lng: 76.08 },
    { id: 'DL', name: 'Delhi', nativeName: 'दिल्ली', alliance: 'NDA', party: 'BJP', seats: 7, swing: '+12.1%', cm: 'LoP (Projected)', governor: 'Vinai Kumar Saxena', grievanceLevel: 'High', literacy: 88.7, hdi: 0.758, topScheme: 'Central Dev Goals', population: '20.5M', lat: 28.70, lng: 77.10 },
    { id: 'RJ', name: 'Rajasthan', nativeName: 'राजस्थान', alliance: 'NDA', party: 'BJP', seats: 25, swing: '+8.7%', cm: 'Bhajan Lal Sharma', governor: 'Kalraj Mishra', grievanceLevel: 'Medium', literacy: 69.7, hdi: 0.638, topScheme: 'Chiranjeevi Yojana', population: '81.0M', lat: 26.50, lng: 73.80 },
    { id: 'UP', name: 'Uttar Pradesh', nativeName: 'उत्तर प्रदेश', alliance: 'NDA', party: 'BJP', seats: 80, swing: '-5.2%', cm: 'Yogi Adityanath', governor: 'Anandiben Patel', battleground: true, grievanceLevel: 'High', literacy: 73.0, hdi: 0.600, topScheme: 'Kanya Sumangala', population: '235.6M', lat: 27.00, lng: 80.90 },
    { id: 'BR', name: 'Bihar', nativeName: 'बिहार', alliance: 'NDA', party: 'JD(U)+BJP', seats: 40, swing: '+3.4%', cm: 'Nitish Kumar', governor: 'Rajendra Arlekar', grievanceLevel: 'Critical', literacy: 70.9, hdi: 0.581, topScheme: 'Saat Nischay', population: '126.7M', lat: 25.60, lng: 85.50 },
    { id: 'SK', name: 'Sikkim', nativeName: 'सिक्किम', alliance: 'NDA', party: 'SKM', seats: 1, swing: '+0.5%', cm: 'Prem Singh Tamang', governor: 'Lakshman Acharya', grievanceLevel: 'Low', literacy: 82.6, hdi: 0.728, topScheme: 'Aama Yojana', population: '0.7M', lat: 27.53, lng: 88.51 },
    { id: 'AR', name: 'Arunachal Pradesh', nativeName: 'अरुणाचल प्रदेश', alliance: 'NDA', party: 'BJP', seats: 2, swing: '+6.1%', cm: 'Pema Khandu', governor: 'Kaiwalya Trivikram Parnaik', grievanceLevel: 'Medium', literacy: 66.9, hdi: 0.669, topScheme: 'Dekho Apna Pradesh', population: '1.5M', lat: 28.21, lng: 94.72 },
    { id: 'AS', name: 'Assam', nativeName: 'অসম', alliance: 'NDA', party: 'BJP+', seats: 14, swing: '+4.2%', cm: 'Himanta Biswa Sarma', governor: 'Gulab Chand Kataria', grievanceLevel: 'Medium', literacy: 73.1, hdi: 0.623, topScheme: 'Orunodoi', population: '35.7M', lat: 26.20, lng: 92.93 },
    { id: 'NL', name: 'Nagaland', nativeName: 'नागालैंड', alliance: 'NDA', party: 'NDPP', seats: 1, swing: '+0.2%', cm: 'Neiphiu Rio', governor: 'La. Ganesan', grievanceLevel: 'Medium', literacy: 80.1, hdi: 0.690, topScheme: 'CM Micro Finance', population: '2.2M', lat: 26.15, lng: 94.56 },
    { id: 'MN', name: 'Manipur', nativeName: 'মণিপুর', alliance: 'NDA', party: 'BJP', seats: 2, swing: '-8.5%', cm: 'N. Biren Singh', governor: 'Anusuiya Uikey', battleground: true, grievanceLevel: 'Critical', literacy: 79.8, hdi: 0.704, topScheme: 'CM-gi Hakshelgi Tengbang', population: '3.2M', lat: 24.66, lng: 93.90 },
    { id: 'MZ', name: 'Mizoram', nativeName: 'मिजोरम', alliance: 'OTHERS', party: 'ZPM', seats: 1, swing: '+22.1%', cm: 'Lalduhoma', governor: 'Hari Babu Kambhampati', grievanceLevel: 'Low', literacy: 91.5, hdi: 0.709, topScheme: 'SEDP', population: '1.2M', lat: 23.16, lng: 92.93 },
    { id: 'TR', name: 'Tripura', nativeName: 'त्रिपुरा', alliance: 'NDA', party: 'BJP', seats: 2, swing: '+3.8%', cm: 'Manik Saha', governor: 'Nallu Indrasena Reddy', grievanceLevel: 'Medium', literacy: 87.7, hdi: 0.667, topScheme: 'Amar Sarkar', population: '4.1M', lat: 23.94, lng: 91.98 },
    { id: 'ML', name: 'Meghalaya', nativeName: 'मेघालय', alliance: 'NDA', party: 'NPP', seats: 2, swing: '+1.5%', cm: 'Conrad Sangma', governor: 'Phagu Chauhan', grievanceLevel: 'Medium', literacy: 75.4, hdi: 0.659, topScheme: 'FOCUS', population: '3.3M', lat: 25.46, lng: 91.36 },
    { id: 'WB', name: 'West Bengal', nativeName: 'পশ্চিমবঙ্গ', alliance: 'INDIA', party: 'TMC', seats: 42, swing: '-3.2%', cm: 'Mamata Banerjee', governor: 'C.V. Ananda Bose', battleground: true, grievanceLevel: 'High', literacy: 80.5, hdi: 0.652, topScheme: 'Lakshmir Bhandar', population: '98.6M', lat: 22.98, lng: 87.85 },
    { id: 'JH', name: 'Jharkhand', nativeName: 'झारखंड', alliance: 'INDIA', party: 'JMM+', seats: 14, swing: '+2.9%', cm: 'Champai Soren', governor: 'C.P. Radhakrishnan', grievanceLevel: 'High', literacy: 74.3, hdi: 0.608, topScheme: 'Abua Awas Yojana', population: '39.4M', lat: 23.61, lng: 85.27 },
    { id: 'OD', name: 'Odisha', nativeName: 'ଓଡ଼ିଶା', alliance: 'NDA', party: 'BJP', seats: 21, swing: '+18.4%', cm: 'Mohan Charan Majhi', governor: 'Raghubar Das', grievanceLevel: 'Medium', literacy: 77.3, hdi: 0.615, topScheme: 'KALIA', population: '47.9M', lat: 20.25, lng: 84.40 },
    { id: 'CG', name: 'Chhattisgarh', nativeName: 'छत्तीसगढ़', alliance: 'NDA', party: 'BJP', seats: 11, swing: '+7.6%', cm: 'Vishnu Deo Sai', governor: 'Biswabhusan Harichandan', grievanceLevel: 'High', literacy: 74.5, hdi: 0.622, topScheme: 'Mahtari Vandana', population: '30.1M', lat: 21.27, lng: 81.60 },
    { id: 'MP', name: 'Madhya Pradesh', nativeName: 'मध्य प्रदेश', alliance: 'NDA', party: 'BJP', seats: 29, swing: '+10.5%', cm: 'Mohan Yadav', governor: 'Mangubhai C. Patel', grievanceLevel: 'Medium', literacy: 73.7, hdi: 0.613, topScheme: 'Ladli Behna', population: '86.5M', lat: 23.25, lng: 77.40 },
    { id: 'GJ', name: 'Gujarat', nativeName: 'ગુજરાત', alliance: 'NDA', party: 'BJP', seats: 26, swing: '+2.1%', cm: 'Bhupendrabhai Patel', governor: 'Acharya Devvrat', grievanceLevel: 'Low', literacy: 82.4, hdi: 0.685, topScheme: 'Vahli Dikri', population: '71.5M', lat: 22.25, lng: 71.19 },
    { id: 'MH', name: 'Maharashtra', nativeName: 'महाराष्ट्र', alliance: 'NDA', party: 'Mahayuti (BJP+)', seats: 48, swing: '-4.8%', cm: 'Eknath Shinde', governor: 'Ramesh Bais', battleground: true, grievanceLevel: 'High', literacy: 84.8, hdi: 0.709, topScheme: 'Ladki Bahin', population: '126.3M', lat: 19.66, lng: 75.30 },
    { id: 'GA', name: 'Goa', nativeName: 'गोआ', alliance: 'NDA', party: 'BJP', seats: 2, swing: '+1.2%', cm: 'Pramod Sawant', governor: 'P.S. Sreedharan Pillai', grievanceLevel: 'Low', literacy: 88.7, hdi: 0.761, topScheme: 'Griha Aadhar', population: '1.5M', lat: 15.30, lng: 74.12 },
    { id: 'KA', name: 'Karnataka', nativeName: 'ಕರ್ನಾಟಕ', alliance: 'INDIA', party: 'INC', seats: 28, swing: '+11.2%', cm: 'Siddaramaiah', governor: 'Thawar Chand Gehlot', grievanceLevel: 'Medium', literacy: 77.2, hdi: 0.695, topScheme: 'Gruha Lakshmi', population: '67.6M', lat: 14.70, lng: 76.00 },
    { id: 'AP', name: 'Andhra Pradesh', nativeName: 'ఆంధ్రప్రదేశ్', alliance: 'NDA', party: 'TDP+', seats: 25, swing: '+15.4%', cm: 'N. Chandrababu Naidu', governor: 'S. Abdul Nazeer', grievanceLevel: 'Medium', literacy: 67.4, hdi: 0.659, topScheme: 'YSR Rythu Bharosa', population: '53.1M', lat: 15.91, lng: 79.74 },
    { id: 'TG', name: 'Telangana', nativeName: 'తెలంగాణ', alliance: 'INDIA', party: 'INC', seats: 17, swing: '+8.9%', cm: 'Revanth Reddy', governor: 'C.P. Radhakrishnan', grievanceLevel: 'Medium', literacy: 72.8, hdi: 0.675, topScheme: 'Rythu Bandhu', population: '38.0M', lat: 17.80, lng: 79.00 },
    { id: 'KL', name: 'Kerala', nativeName: 'കേരളം', alliance: 'INDIA', party: 'UDF', seats: 20, swing: '-1.2%', cm: 'Pinarayi Vijayan', governor: 'Arif Mohammed Khan', grievanceLevel: 'Medium', literacy: 96.2, hdi: 0.790, topScheme: 'Life Mission', population: '35.8M', lat: 10.50, lng: 76.25 },
    { id: 'TN', name: 'Tamil Nadu', nativeName: 'தமிழ்நாடு', alliance: 'INDIA', party: 'DMK+', seats: 39, swing: '+3.5%', cm: 'M.K. Stalin', governor: 'R.N. Ravi', grievanceLevel: 'Low', literacy: 82.9, hdi: 0.718, topScheme: 'Kalaignar Magalir Urimai', population: '76.8M', lat: 11.00, lng: 78.40 },
    // Union Territories
    { id: 'PY', name: 'Puducherry', nativeName: 'புதுச்சேரி', alliance: 'INDIA', party: 'INC/UPA', seats: 1, swing: 'N/A', cm: 'N. Rangasamy', governor: 'Tamilisai Soundararajan', grievanceLevel: 'Medium', literacy: 85.8, hdi: 0.738, topScheme: 'Welfare', population: '1.4M', lat: 11.94, lng: 79.80 },
    { id: 'CH', name: 'Chandigarh', nativeName: 'चंडीगढ़', alliance: 'CENTRAL', party: 'Central Admin', seats: 1, swing: 'N/A', cm: 'Central Admin', governor: 'Banwarilal Purohit', grievanceLevel: 'Low', literacy: 86.0, hdi: 0.775, topScheme: 'Urban Dev', population: '1.2M', lat: 30.73, lng: 76.77 },
    { id: 'AN', name: 'Andaman & Nicobar', nativeName: 'अंडमान और निकोबार', alliance: 'CENTRAL', party: 'Central Admin', seats: 1, swing: 'N/A', cm: 'Central Admin', governor: 'Admiral D K Joshi', grievanceLevel: 'Low', literacy: 86.6, hdi: 0.739, topScheme: 'Island Dev', population: '0.4M', lat: 11.74, lng: 92.65 },
    { id: 'LD', name: 'Lakshadweep', nativeName: 'லட்சத்தீவு', alliance: 'CENTRAL', party: 'Central Admin', seats: 1, swing: 'N/A', cm: 'Central Admin', governor: 'Praful Patel', grievanceLevel: 'Low', literacy: 91.8, hdi: 0.750, topScheme: 'Blue Economy', population: '0.06M', lat: 10.57, lng: 72.64 },
    { id: 'DN', name: 'Dadra & Nagar Haveli', nativeName: 'दादरा और नगर हवेली', alliance: 'CENTRAL', party: 'Central Admin', seats: 1, swing: 'N/A', cm: 'Central Admin', governor: 'Praful Patel', grievanceLevel: 'Medium', literacy: 76.2, hdi: 0.663, topScheme: 'Tribal Welfare', population: '0.6M', lat: 20.18, lng: 73.01 }
];

const MapController = ({ selectedState }: { selectedState: StateData | null }) => {
    const map = useMap();
    useEffect(() => {
        if (selectedState) {
            map.flyTo([selectedState.lat, selectedState.lng], 7, { duration: 1.5 });
        }
    }, [selectedState, map]);
    return null;
};

// Helper: Normalize GeoJSON State Names to specific IDs in STATE_DATA
const normalizeStateId = (geoName: string): string | null => {
    if (!geoName) return null;
    const name = geoName.trim();
    const map: Record<string, string> = {
        "Andhra Pradesh": "AP",
        "Arunachal Pradesh": "AR",
        "Assam": "AS",
        "Bihar": "BR",
        "Chhattisgarh": "CG",
        "Delhi": "DL",
        "NCT of Delhi": "DL",
        "New Delhi": "DL",
        "Goa": "GA",
        "Gujarat": "GJ",
        "Haryana": "HR",
        "Himachal Pradesh": "HP",
        "Jammu & Kashmir": "JK",
        "Jammu and Kashmir": "JK",
        "Jharkhand": "JH",
        "Karnataka": "KA",
        "Kerala": "KL",
        "Ladakh": "LA",
        "Madhya Pradesh": "MP",
        "Maharashtra": "MH",
        "Manipur": "MN",
        "Meghalaya": "ML",
        "Mizoram": "MZ",
        "Nagaland": "NL",
        "Odisha": "OD",
        "Orissa": "OD",
        "Punjab": "PB",
        "Rajasthan": "RJ",
        "Sikkim": "SK",
        "Tamil Nadu": "TN",
        "Telangana": "TG",
        "Tripura": "TR",
        "Uttar Pradesh": "UP",
        "Uttarakhand": "UK",
        "Uttaranchal": "UK",
        "West Bengal": "WB",
        "Dadra and Nagar Haveli and Daman and Diu": "DN",
        "Daman and Diu": "DN",
        "Dadra and Nagar Haveli": "DN",
        "Andaman & Nicobar Island": "AN",
        "Andaman and Nicobar Islands": "AN",
        "Chandigarh": "CH",
        "Lakshadweep": "LD",
        "Puducherry": "PY",
        "Pondicherry": "PY"
    };
    return map[name] || map[name.replace(/&/g, 'and')] || null;
};

export const PoliticalMap: React.FC<PoliticalMapProps> = () => {
    const [selectedState, setSelectedState] = useState<StateData | null>(null);
    const [activeLayer, setActiveLayer] = useState<MapLayer>('POLITICAL');
    const [geoJsonData, setGeoJsonData] = useState<any>(null);

    useEffect(() => {
        // Fetch Updated India GeoJSON (2020+ boundaries with Ladakh)
        // Using a reliable source for updated map
        fetch('https://raw.githubusercontent.com/Subhash9325/GeoJson-Data-of-Indian-States/master/Indian_States')
            .then(res => res.json())
            .then(data => setGeoJsonData(data))
            .catch(err => {
                console.error("Failed to load map data", err);
                // Fallback to previous source if this fails
                fetch('https://raw.githubusercontent.com/geohacker/india/master/state/india_telengana.geojson')
                    .then(r => r.json())
                    .then(d => setGeoJsonData(d));
            });
    }, []);

    const getFillColor = (state: StateData) => {
        if (activeLayer === 'POLITICAL') {
            const alliance = state.alliance;
            switch (alliance) {
                case 'NDA': return '#f97316'; // Orange
                case 'INDIA': return '#06b6d4'; // Cyan
                case 'OTHERS': return '#8b5cf6'; // Violet
                case 'CENTRAL': return '#eab308'; // Yellow
                default: return '#64748b';
            }
        }
        if (activeLayer === 'GRIEVANCE') {
            switch (state.grievanceLevel) {
                case 'Critical': return '#ef4444'; // Red
                case 'High': return '#f97316'; // Orange
                case 'Medium': return '#eab308'; // Yellow
                case 'Low': return '#22c55e'; // Green
            }
        }
        if (activeLayer === 'LITERACY') {
            return state.literacy > 90 ? '#15803d' :
                state.literacy > 80 ? '#22c55e' :
                    state.literacy > 70 ? '#eab308' :
                        state.literacy > 60 ? '#f97316' : '#ef4444';
        }
        return '#64748b';
    };

    const getKeyColor = (color: string) => {
        // Helper to get hex from tailwind-like logic if needed, but getFillColor returns hex
        return color;
    };

    const regionStyle = (feature: any) => {
        const id = normalizeStateId(feature.properties.NAME_1 || feature.properties.st_nm); // GeoJSON property keys vary
        const state = STATE_DATA.find(s => s.id === id);

        if (!state) {
            return {
                fillColor: '#1e293b',
                weight: 0.5,
                opacity: 0.5,
                color: '#334155',
                fillOpacity: 0.2
            };
        }

        const color = getFillColor(state);
        const isSelected = selectedState?.id === state.id;

        return {
            fillColor: color,
            weight: isSelected ? 2 : 1,
            opacity: 1,
            color: isSelected ? '#ffffff' : '#475569', // Border color
            fillOpacity: isSelected ? 0.6 : 0.25 // Light shadow effect (low opacity)
        };
    };

    const onEachFeature = (feature: any, layer: any) => {
        const id = normalizeStateId(feature.properties.NAME_1 || feature.properties.st_nm);
        const state = STATE_DATA.find(s => s.id === id);

        if (state) {
            layer.on({
                click: () => {
                    setSelectedState(state);
                },
                mouseover: (e: any) => {
                    e.target.setStyle({ weight: 2, color: '#94a3b8', fillOpacity: 0.4 });
                },
                mouseout: (e: any) => {
                    const isSelected = selectedState?.id === state.id;
                    e.target.setStyle({
                        weight: isSelected ? 2 : 1,
                        color: isSelected ? '#ffffff' : '#475569',
                        fillOpacity: isSelected ? 0.6 : 0.25
                    });
                }
            });
            // Optional: Tooltip
            // layer.bindTooltip(state.name, { direction: 'center', permanent: false, className: 'leaflet-tooltip-own' });
        }
    };

    return (
        <div className="flex gap-6 h-[700px] animate-fade-in font-sans">
            {/* === LEFT: MAP AREA === */}
            <div className="flex-1 bg-slate-900/50 rounded-[2.5rem] border border-slate-800 shadow-xl relative overflow-hidden flex flex-col backdrop-blur-sm">

                {/* Layer Toggles */}
                <div className="absolute top-8 left-8 z-[500] flex flex-col gap-2 pointer-events-auto">
                    <h2 className="text-2xl font-black text-white flex items-center gap-2 mb-2 drop-shadow-md">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" className="h-10 opacity-100 drop-shadow-sm invert" alt="Govt" />
                        Bharat Map
                    </h2>

                    <div className="flex bg-slate-800/80 backdrop-blur-md rounded-xl p-1.5 shadow-lg border border-slate-700 w-fit">
                        {[
                            { id: 'POLITICAL', icon: Globe, label: 'Political' },
                            { id: 'GRIEVANCE', icon: AlertTriangle, label: 'Grievances' },
                            { id: 'LITERACY', icon: BookOpen, label: 'Literacy' }
                        ].map((layer) => {
                            const Icon = layer.icon;
                            return (
                                <button
                                    key={layer.id}
                                    onClick={() => setActiveLayer(layer.id as MapLayer)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeLayer === layer.id
                                        ? 'bg-slate-900 text-white shadow-lg scale-105 border border-slate-600'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                                        }`}
                                >
                                    <Icon size={14} /> {layer.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Map Legend */}
                <div className="absolute bottom-8 left-8 z-[500] bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-700 shadow-xl pointer-events-auto">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-700 pb-2">
                        {activeLayer} INTELLIGENCE
                    </div>
                    <div className="flex flex-col gap-2.5">
                        {activeLayer === 'POLITICAL' && (
                            <>
                                <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-orange-500 ring-2 ring-orange-900/50 shadow-sm"></div><span className="text-xs font-bold text-slate-300">NDA Alliance</span></div>
                                <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-cyan-500 ring-2 ring-cyan-900/50 shadow-sm"></div><span className="text-xs font-bold text-slate-300">INDIA Alliance</span></div>
                                <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-eab308 ring-2 ring-yellow-900/50 shadow-sm" style={{ backgroundColor: '#eab308' }}></div><span className="text-xs font-bold text-slate-300">President's Rule</span></div>
                                <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-violet-500 ring-2 ring-violet-900/50 shadow-sm"></div><span className="text-xs font-bold text-slate-500">Neutral / Others</span></div>
                            </>
                        )}
                        {/* Add other legends similarly if needed */}
                    </div>
                </div>

                {/* LEAFLET MAP */}
                <div className="flex-1 relative z-0">
                    <MapContainer
                        center={[22.5937, 78.9629]}
                        zoom={5}
                        scrollWheelZoom={true}
                        style={{ height: "100%", width: "100%", background: "#0f172a" }}
                        zoomControl={false}
                    >
                        <TileLayer
                            attribution='&copy; CARTO'
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        />
                        <MapController selectedState={selectedState} />

                        {/* State Boundaries Layer */}
                        {geoJsonData && (
                            <LeafletGeoJSON
                                key="geojson-layer"
                                data={geoJsonData}
                                style={regionStyle}
                                onEachFeature={onEachFeature}
                            />
                        )}

                        {/* Circle Markers Removed as per user request */}
                    </MapContainer>
                </div>
            </div>

            {/* === RIGHT: STATE INTELLIGENCE PANEL === */}
            {selectedState ? (
                <div className="w-[400px] bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-slide-in-right relative">
                    {/* Reuse existing panel content but style for dark mode primarily */}
                    <div className="h-40 bg-slate-800 relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                        <div className={`absolute inset-0 opacity-20 bg-gradient-to-br from-transparent to-${selectedState.literacy > 80 ? 'green' : 'orange'}-500`}></div>

                        <button
                            onClick={() => setSelectedState(null)}
                            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors z-10"
                        >
                            <ChevronRight size={18} />
                        </button>

                        <div className="absolute bottom-6 left-8">
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest opacity-80 mb-1">
                                {selectedState.nativeName}
                            </h4>
                            <h2 className="text-4xl font-black text-white leading-none mb-2 tracking-tight">
                                {selectedState.name}
                            </h2>
                            <div className="flex gap-2 mt-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-slate-900 bg-white/80 backdrop-blur-sm shadow-sm">
                                    Pop {selectedState.population}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-700">
                        {/* 1. Governance Card */}
                        <div className="mb-6">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Gavel size={14} /> Governance Structure
                            </h4>
                            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
                                <div className="flex items-center gap-4 border-b border-slate-700 pb-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-black text-slate-400">CM</div>
                                    <div>
                                        <div className="text-sm font-bold text-white">{selectedState.cm}</div>
                                        <div className="text-[10px] text-slate-500 uppercase font-bold">Chief Minister</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-[10px] text-slate-400 uppercase font-bold">Ruling Party</div>
                                        <div className="font-bold text-slate-200">{selectedState.party}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-400 uppercase font-bold">Seats (LS)</div>
                                        <div className="font-bold text-slate-200">{selectedState.seats}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Key Metrics Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="p-4 bg-blue-900/20 rounded-2xl border border-blue-800/50">
                                <div className="flex items-center gap-2 mb-1 text-blue-400">
                                    <BookOpen size={16} />
                                    <span className="text-[10px] font-bold uppercase">Literacy</span>
                                </div>
                                <div className="text-2xl font-black text-white">{selectedState.literacy}%</div>
                            </div>
                            <div className="p-4 bg-orange-900/20 rounded-2xl border border-orange-800/50">
                                <div className="flex items-center gap-2 mb-1 text-orange-400">
                                    <HeartPulse size={16} />
                                    <span className="text-[10px] font-bold uppercase">HDI Score</span>
                                </div>
                                <div className="text-2xl font-black text-white">{selectedState.hdi}</div>
                            </div>
                        </div>

                        {/* 3. Top Welfare Scheme */}
                        <div className="mb-6">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Target size={14} /> Flagship Scheme
                            </h4>
                            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg relative overflow-hidden group hover:scale-[1.02] transition-transform">
                                <div className="relative z-10">
                                    <div className="text-xs font-medium opacity-90 mb-1">Most Active Scheme</div>
                                    <div className="text-xl font-black">{selectedState.topScheme}</div>
                                    <div className="mt-2 text-[10px] font-bold bg-white/20 w-fit px-2 py-1 rounded inline-flex items-center gap-1">
                                        <Users size={10} /> 8.4M Beneficiaries
                                    </div>
                                </div>
                                <Target className="absolute -bottom-4 -right-4 text-white/20 w-24 h-24" />
                            </div>
                        </div>

                        {/* 4. Grievance Pulse */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <MessageSquare size={14} /> Society Pulse
                            </h4>
                            <div className="space-y-3">
                                <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700 relative overflow-hidden">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-bold uppercase text-slate-500">Public Satisfaction</span>
                                        <span className="text-sm font-black text-slate-200">64%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 w-[64%] rounded-full relative">
                                            <div className="absolute top-0 right-0 bottom-0 w-2 bg-white/30 animate-pulse"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            ) : (
                <div className="hidden lg:flex w-96 bg-slate-900/50 rounded-[2.5rem] border-2 border-dashed border-slate-800 flex-col items-center justify-center p-8 text-center animate-pulse">
                    <MapIcon size={64} className="text-slate-700 mb-6" />
                    <h3 className="text-xl font-black text-slate-600 mb-2">Select a Region</h3>
                    <p className="text-sm text-slate-600 max-w-[240px]">Explore detailed governance data, society metrics, and political intelligence.</p>
                </div>
            )}
        </div>
    );
};
