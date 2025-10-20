// Backend auth helper for the admin panel. Posts credentials to the backend API and stores JWT tokens.
window.AdminAuthBackend = (function(){
    const storageKey = 'sb_admin_token';

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
        if (window.onAdminLogout) window.onAdminLogout();
    }

    function getToken() {
        return localStorage.getItem(storageKey);
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
