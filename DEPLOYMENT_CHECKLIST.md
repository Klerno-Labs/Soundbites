# DEPLOYMENT CHECKLIST

## Pre-Deployment Checks

### Code Quality
- [ ] All tests passing (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Code formatted (`npm run format`)
- [ ] No console.errors in production code
- [ ] All TODOs resolved or documented

### Environment Variables
- [ ] `DATABASE_URL` set in Render dashboard
- [ ] `JWT_SECRET` generated (use `generateValue: true`)
- [ ] `ADMIN_EMAIL` set with valid email
- [ ] `ADMIN_PASSWORD` set with strong password (min 16 chars)
- [ ] `FRONTEND_URL` set to `https://otis.soundbites.com`
- [ ] `NODE_ENV` set to `production`

### Database
- [ ] Database migrations applied (if any)
- [ ] Database backup created
- [ ] Test data removed from production DB
- [ ] Admin user created with strong password

### Security
- [ ] No hardcoded secrets in code
- [ ] CORS configured for production domain only
- [ ] Rate limiting enabled
- [ ] Helmet security headers active
- [ ] HTTPS enforced

---

## Deployment Steps

### 1. Backend Deployment (Render)

```bash
# Ensure render.yaml is in root
git add render.yaml
git commit -m "deploy: Update deployment configuration"
git push origin main
```

1. Go to https://dashboard.render.com/
2. Select `soundbites-quiz-backend` service
3. Click "Manual Deploy" → "Deploy latest commit"
4. Wait 2-3 minutes for build to complete

### 2. Set Environment Variables

In Render dashboard → Backend service → Environment:

```
ADMIN_EMAIL=your-email@example.com
ADMIN_PASSWORD=your-secure-password-here
DATABASE_URL=(auto-populated from database)
FRONTEND_URL=https://otis.soundbites.com
JWT_SECRET=(use generateValue: true)
NODE_ENV=production
PORT=10000
```

### 3. Run Database Initialization

After first deploy:
1. Open Shell in Render dashboard
2. Run: `npm run init-db-postgres`
3. Verify admin user created

### 4. Frontend Deployment (Static Site)

Render auto-deploys from main branch.
Verify at: https://otis.soundbites.com

---

## Post-Deployment Verification

### Backend Health Check
```bash
curl https://soundbites-quiz-backend.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-21T...",
  "uptime": 123,
  "database": "connected"
}
```

### Frontend Check
- [ ] Visit https://otis.soundbites.com
- [ ] Quiz loads without errors
- [ ] Can submit quiz and see results
- [ ] No console errors in browser DevTools

### Admin Login Test
1. Go to https://otis.soundbites.com/admin/login.html
2. Enter ADMIN_EMAIL and ADMIN_PASSWORD
3. Should redirect to admin dashboard
4. Verify analytics load

### CORS Verification
```bash
curl -v -X POST https://soundbites-quiz-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://otis.soundbites.com" \
  -d '{"email":"test@example.com","password":"test123"}' \
  2>&1 | grep "Access-Control"
```

Should see:
```
< Access-Control-Allow-Origin: https://otis.soundbites.com
< Access-Control-Allow-Credentials: true
```

---

## Rollback Procedure

### If Deployment Fails:

1. **Check Render Logs**
   - Dashboard → Service → Logs tab
   - Look for error messages

2. **Rollback to Previous Version**
   ```bash
   # Find last good commit
   git log --oneline -5

   # Revert to previous commit
   git revert <commit-hash>
   git push origin main
   ```

3. **Restore Database (if needed)**
   ```bash
   node scripts/restore-db.js backups/latest-backup.sql
   ```

---

## Monitoring

### Daily Checks
- [ ] Backend health endpoint returns 200
- [ ] No 500 errors in logs
- [ ] Database connections stable

### Weekly Checks
- [ ] Review error logs (`backend/logs/error.log`)
- [ ] Check disk space on Render
- [ ] Verify backups are being created

### Monthly Checks
- [ ] Update dependencies (`npm outdated`)
- [ ] Review security vulnerabilities (`npm audit`)
- [ ] Rotate JWT_SECRET (optional, forces all users to re-login)

---

## Troubleshooting

### "Failed to fetch" Error
- Check CORS headers in backend response
- Verify FRONTEND_URL matches actual frontend domain
- Check browser console for specific error

### Database Connection Issues
- Verify DATABASE_URL is set correctly
- Check Render database status
- Review connection limits

### 500 Errors
- Check `backend/logs/error.log`
- Review recent code changes
- Verify all environment variables are set

---

## Emergency Contacts

- **Render Support**: https://render.com/docs
- **GitHub Issues**: https://github.com/Klerno-Labs/Soundbites/issues

---

*Last Updated: 2025-10-21*
