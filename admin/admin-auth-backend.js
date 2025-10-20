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

// Logout function - placeholder
window.sbAdminLogout = function() {
    if (confirm('Are you sure you want to log out?')) {
        // TODO: Implement actual logout with backend
        window.location.href = '/';
    }
};
