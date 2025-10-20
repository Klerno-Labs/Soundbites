# Secure Backend Authentication System

## Overview
The admin panel now uses **secure backend authentication** with JWT tokens instead of client-side credential storage. This provides industry-standard security for your admin panel.

## Features ✨

### 1. **Backend Validation**
- All login attempts are validated against your PostgreSQL database
- Passwords are stored as bcrypt hashes (never in plain text)
- JWT tokens expire automatically for security

### 2. **Remember Me Functionality**
- Users can choose to stay logged in for 30 days
- Token is stored securely and validated on each page load
- Unchecking "Remember me" keeps session only until browser closes

### 3. **Token Expiration**
- Tokens automatically expire based on backend configuration
- Invalid/expired tokens trigger automatic logout
- No manual session cleanup needed

### 4. **Password Visibility Toggle**
- Eye icon to show/hide password while typing
- Improves usability without compromising security

### 5. **User-Friendly Error Messages**
- Clear feedback for incorrect credentials
- Network error handling
- Loading states during authentication

## How It Works 🔐

### Login Flow:
1. User enters username and password on login page
2. Credentials are sent to backend API (`/api/auth/login`)
3. Backend validates against database
4. If valid, backend returns JWT token
5. Token is stored in sessionStorage (temporary) or localStorage (remember me)
6. All subsequent API requests include this token in headers
7. Token is validated on each request

### Session Persistence:
- **Remember Me Checked**: Token stored in localStorage, persists across browser sessions
- **Remember Me Unchecked**: Token stored in sessionStorage only, cleared when browser closes

### Logout Flow:
1. User clicks logout button
2. Token removed from storage
3. Page reloads to show login screen

## Default Admin Credentials 👤

**Username:** `admin`  
**Password:** `admin123`

⚠️ **IMPORTANT**: Change these credentials in production! Use the backend to create a new admin user with a strong password.

## File Structure 📁

```
admin/
├── admin.html              # Updated to use admin-auth-backend.js
├── admin-auth-backend.js   # New secure authentication system
├── admin-auth.js           # Old system (can be removed)
├── admin.js                # Admin panel logic
└── admin.css               # Styles
```

## API Integration 🔌

The authentication system automatically:
- Sets the token in the global `api` client (from api-client.js)
- Includes the token in all authenticated requests
- Handles token refresh/expiration

### Example authenticated request:
```javascript
// The token is automatically included
const questions = await api.getQuestions();
```

## Security Features 🛡️

1. **JWT Tokens**: Industry-standard JSON Web Tokens
2. **Bcrypt Hashing**: Passwords hashed with bcrypt (10 rounds)
3. **Token Expiration**: Automatic expiration prevents stale sessions
4. **HTTPS Required**: Backend uses HTTPS (Render deployment)
5. **No Client-Side Password Storage**: Passwords never stored in browser
6. **Token Validation**: Each request validates token server-side

## Testing the Login ✅

### Test locally:
1. Open `admin.html` in browser
2. You'll see the login page
3. Enter credentials: `admin` / `admin123`
4. Check/uncheck "Remember me" as needed
5. Click "Login"

### Test remember me:
1. Log in with "Remember me" checked
2. Close browser completely
3. Reopen browser and navigate to admin page
4. You should be automatically logged in

### Test session-only:
1. Log in WITHOUT "Remember me" checked
2. Close browser completely
3. Reopen browser and navigate to admin page
4. You should see the login page (session expired)

## Troubleshooting 🔧

### "Login failed" error:
- Check backend is running at https://soundbites-quiz-backend.onrender.com
- Verify credentials are correct
- Check browser console for detailed errors

### Automatically logged out:
- Token may have expired (check backend token expiration setting)
- Clear browser storage and try again
- Verify backend is accessible

### "Remember me" not working:
- Check if browser allows localStorage
- Try in normal mode (not incognito/private)
- Check for browser extensions blocking storage

## Next Steps 🚀

### For Production:
1. **Change default credentials** in database
2. **Set strong password** for admin user
3. **Configure token expiration** in backend (default: 24h)
4. **Enable HTTPS** everywhere (already done via Render)
5. **Monitor login attempts** via analytics

### Optional Enhancements:
- Add password reset functionality
- Add multi-factor authentication (2FA)
- Add role-based access control (multiple admin levels)
- Add login attempt rate limiting
- Add email notifications for logins

## Migration from Old System ✨

The new system completely replaces the old client-side authentication. The old `admin-auth.js` file is no longer used and can be safely deleted.

**What changed:**
- ❌ Old: Credentials stored in localStorage (insecure)
- ✅ New: JWT tokens from backend validation (secure)
- ❌ Old: SHA-256 client-side hashing (bypassable)
- ✅ New: Bcrypt server-side hashing (industry standard)
- ❌ Old: Recovery codes in localStorage
- ✅ New: Proper password reset flow (coming soon)

## Support 💬

If you need to:
- Change admin password
- Add new admin users
- Customize token expiration
- Enable additional security features

Please modify the backend configuration in `backend/server.js` and `backend/routes/auth.js`.

---

**Version:** 2.0  
**Last Updated:** December 2024  
**Status:** ✅ Production Ready
