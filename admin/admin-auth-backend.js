// Backend auth helper for the admin panel. Posts credentials to the backend API and stores JWT tokens.
window.AdminAuthBackend = (function(){
    // Use unified storage key matching the API client ('sb-admin-token')
    const storageKey = 'sb-admin-token';
    const legacyStorageKey = 'sb_admin_token';

    async function login(email, password) {
        try {
            const resp = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!resp.ok) {
                const err = await resp.json().catch(()=>({message:'Login failed'}));
                throw new Error(err.message || 'Login failed');
            }

            const data = await resp.json();
            if (data && data.token) {
                localStorage.setItem(storageKey, data.token);
                // keep legacy key for compatibility
                try { localStorage.setItem(legacyStorageKey, data.token); } catch(e){}

                // Update global API client if present
                if (window.api && typeof window.api.setToken === 'function') {
                    try { window.api.setToken(data.token); } catch(e) { console.warn('Failed to set token on window.api', e); }
                }

                // Notify the app
                if (window.onAdminLogin) window.onAdminLogin(data);
                return data;
            }
            throw new Error('No token received');
        } catch (e) {
            console.error('Login error', e);
            throw e;
        }
    }

    function logout() {
        localStorage.removeItem(storageKey);
        try { localStorage.removeItem(legacyStorageKey); } catch(e){}
        if (window.api && typeof window.api.clearToken === 'function') {
            try { window.api.clearToken(); } catch(e) { console.warn('Failed to clear token on window.api', e); }
        }
        if (window.onAdminLogout) window.onAdminLogout();
    }

    function getToken() {
        // Prefer new key, fall back to legacy
        return localStorage.getItem(storageKey) || localStorage.getItem(legacyStorageKey) || null;
    }

    function isAuthenticated() {
        return !!getToken();
    }

    function attachAuthHeader(headers) {
        const token = getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    return { login, logout, getToken, isAuthenticated, attachAuthHeader };
})();
