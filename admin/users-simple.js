/**
 * SUPER SIMPLE USER MANAGEMENT - Just Works™
 * Drop-in replacement for complex admin-users.js
 */

(function() {
    'use strict';

    let users = [];

    // Initialize
    function init() {
        setupEventListeners();
        loadUsers();
    }

    // Setup all event listeners
    function setupEventListeners() {
        document.getElementById('add-user-btn')?.addEventListener('click', () => showModal());
        document.getElementById('close-user-modal')?.addEventListener('click', hideModal);
        document.getElementById('cancel-user-btn')?.addEventListener('click', hideModal);
        document.getElementById('user-form')?.addEventListener('submit', saveUser);
        document.getElementById('user-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'user-modal') hideModal();
        });
    }

    // Load users from API
    async function loadUsers() {
        try {
            const data = await SimpleAuth.api('admin/users');
            users = data.users || [];
            renderUsers();
        } catch (error) {
            showError('Failed to load users: ' + error.message);
            users = [];
            renderUsers();
        }
    }

    // Render users table
    function renderUsers() {
        const tbody = document.querySelector('#users-table tbody');
        if (!tbody) return;

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999;">No users found</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${escape(user.username)}</td>
                <td>${escape(user.email)}</td>
                <td><span style="color: ${getRoleColor(user.role)}; font-weight: 600;">${escape(user.role)}</span></td>
                <td>${formatDate(user.created_at)}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="window.editUser(${user.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="window.deleteUser(${user.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    }

    // Show modal for add/edit
    function showModal(user = null) {
        const modal = document.getElementById('user-modal');
        const title = document.getElementById('user-modal-title');
        const form = document.getElementById('user-form');
        const passwordHint = document.getElementById('password-hint');

        if (!modal || !form) return;

        form.reset();
        title.textContent = user ? 'Edit User' : 'Add User';

        if (user) {
            document.getElementById('user-id').value = user.id;
            document.getElementById('user-username').value = user.username;
            document.getElementById('user-email').value = user.email;
            document.getElementById('user-role').value = user.role;
            document.getElementById('user-password').removeAttribute('required');
            if (passwordHint) passwordHint.style.display = 'block';
        } else {
            document.getElementById('user-id').value = '';
            document.getElementById('user-password').setAttribute('required', 'required');
            if (passwordHint) passwordHint.style.display = 'none';
        }

        modal.style.display = 'flex';
    }

    // Hide modal
    function hideModal() {
        const modal = document.getElementById('user-modal');
        if (modal) modal.style.display = 'none';
    }

    // Save user (create or update)
    async function saveUser(e) {
        e.preventDefault();

        const userId = document.getElementById('user-id').value;
        const username = document.getElementById('user-username').value.trim();
        const email = document.getElementById('user-email').value.trim();
        const password = document.getElementById('user-password').value;
        const role = document.getElementById('user-role').value;

        const body = { username, email, role };
        if (password) body.password = password;

        try {
            if (userId) {
                // Update
                await SimpleAuth.api(`admin/users/${userId}`, {
                    method: 'PUT',
                    body: JSON.stringify(body)
                });
                showSuccess('User updated successfully');
            } else {
                // Create
                await SimpleAuth.api('admin/users', {
                    method: 'POST',
                    body: JSON.stringify(body)
                });
                showSuccess('User created successfully');
            }

            hideModal();
            loadUsers();

        } catch (error) {
            showError('Failed to save user: ' + error.message);
        }
    }

    // Delete user
    async function deleteUserById(userId) {
        const user = users.find(u => u.id === userId);
        if (!user) return;

        if (!confirm(`Delete user "${user.username}"?\n\nThis cannot be undone.`)) {
            return;
        }

        try {
            await SimpleAuth.api(`admin/users/${userId}`, { method: 'DELETE' });
            showSuccess('User deleted successfully');
            loadUsers();
        } catch (error) {
            showError('Failed to delete user: ' + error.message);
        }
    }

    // Edit user
    function editUserById(userId) {
        const user = users.find(u => u.id === userId);
        if (user) showModal(user);
    }

    // Utility functions
    function escape(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function getRoleColor(role) {
        return { admin: '#c92a76', editor: '#6c757d', viewer: '#17a2b8' }[role] || '#999';
    }

    function formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    }

    function showSuccess(msg) {
        const div = document.createElement('div');
        div.style.cssText = 'position:fixed;top:20px;right:20px;background:#28a745;color:white;padding:1rem 1.5rem;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:10000;';
        div.textContent = msg;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 3000);
    }

    function showError(msg) {
        const div = document.createElement('div');
        div.style.cssText = 'position:fixed;top:20px;right:20px;background:#dc3545;color:white;padding:1rem 1.5rem;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:10000;';
        div.textContent = msg;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 5000);
    }

    // Expose functions globally for onclick handlers
    window.editUser = editUserById;
    window.deleteUser = deleteUserById;
    window.initUserManagement = init;

})();
