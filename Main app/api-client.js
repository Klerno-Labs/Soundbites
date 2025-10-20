// API Client for Soundbites Quiz Backend
// Handles all communication with the backend server with comprehensive error handling

// Custom Error Classes
class NetworkError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NetworkError';
        this.userMessage = 'Network connection failed. Please check your internet connection.';
    }
}

class TimeoutError extends Error {
    constructor(message) {
        super(message);
        this.name = 'TimeoutError';
        this.userMessage = 'Request timed out. Please try again.';
    }
}

class AuthError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthError';
        this.userMessage = 'Authentication failed. Please log in again.';
    }
}

class ServerError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = 'ServerError';
        this.statusCode = statusCode;
        this.userMessage = statusCode >= 500
            ? 'Server error. Please try again later.'
            : message || 'Request failed. Please try again.';
    }
}

class APIClient {
    constructor(baseURL) {
        // Use relative '/api' when available so the frontend can talk to the same origin backend
        this.baseURL = baseURL || '/api';
        this.token = localStorage.getItem('sb-admin-token');

        // Configuration
        this.defaultTimeout = 30000; // 30 seconds
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 second initial delay

        // Loading state tracking
        this.activeRequests = new Set();

        // Event listeners for UI feedback
        this.listeners = {
            loadingStart: [],
            loadingEnd: [],
            error: [],
            offline: [],
            online: []
        };

        // Setup offline/online detection
        this._setupNetworkListeners();
    }

    // Setup network status listeners
    _setupNetworkListeners() {
        window.addEventListener('offline', () => {
            this._emit('offline');
        });

        window.addEventListener('online', () => {
            this._emit('online');
        });
    }

    // Event emitter for UI hooks
    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }

    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }

    _emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    // Check if browser is online
    isOnline() {
        return navigator.onLine;
    }

    // Get current loading state
    isLoading() {
        return this.activeRequests.size > 0;
    }

    // Fetch with timeout
    async _fetchWithTimeout(url, options, timeout) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new TimeoutError(`Request timeout after ${timeout}ms`);
            }
            throw error;
        }
    }

    // Retry logic with exponential backoff
    async _retryRequest(fn, retries = this.maxRetries) {
        let lastError;

        for (let i = 0; i <= retries; i++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;

                // Don't retry on auth errors or client errors (4xx except 408, 429)
                if (error instanceof AuthError) {
                    throw error;
                }
                if (error instanceof ServerError && error.statusCode < 500 &&
                    error.statusCode !== 408 && error.statusCode !== 429) {
                    throw error;
                }

                // Don't retry if we're offline
                if (!this.isOnline()) {
                    throw new NetworkError('Browser is offline');
                }

                // Last retry failed
                if (i === retries) {
                    throw lastError;
                }

                // Wait with exponential backoff before retrying
                const delay = this.retryDelay * Math.pow(2, i);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        throw lastError;
    }

    // Helper method for making requests with comprehensive error handling
    async request(endpoint, options = {}) {
        // Check if offline before making request
        if (!this.isOnline()) {
            const error = new NetworkError('Browser is offline');
            this._emit('error', error);
            this._emit('offline');
            throw error;
        }

        const requestId = `${endpoint}-${Date.now()}`;
        const url = `${this.baseURL}${endpoint}`;
        const timeout = options.timeout || this.defaultTimeout;

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        // Add auth token if available
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        // Track loading state
        this.activeRequests.add(requestId);
        this._emit('loadingStart', { endpoint, requestId });

        try {
            const response = await this._retryRequest(async () => {
                const res = await this._fetchWithTimeout(url, {
                    ...options,
                    headers
                }, timeout);

                if (!res.ok) {
                    // Handle specific status codes
                    if (res.status === 401 || res.status === 403) {
                        const error = await res.json().catch(() => ({ error: 'Unauthorized' }));
                        throw new AuthError(error.error || 'Authentication failed');
                    }

                    const error = await res.json().catch(() => ({ error: 'Request failed' }));
                    throw new ServerError(error.error || `HTTP ${res.status}`, res.status);
                }

                return res;
            });

            const data = await response.json();
            return data;

        } catch (error) {
            // Classify error types
            let classifiedError = error;

            if (error instanceof TypeError && error.message.includes('fetch')) {
                classifiedError = new NetworkError(error.message);
            } else if (!(error instanceof NetworkError ||
                        error instanceof TimeoutError ||
                        error instanceof AuthError ||
                        error instanceof ServerError)) {
                classifiedError = new ServerError(error.message, 500);
            }

            console.error('API request failed:', {
                endpoint,
                error: classifiedError,
                type: classifiedError.name,
                userMessage: classifiedError.userMessage
            });

            this._emit('error', classifiedError);

            throw classifiedError;

        } finally {
            // Clean up loading state
            this.activeRequests.delete(requestId);
            this._emit('loadingEnd', { endpoint, requestId });
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

// Create singleton instance pointing to relative /api by default so it works on otis.soundbites.com
window.api = new APIClient('/api');
