// Simple auth bypass for development - allows admin panel to initialize
// TODO: Replace with proper backend authentication

// Auth check function - always returns true for now
window.sbIsAuthed = function() {
    return true;
};

// Auth enforcement function - always allows access for now
window.enforceAuth = function() {
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
