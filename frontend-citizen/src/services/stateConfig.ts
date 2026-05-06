export type RegionType = 'state' | 'ut';

export interface StateConfig {
    id: string;
    name: string;
    code: string; // ISO code or short code
    type: RegionType;
    capital: string;
    hasAssembly: boolean; // True if it has a Vidhan Sabha
    hasLegislativeCouncil: boolean; // Bicameral check
    assemblySeats?: number; // Vidhan Sabha
    councilSeats?: number; // Vidhan Parishad
    image: string; // Placeholder for state map/icon
    languages: string[]; // List of supported languages for this region
}

export const INDIAN_STATES: StateConfig[] = [
    // STATES (28)
    { id: 'AP', name: 'Andhra Pradesh', code: 'AP', type: 'state', capital: 'Amaravati', hasAssembly: true, hasLegislativeCouncil: true, assemblySeats: 175, councilSeats: 58, image: '', languages: ['en', 'te', 'ur'] },
    { id: 'AR', name: 'Arunachal Pradesh', code: 'AR', type: 'state', capital: 'Itanagar', hasAssembly: true, hasLegislativeCouncil: false, assemblySeats: 60, image: '', languages: ['en'] },
    { id: 'AS', name: 'Assam', code: 'AS', type: 'state', capital: 'Dispur', hasAssembly: true, hasLegislativeCouncil: false, assemblySeats: 126, image: '', languages: ['en', 'as', 'bn'] },
    { id: 'BR', name: 'Bihar', code: 'BR', type: 'state', capital: 'Patna', hasAssembly: true, hasLegislativeCouncil: true, assemblySeats: 243, councilSeats: 75, image: '', languages: ['en', 'hi'] },
    { id: 'CG', name: 'Chhattisgarh', code: 'CG', type: 'state', capital: 'Raipur', hasAssembly: true, hasLegislativeCouncil: false, assemblySeats: 90, image: '', languages: ['en', 'hi'] },
    { id: 'GA', name: 'Goa', code: 'GA', type: 'state', capital: 'Panaji', hasAssembly: true, hasLegislativeCouncil: false, assemblySeats: 40, image: '', languages: ['en', 'kok', 'mr'] },
    { id: 'GJ', name: 'Gujarat', code: 'GJ', type: 'state', capital: 'Gandhinagar', hasAssembly: true, hasLegislativeCouncil: false, assemblySeats: 182, image: '', languages: ['en', 'gu'] },
    { id: 'HR', name: 'Haryana', code: 'HR', type: 'state', capital: 'Chandigarh', hasAssembly: true, hasLegislativeCouncil: false, assemblySeats: 90, image: '', languages: ['en', 'hi'] },
    { id: 'HP', name: 'Himachal Pradesh', code: 'HP', type: 'state', capital: 'Shimla', hasAssembly: true, hasLegislativeCouncil: false, assemblySeats: 68, image: '', languages: ['en', 'hi'] },
    { id: 'JH', name: 'Jharkhand', code: 'JH', type: 'state', capital: 'Ranchi', hasAssembly: true, hasLegislativeCouncil: false, assemblySeats: 81, image: '', languages: ['en', 'hi', 'ur'] },
    { id: 'KA', name: 'Karnataka', code: 'KA', type: 'state', capital: 'Bengaluru', hasAssembly: true, hasLegislativeCouncil: true, assemblySeats: 224, councilSeats: 75, image: '', languages: ['en', 'kn'] },
    { id: 'KL', name: 'Kerala', code: 'KL', type: 'state', capital: 'Thiruvananthapuram', hasAssembly: true, hasLegislativeCouncil: false, assemblySeats: 140, image: '', languages: ['en', 'ml'] },
    { id: 'MP', name: 'Madhya Pradesh', code: 'MP', type: 'state', capital: 'Bhopal', hasAssembly: true, hasLegislativeCouncil: false, assemblySeats: 230, image: '', languages: ['en', 'hi'] },
    { id: 'MH', name: 'Maharashtra', code: 'MH', type: 'state', capital: 'Mumbai', hasAssembly: true, hasLegislativeCouncil: true, assemblySeats: 288, councilSeats: 78, image: '', languages: ['en', 'mr'] },
    { id: 'MN', name: 'Manipur', code: 'MN', type: 'state', capital: 'Imphal', hasAssembly: true, hasLegislativeCouncil: false, assemblySeats: 60, image: '', languages: ['en', 'mni'] },
    { id: 'ML', name: 'Meghalaya', code: 'ML', type: 'state', capital: 'Shillong', hasAssembly: true, hasLegislativeCouncil: false, assemblySeats: 60, image: '', languages: ['en'] },
    { id: 'MZ', name: 'Mizoram', code: 'MZ', type: 'state', capital: 'Aizawl', hasAssembly: true, hasLegislativeCouncil: false, assemblySeats: 40, image: '', languages: ['en'] },
    { id: 'NL', name: 'Nagaland', code: 'NL', type: 'state', capital: 'Kohima', hasAssembly: true, hasLegislativeCouncil: false, assemblySeats: 60, image: '', languages: ['en'] },
    { id: 'OD', name: 'Odisha', code: 'OD', type: 'state', capital: 'Bhubaneswar', hasAssembly: true, hasLegislativeCouncil: false, assemblySeats: 147, image: '', languages: ['en', 'or'] },
    { id: 'PB', name: 'Punjab', code: 'PB', type: 'state', capital: 'Chandigarh', hasAssembly: true, hasLegislativeCouncil: false, assemblySeats: 117, image: '', languages: ['en', 'pa'] },
    { id: 'RJ', name: 'Rajasthan', code: 'RJ', type: 'state', capital: 'Jaipur', hasAssembly: true, hasLegislativeCouncil: false, assemblySeats: 200, image: '', languages: ['en', 'hi'] },
    { id: 'SK', name: 'Sikkim', code: 'SK', type: 'state', capital: 'Gangtok', hasAssembly: true, hasLegislativeCouncil: false, assemblySeats: 32, image: '', languages: ['en', 'ne'] },
    { id: 'TN', name: 'Tamil Nadu', code: 'TN', type: 'state', capital: 'Chennai', hasAssembly: true, hasLegislativeCouncil: false, assemblySeats: 234, image: '', languages: ['en', 'ta'] },
    { id: 'TS', name: 'Telangana', code: 'TS', type: 'state', capital: 'Hyderabad', hasAssembly: true, hasLegislativeCouncil: true, assemblySeats: 119, councilSeats: 40, image: '', languages: ['en', 'te', 'ur'] },
    { id: 'TR', name: 'Tripura', code: 'TR', type: 'state', capital: 'Agartala', hasAssembly: true, hasLegislativeCouncil: false, assemblySeats: 60, image: '', languages: ['en', 'bn', 'kok'] }, // Check kokborok code, usually not standard google news supported, falling back close match or just EN if unsupported. 'kok' is Konkani. For now listed but might default EN.
    { id: 'UP', name: 'Uttar Pradesh', code: 'UP', type: 'state', capital: 'Lucknow', hasAssembly: true, hasLegislativeCouncil: true, assemblySeats: 403, councilSeats: 100, image: '', languages: ['en', 'hi', 'ur'] },
    { id: 'UK', name: 'Uttarakhand', code: 'UK', type: 'state', capital: 'Dehradun', hasAssembly: true, hasLegislativeCouncil: false, assemblySeats: 70, image: '', languages: ['en', 'hi'] }, // Sanskrit often symbolic, but we list it if we had code 'sa'. Google News limited support for SA.
    { id: 'WB', name: 'West Bengal', code: 'WB', type: 'state', capital: 'Kolkata', hasAssembly: true, hasLegislativeCouncil: false, assemblySeats: 294, image: '', languages: ['en', 'bn', 'ne'] },

    // UNION TERRITORIES (8)
    { id: 'AN', name: 'Andaman and Nicobar Islands', code: 'AN', type: 'ut', capital: 'Port Blair', hasAssembly: false, hasLegislativeCouncil: false, image: '', languages: ['en', 'hi', 'bn', 'ta', 'te'] },
    { id: 'CH', name: 'Chandigarh', code: 'CH', type: 'ut', capital: 'Chandigarh', hasAssembly: false, hasLegislativeCouncil: false, image: '', languages: ['en', 'hi', 'pa'] },
    { id: 'DN', name: 'Dadra and Nagar Haveli and Daman and Diu', code: 'DN', type: 'ut', capital: 'Daman', hasAssembly: false, hasLegislativeCouncil: false, image: '', languages: ['en', 'gu', 'hi'] },
    { id: 'DL', name: 'Delhi', code: 'DL', type: 'ut', capital: 'New Delhi', hasAssembly: true, hasLegislativeCouncil: false, assemblySeats: 70, image: '', languages: ['en', 'hi', 'ur', 'pa'] },
    { id: 'JK', name: 'Jammu and Kashmir', code: 'JK', type: 'ut', capital: 'Srinagar', hasAssembly: true, hasLegislativeCouncil: false, assemblySeats: 90, image: '', languages: ['en', 'ur', 'hi'] },
    { id: 'LA', name: 'Ladakh', code: 'LA', type: 'ut', capital: 'Leh', hasAssembly: false, hasLegislativeCouncil: false, image: '', languages: ['en', 'hi', 'ur'] },
    { id: 'LD', name: 'Lakshadweep', code: 'LD', type: 'ut', capital: 'Kavaratti', hasAssembly: false, hasLegislativeCouncil: false, image: '', languages: ['en', 'ml'] },
    { id: 'PY', name: 'Puducherry', code: 'PY', type: 'ut', capital: 'Puducherry', hasAssembly: true, hasLegislativeCouncil: false, assemblySeats: 30, image: '', languages: ['en', 'ta', 'te', 'ml'] },
];
