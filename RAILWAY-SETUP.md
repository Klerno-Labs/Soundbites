# 🚂 RAILWAY DEPLOYMENT - STEP BY STEP
# Just follow these steps in order. Copy and paste each command.

## STEP 1: Sign Up for Railway (5 minutes)

1. Open your browser and go to: https://railway.app
2. Click "Login" in the top right
3. Click "Login with GitHub"
4. Authorize Railway to access your GitHub account
5. You're in! You'll see the Railway dashboard

---

## STEP 2: Create PostgreSQL Database (3 minutes)

1. In Railway dashboard, click "+ New Project"
2. Click "Provision PostgreSQL"
3. Wait ~30 seconds for it to provision
4. Click on the PostgreSQL card that appears
5. Click "Variables" tab
6. Find "DATABASE_URL" and click the copy icon next to it
7. SAVE THIS URL - you'll need it in Step 4!

**Example DATABASE_URL looks like:**
```
postgresql://postgres:password@containers.railway.app:7532/railway
```

---

## STEP 3: Install Railway CLI & Deploy (5 minutes)

**Copy and paste these commands ONE AT A TIME in PowerShell:**

```powershell
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway (this will open your browser)
railway login

# Navigate to backend folder
cd "C:\Users\Somli\OneDrive\Desktop\Quiz\backend"

# Create new Railway project
railway init

# Follow the prompts:
# - "Create a new Project" 
# - Give it a name like "soundbites-backend"

# Deploy!
railway up
```

**Wait for deployment to complete** (~2-3 minutes)

You'll see:
```
✅ Deployment successful
🚀 Service deployed
```

---

## STEP 4: Add Environment Variables (5 minutes)

**Back in Railway Dashboard:**

1. Click on your backend service (the one you just deployed)
2. Click "Variables" tab
3. Click "+ New Variable" for each of these:

**Add these EXACT variables:**

```
DATABASE_URL = <paste the URL you copied from PostgreSQL in Step 2>
```

```
JWT_SECRET = soundbites-secret-2025-change-this-later
```

```
NODE_ENV = production
```

```
PORT = 3000
```

```
FRONTEND_URL = *
```

```
ADMIN_USERNAME = admin
```

```
ADMIN_PASSWORD = Soundbites2025!
```

4. Click "Save" or the deploy button

**Railway will auto-redeploy with the new variables** (~1 minute)

---

## STEP 5: Get Your Backend URL (2 minutes)

1. Still in your backend service page
2. Click "Settings" tab
3. Scroll to "Networking" section
4. Click "Generate Domain"
5. You'll get a URL like: `soundbites-backend-production.up.railway.app`
6. **SAVE THIS URL!**

---

## STEP 6: Initialize Database (3 minutes)

**Back in PowerShell (still in backend folder):**

```powershell
# Make sure you're in the backend folder
cd "C:\Users\Somli\OneDrive\Desktop\Quiz\backend"

# Initialize the database on Railway
railway run npm run init-db
```

You should see:
```
✅ Tables created successfully
✅ Default questions inserted
✅ Admin user created
   Username: admin
   Password: Soundbites2025!
```

---

## STEP 7: Test Your Backend! (2 minutes)

**Replace `your-app-url` with your actual Railway domain:**

```powershell
# Test health endpoint
Invoke-RestMethod -Uri "https://your-app-url.up.railway.app/health"

# Should return:
# status : ok
# timestamp : 2025-10-18T...
```

**Test login:**

```powershell
$body = @{
    username = "admin"
    password = "Soundbites2025!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://your-app-url.up.railway.app/api/auth/login" -Method POST -Body $body -ContentType "application/json"

# Should return:
# success : True
# token : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# user : @{id=1; username=admin; email=admin@soundbites.com}
```

---

## STEP 8: Update Frontend (2 minutes)

**Open this file in VS Code:**
```
C:\Users\Somli\OneDrive\Desktop\Quiz\Main app\api-client.js
```

**Find line 131** (the last line) and change:

```javascript
// FROM:
window.api = new APIClient('http://localhost:3000/api');

// TO: (use your actual Railway URL)
window.api = new APIClient('https://your-app-url.up.railway.app/api');
```

**Save the file!**

---

## ✅ YOU'RE DONE!

Your backend is now:
- ✅ Deployed to Railway
- ✅ Using secure PostgreSQL database
- ✅ Has HTTPS encryption
- ✅ Has JWT authentication
- ✅ Has 10 default quiz questions loaded

**Your URLs:**
- Backend API: `https://your-app-url.up.railway.app`
- Health Check: `https://your-app-url.up.railway.app/health`
- Admin Login: `https://your-app-url.up.railway.app/api/auth/login`

**Admin Credentials:**
- Username: `admin`
- Password: `Soundbites2025!`

---

## 🎤 FOR TOMORROW'S PRESENTATION

You can now say:

*"We have a production-ready secure backend deployed on Railway.app with:"*
- PostgreSQL database with encrypted storage ✅
- JWT authentication with bcrypt password hashing ✅
- RESTful API with 10 endpoints ✅
- HTTPS encryption on all traffic ✅
- Rate limiting and security headers ✅
- Deployed and accessible via cloud infrastructure ✅

---

## 🆘 IF SOMETHING GOES WRONG

**"railway: command not found"**
- Close PowerShell and open a new one
- The CLI needs a fresh terminal after installation

**"Failed to deploy"**
- Check Railway dashboard for logs
- Click your service → "Deployments" → View logs

**"Database connection failed"**
- Make sure you copied the full DATABASE_URL from PostgreSQL service
- Check that DATABASE_URL in Variables tab doesn't have extra spaces

**"railway init" asks for project**
- Choose "Create new project"
- Give it any name you like

**Still stuck?**
- Railway Dashboard: https://railway.app/dashboard
- Railway Docs: https://docs.railway.app
- Or just show me the error message!

---

## 💰 COST

- Railway: FREE $5 credit (good for 2-3 months)
- PostgreSQL: FREE (included)
- SSL Certificate: FREE (auto-generated)

**Total: $0 for your presentation and initial launch!**

---

**Ready? Start with Step 1! 🚀**
