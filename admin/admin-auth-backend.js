// Admin Auth Guard - Enforce login before rendering admin content
// Uses HttpOnly cookies for secure authentication (no localStorage)

window.sbIsAuthed = async function() {
    try {
        // Use backend URL helper (falls back to direct URL if config not loaded)
        const verifyURL = window.SoundbitesConfig
            ? window.SoundbitesConfig.getAPIEndpoint('auth/verify')
            : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? 'http://localhost:3000/api/auth/verify'
                : 'https://soundbites-quiz-backend.onrender.com/api/auth/verify');

        // Token is sent automatically via HttpOnly cookie
        const res = await fetch(verifyURL, {
            method: 'GET',
            credentials: 'include'  // Include HttpOnly cookies
        });

        if (res.ok) {
            const data = await res.json();
            // Store user info for later use
            window.adminUser = data.user;
            return true;
        }

        return false;
    } catch (error) {
        console.warn('Auth check failed:', error);
        return false;
    }
};

// Enforce auth - redirects to login if not authenticated
// Returns true if authed, false if redirected
window.enforceAuth = async function() {
    const authed = await window.sbIsAuthed();

    if (!authed) {
        // Hard redirect to login (no SPA history)
        window.location.replace('/admin/login.html');
        return false;
    }

    return true;
};

// Logout function - clears session and redirects to admin login
window.sbAdminLogout = async function() {
    if (confirm('Are you sure you want to log out?')) {
        // Call backend logout to clear HttpOnly cookie
        try {
            const logoutURL = window.SoundbitesConfig
                ? window.SoundbitesConfig.getAPIEndpoint('auth/logout')
                : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                    ? 'http://localhost:3000/api/auth/logout'
                    : 'https://soundbites-quiz-backend.onrender.com/api/auth/logout');

            await fetch(logoutURL, {
                method: 'POST',
                credentials: 'include'  // Include cookies to be cleared
            });
        } catch (e) {
            console.warn('Logout API call failed:', e);
        }

        // Clear any session storage
        sessionStorage.clear();

        // Hard redirect to admin login (no back button access)
        window.location.replace('/admin/login.html');
    }
};
