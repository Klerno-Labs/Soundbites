/**
 * User Management Module for Admin Dashboard
 * Handles CRUD operations for admin users with role-based access control
 */

(function() {
    'use strict';

    const API_BASE = window.SoundbitesConfig ? window.SoundbitesConfig.getBackendURL() :
                      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ?
                       'http://localhost:3000' :
                       'https://soundbites-quiz-backend.onrender.com');
    let currentUsers = [];

    // Initialize user management when panel is shown
    function initUserManagement() {
        console.log('Initializing user management...');
        loadUsers();
        setupEventListeners();
    }

    // Setup event listeners
    function setupEventListeners() {
        // Add user button
        const addUserBtn = document.getElementById('add-user-btn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => showUserModal());
        }

        // Modal close buttons
        const closeModalBtn = document.getElementById('close-user-modal');
        const cancelBtn = document.getElementById('cancel-user-btn');

        if (closeModalBtn) closeModalBtn.addEventListener('click', hideUserModal);
        if (cancelBtn) cancelBtn.addEventListener('click', hideUserModal);

        // User form submit
        const userForm = document.getElementById('user-form');
        if (userForm) {
            userForm.addEventListener('submit', handleUserFormSubmit);
        }

        // Close modal when clicking outside
        const modal = document.getElementById('user-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) hideUserModal();
            });
        }
    }

    // Load users from API
    async function loadUsers() {
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) {
                console.error('No auth token found');
                return;
            }

            const response = await fetch(`${API_BASE}/api/admin/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to load users');
            }

            const data = await response.json();
            currentUsers = data.users || [];
            renderUsersTable();

        } catch (error) {
            console.error('Error loading users:', error);
            showError('Failed to load users: ' + error.message);
            renderUsersTable([]); // Show empty table
        }
    }

    // Render users table
    function renderUsersTable() {
        const tbody = document.querySelector('#users-table tbody');
        if (!tbody) return;

        if (currentUsers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999;">No users found</td></tr>';
            return;
        }

        tbody.innerHTML = currentUsers.map(user => {
            const createdDate = new Date(user.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            const roleColor = {
                'admin': '#c92a76',
                'editor': '#6c757d',
                'viewer': '#17a2b8'
            }[user.role] || '#999';

            return `
                <tr data-user-id="${user.id}">
                    <td>${escapeHtml(user.username)}</td>
                    <td>${escapeHtml(user.email)}</td>
                    <td><span style="color: ${roleColor}; font-weight: 600;">${escapeHtml(user.role)}</span></td>
                    <td>${createdDate}</td>
                    <td>
                        <button class="btn btn-sm btn-secondary edit-user-btn" data-user-id="${user.id}">Edit</button>
                        <button class="btn btn-sm btn-danger delete-user-btn" data-user-id="${user.id}">Delete</button>
                    </td>
                </tr>
            `;
        }).join('');

        // Attach event listeners to action buttons
        tbody.querySelectorAll('.edit-user-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = parseInt(e.target.dataset.userId);
                const user = currentUsers.find(u => u.id === userId);
                if (user) showUserModal(user);
            });
        });

        tbody.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = parseInt(e.target.dataset.userId);
                const user = currentUsers.find(u => u.id === userId);
                if (user) confirmDeleteUser(user);
            });
        });
    }

    // Show user modal for add/edit
    function showUserModal(user = null) {
        const modal = document.getElementById('user-modal');
        const title = document.getElementById('user-modal-title');
        const form = document.getElementById('user-form');
        const passwordHint = document.getElementById('password-hint');

        if (!modal || !form) return;

        // Set title
        if (title) {
            title.textContent = user ? 'Edit User' : 'Add User';
        }

        // Reset form
        form.reset();

        // Populate form if editing
        if (user) {
            document.getElementById('user-id').value = user.id;
            document.getElementById('user-username').value = user.username;
            document.getElementById('user-email').value = user.email;
            document.getElementById('user-role').value = user.role || 'viewer';
            document.getElementById('user-password').removeAttribute('required');
            if (passwordHint) passwordHint.style.display = 'block';
        } else {
            document.getElementById('user-id').value = '';
            document.getElementById('user-password').setAttribute('required', 'required');
            if (passwordHint) passwordHint.style.display = 'none';
        }

        modal.style.display = 'flex';
    }

    // Hide user modal
    function hideUserModal() {
        const modal = document.getElementById('user-modal');
        if (modal) modal.style.display = 'none';
    }

    // Handle user form submit
    async function handleUserFormSubmit(e) {
        e.preventDefault();

        const userId = document.getElementById('user-id').value;
        const username = document.getElementById('user-username').value.trim();
        const email = document.getElementById('user-email').value.trim();
        const password = document.getElementById('user-password').value;
        const role = document.getElementById('user-role').value;

        try {
            const token = localStorage.getItem('admin_token');
            if (!token) {
                throw new Error('Not authenticated');
            }

            const isEdit = !!userId;
            const url = isEdit
                ? `${API_BASE}/api/admin/users/${userId}`
                : `${API_BASE}/api/admin/users`;

            const method = isEdit ? 'PUT' : 'POST';

            const body = { username, email, role };
            if (password) body.password = password;

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to save user');
            }

            const data = await response.json();
            console.log('User saved:', data);

            showSuccess(isEdit ? 'User updated successfully' : 'User created successfully');
            hideUserModal();
            loadUsers(); // Reload users list

        } catch (error) {
            console.error('Error saving user:', error);
            showError('Failed to save user: ' + error.message);
        }
    }

    // Confirm delete user
    function confirmDeleteUser(user) {
        if (!confirm(`Are you sure you want to delete user "${user.username}"?\n\nThis action cannot be undone.`)) {
            return;
        }

        deleteUser(user.id);
    }

    // Delete user
    async function deleteUser(userId) {
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete user');
            }

            showSuccess('User deleted successfully');
            loadUsers(); // Reload users list

        } catch (error) {
            console.error('Error deleting user:', error);
            showError('Failed to delete user: ' + error.message);
        }
    }

    // Utility: Escape HTML to prevent XSS
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }

    // Show success message
    function showSuccess(message) {
        // Create a simple success notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Show error message
    function showError(message) {
        // Create a simple error notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }

        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 9999;
            align-items: center;
            justify-content: center;
        }

        .modal-content {
            background: white;
            border-radius: 12px;
            max-width: 500px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }

        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem;
            border-bottom: 1px solid #eee;
        }

        .modal-header h3 {
            margin: 0;
            color: #333;
        }

        .modal-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            color: #999;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
        }

        .modal-close:hover {
            background: #f0f0f0;
            color: #333;
        }

        .modal form {
            padding: 1.5rem;
        }

        .modal .form-group {
            margin-bottom: 1.25rem;
        }

        .modal .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            color: #333;
            font-weight: 600;
        }

        .modal .form-group input,
        .modal .form-group select {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 1rem;
        }

        .modal .form-group input:focus,
        .modal .form-group select:focus {
            outline: none;
            border-color: #c92a76;
            box-shadow: 0 0 0 3px rgba(201, 42, 118, 0.1);
        }

        .modal-footer {
            display: flex;
            gap: 0.75rem;
            justify-content: flex-end;
            padding-top: 1rem;
            border-top: 1px solid #eee;
            margin-top: 1rem;
        }

        .btn-sm {
            padding: 0.375rem 0.75rem;
            font-size: 0.875rem;
        }

        .btn-secondary {
            background: #6c757d;
        }

        .btn-secondary:hover {
            background: #5a6268;
        }
    `;
    document.head.appendChild(style);

    // Expose to global scope
    window.initUserManagement = initUserManagement;

})();
