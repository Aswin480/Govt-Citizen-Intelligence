import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/v1';
const isViteDevServer = typeof window !== 'undefined' && window.location.port === '5173';
const NLP_BASE = import.meta.env.VITE_NLP_BASE || (isViteDevServer ? '/nlp/api' : 'http://127.0.0.1:8001/api');
const PARLI_BASE = import.meta.env.VITE_PARLI_BASE || (isViteDevServer ? '/parli/api' : 'http://127.0.0.1:8080/api');

// Create AXIOS instance with Base URL
const axiosInstance = axios.create({
    baseURL: '/api/v1',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    }
});


// Request Interceptor (Inject Token)
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor (Handle 401)
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            // Optional: Redirect to login or dispatch event
        }
        return Promise.reject(error);
    }
);

export const getStats = async (scope: 'nation' | 'state' = 'nation') => {
    // Determine query param based on scope (simulating backend filtering)
    const response = await axiosInstance.get(`/stats?scope=${scope}`);
    return response.data;
};

export const getSchemes = async () => {
    const response = await axiosInstance.get('/schemes');
    return response.data;
};

export const createScheme = async (data: any) => {
    const response = await axiosInstance.post('/schemes/', data);
    return response.data;
};

export const updateScheme = async (id: number, data: any) => {
    const response = await axiosInstance.put(`/schemes/${id}`, data);
    return response.data;
};

export const deleteScheme = async (id: number) => {
    const response = await axiosInstance.delete(`/schemes/${id}`);
    return response.data;
};

// ... existing methods ...

export const getDbStatus = async () => {
    const response = await axiosInstance.get('/db-status');
    return response.data;
};

export const triggerBackup = async () => {
    const response = await axiosInstance.post('/backup');
    return response.data;
};

// Phase 6: Real Events
export const getEvents = async () => {
    const response = await axiosInstance.get('/events');
    return response.data;
};

export const getIntelBrief = async () => {
    const res = await fetch(`${API_BASE}/intel/brief`);
    return res.json();
};

export const searchUsers = async (query: string) => {
    // Pass query param
    const response = await axiosInstance.get(`/users/search?query=${query}`);
    return response.data;
};

export const getCitizens = async () => {
    // Reusing search endpoint with empty query to get list
    const response = await axiosInstance.get(`/users/search?query=`);
    return response.data;
};

// ... existing methods ...

export const simulatePolicy = async (text: string) => {
    // Pass query param
    const response = await axiosInstance.post(`/simulate_impact?policy_text=${encodeURIComponent(text)}`);
    return response.data;
};

export const askOracle = async (query: string) => {
    const response = await axiosInstance.post(`/oracle?query=${encodeURIComponent(query)}`);
    return response.data;
};

export const getGeoRisk = async () => {
    const response = await axiosInstance.get('/geo-risk');
    return response.data;
};

// --- NLP Pipeline Endpoints ---
export const getNlpMps = async (q: string = '', limit: number = 1000) => {
    const res = await fetch(`${NLP_BASE}/mps/?q=${encodeURIComponent(q)}&limit=${limit}`);
    if (!res.ok) {
        throw new Error(`NLP MPs fetch failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();

    // Backend may return either:
    // 1. { mps: ['Name1', 'Name2'], ... }
    // 2. { mps: [{ name, party, constituency, state, ... }], ... }
    const rawMps = Array.isArray(data.mps) ? data.mps : [];

    const mappedMps = rawMps.map((mp: any) => {
        if (typeof mp === 'string') {
            return { name: mp, party: 'IND', constituency: '', state: '' };
        }
        return {
            id: mp.id?.toString?.() || mp.name || '',
            name: mp.name || mp.mp_name || 'Unknown',
            party: mp.party || 'IND',
            constituency: mp.constituency || '',
            state: mp.state || mp.state_id || '',
            house: mp.house || 'lok_sabha',
            image:
                mp.image ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(mp.name || mp.mp_name || 'Unknown')}&background=random`,
            role: mp.role || ''
        };
    });

    return {
        ...data,
        results: mappedMps,
        mps: mappedMps,
    };
};

const ensureValidName = (name: string, fn: string) => {
    const trimmed = (name || '').trim();
    if (!trimmed) {
        throw new Error(`${fn} requires a non-empty MP name`);
    }
    return trimmed;
};

const parseJsonOrThrow = async (res: Response, url: string) => {
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`NLP API request failed (${url}): ${res.status} ${res.statusText} - ${text}`);
    }
    return res.json();
};

export const getNlpMpScores = async (name: string) => {
    const validName = ensureValidName(name, 'getNlpMpScores');
    const url = `${NLP_BASE}/mps/${encodeURIComponent(validName)}/scores/`;
    const res = await fetch(url);
    return await parseJsonOrThrow(res, url);
};

export const getNlpMpEvidence = async (name: string) => {
    const validName = ensureValidName(name, 'getNlpMpEvidence');
    const url = `${NLP_BASE}/mps/${encodeURIComponent(validName)}/evidence/?include_speech=1`;
    const res = await fetch(url);
    return await parseJsonOrThrow(res, url);
};

export const getNlpMpSpeeches = async (
    name: string,
    limit: number = 100,
    offset: number = 0,
    fetchAll: boolean = false,
    batch: 'latest' | 'all' = 'latest'
) => {
    const validName = ensureValidName(name, 'getNlpMpSpeeches');
    const endpoint = `${NLP_BASE}/mps/${encodeURIComponent(validName)}/speeches/`;

    if (!fetchAll) {
        const url = `${endpoint}?limit=${limit}&offset=${offset}&batch=${batch}`;
        const res = await fetch(url);
        return await parseJsonOrThrow(res, url);
    }

    const pageSize = Math.min(Math.max(limit || 500, 1), 1000);
    const allSpeeches: any[] = [];
    let lastPayload: any = null;
    let currentOffset = Math.max(offset, 0);
    let pages = 0;
    const maxPages = 200;

    while (pages < maxPages) {
        const url = `${endpoint}?limit=${pageSize}&offset=${currentOffset}&batch=${batch}`;
        const res = await fetch(url);
        const payload = await parseJsonOrThrow(res, url);
        lastPayload = payload;
        const chunk = Array.isArray(payload?.speeches) ? payload.speeches : [];

        allSpeeches.push(...chunk);
        pages += 1;

        if (chunk.length < pageSize) {
            return {
                mp_name: payload?.mp_name ?? validName,
                batch: payload?.batch ?? batch,
                batch_id: payload?.batch_id ?? null,
                count: allSpeeches.length,
                total_count: allSpeeches.length,
                limit: pageSize,
                offset,
                speeches: allSpeeches,
            };
        }

        currentOffset += pageSize;
    }

    return {
        mp_name: validName,
        batch,
        batch_id: lastPayload?.batch_id ?? null,
        count: allSpeeches.length,
        total_count: allSpeeches.length,
        limit: pageSize,
        offset,
        speeches: allSpeeches,
        warning: 'Speech list truncated due to safety page limit.',
    };
};

export const getCoreValues = async () => {
    const res = await fetch(`${NLP_BASE}/core-values/`);
    return res.json();
};

export const getSystemConfig = async (mode: 'live' | 'draft' = 'live') => {
    try {
        const response = await axiosInstance.get(`/config/?mode=${mode}`);
        return response.data;
    } catch (error) {
        console.error("DEBUG - getSystemConfig Error:", error);
        console.warn("Backend Unreachable: Serving Default System Config");
        return [];
    }
};

export const updateSystemConfig = async (key: string, value: string, description?: string, is_draft: boolean = false) => {
    const response = await axiosInstance.put('/config/', { key, value, description, is_draft });
    return response.data;
};

export const publishConfig = async () => {
    const response = await axiosInstance.post('/config/publish');
    return response.data;
};

export const discardDrafts = async () => {
    const response = await axiosInstance.post('/config/reset-drafts');
    return response.data;
};

// Visual Builder - Element Styles
export const getAllElementStyles = async () => {
    const response = await axiosInstance.get('/visual-builder/styles');
    return response.data;
};

export const saveElementStyle = async (elementSelector: string, cssText: string) => {
    const response = await axiosInstance.post('/visual-builder/styles', {
        element_selector: elementSelector,
        css_text: cssText
    });
    return response.data;
};

export const deleteElementStyle = async (styleId: number) => {
    const response = await axiosInstance.delete(`/visual-builder/styles/${styleId}`);
    return response.data;
};

export const getChangeHistory = async (
    limit: number = 50,
    filters?: {
        elementSelector?: string;
        action?: 'create' | 'update' | 'delete';
        changedBy?: string;
        days?: number;
    }
) => {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());

    if (filters?.elementSelector) params.append('element_selector', filters.elementSelector);
    if (filters?.action) params.append('action', filters.action);
    if (filters?.changedBy) params.append('changed_by', filters.changedBy);
    if (filters?.days) params.append('days', filters.days.toString());

    const response = await axiosInstance.get(`/visual-builder/history?${params.toString()}`);
    return response.data;
};

export const getAnalyticsSummary = async (days?: number) => {
    const params = days ? `?days=${days}` : '';
    const response = await axiosInstance.get(`/visual-builder/analytics/summary${params}`);
    return response.data;
};

export const getMostEditedElements = async (limit: number = 10) => {
    const response = await axiosInstance.get(`/visual-builder/analytics/most-edited?limit=${limit}`);
    return response.data;
};

export const getMostActiveAdmins = async (limit: number = 10) => {
    const response = await axiosInstance.get(`/visual-builder/analytics/most-active-admins?limit=${limit}`);
    return response.data;
};

export const getChangeTimeline = async (days: number = 30) => {
    const response = await axiosInstance.get(`/visual-builder/analytics/timeline?days=${days}`);
    return response.data;
};

export const getHouses = async () => {
    const response = await axiosInstance.get('/parliament/houses/');
    return response.data;
};

// Parliament Data Management
export const getMembers = async (house?: string, stateId?: string, houseType?: string) => {
    const params = new URLSearchParams();
    if (house) params.append('house_name', house);
    if (stateId) params.append('state_id', stateId);
    if (houseType) params.append('house_type', houseType);

    const axiosConfig: any = { params };
    const response = await axiosInstance.get(`/parliament/members/`, axiosConfig);
    return response.data;
};

export const getMemberPerformance = async (id: string) => {
    const response = await fetch(`${API_BASE}/parliament/members/${id}/performance`);
    if (!response.ok) {
        throw new Error(`Get member performance failed: ${response.statusText}`);
    }
    return response.json();
};

export const getMemberFullProfile = async (id: string) => {
    const response = await fetch(`${API_BASE}/parliament/members/${id}/full`);
    if (!response.ok) {
        throw new Error(`Get member full profile failed: ${response.statusText}`);
    }
    return response.json();
};

export const updateMember = async (id: number, data: any) => {
    const response = await axiosInstance.put(`/parliament/members/${id}`, data);
    return response.data;
};

export const deleteMember = async (id: number) => {
    const response = await axiosInstance.delete(`/parliament/members/${id}`);
    return response.data;
};

export const createMember = async (data: any) => {
    const response = await axiosInstance.post(`/parliament/members/`, data);
    return response.data;
};

// --- Parli Backend Endpoints ---
export const getParliBills = async () => {
    const response = await fetch(`${PARLI_BASE}/data/bill/`);
    if (!response.ok) throw new Error(`Parli Bills fetch failed: ${response.status}`);
    return response.json();
};

export const getParliStates = async () => {
    const response = await fetch(`${PARLI_BASE}/data/state/`);
    if (!response.ok) throw new Error(`Parli States fetch failed: ${response.status}`);
    return response.json();
};

export const api = {
    auth: {
        login: async (credentials: any) => {
            const params = new URLSearchParams();
            params.append('username', credentials.username);
            params.append('password', credentials.password);

            // Axios will use the baseURL (/api/v1) automatically
            const response = await axiosInstance.post('/auth/login', params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            return response.data;
        },
        signup: async (userData: any) => {
            const response = await axiosInstance.post('/auth/signup', userData);
            return response.data;
        },
        getMe: async (token: string) => {
            // Interceptor handles Authorization header if token is in localStorage,
            // but here we might pass it explicitly or reply on the interceptor.
            // Best to pass explicit header to override/ensure.
            const response = await axiosInstance.get('/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.data;
        }
    }
};


// Dynamic Page Builder APIs
export interface DynamicComponent {
    id: number;
    type: string;
    content: string;
    props: Record<string, any>;
    style: Record<string, any>;
    parent_id: string;
    order: number;
}

export const createDynamicComponent = async (data: Omit<DynamicComponent, 'id'>) => {
    const response = await axiosInstance.post('/page-builder/components', data);
    return response.data;
};

export const getDynamicComponents = async (parentId?: string) => {
    // Add default empty array fallback if parsing fails
    try {
        const params = parentId ? `?parent_id=${parentId}` : '';
        const response = await axiosInstance.get(`/page-builder/components${params}`);
        return response.data || [];
    } catch (error) {
        console.error("Failed to fetch dynamic components", error);
        return [];
    }
};

export const deleteDynamicComponent = async (id: number) => {
    const response = await axiosInstance.delete(`/page-builder/components/${id}`);
    return response.data;
};

export const updateDynamicComponent = async (id: number, data: Partial<DynamicComponent>) => {
    const response = await axiosInstance.put(`/page-builder/components/${id}`, data);
    return response.data;
};

// Newspaper Engine
// Newspaper Engine
export const getNewspaperEdition = async (region: string = 'India', language: string = 'en') => {
    try {
        const response = await axiosInstance.get(`/news/edition`, {
            params: { region, language }
        });
        // Check if response has valid pages, else throw to reach catch
        if (!response.data || !response.data.pages || response.data.pages.length === 0) {
            throw new Error("No edition data");
        }
        return response.data;
    } catch (error) {
        console.error("Failed to fetch newspaper edition:", error);
        throw error;
    }
};

export const createNewsArticle = async (articleData: any) => {
    try {
        const response = await axiosInstance.post('/news/article', articleData);
        return response.data;
    } catch (error) {
        console.warn("Backend Unreachable: Using mock success for creation");
        return { ...articleData, id: Math.random() };
    }
};

export const getLiveNews = async (region: string = 'nation') => {
    try {
        const response = await axiosInstance.get(`/news/live?region=${encodeURIComponent(region)}`);
        // If response is empty array, treat as failure to force mock data for demo
        if (!response.data || response.data.length === 0) throw new Error("Empty feed");
        return response.data;
    } catch (e) {
        console.error("Failed to fetch live news:", e);
        throw e;
    }
};

export const getBudgetData = async (region: string = 'nation', year: number = 2026) => {
    try {
        const response = await axiosInstance.get(`/budget/${encodeURIComponent(region)}?year=${year}`);
        return response.data;
    } catch (error) {
        console.warn("Backend Unreachable: Serving Mock Budget Data", error);

        // Mock Data Fallback (Identical to Backend Mock)
        const is_nation = region.toLowerCase() === "nation";

        const allocations = [
            {
                sector: "Education", amount: is_nation ? 1.2 : 0.4, percentage_share: 15.0, yoy_change: 8.5,
                schemes: [{ name: "PM e-Vidya", amount: 5000, change: 12, beneficiaries: "25 Cr Students", ministry: "Ministry of Education" }]
            },
            {
                sector: "Health", amount: is_nation ? 0.9 : 0.3, percentage_share: 12.0, yoy_change: 10.2,
                schemes: [{ name: "Ayushman Bharat", amount: 7500, change: 15, beneficiaries: "50 Cr Citizens", ministry: "Health & Family Welfare" }]
            },
            {
                sector: "Agriculture", amount: is_nation ? 1.5 : 0.5, percentage_share: 18.0, yoy_change: 5.0,
                schemes: [{ name: "PM-KISAN", amount: 60000, change: 0, beneficiaries: "11 Cr Farmers", ministry: "Agriculture & Farmers Welfare" }]
            },
            {
                sector: "Infrastructure", amount: is_nation ? 11.1 : 0.8, percentage_share: 25.0, yoy_change: 15.0,
                schemes: [{ name: "PM Gati Shakti", amount: 10000, change: 20, beneficiaries: "Nationwide", ministry: "Ministry of Commerce" }]
            },
        ];

        if (is_nation) {
            allocations.push({ sector: "Defence", amount: 6.2, percentage_share: 13.0, yoy_change: 4.5, schemes: [] });
        }

        const revenue_sources = [
            { source_name: "Income Tax", amount: is_nation ? 9.2 : 0, type: "Tax" },
            { source_name: "GST", amount: is_nation ? 10.5 : 0.8, type: "Tax" },
            { source_name: "Borrowings", amount: is_nation ? 14.2 : 0.5, type: "Borrowing" },
        ];

        if (!is_nation) {
            revenue_sources.push({ source_name: "Central Grants", amount: 0.4, type: "Grant" });
        }

        return {
            region: region,
            year: year,
            total_size: is_nation ? 48.2 : 2.4,
            revenue_budget: is_nation ? 37.1 : 1.6,
            capital_budget: is_nation ? 11.1 : 0.8,
            fiscal_deficit: is_nation ? 4.5 : 3.2,
            budget_growth: is_nation ? 7.2 : 8.1,
            per_capita_allocation: is_nation ? 35000 : 22000,
            health_score: 82,
            highlights: {
                top_debated: ["Digital Infrastructure", "Agriculture Subsidy", "Green Energy Transition"],
                objections: ["Higher Borrowings", "Middle Class Tax relief"],
                minister_response: "Focused on long term capex and job creation"
            },
            allocations: allocations,
            revenue_sources: revenue_sources
        };
    }
};


export const getStateData = async (stateId: string) => {
    try {
        const response = await axiosInstance.get(`/states/${stateId}`);
        const raw = response.data;

        // Transform Backend Flat Structure to Frontend Nested Structure
        return {
            id: raw.id,
            total_seats: raw.total_seats,
            composition: raw.composition,
            leadership: {
                chief_minister: raw.chief_minister_name ? {
                    name: raw.chief_minister_name,
                    image: raw.chief_minister_image
                } : undefined,
                governor: {
                    name: raw.governor_name || "Unknown",
                    image: raw.governor_image
                }
            }
        };
    } catch (error) {
        console.error(`Failed to fetch state data for ${stateId}`, error);
        return null;
    }
};

// Data Extractor APIs
export const processUrlExtraction = async (url: string, targetHouse?: string, targetState?: string) => {
    const response = await axiosInstance.post('/extractor/process-url', {
        url,
        target_house: targetHouse,
        target_state: targetState
    });
    return response.data;
};

export const processPdfExtraction = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosInstance.post('/extractor/process-pdf', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export default axiosInstance;
