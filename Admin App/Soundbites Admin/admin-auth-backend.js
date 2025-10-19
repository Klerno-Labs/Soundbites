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
  const login = async (email, password, remember = false) => {
    try {
      const response = await fetch('https://soundbites-quiz-backend.onrender.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
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
      <style>
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .login-container {
          animation: fadeIn 0.5s ease-out;
        }
        .login-box {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04);
          padding: 2rem;
          max-width: 420px;
          margin: 2rem auto;
        }
        .form-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }
        .form-input:focus {
          outline: none;
          border-color: #C92A76;
          box-shadow: 0 0 0 3px rgba(201, 42, 118, 0.1);
        }
        .form-input:hover {
          border-color: #b0b0b0;
        }
        .btn-primary:hover:not(:disabled) {
          background: #b02466;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(201, 42, 118, 0.3);
        }
        .btn-primary:active:not(:disabled) {
          transform: translateY(0);
        }
        .btn-primary {
          transition: all 0.2s ease;
        }
        .forgot-password {
          text-align: center;
          margin-top: 1rem;
        }
        .forgot-password a {
          color: #C92A76;
          text-decoration: none;
          font-size: 0.875rem;
          transition: opacity 0.2s ease;
        }
        .forgot-password a:hover {
          opacity: 0.8;
          text-decoration: underline;
        }
        .login-footer {
          text-align: center;
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e0e0e0;
          color: #666;
          font-size: 0.8rem;
        }
      </style>
      <div class="container login-container" role="application">
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
          <div class="login-box">
            <form id="login-form">
              <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" class="form-input" value="${lastUsername}" required autocomplete="email" autofocus>
              </div>
              <div class="form-group">
                <label for="password">Password</label>
                <div style="position:relative;">
                  <input type="password" id="password" name="password" class="form-input" style="padding-right:40px;" required autocomplete="current-password">
                  <button type="button" id="toggle-password" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;padding:5px;" aria-label="Toggle password visibility">
                    <span id="eye-icon">👁️</span>
                  </button>
                </div>
              </div>
              <div class="form-group" style="display:flex;align-items:center;gap:0.25rem;margin-top:0.75rem;">
                <input type="checkbox" id="remember-me" name="remember" style="width:14px;height:14px;margin:0;">
                <label for="remember-me" style="margin:0;font-size:0.7rem;">Keep me logged in</label>
              </div>
              <div id="error-message" style="display:none;background:#fff5f5;border:1px solid #ff6b6b;border-radius:8px;padding:0.75rem 1rem;margin:1rem 0;color:#c92a2a;">
                <div style="display:flex;align-items:center;gap:0.5rem;">
                  <span style="font-size:1.2rem;">⚠️</span>
                  <span id="error-text"></span>
                </div>
              </div>
              <button type="submit" class="btn btn-primary" id="login-btn" style="width:100%;position:relative;margin-top:1.5rem;">
                <span id="login-text">Login</span>
                <span id="login-spinner" style="display:none;">
                  <span style="display:inline-block;width:14px;height:14px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:spin 0.6s linear infinite;"></span>
                  <span style="margin-left:0.5rem;">Logging in...</span>
                </span>
              </button>
            </form>
            <div class="forgot-password">
              <a href="#" id="forgot-password-link">Forgot password?</a>
            </div>
            <div class="login-footer">
              © ${new Date().getFullYear()} Soundbites. All rights reserved.
            </div>
          </div>
        </main>
      </div>
    `;

    // Add event listeners
    const form = document.getElementById('login-form');
    const togglePassword = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    const emailInput = document.getElementById('email');
    const loginBtn = document.getElementById('login-btn');
    const loginText = document.getElementById('login-text');
    const loginSpinner = document.getElementById('login-spinner');
    const forgotPasswordLink = document.getElementById('forgot-password-link');

    // Handle forgot password
    if (forgotPasswordLink) {
      forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        errorText.textContent = 'Please contact your administrator to reset your password.';
        errorMessage.style.display = 'block';
        errorMessage.style.background = '#e7f5ff';
        errorMessage.style.borderColor = '#339af0';
        errorMessage.style.color = '#1971c2';
        errorMessage.querySelector('span:first-child').textContent = 'ℹ️';
      });
    }

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
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const remember = document.getElementById('remember-me').checked;

        // Show loading state
        loginText.style.display = 'none';
        loginSpinner.style.display = 'inline-block';
        loginBtn.disabled = true;
        emailInput.disabled = true;
        passwordInput.disabled = true;
        errorMessage.style.display = 'none';

        // Attempt login
        const result = await login(email, password, remember);

        if (result.success) {
          // Save last email
          localStorage.setItem('sb-admin-last-user', email);
          
          // Reload to show admin panel
          window.location.reload();
        } else {
          // Show error with animation
          errorText.textContent = result.error || 'Login failed. Please check your credentials.';
          errorMessage.style.display = 'block';
          
          // Reset form
          loginText.style.display = 'inline-block';
          loginSpinner.style.display = 'none';
          loginBtn.disabled = false;
          emailInput.disabled = false;
          passwordInput.disabled = false;
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
