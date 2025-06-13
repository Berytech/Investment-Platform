import axios from 'axios';

const BASE_URL = 'http://192.168.1.116:4000';  // Server base URL
const API_URL = `${BASE_URL}/api`;  // API endpoint
const ADMIN_KEY = 'your_secure_admin_key_here';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'x-admin-key': ADMIN_KEY
    },
    timeout: 10000 // 10 seconds
});

// Add response interceptor for error handling
api.interceptors.response.use(
    response => response,
    error => {
        console.error('API Error:', {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            message: error.message
        });
        return Promise.reject(error);
    }
);

// Utility function to get full image URL
export const getImageUrl = (logoUrl) => {
    if (!logoUrl) return null;
    // If the URL is already absolute (starts with http/https), return as is
    if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
        return logoUrl;
    }
    // Otherwise, prepend the server base URL
    return `${BASE_URL}${logoUrl}`;
};

export const adminApi = {
    // Event APIs
    createEvent: async (data) => {
        try {
            const response = await api.post('/admin/events', data);
            return response.data;
        } catch (error) {
            console.error('Create event error:', error);
            throw error;
        }
    },
    updateEvent: async (id, data) => {
        try {
            const response = await api.put(`/admin/events/${id}`, data);
            return response.data.data;  // Extract data from API response
        } catch (error) {
            console.error('Update event error:', error);
            throw error;
        }
    },
    deleteEvent: async (id) => {
        try {
            const response = await api.delete(`/admin/events/${id}`);
            return response.data.data;  // Extract data from API response
        } catch (error) {
            console.error('Delete event error:', error);
            throw error;
        }
    },
    getAllEvents: async () => {
        try {
            console.log('Fetching events from /admin/events');  // Debug log
            const response = await api.get('/admin/events');
            console.log('Events response:', response.data);  // Debug log
            return response.data.data;  // Extract data from API response
        } catch (error) {
            console.error('Get events error:', error);
            throw error;
        }
    },

    getEventDetails: async (eventId) => {
        try {
            const response = await api.get(`/events/${eventId}`);
            return response.data.data;
        } catch (error) {
            console.error('Get event details error:', error);
            throw error;
        }
    },

    getEventInvestmentSummary: async (eventId) => {
        try {
            console.log('Fetching investment summary for event:', eventId); // Debug log
            const response = await api.get(`/investments/summary/${eventId}`);
            console.log('Investment summary response:', response.data); // Debug log
            return response.data.data;
        } catch (error) {
            console.error('Get investment summary error:', error);
            throw error;
        }
    },
    
    // Investor APIs
    createInvestor: async (data) => {
        try {
            const response = await api.post('/admin/investors', data);
            return response.data.data; // Extract data from API response
        } catch (error) {
            console.error('Create investor error:', error);
            throw error;
        }
    },
    updateInvestor: async (id, data) => {
        try {
            const response = await api.put(`/admin/investors/${id}`, data);
            return response.data.data; // Extract data from API response
        } catch (error) {
            console.error('Update investor error:', error);
            throw error;
        }
    },
    deleteInvestor: async (id) => {
        try {
            const response = await api.delete(`/admin/investors/${id}`);
            return response.data.data; // Extract data from API response
        } catch (error) {
            console.error('Delete investor error:', error);
            throw error;
        }
    },
    getInvestorsByEvent: async (eventId) => {
        try {
            console.log('Fetching investors for event:', eventId); // Debug log
            const response = await api.get(`/admin/investors/event/${eventId}`);
            console.log('Investors response:', response.data); // Debug log
            return response.data.data || []; // Extract data from API response with fallback
        } catch (error) {
            console.error('Get investors error:', error);
            throw error;
        }
    },

    // Investor Interface APIs
    getInvestorDetails: async (investorId) => {
        try {
            console.log('Fetching investor details for:', investorId); // Debug log
            const response = await api.get(`/investors/${investorId}`);
            console.log('Investor details response:', response.data); // Debug log
            return response.data.data;
        } catch (error) {
            console.error('Get investor details error:', error);
            throw error;
        }
    },

    getInvestmentHistory: async (investmentId) => {
        try {
            const response = await api.get(`/investments/${investmentId}/history`);
            return response.data.data;
        } catch (error) {
            console.error('Get investment history error:', error);
            throw error;
        }
    },

    createInvestment: async (data) => {
        try {
            console.log('Creating investment:', data); // Debug log
            const response = await api.post('/investments', {
                ...data,
                amount: Number(data.amount)
            });
            console.log('Investment response:', response.data); // Debug log
            return response.data.data;
        } catch (error) {
            console.error('Create investment error:', error);
            throw error;
        }
    },

    getInvestorInvestments: async (investorId) => {
        try {
            const response = await api.get(`/investments/investor/${investorId}`);
            return response.data.data;
        } catch (error) {
            console.error('Get investor investments error:', error);
            throw error;
        }
    },
    
    // Startup APIs
    createStartup: async (formData) => {
        try {
            const response = await api.post('/admin/startups', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'x-admin-key': ADMIN_KEY
                }
            });
            return response.data.data; // Extract data from API response
        } catch (error) {
            console.error('Create startup error:', error);
            throw error;
        }
    },
    updateStartup: async (id, data) => {
        try {
            const response = await api.put(`/admin/startups/${id}`, data);
            return response.data.data; // Extract data from API response
        } catch (error) {
            console.error('Update startup error:', error);
            throw error;
        }
    },
    deleteStartup: async (id) => {
        try {
            const response = await api.delete(`/admin/startups/${id}`);
            return response.data.data; // Extract data from API response
        } catch (error) {
            console.error('Delete startup error:', error);
            throw error;
        }
    },
    getStartupsByEvent: async (eventId) => {
        try {
            console.log('Fetching startups for event:', eventId); // Debug log
            const response = await api.get(`/admin/startups/event/${eventId}`);
            console.log('Startups response:', response.data); // Debug log
            return response.data.data || []; // Extract data from API response with fallback
        } catch (error) {
            console.error('Get startups error:', error);
            throw error;
        }
    }
};
