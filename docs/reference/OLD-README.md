# Soundbites Quiz

## Admin login and management

The Admin panel lives at `Admin App/Soundbites Admin/admin.html` and is protected by a lightweight client-side login suitable for static hosting.

- First use (initialize):
  - Open the admin page. If no credentials are set in this browser, click "Initialize Admin".
  - Enter a new password (min 6 characters). The username defaults to `admin` unless you type a different username before initializing.
  - Your credentials are stored locally (username + SHA-256 hash of `user:password`).

- Login:
  - Enter the username and password you initialized with and click Login.
  - A successful login stores a session in this browser until you click Logout or close the session.

- Change password (Settings tab → Admin Account):
  - Enter your current password, then the new password and confirmation.
  - On success, you’ll be logged out and prompted to log back in with the new password.

- Reset credentials:
  - On the login screen, click "Reset Login" to clear saved credentials for this browser.
  - This removes the saved hash and session from localStorage/sessionStorage. You will need to Initialize again.

- Rate limiting:
  - Five failed login attempts within 5 minutes triggers a 60-second lockout.
  - The lockout is local to your browser and is recorded in localStorage.

- Important notes:
  - This is a client-side guard intended for static deployments. For production environments handling sensitive data, use a real backend with secure authentication and storage.

## Troubleshooting

- I don’t see "Initialize Admin":
  - It’s hidden after credentials exist. Click "Reset Login" to clear and re-initialize if needed.
- I forgot the password:
  - Use "Reset Login" to clear credentials, then initialize a new password. This only affects the current browser.
- "Too many attempts" message:
  - Wait until the timer expires or close/reopen the tab after a minute.
