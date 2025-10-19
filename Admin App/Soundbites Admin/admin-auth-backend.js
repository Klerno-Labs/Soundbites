// Secure Backend Authentication for Admin Panel
// Uses JWT tokens with backend validation

(function() {
  'use strict';

  const TOKEN_KEY = 'sb-admin-token';
  const USER_KEY = 'sb-admin-user';
  const REMEMBER_KEY = 'sb-admin-remember';
  
  // Check if we're on the admin page
  const isAdminPage = () => {
    return /admin\.html$/i.test(window.location.pathname) || 
           document.title.toLowerCase().includes('admin');
  };

  // Get stored token
  const getToken = () => {
    try {
      return sessionStorage.getItem(TOKEN_KEY) || 
             (localStorage.getItem(REMEMBER_KEY) === 'true' ? localStorage.getItem(TOKEN_KEY) : null);
    } catch {
      return null;
    }
  };

  // Store token
  const setToken = (token, remember = false) => {
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
      if (remember) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(REMEMBER_KEY, 'true');
      } else {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REMEMBER_KEY);
      }
    } catch (e) {
      console.error('Failed to store token:', e);
    }
  };

  // Clear authentication
  const clearAuth = () => {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REMEMBER_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      console.error('Failed to clear auth:', e);
    }
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    const token = getToken();
    if (!token) return false;

    // Basic JWT validation (check if it's expired)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      return Date.now() < exp;
    } catch {
      return false;
    }
  };

  // Login function
  const login = async (username, password, remember = false) => {
    try {
      const response = await fetch('https://soundbites-quiz-backend.onrender.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();
      
      if (data.success && data.token) {
        setToken(data.token, remember);
        if (data.user) {
          sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
          if (remember) {
            localStorage.setItem(USER_KEY, JSON.stringify(data.user));
          }
        }
        
        // Set token for API client if available
        if (window.api) {
          window.api.token = data.token;
          localStorage.setItem('sb-admin-token', data.token);
        }
        
        return { success: true, user: data.user };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  // Logout function
  const logout = () => {
    clearAuth();
    if (window.api) {
      window.api.token = null;
    }
    window.location.reload();
  };

  // Show login page
  const showLoginPage = () => {
    const lastUsername = localStorage.getItem('sb-admin-last-user') || '';
    
    document.body.innerHTML = `
      <div class="container" role="application">
        <header>
          <div class="logo-container">
            <img src="../../Main app/soundbites_logo_magenta.webp" alt="Soundbites Logo" class="brand-logo">
            <span class="play-button-accent" aria-hidden="true"></span>
          </div>
          <p class="sb-copy">Admin Login</p>
          <div class="wave-decoration">
            <img src="../../Main app/dot_wave_2.webp" alt="Sound Wave" class="wave-graphic">
          </div>
        </header>
        <main id="main">
          <div class="quiz-container" style="max-width:420px;margin:2rem auto;">
            <h2 style="margin-bottom:1rem;">Login to Admin Panel</h2>
            <form id="login-form" style="margin-top:1.5rem;">
              <div class="form-group">
                <label for="username">Username</label>
                <input type="text" id="username" name="username" value="${lastUsername}" required autocomplete="username" autofocus>
              </div>
              <div class="form-group">
                <label for="password">Password</label>
                <div style="position:relative;">
                  <input type="password" id="password" name="password" required autocomplete="current-password">
                  <button type="button" id="toggle-password" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;padding:5px;" aria-label="Toggle password visibility">
                    <span id="eye-icon">👁️</span>
                  </button>
                </div>
              </div>
              <div class="form-group" style="display:flex;align-items:center;gap:0.5rem;">
                <input type="checkbox" id="remember-me" name="remember">
                <label for="remember-me" style="margin:0;font-size:0.9rem;">Remember me for 30 days</label>
              </div>
              <div id="error-message" style="color:#ff6b6b;margin:1rem 0;display:none;"></div>
              <button type="submit" class="btn btn-primary" style="width:100%;">Login</button>
            </form>
          </div>
        </main>
      </div>
    `;

    // Add event listeners
    const form = document.getElementById('login-form');
    const togglePassword = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');
    const usernameInput = document.getElementById('username');

    // Toggle password visibility
    if (togglePassword && passwordInput) {
      togglePassword.addEventListener('click', () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        document.getElementById('eye-icon').textContent = type === 'password' ? '👁️' : '🙈';
      });
    }

    // Handle form submission
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const remember = document.getElementById('remember-me').checked;

        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Logging in...';
        submitBtn.disabled = true;
        errorMessage.style.display = 'none';

        // Attempt login
        const result = await login(username, password, remember);

        if (result.success) {
          // Save last username
          localStorage.setItem('sb-admin-last-user', username);
          
          // Reload to show admin panel
          window.location.reload();
        } else {
          // Show error
          errorMessage.textContent = result.error || 'Login failed. Please check your credentials.';
          errorMessage.style.display = 'block';
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
          passwordInput.value = '';
          passwordInput.focus();
        }
      });
    }
  };

  // Initialize authentication
  const init = () => {
    if (!isAdminPage()) return;

    // Check if already authenticated
    if (isAuthenticated()) {
      const token = getToken();
      
      // Set token for API client
      if (window.api && token) {
        window.api.token = token;
        localStorage.setItem('sb-admin-token', token);
      }
      
      // Expose auth functions globally
      window.sbIsAuthed = () => true;
      window.sbAdminLogout = logout;
      
      // Let the page load normally
      return;
    }

    // Not authenticated - show login page
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showLoginPage);
    } else {
      showLoginPage();
    }
  };

  // Expose necessary functions
  window.sbIsAuthed = isAuthenticated;
  window.sbAdminLogout = logout;
  window.sbAdminLogin = login;

  // Start authentication check
  init();
})();
