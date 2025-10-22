// Soundbites Configuration - Production & Development URLs
// This file auto-detects the environment and provides the correct backend URL

/**
 * Get the backend API base URL based on current environment
 * @returns {string} Backend base URL (with /api prefix for production, without for local)
 */
function getBackendURL() {
    const hostname = window.location.hostname;

    // Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:3000';  // Local backend at http://localhost:3000
    }

    // Production - use relative path (proxied via _redirects)
    return '';  // Empty string for relative URLs
}

/**
 * Get full API endpoint URL
 * @param {string} endpoint - API endpoint path (e.g., '/auth/login')
 * @returns {string} Full URL to the endpoint
 */
function getAPIEndpoint(endpoint) {
    const baseURL = getBackendURL();
    // Remove leading slash from endpoint if present to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${baseURL}/${cleanEndpoint}`;
}

// Export for use in other scripts
window.SoundbitesConfig = {
    getBackendURL,
    getAPIEndpoint,
    isProduction: () => window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1',
    frontendURL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'
        : 'https://otis.soundbites.com'
};
