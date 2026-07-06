import api from './api';

export interface SearchResult {
    results: {
        articles: any[];
        doctors: any[];
    };
    total: number;
}

export const globalSearch = async (query: string): Promise<SearchResult> => {
    const response = await api.get(`/search?q=${encodeURIComponent(query)}`);
    return response.data.data;
};

export const doctorDashboardSearch = async (query: string): Promise<any> => {
    const response = await api.get(`/doctor/search?q=${encodeURIComponent(query)}`);
    return response.data.data;
};

export default {
    globalSearch,
    doctorDashboardSearch
};
