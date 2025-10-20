# 📁 Soundbites Quiz - Clean Folder Structure# Soundbites Quiz



## 🚀 Quick Start## Admin login and management



### Live URLs:
- **Quiz**: https://otis.soundbites.com
- **Admin**: https://otis.soundbites.com/admin/

### Local Development:  - Enter a new password (min 6 characters). The username defaults to `admin` unless you type a different username before initializing.

- **Run Quiz**: Double-click `OPEN-QUIZ.bat`  - Your credentials are stored locally (username + SHA-256 hash of `user:password`).

- **Run Admin**: Double-click `OPEN-ADMIN.bat`

- **Start Backend**: Double-click `START-BACKEND.bat`- Login:

  - Enter the username and password you initialized with and click Login.

---  - A successful login stores a session in this browser until you click Logout or close the session.



## 📂 Folder Structure- Change password (Settings tab → Admin Account):

  - Enter your current password, then the new password and confirmation.

```  - On success, you’ll be logged out and prompted to log back in with the new password.

Quiz/

├── index.html                      # Main quiz entry point- Reset credentials:

├── DEPLOYMENT-COMPLETE.md          # Complete deployment guide ⭐  - On the login screen, click "Reset Login" to clear saved credentials for this browser.

├── README.md                       # This file  - This removes the saved hash and session from localStorage/sessionStorage. You will need to Initialize again.

│

├── app/                       # Quiz frontend- Rate limiting:

│   ├── script.js                   # Quiz logic + TikTok tracking  - Five failed login attempts within 5 minutes triggers a 60-second lockout.

│   ├── styles.css                  # TikTok-optimized styles  - The lockout is local to your browser and is recorded in localStorage.

│   ├── api-client.js               # Backend API connection

│   └── [images, fonts, etc.]- Important notes:

│  - This is a client-side guard intended for static deployments. For production environments handling sensitive data, use a real backend with secure authentication and storage.

├── admin/                         # Admin panel (live version)
│   ├── index.html                 # Admin dashboard
│   ├── admin.js                   # Admin logic
│   ├── admin.css                  # Admin styles
│   └── [auth files]
│
├── backend/                        # Backend API- "Too many attempts" message:

│   ├── server.js                   # Express server  - Wait until the timer expires or close/reopen the tab after a minute.

│   ├── routes/                     # API routes
│   ├── middleware/                 # Authentication
│   └── config/                     # Database config
│
├── docs/                           # Documentation
│   ├── guides/                     # Step-by-step guides
│   │   ├── TIKTOK-OPTIMIZATION-GUIDE.md
│   │   ├── TIKTOK-IN-APP-AD-SETUP.md
│   │   ├── ADMIN-PANEL-RENDER-SETUP.md
│   │   └── [more guides...]
│   │
│   └── reference/                  # Technical reference
│       ├── AUTH-IMPLEMENTATION-SUMMARY.md
│       ├── RENDER-DEPLOYMENT.md
│       └── [historical docs...]
│
├── .git/                           # Git repository
├── .vscode/                        # VS Code settings
├── render-static.yaml              # Render deployment config
└── [batch files for quick access]
```

---

## 📚 Key Documentation

### Start Here:
1. **DEPLOYMENT-COMPLETE.md** - Everything about your live deployment

### TikTok Guides:
- `docs/guides/TIKTOK-OPTIMIZATION-GUIDE.md` - Complete TikTok strategy
- `docs/guides/TIKTOK-IN-APP-AD-SETUP.md` - Interactive Add-Ons setup
- `docs/guides/TIKTOK-WORKFLOW-VISUAL.md` - User journey diagrams
- `docs/guides/VISUAL-GUIDE.md` - Before/after comparisons
- `docs/guides/IMPLEMENTATION-CHECKLIST.md` - Deployment checklist

### Admin & Technical:
- `docs/guides/ADMIN-PANEL-RENDER-SETUP.md` - Admin deployment
- `docs/guides/ADMIN-USER-MANAGEMENT.md` - User management
- `docs/guides/DATA-MANAGEMENT-GUIDE.md` - Database operations
- `docs/guides/TESTING-GUIDE.md` - Testing procedures
- `docs/guides/SECURE-AUTH-GUIDE.md` - Authentication setup

### Reference (Historical):
- `docs/reference/` - Implementation notes, debug reports, migration guides

---

## 🎯 What's Deployed & Working

### Frontend (otis.soundbites.com):
✅ TikTok Pixel (ID: `D3QKIABC77U1STIOMN20`)  
✅ 5 Tracking Events (PageView, ViewContent, CompleteRegistration, SubmitForm, ClickButton)  
✅ Mobile Optimizations (48px buttons, 32px sliders, smooth animations)  
✅ TikTok Shop CTA (pulsing black-to-cyan gradient)  
✅ Enhanced Email Form (magenta-to-purple gradient)  
✅ UTM Parameter Tracking  
✅ Loading Spinner  

### Backend (soundbites-quiz-backend.onrender.com):
✅ Express API server  
✅ PostgreSQL database  
✅ JWT authentication  
✅ Auto-deploy on git push  
✅ Daily backups  

### Admin Panel:
✅ 4 Tabs: Questions, Analytics, Marketing, OTIS  
✅ Full CRUD operations  
✅ UTM tracking dashboard  
✅ Lead management  
✅ Real-time analytics  

---

## 🔄 Making Updates

### Update Quiz:
```powershell
# 1. Edit files in app/
# 2. Test locally
OPEN-QUIZ.bat

# 3. Deploy
git add .
git commit -m "Update quiz"
git push origin dashboard-upgrade
```

### Update Admin:
```powershell
# 1. Edit files in admin/
# 2. Test locally
python -m http.server 8000
# 3. Deploy (same as above)
git add .
git commit -m "Update admin"
git push origin dashboard-upgrade
```

### Update Backend:
```powershell
# 1. Edit files in backend/
# 2. Test locally
START-BACKEND.bat

# 3. Deploy
cd backend
git add .
git commit -m "Update backend"
git push
```

---

## 🆘 Common Tasks

### Test TikTok Pixel:
1. Install "TikTok Pixel Helper" Chrome extension
2. Visit: https://otis.soundbites.com
3. Check console (F12) for `[TikTok]` messages
4. Verify events fire in TikTok Events Manager

### Access Admin:
1. Visit: https://otis.soundbites.com/admin/
2. Login with admin credentials
3. Navigate tabs: Questions, Analytics, Marketing, OTIS

### Check Backend Status:
Visit: https://soundbites-quiz-backend.onrender.com/api/health

### View Marketing Data:
1. Login to admin
2. Click **Marketing** tab
3. View UTM sources, conversion rates, lead quality

---

## 🎊 You're All Set!

Everything is organized, deployed, and ready for TikTok!

**Next Steps:**
1. Test TikTok Pixel tracking
2. Share quiz on TikTok bio
3. Launch first ad campaign
4. Monitor conversions in Marketing tab

---

**Questions?** Check `DEPLOYMENT-COMPLETE.md` for comprehensive guide!
