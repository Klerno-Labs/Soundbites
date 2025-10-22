/**
 * SUPER SIMPLE AUTH SYSTEM - Just Works™
 * No complexity, no configuration, just login and go
 */

(function() {
    'use strict';

    // Auto-detect the right API URL
    function getAPI(endpoint) {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const base = isLocal ? 'http://localhost:3000' : '';
        return `${base}/api/${endpoint}`;
    }

    // Safe JSON parse - never crashes
    async function safeJSON(response) {
        try {
            const text = await response.text();
            if (!text) return null;
            return JSON.parse(text);
        } catch (e) {
            console.error('Response was not JSON:', e);
            return null;
        }
    }

    // Get stored token
    function getToken() {
        return localStorage.getItem('admin_token');
    }

    // Save token
    function saveToken(token) {
        localStorage.setItem('admin_token', token);
    }

    // Clear token
    function clearToken() {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('sb-admin-token'); // Clean up old key too
    }

    // Make authenticated API call
    async function apiCall(endpoint, options = {}) {
        const token = getToken();

        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                ...options.headers
            }
        };

        try {
            // Add credentials to send HttpOnly cookies
            config.credentials = 'include';

            const response = await fetch(getAPI(endpoint), config);
            const data = await safeJSON(response);

            // Handle auth errors
            if (response.status === 401 || response.status === 403) {
                clearToken();
                if (window.location.pathname !== '/admin/login.html') {
                    window.location.href = '/admin/login.html';
                }
                throw new Error('Session expired. Please log in again.');
            }

            // Handle other errors
            if (!response.ok) {
                throw new Error(data?.error || data?.message || 'Request failed');
            }

            return data;

        } catch (error) {
            // Network errors
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Cannot connect to server');
            }
            throw error;
        }
    }

    // PUBLIC API - Simple functions anyone can use
    window.SimpleAuth = {

        // Login - returns true on success
        async login(email, password) {
            try {
                const data = await fetch(getAPI('auth/login'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include', // Send/receive cookies
                    body: JSON.stringify({ email, password })
                }).then(r => safeJSON(r));

                if (data && data.token) {
                    saveToken(data.token);
                    return { success: true, user: data.user };
                }
                return { success: false, error: 'Invalid credentials' };
            } catch (error) {
                return { success: false, error: error.message };
            }
        },

        // Check if logged in
        async isLoggedIn() {
            const token = getToken();
            if (!token) return false;

            try {
                const data = await apiCall('auth/verify');
                return data && (data.valid || data.user);
            } catch (error) {
                clearToken();
                return false;
            }
        },

        // Logout
        logout() {
            clearToken();
            window.location.href = '/admin/login.html';
        },

        // Make any authenticated API call
        api: apiCall,

        // Get current token
        getToken: getToken
    };

    // Auto-protect admin pages (redirect to login if not authenticated)
    if (window.location.pathname.includes('/admin/') &&
        window.location.pathname !== '/admin/login.html') {

        SimpleAuth.isLoggedIn().then(loggedIn => {
            if (!loggedIn) {
                window.location.href = '/admin/login.html';
            }
        });
    }

})();
