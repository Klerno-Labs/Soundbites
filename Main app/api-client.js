// API Client for Soundbites Quiz Backend
// Handles all communication with the backend server

class APIClient {
    constructor(baseURL) {
        this.baseURL = baseURL || 'https://soundbites-quiz-backend.onrender.com/api';
        this.token = localStorage.getItem('sb-admin-token');
    }

    // Helper method for making requests
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        // Add auth token if available
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: 'Request failed' }));
                throw new Error(error.error || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        localStorage.setItem('sb-admin-token', token);
    }

    // Clear authentication token
    clearToken() {
        this.token = null;
        localStorage.removeItem('sb-admin-token');
    }

    // ===== Quiz Endpoints =====

    async getQuestions() {
        return this.request('/quiz/questions');
    }

    async submitQuiz(answers, score, utm) {
        return this.request('/quiz/submit', {
            method: 'POST',
            body: JSON.stringify({ answers, score, utm })
        });
    }

    async captureLead(email, name, phone, resultId) {
        return this.request('/quiz/lead', {
            method: 'POST',
            body: JSON.stringify({ email, name, phone, resultId })
        });
    }

    // ===== Auth Endpoints =====

    async login(username, password) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        if (response.token) {
            this.setToken(response.token);
        }
        
        return response;
    }

    async verifyToken() {
        return this.request('/auth/verify');
    }

    logout() {
        this.clearToken();
    }

    // ===== Admin Endpoints =====

    async getResults(filters = {}) {
        const params = new URLSearchParams();
        if (filters.fromDate) params.append('fromDate', filters.fromDate);
        if (filters.toDate) params.append('toDate', filters.toDate);
        if (filters.minScore !== undefined) params.append('minScore', filters.minScore);
        if (filters.maxScore !== undefined) params.append('maxScore', filters.maxScore);
        if (filters.utmSource) params.append('utmSource', filters.utmSource);

        const query = params.toString();
        return this.request(`/admin/results${query ? '?' + query : ''}`);
    }

    async getLeads() {
        return this.request('/admin/leads');
    }

    async getAnalytics() {
        return this.request('/admin/analytics');
    }

    async getAdminQuestions() {
        return this.request('/admin/questions');
    }

    async saveQuestion(question) {
        return this.request('/admin/questions', {
            method: 'POST',
            body: JSON.stringify(question)
        });
    }

    async deleteQuestion(id) {
        return this.request(`/admin/questions/${id}`, {
            method: 'DELETE'
        });
    }

    async exportData() {
        return this.request('/admin/export');
    }
}

// Create singleton instance
// Local development URL
window.api = new APIClient('http://localhost:3000/api');
