
export interface Grievance {
    id: string;
    userId: string;
    userName: string;
    type: string; // 'CRITICAL' | 'NORMAL'
    category: string; // Road, Water, etc.
    description: string;
    status: 'Open' | 'In Progress' | 'Resolved';
    timestamp: string;
    location: {
        lat: number;
        lng: number;
        state: string;
        district: string;
        taluk: string;
        panchayat: string;
        ward: string;
    };
    replies: Array<{
        sender: 'Admin' | 'User';
        message: string;
        timestamp: string;
    }>;
    evidenceUrl?: string;
    assignedTo?: string; // New Department Field
}

const STORAGE_KEY = 'cpi_grievances';

// Initial Mock Data to populate if empty
const INITIAL_MOCK_DATA: Grievance[] = [
    {
        id: 'GRV-2024-001',
        userId: 'USR-101',
        userName: 'Ramesh Kumar',
        type: 'CRITICAL',
        category: 'Infrastructure',
        description: 'Large sinkhole forming near the main market entrance.',
        status: 'Open',
        timestamp: new Date().toISOString(),
        location: {
            lat: 28.6139,
            lng: 77.2090,
            state: 'Delhi',
            district: 'New Delhi',
            taluk: 'Connaught Place',
            panchayat: 'N/A', // Urban
            ward: 'Ward 42'
        },
        replies: [],
        evidenceUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=200'
    },
    {
        id: 'GRV-2024-002',
        userId: 'USR-102',
        userName: 'Suresh Patil',
        type: 'NORMAL',
        category: 'Sanitation',
        description: 'Garbage collection truck has not visited for 3 days.',
        status: 'In Progress',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        location: {
            lat: 19.0760,
            lng: 72.8777,
            state: 'Maharashtra',
            district: 'Mumbai City',
            taluk: 'Dadar',
            panchayat: 'N/A',
            ward: 'Ward G-North'
        },
        replies: [
            { sender: 'Admin', message: 'Noted. Truck dispatched.', timestamp: new Date().toISOString() }
        ],
        evidenceUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&q=80&w=200'
    }
];

export const GrievanceStore = {
    getAll: (): Grievance[] => {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_DATA));
            return INITIAL_MOCK_DATA;
        }
        return JSON.parse(data);
    },

    add: (grievance: Omit<Grievance, 'id' | 'timestamp' | 'replies' | 'status'>) => {
        const current = GrievanceStore.getAll();
        const newGrievance: Grievance = {
            ...grievance,
            id: `GRV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
            timestamp: new Date().toISOString(),
            status: 'Open',
            replies: []
        };
        const updated = [newGrievance, ...current];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return newGrievance;
    },

    addReply: (id: string, message: string, sender: 'Admin' | 'User') => {
        const current = GrievanceStore.getAll();
        const updated = current.map(g => {
            if (g.id === id) {
                return {
                    ...g,
                    replies: [...g.replies, { sender, message, timestamp: new Date().toISOString() }]
                };
            }
            return g;
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    },

    updateStatus: (id: string, status: Grievance['status']) => {
        const current = GrievanceStore.getAll();
        const updated = current.map(g => {
            if (g.id === id) {
                return { ...g, status };
            }
            return g;
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    },

    assignDept: (id: string, dept: string) => {
        const current = GrievanceStore.getAll();
        const updated = current.map(g => {
            if (g.id === id) {
                return { ...g, assignedTo: dept };
            }
            return g;
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
};
