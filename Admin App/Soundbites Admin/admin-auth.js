// Simple client-side auth for a static admin page
// NOTE: This is not a replacement for a real backend. For static hosting, it adds a basic gate.
// Store and compare only password hashes in localStorage.

(function(){
  // Only operate on the intended admin page and when the stealth hash is present
  const isAdminContext = () => {
    try {
      const isFile = /admin\.html$/i.test((document.location.pathname||'')) || document.title.toLowerCase().includes('admin');
      const hasHash = /(^|#)sb-admin(\b|$)/.test(window.location.hash||'');
      let hasSession = false;
      try { hasSession = !!(sessionStorage.getItem('sb-admin-auth') || localStorage.getItem('sb-admin-session')); } catch {}
      return isFile && (hasHash || hasSession);
    } catch { return false; }
  };
  const LS_KEY = 'sb-admin-auth';
  const DEFAULT_USER = 'admin';
  const RL_KEY = 'sb-admin-rl';
  const SESS_KEY = 'sb-admin-session'; // persistent session (when Remember me is enabled)
  const LAST_USER_KEY = 'sb-admin-last-user'; // last used username for autofill
  const REC_KEY = 'sb-admin-recovery'; // stores hashed recovery code
  const REC_SALT_KEY = 'sb-admin-recovery-salt'; // salt for hashing recovery code
  const SESS_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

  async function sha256(str){
    try {
      if (!(window.crypto && window.crypto.subtle)) {
        // Fallback for non-secure contexts or older browsers: not cryptographically secure
        return 'plain:' + str;
      }
      const enc = new TextEncoder();
      const data = enc.encode(str);
      const hash = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('');
    } catch {
      return 'plain:' + str;
    }
  }

  function safeGetCreds(){
    try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch { return null; }
  }

  // --- Recovery helpers ---
  function getOrCreateSalt(){
    try {
      let salt = localStorage.getItem(REC_SALT_KEY);
      if (!salt){
        salt = secureRandomStr(16);
        localStorage.setItem(REC_SALT_KEY, salt);
      }
      return salt;
    } catch { return 'static-salt'; }
  }

  function secureRandomStr(len){
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no confusing chars
    const bytes = new Uint8Array(len);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (let i=0; i<len; i++) bytes[i] = Math.floor(Math.random()*256);
    }
    let s = '';
    for (let i=0; i<len; i++) s += alphabet[bytes[i] % alphabet.length];
    return s;
  }

  async function hashRecovery(code){
    const salt = getOrCreateSalt();
    return sha256(salt + ':' + (code||''));
  }

  async function createAndStoreRecovery(){
    const code = secureRandomStr(20);
    const h = await hashRecovery(code);
    try { localStorage.setItem(REC_KEY, h); } catch {}
    return code;
  }

  async function verifyRecovery(code){
    try {
      const stored = localStorage.getItem(REC_KEY);
      if (!stored) return false;
      const h = await hashRecovery(code);
      return h === stored;
    } catch { return false; }
  }

  function renderLogin(){
    if (!isAdminContext()) return; // Do not render login outside admin context
    const rec = safeGetCreds();
    let lastUser = '';
    try { lastUser = localStorage.getItem(LAST_USER_KEY) || ''; } catch {}
    document.body.innerHTML = `
      <a href="#login-main" class="skip-link">Skip to content</a>
      <div class="container" role="application">
        <header>
          <h1>Soundbites Admin</h1>
        </header>

        <main id="login-main" role="main">
          <div class="quiz-container" style="max-width:520px;margin:0 auto;">
            <h2 style="margin-bottom:1rem">Admin Login</h2>
            <form id="login-form">
              <div class="form-group">
                <label for="sb-user">Username</label>
                <input id="sb-user" name="username" type="text" placeholder="admin" autocomplete="username" value="${lastUser.replace(/"/g,'&quot;')}" />
              </div>
              <div class="form-group" style="margin-top:12px">
                <label for="sb-pass">Password</label>
                <div class="password-field" style="position:relative;">
                  <input id="sb-pass" name="password" type="password" placeholder="\u2022\u2022\u2022\u2022\u2022\u2022" autocomplete="current-password" />
                  <button id="toggle-pass-btn" type="button" class="icon-btn" aria-label="Show password" aria-pressed="false" title="Show password" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);">
                    <span class="icon-eye" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22">
                        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    </span>
                    <span class="icon-eye-off" aria-hidden="true" style="display:none;">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22">
                        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-6 0-10-7-10-7a21.74 21.74 0 0 1 5.08-5.96m4.2-1.69A10.94 10.94 0 0 1 12 5c6 0 10 7 10 7a21.65 21.65 0 0 1-3.17 4.15"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    </span>
                  </button>
                </div>
              </div>
              <div class="form-group" style="margin-top:0;margin-bottom:0;display:flex;justify-content:flex-end;">
                <label for="remember-me" style="display:inline-flex;align-items:center;gap:.2rem;margin:0;padding:0;white-space:nowrap;line-height:1;">
                  <input id="remember-me" type="checkbox" checked style="margin:0;transform:scale(0.9);transform-origin:left center;" />
                  <span style="display:inline-block;font-size:.9rem;line-height:1;">Remember me</span>
                </label>
              </div>
              <div style="margin-top:6px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                <button id="sb-login" class="btn btn-primary" style="flex:1" type="submit">Login</button>
                <button id="sb-setpass" class="btn btn-secondary" type="button" title="Initialize admin" ${rec ? 'style="display:none"' : ''}>Initialize Admin</button>
              </div>
              <div style="margin-top:6px;display:flex;justify-content:space-between;align-items:center;">
                <a id="sb-forgot-link" href="#" style="font-size:.9rem;opacity:.85;">Forgot your password?</a>
                <span style="flex:1"></span>
                <a id="sb-reset-link" href="#" style="font-size:.9rem;opacity:.85;display:none;">Change password</a>
              </div>
            </form>
            <p class="sb-copy" style="margin-top:10px;opacity:.8">
              Use your admin credentials to sign in.${rec ? '' : ' If this is your first time, click <strong>Initialize Admin</strong> to set a username and password for this browser.'}
            </p>
          </div>
        </main>
      </div>
    `;
  // No header sizing dependencies in standalone admin
    // Submit with Enter or Login button
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('submit', (e) => { e.preventDefault(); doLogin(); });
    // Direct click handler for safety
    document.getElementById('sb-login').addEventListener('click', (e) => { e.preventDefault(); doLogin(); });
    const setBtn = document.getElementById('sb-setpass');
    if (setBtn) setBtn.addEventListener('click', setPassword);
  const forgotLink = document.getElementById('sb-forgot-link');
  if (forgotLink) forgotLink.addEventListener('click', (e) => { e.preventDefault(); renderRecoverAccount(); });
  const resetLink = document.getElementById('sb-reset-link'); // optional direct change
  if (resetLink) resetLink.addEventListener('click', (e) => { e.preventDefault(); renderResetPassword(); });
    // Toggle password visibility with eye/eye-off button
    const toggleBtn = document.getElementById('toggle-pass-btn');
    const passInput = document.getElementById('sb-pass');
    if (toggleBtn && passInput) toggleBtn.addEventListener('click', () => {
      const show = passInput.type !== 'text';
      passInput.type = show ? 'text' : 'password';
      toggleBtn.setAttribute('aria-pressed', String(show));
      toggleBtn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      toggleBtn.title = show ? 'Hide password' : 'Show password';
      const eye = toggleBtn.querySelector('.icon-eye');
      const eyeOff = toggleBtn.querySelector('.icon-eye-off');
      if (eye && eyeOff) {
        eye.style.display = show ? 'none' : '';
        eyeOff.style.display = show ? '' : 'none';
      }
    });
  }

  async function setPassword(){
    const user = (document.getElementById('sb-user')?.value || DEFAULT_USER).trim();
    const pass = prompt('Enter a new password to set for this browser (min 6 chars):');
    if (!pass) return;
    if (pass.length < 6) { alert('Password must be at least 6 characters.'); return; }
    const hash = await sha256(user + ':' + pass);
    localStorage.setItem(LS_KEY, JSON.stringify({ user, hash }));
    try { localStorage.setItem(LAST_USER_KEY, user); } catch {}
    // Ensure a recovery code exists and show it once
    try {
      const existing = localStorage.getItem(REC_KEY);
      if (!existing){
        const code = await createAndStoreRecovery();
        return renderRecoveryReveal(code, 'login');
      }
    } catch {}
    // Re-render to hide Initialize button after setup
    renderLogin();
  }

  function renderResetPassword(){
    if (!isAdminContext()) return renderLogin();
    const rec = safeGetCreds();
    if (!rec){
      alert('Admin is not initialized on this browser. Use "Initialize Admin" to set it up first.');
      return renderLogin();
    }
    document.body.innerHTML = `
      <a href="#login-main" class="skip-link">Skip to content</a>
      <div class="container" role="application">
        <header>
          <h1>Soundbites Admin</h1>
        </header>
        <main id="login-main" role="main">
          <div class="quiz-container" style="max-width:520px;margin:0 auto;">
            <h2 style="margin-bottom:.6rem">Reset Password</h2>
            <form id="reset-form">
              <div class="form-group">
                <label for="reset-username">Username</label>
                <input id="reset-username" type="text" value="${(rec.user||'admin').replace(/"/g,'&quot;')}" readonly />
              </div>
              <div class="form-group">
                <label for="reset-current">Current password</label>
                <input id="reset-current" type="password" placeholder="\u2022\u2022\u2022\u2022\u2022\u2022" autocomplete="current-password" />
              </div>
              <div class="form-row">
                <div class="form-col">
                  <label for="reset-new">New password</label>
                  <input id="reset-new" type="password" placeholder="At least 6 characters" autocomplete="new-password" />
                </div>
                <div class="form-col">
                  <label for="reset-confirm">Confirm new password</label>
                  <input id="reset-confirm" type="password" placeholder="Repeat new password" autocomplete="new-password" />
                </div>
              </div>
              <div style="display:flex;gap:.5rem;align-items:center;flex-wrap:wrap;">
                <button id="reset-submit" class="btn btn-primary" type="submit">Update Password</button>
                <a id="reset-cancel" href="#" class="btn" style="background:rgba(0,0,0,.06)">Back to login</a>
              </div>
              <p id="reset-msg" style="margin-top:.5rem;opacity:.85"></p>
            </form>
          </div>
        </main>
      </div>
    `;
  // No header sizing dependencies in standalone admin
    const form = document.getElementById('reset-form');
    const msg = document.getElementById('reset-msg');
    const show = (t, ok=false) => { if (msg){ msg.textContent = t; msg.style.color = ok? 'green':'#b00020'; } else alert(t); };
    document.getElementById('reset-cancel')?.addEventListener('click', (e) => { e.preventDefault(); renderLogin(); });
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = document.getElementById('reset-username')?.value || 'admin';
      const cur = document.getElementById('reset-current')?.value || '';
      const np = document.getElementById('reset-new')?.value || '';
      const cp = document.getElementById('reset-confirm')?.value || '';
      const recNow = safeGetCreds();
      if (!recNow) return show('Admin not initialized.');
      const curHash = await sha256(user + ':' + cur);
      if (curHash !== recNow.hash) return show('Current password is incorrect.');
      if (np.length < 6) return show('New password must be at least 6 characters.');
      if (np !== cp) return show('New password and confirmation do not match.');
      const newHash = await sha256(user + ':' + np);
      localStorage.setItem(LS_KEY, JSON.stringify({ user, hash: newHash }));
      try { sessionStorage.removeItem(LS_KEY); } catch {}
      clearFailures();
      show('Password updated. Please login with your new password.', true);
      setTimeout(() => renderLogin(), 900);
    });
  }

  async function doLogin(){
    // Simple rate limit: 5 attempts within 5 minutes; 60s lockout
    if (isLockedOut()) {
      const rem = Math.ceil(remainingLockoutSeconds());
      alert(`Too many attempts. Try again in ${rem} seconds.`);
      return;
    }
    const user = (document.getElementById('sb-user')?.value || '').trim();
    const pass = (document.getElementById('sb-pass')?.value || '');
    const rec = safeGetCreds();
    if (!rec){
      alert('Admin not initialized on this browser. Click "Initialize Admin" to set credentials.');
      return;
    }
    if (user !== rec.user){
      alert('Unknown user');
      recordFailedAttempt();
      return;
    }
    const hash = await sha256(user + ':' + pass);
    if (hash !== rec.hash){
      alert('Invalid credentials');
      recordFailedAttempt();
      return;
    }
    // Save last used user for autofill next time
    try { localStorage.setItem(LAST_USER_KEY, user); } catch {}
    
    // **NEW: Authenticate with API and get JWT token**
    if (window.api) {
      try {
        console.log('🔐 Authenticating with API...');
        const apiResponse = await window.api.login(user, pass);
        if (apiResponse.success && apiResponse.token) {
          // Store JWT token for API calls
          window.api.setToken(apiResponse.token);
          sessionStorage.setItem('api-token', apiResponse.token);
          console.log('✅ API authentication successful');
        }
      } catch (apiErr) {
        console.warn('⚠️ API authentication failed, continuing with client-side auth:', apiErr);
        // Don't block login if API fails - fallback to client-side only
      }
    }
    
    // Persist session if Remember me is checked, else keep it in sessionStorage
    const remember = !!document.getElementById('remember-me')?.checked;
    if (remember) {
      try { localStorage.setItem(SESS_KEY, JSON.stringify({ user, remember: true, ts: Date.now() })); } catch {}
    } else {
      sessionStorage.setItem(LS_KEY, JSON.stringify({ user }));
    }
    clearFailures();
    // Set stealth hash for smoother reload and to satisfy gate
    try { if (!/(^|#)sb-admin(\b|$)/.test(location.hash||'')) location.hash = 'sb-admin'; } catch {}
    location.reload();
  }

  // Rate limit helpers
  function getRL(){
    try { return JSON.parse(localStorage.getItem(RL_KEY) || 'null') || {}; } catch { return {}; }
  }
  function saveRL(obj){
    try { localStorage.setItem(RL_KEY, JSON.stringify(obj)); } catch {}
  }
  function recordFailedAttempt(){
    const now = Date.now();
    const rl = getRL();
    const windowMs = 5 * 60 * 1000; // 5 minutes
    const maxAttempts = 5;
    const arr = (rl.attempts || []).filter(t => now - t < windowMs);
    arr.push(now);
    rl.attempts = arr;
    if (arr.length >= maxAttempts){
      rl.lockUntil = now + 60 * 1000; // 60s lock after threshold
    }
    saveRL(rl);
  }
  function isLockedOut(){
    const rl = getRL();
    if (!rl.lockUntil) return false;
    const now = Date.now();
    if (now >= rl.lockUntil){ clearFailures(); return false; }
    return true;
  }
  function remainingLockoutSeconds(){
    const rl = getRL();
    const now = Date.now();
    return rl.lockUntil ? Math.max(0, (rl.lockUntil - now)/1000) : 0;
  }
  function clearFailures(){ saveRL({ attempts: [], lockUntil: 0 }); }

  function isAuthed(){
    try {
      const hasSession = !!sessionStorage.getItem(LS_KEY);
      let hasPersistent = false;
      const raw = localStorage.getItem(SESS_KEY);
      if (raw){
        try {
          const obj = JSON.parse(raw);
          if (obj && obj.ts && (Date.now() - obj.ts) <= SESS_TTL_MS) {
            hasPersistent = true;
          } else {
            // Expired
            localStorage.removeItem(SESS_KEY);
          }
        } catch { localStorage.removeItem(SESS_KEY); }
      }
      return hasSession || hasPersistent || !!window.__SB_AUTH_OK__;
    } catch {
      return !!window.__SB_AUTH_OK__;
    }
  }

  function logout(){
    try { sessionStorage.removeItem(LS_KEY); } catch {}
    try { localStorage.removeItem(SESS_KEY); } catch {}
    
    // **NEW: Clear API token**
    try { 
      sessionStorage.removeItem('api-token');
      if (window.api) window.api.clearToken();
      console.log('✅ Cleared API token');
    } catch {}
    
    // Render login in-place instead of reloading so we always land on the admin login view
    try {
      if (typeof renderLogin === 'function') {
        renderLogin();
      } else {
        // Fallback: minimal reload if renderLogin not yet defined
        location.reload();
      }
    } catch { location.reload(); }
  }

  function enforceAuth(){
    if (!isAdminContext()) return true; // no-op outside admin
    
    // **NEW: Restore API token from session if available**
    if (window.api) {
      const savedToken = sessionStorage.getItem('api-token');
      if (savedToken) {
        window.api.setToken(savedToken);
        console.log('✅ Restored API token from session');
      }
    }
    
    if (isAuthed()) { window.__SB_AUTH_OK__ = true; return true; }
    const doRender = () => renderLogin();
    if (document.body) doRender(); else document.addEventListener('DOMContentLoaded', doRender, { once: true });
    window.__SB_AUTH_OK__ = false;
    return false;
  }

  window.enforceAuth = enforceAuth;
  window.sbIsAuthed = isAuthed;
  window.sbAdminLogout = logout;

  // Allow generating a new recovery code from Settings (when authenticated)
  window.generateRecovery = async function(){
    const code = await createAndStoreRecovery();
    window.renderRecoveryReveal?.(code, 'settings');
  };

  // Wire logout and change password when present
  window.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('logout-btn');
    if (btn) btn.addEventListener('click', logout);

    const cpf = document.getElementById('change-password-form');
    if (cpf) {
      const msg = document.getElementById('change-password-msg');
      // Populate username field
      const rec = safeGetCreds();
      if (rec && document.getElementById('current-username')) {
        document.getElementById('current-username').value = rec.user || DEFAULT_USER;
      }
      cpf.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentUser = (document.getElementById('current-username')?.value || DEFAULT_USER).trim();
        const currentPass = document.getElementById('current-password')?.value || '';
        const newPass = document.getElementById('new-password')?.value || '';
        const confirmPass = document.getElementById('confirm-password')?.value || '';
        const recNow = safeGetCreds();
        const show = (t, ok=false) => { if (msg){ msg.textContent = t; msg.style.color = ok? 'green':'#b00020'; } else alert(t); };
        if (!recNow) return show('Admin not initialized on this browser. Use Initialize Admin first.');
        if (currentUser !== recNow.user) return show('Username mismatch.');
        if (newPass.length < 6) return show('New password must be at least 6 characters.');
        if (newPass !== confirmPass) return show('New password and confirmation do not match.');
        const curHash = await sha256(currentUser + ':' + currentPass);
        if (curHash !== recNow.hash) return show('Current password is incorrect.');
        const newHash = await sha256(currentUser + ':' + newPass);
        localStorage.setItem(LS_KEY, JSON.stringify({ user: currentUser, hash: newHash }));
        try { sessionStorage.removeItem(LS_KEY); } catch {}
        clearFailures();
        show('Password updated. Please login again with your new password.', true);
        setTimeout(() => { location.reload(); }, 1200);
      });
    }

    // Wire generate recovery button if present
    const gen = document.getElementById('generate-recovery');
    if (gen) gen.addEventListener('click', async (e)=>{
      e.preventDefault();
      if (typeof window.generateRecovery === 'function') {
        await window.generateRecovery();
      }
    });
  });

  // No preset credentials in production mode.
})();

// --- Recovery flows UI ---
(function(){
  if (!window) return;
  window.renderRecoveryReveal = function(code, next='login'){
    document.body.innerHTML = `
      <a href="#main" class="skip-link">Skip</a>
      <div class="container" role="application">
        <header>
          <div class="logo-container">
            <img src="../../Main app/soundbites_logo_magenta.webp" alt="Soundbites Logo" class="brand-logo">
            <span class="play-button-accent" aria-hidden="true"></span>
          </div>
          <div class="wave-decoration"><img src="../../Main app/dot_wave_2.webp" alt="Sound Wave" class="wave-graphic"></div>
        </header>
        <main id="main">
          <div class="quiz-container" style="max-width:520px;margin:0 auto;">
            <h2 style="margin-bottom:.6rem">Your Recovery Code</h2>
            <p class="sb-copy" style="opacity:.85;margin:.25rem 0 .5rem;">Save this code in a safe place. You can use it to reset your username and password if you forget them.</p>
            <div style="display:flex;align-items:center;gap:.5rem;background:#f7f7f7;border:1px solid #e3e3e3;border-radius:8px;padding:.6rem .75rem;">
              <code style="font-weight:700;letter-spacing:1px;">${code}</code>
              <span style="flex:1"></span>
              <button id="copy-rec" class="btn btn-secondary" type="button">Copy</button>
              <button id="dl-rec" class="btn btn-secondary" type="button">Download</button>
            </div>
            <div style="margin-top:.6rem;display:flex;gap:.5rem;align-items:center;">
              <label style="display:flex;align-items:center;gap:.35rem;">
                <input id="ack-rec" type="checkbox" /> I have saved my recovery code
              </label>
              <span style="flex:1"></span>
              <button id="rec-continue" class="btn btn-primary" type="button" disabled>Continue</button>
            </div>
          </div>
        </main>
      </div>`;
    // Re-apply header sizing after DOM replacement
    try { if (window.applySignatureRatiosCommon) window.applySignatureRatiosCommon(document); } catch {}
    const copyBtn = document.getElementById('copy-rec');
    copyBtn?.addEventListener('click', async ()=>{
      try { await navigator.clipboard.writeText(code); copyBtn.textContent = 'Copied'; setTimeout(()=>copyBtn.textContent='Copy', 1200); } catch {}
    });
    const dlBtn = document.getElementById('dl-rec');
    dlBtn?.addEventListener('click', ()=>{
      const blob = new Blob([`Soundbites Admin Recovery Code\n\n${code}\n`], {type:'text/plain'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'soundbites-admin-recovery.txt'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    });
    const ack = document.getElementById('ack-rec');
    const cont = document.getElementById('rec-continue');
    ack?.addEventListener('change', ()=>{ cont.disabled = !ack.checked; });
    cont?.addEventListener('click', ()=>{
      if (!ack?.checked) return;
      if (next === 'login') {
        try { if (!/(^|#)sb-admin(\b|$)/.test(location.hash||'')) location.hash = 'sb-admin'; } catch {}
        renderLogin();
      } else if (next === 'settings') {
        try { if (!/(^|#)sb-admin(\b|$)/.test(location.hash||'')) location.hash = 'sb-admin'; } catch {}
        // After code generation from Settings, stay on settings by reloading with session present
        location.reload();
      } else {
        renderLogin();
      }
    });
  };

  window.renderRecoverAccount = function(){
    document.body.innerHTML = `
      <a href="#main" class="skip-link">Skip</a>
      <div class="container" role="application">
        <header>
          <div class="logo-container">
            <img src="../../Main app/soundbites_logo_magenta.webp" alt="Soundbites Logo" class="brand-logo">
            <span class="play-button-accent" aria-hidden="true"></span>
          </div>
          <div class="wave-decoration"><img src="../../Main app/dot_wave_2.webp" alt="Sound Wave" class="wave-graphic"></div>
        </header>
        <main id="main">
          <div class="quiz-container" style="max-width:520px;margin:0 auto;">
            <h2 style="margin-bottom:.6rem">Recover Account</h2>
            <form id="recover-form">
              <div class="form-group">
                <label for="recover-code">Recovery code</label>
                <input id="recover-code" type="text" placeholder="Enter your recovery code" autocomplete="one-time-code" />
              </div>
              <div class="form-group">
                <label for="recover-username">New username</label>
                <input id="recover-username" type="text" placeholder="Choose a username" />
              </div>
              <div class="form-row">
                <div class="form-col">
                  <label for="recover-new">New password</label>
                  <input id="recover-new" type="password" placeholder="At least 6 characters" autocomplete="new-password" />
                </div>
                <div class="form-col">
                  <label for="recover-confirm">Confirm new password</label>
                  <input id="recover-confirm" type="password" placeholder="Repeat new password" autocomplete="new-password" />
                </div>
              </div>
              <div style="display:flex;gap:.5rem;align-items:center;flex-wrap:wrap;">
                <button id="recover-submit" class="btn btn-primary" type="submit">Reset and Sign In</button>
                <a id="recover-cancel" href="#" class="btn" style="background:rgba(0,0,0,.06)">Back to login</a>
              </div>
              <p id="recover-msg" style="margin-top:.5rem;opacity:.85"></p>
            </form>
          </div>
        </main>
      </div>`;
    // Re-apply header sizing after DOM replacement
    try { if (window.applySignatureRatiosCommon) window.applySignatureRatiosCommon(document); } catch {}
    const form = document.getElementById('recover-form');
    const msg = document.getElementById('recover-msg');
    const show = (t, ok=false) => { if (msg){ msg.textContent = t; msg.style.color = ok? 'green':'#b00020'; } else alert(t); };
  document.getElementById('recover-cancel')?.addEventListener('click', (e)=>{ e.preventDefault(); renderLogin(); });
    form?.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const code = document.getElementById('recover-code')?.value?.trim();
      const newUser = (document.getElementById('recover-username')?.value || '').trim();
      const np = document.getElementById('recover-new')?.value || '';
      const cp = document.getElementById('recover-confirm')?.value || '';
      if (!code) return show('Enter your recovery code.');
      if (!newUser) return show('Enter a new username.');
      if (np.length < 6) return show('New password must be at least 6 characters.');
      if (np !== cp) return show('New password and confirmation do not match.');
      const ok = await verifyRecovery(code);
      if (!ok) return show('Invalid recovery code.');
      // Update credentials
      const newHash = await sha256(newUser + ':' + np);
      try {
        localStorage.setItem('sb-admin-auth', JSON.stringify({ user: newUser, hash: newHash }));
        localStorage.setItem('sb-admin-last-user', newUser);
        localStorage.removeItem('sb-admin-session');
      } catch {}
      // Rotate recovery code for security
      const newCode = await createAndStoreRecovery();
      // Clear rate limits and sessions
      try { sessionStorage.removeItem('sb-admin-auth'); } catch {}
      try { localStorage.setItem('sb-admin-rl', JSON.stringify({ attempts: [], lockUntil: 0 })); } catch {}
      show('Credentials updated. Save your new recovery code.', true);
      setTimeout(()=>{ window.renderRecoveryReveal(newCode, 'login'); }, 600);
    });
  };
})();

