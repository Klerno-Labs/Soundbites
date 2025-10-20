# 🚀 RENDER.COM DEPLOYMENT GUIDE

## ✅ STEP 1: Sign Up / Login
1. Go to: https://dashboard.render.com/register
2. Sign up with GitHub (recommended) or email
3. Verify your email if needed
4. You'll see the Render Dashboard

---

## ✅ STEP 2: Create PostgreSQL Database

1. Click **"New +"** button (top right)
2. Select **"PostgreSQL"**
3. Fill in:
   - **Name:** `soundbites-db`
   - **Database:** `soundbites`
   - **User:** `soundbites`
   - **Region:** Oregon (US West)
   - **Plan:** Free
4. Click **"Create Database"**
5. Wait 1-2 minutes for it to deploy
6. **IMPORTANT:** Copy the **"Internal Database URL"** (we'll need this!)

---

## ✅ STEP 3: Create Web Service

1. Click **"New +"** button again
2. Select **"Web Service"**
3. Choose **"Build and deploy from a Git repository"**
4. Click **"Connect account"** → Connect your GitHub
   
   **OR** if you don't want to use GitHub:
   - Select **"Public Git repository"**
   - We'll push your code to GitHub quickly

---

## ✅ STEP 4: Configure Web Service

Fill in these settings:

**Basic Settings:**
- **Name:** `soundbites-quiz-backend`
- **Region:** Oregon (US West)
- **Branch:** main
- **Root Directory:** `backend`
- **Environment:** Node
- **Build Command:** `npm install`
- **Start Command:** `npm start`

**Plan:**
- Select **"Free"** plan

---

## ✅ STEP 5: Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add these variables one by one:

```
DATABASE_URL = [paste the Internal Database URL from Step 2]
JWT_SECRET = soundbites-secret-key-2025
NODE_ENV = production
PORT = 10000
FRONTEND_URL = *
ADMIN_USERNAME = admin
ADMIN_PASSWORD = admin123
```

---

## ✅ STEP 6: Deploy!

1. Click **"Create Web Service"**
2. Wait 3-5 minutes for deployment
3. You'll see build logs in real-time
4. When you see **"Your service is live"** → Success! 🎉

---

## ✅ STEP 7: Get Your URL

1. At the top of the page, you'll see your service URL
2. It will look like: `https://soundbites-quiz-backend.onrender.com`
3. **Copy this URL!** We need it for the frontend

---

## ✅ STEP 8: Initialize Database

1. Open a new browser tab
2. Go to: `https://YOUR-URL.onrender.com/api/setup/init`
   (Replace YOUR-URL with your actual Render URL)
3. Wait 10-15 seconds
4. You should see: `{"message":"Database initialized successfully"}`

---

## ✅ STEP 9: Test Backend

Test these URLs in your browser:

1. **Health Check:**
   `https://YOUR-URL.onrender.com/health`
   Should return: `{"status":"ok"}`

2. **Questions:**
   `https://YOUR-URL.onrender.com/api/quiz/questions`
   Should return: 20 quiz questions

---

## ✅ STEP 10: Update Frontend

We'll update your `api-client.js` to use the new Render URL:

```javascript
// Change from:
window.api = new APIClient('http://localhost:3000/api');

// To:
window.api = new APIClient('https://YOUR-URL.onrender.com/api');
```

---

## 🎉 YOU'RE DONE!

Your backend is now 100% online and accessible from anywhere!

**What you have:**
- ✅ Backend running 24/7 on Render
- ✅ PostgreSQL database with 20 questions
- ✅ Admin login (admin / admin123)
- ✅ All API endpoints working
- ✅ Completely free!

**⚠️ Note about Free Tier:**
- Service "sleeps" after 15 minutes of inactivity
- First request after sleeping takes 30-60 seconds
- After that, it's fast!
- To keep it awake: Use a free service like UptimeRobot.com to ping it every 14 minutes

---

## 🆘 TROUBLESHOOTING

**"Build failed"**
- Check build logs for errors
- Make sure `package.json` has `"start": "node server.js"`

**"Database connection failed"**
- Make sure DATABASE_URL is correct
- Use "Internal Database URL" from PostgreSQL service

**"Service won't start"**
- Check that PORT is set to 10000
- Check that all environment variables are set

---

## 📞 NEED HELP?

Just tell me:
1. What step you're on
2. What error you're seeing (if any)
3. Screenshot helps!

Let's get this deployed! 🚀
