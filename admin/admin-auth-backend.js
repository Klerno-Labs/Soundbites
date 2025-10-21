// Admin Auth Guard - Enforce login before rendering admin content
// Checks JWT token validity via /api/admin/verify

window.sbIsAuthed = async function() {
    const token = localStorage.getItem('admin_token');
    if (!token) return false;

    try {
        const res = await fetch('/api/admin/verify', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include'
        });

        if (res.ok) {
            const data = await res.json();
            // Store user info for later use
            window.adminUser = data.user;
            return true;
        }

        // Token invalid/expired - clear it
        localStorage.removeItem('admin_token');
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
        // Clear local tokens
        localStorage.removeItem('admin_token');
        sessionStorage.clear();

        // Call backend logout to invalidate session
        try {
            await fetch('/api/admin/logout', {
                method: 'POST',
                credentials: 'include'
            });
        } catch (e) {
            console.warn('Logout API call failed:', e);
        }

        // Hard redirect to admin login (no back button access)
        window.location.replace('/admin/login.html');
    }
};
