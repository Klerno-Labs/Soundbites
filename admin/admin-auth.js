// Lightweight client-side auth used for local demos or when backend isn't available
(function(){
    function hashPassword(p) {
        // Simple hash for demo only (do not use in production)
        let h = 0;
        for (let i = 0; i < p.length; i++) {
            h = ((h << 5) - h) + p.charCodeAt(i);
            h |= 0;
        }
        return h.toString(16);
    }

    const adminKey = 'soundbites-admin-auth';
    const defaultPasswordHash = '5f4dcc3b5aa765d61d8327deb882cf99'; // 'password' MD5 placeholder

    function showLoginUI(message) {
        const root = document.getElementById('admin-root') || document.body;
        root.innerHTML = `
            <div style="max-width:420px;margin:80px auto;text-align:center;background:#fff;padding:24px;border-radius:8px;box-shadow:0 4px 14px rgba(0,0,0,0.06)">
                <h2 style="margin:0 0 12px;color:var(--sb-primary)">Soundbites Admin</h2>
                <p style="color:#666;margin-bottom:18px">Enter admin password to continue.</p>
                <input id="sb-admin-pass" type="password" placeholder="Password" style="width:100%;padding:10px;border:1px solid #eee;border-radius:6px;margin-bottom:12px" />
                <button id="sb-admin-login" class="btn" style="width:100%">Log in</button>
                <p class="small" style="margin-top:10px;color:#999">${message || ''}</p>
            </div>
        `;

        document.getElementById('sb-admin-login').addEventListener('click', () => {
            const pass = document.getElementById('sb-admin-pass').value || '';
            const h = hashPassword(pass);
            if (h === defaultPasswordHash || h === localStorage.getItem(adminKey)) {
                localStorage.setItem(adminKey, h);
                loadAdminApp();
            } else {
                showLoginUI('Invalid password.');
            }
        });
    }

    function loadAdminApp() {
        // Restore original admin content from index.html by reloading the page
        // If the SPA boot sequence is tied to DOMContentLoaded, reinit by calling window.admin = new QuizAdmin();
        if (window.admin) {
            // Already loaded
            return;
        }

        // Replace root with fetched content from the DOM (index.html includes main UI)
        // If admin/index.html has the app markup, we can just initialize QuizAdmin
        window.admin = new QuizAdmin();
    }

    document.addEventListener('DOMContentLoaded', () => {
        // If server-side auth is present (admin-auth-backend.js), it will handle login
        // Otherwise, fallback to local client-side auth
        const adminStored = localStorage.getItem(adminKey);
        if (adminStored) {
            loadAdminApp();
        } else {
            showLoginUI();
        }
    });
})();
