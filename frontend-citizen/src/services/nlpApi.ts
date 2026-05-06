import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/v1';

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const analyzeText = async (text: string) => {
    try {
        const response = await axiosInstance.post('/sentiment/analyze', { text });
        return response.data;
    } catch (error) {
        console.warn('NLP failed, using fallback', error);
        return { status: 'ok', result: { sentiment: 'neutral', score: 0.5, fallback: true } };
    }
};
