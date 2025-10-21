# Soundbites Quiz - Complete Deployment Guide

## 🎯 Quick Start (5 Minutes)

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database OR SQLite for local testing
- Domain: `app.soundbites.com` configured

### 1. Backend Setup

```bash
cd backend

# Copy and configure environment
cp .env.production.template .env
# Edit .env and fill in DATABASE_URL, JWT_SECRET, FRONTEND_URL

# Install dependencies
npm install

# Initialize database (creates admin account)
npm run init-db

# Start server
npm start
```

**Admin Login:**
- Email: `c.hatfield309@gmail.com`
- Password: `Hearing2025`
- ⚠️ Change password immediately after first login

### 2. Frontend Setup

Frontend is static HTML - just serve from root directory:

```bash
# Option 1: Python
python -m http.server 8080

# Option 2: Node.js
npx http-server -p 8080

# Option 3: Nginx/Apache (production)
# Point document root to /path/to/Quiz/
```

### 3. Verify Deployment

```bash
# Check health
curl http://localhost:3000/health

# Test login
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"c.hatfield309@gmail.com","password":"Hearing2025"}'
```

---

## 📋 Complete Production Checklist

### DNS & SSL
- [ ] Add CNAME: `app.soundbites.com` → your server IP or Render URL
- [ ] Generate SSL certificate (Let's Encrypt, Cloudflare, or Render auto-SSL)
- [ ] Test HTTPS: `https://app.soundbites.com`
- [ ] Set up 308 redirect: `otis.soundbites.com` → `app.soundbites.com`

### Backend Configuration

**Environment Variables (backend/.env):**
```bash
DATABASE_URL=postgresql://...     # Production database
JWT_SECRET=<strong-random-string> # Generate with: openssl rand -base64 32
FRONTEND_URL=https://app.soundbites.com
COOKIE_DOMAIN=.soundbites.com
NODE_ENV=production
```

**Database Initialization:**
```bash
cd backend
npm run init-db
```

**Expected Output:**
```
✅ Admin user created
   Username: c.hatfield309@gmail.com
   Password: Hearing2025
🎉 Database initialized successfully!
```

### TikTok Pixel Setup

#### 1. Get Access Token
1. Go to **TikTok Ads Manager** (ads.tiktok.com)
2. Click **Settings** → **Events** → **Manage Events API**
3. Click **Generate Access Token**
4. Select scopes: `events:write`, `pixel:read`
5. Copy token

#### 2. Configure Backend
Add to `backend/.env`:
```bash
TIKTOK_PIXEL_ID=D3QKIABC77U1STIOMN20
TIKTOK_ACCESS_TOKEN=your_token_here
```

#### 3. Domain Verification
1. TikTok Ads Manager → **Events** → **Web Events**
2. Click your Pixel → **Settings** → **Domain**
3. Add `app.soundbites.com`
4. Choose verification method:
   - **Option A:** Upload HTML file to `/app/` folder
   - **Option B:** Add meta tag to `index.html` (already done via CSP)
5. Click **Verify**

#### 4. Test Events
```bash
# Test server-side Lead event
curl -X POST http://localhost:3000/api/tiktok-events/lead \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "score": 75,
    "recommendation_level": "high-need"
  }'

# Expected response:
# {"success":true,"event":"Lead"}
```

Check **TikTok Events Manager** → **Test Events** to verify events appear.

### Lighthouse CI (GitHub Actions)

Already configured! Just enable GitHub Actions:

1. Go to repo **Settings** → **Actions** → **General**
2. Enable: "Allow all actions and reusable workflows"
3. Push to `main` branch

**Performance Budgets:**
- Performance: ≥95
- Accessibility: ≥95
- LCP: <1.5s
- CLS: <0.02
- Total JS: <170KB

Build **fails automatically** if metrics don't meet targets.

---

## 🔐 Security Hardening

### Rate Limiting
Already configured in `backend/middleware/rate-limit.js`:
- Login: 5 attempts / 15 min
- Verify: 30 requests / min
- General API: 100 requests / min

### Content Security Policy
Already configured in `index.html`:
- Blocks inline scripts (except trusted)
- Restricts connect-src to `/api/*` and analytics
- Prevents iframe embedding

### HTTPS & Cookies
Ensure `backend/.env` has:
```bash
NODE_ENV=production
COOKIE_SECURE=true
COOKIE_SAMESITE=lax
```

### Database Credentials
- Never commit `.env` file
- Use strong passwords (16+ characters, mixed case, symbols)
- Rotate JWT_SECRET periodically
- Use PostgreSQL in production (not SQLite)

---

## 🚀 Deployment Platforms

### Render.com (Recommended)

**Backend (API Service):**
```yaml
# render.yaml
services:
  - type: web
    name: soundbites-backend
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: FRONTEND_URL
        value: https://app.soundbites.com
      - key: TIKTOK_ACCESS_TOKEN
        sync: false
```

**Frontend (Static Site):**
```yaml
  - type: web
    name: soundbites-frontend
    env: static
    buildCommand: echo "No build needed"
    staticPublishPath: .
    routes:
      - type: rewrite
        source: /
        destination: /index.html
      - type: rewrite
        source: /admin
        destination: /admin/index.html
```

### Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy frontend
vercel --prod

# Deploy backend separately (serverless functions)
cd backend && vercel --prod
```

### AWS (Advanced)

- **Frontend:** S3 + CloudFront
- **Backend:** EC2 or ECS
- **Database:** RDS PostgreSQL
- **CDN:** CloudFront for static assets

---

## 📊 Monitoring & Logging

### Health Checks

```bash
# Basic health
curl https://app.soundbites.com/health

# Readiness (Kubernetes)
curl https://app.soundbites.com/health/ready

# Liveness
curl https://app.soundbites.com/health/live

# Metrics
curl https://app.soundbites.com/health/metrics
```

### Logs

**Backend logs** (stdout):
```bash
npm start

# Or with PM2
npm install -g pm2
pm2 start npm --name soundbites-backend -- start
pm2 logs soundbites-backend
```

**Error tracking** (optional - Sentry):
```bash
# Install Sentry SDK
npm install @sentry/node

# Add to backend/server.js
const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

---

## 🧪 Testing

### Local Testing
```bash
# Backend
cd backend
npm test

# Lighthouse audit
npm install -g @lhci/cli
lhci autorun
```

### End-to-End Test
```bash
# Visit https://app.soundbites.com
1. Complete quiz flow
2. Submit email
3. Check TikTok Events Manager for events:
   - PageView
   - StartQuiz
   - QuizStep (×10)
   - CompleteQuiz
   - Lead

# Admin panel
1. Visit /admin → redirects to /admin/login.html
2. Login with credentials
3. View dashboard
4. Logout
5. Hit back button → should NOT re-enter admin
```

---

## 🔧 Troubleshooting

### Admin can't log in
```bash
# Reset database
cd backend
npm run init-db

# Check logs
npm start

# Verify environment
echo $DATABASE_URL
echo $JWT_SECRET
```

### TikTok events not firing
```bash
# Check pixel ID
grep TIKTOK_PIXEL_ID backend/.env

# Check access token
curl https://business-api.tiktok.com/open_api/v1.3/pixel/info/ \
  -H "Access-Token: $TIKTOK_ACCESS_TOKEN"

# Check browser console
# Should see: window.ttq defined
```

### Lighthouse CI failing
```bash
# Run locally
lhci autorun

# Check bundle sizes
du -sh app/*.js app/*.css

# Reduce if needed:
# - Minify JS/CSS
# - Remove unused code
# - Compress images
```

---

## 📞 Support

- **Documentation:** This file
- **Issues:** GitHub Issues
- **Email:** c.hatfield309@gmail.com

---

## 🎉 You're Done!

**Production URLs:**
- Quiz: `https://app.soundbites.com`
- Admin: `https://app.soundbites.com/admin`
- Health: `https://app.soundbites.com/health`

**Next Steps:**
1. Change admin password after first login
2. Monitor Lighthouse CI results
3. Check TikTok Events Manager for conversions
4. Set up alerts for health check failures

**You're now at top 0.01% 🏆**
