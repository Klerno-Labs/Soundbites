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

    function showPasswordOnlyLogin(message) {
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
                showPasswordOnlyLogin('Invalid password.');
            }
        });
    }

    function showBackendLoginUI(message) {
        const root = document.getElementById('admin-root') || document.body;
        root.innerHTML = `
            <div style="max-width:480px;margin:80px auto;text-align:center;background:#fff;padding:24px;border-radius:8px;box-shadow:0 4px 14px rgba(0,0,0,0.06)">
                <h2 style="margin:0 0 12px;color:var(--sb-primary)">Soundbites Admin</h2>
                <p style="color:#666;margin-bottom:12px">Sign in with your admin account.</p>
                <input id="sb-admin-email" type="email" placeholder="Email" style="width:100%;padding:10px;border:1px solid #eee;border-radius:6px;margin-bottom:8px" />
                <input id="sb-admin-pass" type="password" placeholder="Password" style="width:100%;padding:10px;border:1px solid #eee;border-radius:6px;margin-bottom:12px" />
                <button id="sb-admin-login" class="btn" style="width:100%">Sign in</button>
                <p class="small" style="margin-top:10px;color:#999">${message || ''}</p>
            </div>
        `;

        document.getElementById('sb-admin-login').addEventListener('click', async () => {
            const email = (document.getElementById('sb-admin-email').value || '').trim();
            const pass = document.getElementById('sb-admin-pass').value || '';
            if (!email || !pass) {
                showBackendLoginUI('Please enter both email and password.');
                return;
            }
            try {
                // Use backend adapter if available
                if (window.AdminAuthBackend && typeof window.AdminAuthBackend.login === 'function') {
                    await window.AdminAuthBackend.login(email, pass);
                    // Success: initialize app
                    loadAdminApp();
                } else {
                    // Fallback: hash and store as legacy password
                    const h = hashPassword(pass);
                    localStorage.setItem(adminKey, h);
                    loadAdminApp();
                }
            } catch (err) {
                console.error('Backend login failed', err);
                const msg = (err && err.message) ? err.message : 'Invalid credentials.';
                showBackendLoginUI(msg);
            }
        });
    }

    function loadAdminApp() {
        if (window.admin) {
            return;
        }
        // Initialize the SPA
        try {
            window.admin = new QuizAdmin();
        } catch (e) {
            // If QuizAdmin isn't defined yet, try initializing after a short delay
            setTimeout(() => {
                if (!window.admin && typeof QuizAdmin === 'function') {
                    window.admin = new QuizAdmin();
                }
            }, 50);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        // Prefer backend auth adapter if present (shows email+password)
        const adminStored = localStorage.getItem(adminKey);
        if (window.AdminAuthBackend && typeof window.AdminAuthBackend.login === 'function') {
            // If already authenticated via token, boot app
            if (window.AdminAuthBackend.isAuthenticated && window.AdminAuthBackend.isAuthenticated()) {
                loadAdminApp();
            } else {
                showBackendLoginUI();
            }
            return;
        }

        // No backend adapter: use legacy client-side flow (password only)
        if (adminStored) {
            loadAdminApp();
        } else {
            showPasswordOnlyLogin();
        }
    });
})();
