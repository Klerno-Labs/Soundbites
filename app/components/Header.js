/**
 * Unified Header Component
 * Shared across Quiz and Admin Dashboard for visual parity + zero CLS
 *
 * Usage:
 *   <div id="header-root"></div>
 *   <script>renderHeader({ title: 'Quiz', showLogout: false })</script>
 */

(function() {
    const DEFAULT_CONFIG = {
        title: '',
        showBack: false,
        showLogout: false,
        showProfile: false,
        compact: false,
        className: '',
        logoSrc: '/app/soundbites_logo_magenta.webp',
        waveSrc: '/app/dot_wave_2.webp'
    };

    /**
     * Render header into target element
     * @param {Object} config - Header configuration
     * @param {HTMLElement} target - Target element (defaults to #header-root)
     */
    window.renderHeader = function(config = {}, target = null) {
        const cfg = { ...DEFAULT_CONFIG, ...config };
        const container = target || document.getElementById('header-root') || document.querySelector('header');

        if (!container) {
            console.error('[Header] No target element found');
            return;
        }

        // Fixed height to prevent CLS (Cumulative Layout Shift)
        container.style.minHeight = cfg.compact ? '120px' : '180px';
        container.classList.add('sb-header');
        if (cfg.className) container.classList.add(cfg.className);

        const html = `
            <div class="logo-container" style="display: inline-flex; align-items: center; gap: 12px; margin-bottom: 1rem;">
                <img src="${cfg.logoSrc}"
                     alt="Soundbites Logo"
                     class="brand-logo"
                     width="200"
                     height="80"
                     loading="eager"
                     fetchpriority="high"
                     style="max-width: 200px; max-height: 80px; width: auto; height: auto; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));">
                <span class="play-button-accent" aria-hidden="true"></span>
            </div>

            ${cfg.title ? `<h1 class="sr-only">${cfg.title}</h1>` : ''}

            <p class="sb-copy" style="font-size: 1.05rem; opacity: 0.9; margin: 0.25rem 0;">
                Discover if Soundbites can improve your hearing experience
            </p>

            <div class="wave-decoration" style="opacity: 0.8; margin-top: 0.5rem;">
                <img src="${cfg.waveSrc}"
                     alt="Sound Wave"
                     class="wave-graphic"
                     loading="eager"
                     fetchpriority="high"
                     style="max-width: 600px; width: 100%; height: auto; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">
            </div>

            ${cfg.showBack ? `
                <nav class="header-nav" style="margin-top: 1rem;">
                    <button onclick="history.back()" class="btn btn-ghost" aria-label="Go back">
                        ← Back
                    </button>
                </nav>
            ` : ''}

            ${cfg.showLogout ? `
                <nav class="admin-nav" style="display: flex; gap: 0.5rem; align-items: center; justify-content: flex-end; margin-top: 1rem;">
                    <span style="flex: 1"></span>
                    <button id="logout-btn" class="btn btn-danger" type="button" aria-label="Log out">
                        Log out
                    </button>
                </nav>
            ` : ''}

            ${cfg.showProfile ? `
                <div class="profile-section" style="display: flex; align-items: center; gap: 0.5rem; margin-top: 1rem;">
                    <div class="avatar-skeleton" style="width: 40px; height: 40px; border-radius: 50%; background: rgba(0,0,0,0.1);"></div>
                    <span class="profile-name" style="font-weight: 600;">Admin</span>
                </div>
            ` : ''}
        `;

        container.innerHTML = html;

        // Apply signature sizing (from header-sizer.js)
        if (window.applySignatureRatiosCommon) {
            window.applySignatureRatiosCommon(container);
        }

        // Attach logout handler if needed
        if (cfg.showLogout) {
            const logoutBtn = container.querySelector('#logout-btn');
            if (logoutBtn && window.sbAdminLogout) {
                logoutBtn.onclick = window.sbAdminLogout;
            }
        }
    };

    // Auto-render if header-root exists on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            const root = document.getElementById('header-root');
            if (root && !root.hasChildNodes()) {
                window.renderHeader();
            }
        });
    }
})();
